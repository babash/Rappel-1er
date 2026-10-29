// Les outils toujours disponibles : mémo, bac à sable, plongée, carnet de bord, équipage, profil.
window.BNL = window.BNL || {};

BNL.Outils = (() => {
  const { $, $$, el, md, echapper } = BNL.U;
  const P = BNL.Panneaux;
  const S = BNL.Store;

  // ---------------------------------------------------------------------------
  //  Mémo
  // ---------------------------------------------------------------------------
  function memo(ficheId) {
    S.etat.stats.memo = (S.etat.stats.memo || 0) + 1;
    S.journal("memo", S.etat.courante, { detail: ficheId || "ouverture" });
    const nouveautes = S.evaluerRecompenses();
    S.sauver();
    BNL.App.annoncerRecompenses(nouveautes);

    const contenu = el("div.memo");
    const recherche = el("input.memo-recherche", { type: "search", placeholder: "Chercher : append, get, KeyError, maximum…", "aria-label": "Chercher dans le mémo" });
    const onglets = el("div.memo-onglets", { role: "tablist" });
    const fiches = el("div.memo-fiches");
    BNL.MEMO.forEach((g, i) => {
      onglets.append(el("button.memo-onglet", { type: "button", "data-groupe": i }, el("span", { "aria-hidden": "true" }, g.icone + " "), g.groupe));
    });
    contenu.append(recherche, onglets, fiches);

    function afficherGroupe(i, ouvrirId) {
      $$(".memo-onglet", onglets).forEach((o) => o.classList.toggle("actif", +o.dataset.groupe === i));
      fiches.innerHTML = "";
      BNL.MEMO[i].fiches.forEach((f, k) => fiches.append(ficheNoeud(f, f.id === ouvrirId || (!ouvrirId && k === 0))));
      if (ouvrirId) {
        const cible = fiches.querySelector(`[data-fiche="${ouvrirId}"]`);
        if (cible) setTimeout(() => { cible.scrollIntoView({ block: "start" }); cible.classList.add("surlignee"); }, 80);
      }
    }
    function ficheNoeud(f, ouverte) {
      const d = el("details.memo-fiche", { "data-fiche": f.id, open: ouverte || null });
      d.append(el("summary", null, f.titre), el("div.memo-texte", { html: md(f.texte, { essayer: true }) }));
      return d;
    }
    onglets.addEventListener("click", (e) => {
      const o = e.target.closest("[data-groupe]");
      if (o) { recherche.value = ""; afficherGroupe(+o.dataset.groupe); }
    });
    recherche.addEventListener("input", () => {
      const q = recherche.value.trim().toLowerCase();
      if (!q) { afficherGroupe(0); return; }
      $$(".memo-onglet", onglets).forEach((o) => o.classList.remove("actif"));
      fiches.innerHTML = "";
      let n = 0;
      BNL.MEMO.forEach((g) => g.fiches.forEach((f) => {
        if ((f.titre + " " + f.texte).toLowerCase().includes(q)) { fiches.append(ficheNoeud(f, true)); n++; }
      }));
      if (!n) fiches.append(el("p.vide", null, "Rien trouvé. Essaie un autre mot (par exemple « liste », « clé », « boucle »)."));
    });
    contenu.addEventListener("click", (e) => {
      const b = e.target.closest("[data-essayer]");
      if (b) bacASable(BNL.U.codesEssai[b.dataset.essayer]);
    });

    let groupe = 0;
    if (ficheId) BNL.MEMO.forEach((g, i) => { if (g.fiches.some((f) => f.id === ficheId)) groupe = i; });
    afficherGroupe(groupe, ficheId);
    P.ouvrir(contenu, { titre: "📒 Mémo : les rappels de cours", tiroir: true, classe: "tiroir-memo" });
  }

  // ---------------------------------------------------------------------------
  //  Bac à sable
  // ---------------------------------------------------------------------------
  const EXEMPLE_BAC = `# Écris du Python ici, puis clique sur Lancer
outils = ["lampe", "sonar"]
outils.append("pince")
print(outils)
print(len(outils))
`;

  function bacASable(code) {
    const contenu = el("div.bac");
    const noeud = el("div.editeur.editeur-bac");
    const sortie = el("pre.sortie", null, el("span.sortie-vide", null, "La console affichera le résultat ici."));
    const vars = el("div.bac-variables");
    const bouton = el("button.bouton.principal.bouton-lancer", { type: "button" }, el("span", { "aria-hidden": "true" }, "▶"), " Lancer ", el("kbd", null, "Ctrl+Entrée"));
    contenu.append(
      el("p.aide-texte", null, "Ici, rien n'est noté : teste ce que tu veux, fais des erreurs, observe."),
      el("div.barre-outils", null, bouton, el("span.etat-python"), el("span.espace"),
        el("button.bouton.discret", { type: "button", onclick: () => { ed.setValue("", -1); ed.focus(); } }, "Tout effacer")),
      noeud,
      el("div.bac-resultats", null,
        el("div.bac-col", null, el("h3", null, "Console"), sortie),
        el("div.bac-col", null, el("h3", null, "Variables"), vars)));
    const f = P.ouvrir(contenu, { titre: "🧪 Bac à sable", classe: "grande", surFermeture: () => { S.setBrouillon("_bac", "code", ed.getValue()); ed.destroy(); } });
    const ed = BNL.Editeur.creer(noeud, { theme: BNL.Mission.themeAce(), taille: S.etat.taillePolice || 16 });
    BNL.Editeur.definirContexte({});
    const garde = S.brouillon("_bac", "code");
    ed.setValue(code != null ? code : (garde || EXEMPLE_BAC), 1);
    ed.focus();
    let occupe = false;
    async function executer() {
      if (occupe) return;
      occupe = true;
      bouton.disabled = true;
      BNL.Editeur.effacerErreurs(ed);
      sortie.textContent = BNL.Python.etat() === "pret" ? "⏳ Python exécute…" : "⏳ Python se prépare (quelques secondes la première fois)…";
      const r = await BNL.Python.executer({ setup: "", code: ed.getValue(), check: "" });
      occupe = false;
      bouton.disabled = false;
      sortie.innerHTML = "";
      if (r.phase === "indisponible") {
        sortie.append(el("span.sortie-erreur", null, "Python n'a pas pu démarrer."));
        return;
      }
      if (r.sortie) sortie.append(document.createTextNode(r.sortie));
      if (r.erreur) {
        sortie.append(el("span.sortie-erreur", null, (r.sortie ? "\n" : "") + (r.erreur.ligne ? `Ligne ${r.erreur.ligne} → ` : "") + r.erreur.brut));
        sortie.append(el("span.sortie-explication", { html: "\n💡 " + md(r.erreur.explication).replace(/^<p>|<\/p>$/g, "") }));
        if (r.erreur.ligne) BNL.Editeur.montrerErreur(ed, r.erreur.ligne, r.erreur.explication);
      }
      if (!r.sortie && !r.erreur) sortie.append(el("span.sortie-vide", null, "(Rien n'a été affiché.)"));
      vars.innerHTML = BNL.Visu.variables(r.variables || []);
      S.etat.stats.bacasable = (S.etat.stats.bacasable || 0) + 1;
      S.setBrouillon("_bac", "code", ed.getValue());
      const n = S.evaluerRecompenses();
      S.sauver();
      BNL.App.annoncerRecompenses(n);
    }
    bouton.addEventListener("click", executer);
    ed.commands.addCommand({ name: "lancer", bindKey: { win: "Ctrl-Enter", mac: "Cmd-Enter" }, exec: executer });
    BNL.Python.surEtat(() => {});
    return f;
  }

  // ---------------------------------------------------------------------------
  //  La plongée : coupe, balises et sommaire des missions
  // ---------------------------------------------------------------------------
  function plongee(chapChoisi) {
    const contenu = el("div.vue-plongee");
    const zoneCoupe = el("div.plongee-coupe");
    const cote = el("div.plongee-cote");
    contenu.append(el("div.plongee-defile", null, zoneCoupe), cote);
    const actuelle = BNL.Mission.actuelle();
    const f = P.ouvrir(contenu, { titre: "🌊 La plongée de la Luciole", classe: "grande" });
    const chapActuel = actuelle ? actuelle.chap : "p0";

    function dessiner(filtre) {
      const faits = new Set(BNL.CHAPITRES.filter((c) => S.conditions.chapitreFini(c.id)).map((c) => c.id));
      const ouverts = new Set(BNL.CHAPITRES.filter((c) => S.MISSIONS.some((m) => m.chap === c.id && S.debloquee(m.id))).map((c) => c.id));
      const equipage = BNL.App.camarades();
      BNL.Plongee.dessiner(zoneCoupe, {
        actuel: chapActuel.startsWith("p") ? chapActuel : "p6", faits, ouverts, camarades: equipage,
        clic: (chap) => dessiner(chap),
      });
      // Sur un petit écran, la coupe défile : on la centre sur la balise actuelle.
      const defile = zoneCoupe.parentElement;
      const pos = BNL.Plongee.POS[chapActuel.startsWith("p") ? chapActuel : "p6"];
      requestAnimationFrame(() => {
        if (defile.scrollWidth > defile.clientWidth) defile.scrollLeft = (pos.x / 1000) * defile.scrollWidth - defile.clientWidth / 2;
      });
      cote.innerHTML = "";
      const autres = equipage.filter((c) => !c.moi).length;
      cote.append(el("p.aide-texte", null, "Le sous-marin jaune, c'est toi." + (autres ? ` Les emblèmes autour des balises montrent où en ${autres > 1 ? `sont les ${autres} autres membres` : "est l'autre membre"} de l'équipage.` : "")));
      if (filtre) {
        const c = BNL.CHAPITRES.find((x) => x.id === filtre);
        cote.append(el("div.filtre-lieu", null, el("strong", null, c.titre), " ", el("button.lien", { type: "button", onclick: () => dessiner(null) }, "Tout afficher")));
      }
      const groupes = [
        { titre: "Le parcours principal", chaps: BNL.CHAPITRES.filter((c) => !c.bonus) },
        { titre: "Les expéditions bonus", chaps: BNL.CHAPITRES.filter((c) => c.bonus), note: "Elles s'ouvrent après la rencontre avec le gombessa. Chacune commence par sa première mission : choisis celle que tu veux." },
      ];
      groupes.forEach((g) => {
        const chaps = g.chaps.filter((c) => !filtre || c.id === filtre);
        if (!chaps.length) return;
        cote.append(el("h3.plongee-groupe", null, g.titre));
        chaps.forEach((c) => {
          const ms = S.MISSIONS.filter((m) => m.chap === c.id);
          const nbFaites = ms.filter((m) => S.reussie(m.id)).length;
          const ouvert = ms.some((m) => S.debloquee(m.id));
          const bloc = el("details.chapitre" + (ouvert ? "" : ".verrouille"), { open: (ouvert && nbFaites < ms.length && (c.id === chapActuel || !!filtre)) || null });
          bloc.append(el("summary", null,
            el("span.chap-icone", { "aria-hidden": "true" }, nbFaites === ms.length ? "🔆" : ouvert ? "◯" : "🔒"),
            el("span.chap-nom", null, el("strong", null, c.titre), el("small", null, c.theme + (c.bonus ? "" : ` · ${c.prof ? "−" + c.prof + " m" : "surface"}`))),
            el("span.chap-compte", null, `${nbFaites}/${ms.length}`)));
          const liste = el("ol.liste-missions");
          ms.forEach((m) => {
            const etat = S.etat.missions[m.id];
            const ok = S.debloquee(m.id);
            const r = S.reussie(m.id);
            const comp = BNL.COMPETENCES[m.competence];
            const li = el("li" + (r ? ".faite" : ok ? ".ouverte" : ".fermee") + (actuelle && actuelle.id === m.id ? ".actuelle" : ""));
            const b = el("button", { type: "button", disabled: !ok || null },
              el("span.m-statut", { "aria-hidden": "true" }, r ? "✓" : ok ? "●" : "🔒"),
              el("span.m-titre", null, m.titre, comp ? el("small.m-comp", null, `${comp.icone} ${comp.nom}`) : null),
              el("span.m-etoiles", null, r ? "★".repeat(etat.etoiles || 1) + "☆".repeat(3 - (etat.etoiles || 1)) : ""));
            b.addEventListener("click", () => { P.fermer(f); BNL.Mission.ouvrir(m.id); });
            li.append(b);
            liste.append(li);
          });
          bloc.append(liste);
          cote.append(bloc);
        });
        if (g.note && !S.reussie(S.PRINCIPALES[S.PRINCIPALES.length - 1])) cote.append(el("p.aide-texte", null, g.note));
      });
    }
    dessiner(chapChoisi || null);
  }

  // ---------------------------------------------------------------------------
  //  Carnet de bord : les espèces rencontrées
  // ---------------------------------------------------------------------------
  function carnet() {
    const contenu = el("div.carnet-bord");
    const nb = BNL.CHAPITRES.filter((c) => S.conditions.chapitreFini(c.id)).length;
    contenu.append(el("p.aide-texte", null, `Chaque balise allumée et chaque expédition terminée ajoute une page au carnet. ${nb} page${nb > 1 ? "s" : ""} sur ${BNL.CHAPITRES.length}.`));
    const grille = el("div.grille-especes");
    BNL.CHAPITRES.forEach((c) => {
      const esp = BNL.ESPECES[c.carte];
      if (!esp) return;
      const ok = S.conditions.chapitreFini(c.id);
      const carte = el("article.carte-espece" + (ok ? "" : ".cachee"));
      carte.append(el("div.carte-espece-image", { html: ok ? BNL.Illus.carte(c.carte) : "<span aria-hidden='true'>?</span>" }));
      const texte = el("div.carte-espece-texte", null,
        el("h3", null, ok ? esp.nom : "Page encore vide"),
        el("p.carte-espece-latin", null, ok ? esp.latin : (c.bonus ? "Termine l'expédition « " + c.titre + " »" : "Allume la balise « " + c.titre + " »")));
      if (ok) texte.append(el("ul", null, esp.faits.map((x) => el("li", null, x))));
      carte.append(texte);
      grille.append(carte);
    });
    contenu.append(grille);
    contenu.append(el("p.aide-texte.sources", null, "Sources : Parc naturel marin de Mayotte (OFB), Futura-Sciences, Mayotte Hebdo, projet ANR « DZIANI », Sci.News. Les données des missions, elles, sont inventées pour les exercices."));
    P.ouvrir(contenu, { titre: "📔 Carnet de bord", classe: "grande" });
  }

  // ---------------------------------------------------------------------------
  //  L'équipage : les camarades de la classe
  // ---------------------------------------------------------------------------
  function equipage() {
    const contenu = el("div.equipage");
    P.ouvrir(contenu, { titre: "👥 L'équipage", tiroir: true });
    function rendre() {
      contenu.innerHTML = "";
      if (!S.enLigne()) {
        contenu.append(el("p", null, S.serveurConfigure
          ? "Tu joues sans compte : pour voir l'équipage, reviens avec ton code d'expédition (Profil › Changer de joueur)."
          : "Le jeu n'est pas relié à un serveur de classe : ta progression reste sur cet appareil. Ton professeur peut activer le suivi de classe (voir le fichier README.md)."));
        return;
      }
      const enLigneC = (c) => Date.now() - new Date(c.vu_le).getTime() < 120000;
      const liste = BNL.App.camarades().slice().sort((a, b) => (b.moi - a.moi) || (enLigneC(b) - enLigneC(a)) || a.pseudo.localeCompare(b.pseudo, "fr"));
      const n = liste.filter(enLigneC).length;
      contenu.append(el("p.equipage-resume", null, el("strong", null, S.etat.joueur.classeNom || ""), ` · ${liste.length} membre${liste.length > 1 ? "s" : ""}, ${n} en plongée en ce moment`));
      if (!liste.length) { contenu.append(el("p.vide", null, "Chargement…")); return; }
      const total = S.PRINCIPALES.length;
      const ol = el("ol.equipage-liste");
      liste.forEach((c) => {
        const mission = S.PAR_ID[c.mission_courante];
        const chap = BNL.CHAPITRES.find((x) => x.id === c.chap);
        const pct = Math.round((Math.min(c.faites_principal, total) / total) * 100);
        ol.append(el("li.equipage-ligne" + (c.moi ? ".moi" : ""), null,
          el("span.equipage-avatar", { "aria-hidden": "true" }, c.avatar || "🐠", el("i.point-en-ligne" + (enLigneC(c) ? ".actif" : ""), { title: enLigneC(c) ? "En ligne" : "Hors ligne" })),
          el("div.equipage-infos", null,
            el("div.equipage-nom", null, el("strong", null, c.pseudo + (c.moi ? " (toi)" : "")), el("span.equipage-prof", null, chap ? (chap.bonus ? chap.titre : (chap.prof ? "−" + chap.prof + " m" : "surface")) : "")),
            el("div.barre-progres", { title: `${c.faites_principal}/${total} missions principales` }, el("span", { style: { width: pct + "%" } })),
            el("div.equipage-detail", null,
              c.faites_principal >= total ? "🐟 A rencontré le gombessa" : mission ? "En cours : " + mission.titre : "",
              c.faites_bonus ? ` · ${c.faites_bonus} bonus` : "",
              ` · ${c.etoiles} ★ · ${c.badges} badge${c.badges > 1 ? "s" : ""}`))));
      });
      contenu.append(ol);
      contenu.append(el("p.aide-texte", null, "Ce n'est pas une course : chacun plonge à son rythme. Aider un camarade à comprendre, ça compte aussi !"));
    }
    rendre();
    BNL.App.rafraichirCamarades().then(rendre);
    const minuteur = setInterval(() => { if (!document.body.contains(contenu)) clearInterval(minuteur); else rendre(); }, 5000);
  }

  // ---------------------------------------------------------------------------
  //  Profil : code, compétences, compagnon, thème, badges
  // ---------------------------------------------------------------------------
  function profil() {
    const contenu = el("div.profil");
    const e = S.etat;
    const xp = S.xp();
    const rang = S.rang(xp);
    const tempsTotal = Object.values(e.missions).reduce((t, m) => t + (m.temps || 0), 0);
    const pct = rang.suivant ? Math.round(((xp - rang.xp) / (rang.suivant.xp - rang.xp)) * 100) : 100;

    contenu.append(el("div.profil-tete", null,
      el("div.profil-avatar", { "aria-hidden": "true" }, S.avatar().emoji),
      el("div", null,
        el("h3", null, e.joueur ? e.joueur.pseudo : "Recrue"),
        el("p", null, `${rang.emoji} ${rang.nom} · ${xp} XP`),
        el("div.barre-progres.large", null, el("span", { style: { width: pct + "%" } })),
        el("p.aide-texte", null, rang.suivant ? `Encore ${rang.suivant.xp - xp} XP pour devenir ${rang.suivant.emoji} ${rang.suivant.nom}.` : "Rang maximal atteint !"),
        e.joueur && e.joueur.classeNom ? el("p.aide-texte", null, "Classe : " + e.joueur.classeNom) : null)));

    // Le code pour revenir
    const boiteCode = el("div.profil-code");
    if (S.enLigne()) {
      const code = e.joueur.code;
      boiteCode.append(el("h3", null, "🔑 Ton code d'expédition"),
        code ? el("div.code-expedition.petit", null, code) : el("p.aide-texte", null, "(Reconnecte-toi pour l'afficher.)"),
        el("p.aide-texte", null, "Ce code ne change jamais. Avec lui, tu reprends l'expédition depuis n'importe quel ordinateur ou téléphone. Garde-le pour toi."));
      if (code && BNL.U.peutLire()) {
        const b = el("button.bouton.petit", { type: "button" }, "🔊 Écouter le code");
        b.addEventListener("click", () => BNL.App.lireCode(code, b));
        boiteCode.append(b);
      }
    } else {
      boiteCode.append(el("h3", null, "💾 Sans compte"),
        el("p.aide-texte", null, "Tu joues sans compte : ta progression reste 1 jour sur cet appareil. Le code d'élève unique (qui ne change jamais) existe quand ton professeur active le suivi de classe."),
        el("details.sauvegarde-sans-compte", null, el("summary", null, "Sauvegarder pour un autre jour"),
          el("div.code-expedition.petit", null, S.codeProgression()),
          el("p.aide-texte", null, "Ce code de sauvegarde contient tes missions réussies : il change donc quand tu progresses. Pour le réutiliser : Accueil › Jouer sans compte › J'ai une sauvegarde.")));
    }
    contenu.append(boiteCode);

    contenu.append(el("div.profil-stats", null,
      stat(S.faites(S.PRINCIPALES) + " / " + S.PRINCIPALES.length, "missions principales"),
      stat(S.faites(S.BONUS) + " / " + S.BONUS.length, "missions bonus"),
      stat(S.etoilesTotal(), "étoiles"),
      stat(BNL.U.duree(tempsTotal), "de plongée")));

    // Compétences
    const comps = S.competences();
    const listeComp = el("ul.liste-competences");
    for (const [id, c] of Object.entries(BNL.COMPETENCES)) {
      const v = comps[id];
      if (!v || !v.total) continue;
      listeComp.append(el("li", null,
        el("span.comp-nom", { title: c.aide }, `${c.icone} ${c.nom}`),
        el("span.barre-progres", { title: `${v.faites} / ${v.total}` }, el("span", { style: { width: Math.round((v.faites / v.total) * 100) + "%" } })),
        el("span.comp-compte", null, `${v.faites}/${v.total}`)));
    }
    contenu.append(el("h3", null, "Tes compétences"), listeComp);

    // Emblèmes
    const avatars = el("div.grille-choix");
    BNL.AVATARS.forEach((a) => {
      const ok = S.avatarDebloque(a);
      const b = el("button.choix-avatar" + (e.avatar === a.id ? ".actif" : "") + (ok ? "" : ".verrou"),
        { type: "button", title: ok ? a.nom : "🔒 " + a.aide, "aria-label": a.nom + (ok ? "" : " (verrouillé : " + a.aide + ")") },
        el("span", null, a.emoji), ok ? null : el("small", null, "🔒"));
      b.addEventListener("click", () => {
        if (!ok) { P.toast(`🔒 <strong>${echapper(a.nom)}</strong> : ${echapper(a.aide)}.`); return; }
        e.avatar = a.id;
        S.sauver(true);
        BNL.App.majEntete();
        $$(".choix-avatar", avatars).forEach((x) => x.classList.remove("actif"));
        b.classList.add("actif");
        $(".profil-avatar", contenu).textContent = a.emoji;
      });
      avatars.append(b);
    });
    contenu.append(el("h3", null, "Ton emblème"), avatars, el("p.aide-texte", null, "Touche un emblème verrouillé pour savoir comment le débloquer."));

    // Thèmes
    const themes = el("div.grille-themes");
    BNL.THEMES.forEach((t) => {
      const ok = S.themeDebloque(t);
      const b = el("button.choix-theme" + (e.theme === t.id ? ".actif" : "") + (ok ? "" : ".verrou"),
        { type: "button", disabled: !ok || null, title: ok ? t.nom : "🔒 " + t.aide },
        el("span.apercu", { "data-theme": t.id }, el("i"), el("i"), el("i")),
        el("span.nom-theme", null, (ok ? "" : "🔒 ") + t.nom), ok ? null : el("small", null, t.aide));
      b.addEventListener("click", () => {
        e.theme = t.id;
        S.sauver();
        BNL.App.appliquerTheme();
        $$(".choix-theme", themes).forEach((x) => x.classList.remove("actif"));
        b.classList.add("actif");
      });
      themes.append(b);
    });
    contenu.append(el("h3", null, "Thème de l'interface"), themes);

    // Badges
    const badges = el("ul.grille-badges");
    BNL.BADGES.forEach((b) => {
      const obtenu = !!e.badges[b.id];
      badges.append(el("li.badge" + (obtenu ? ".obtenu" : ""), { title: b.aide },
        el("span.badge-emoji", { "aria-hidden": "true" }, obtenu ? b.emoji : "❔"),
        el("strong", null, b.nom), el("small", null, b.aide)));
    });
    contenu.append(el("h3", null, `Badges (${Object.keys(e.badges).length} / ${BNL.BADGES.length})`), badges);

    contenu.append(el("div.profil-bas", null,
      el("p.aide-texte", null, S.cookiesActifs
        ? "🍪 Ta progression est gardée dans des cookies pendant 1 jour (uniquement pour ce jeu)."
        : "Ta progression est gardée sur cet appareil pendant 1 jour."),
      el("button.bouton", { type: "button", onclick: async () => {
        const ok = await P.confirmer(S.enLigne()
          ? "Ta progression est enregistrée sur le serveur : tu la retrouveras avec ton **code d'expédition**."
          : "Sans compte, ta progression sera **effacée** de cet appareil. As-tu noté ta **sauvegarde** (Profil › Sauvegarder pour un autre jour) ?", { titre: "Changer de joueur ?", oui: "Quitter" });
        if (ok) { S.deconnecter(); location.reload(); }
      } }, "Changer de joueur / Se déconnecter")));
    P.ouvrir(contenu, { titre: "Mon profil", classe: "grande" });
  }

  function stat(valeur, legende) {
    return el("div.stat", null, el("strong", null, String(valeur)), el("span", null, legende));
  }

  return { memo, bacASable, plongee, carnet, equipage, profil };
})();
