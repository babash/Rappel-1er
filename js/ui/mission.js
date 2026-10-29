// Affichage et déroulement d'une mission : en-tête, objectif, récit, rappel de cours,
// activité (voir activites.js), aides progressives, détection des difficultés, réussite.
window.BNL = window.BNL || {};

BNL.Mission = (() => {
  const { $, $$, el, md, colorer } = BNL.U;
  const P = BNL.Panneaux;
  const S = BNL.Store;
  const cfg = window.BNL_CONFIG || {};
  const DELAIS = cfg.DELAIS_INDICES_S || [90, 180, 300];

  const TYPES = {
    etapes: { nom: "Étapes", icone: "👆" },
    commande: { nom: "Console", icone: "⌨️" },
    parsons: { nom: "Lignes à ordonner", icone: "🧩" },
    trace: { nom: "Tableau d'avancement", icone: "📋" },
    code: { nom: "Programme", icone: "💻" },
  };
  const FICHE_ERREUR = {
    SyntaxError: "syntaxe", IndentationError: "syntaxe", TabError: "syntaxe", NameError: "syntaxe",
    KeyError: "dicos-acces", IndexError: "listes-indices", TypeError: "erreurs", AttributeError: "erreurs",
    ValueError: "dicos-parcours", UnboundLocalError: "syntaxe",
  };

  let mission = null;
  let editeurs = [];
  let dossier = null;
  let minuteurTemps = null;
  let derniereActivite = Date.now();
  let coachInactiviteMontre = false;
  let echecsDeSuite = 0;
  let actionsSolution = { remplir: null, mettre: null };

  const chapitre = (m) => BNL.CHAPITRES.find((c) => c.id === m.chap);
  const missionsDuChapitre = (m) => S.MISSIONS.filter((x) => x.chap === m.chap);
  const largeEcran = () => window.matchMedia("(min-width: 900px)").matches;

  function themeAce() {
    const t = BNL.THEMES.find((x) => x.id === S.etat.theme) || BNL.THEMES[0];
    return t.ace;
  }

  function lieuTexte(c) {
    if (!c) return "";
    if (c.bonus) return `Expédition bonus · ${c.titre}`;
    const n = BNL.CHAPITRES.filter((x) => !x.bonus).indexOf(c);
    return `Balise ${n + 1} sur 7 · ${c.titre} · ${c.prof ? "−" + c.prof + " m" : "surface"}`;
  }

  // ---------------------------------------------------------------------------
  //  Ouverture
  // ---------------------------------------------------------------------------
  // Bits de ms.vu : 1 = scène vue, 2 = briefing lu, 4 = plan fait
  const VU_SCENE = 1, VU_BRIEFING = 2, VU_PLAN = 4;
  let ouverture = 0;

  async function ouvrir(id, options = {}) {
    const m = S.PAR_ID[id];
    if (!m) return;
    if (!S.debloquee(id)) {
      P.toast("🔒 Cette mission n'est pas encore ouverte : termine d'abord les précédentes.");
      return;
    }
    const jeton = ++ouverture;
    P.fermerCoach();
    if (window.speechSynthesis) speechSynthesis.cancel();
    mission = m;
    dossier = null;
    echecsDeSuite = 0;
    coachInactiviteMontre = false;
    actionsSolution = { remplir: null, mettre: null };
    editeurs.forEach((e) => { try { e.destroy(); } catch (err) { /* rien */ } });
    editeurs = [];
    const ms = S.m(id);
    if (ms.statut === "nouvelle") {
      ms.statut = "en_cours";
      S.journal("debut", id);
    }
    S.etat.courante = id;
    S.sauver();
    rendreDossier();
    rendreTravail();
    chargerDossier();
    demarrerChrono();
    const jeu = $(".jeu");
    if (jeu) jeu.scrollTop = 0;
    $$(".colonne-dossier, .espace-travail").forEach((z) => { z.scrollTop = 0; });
    window.scrollTo(0, 0);
    BNL.App.majEntete();
    // Première visite : la scène (lecture obligatoire), puis le briefing de cours.
    if (!((ms.vu || 0) & VU_SCENE) && ms.statut !== "reussie" && m.recit && m.recit.length) {
      await jouerScene(m, true);
      if (jeton !== ouverture) return;
      ms.vu = (ms.vu || 0) | VU_SCENE;
      S.sauver();
      rendreDossier();
    }
    if (!((ms.vu || 0) & VU_BRIEFING) && ms.statut !== "reussie" && m.rappel) {
      await briefing(m, true);
      if (jeton !== ouverture) return;
      ms.vu = (ms.vu || 0) | VU_BRIEFING;
      S.sauver();
    }
    if (jeton !== ouverture) return;
    $$(".colonne-dossier, .espace-travail").forEach((z) => { z.scrollTop = 0; });
    window.scrollTo(0, 0);
    BNL.App.surOuvertureMission(m, options);
  }

  // Carte de titre quand on entre dans un nouveau chapitre
  function carteChapitre(m) {
    const c = chapitre(m);
    const duChap = missionsDuChapitre(m);
    if (!c || duChap[0] !== m) return null;
    if (c.bonus) return { type: "titre", sur: "EXPÉDITION BONUS", texte: c.titre.toUpperCase(), sous: c.theme };
    const n = BNL.CHAPITRES.filter((x) => !x.bonus).indexOf(c);
    return { type: "titre", sur: `CHAPITRE ${n + 1}`, texte: c.titre.toUpperCase(), sous: `${c.prof ? "−" + c.prof + " m" : "surface"} · ${c.theme}` };
  }

  function jouerScene(m, obligatoire) {
    const titre = carteChapitre(m);
    const cases = (titre ? [titre] : []).concat(m.recit || []);
    return BNL.Manga.jouer(cases, {
      titre: m.titre, ambiance: m.chap, obligatoire,
      replique: obligatoire ? m.replique : null,
      boutonFin: obligatoire ? (m.rappel ? "Voir le briefing ▶" : "Commencer la mission ▶") : "Fermer",
    });
  }

  // Le briefing : le rappel de cours, à lire (et fermer) avant de commencer
  function briefing(m, obligatoire) {
    return new Promise((resoudre) => {
      const r = m.rappel;
      const corps = el("div.briefing-corps", null, el("h3", null, "📌 " + r.titre), el("div", { html: md(r.texte, { essayer: true }) }));
      if (r.anim) {
        const boite = el("div.rappel-anim");
        const bouton = el("button.bouton.petit", { type: "button" }, "▶ Voir l'algorithme pas à pas");
        bouton.addEventListener("click", () => {
          bouton.remove();
          const [nom, tab] = listeNombres(m);
          BNL.Visu.animation(boite, r.anim, tab, nom);
        });
        boite.append(bouton);
        corps.append(boite);
      }
      corps.addEventListener("click", (e) => {
        const b = e.target.closest("[data-essayer]");
        if (b) BNL.Outils.bacASable(BNL.U.codesEssai[b.dataset.essayer]);
      });
      const ecouter = BNL.U.peutLire() ? el("button.bouton.petit", { type: "button" }, "🔊 Écouter") : null;
      if (ecouter) ecouter.addEventListener("click", () => BNL.U.lire(r.titre + ". " + r.texte, ecouter));
      const ok = el("button.bouton.principal.large", { type: "button" }, obligatoire ? "C'est noté : je commence ✓" : "Fermer");
      const contenu = el("div.briefing", null,
        el("div.briefing-tete", { html: BNL.Persos.dessin("luci", "neutre") },
          el("div", null, el("strong", null, "BRIEFING"), el("p", null, obligatoire ? "Avant la mission, lis ce rappel. Il contient tout ce qu'il faut savoir." : "Le rappel de cours de cette mission."))),
        corps,
        el("div.briefing-pied", null, el("div", null, ecouter, r.memo ? el("button.lien", { type: "button", onclick: () => BNL.Outils.memo(r.memo) }, " 📒 Fiche complète dans le mémo") : null), ok));
      const f = P.ouvrir(contenu, { classe: "fenetre-briefing", bloquant: obligatoire, titre: obligatoire ? null : "Briefing de LUCI", surFermeture: () => { if (window.speechSynthesis) speechSynthesis.cancel(); resoudre(true); } });
      ok.addEventListener("click", () => P.fermer(f));
      if (obligatoire) S.journal("briefing", m.id);
    });
  }

  // ---------------------------------------------------------------------------
  //  Colonne de gauche : l'histoire et le rappel
  // ---------------------------------------------------------------------------
  function rendreDossier() {
    const m = mission;
    const ms = S.m(m.id);
    const c = chapitre(m);
    const duChap = missionsDuChapitre(m);
    const zone = $(".colonne-dossier");
    zone.innerHTML = "";
    const type = TYPES[m.type] || TYPES.code;
    zone.append(el("header.mission-tete", null,
      el("div.mission-lieu", null, lieuTexte(c)),
      el("h1.mission-titre", null, m.titre),
      el("div.mission-etat", null,
        el("span.pastille", null, `Mission ${duChap.indexOf(m) + 1} sur ${duChap.length}`),
        el("span.pastille", null, `${type.icone} ${type.nom}`),
        ms.statut === "reussie" ? el("span.pastille.reussie", null, "Réussie " + "★".repeat(ms.etoiles || 1)) : null)));

    if (m.recit && m.recit.length) {
      const recit = el("section.recit.scene-recap", { "aria-label": "L'histoire" });
      const dialogues = m.recit.filter((c) => c.qui && c.qui !== "narration" && c.type !== "titre");
      const derniere = dialogues[dialogues.length - 1] || m.recit[m.recit.length - 1];
      const cases = [derniere];
      if (m.replique && ((ms.vu || 0) & VU_SCENE || ms.statut === "reussie")) cases.push({ qui: "toi", texte: m.replique.choix[m.replique.bonne] });
      recit.append(el("h2", null, "📖 L'histoire"), BNL.Manga.planche(cases, { ambiance: m.chap }),
        el("div.scene-recap-boutons", null,
          el("button.bouton.petit", { type: "button", onclick: () => jouerScene(m, false) }, "▶ Revoir la scène"),
          m.rappel ? el("button.bouton.petit", { type: "button", onclick: () => briefing(m, false) }, "📌 Revoir le briefing") : null));
      zone.append(recit);
    }

    if (m.rappel) {
      const r = m.rappel;
      const details = el("details.rappel", { open: (ms.statut !== "reussie" && largeEcran()) || null });
      details.append(el("summary", null, el("span.rappel-icone", { "aria-hidden": "true" }, "📌"),
        el("span", null, "Rappel de cours : ", el("strong", null, r.titre))));
      const corps = el("div.rappel-corps", { html: md(r.texte, { essayer: true }) });
      if (r.anim) {
        const boite = el("div.rappel-anim");
        const bouton = el("button.bouton.petit", { type: "button" }, "▶ Voir l'algorithme pas à pas");
        bouton.addEventListener("click", () => {
          bouton.remove();
          const [nom, tab] = listeNombres(m);
          BNL.Visu.animation(boite, r.anim, tab, nom);
        });
        boite.append(bouton);
        corps.append(boite);
      }
      if (r.memo) corps.append(el("button.lien", { type: "button", onclick: () => BNL.Outils.memo(r.memo) }, "📒 Voir la fiche complète dans le mémo"));
      details.append(corps);
      corps.addEventListener("click", (e) => {
        const b = e.target.closest("[data-essayer]");
        if (b) BNL.Outils.bacASable(BNL.U.codesEssai[b.dataset.essayer]);
      });
      zone.append(details);
    }

    if (m.setup && ["code", "commande", "parsons"].includes(m.type)) {
      zone.append(el("section.dossier-donnees", null,
        el("h2", null, "📁 Les données de LUCI"),
        el("p.aide-texte", null, "Ces variables sont déjà chargées : tu peux les utiliser directement."),
        el("div.bloc-code", null, el("pre.code-statique", { html: colorer(m.setup) })),
        el("div.dossier-visu", { "data-visu-dossier": "1" })));
    }
  }

  // Liste de nombres pour l'animation (données de la mission)
  function listeNombres(m) {
    for (const [nom, v] of Object.entries(m.donnees || {})) {
      if (Array.isArray(v) && v.every((x) => typeof x === "number")) return [nom, v];
    }
    const t = (m.setup || "").match(/^(\w+)\s*=\s*\[([-\d.,\s]+)\]/m);
    if (t) return [t[1], t[2].split(",").map(Number).filter((x) => !Number.isNaN(x))];
    return ["liste", [5, 2, 8, 1, 9, 3]];
  }

  async function chargerDossier() {
    const id = mission.id;
    if (!mission.setup || !["code", "commande", "parsons"].includes(mission.type)) {
      BNL.Editeur.definirContexte({});
      return;
    }
    const r = await BNL.Python.executer({ action: "dossier", setup: mission.setup });
    if (!mission || mission.id !== id || !r || !r.ok) return;
    dossier = r;
    BNL.Editeur.definirContexte(r);
    const visu = $("[data-visu-dossier]");
    const donnees = r.variables.filter((v) => v.val.t !== "func");
    if (visu && donnees.length) {
      visu.innerHTML = "";
      const bouton = el("button.lien", { type: "button" }, "🔍 Voir les données en dessin");
      const dessin = el("div.dossier-dessin", { hidden: true, html: BNL.Visu.variables(donnees) });
      bouton.addEventListener("click", () => {
        dessin.hidden = !dessin.hidden;
        bouton.textContent = dessin.hidden ? "🔍 Voir les données en dessin" : "Masquer le dessin";
      });
      visu.append(bouton, dessin);
    }
  }

  // ---------------------------------------------------------------------------
  //  Colonne de droite : objectif, activité, aides
  // ---------------------------------------------------------------------------
  function rendreTravail() {
    const m = mission;
    const zone = $(".espace-travail");
    zone.innerHTML = "";
    const comp = BNL.COMPETENCES[m.competence] || null;
    const objectif = el("section.objectif", { "aria-label": "Ton objectif" },
      el("div.objectif-icone", { "aria-hidden": "true" }, "🎯"),
      el("div.objectif-texte", null,
        el("div.objectif-titre", null, "Ton objectif",
          comp ? el("span.badge-competence", { title: comp.aide, "data-competence": m.competence }, `${comp.icone} ${comp.nom}`) : null),
        el("p", { html: BNL.U.enLigne(m.objectif || "") })));
    if (BNL.U.peutLire()) {
      const b = el("button.bouton-lire", { type: "button", title: "Écouter l'objectif", "aria-label": "Écouter l'objectif" }, "🔊");
      b.addEventListener("click", () => BNL.U.lire("Ton objectif : " + m.objectif, b));
      objectif.append(b);
    }
    zone.append(objectif);
    if (m.consigne) zone.append(el("section.consigne", null, el("h2", null, "Ce qu'il faut faire"), el("div", { html: md(m.consigne) })));
    const activite = el("section.activite", { "aria-label": "Activité" });
    zone.append(activite);
    zone.append(el("section.aides", { "aria-label": "Aide" }));
    const ctx = contexte(activite);
    const ms = S.m(m.id);
    const lancerActivite = () => { (BNL.Activites[m.type] || BNL.Activites.code)(ctx); rendreAides(); majEtatPython(); };
    if (m.avant && m.avant.length) {
      const zonePlan = el("div.plan");
      activite.append(zonePlan);
      const sousZone = el("div.activite-principale");
      activite.append(sousZone);
      ctx.zone = sousZone;
      if ((ms.vu || 0) & VU_PLAN || ms.statut === "reussie") {
        zonePlan.replaceWith(BNL.Activites.resumePlan(m));
        lancerActivite();
      } else {
        BNL.Activites.plan(ctx, zonePlan, () => {
          ms.vu = (ms.vu || 0) | VU_PLAN;
          S.sauver();
          S.journal("plan", m.id, { ok: true });
          zonePlan.replaceWith(BNL.Activites.resumePlan(m));
          lancerActivite();
          P.toast("✓ Plan validé : à toi de coder !", { type: "succes" });
          const cible = $(".activite-principale");
          if (cible) cible.scrollIntoView({ block: "start", behavior: "smooth" });
        });
        rendreAides();
      }
      return;
    }
    lancerActivite();
  }

  function contexte(zone) {
    const m = mission;
    const ms = S.m(m.id);
    return {
      mission: m, ms, zone,
      themeAce,
      dossier: () => dossier,
      actif: () => { derniereActivite = Date.now(); },
      sauver: (immediat) => S.sauver(immediat),
      journal: (type, extra) => S.journal(type, m.id, extra || {}),
      brouillon: (cle) => S.brouillon(m.id, cle),
      setBrouillon: (cle, v) => S.setBrouillon(m.id, cle, v),
      enregistrerEditeur: (ed) => editeurs.push(ed),
      reussir: (o) => reussir(o || {}),
      echec: (r, code) => echec(r, code),
      boiteEchec,
      surSolution: (remplir, mettre) => { actionsSolution = { remplir: remplir || null, mettre: mettre || null }; },
      surLancer: () => {},
    };
  }

  // ---------------------------------------------------------------------------
  //  Aides : indices progressifs et correction
  // ---------------------------------------------------------------------------
  const avecIndices = () => ["code", "parsons", "trace"].includes(mission.type) && (!mission.avant || !!((S.m(mission.id).vu || 0) & VU_PLAN) || S.m(mission.id).statut === "reussie");

  function etatAide(n) {
    // n = 1, 2, 3 pour les indices, 4 pour la correction
    const ms = S.m(mission.id);
    if (ms.statut === "reussie" || n === 1) return { ouvert: true };
    if ((ms.indices || 0) < n - 1) return { ouvert: false, raison: n === 4 ? "Ouvre d'abord l'indice 3" : `Ouvre d'abord l'indice ${n - 1}` };
    const essaisRequis = n - 1;
    const delai = DELAIS[n - 2];
    if ((ms.essais || 0) >= essaisRequis || (ms.temps || 0) >= delai) return { ouvert: true };
    const manque = essaisRequis - (ms.essais || 0);
    const reste = Math.max(0, delai - (ms.temps || 0));
    const temps = reste >= 60 ? `${Math.ceil(reste / 60)} min` : `${Math.ceil(reste)} s`;
    return { ouvert: false, raison: `Après ${manque > 1 ? manque + " essais de plus" : "un essai de plus"}, ou dans ${temps}` };
  }

  function rendreAides() {
    const zone = $(".aides");
    if (!zone || !mission) return;
    const ms = S.m(mission.id);
    zone.innerHTML = "";
    if (!avecIndices()) {
      zone.append(el("p.aide-info", null, mission.avant && !((ms.vu || 0) & VU_PLAN) && ms.statut !== "reussie"
        ? "💡 Après une erreur, une aide apparaît sous l'étape. Le briefing et le mémo sont toujours là."
        : mission.type === "commande"
        ? "💡 Bloqué·e sur une commande ? Après une erreur, un bouton « Indice » apparaît sous la console."
        : "💡 Après une erreur, une aide apparaît sous l'étape. Le briefing et le mémo sont toujours là."),
        el("button.lien", { type: "button", onclick: () => BNL.Outils.memo() }, "📒 Ouvrir le mémo"));
      return;
    }
    zone.append(el("h2", null, "💡 Besoin d'aide ?"));
    (mission.indices || []).forEach((texte, i) => {
      const n = i + 1;
      const vu = (ms.indices || 0) >= n;
      const e = etatAide(n);
      const bloc = el("div.indice" + (vu ? ".vu" : ""));
      if (vu) {
        bloc.append(el("div.indice-titre", null, `Indice ${n}`), el("div.indice-texte", { html: md(texte) }));
      } else {
        const b = el("button.bouton-indice", { type: "button", disabled: !e.ouvert || null },
          el("span", null, e.ouvert ? `Indice ${n}` : `🔒 Indice ${n}`),
          el("small", null, e.ouvert ? (n === 1 ? "Une piste pour démarrer" : n === 2 ? "Plus précis" : "Presque la réponse") : e.raison));
        b.addEventListener("click", () => ouvrirIndice(n));
        bloc.append(b);
      }
      zone.append(bloc);
    });
    const aSolution = mission.solution || mission.type === "trace";
    if (aSolution) {
      const e = etatAide(4);
      if (ms.solution) {
        const sol = el("div.solution", null, el("div.indice-titre", null, "La correction"));
        if (mission.type === "trace") {
          sol.append(el("p.aide-texte", null, "Les bonnes réponses sont écrites dans le tableau (en bleu). Vérifie que tu comprends chaque case, puis clique sur « Vérifier mes réponses »."));
        } else {
          sol.append(el("div.bloc-code", null, el("pre.code-statique", { html: colorer(mission.solution) })));
          if (ms.statut !== "reussie") {
            if (mission.type === "parsons") {
              sol.append(el("p.aide-texte", null, "Les lignes sont rangées dans ton programme. Lis chaque ligne et son décalage, puis clique sur « Vérifier mon programme »."));
            } else {
              sol.append(el("p.aide-texte", null, "Lis chaque ligne et demande-toi ce qu'elle fait. Tu peux ensuite la mettre dans l'éditeur et la lancer pour valider la mission."));
              if (actionsSolution.mettre) sol.append(el("button.bouton.petit", { type: "button", onclick: actionsSolution.mettre }, "Mettre la correction dans l'éditeur"));
            }
          }
        }
        zone.append(sol);
      } else {
        const b = el("button.bouton-solution", { type: "button", disabled: !e.ouvert || null },
          el("span", null, e.ouvert ? "Voir la correction" : "🔒 Voir la correction"),
          el("small", null, e.ouvert ? "Seulement si tu es vraiment bloqué·e" : e.raison));
        b.addEventListener("click", ouvrirSolution);
        zone.append(b);
      }
    }
    if (ms.statut !== "reussie") zone.append(el("p.aide-prof", null, "Tu peux aussi lever la main : ton professeur voit où tu en es 🙋"));
  }

  function ouvrirIndice(n) {
    const ms = S.m(mission.id);
    if (!etatAide(n).ouvert) return;
    P.fermerCoach();
    if ((ms.indices || 0) < n) {
      ms.indices = n;
      S.journal("indice", mission.id, { detail: "Indice " + n });
      S.sauver();
    }
    rendreAides();
    const bloc = $$(".aides .indice")[n - 1];
    if (bloc) bloc.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  async function ouvrirSolution() {
    if (!etatAide(4).ouvert) return;
    const ok = await P.confirmer("La correction te donnera moins d'étoiles (★). As-tu bien relu l'indice 3 ?\n\nTu peux aussi demander de l'aide à ton professeur.", { titre: "Voir la correction ?", oui: "Voir la correction", non: "Je réessaie" });
    if (!ok) return;
    const ms = S.m(mission.id);
    ms.solution = true;
    ms.indices = Math.max(ms.indices || 0, (mission.indices || []).length);
    S.journal("solution", mission.id);
    S.sauver();
    if (actionsSolution.remplir) actionsSolution.remplir();
    rendreAides();
    const sol = $(".aides .solution");
    if (sol) sol.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  // ---------------------------------------------------------------------------
  //  Échec : enregistrement et aide proactive
  // ---------------------------------------------------------------------------
  function echec(r, code) {
    const ms = S.m(mission.id);
    if (ms.statut !== "reussie") ms.essais = (ms.essais || 0) + 1;
    echecsDeSuite++;
    const typeErreur = r.erreur ? r.erreur.type : r.phase === "verification" ? "Résultat" : r.phase;
    ms.types = ms.types || {};
    ms.types[typeErreur] = (ms.types[typeErreur] || 0) + 1;
    S.journal("essai", mission.id, {
      ok: false,
      detail: ((r.erreur ? `${r.erreur.type} (ligne ${r.erreur.ligne || "?"}) : ${r.erreur.brut}` : "") +
        (r.message ? (r.erreur ? " | " : "") + BNL.U.texteBrut(r.message) : "")).slice(0, 500),
      code: code || null,
    });
    S.sauver();
    rendreAides();
    aideProactive(r);
  }

  function boiteEchec(r) {
    const boite = el("div.v-message.v-erreur");
    if (r.phase === "temps" || (r.erreur && r.phase !== "verification")) {
      const e = r.erreur;
      boite.append(el("div.v-titre", null, el("span.v-pictogramme", { "aria-hidden": "true" }, r.phase === "temps" ? "⏳" : "🛑"),
        el("strong", null, e.titre), e.ligne ? el("span.v-ligne", null, ` ligne ${e.ligne}`) : null));
      if (r.phase === "fonction" && r.message) boite.append(el("p", { html: md(r.message) }));
      if (e.texte_ligne) boite.append(el("pre.v-code", { html: colorer(e.texte_ligne) }));
      boite.append(el("p.v-explication", { html: md(e.explication) }));
      if (e.brut) boite.append(el("p.v-brut", null, el("span", null, "Ce que dit Python : "), el("code", null, e.brut)));
      const fiche = FICHE_ERREUR[e.type];
      if (fiche) boite.append(el("button.lien", { type: "button", onclick: () => BNL.Outils.memo(fiche) }, "📒 Revoir la fiche du mémo"));
    } else if (r.phase === "indisponible") {
      boite.append(el("p", null, "Python n'a pas pu démarrer : impossible de tester ton programme pour l'instant."));
      BNL.Python.aideEchec().forEach((l) => boite.append(el("p.aide-texte", { html: BNL.U.enLigne(l) })));
    } else if (r.phase === "interne" && !r.message) {
      boite.append(el("p", null, "Un problème technique a empêché la vérification. Relance ; si cela continue, préviens ton professeur."));
      if (r.interne) boite.append(el("p.v-brut", null, el("code", null, r.interne)));
    } else {
      boite.classList.replace("v-erreur", "v-pasencore");
      boite.append(el("div.v-titre", null, el("span.v-pictogramme", { "aria-hidden": "true" }, "🔎"), el("strong", null, "Pas encore… mais ton programme fonctionne !")),
        el("p.v-explication", { html: md(r.message || "Le résultat n'est pas encore celui attendu.") }));
    }
    return boite;
  }

  function aideProactive(r) {
    const ms = S.m(mission.id);
    const dans = $(".espace-travail");
    if (!avecIndices()) return;
    if (echecsDeSuite === 2 && !ms.indices) {
      P.coach("Tu bloques ? Pas de souci : **l'indice 1** est là pour t'aider à démarrer.", [{ texte: "Voir l'indice 1", principal: true, action: () => ouvrirIndice(1) }], { dans });
      return;
    }
    if (r.erreur && FICHE_ERREUR[r.erreur.type] && ms.types[r.erreur.type] === 3) {
      P.coach(`Trois fois la même erreur (**${r.erreur.titre.toLowerCase()}**). Une fiche du mémo explique exactement ce problème.`,
        [{ texte: "Ouvrir la fiche", principal: true, action: () => BNL.Outils.memo(FICHE_ERREUR[r.erreur.type]) }], { dans });
      return;
    }
    if (ms.essais === 6 && !ms.solution) {
      P.coach("Courage ! Chaque essai t'apprend quelque chose. Relis l'indice le plus récent, ou **lève la main** : ton professeur sait que tu travailles sur cette mission.", [], { dans });
      return;
    }
    const prochain = [2, 3, 4].find((n) => n === (ms.indices || 0) + 1 && etatAide(n).ouvert && ms.indices >= 1);
    if (prochain && echecsDeSuite >= 2) {
      P.coach(prochain === 4 ? "Si tu es vraiment bloqué·e, la correction est maintenant disponible." : `L'**indice ${prochain}** est maintenant disponible.`,
        [{ texte: prochain === 4 ? "Voir la correction" : `Voir l'indice ${prochain}`, principal: true, action: () => (prochain === 4 ? ouvrirSolution() : ouvrirIndice(prochain)) }], { dans });
    }
  }

  function majEtatPython(etat) {
    etat = etat || BNL.Python.etat();
    $$(".etat-python").forEach((zone) => {
      zone.className = "etat-python " + etat;
      zone.textContent = etat === "chargement" ? "⏳ Python se prépare…" : etat === "erreur" ? "⚠️ Python n'a pas pu démarrer" : "";
      if (etat === "erreur") {
        zone.setAttribute("role", "button");
        zone.tabIndex = 0;
        zone.onclick = () => BNL.App.diagnosticPython();
      }
    });
  }

  // ---------------------------------------------------------------------------
  //  Chronomètre (temps actif) et détection d'inactivité
  // ---------------------------------------------------------------------------
  function demarrerChrono() {
    clearInterval(minuteurTemps);
    derniereActivite = Date.now();
    let compteur = 0;
    minuteurTemps = setInterval(() => {
      if (!mission || document.hidden || P.enCours() > 0 || document.body.classList.contains("scene-ouverte")) return;
      const ms = S.m(mission.id);
      const actif = Date.now() - derniereActivite < 120000;
      if (actif && ms.statut !== "reussie") {
        ms.temps = (ms.temps || 0) + 5;
        if (++compteur % 6 === 0) S.sauver();
        if (avecIndices() && DELAIS.some((d) => ms.temps === d || ms.temps === d + 5)) rendreAides();
      }
      if (!coachInactiviteMontre && ms.statut !== "reussie" && mission.type === "code" &&
          Date.now() - derniereActivite > 150000 && (ms.lancers || 0) === 0) {
        coachInactiviteMontre = true;
        P.coach("Tu peux lancer ton code **même s'il n'est pas fini** : les messages d'erreur sont des indices ! Et si l'objectif n'est pas clair, relis le rappel de cours.", [], { dans: $(".espace-travail") });
      }
    }, 5000);
  }
  ["keydown", "mousedown", "touchstart"].forEach((t) => document.addEventListener(t, () => { derniereActivite = Date.now(); }, { passive: true }));

  // ---------------------------------------------------------------------------
  //  Réussite
  // ---------------------------------------------------------------------------
  function calculerEtoiles(ms) {
    if (ms.solution) return 1;
    if ((ms.indices || 0) > 0) return 2;
    if (mission.type === "trace" && (ms.essais || 0) > 2) return 2;
    return 3;
  }

  function reussir(options = {}) {
    const m = mission;
    const ms = S.m(m.id);
    const premiereFois = ms.statut !== "reussie";
    const xpAvant = S.xp();
    const rangAvant = S.rang(xpAvant);
    const chapitreAvant = S.conditions.chapitreFini(m.chap);
    const etoiles = options.etoiles || calculerEtoiles(ms);
    if (premiereFois) {
      ms.statut = "reussie";
      ms.etoiles = etoiles;
      ms.fin = Date.now();
      S.journal("reussite", m.id, {
        ok: true,
        detail: `${etoiles}★, ${ms.essais || 0} erreur(s), ${ms.indices || 0} indice(s)${ms.solution || ms.reveles ? ", correction vue" : ""}, ${BNL.U.duree(ms.temps)}`,
        code: options.code || null,
      });
    }
    const nouveautes = S.evaluerRecompenses();
    S.sauver(true);
    BNL.App.majEntete();
    rendreAides();
    if (!premiereFois) {
      P.toast("✔️ Toujours juste ! Mission déjà réussie.", { type: "succes" });
      return;
    }
    const balise = !chapitreAvant && S.conditions.chapitreFini(m.chap) ? chapitre(m) : null;
    P.confettis();
    setTimeout(() => fenetreReussite(m, ms, S.xp() - xpAvant, nouveautes, rangAvant, balise, options.sortie), m.type === "etapes" ? 250 : 500);
  }

  function fenetreReussite(m, ms, gainXp, nouveautes, rangAvant, balise, sortie) {
    const rangApres = S.rang();
    const contenu = el("div.reussite");
    contenu.append(el("div.tampon", { "aria-hidden": "true" }, m.final ? "OBJECTIF ATTEINT" : "MISSION RÉUSSIE"));
    contenu.append(el("div.reussite-etoiles", { "aria-label": `${ms.etoiles} étoile(s) sur 3` },
      [1, 2, 3].map((i) => el("span" + (i <= ms.etoiles ? ".pleine" : ""), null, "★"))));
    const pourquoi = ["etapes", "commande"].includes(m.type)
      ? (ms.etoiles === 3 ? "Sans erreur, bravo !" : ms.etoiles === 2 ? "Avec quelques erreurs ou un indice : c'est en se trompant qu'on apprend." : "Avec la réponse montrée : relis bien « À retenir ».")
      : (ms.etoiles === 3 ? "Sans indice : bravo pour ton autonomie !" : ms.etoiles === 2 ? "Avec des indices : ils sont faits pour ça." : "Avec la correction : relis bien « À retenir ».");
    const comp = BNL.COMPETENCES[m.competence];
    contenu.append(el("p.reussite-xp", null, el("strong", null, `+${gainXp} XP`), comp ? ` · ${comp.icone} ${comp.nom}` : "", " · ", pourquoi));
    if (rangApres.nom !== rangAvant.nom) {
      contenu.append(el("div.nouveau-rang", null, el("span.grand", null, rangApres.emoji),
        el("div", null, el("strong", null, "Nouveau rang : " + rangApres.nom), el("span", null, "L'équipage te fait confiance."))));
    }
    if (balise) {
      const esp = BNL.ESPECES[balise.carte];
      contenu.append(el("div.balise-allumee", null,
        el("div.balise-titre", null, el("span.balise-feu", { "aria-hidden": "true" }), balise.bonus ? `Expédition terminée : ${balise.titre}` : `Balise allumée : ${balise.titre}`),
        esp ? el("div.carte-espece.mini", null,
          el("div.carte-espece-image", { html: BNL.Illus.carte(balise.carte) }),
          el("div", null, el("span.piece-label", null, "Nouvelle page du carnet de bord"), el("strong", null, esp.nom), el("p", null, esp.faits[0]))) : null));
    }
    if (m.apres && m.apres.length) contenu.append(BNL.Manga.planche(m.apres, { ambiance: m.chap, sortie }));
    if (m.retenir) contenu.append(el("div.retenir", null, el("h3", null, "À retenir"), el("div", { html: md(m.retenir) })));
    const recompenses = [...nouveautes.badges.map((b) => ({ e: b.emoji, t: "Badge : " + b.nom, s: b.aide })),
      ...nouveautes.avatars.map((a) => ({ e: a.emoji, t: "Nouvel emblème : " + a.nom, s: "À choisir dans ton profil" })),
      ...nouveautes.themes.map((t) => ({ e: "🎨", t: "Nouveau thème : " + t.nom, s: "À choisir dans ton profil" }))];
    if (recompenses.length) {
      contenu.append(el("div.recompenses", null, el("h3", null, "Débloqué !"),
        el("ul", null, recompenses.map((r) => el("li", null, el("span.grand", null, r.e), el("div", null, el("strong", null, r.t), el("span", null, r.s)))))));
    }
    const suivante = BNL.App.missionSuivante(m.id);
    const boutons = el("div.boutons");
    let f;
    if (m.final) {
      boutons.append(el("button.bouton.principal", { type: "button", onclick: () => { P.fermer(f); BNL.App.epilogue(); } }, "Voir la rencontre ▶"));
    } else {
      boutons.append(el("button.bouton", { type: "button", onclick: () => P.fermer(f) }, "Rester ici"));
      if (balise && !balise.bonus) boutons.append(el("button.bouton", { type: "button", onclick: () => { P.fermer(f); BNL.Outils.plongee(); } }, "🌊 Voir la plongée"));
      if (suivante) boutons.append(el("button.bouton.principal", { type: "button", onclick: () => { P.fermer(f); ouvrir(suivante); } }, "Mission suivante →"));
      else boutons.append(el("button.bouton.principal", { type: "button", onclick: () => { P.fermer(f); BNL.Outils.plongee(); } }, "Voir la plongée"));
    }
    contenu.append(boutons);
    f = P.ouvrir(contenu, { classe: "fenetre-reussite", titre: m.titre, bloquant: !!m.final });
  }

  BNL.Python.surEtat((etat) => majEtatPython(etat));

  return {
    ouvrir,
    briefing, jouerScene,
    actuelle: () => mission,
    appliquerTheme: () => editeurs.forEach((e) => e.setTheme("ace/theme/" + themeAce())),
    themeAce,
    rendreAides,
    lieuTexte,
    TYPES,
  };
})();
