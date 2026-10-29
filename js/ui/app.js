// Point d'entrée : accueil et code d'expédition, histoire, écran de jeu, en-tête, équipage.
window.BNL = window.BNL || {};

BNL.App = (() => {
  const { $, $$, el, md, echapper } = BNL.U;
  const P = BNL.Panneaux;
  const S = BNL.Store;
  const cfg = window.BNL_CONFIG || {};
  const app = () => $("#app");

  let camarades = [];
  const camaradesAvant = {};
  let minuteurCamarades = null;

  // ---------------------------------------------------------------------------
  //  Thème
  // ---------------------------------------------------------------------------
  function appliquerTheme() {
    const t = BNL.THEMES.find((x) => x.id === S.etat.theme && S.themeDebloque(x)) || BNL.THEMES[0];
    document.documentElement.dataset.theme = t.id;
    document.documentElement.style.colorScheme = t.sombre ? "dark" : "light";
    BNL.Mission.appliquerTheme();
  }

  const logo = () => `<span class="logo" aria-hidden="true">${BNL.Illus.luciole({ faisceau: false })}</span>`;

  // ---------------------------------------------------------------------------
  //  Démarrage
  // ---------------------------------------------------------------------------
  function demarrer() {
    appliquerTheme();
    BNL.Python.demarrer();
    S.surSessionPerdue = (message) => P.toast("⚠️ " + echapper(message), { type: "erreur", duree: 8000 });
    if (S.etat.joueur) ecranRetour();
    else ecranAccueil();
  }

  function etatPython(zone) {
    const maj = (etat) => {
      if (!zone.isConnected) return;
      zone.innerHTML = "";
      if (etat === "pret") zone.append("✅ Python est prêt.");
      else if (etat === "erreur") {
        zone.append("⚠️ Python n'a pas pu démarrer. ", el("button.lien", { type: "button", onclick: diagnosticPython }, "Pourquoi ?"));
      } else zone.append("⏳ Python se charge en arrière-plan (la première fois, quelques secondes)…");
    };
    BNL.Python.surEtat(maj);
  }

  function diagnosticPython() {
    const contenu = el("div.diagnostic");
    contenu.append(el("p", null, "Le site a essayé plusieurs façons de démarrer Python, sans succès."));
    contenu.append(el("ul", null, BNL.Python.aideEchec().map((l) => el("li", { html: BNL.U.enLigne(l) }))));
    if (BNL.Python.fichierLocal) {
      contenu.append(el("p.aide-texte", { html: BNL.U.enLigne("Les questions, les tableaux et les lignes à lire marchent sans Python ; seules la console et les programmes en ont besoin.") }));
    }
    const d = BNL.Python.diagnostic();
    if (d.length) contenu.append(el("details", null, el("summary", null, "Détails techniques (pour le professeur)"), el("pre.v-brut", null, d.join("\n"))));
    P.ouvrir(contenu, { titre: "Python n'a pas pu démarrer", classe: "petite" });
  }

  // ---------------------------------------------------------------------------
  //  Accueil
  // ---------------------------------------------------------------------------
  function cadreAccueil(contenuDroite) {
    const decor = el("div.accueil-decor");
    BNL.Plongee.fond(decor);
    const statut = el("p.etat-chargement", { "aria-live": "polite" });
    const page = el("div.accueil", null, decor,
      el("div.accueil-titre", null,
        el("div.marque-accueil", { html: logo() + "<span>Journal de bord de la Luciole</span>" }),
        el("h1", null, "Expédition Gombessa"),
        el("p", null, "Une plongée en Python pour réviser les listes, les dictionnaires et les premiers algorithmes.")),
      el("div.carte-connexion", null, contenuDroite, statut));
    app().innerHTML = "";
    app().append(page);
    etatPython(statut);
    return page;
  }

  function choixAvatarDepart(nom) {
    const zone = el("div.avatars-depart", { role: "radiogroup", "aria-label": "Choisis ton emblème" });
    BNL.AVATARS.filter((a) => !a.cond).forEach((a, i) => {
      const id = `${nom}-${a.id}`;
      zone.append(el("input", { type: "radio", name: nom, id, value: a.id, checked: i === 0 || null }),
        el("label", { for: id, title: a.nom }, el("span", { "aria-hidden": "true" }, a.emoji), el("span.sr", null, a.nom)));
    });
    return zone;
  }

  function ecranAccueil() {
    const zone = el("div.connexion");
    cadreAccueil(zone);
    if (!S.serveurConfigure) { formulaireHorsLigne(zone); return; }
    zone.append(
      el("h2", null, "Monte à bord"),
      el("div.choix-depart", null,
        el("button.bouton.principal.large.choix-depart-bouton", { type: "button", onclick: () => formulaireInscription(zone) },
          el("span.grand", { "aria-hidden": "true" }, "🚀"), el("span", null, el("strong", null, "Je commence l'expédition"), el("small", null, "Première fois"))),
        el("button.bouton.large.choix-depart-bouton", { type: "button", onclick: () => formulaireCode(zone) },
          el("span.grand", { "aria-hidden": "true" }, "🔑"), el("span", null, el("strong", null, "J'ai déjà un code"), el("small", null, "Je reprends où j'en étais")))));
    if (cfg.AUTORISER_HORS_LIGNE !== false) {
      zone.append(el("button.lien.lien-hors-ligne", { type: "button", onclick: () => formulaireHorsLigne(zone, true) }, "Jouer sans compte (sans suivi de la classe)"));
    }
  }

  function formulaireInscription(zone) {
    zone.innerHTML = "";
    const form = el("form.formulaire", { novalidate: true });
    const selectClasse = el("select#classe", { required: true }, el("option", { value: "" }, "Chargement des classes…"));
    const pseudo = el("input#pseudo", { type: "text", maxlength: 24, autocomplete: "off", spellcheck: "false", required: true, placeholder: "Ton prénom ou un pseudo" });
    const message = el("p.message-formulaire", { role: "alert" });
    const bouton = el("button.bouton.principal.large", { type: "submit" }, "Créer mon code d'expédition");
    form.append(
      el("h2", null, "Nouvelle expédition"),
      el("label.champ", null, el("span.etiquette", null, "1. Ta classe"), selectClasse),
      el("label.champ", null, el("span.etiquette", null, "2. Ton prénom (ou un pseudo)"), pseudo),
      el("div.champ.champ-avatar", null, el("span.etiquette", null, "3. Ton emblème"), choixAvatarDepart("avatar-nouveau")),
      message, bouton,
      el("button.lien", { type: "button", onclick: ecranAccueil }, "← Retour"));
    zone.append(form);
    S.listerClasses().then((classes) => {
      selectClasse.innerHTML = "";
      if (!classes || !classes.length) {
        selectClasse.append(el("option", { value: "" }, "Aucune classe ouverte"));
        message.textContent = "Aucune classe n'est ouverte pour l'instant : ton professeur doit en créer une dans son tableau de bord.";
        return;
      }
      selectClasse.append(el("option", { value: "" }, "Choisis ta classe"));
      classes.forEach((c) => selectClasse.append(el("option", { value: c.id }, c.nom)));
      if (classes.length === 1) selectClasse.value = classes[0].id;
    }).catch((e) => {
      selectClasse.innerHTML = "";
      selectClasse.append(el("option", { value: "" }, "Serveur injoignable"));
      message.textContent = e.message + (cfg.AUTORISER_HORS_LIGNE !== false ? " Tu peux jouer sans compte en attendant." : "");
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      message.textContent = "";
      if (!selectClasse.value) { message.textContent = "Choisis ta classe."; selectClasse.focus(); return; }
      if (pseudo.value.trim().length < 2) { message.textContent = "Ton prénom ou pseudo doit faire au moins 2 caractères."; pseudo.focus(); return; }
      bouton.disabled = true;
      bouton.textContent = "Création du code…";
      try {
        const avatarId = (form.querySelector("input[name='avatar-nouveau']:checked") || {}).value || "crabe";
        const code = await S.inscrire(selectClasse.value, pseudo.value.trim(), avatarId);
        montrerCode(zone, code);
      } catch (err) {
        message.textContent = err.message;
        bouton.disabled = false;
        bouton.textContent = "Créer mon code d'expédition";
      }
    });
    pseudo.focus();
  }

  function lireCode(code, bouton) {
    const texte = String(code).split("-").map((p) => (/^\d+$/.test(p) ? p.split("").join(" ") : p.toLowerCase())).join(", tiret, ");
    BNL.U.lire("Ton code est : " + texte, bouton);
  }

  function montrerCode(zone, code) {
    zone.innerHTML = "";
    const coche = el("input#code-note", { type: "checkbox" });
    const go = el("button.bouton.principal.large", { type: "button", disabled: true }, "Monter à bord");
    coche.addEventListener("change", () => { go.disabled = !coche.checked; });
    go.addEventListener("click", entrerDansLeJeu);
    const ecouter = BNL.U.peutLire() ? el("button.bouton.petit", { type: "button" }, "🔊 Écouter le code") : null;
    if (ecouter) ecouter.addEventListener("click", () => lireCode(code, ecouter));
    zone.append(
      el("h2", null, "Ton code d'expédition"),
      el("p", null, "Ce code est à toi seul et il ne changera jamais. Il te permet de reprendre l'expédition plus tard, depuis n'importe quel ordinateur ou téléphone. Tu le retrouveras à tout moment sur le bouton 🔑."),
      el("div.code-expedition", { "aria-label": "Ton code : " + code }, code),
      ecouter,
      el("ul.code-conseils", null,
        el("li", null, "✍️ Écris-le tout de suite dans ton cahier ou ton agenda."),
        el("li", null, "📸 Ou prends-le en photo."),
        el("li", null, "🤫 Ne le donne pas aux autres : avec ce code, on entre dans TON expédition.")),
      el("label.case-a-cocher", { for: "code-note" }, coche, el("span", null, "J'ai écrit mon code")),
      go);
    coche.focus();
  }

  function formulaireCode(zone) {
    zone.innerHTML = "";
    const form = el("form.formulaire", { novalidate: true });
    const champ = el("input#code", { type: "text", maxlength: 40, autocomplete: "off", autocapitalize: "characters", spellcheck: "false", required: true, placeholder: "CORAIL-MANTA-482", class: "champ-code" });
    const message = el("p.message-formulaire", { role: "alert" });
    const bouton = el("button.bouton.principal.large", { type: "submit" }, "Reprendre mon expédition");
    form.append(el("h2", null, "Reprendre l'expédition"),
      el("label.champ", null, el("span.etiquette", null, "Ton code d'expédition"), champ),
      el("p.aide-texte", null, "Les tirets et les majuscules ne comptent pas. Code perdu ? Ton professeur peut le retrouver."),
      message, bouton, el("button.lien", { type: "button", onclick: ecranAccueil }, "← Retour"));
    zone.append(form);
    champ.addEventListener("input", () => { const p = champ.selectionStart; champ.value = champ.value.toUpperCase(); champ.setSelectionRange(p, p); });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      message.textContent = "";
      if (S.normaliserCode(champ.value).length < 6) { message.textContent = "Écris ton code en entier. Il ressemble à : CORAIL-MANTA-482."; champ.focus(); return; }
      bouton.disabled = true;
      bouton.textContent = "Vérification…";
      try {
        await S.connecter(champ.value);
        entrerDansLeJeu();
      } catch (err) {
        message.textContent = err.message;
        bouton.disabled = false;
        bouton.textContent = "Reprendre mon expédition";
      }
    });
    champ.focus();
  }

  function formulaireHorsLigne(zone, retourPossible) {
    zone.innerHTML = "";
    const form = el("form.formulaire", { novalidate: true });
    const pseudo = el("input#pseudo-local", { type: "text", maxlength: 24, autocomplete: "off", required: true, placeholder: "Ton prénom ou un pseudo" });
    const codeReprise = el("input#code-reprise", { type: "text", maxlength: 40, autocomplete: "off", autocapitalize: "characters", spellcheck: "false", placeholder: "GB-…  (facultatif)", class: "champ-code" });
    const message = el("p.message-formulaire", { role: "alert" });
    form.append(
      el("h2", null, retourPossible ? "Jouer sans compte" : "Monte à bord"),
      el("label.champ", null, el("span.etiquette", null, "Ton prénom (ou un pseudo)"), pseudo),
      el("div.champ.champ-avatar", null, el("span.etiquette", null, "Ton emblème"), choixAvatarDepart("avatar-local")),
      el("p.aide-texte", null, "Sans compte, ta progression reste 1 jour sur cet appareil. (Le code unique d'élève existe quand le professeur a activé le suivi de classe.)"),
      el("details.champ-reprise", null, el("summary", null, "J'ai une sauvegarde (code GB-…)"),
        el("label.champ", null, el("span.etiquette", null, "Code de sauvegarde (il commence par GB-)"), codeReprise)),
      message,
      el("button.bouton.principal.large", { type: "submit" }, "Commencer l'expédition"));
    if (retourPossible) form.append(el("button.lien", { type: "button", onclick: ecranAccueil }, "← Retour"));
    zone.append(form);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (pseudo.value.trim().length < 2) { message.textContent = "Ton prénom ou pseudo doit faire au moins 2 caractères."; pseudo.focus(); return; }
      if (codeReprise.value.trim() && !S.lireCodeProgression(codeReprise.value)) {
        message.textContent = "Ce code de sauvegarde n'est pas valide : vérifie chaque lettre (il commence par GB-).";
        codeReprise.focus();
        return;
      }
      const avatarId = (form.querySelector("input[name='avatar-local']:checked") || {}).value || "crabe";
      S.jouerHorsLigne(pseudo.value.trim(), avatarId);
      if (codeReprise.value.trim()) {
        const n = S.restaurerProgression(codeReprise.value);
        P.toast(`✔️ Progression retrouvée : ${n} mission${n > 1 ? "s" : ""} réussie${n > 1 ? "s" : ""}.`, { type: "succes" });
      }
      entrerDansLeJeu();
    });
    pseudo.focus();
  }

  function ecranRetour() {
    const j = S.etat.joueur;
    const zone = el("div.connexion.carte-retour", null,
      el("div.retour-avatar", { "aria-hidden": "true" }, S.avatar().emoji),
      el("h2", null, `Content de te revoir, ${j.pseudo} !`),
      el("p", null, j.horsLigne ? "Ta progression est gardée sur cet appareil." : `Classe : ${j.classeNom || "?"}`),
      el("p.message-formulaire", { role: "alert" }));
    const continuer = el("button.bouton.principal.large", { type: "button" }, "Continuer l'expédition");
    const pasMoi = el("button.lien", { type: "button" }, "Ce n'est pas moi : changer de joueur");
    zone.append(continuer, pasMoi);
    cadreAccueil(zone);
    continuer.focus();
    continuer.addEventListener("click", async () => {
      continuer.disabled = true;
      continuer.textContent = "Chargement…";
      try {
        await S.reprendre();
        entrerDansLeJeu();
      } catch (e) {
        $(".message-formulaire", zone).textContent = e.message;
        setTimeout(ecranAccueil, 2500);
      }
    });
    pasMoi.addEventListener("click", () => { S.deconnecter(); ecranAccueil(); });
  }

  // ---------------------------------------------------------------------------
  //  Scènes d'histoire (prologue, épilogue) en planches de manga
  // ---------------------------------------------------------------------------
  async function prologue() {
    const p = BNL.PROLOGUE;
    // Écran de fond (le jeu n'est pas encore construit)
    const decor = el("div.histoire-decor");
    BNL.Plongee.fond(decor);
    app().innerHTML = "";
    app().append(el("div.histoire", null, decor));
    await BNL.Manga.jouer(p.cases, { titre: p.titre, ambiance: p.ambiance, obligatoire: !S.toutOuvert, replique: p.replique, boutonFin: "Monter à bord ▶" });
    S.etat.vus.prologue = true;
    S.sauver();
  }

  async function epilogue() {
    const p = BNL.EPILOGUE;
    await BNL.Manga.jouer(p.cases, { titre: p.titre, ambiance: p.ambiance, obligatoire: false, boutonFin: "Découvrir les expéditions bonus ▶" });
    S.etat.vus.epilogue = true;
    S.sauver();
    apresEpilogue();
  }

  // ---------------------------------------------------------------------------
  //  L'écran de jeu
  // ---------------------------------------------------------------------------
  async function entrerDansLeJeu() {
    if (!S.etat.vus.prologue) {
      await prologue();
      construireJeu(true);
    } else construireJeu(false);
  }

  function bouton(quoi, icone, texte) {
    return el("button.bouton-entete", { type: "button", "data-ouvrir": quoi, title: texte },
      el("span.icone", { "aria-hidden": "true" }, icone), el("span.texte", null, texte));
  }

  async function construireJeu(premiereFois) {
    const code = S.enLigne() && S.etat.joueur.code;
    const entete = el("header.barre", null,
      el("button.marque", { type: "button", title: "Voir la plongée", "data-ouvrir": "plongee", html: logo() + "<span class='marque-texte'><strong>Expédition</strong> Gombessa</span>" }),
      el("div.jauge", { title: "Profondeur de la Luciole" }),
      el("nav.fil-chapitre", { "aria-label": "Missions de ce palier" }),
      el("div.actions", null,
        bouton("plongee", "🌊", "Plongée"), bouton("carnet", "📔", "Carnet"), bouton("memo", "📒", "Mémo"),
        bouton("bac", "🧪", "Bac à sable"), bouton("equipage", "👥", "Équipage"),
        code ? el("button.bouton-entete.action-code", { type: "button", "data-ouvrir": "code", title: "Mon code" },
          el("span.icone", { "aria-hidden": "true" }, "🔑"), el("span.texte", null, "Mon code")) : null),
      el("span.sync", { title: "" }),
      code ? el("button.puce-code", { type: "button", "data-ouvrir": "code", title: "Ton code : il ne change jamais" }, "🔑 ", code) : null,
      el("button.puce-profil", { type: "button", "data-ouvrir": "profil", title: "Mon profil" }));
    const jeu = el("main.jeu", null,
      el("section.colonne-dossier", { "aria-label": "L'histoire et le rappel de cours" }),
      el("section.espace-travail", { "aria-label": "Ta mission" }));
    app().innerHTML = "";
    app().append(entete, jeu);
    entete.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ouvrir]");
      if (!b) return;
      const quoi = b.dataset.ouvrir;
      if (quoi === "plongee") BNL.Outils.plongee();
      if (quoi === "carnet") BNL.Outils.carnet();
      if (quoi === "memo") BNL.Outils.memo();
      if (quoi === "bac") BNL.Outils.bacASable();
      if (quoi === "equipage") BNL.Outils.equipage();
      if (quoi === "profil") BNL.Outils.profil();
      if (quoi === "code") montrerMonCode();
    });
    S.surSync(majSync);
    S.surChangement(() => majEntete());

    rafraichirCamarades();
    clearInterval(minuteurCamarades);
    minuteurCamarades = setInterval(() => { if (!document.hidden) rafraichirCamarades(); }, Math.max(10, cfg.RAFRAICHIR_EQUIPAGE_S || cfg.RAFRAICHIR_BRIGADE_S || 20) * 1000);

    let depart = S.etat.courante;
    if (!S.PAR_ID[depart] || !S.debloquee(depart)) depart = S.PRINCIPALES.find((id) => !S.reussie(id)) || S.PRINCIPALES[0];
    await BNL.Mission.ouvrir(depart, { visite: premiereFois || !S.etat.vus.visite });
  }

  function visiteGenerale() {
    const code = S.enLigne() && S.etat.joueur.code;
    P.visite([
      { texte: "Ici, **ton objectif** (dans le cadre bleu) et l'activité. Commence toujours par lire l'objectif.", cible: ".objectif" },
      { texte: "Ici, la **scène** que tu viens de lire et le **rappel de cours**. Tu peux les revoir à tout moment.", cible: ".scene-recap" },
      { texte: "La **jauge** montre la profondeur de la Luciole. Chaque balise allumée te fait descendre.", cible: ".jauge" },
      { texte: "Le **mémo** contient tout le cours sur les listes et les dictionnaires. Ouvre-le dès que tu as un doute !", cible: "[data-ouvrir='memo']" },
      code ? { texte: "Ton **code** est toujours ici. Il ne change jamais : il te permet de reprendre depuis n'importe quel appareil.", cible: window.matchMedia("(max-width: 700px)").matches ? ".action-code" : ".puce-code" } : null,
      { texte: "Et ici, ton **profil** : tes badges, ton emblème et tes compétences.", cible: ".puce-profil" },
    ].filter(Boolean), () => { S.etat.vus.visite = true; S.sauver(); });
  }

  // Le code d'expédition, en grand
  function montrerMonCode() {
    const code = S.etat.joueur && S.etat.joueur.code;
    if (!code) return;
    const ecouter = BNL.U.peutLire() ? el("button.bouton.petit", { type: "button" }, "🔊 Écouter le code") : null;
    if (ecouter) ecouter.addEventListener("click", () => lireCode(code, ecouter));
    P.ouvrir(el("div", null,
      el("p", null, "C'est ton code, à toi seul. Il ne change jamais."),
      el("div.code-expedition", { "aria-label": "Ton code : " + code }, code),
      ecouter,
      el("ul.code-conseils", null,
        el("li", null, "🔁 Pour reprendre ailleurs : « J'ai déjà un code » sur la page d'accueil."),
        el("li", null, "✍️ Garde-le dans ton cahier, ou en photo."),
        el("li", null, "🤫 Ne le donne pas : avec ce code, on entre dans TON expédition."))), { titre: "🔑 Ton code d'expédition", classe: "petite.fenetre-code" });
  }

  function majEntete() {
    const puce = $(".puce-profil");
    if (!puce) return;
    const xp = S.xp();
    const rang = S.rang(xp);
    const pct = rang.suivant ? Math.round(((xp - rang.xp) / (rang.suivant.xp - rang.xp)) * 100) : 100;
    puce.innerHTML = "";
    puce.append(el("span.puce-avatar", { "aria-hidden": "true" }, S.avatar().emoji),
      el("span.puce-infos", null,
        el("span.puce-nom", null, S.etat.joueur ? S.etat.joueur.pseudo : "Recrue"),
        el("span.puce-rang", null, `${rang.emoji} ${rang.nom} · ${xp} XP`),
        el("span.barre-progres.mini", null, el("span", { style: { width: pct + "%" } }))));
    const m = BNL.Mission.actuelle();
    const jauge = $(".jauge");
    if (jauge && m) {
      const c = BNL.CHAPITRES.find((x) => x.id === m.chap);
      jauge.innerHTML = "";
      if (c.bonus) {
        jauge.append(el("span.jauge-prof", null, "🧭"), el("span.jauge-nom", null, c.titre));
      } else {
        const paliers = BNL.CHAPITRES.filter((x) => !x.bonus);
        const k = paliers.indexOf(c);
        jauge.append(el("span.jauge-tube", { "aria-hidden": "true" }, el("span", { style: { height: Math.round(((k + 1) / paliers.length) * 100) + "%" } })),
          el("span.jauge-prof", null, c.prof ? `−${c.prof} m` : "0 m"), el("span.jauge-nom", null, c.titre));
      }
    }
    const fil = $(".fil-chapitre");
    if (fil && m) {
      fil.innerHTML = "";
      const liste = el("ol.fil-points");
      S.MISSIONS.filter((x) => x.chap === m.chap).forEach((x, i) => {
        const r = S.reussie(x.id);
        const ok = S.debloquee(x.id);
        const b = el("button" + (r ? ".fait" : "") + (x.id === m.id ? ".actuel" : ""), {
          type: "button", disabled: !ok || null, title: `${i + 1}. ${x.titre}${r ? " (réussie)" : ok ? "" : " (verrouillée)"}`,
          "aria-current": x.id === m.id ? "step" : null,
        }, r ? "✓" : String(i + 1));
        b.addEventListener("click", () => BNL.Mission.ouvrir(x.id));
        liste.append(el("li", null, b));
      });
      fil.append(liste);
    }
  }

  function majSync(s) {
    const z = $(".sync");
    if (!z) return;
    const textes = {
      local: ["", "Progression gardée sur cet appareil (1 jour)"],
      ok: ["", "Progression enregistrée sur le serveur de la classe"],
      attente: ["", "Enregistrement…"],
      inconnu: ["", "Connexion au serveur…"],
      erreur: ["⚠️", "Pas de connexion au serveur : ta progression est gardée sur cet appareil et sera envoyée plus tard."],
    };
    const [txt, titre] = textes[s] || textes.local;
    z.className = "sync " + s;
    z.textContent = txt;
    z.title = titre;
    z.setAttribute("aria-label", titre);
  }

  function surOuvertureMission(m, options = {}) {
    majEntete();
    const vus = S.etat.vus;
    if (options.visite && !vus.visite) { setTimeout(visiteGenerale, 300); return; }
    const tours = {
      commande: [
        { texte: "Voici la **console** de LUCI. La commande demandée est écrite dans le cadre numéroté.", cible: ".console-fil" },
        { texte: "Tape ta commande ici, puis appuie sur **Entrée**. Des suggestions apparaissent pendant que tu écris.", cible: ".console-saisie" },
      ],
      parsons: [
        { texte: "Les lignes du programme sont **mélangées** dans la réserve. Certaines sont des **pièges**.", cible: ".parsons-reserve" },
        { texte: "Touche une ligne pour la mettre dans **ton programme**. Range-la avec ↑ ↓ et décale-la avec ← →.", cible: ".parsons-programme" },
      ],
      code: [
        { texte: "Voici l'**éditeur de code**. Remplace les `___` par du code. Des **suggestions** apparaissent pendant que tu écris : flèches ↑ ↓ puis Entrée pour en choisir une.", cible: ".editeur" },
        { texte: "Les **bandes de couleur** à gauche des lignes montrent l'**indentation** : tout ce qui est décalé fait partie du bloc au-dessus (après un `:`).", cible: ".editeur" },
        { texte: "Clique sur **▶ Lancer**. Le résultat s'affiche dessous, avec une explication en français si quelque chose ne va pas.", cible: ".bouton-lancer" },
        { texte: "Bloqué·e ? Les **indices** se débloquent au fil de tes essais. Si vraiment rien ne marche, la **correction** finit par apparaître.", cible: ".aides" },
      ],
    };
    const cleTour = "tour_" + m.type;
    if (tours[m.type] && !vus[cleTour] && vus.visite) {
      vus[cleTour] = true;
      S.sauver();
      setTimeout(() => P.visite(tours[m.type]), 400);
    }
  }

  // ---------------------------------------------------------------------------
  //  Suite des missions
  // ---------------------------------------------------------------------------
  function missionSuivante(id) {
    const ordre = S.MISSIONS.map((x) => x.id);
    const i = ordre.indexOf(id);
    const chap = S.PAR_ID[id].chap;
    // d'abord la suite dans le même chapitre / la même expédition
    for (let k = i + 1; k < ordre.length; k++) if (S.debloquee(ordre[k]) && !S.reussie(ordre[k]) && (!S.PAR_ID[id].chap.startsWith("e") || S.PAR_ID[ordre[k]].chap === chap)) return ordre[k];
    for (let k = 0; k < ordre.length; k++) if (S.debloquee(ordre[k]) && !S.reussie(ordre[k])) return ordre[k];
    return null;
  }

  async function apresEpilogue() {
    await construireJeu(false);
    setTimeout(() => {
      BNL.Outils.plongee();
      P.toast("🧭 <strong>Les expéditions bonus sont ouvertes !</strong> Plus difficiles : découpage de listes, tableaux, grilles, tuples, tris… Choisis celle que tu veux dans la liste.", { duree: 10000 });
    }, 400);
  }

  function annoncerRecompenses(n) {
    if (!n) return;
    n.badges.forEach((b) => P.toast(`<span class="toast-grand">${b.emoji}</span> Nouveau badge : <strong>${echapper(b.nom)}</strong>`, { type: "succes" }));
    n.avatars.forEach((a) => P.toast(`<span class="toast-grand">${a.emoji}</span> Nouvel emblème : <strong>${echapper(a.nom)}</strong>`, { type: "succes" }));
    n.themes.forEach((t) => P.toast(`🎨 Nouveau thème : <strong>${echapper(t.nom)}</strong>`, { type: "succes" }));
    majEntete();
  }

  // ---------------------------------------------------------------------------
  //  L'équipage (les camarades de la classe)
  // ---------------------------------------------------------------------------
  // Nombre de missions principales réussies quand chaque balise est allumée
  const seuilsBalises = (() => {
    const res = [];
    let n = 0;
    BNL.CHAPITRES.filter((c) => !c.bonus).forEach((c) => {
      n += S.MISSIONS.filter((x) => x.chap === c.id).length;
      res.push([n, c]);
    });
    return res;
  })();

  async function rafraichirCamarades() {
    if (!S.enLigne()) return camarades;
    try {
      const liste = await S.equipage();
      if (Array.isArray(liste)) {
        for (const c of liste) {
          c.chap = S.chapitreDe(c.mission_courante) || "p0";
          const avant = camaradesAvant[c.pseudo];
          if (avant && !c.moi && c.faites_principal > avant.faites_principal) {
            const s = seuilsBalises.find(([n]) => n === c.faites_principal);
            if (s) {
              const dernier = s[1].id === "p6";
              P.toast(`<span class="toast-grand">${echapper(c.avatar)}</span> <strong>${echapper(c.pseudo)}</strong> ${dernier ? "a rencontré le gombessa !" : "a allumé la balise « " + echapper(s[1].titre) + " »."}`);
            }
          }
          camaradesAvant[c.pseudo] = c;
        }
        camarades = liste;
      }
    } catch (e) { /* hors connexion : on garde l'ancienne liste */ }
    return camarades;
  }

  document.addEventListener("DOMContentLoaded", demarrer);

  return {
    appliquerTheme, majEntete, surOuvertureMission, missionSuivante, epilogue, apresEpilogue, montrerMonCode,
    annoncerRecompenses, rafraichirCamarades, camarades: () => camarades, diagnosticPython, lireCode,
  };
})();
