// État du joueur : progression, sauvegarde dans des cookies d'un jour,
// code d'expédition unique (Supabase) et synchronisation avec le serveur.
//
// Où sont rangées les informations ?
//   - Cookies « gb_e0 », « gb_e1 »… (durée de vie : 1 jour) : la progression compacte
//     (missions, étoiles, badges, réglages, jeton de session).
//   - sessionStorage (onglet en cours) : les brouillons (code tapé, lignes rangées…).
//   - Supabase (si configuré) : tout, y compris les brouillons, pour reprendre ailleurs
//     avec le code d'expédition.
//   - Si les cookies sont impossibles (page ouverte en file://), on utilise le localStorage
//     avec la même durée de vie d'un jour.
window.BNL = window.BNL || {};

BNL.Store = (() => {
  const cfg = window.BNL_CONFIG || {};
  const urlServeur = (cfg.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const cle = (cfg.SUPABASE_KEY || "").trim();
  const serveurConfigure = !!(urlServeur && cle);
  const toutOuvert = !!cfg.TOUT_DEBLOQUER || /[?&]toutouvert\b/.test(location.search);
  const DUREE_S = 86400; // un jour

  const MISSIONS = [...BNL.MISSIONS_PRINCIPALES, ...BNL.MISSIONS_BONUS];
  const PAR_ID = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));
  const PRINCIPALES = BNL.MISSIONS_PRINCIPALES.map((m) => m.id);
  const BONUS = BNL.MISSIONS_BONUS.map((m) => m.id);

  // ---------------------------------------------------------------------------
  //  Cookies d'un jour (ou localStorage avec date limite, en secours)
  // ---------------------------------------------------------------------------
  const Cookies = (() => {
    const chemin = location.pathname.replace(/[^/]*$/, "") || "/";
    const securise = location.protocol === "https:" ? "; Secure" : "";
    function ecrire(nom, valeur, duree = DUREE_S) {
      document.cookie = `${nom}=${valeur}; Max-Age=${duree}; Path=${chemin}; SameSite=Lax${securise}`;
    }
    function lire(nom) {
      const m = document.cookie.match(new RegExp("(?:^|; )" + nom + "=([^;]*)"));
      return m ? m[1] : null;
    }
    const effacer = (nom) => ecrire(nom, "", 0);
    let actifs = false;
    try {
      ecrire("gb_test", "1", 60);
      actifs = lire("gb_test") === "1";
      effacer("gb_test");
    } catch (e) { actifs = false; }
    return { ecrire, lire, effacer, actifs };
  })();

  function versBase64(texte) {
    const octets = new TextEncoder().encode(texte);
    let bin = "";
    octets.forEach((o) => { bin += String.fromCharCode(o); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function depuisBase64(b64) {
    const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }

  const TAILLE_MORCEAU = 3600;
  const PREFIXE = "gb_e";
  const CLE_SECOURS = "gb.etat.secours";

  function ecrireStockage(objet) {
    const texte = versBase64(JSON.stringify(objet));
    if (Cookies.actifs) {
      const morceaux = texte.match(new RegExp(`.{1,${TAILLE_MORCEAU}}`, "g")) || [""];
      morceaux.forEach((mo, i) => Cookies.ecrire(PREFIXE + i, mo));
      for (let i = morceaux.length; i < 6; i++) if (Cookies.lire(PREFIXE + i) !== null) Cookies.effacer(PREFIXE + i);
      return;
    }
    try { localStorage.setItem(CLE_SECOURS, JSON.stringify({ expire: Date.now() + DUREE_S * 1000, texte })); } catch (e) { /* rien */ }
  }

  function lireStockage() {
    let texte = "";
    if (Cookies.actifs) {
      for (let i = 0; i < 6; i++) {
        const mo = Cookies.lire(PREFIXE + i);
        if (mo === null) break;
        texte += mo;
      }
    } else {
      try {
        const brut = JSON.parse(localStorage.getItem(CLE_SECOURS) || "null");
        if (brut && brut.expire > Date.now()) texte = brut.texte;
        else localStorage.removeItem(CLE_SECOURS);
      } catch (e) { texte = ""; }
    }
    if (!texte) return null;
    try { return JSON.parse(depuisBase64(texte)); } catch (e) { return null; }
  }

  function effacerStockage() {
    if (Cookies.actifs) for (let i = 0; i < 6; i++) Cookies.effacer(PREFIXE + i);
    try { localStorage.removeItem(CLE_SECOURS); } catch (e) { /* rien */ }
    try { sessionStorage.removeItem(CLE_BROUILLONS); } catch (e) { /* rien */ }
  }

  // ---------------------------------------------------------------------------
  //  L'état en mémoire et sa forme compacte (pour les cookies)
  // ---------------------------------------------------------------------------
  const nouvelEtat = () => ({
    version: 2,
    joueur: null,
    missions: {},
    badges: {},
    stats: { memo: 0, bacasable: 0, lancers: 0 },
    vus: {},
    courante: PRINCIPALES[0],
    avatar: "crabe",
    theme: "lagon",
    taillePolice: 16,
    lectureAuto: false,
  });

  const STATUTS = ["nouvelle", "en_cours", "reussie"];
  // vu : 1 = scène vue, 2 = briefing lu, 4 = plan fait ; planEtape : progression dans le plan
  const CHAMPS = ["etoiles", "essais", "indices", "temps", "etape", "erreurs", "reveles", "indicesCmd", "vu", "planEtape"];

  function compacter(e) {
    const missions = {};
    for (const [id, s] of Object.entries(e.missions)) {
      if (!PAR_ID[id] || s.statut === "nouvelle") continue;
      const t = [STATUTS.indexOf(s.statut), s.solution ? 1 : 0, ...CHAMPS.map((c) => Math.round(s[c] || 0))];
      while (t.length > 2 && t[t.length - 1] === 0) t.pop();
      missions[id] = t;
    }
    const j = e.joueur;
    return {
      v: 2,
      j: j ? { p: j.pseudo, i: j.eleveId || null, t: j.jeton || null, c: j.classeNom || null, h: j.horsLigne ? 1 : 0 } : null,
      m: missions,
      b: Object.keys(e.badges),
      s: [e.stats.memo || 0, e.stats.bacasable || 0, e.stats.lancers || 0],
      u: Object.keys(e.vus).filter((k) => e.vus[k] === true),
      k: e.courante, a: e.avatar, th: e.theme, f: e.taillePolice, la: e.lectureAuto ? 1 : 0,
    };
  }

  function decompacter(c) {
    const e = nouvelEtat();
    if (!c || c.v !== 2) return null;
    if (c.j) e.joueur = { pseudo: c.j.p, eleveId: c.j.i, jeton: c.j.t, classeNom: c.j.c, horsLigne: !!c.j.h };
    for (const [id, t] of Object.entries(c.m || {})) {
      if (!PAR_ID[id]) continue;
      const s = { statut: STATUTS[t[0]] || "en_cours", solution: !!t[1] };
      CHAMPS.forEach((ch, k) => { s[ch] = t[k + 2] || 0; });
      e.missions[id] = s;
    }
    (c.b || []).forEach((b) => { e.badges[b] = 1; });
    e.stats = { memo: (c.s || [])[0] || 0, bacasable: (c.s || [])[1] || 0, lancers: (c.s || [])[2] || 0 };
    (c.u || []).forEach((k) => { e.vus[k] = true; });
    if (c.k && PAR_ID[c.k]) e.courante = c.k;
    if (c.a) e.avatar = c.a;
    if (c.th) e.theme = c.th;
    if (c.f) e.taillePolice = c.f;
    e.lectureAuto = !!c.la;
    return e;
  }

  // Les brouillons : dans l'onglet (sessionStorage) et sur le serveur.
  const CLE_BROUILLONS = "gb.brouillons";
  let brouillons = {};
  try { brouillons = JSON.parse(sessionStorage.getItem(CLE_BROUILLONS) || "{}") || {}; } catch (e) { brouillons = {}; }
  const ecrireBrouillons = BNL.U.retarder(() => {
    try { sessionStorage.setItem(CLE_BROUILLONS, JSON.stringify(brouillons)); } catch (e) { /* plein */ }
  }, 400);

  let etat = decompacter(lireStockage()) || nouvelEtat();
  // Les brouillons d'un autre joueur (ordinateur partagé) ne doivent pas apparaître.
  if (!etat.joueur || brouillons._pour !== (etat.joueur.eleveId || etat.joueur.pseudo)) brouillons = {};

  const abonnes = [];
  let fileEvenements = [];
  let statutSync = serveurConfigure ? "inconnu" : "local";
  const abonnesSync = [];
  let sauvegardeEnAttente = false;

  function changerSync(s) {
    statutSync = s;
    abonnesSync.forEach((f) => f(s));
  }

  // ---------------------------------------------------------------------------
  //  Appels à Supabase (fonctions RPC)
  // ---------------------------------------------------------------------------
  class ErreurServeur extends Error {
    constructor(message, statut) { super(message); this.statut = statut; }
  }

  function entetes() {
    const h = { "Content-Type": "application/json", apikey: cle };
    if (cle.startsWith("eyJ")) h.Authorization = "Bearer " + cle; // ancienne clé « anon » (JWT)
    return h;
  }

  async function rpc(fonction, args) {
    if (!serveurConfigure) throw new ErreurServeur("Serveur non configuré", 0);
    let reponse;
    try {
      reponse = await fetch(urlServeur + "/rest/v1/rpc/" + fonction, { method: "POST", headers: entetes(), body: JSON.stringify(args || {}) });
    } catch (e) {
      throw new ErreurServeur("Impossible de joindre le serveur : vérifie la connexion internet.", 0);
    }
    const texte = await reponse.text();
    let donnees = null;
    try { donnees = texte ? JSON.parse(texte) : null; } catch (e) { donnees = texte; }
    if (!reponse.ok) {
      let message = (donnees && (donnees.message || donnees.msg || donnees.error)) || ("Erreur du serveur (" + reponse.status + ")");
      if (reponse.status === 404 && /function|schema cache/i.test(message)) message = "La base de données n'est pas installée : le professeur doit lancer supabase/schema.sql.";
      if (reponse.status === 401) message = "Clé Supabase refusée : vérifie SUPABASE_KEY dans js/config.js.";
      throw new ErreurServeur(message, reponse.status);
    }
    return donnees;
  }

  // ---------------------------------------------------------------------------
  //  Missions : accès, verrous, calculs
  // ---------------------------------------------------------------------------
  function m(id) {
    if (!etat.missions[id]) etat.missions[id] = { statut: "nouvelle", essais: 0, indices: 0, solution: false, temps: 0 };
    return etat.missions[id];
  }
  const reussie = (id) => !!(etat.missions[id] && etat.missions[id].statut === "reussie");
  const chapitreDe = (id) => PAR_ID[id] && PAR_ID[id].chap;

  function debloquee(id) {
    if (toutOuvert) return true;
    const mission = PAR_ID[id];
    if (!mission) return false;
    if (reussie(id)) return true;
    const i = PRINCIPALES.indexOf(id);
    if (i === 0) return true;
    if (i > 0) return reussie(PRINCIPALES[i - 1]);
    if (!reussie(PRINCIPALES[PRINCIPALES.length - 1])) return false;
    const duChap = BONUS.filter((b) => PAR_ID[b].chap === mission.chap);
    const j = duChap.indexOf(id);
    return j === 0 || reussie(duChap[j - 1]);
  }

  const coefEtoiles = (e) => (e >= 3 ? 1 : e === 2 ? 0.7 : 0.4);
  function xpMission(id) {
    const s = etat.missions[id];
    if (!s || s.statut !== "reussie") return 0;
    return Math.round((PAR_ID[id] ? PAR_ID[id].xp : 0) * coefEtoiles(s.etoiles || 1));
  }
  const xp = () => Object.keys(etat.missions).reduce((t, id) => t + xpMission(id), 0);
  const etoilesTotal = () => Object.entries(etat.missions).reduce((t, [id, s]) => t + (PAR_ID[id] && s.statut === "reussie" ? (s.etoiles || 0) : 0), 0);
  const faites = (liste) => liste.filter(reussie).length;

  function rang(points = xp()) {
    let r = BNL.RANGS[0];
    for (const x of BNL.RANGS) if (points >= x.xp) r = x;
    const suivant = BNL.RANGS[BNL.RANGS.indexOf(r) + 1] || null;
    return { ...r, suivant };
  }

  const sansAide = (s) => !s.indices && !s.solution && !s.reveles && !s.indicesCmd;
  const chapitreFini = (c) => MISSIONS.filter((x) => x.chap === c).every((x) => reussie(x.id));

  // Progression par compétence : { reperer: { faites, total }, ... }
  function competences(missionsEtat = etat.missions) {
    const res = {};
    for (const c of Object.keys(BNL.COMPETENCES)) res[c] = { faites: 0, total: 0 };
    for (const x of MISSIONS) {
      if (!res[x.competence]) continue;
      res[x.competence].total++;
      if (missionsEtat[x.id] && missionsEtat[x.id].statut === "reussie") res[x.competence].faites++;
    }
    return res;
  }

  // Objet passé aux conditions des badges / avatars / thèmes
  const conditions = {
    reussie,
    xp,
    get stats() { return etat.stats; },
    chapitreFini,
    nbSansIndice: () => Object.entries(etat.missions).filter(([id, s]) => PAR_ID[id] && s.statut === "reussie" && sansAide(s)).length,
    nbTypeReussies: (t) => Object.entries(etat.missions).filter(([id, s]) => s.statut === "reussie" && PAR_ID[id] && PAR_ID[id].type === t).length,
    nbCompetence: (c) => Object.entries(etat.missions).filter(([id, s]) => s.statut === "reussie" && PAR_ID[id] && PAR_ID[id].competence === c).length,
    toutesCompetences: () => Object.values(competences()).every((x) => x.total === 0 || x.faites > 0),
    unPremierCoup: () => Object.entries(etat.missions).some(([id, s]) => s.statut === "reussie" && PAR_ID[id] && ["code", "parsons"].includes(PAR_ID[id].type) && (s.essais || 0) === 0 && sansAide(s)),
    unePerseverance: () => Object.values(etat.missions).some((s) => s.statut === "reussie" && (s.essais || 0) >= 5),
    nbPaliersFinis: () => BNL.CHAPITRES.filter((c) => !c.bonus && chapitreFini(c.id)).length,
    nbChapitresFinis: () => BNL.CHAPITRES.filter((c) => chapitreFini(c.id)).length,
    principalesParfaites: () => PRINCIPALES.every((id) => reussie(id) && etat.missions[id].etoiles >= 3),
    nbDossiersBonusFinis: () => BNL.CHAPITRES.filter((c) => c.bonus && chapitreFini(c.id)).length,
    toutFini: () => MISSIONS.every((x) => reussie(x.id)),
  };

  const avatarDebloque = (a) => !a.cond || a.cond(conditions);
  const themeDebloque = (t) => !t.cond || t.cond(conditions);
  const avatar = (id = etat.avatar) => BNL.AVATARS.find((a) => a.id === id || a.emoji === id) || BNL.AVATARS[0];

  // Les avatars et thèmes déjà connus (pour annoncer seulement les nouveaux)
  let connusA = new Set(BNL.AVATARS.filter(avatarDebloque).map((a) => a.id));
  let connusT = new Set(BNL.THEMES.filter(themeDebloque).map((t) => t.id));

  function evaluerRecompenses() {
    const nouveautes = { badges: [], avatars: [], themes: [] };
    for (const b of BNL.BADGES) {
      if (!etat.badges[b.id] && b.cond(conditions)) {
        etat.badges[b.id] = Date.now();
        nouveautes.badges.push(b);
      }
    }
    for (const a of BNL.AVATARS) if (avatarDebloque(a) && !connusA.has(a.id)) nouveautes.avatars.push(a);
    for (const t of BNL.THEMES) if (themeDebloque(t) && !connusT.has(t.id)) nouveautes.themes.push(t);
    connusA = new Set(BNL.AVATARS.filter(avatarDebloque).map((a) => a.id));
    connusT = new Set(BNL.THEMES.filter(themeDebloque).map((t) => t.id));
    return nouveautes;
  }

  // ---------------------------------------------------------------------------
  //  Brouillons
  // ---------------------------------------------------------------------------
  function brouillon(id, cleB) {
    return brouillons[id] ? brouillons[id][cleB] : undefined;
  }
  function setBrouillon(id, cleB, valeur) {
    brouillons._pour = etat.joueur ? (etat.joueur.eleveId || etat.joueur.pseudo) : "";
    brouillons[id] = brouillons[id] || {};
    brouillons[id][cleB] = valeur;
    ecrireBrouillons();
    if (enLigne()) { sauvegardeEnAttente = true; envoyerSauvegarde(); }
  }

  // ---------------------------------------------------------------------------
  //  Sauvegarde
  // ---------------------------------------------------------------------------
  function etatPourServeur(avecBrouillons = true) {
    const copie = JSON.parse(JSON.stringify(etat));
    delete copie.joueur;
    if (avecBrouillons) {
      const b = Object.assign({}, brouillons);
      delete b._pour;
      copie.brouillons = b;
    }
    return copie;
  }

  function argumentsSauvegarde(avecBrouillons = true) {
    return {
      p_jeton: etat.joueur.jeton,
      p_etat: etatPourServeur(avecBrouillons),
      p_xp: xp(),
      p_principal: faites(PRINCIPALES),
      p_bonus: faites(BONUS),
      p_etoiles: etoilesTotal(),
      p_badges: Object.keys(etat.badges).length,
      p_mission: etat.courante,
      p_avatar: avatar().emoji,
    };
  }

  const envoyerSauvegarde = BNL.U.retarder(async () => {
    if (!enLigne()) return;
    try {
      changerSync("attente");
      await rpc("gb_sauvegarde", argumentsSauvegarde(true));
      sauvegardeEnAttente = false;
      changerSync("ok");
    } catch (e) {
      changerSync("erreur");
      if (e.statut === 400 && /Session inconnue/.test(e.message)) sessionPerdue(e.message);
    }
  }, 2500);

  function sauver(immediat) {
    ecrireStockage(compacter(etat));
    abonnes.forEach((f) => { try { f(etat); } catch (e) { console.error(e); } });
    if (!enLigne()) return;
    sauvegardeEnAttente = true;
    if (immediat) envoyerSauvegarde.maintenant(); else envoyerSauvegarde();
  }

  // ---------------------------------------------------------------------------
  //  Journal des événements (pour le tableau de bord du professeur)
  // ---------------------------------------------------------------------------
  function journal(type, mission, extra = {}) {
    if (!enLigne()) return;
    fileEvenements.push({ type, mission, quand: new Date().toISOString(), ...extra });
    if (fileEvenements.length > 400) fileEvenements = fileEvenements.slice(-400);
  }

  async function viderJournal() {
    if (!enLigne() || !fileEvenements.length) return;
    const lot = fileEvenements.splice(0, 100);
    try {
      await rpc("gb_journal", { p_jeton: etat.joueur.jeton, p_evenements: lot });
    } catch (e) {
      fileEvenements = lot.concat(fileEvenements);
    }
  }
  setInterval(viderJournal, 8000);

  setInterval(() => {
    if (!enLigne() || document.hidden) return;
    rpc("gb_presence", { p_jeton: etat.joueur.jeton, p_mission: etat.courante }).then(() => changerSync("ok"), () => changerSync("erreur"));
  }, 60000);

  // Dernier envoi quand l'élève quitte ou cache la page (fetch « keepalive »).
  function envoiDeDerniereMinute() {
    ecrireStockage(compacter(etat));
    if (!enLigne()) return;
    try {
      if (fileEvenements.length) {
        fetch(urlServeur + "/rest/v1/rpc/gb_journal", {
          method: "POST", keepalive: true, headers: entetes(),
          body: JSON.stringify({ p_jeton: etat.joueur.jeton, p_evenements: fileEvenements.splice(0, 40) }),
        }).catch(() => {});
      }
      if (sauvegardeEnAttente) {
        let corps = JSON.stringify(argumentsSauvegarde(true));
        if (corps.length > 55000) corps = JSON.stringify(argumentsSauvegarde(false));
        if (corps.length < 60000) {
          fetch(urlServeur + "/rest/v1/rpc/gb_sauvegarde", { method: "POST", keepalive: true, headers: entetes(), body: corps }).catch(() => {});
          sauvegardeEnAttente = false;
        }
      }
    } catch (e) { /* tant pis */ }
  }
  window.addEventListener("pagehide", envoiDeDerniereMinute);
  document.addEventListener("visibilitychange", () => { if (document.hidden) envoiDeDerniereMinute(); });

  // ---------------------------------------------------------------------------
  //  Connexion avec le code d'expédition
  // ---------------------------------------------------------------------------
  const enLigne = () => !!(serveurConfigure && etat.joueur && etat.joueur.jeton && !etat.joueur.horsLigne);
  let surSessionPerdue = null;
  function sessionPerdue(message) { if (surSessionPerdue) surSessionPerdue(message); }

  // « corail-manta 482 », « CORAILMANTA482 »… → « CORAILMANTA482 »
  const normaliserCode = (texte) => String(texte || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  function fusionner(local, distant) {
    // Mission par mission, on garde la version la plus avancée.
    const res = Object.assign(nouvelEtat(), distant);
    res.missions = Object.assign({}, distant.missions || {});
    for (const [id, s] of Object.entries(local.missions || {})) {
      const d = res.missions[id];
      const score = (x) => (x.statut === "reussie" ? 1000 : x.statut === "en_cours" ? 100 : 0) + (x.etoiles || 0) * 10 + (x.etape || 0) + (x.temps || 0) / 100000;
      if (!d || score(s) > score(d)) res.missions[id] = s;
    }
    res.badges = Object.assign({}, distant.badges || {}, local.badges || {});
    res.stats = Object.assign(nouvelEtat().stats, distant.stats || {});
    for (const k of Object.keys(local.stats || {})) res.stats[k] = Math.max(res.stats[k] || 0, local.stats[k] || 0);
    res.vus = Object.assign({}, distant.vus || {}, local.vus || {});
    return res;
  }

  function appliquerFiche(fiche, garderLocal) {
    const joueur = {
      pseudo: fiche.pseudo, eleveId: fiche.eleve_id, jeton: fiche.jeton,
      classeNom: fiche.classe_nom, horsLigne: false, code: fiche.code || null,
    };
    const distant = Object.assign({}, fiche.etat || {});
    const brouillonsDistants = distant.brouillons || {};
    delete distant.brouillons;
    const memeJoueur = etat.joueur && etat.joueur.eleveId === fiche.eleve_id;
    etat = garderLocal && memeJoueur ? fusionner(etat, distant) : Object.assign(nouvelEtat(), distant);
    etat.joueur = joueur;
    const av = BNL.AVATARS.find((a) => a.emoji === fiche.avatar || a.id === fiche.avatar);
    if (av && (!memeJoueur || !etat.avatar)) etat.avatar = av.id;
    if (!memeJoueur) brouillons = {};
    brouillons = Object.assign({}, brouillonsDistants, brouillons, { _pour: fiche.eleve_id });
    ecrireBrouillons.maintenant();
    connusA = new Set(BNL.AVATARS.filter(avatarDebloque).map((a) => a.id));
    connusT = new Set(BNL.THEMES.filter(themeDebloque).map((t) => t.id));
    changerSync("ok");
  }

  const listerClasses = () => rpc("gb_classes_ouvertes", {});

  async function inscrire(classeId, pseudo, avatarId) {
    const fiche = await rpc("gb_inscription", { p_classe: classeId, p_pseudo: pseudo, p_avatar: avatar(avatarId).emoji });
    etat = nouvelEtat();
    brouillons = {};
    appliquerFiche(fiche, false);
    etat.avatar = avatarId || "crabe";
    sauver(true);
    journal("inscription", null);
    return fiche.code;
  }

  async function connecter(code) {
    const c = normaliserCode(code);
    if (c.length < 6) throw new ErreurServeur("Ce code est trop court. Il ressemble à : CORAIL-MANTA-482.", 0);
    const fiche = await rpc("gb_connexion", { p_code: c });
    appliquerFiche(fiche, true);
    sauver(true);
  }

  async function reprendre() {
    if (!serveurConfigure || !etat.joueur || etat.joueur.horsLigne) { changerSync("local"); return false; }
    try {
      const fiche = await rpc("gb_reprise", { p_jeton: etat.joueur.jeton });
      appliquerFiche(fiche, true);
      sauver(true);
      return true;
    } catch (e) {
      if (e.statut === 400) { deconnecter(); throw e; }
      changerSync("erreur");
      return true; // hors connexion : on continue avec les cookies
    }
  }

  function jouerHorsLigne(pseudo, avatarId) {
    const memePseudo = etat.joueur && etat.joueur.horsLigne && etat.joueur.pseudo === pseudo;
    if (!memePseudo) { etat = nouvelEtat(); brouillons = {}; }
    etat.joueur = { pseudo, horsLigne: true };
    etat.avatar = avatarId || etat.avatar || "crabe";
    changerSync("local");
    sauver();
  }

  function deconnecter() {
    if (enLigne()) envoyerSauvegarde.maintenant();
    etat = nouvelEtat();
    brouillons = {};
    effacerStockage();
  }

  async function equipage() {
    if (!enLigne()) return null;
    const lignes = await rpc("gb_equipage", { p_jeton: etat.joueur.jeton });
    changerSync("ok");
    return lignes;
  }

  // ---------------------------------------------------------------------------
  //  Code de reprise SANS serveur : la progression (missions et étoiles) tient
  //  dans un code de 18 caractères. Pratique car les cookies ne durent qu'un jour.
  // ---------------------------------------------------------------------------
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I, O, 0, 1 (faciles à confondre)

  function codeProgression() {
    let bits = "0001"; // version 1
    for (const x of MISSIONS) {
      const s = etat.missions[x.id];
      const v = s && s.statut === "reussie" ? Math.max(1, Math.min(3, s.etoiles || 1)) : 0;
      bits += v.toString(2).padStart(2, "0");
    }
    while (bits.length % 5) bits += "0";
    let code = "";
    let somme = 0;
    for (let i = 0; i < bits.length; i += 5) {
      const n = parseInt(bits.slice(i, i + 5), 2);
      somme = (somme * 7 + n + 3) % 32;
      code += ALPHABET[n];
    }
    code += ALPHABET[somme];
    return "GB-" + code.match(/.{1,6}/g).join("-");
  }

  function lireCodeProgression(texte) {
    // Le code commence par « GB- » puis C ou D (version 1) : on retire le préfixe.
    const brut = String(texte || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^GB/, "");
    const lettres = [...brut];
    if (lettres.length < 4) return null;
    if (lettres.some((c) => !ALPHABET.includes(c))) return null;
    const controle = lettres.pop();
    let somme = 0;
    let bits = "";
    for (const c of lettres) {
      const n = ALPHABET.indexOf(c);
      somme = (somme * 7 + n + 3) % 32;
      bits += n.toString(2).padStart(5, "0");
    }
    if (ALPHABET[somme] !== controle || bits.slice(0, 4) !== "0001") return null;
    const res = {};
    MISSIONS.forEach((x, k) => {
      const v = parseInt(bits.slice(4 + 2 * k, 6 + 2 * k) || "0", 2);
      if (v > 0) res[x.id] = v;
    });
    return res;
  }

  function restaurerProgression(code) {
    const res = lireCodeProgression(code);
    if (!res) return false;
    for (const [id, etoiles] of Object.entries(res)) {
      const s = m(id);
      if (s.statut !== "reussie" || (s.etoiles || 0) < etoiles) {
        s.statut = "reussie";
        s.etoiles = etoiles;
        s.vu = 7;
      }
    }
    const prochaine = PRINCIPALES.find((id) => !reussie(id));
    etat.courante = prochaine || BONUS.find((id) => debloquee(id) && !reussie(id)) || etat.courante;
    if (Object.keys(res).length) { etat.vus.prologue = true; etat.vus.visite = true; }
    evaluerRecompenses();
    sauver(true);
    return Object.keys(res).length;
  }

  return {
    MISSIONS, PAR_ID, PRINCIPALES, BONUS,
    get etat() { return etat; },
    serveurConfigure, toutOuvert, cookiesActifs: Cookies.actifs,
    m, reussie, debloquee, xp, xpMission, rang, etoilesTotal, faites, conditions, competences, chapitreDe,
    avatarDebloque, themeDebloque, avatar, evaluerRecompenses,
    brouillon, setBrouillon,
    sauver, journal, viderJournal,
    listerClasses, inscrire, connecter, reprendre, jouerHorsLigne, deconnecter, equipage, enLigne,
    normaliserCode, codeProgression, lireCodeProgression, restaurerProgression,
    surChangement: (f) => abonnes.push(f),
    surSync: (f) => { abonnesSync.push(f); f(statutSync); },
    statutSync: () => statutSync,
    set surSessionPerdue(f) { surSessionPerdue = f; },
    rpc,
  };
})();
