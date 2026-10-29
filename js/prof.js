// Tableau de bord du professeur : suivi en direct de la classe, codes d'expédition.
(() => {
  const { $, $$, el, md, echapper, colorer, duree, depuis } = BNL.U;
  const P = BNL.Panneaux;
  const cfg = window.BNL_CONFIG || {};
  const URL_SERVEUR = (cfg.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const CLE = (cfg.SUPABASE_KEY || "").trim();
  const MISSIONS = [...BNL.MISSIONS_PRINCIPALES, ...BNL.MISSIONS_BONUS];
  const PAR_ID = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));
  const PRINCIPALES = BNL.MISSIONS_PRINCIPALES;
  const EXPEDITIONS = BNL.CHAPITRES.filter((c) => c.bonus);
  const TYPES = { etapes: "étapes à toucher", commande: "console", parsons: "lignes à ordonner", trace: "tableau d'avancement", code: "programme" };
  const app = () => $("#app");
  // Le mot de passe ne va que dans sessionStorage (effacé à la fermeture de l'onglet), jamais dans un cookie.
  const lireSession = (k) => { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } };
  const ecrireSession = (k, v) => { try { if (v) sessionStorage.setItem(k, v); else sessionStorage.removeItem(k); } catch (e) { /* rien */ } };

  const etat = {
    secret: lireSession("gb.prof"),
    classes: [], classeId: lireSession("gb.prof.classe"),
    eleves: [], flux: [], tri: "progression", onglet: "eleves", auto: true, maj: null, minuteur: null,
  };

  async function rpc(fonction, args) {
    const entetes = { "Content-Type": "application/json", apikey: CLE };
    if (CLE.startsWith("eyJ")) entetes.Authorization = "Bearer " + CLE;
    let r;
    try {
      r = await fetch(URL_SERVEUR + "/rest/v1/rpc/" + fonction, { method: "POST", headers: entetes, body: JSON.stringify(args || {}) });
    } catch (e) { throw new Error("Serveur injoignable : vérifie la connexion internet."); }
    const texte = await r.text();
    let d = null;
    try { d = texte ? JSON.parse(texte) : null; } catch (e) { d = texte; }
    if (!r.ok) {
      let message = (d && d.message) || "Erreur " + r.status;
      if (r.status === 404) message = "Fonction introuvable : as-tu bien lancé supabase/schema.sql dans Supabase ?";
      if (r.status === 401) message = "Clé refusée : vérifie SUPABASE_KEY dans js/config.js.";
      const err = new Error(message);
      err.statut = r.status;
      throw err;
    }
    return d;
  }

  // ---------------------------------------------------------------------------
  //  Écrans d'entrée
  // ---------------------------------------------------------------------------
  function entete(contenu) {
    return el("header.barre.barre-prof", null,
      el("a.marque", { href: "index.html", title: "Ouvrir le jeu élève", html: `<span class="logo" aria-hidden="true">${BNL.Illus.luciole({ faisceau: false })}</span><span class="marque-texte"><strong>Expédition Gombessa</strong> tableau de bord</span>` }),
      el("div.prof-entete-actions", null, contenu || null));
  }

  function ecranConfiguration() {
    app().innerHTML = "";
    app().append(entete(), el("main.prof-centre", null, el("div.carte-connexion.large", null,
      el("h2", null, "Le suivi de classe n'est pas encore branché"),
      el("div", { html: md(`Le jeu fonctionne déjà **sans serveur** : chaque élève garde sa progression 1 jour sur son appareil, et peut noter un **code de reprise**. Pour suivre la classe en direct et donner à chaque élève un **code d'expédition** valable partout :

1. Crée un projet gratuit sur **supabase.com**.
2. Dans *SQL Editor*, colle le contenu du fichier @supabase/schema.sql@ (après avoir remplacé @CHANGE-MOI@ par ton mot de passe), puis lance-le.
3. Dans *Project Settings › API Keys*, copie l'**URL du projet** et la **clé publique** (*publishable* ou *anon*).
4. Colle-les dans @js/config.js@ (@SUPABASE_URL@ et @SUPABASE_KEY@), puis publie à nouveau le site.

Tout est détaillé dans le fichier **README.md** du site.`) }))));
  }

  function ecranConnexion(message) {
    const mdp = el("input#mdp", { type: "password", autocomplete: "current-password", required: true, placeholder: "Mot de passe du tableau de bord" });
    const msg = el("p.message-formulaire", { role: "alert" }, message || "");
    const bouton = el("button.bouton.principal.large", { type: "submit" }, "Ouvrir le tableau de bord");
    const form = el("form.formulaire", null, el("label.champ", null, el("span.etiquette", null, "Mot de passe"), mdp), msg, bouton);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      bouton.disabled = true;
      try {
        await rpc("gb_prof_test", { p_secret: mdp.value });
        etat.secret = mdp.value;
        ecrireSession("gb.prof", mdp.value);
        await tableau();
      } catch (err) {
        msg.textContent = err.message;
        bouton.disabled = false;
      }
    });
    app().innerHTML = "";
    app().append(entete(), el("main.prof-centre", null, el("div.carte-connexion", null,
      el("h2", null, "Tableau de bord du professeur"),
      el("p.aide-texte", null, "Le mot de passe a été choisi dans le script supabase/schema.sql (remplacement de CHANGE-MOI). Il reste en mémoire seulement le temps de cet onglet."),
      form)));
    mdp.focus();
  }

  // ---------------------------------------------------------------------------
  //  Analyse des données d'un élève
  // ---------------------------------------------------------------------------
  const aideVue = (s) => !!(s && (s.solution || s.reveles));
  function analyser(e) {
    const st = e.etat || {};
    const ms = st.missions || {};
    const vuMs = Date.now() - new Date(e.vu_le).getTime();
    const enLigne = vuMs < 120000;
    const courante = PAR_ID[e.mission_courante] ? e.mission_courante : null;
    const mc = (courante && ms[courante]) || {};
    const tempsTotal = Object.values(ms).reduce((t, x) => t + (x.temps || 0), 0);
    let alerte = null;
    if (courante && mc.statut !== "reussie" && vuMs < 10 * 60000) {
      const essais = mc.essais || 0, temps = mc.temps || 0;
      const raisons = [];
      if (essais >= 4) raisons.push(`${essais} erreurs`);
      if (temps >= 480) raisons.push(`${Math.round(temps / 60)} min sur la mission`);
      if (aideVue(mc)) raisons.push("a demandé la réponse");
      else if ((mc.indices || 0) >= 3) raisons.push("a vu les 3 indices");
      const types = Object.entries(mc.types || {}).filter(([k]) => k !== "Résultat").sort((a, b) => b[1] - a[1]);
      if (raisons.length) {
        alerte = { niveau: essais >= 7 || temps >= 900 ? "fort" : "moyen", raisons, derniere: types[0] ? types[0][0] : null, score: essais + temps / 120 + (aideVue(mc) ? 3 : 0) };
      }
    }
    const faitesP = PRINCIPALES.filter((m) => ms[m.id] && ms[m.id].statut === "reussie").length;
    const comps = {};
    for (const c of Object.keys(BNL.COMPETENCES)) comps[c] = { faites: 0, total: 0 };
    MISSIONS.forEach((m) => {
      if (!comps[m.competence]) return;
      comps[m.competence].total++;
      if (ms[m.id] && ms[m.id].statut === "reussie") comps[m.competence].faites++;
    });
    return { e, ms, enLigne, courante, mc, tempsTotal, alerte, faitesP, comps, brouillons: st.brouillons || {} };
  }

  function statutCase(s) {
    if (!s || s.statut === "nouvelle") return { cls: "vide", txt: "" };
    if (s.statut === "reussie") {
      if (aideVue(s) || s.etoiles === 1) return { cls: "ok1", txt: "C" };
      return { cls: s.etoiles >= 3 ? "ok3" : "ok2", txt: "✓" };
    }
    return { cls: "cours", txt: String(s.essais || 0) };
  }

  function bulleInfo(m, s) {
    if (!s || s.statut === "nouvelle") return `${m.titre} : pas commencée`;
    const morceaux = [];
    if (s.statut === "reussie") morceaux.push(`réussie ${"★".repeat(s.etoiles || 1)}`); else morceaux.push("en cours");
    morceaux.push(`${s.essais || 0} erreur(s)`);
    if (s.indices || s.indicesCmd) morceaux.push(`${(s.indices || 0) + (s.indicesCmd || 0)} indice(s)`);
    if (aideVue(s)) morceaux.push("réponse ou correction vue");
    morceaux.push(duree(s.temps || 0));
    const err = Object.entries(s.types || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => `${k === "Résultat" ? "résultat faux" : k} ×${v}`);
    if (err.length) morceaux.push("erreurs : " + err.join(", "));
    return `${m.titre} : ${morceaux.join(" · ")}`;
  }

  // ---------------------------------------------------------------------------
  //  Tableau de bord
  // ---------------------------------------------------------------------------
  async function tableau() {
    try {
      etat.classes = await rpc("gb_prof_classes", { p_secret: etat.secret });
    } catch (e) {
      if (/Mot de passe/.test(e.message)) ecrireSession("gb.prof", "");
      return ecranConnexion(e.message);
    }
    if (!etat.classes.find((c) => c.id === etat.classeId)) etat.classeId = etat.classes[0] ? etat.classes[0].id : "";
    construire();
    await rafraichir();
    clearInterval(etat.minuteur);
    etat.minuteur = setInterval(() => { if (etat.auto && !document.hidden && !P.enCours()) rafraichir(); }, 15000);
  }

  function construire() {
    const choixClasse = el("select#choix-classe", { "aria-label": "Classe" },
      etat.classes.length ? etat.classes.map((c) => el("option", { value: c.id, selected: c.id === etat.classeId || null }, `${c.nom}${c.ouverte ? "" : " (fermée)"} · ${c.nb_eleves} élève${c.nb_eleves > 1 ? "s" : ""}`))
        : el("option", { value: "" }, "Aucune classe"));
    choixClasse.addEventListener("change", () => { etat.classeId = choixClasse.value; ecrireSession("gb.prof.classe", etat.classeId); rafraichir(); });
    const auto = el("label.interrupteur", null, el("input", { type: "checkbox", checked: etat.auto || null, onchange: (e) => { etat.auto = e.target.checked; } }), el("span", null, "Actualisation auto"));
    const actions = [
      choixClasse,
      el("button.bouton.petit", { type: "button", onclick: gererClasses }, "Gérer les classes"),
      auto,
      el("button.bouton.petit", { type: "button", onclick: () => rafraichir() }, "↻ Actualiser"),
      el("button.bouton.petit", { type: "button", onclick: exporterCSV }, "Exporter (CSV)"),
      el("button.bouton.petit.discret", { type: "button", onclick: () => { ecrireSession("gb.prof", ""); location.reload(); } }, "Se déconnecter"),
    ];
    app().innerHTML = "";
    app().append(entete(actions), el("main.prof", null,
      el("section.prof-resume"),
      el("section.prof-alertes"),
      el("nav.prof-onglets", { role: "tablist" },
        ["eleves:Élèves", "competences:Compétences", "missions:Missions", "codes:Codes d'expédition", "activite:Activité en direct"].map((x) => {
          const [id, t] = x.split(":");
          return el("button" + (etat.onglet === id ? ".actif" : ""), { type: "button", role: "tab", "data-onglet": id, onclick: () => { etat.onglet = id; $$(".prof-onglets button").forEach((b) => b.classList.toggle("actif", b.dataset.onglet === id)); rendreOnglet(); } }, t);
        })),
      el("section.prof-contenu"),
      el("p.prof-maj.aide-texte")));
    if (!etat.classes.length) {
      $(".prof-contenu").append(el("div.carte-connexion.large", null, el("h2", null, "Crée ta première classe"),
        el("p", null, "Les élèves choisiront cette classe sur l'écran d'accueil du jeu, puis recevront leur code d'expédition."),
        el("button.bouton.principal", { type: "button", onclick: gererClasses }, "Créer une classe")));
    }
  }

  async function rafraichir() {
    if (!etat.classeId) return;
    try {
      const [eleves, flux] = await Promise.all([
        rpc("gb_prof_eleves", { p_secret: etat.secret, p_classe: etat.classeId }),
        rpc("gb_prof_flux", { p_secret: etat.secret, p_classe: etat.classeId, p_depuis: new Date(Date.now() - 6 * 3600000).toISOString() }),
      ]);
      etat.eleves = eleves || [];
      etat.flux = flux || [];
      etat.maj = new Date();
      rendreResume();
      rendreAlertes();
      rendreOnglet();
      const z = $(".prof-maj");
      if (z) z.textContent = "Mis à jour à " + etat.maj.toLocaleTimeString("fr-FR") + (etat.auto ? " · actualisation toutes les 15 s" : "");
    } catch (e) {
      P.toast("⚠️ " + echapper(e.message), { type: "erreur" });
    }
  }

  function rendreResume() {
    const zone = $(".prof-resume");
    if (!zone) return;
    const a = etat.eleves.map(analyser);
    const n = a.length;
    const enLigne = a.filter((x) => x.enLigne).length;
    const fini = a.filter((x) => x.faitesP >= PRINCIPALES.length).length;
    const moy = n ? (a.reduce((t, x) => t + x.faitesP, 0) / n).toFixed(1) : "0";
    const alertes = a.filter((x) => x.alerte).length;
    zone.innerHTML = "";
    const carte = (v, l, cls) => el("div.prof-chiffre" + (cls ? "." + cls : ""), null, el("strong", null, String(v)), el("span", null, l));
    zone.append(carte(n, "élèves inscrits"), carte(enLigne, "en plongée maintenant", enLigne ? "vert" : ""),
      carte(`${moy} / ${PRINCIPALES.length}`, "missions principales (moyenne)"),
      carte(`${fini} / ${n}`, "ont rencontré le gombessa"), carte(alertes, "à aider", alertes ? "rouge" : ""));
  }

  function rendreAlertes() {
    const zone = $(".prof-alertes");
    if (!zone) return;
    const a = etat.eleves.map(analyser).filter((x) => x.alerte).sort((x, y) => y.alerte.score - x.alerte.score);
    zone.innerHTML = "";
    if (!a.length) return;
    zone.append(el("h2", null, "🙋 À aider maintenant"));
    const liste = el("ul.liste-alertes");
    a.forEach((x) => {
      const m = PAR_ID[x.courante];
      liste.append(el("li.alerte." + x.alerte.niveau, null,
        el("span.alerte-avatar", { "aria-hidden": "true" }, x.e.avatar),
        el("div", null, el("strong", null, x.e.pseudo), el("span", null, ` sur « ${m.titre} »`),
          el("div.alerte-raisons", null, x.alerte.raisons.join(" · ") + (x.alerte.derniere ? ` · erreur fréquente : ${x.alerte.derniere}` : ""))),
        el("button.bouton.petit", { type: "button", onclick: () => ficheEleve(x.e.id, x.courante) }, "Voir son travail")));
    });
    zone.append(liste);
  }

  function rendreOnglet() {
    const zone = $(".prof-contenu");
    if (!zone || !etat.classes.length) return;
    zone.innerHTML = "";
    if (!etat.eleves.length) {
      zone.append(el("div.vide-prof", null, el("p", null, "Aucun élève dans cette classe pour l'instant."),
        el("p.aide-texte", null, "Donne aux élèves l'adresse du site : « Je commence l'expédition », ils choisissent la classe et leur prénom, puis notent leur code d'expédition.")));
      return;
    }
    if (etat.onglet === "eleves") rendreGrille(zone);
    if (etat.onglet === "competences") rendreCompetences(zone);
    if (etat.onglet === "missions") rendreMissions(zone);
    if (etat.onglet === "codes") rendreCodes(zone);
    if (etat.onglet === "activite") rendreActivite(zone);
  }

  // ----------------------------- Grille des élèves -----------------------------
  function trier(a) {
    const tri = {
      progression: (x, y) => (y.e.faites_principal + y.e.faites_bonus) - (x.e.faites_principal + x.e.faites_bonus) || y.e.xp - x.e.xp,
      pseudo: (x, y) => x.e.pseudo.localeCompare(y.e.pseudo, "fr"),
      activite: (x, y) => new Date(y.e.vu_le) - new Date(x.e.vu_le),
      difficulte: (x, y) => (y.alerte ? y.alerte.score : -1) - (x.alerte ? x.alerte.score : -1) || x.faitesP - y.faitesP,
    };
    return a.sort(tri[etat.tri]);
  }
  function choixTri() {
    return el("select", { "aria-label": "Trier les élèves", onchange: (e) => { etat.tri = e.target.value; rendreOnglet(); } },
      [["progression", "Trier par progression"], ["difficulte", "Trier par difficulté"], ["activite", "Trier par activité récente"], ["pseudo", "Trier par prénom"]]
        .map(([v, t]) => el("option", { value: v, selected: etat.tri === v || null }, t)));
  }
  function celluleEleve(x) {
    return el("th.col-eleve", null, el("button.eleve-bouton", { type: "button", onclick: () => ficheEleve(x.e.id) },
      el("span.point-en-ligne" + (x.enLigne ? ".actif" : ""), { title: x.enLigne ? "En ligne" : "Hors ligne" }),
      el("span.eleve-avatar", { "aria-hidden": "true" }, x.e.avatar), el("span.eleve-pseudo", null, x.e.pseudo)));
  }

  function rendreGrille(zone) {
    const a = trier(etat.eleves.map(analyser));
    zone.append(el("div.grille-outils", null, choixTri(), legende()));
    const table = el("table.grille-classe");
    const tete = el("tr", null, el("th.col-eleve", null, "Élève"),
      PRINCIPALES.map((m, i) => el("th.col-m", { title: `${m.titre} (${(BNL.COMPETENCES[m.competence] || {}).nom || ""})` }, `M${i + 1}`)),
      EXPEDITIONS.map((d, i) => el("th.col-d", { title: d.titre }, `E${i + 1}`)),
      el("th", null, "XP"), el("th", null, "Temps"), el("th", null, "Vu"));
    table.append(el("thead", null, tete));
    const corps = el("tbody");
    a.forEach((x) => {
      const tr = el("tr" + (x.alerte ? ".a-aider" : ""));
      tr.append(celluleEleve(x));
      PRINCIPALES.forEach((m) => {
        const s = x.ms[m.id];
        const c = statutCase(s);
        tr.append(el("td.cell." + c.cls + (x.courante === m.id ? ".courante" : ""), { title: bulleInfo(m, s) },
          el("button", { type: "button", onclick: () => ficheEleve(x.e.id, m.id), "aria-label": bulleInfo(m, s) }, c.txt)));
      });
      EXPEDITIONS.forEach((d) => {
        const ms = BNL.MISSIONS_BONUS.filter((m) => m.chap === d.id);
        const f = ms.filter((m) => x.ms[m.id] && x.ms[m.id].statut === "reussie").length;
        const enCours = ms.some((m) => x.courante === m.id);
        tr.append(el("td.case-d" + (f === ms.length ? ".fini" : f ? ".partiel" : "") + (enCours ? ".courante" : ""), { title: `${d.titre} : ${f}/${ms.length}` }, f ? `${f}/${ms.length}` : ""));
      });
      tr.append(el("td.num", null, String(x.e.xp)), el("td.num", null, duree(x.tempsTotal)), el("td.num.vu", { title: new Date(x.e.vu_le).toLocaleString("fr-FR") }, depuis(x.e.vu_le)));
      corps.append(tr);
    });
    table.append(corps);
    zone.append(el("div.grille-defile", null, table));
  }

  function legende() {
    const item = (cls, txt, l) => el("span.leg", null, el("span.case-leg." + cls, null, txt), l);
    return el("div.legende", null, item("ok3", "✓", "sans aide"), item("ok2", "✓", "avec indices ou erreurs"), item("ok1", "C", "avec la réponse / correction"),
      item("cours", "3", "en cours (erreurs)"), item("courante", "", "mission actuelle"));
  }

  // ----------------------------- Compétences -----------------------------------
  function rendreCompetences(zone) {
    const a = trier(etat.eleves.map(analyser));
    const comps = Object.entries(BNL.COMPETENCES);
    zone.append(el("p.aide-texte", null, "Pour chaque compétence : missions réussies sur missions proposées (parcours principal et bonus). Une case vide signale une compétence encore jamais travaillée."),
      el("div.grille-outils", null, choixTri()));
    const table = el("table.grille-classe.grille-competences");
    table.append(el("thead", null, el("tr", null, el("th.col-eleve", null, "Élève"), comps.map(([, c]) => el("th", { title: c.aide }, `${c.icone} ${c.nom}`)))));
    const corps = el("tbody");
    a.forEach((x) => {
      const tr = el("tr", null, celluleEleve(x));
      comps.forEach(([id]) => {
        const v = x.comps[id];
        const pct = v.total ? v.faites / v.total : 0;
        tr.append(el("td.comp", { title: `${v.faites} / ${v.total}` },
          el("span.comp-barre", null, el("span", { style: { width: Math.round(pct * 100) + "%" } })), el("small", null, v.faites ? `${v.faites}/${v.total}` : "—")));
      });
      corps.append(tr);
    });
    const moyennes = el("tr.ligne-moyenne", null, el("th.col-eleve", null, "Moyenne de la classe"),
      comps.map(([id]) => {
        const t = a.reduce((s, x) => s + (x.comps[id].total ? x.comps[id].faites / x.comps[id].total : 0), 0) / (a.length || 1);
        return el("td.comp", null, el("strong", null, Math.round(t * 100) + " %"));
      }));
    corps.append(moyennes);
    table.append(corps);
    zone.append(el("div.grille-defile", null, table));
  }

  // ----------------------------- Statistiques par mission ----------------------
  function rendreMissions(zone) {
    const a = etat.eleves.map(analyser);
    const n = a.length;
    const table = el("table.stats-missions");
    table.append(el("thead", null, el("tr", null, ["Mission", "Réussite", "En cours", "Erreurs (moy.)", "Indices", "Réponse vue", "Temps médian", "Erreurs fréquentes"].map((t) => el("th", null, t)))));
    const corps = el("tbody");
    MISSIONS.forEach((m) => {
      const etats = a.map((x) => x.ms[m.id]).filter(Boolean);
      const reussies = etats.filter((s) => s.statut === "reussie");
      const enCours = a.filter((x) => x.courante === m.id && !(x.ms[m.id] && x.ms[m.id].statut === "reussie")).length;
      if (!etats.length && m.chap.startsWith("e")) return;
      const moyEssais = etats.length ? (etats.reduce((t, s) => t + (s.essais || 0), 0) / etats.length).toFixed(1) : "–";
      const pctIndices = etats.length ? Math.round(100 * etats.filter((s) => s.indices > 0 || s.indicesCmd > 0).length / etats.length) + " %" : "–";
      const pctSol = etats.length ? Math.round(100 * etats.filter(aideVue).length / etats.length) + " %" : "–";
      const temps = reussies.map((s) => s.temps || 0).sort((x, y) => x - y);
      const med = temps.length ? duree(temps[Math.floor(temps.length / 2)]) : "–";
      const erreurs = {};
      etats.forEach((s) => Object.entries(s.types || {}).forEach(([k, v]) => { erreurs[k] = (erreurs[k] || 0) + v; }));
      const top = Object.entries(erreurs).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, v]) => `${k === "Résultat" ? "résultat faux" : k} (${v})`).join(", ");
      const pct = n ? Math.round(100 * reussies.length / n) : 0;
      const difficile = etats.length >= 3 && (Number(moyEssais) >= 4 || etats.filter(aideVue).length / etats.length >= 0.3);
      const comp = BNL.COMPETENCES[m.competence] || {};
      corps.append(el("tr" + (difficile ? ".difficile" : ""), null,
        el("td", null, el("strong", null, m.titre), el("small", null, `${(BNL.CHAPITRES.find((c) => c.id === m.chap) || {}).titre || ""} · ${comp.icone || ""} ${comp.nom || ""} · ${TYPES[m.type] || m.type}`)),
        el("td", null, el("div.barre-progres", { title: `${reussies.length}/${n}` }, el("span", { style: { width: pct + "%" } })), el("small", null, `${reussies.length}/${n}`)),
        el("td.num", null, String(enCours || "")), el("td.num", null, moyEssais), el("td.num", null, pctIndices), el("td.num", null, pctSol), el("td.num", null, med),
        el("td", null, top || "")));
    });
    table.append(corps);
    zone.append(el("p.aide-texte", null, "Les lignes surlignées signalent les missions où la classe peine (beaucoup d'erreurs ou de réponses demandées) : un bon moment pour une mise au point collective."),
      el("div.grille-defile", null, table));
  }

  // ----------------------------- Codes d'expédition ----------------------------
  function rendreCodes(zone) {
    const classe = etat.classes.find((c) => c.id === etat.classeId);
    const a = etat.eleves.slice().sort((x, y) => x.pseudo.localeCompare(y.pseudo, "fr"));
    zone.append(el("div.grille-outils", null,
      el("p.aide-texte", null, "Chaque élève a son code : il le tape dans « J'ai déjà un code » pour reprendre sur n'importe quel appareil. Ne projette pas cette liste en classe."),
      el("button.bouton.petit", { type: "button", onclick: () => imprimerCodes(classe, a) }, "🖨️ Imprimer les étiquettes")));
    const table = el("table.stats-missions.table-codes");
    table.append(el("thead", null, el("tr", null, el("th", null, "Élève"), el("th", null, "Code d'expédition"), el("th", null, ""))));
    const corps = el("tbody");
    a.forEach((e) => {
      const code = el("code.code-prof", null, e.code);
      corps.append(el("tr", null, el("td", null, `${e.avatar} ${e.pseudo}`), el("td", null, code),
        el("td", null, el("button.bouton.petit.discret", { type: "button", onclick: () => nouveauCode(e, code) }, "Nouveau code"))));
    });
    table.append(corps);
    zone.append(el("div.grille-defile", null, table));
  }

  async function nouveauCode(e, zoneCode) {
    const ok = await P.confirmer(`Donner un **nouveau code** à **${e.pseudo}** ? L'ancien code ne marchera plus, et l'élève devra se reconnecter avec le nouveau. Sa progression est conservée.`, { titre: "Nouveau code", oui: "Générer" });
    if (!ok) return;
    try {
      const code = await rpc("gb_prof_nouveau_code", { p_secret: etat.secret, p_eleve: e.id });
      e.code = code;
      if (zoneCode) zoneCode.textContent = code;
      P.toast(`Nouveau code de ${echapper(e.pseudo)} : <strong>${echapper(code)}</strong>`, { type: "succes", duree: 12000 });
    } catch (err) { P.toast("⚠️ " + echapper(err.message), { type: "erreur" }); }
  }

  function imprimerCodes(classe, eleves) {
    const adresse = location.href.replace(/prof\.html.*$/, "");
    const w = window.open("", "_blank");
    if (!w) { P.toast("Autorise les fenêtres pop-up pour imprimer."); return; }
    const etiquettes = eleves.map((e) => `<div class="etiquette"><div class="titre">Expédition Gombessa · ${echapper(classe ? classe.nom : "")}</div>
      <div class="nom">${echapper(e.pseudo)}</div><div class="code">${echapper(e.code)}</div>
      <div class="aide">Site : ${echapper(adresse)}<br>« J'ai déjà un code » puis tape ce code. Garde-le pour toi.</div></div>`).join("");
    w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Codes d'expédition</title><style>
      body{font-family:system-ui,sans-serif;margin:12mm}
      .grille{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
      .etiquette{border:1.5px dashed #555;border-radius:8px;padding:5mm;break-inside:avoid}
      .titre{font-size:9pt;color:#555}.nom{font-size:14pt;font-weight:700;margin:2mm 0}
      .code{font:700 17pt ui-monospace,Menlo,Consolas,monospace;letter-spacing:.05em}
      .aide{font-size:8.5pt;color:#444;margin-top:2mm}
    </style></head><body><div class="grille">${etiquettes}</div><script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  }

  // ----------------------------- Activité en direct ----------------------------
  const ICONES = { essai: "✗", reussite: "✓", indice: "💡", solution: "📖", etape: "?", commande: "⌨", connexion: "🔑", inscription: "🆕", debut: "▶", memo: "📒", plan: "🧭", replique: "💬", briefing: "📌" };
  const LIBELLES = { essai: "essai raté", reussite: "mission réussie", indice: "indice ouvert", solution: "réponse / correction demandée", connexion: "connexion", inscription: "inscription", debut: "mission commencée", memo: "mémo ouvert", briefing: "briefing lu" };
  function ligneEvenement(v, avecPseudo) {
    const m = PAR_ID[v.mission];
    const heure = new Date(v.cree_le).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const type = v.type === "etape" ? (v.ok ? "bonne réponse" : "mauvaise réponse") : v.type === "commande" ? (v.ok ? "commande juste" : "commande à revoir")
      : v.type === "plan" ? (v.ok ? "plan expliqué" : "plan : explication à revoir") : v.type === "replique" ? (v.ok ? "scène comprise" : "scène : mauvaise réponse") : (LIBELLES[v.type] || v.type);
    const li = el("li.evenement.t-" + v.type + (v.ok === false ? ".ko" : v.ok ? ".okk" : ""), null,
      el("span.ev-heure", null, heure),
      el("span.ev-icone", { "aria-hidden": "true" }, ICONES[v.type] || "•"),
      el("div.ev-texte", null,
        avecPseudo ? el("strong", null, v.pseudo + " ") : null,
        el("span", null, `${type}${m ? " · " + m.titre : ""}`),
        v.detail ? el("div.ev-detail", null, v.detail) : null));
    if (v.code) {
      const b = el("button.lien", { type: "button" }, "voir le code");
      const pre = el("pre.code-statique", { hidden: true, html: colorer(v.code) });
      b.addEventListener("click", () => { pre.hidden = !pre.hidden; b.textContent = pre.hidden ? "voir le code" : "masquer le code"; });
      li.querySelector(".ev-texte").append(b, pre);
    }
    return li;
  }

  function rendreActivite(zone) {
    if (!etat.flux.length) { zone.append(el("p.vide", null, "Aucune activité ces 6 dernières heures.")); return; }
    const ul = el("ul.flux");
    etat.flux.filter((v) => v.type !== "memo").forEach((v) => ul.append(ligneEvenement(v, true)));
    zone.append(ul);
  }

  // ----------------------------- Fiche d'un élève ------------------------------
  async function ficheEleve(id, missionCiblee) {
    const e = etat.eleves.find((x) => x.id === id);
    if (!e) return;
    const x = analyser(e);
    const contenu = el("div.fiche-eleve");
    const f = P.ouvrir(contenu, { titre: `${e.avatar} ${echapper(e.pseudo)}`, tiroir: true, classe: "tiroir-large" });
    const zoneCode = el("code.code-prof", null, e.code);
    contenu.append(el("div.fiche-chiffres", null,
      el("span", null, el("strong", null, `${e.faites_principal}/${PRINCIPALES.length}`), " principales"),
      el("span", null, el("strong", null, `${e.faites_bonus}/${BNL.MISSIONS_BONUS.length}`), " bonus"),
      el("span", null, el("strong", null, String(e.xp)), " XP"),
      el("span", null, el("strong", null, String(e.etoiles)), " ★"),
      el("span", null, el("strong", null, duree(x.tempsTotal)), " de travail"),
      el("span", null, x.enLigne ? "🟢 en ligne" : "vu " + depuis(e.vu_le))));
    contenu.append(el("div.fiche-code", null, el("span", null, "Code d'expédition : "), zoneCode));
    contenu.append(el("div.fiche-actions", null,
      el("button.bouton.petit", { type: "button", onclick: () => nouveauCode(e, zoneCode) }, "Nouveau code"),
      el("button.bouton.petit", { type: "button", onclick: () => renommer(e) }, "Renommer"),
      el("button.bouton.petit.discret", { type: "button", onclick: () => supprimerEleve(e, f) }, "Supprimer cet élève")));
    const comps = el("ul.liste-competences");
    Object.entries(BNL.COMPETENCES).forEach(([cid, c]) => {
      const v = x.comps[cid];
      if (!v.total) return;
      comps.append(el("li", null, el("span.comp-nom", null, `${c.icone} ${c.nom}`),
        el("span.barre-progres", null, el("span", { style: { width: Math.round(100 * v.faites / v.total) + "%" } })), el("span.comp-compte", null, `${v.faites}/${v.total}`)));
    });
    contenu.append(el("h3", null, "Compétences"), comps);

    const liste = el("div.fiche-missions");
    MISSIONS.forEach((m) => {
      const s = x.ms[m.id];
      if (!s || s.statut === "nouvelle") return;
      const c = statutCase(s);
      const d = el("details.fiche-mission" + (x.courante === m.id ? ".courante" : ""), { "data-mission": m.id, open: m.id === missionCiblee || null });
      d.append(el("summary", null, el("span.case-leg." + c.cls, null, c.txt), el("strong", null, m.titre), el("small", null, bulleInfo(m, s).replace(m.titre + " : ", ""))));
      const corps = el("div.fiche-mission-corps");
      const b = x.brouillons[m.id] || {};
      if (b.code) corps.append(el("h4", null, "Son dernier code"), el("pre.code-statique", { html: colorer(b.code) }));
      if (b.programme && m.parsons) {
        const lignes = [...m.parsons.lignes.map((l) => l.trim()), ...(m.parsons.distracteurs || []).map((l) => l.trim())];
        const code = b.programme.map(([i, n]) => "    ".repeat(n) + (lignes[i] || "?")).join("\n");
        corps.append(el("h4", null, "Ses lignes rangées"), el("pre.code-statique", { html: colorer(code) }));
      }
      if (b.historique && b.historique.length) corps.append(el("h4", null, "Ses commandes réussies"), el("pre.code-statique", { html: colorer(b.historique.map((h) => ">>> " + h).join("\n")) }));
      if (b.reponses) corps.append(el("p.aide-texte", null, "Réponses du tableau : " + b.reponses.join(" | ")));
      if (m.type === "etapes") corps.append(el("p.aide-texte", null, `Étapes : ${s.erreurs || 0} erreur(s)${s.reveles ? `, ${s.reveles} réponse(s) demandée(s)` : ""}. Le détail est dans l'historique ci-dessous.`));
      d.append(corps);
      liste.append(d);
    });
    contenu.append(el("h3", null, "Missions"), liste);
    const journal = el("ul.flux");
    contenu.append(el("h3", null, "Historique"), journal);
    if (missionCiblee) setTimeout(() => { const c = contenu.querySelector(`[data-mission="${missionCiblee}"]`); if (c) c.scrollIntoView({ block: "start" }); }, 100);
    try {
      const evs = await rpc("gb_prof_evenements", { p_secret: etat.secret, p_eleve: id, p_limite: 300 });
      if (!evs.length) journal.append(el("li.vide", null, "Aucun événement."));
      evs.forEach((v) => journal.append(ligneEvenement(v, false)));
    } catch (err) { journal.append(el("li.vide", null, err.message)); }
  }

  function renommer(e) {
    const champ = el("input", { type: "text", maxlength: 24, value: e.pseudo, autofocus: true });
    const msg = el("p.message-formulaire");
    const ok = el("button.bouton.principal", { type: "button" }, "Enregistrer");
    const f = P.ouvrir(el("div.formulaire", null, el("p", null, "Nouveau prénom ou pseudo :"), champ, msg, el("div.boutons", null, ok)), { titre: "Renommer", classe: "petite" });
    ok.addEventListener("click", async () => {
      try {
        await rpc("gb_prof_renommer_eleve", { p_secret: etat.secret, p_eleve: e.id, p_pseudo: champ.value });
        P.fermer(f);
        rafraichir();
      } catch (err) { msg.textContent = err.message; }
    });
  }

  async function supprimerEleve(e, fiche) {
    const ok = await P.confirmer(`Supprimer **${e.pseudo}** et toute sa progression ? C'est définitif.`, { titre: "Supprimer l'élève", oui: "Supprimer" });
    if (!ok) return;
    try {
      await rpc("gb_prof_supprimer_eleve", { p_secret: etat.secret, p_eleve: e.id });
      P.fermer(fiche);
      P.toast("Élève supprimé.");
      rafraichir();
    } catch (err) { P.toast("⚠️ " + echapper(err.message), { type: "erreur" }); }
  }

  // ----------------------------- Classes ---------------------------------------
  function gererClasses() {
    const contenu = el("div.gestion-classes");
    const f = P.ouvrir(contenu, { titre: "Gérer les classes", classe: "petite" });
    async function rendre() {
      etat.classes = await rpc("gb_prof_classes", { p_secret: etat.secret });
      contenu.innerHTML = "";
      const nom = el("input", { type: "text", maxlength: 40, placeholder: "Ex. : TNSI 1" });
      const msg = el("p.message-formulaire");
      const creer = el("button.bouton.principal", { type: "button" }, "Créer");
      creer.addEventListener("click", async () => {
        try {
          const id = await rpc("gb_prof_creer_classe", { p_secret: etat.secret, p_nom: nom.value });
          etat.classeId = id;
          ecrireSession("gb.prof.classe", id);
          rendre();
        } catch (err) { msg.textContent = err.message; }
      });
      contenu.append(el("div.nouvelle-classe", null, nom, creer), msg);
      const ul = el("ul.liste-classes");
      etat.classes.forEach((c) => {
        const ouverte = el("input", { type: "checkbox", checked: c.ouverte || null });
        ouverte.addEventListener("change", async () => {
          await rpc("gb_prof_modifier_classe", { p_secret: etat.secret, p_classe: c.id, p_nom: null, p_ouverte: ouverte.checked });
          P.toast(ouverte.checked ? "Classe ouverte aux inscriptions." : "Classe fermée : plus de nouvelles inscriptions (les codes existants marchent toujours).");
        });
        const suppr = el("button.bouton.petit.discret", { type: "button" }, "Supprimer");
        suppr.addEventListener("click", async () => {
          const ok = await P.confirmer(`Supprimer la classe **${c.nom}** et ses ${c.nb_eleves} élève(s) ? C'est définitif.`, { titre: "Supprimer la classe", oui: "Supprimer" });
          if (!ok) return;
          await rpc("gb_prof_supprimer_classe", { p_secret: etat.secret, p_classe: c.id });
          rendre();
        });
        ul.append(el("li", null, el("div", null, el("strong", null, c.nom), el("small", null, ` · ${c.nb_eleves} élève(s)`)),
          el("label.interrupteur", null, ouverte, el("span", null, "ouverte")), suppr));
      });
      contenu.append(ul,
        el("p.aide-texte", null, "Une classe fermée n'apparaît plus à l'inscription, mais les élèves déjà inscrits continuent avec leur code."),
        el("button.lien", { type: "button", onclick: changerMotDePasse }, "Changer le mot de passe du tableau de bord"));
    }
    rendre().catch((err) => { contenu.append(el("p.message-formulaire", null, err.message)); });
    f.options.surFermeture = () => tableau();
  }

  function changerMotDePasse() {
    const champ = el("input", { type: "password", autocomplete: "new-password", placeholder: "Au moins 8 caractères" });
    const msg = el("p.message-formulaire");
    const ok = el("button.bouton.principal", { type: "button" }, "Changer");
    const f = P.ouvrir(el("div.formulaire", null, champ, msg, el("div.boutons", null, ok)), { titre: "Nouveau mot de passe", classe: "petite" });
    ok.addEventListener("click", async () => {
      try {
        await rpc("gb_prof_changer_mot_de_passe", { p_secret: etat.secret, p_nouveau: champ.value });
        etat.secret = champ.value;
        ecrireSession("gb.prof", champ.value);
        P.fermer(f);
        P.toast("Mot de passe changé.", { type: "succes" });
      } catch (err) { msg.textContent = err.message; }
    });
  }

  // ----------------------------- Export CSV ------------------------------------
  function exporterCSV() {
    const classe = etat.classes.find((c) => c.id === etat.classeId);
    const entetes = ["pseudo", "code", "xp", "missions_principales", "missions_bonus", "etoiles", "badges", "temps_total_min", "derniere_connexion"];
    Object.values(BNL.COMPETENCES).forEach((c) => entetes.push("competence_" + c.nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")));
    MISSIONS.forEach((m) => entetes.push(`${m.id}_statut`, `${m.id}_etoiles`, `${m.id}_erreurs`, `${m.id}_indices`, `${m.id}_reponse_vue`, `${m.id}_temps_min`));
    const lignes = [entetes];
    etat.eleves.forEach((e) => {
      const x = analyser(e);
      const l = [e.pseudo, e.code, e.xp, e.faites_principal, e.faites_bonus, e.etoiles, e.badges, Math.round(x.tempsTotal / 60), new Date(e.vu_le).toLocaleString("fr-FR")];
      Object.keys(BNL.COMPETENCES).forEach((c) => l.push(`${x.comps[c].faites}/${x.comps[c].total}`));
      MISSIONS.forEach((m) => {
        const s = x.ms[m.id] || {};
        l.push(s.statut || "", s.etoiles || "", s.essais || 0, (s.indices || 0) + (s.indicesCmd || 0), aideVue(s) ? "oui" : "", Math.round((s.temps || 0) / 60));
      });
      lignes.push(l);
    });
    const csv = "﻿" + lignes.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = el("a", { href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), download: `gombessa-${(classe ? classe.nom : "classe").replace(/\W+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.append(a);
    a.click();
    a.remove();
  }

  // ---------------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    if (!URL_SERVEUR || !CLE) return ecranConfiguration();
    if (etat.secret) tableau(); else ecranConnexion();
  });
})();
