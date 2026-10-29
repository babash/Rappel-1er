// Les différentes activités d'une mission :
//   etapes   (étapes variées : choix, cases, lignes, saisie, relier, trous, phrase, annoter, emplacement)
//   commande (console Python, une commande à la fois)
//   parsons  (remettre des lignes de code dans l'ordre et les décaler)
//   trace    (tableau d'avancement)
//   code     (programme à compléter, corriger ou écrire)
// Chaque activité reçoit un « contexte » fourni par mission.js.
window.BNL = window.BNL || {};

BNL.Activites = (() => {
  const { $, $$, el, md, enLigne, colorer, echapper } = BNL.U;
  const P = BNL.Panneaux;
  const S = BNL.Store;

  // ---------------------------------------------------------------------------
  //  Outils communs
  // ---------------------------------------------------------------------------
  const cleCase = (k) => (Array.isArray(k) ? k.join(",") : String(k));
  const memeEnsemble = (a, b) => a.length === b.length && a.every((x) => b.map(cleCase).includes(cleCase(x)));
  const sansP = (html) => html.replace(/^<p>/, "").replace(/<\/p>$/, "");

  // Mélange déterministe (le même ordre à chaque ouverture pour un même élève)
  function graine(texte) {
    let h = 2166136261;
    for (const c of texte) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function melanger(liste, cle) {
    const t = liste.slice();
    let s = graine(cle) || 1;
    const alea = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(alea() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  }

  function normSaisie(v) {
    let s = String(v ?? "").trim().toLowerCase().replace(/[’‘']/g, "\"").replace(/[«»“”]/g, "\"").replace(/\s+/g, "");
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");
    return s.replace(/^vrai$/, "true").replace(/^faux$/, "false");
  }

  // Bloc de code numéroté ; lignes éventuellement cliquables ou surlignées
  function codeNumerote(code, options = {}) {
    const lignes = code.split("\n");
    const bloc = el("div.code-numerote" + (options.cliquable ? ".cliquable" : ""));
    lignes.forEach((l, i) => {
      const n = i + 1;
      const contenu = [el("span.num", { "aria-hidden": "true" }, String(n)), el("span.code-ligne-texte", { html: colorer(l) || "&nbsp;" })];
      let ligne;
      if (options.cliquable) {
        ligne = el("button.code-ligne", { type: "button", "data-ligne": n, "aria-label": `Ligne ${n} : ${l.trim() || "vide"}` }, ...contenu);
        ligne.addEventListener("click", () => options.cliquable(n, ligne));
      } else {
        ligne = el("div.code-ligne", null, ...contenu);
      }
      if (options.surligne === n) ligne.classList.add("surlignee");
      bloc.append(ligne);
    });
    return bloc;
  }

  // Dessin cliquable d'une liste, d'une grille (liste de listes) ou d'un dictionnaire
  function cases(valeur, surClic) {
    if (Array.isArray(valeur) && valeur.length && valeur.every((x) => Array.isArray(x))) {
      const nbCol = Math.max(...valeur.map((l) => l.length));
      const table = el("table.cases-grille");
      const tete = el("tr", null, el("th"), ...Array.from({ length: nbCol }, (_, j) => el("th.v-indice", null, String(j))));
      table.append(el("thead", null, tete));
      const corps = el("tbody");
      valeur.forEach((ligne, i) => {
        const tr = el("tr", null, el("th.v-indice", null, String(i)));
        ligne.forEach((x, j) => {
          const b = el("button.case", { type: "button", "data-cle": `${i},${j}`, html: rendreScalaire(x), "aria-label": `ligne ${i}, colonne ${j}` });
          b.addEventListener("click", () => surClic([i, j], b));
          tr.append(el("td", null, b));
        });
        corps.append(tr);
      });
      table.append(corps);
      return el("div.cases.defile-x", null, table);
    }
    if (Array.isArray(valeur)) {
      const zone = el("div.cases.cases-liste");
      valeur.forEach((x, i) => {
        const b = el("button.case", { type: "button", "data-cle": String(i), "aria-label": `indice ${i}` },
          el("span.v-indice", null, String(i)), el("span.case-valeur", { html: rendreScalaire(x) }),
          el("span.v-indice.v-neg", null, String(i - valeur.length)));
        b.addEventListener("click", () => surClic(i, b));
        zone.append(b);
      });
      return zone;
    }
    const zone = el("div.cases.cases-dico");
    Object.entries(valeur).forEach(([k, x]) => {
      const b = el("button.case.case-paire", { type: "button", "data-cle": k },
        el("span.case-cle", { html: rendreScalaire(k) }), el("span.v-fleche", null, "→"), el("span.case-valeur", { html: rendreScalaire(x) }));
      b.addEventListener("click", () => surClic(k, b));
      zone.append(b);
    });
    return zone;
  }

  function rendreScalaire(x) {
    if (typeof x === "string") return `<span class="v-str">"${echapper(x)}"</span>`;
    if (typeof x === "boolean") return `<span class="v-bool">${x ? "True" : "False"}</span>`;
    if (x === null) return `<span class="v-none">None</span>`;
    // Dans les données des étapes, un tableau à l'intérieur d'un dictionnaire représente un tuple Python
    if (Array.isArray(x)) return `<span class="v-autre">(${x.map((y) => (typeof y === "string" ? `"${echapper(y)}"` : echapper(y))).join(", ")})</span>`;
    return `<span class="v-num">${echapper(x)}</span>`;
  }

  function dessinDonnee(mission, nom) {
    const v = mission.donnees && mission.donnees[nom];
    if (v === undefined) return null;
    return el("div.etape-dessin", { html: BNL.Visu.diagrammeJSON(nom, v) });
  }

  function message(type, html) {
    return el(`div.v-message.v-${type}`, { html });
  }

  // ===========================================================================
  //  1) ÉTAPES (et plan « avant de coder »)
  // ===========================================================================
  // Moteur commun : une suite de petites étapes, une à la fois.
  // options : { mission, ms, cle (champ de progression), deja, compter (erreurs comptées),
  //             libelle ("Étape"), journal, sauver, actif, onFin(bilan), suffixe }
  function sequence(zone, liste, o) {
    const N = liste.length;
    let i = o.deja ? 0 : Math.min(o.ms[o.cle] || 0, N - 1);
    let erreursIci = 0;
    let erreursTotal = 0;
    let reveles = 0;

    const progression = el("div.etapes-progression", { "aria-hidden": "true" }, liste.map(() => el("span.etape-point")));
    const compte = el("p.etape-compte");
    const carte = el("div.etape-carte");
    zone.append(el("div.travail-etapes", null, el("div.etapes-tete", null, compte, progression), carte));

    function majProgression() {
      $$(".etape-point", progression).forEach((p, k) => {
        p.classList.toggle("fait", k < i);
        p.classList.toggle("actuel", k === i);
      });
      compte.textContent = N > 1 ? `${o.libelle || "Étape"} ${i + 1} sur ${N}` : (o.libelle || "Étape");
    }

    function afficher() {
      erreursIci = 0;
      majProgression();
      const e = liste[i];
      carte.innerHTML = "";
      carte.classList.remove("apparait");
      void carte.offsetWidth;
      carte.classList.add("apparait");
      const question = el("div.etape-question", null, el("div", { html: md(e.q) }));
      if (BNL.U.peutLire()) {
        const b = el("button.bouton-lire", { type: "button", title: "Écouter la question", "aria-label": "Écouter la question" }, "🔊");
        b.addEventListener("click", () => BNL.U.lire(e.q + (e.phrase ? ". " + e.phrase.replace(/\{\{\d+\}\}/g, "…") : ""), b));
        question.append(b);
      }
      carte.append(question);
      if (e.montrer) { const d = dessinDonnee(o.mission, e.montrer); if (d) carte.append(d); }
      const reponse = el("div.etape-reponse");
      const retour = el("div.etape-retour", { "aria-live": "polite" });
      const actions = el("div.etape-actions");
      carte.append(reponse, retour, actions);
      const api = { e, reponse, retour, actions, repondre, valider: null, reveler: null, graine: o.mission.id + (o.suffixe || "") + i };
      (RENDUS[e.type] || RENDUS.choix)(api, o.mission);
      if (api.valider) {
        const b = el("button.bouton.principal", { type: "button" }, "Valider");
        b.addEventListener("click", api.valider);
        actions.append(b);
      }
    }

    function passerALaSuite(api, texteBouton) {
      const dernier = i === N - 1;
      const suite = el("button.bouton.principal", { type: "button" }, texteBouton || (dernier ? "Terminer" : "Suite →"));
      suite.addEventListener("click", () => { if (dernier) fin(); else { i++; afficher(); } });
      api.actions.append(suite);
      setTimeout(() => suite.focus({ preventScroll: true }), 50);
      if (!o.deja) { o.ms[o.cle] = i + 1; o.sauver(); }
    }

    function montrerResultat(api) {
      const e = api.e;
      if (e.resultat === undefined) return;
      const nom = e.nom || e.donnee || "liste";
      api.retour.append(el("div.resultat-liste", null,
        el("p.aide-texte", { html: enLigne(`Après cette instruction, @${nom}@ vaut :`) }),
        el("div", { html: BNL.Visu.diagrammeJSON(nom, e.resultat) })));
    }

    function repondre(api, ok, piege) {
      const { e, retour, actions } = api;
      o.actif();
      if (ok) {
        retour.innerHTML = "";
        retour.append(message("reussi", "<strong>Exact !</strong> " + sansP(md(e.expl || ""))));
        montrerResultat(api);
        api.reponse.classList.add("verrouillee");
        actions.innerHTML = "";
        passerALaSuite(api);
        o.journal("etape", { ok: true, detail: `${o.suffixe || "Q"}${i + 1}` });
        return;
      }
      erreursIci++;
      erreursTotal++;
      if (!o.deja && o.compter) { o.ms.erreurs = (o.ms.erreurs || 0) + 1; o.ms.essais = (o.ms.essais || 0) + 1; o.sauver(); }
      o.journal("etape", { ok: false, detail: `${o.suffixe || "Q"}${i + 1} : ${BNL.U.texteBrut(piege || "réponse fausse")}`.slice(0, 300) });
      retour.innerHTML = "";
      const texte = piege || e.aide || "Relis bien la question et le rappel de cours, puis essaie encore.";
      const boite = message("pasencore", "<strong>Pas tout à fait.</strong> " + sansP(md(texte)));
      if (piege && e.aide && erreursIci >= 2 && piege !== e.aide) boite.append(el("p", { html: "💡 " + sansP(md(e.aide)) }));
      retour.append(boite);
      if (erreursIci >= 2 && api.reveler && !$(".bouton-reveler", api.actions)) {
        const b = el("button.bouton.discret.bouton-reveler", { type: "button" }, "🙋 Montre-moi la réponse");
        b.addEventListener("click", () => {
          reveles++;
          if (!o.deja && o.compter) { o.ms.reveles = (o.ms.reveles || 0) + 1; o.sauver(); }
          o.journal("solution", { detail: `${o.suffixe || "Q"}${i + 1} : réponse montrée` });
          api.reveler();
          b.remove();
          retour.innerHTML = "";
          retour.append(message("neutre", "<strong>Voici la réponse.</strong> " + sansP(md(e.expl || ""))));
          montrerResultat(api);
          $$(".bouton.principal", api.actions).forEach((x) => x.remove());
          api.reponse.classList.add("verrouillee");
          passerALaSuite(api, i === N - 1 ? "J'ai compris : terminer" : "J'ai compris : suite →");
        });
        api.actions.append(b);
      }
    }

    function fin() {
      i = N;
      $$(".etape-point", progression).forEach((p) => { p.classList.add("fait"); p.classList.remove("actuel"); });
      compte.textContent = "Terminé";
      carte.innerHTML = "";
      o.onFin({ erreurs: erreursTotal, reveles, carte, recommencer: () => { i = 0; afficher(); } });
    }

    afficher();
  }

  function etapes(ctx) {
    const { mission: m, ms, zone } = ctx;
    const deja = ms.statut === "reussie";
    sequence(zone, m.etapes, {
      mission: m, ms, cle: "etape", deja, compter: true, libelle: "Étape",
      journal: ctx.journal, sauver: ctx.sauver, actif: ctx.actif,
      onFin: ({ carte, recommencer }) => {
        const erreurs = ms.erreurs || 0;
        carte.append(el("div.etapes-fin", null,
          el("p", null, deja ? "Étapes terminées." : erreurs === 0 ? "Sans aucune erreur, bravo !" : `Terminé avec ${erreurs} erreur${erreurs > 1 ? "s" : ""}.`),
          el("button.bouton", { type: "button", onclick: recommencer }, "↺ Refaire les étapes")));
        if (!deja) {
          const etoiles = (ms.reveles || 0) > 0 ? 1 : erreurs === 0 ? 3 : erreurs <= 2 ? 2 : 1;
          ctx.reussir({ etoiles });
        } else ctx.reussir({});
      },
    });
  }

  // Le plan « avant de coder » : quelques étapes d'explicitation, puis l'activité se débloque.
  function plan(ctx, zone, finir) {
    const { mission: m, ms } = ctx;
    zone.append(el("h2.plan-titre", null, "🧭 Avant de coder : explique ton plan", el("span.pastille", null, "💬 Expliquer")));
    sequence(zone, m.avant, {
      mission: m, ms, cle: "planEtape", deja: false, compter: false, libelle: "Plan", suffixe: "P",
      journal: (t, x) => ctx.journal(t === "etape" ? "plan" : t, x), sauver: ctx.sauver, actif: ctx.actif,
      onFin: finir,
    });
  }

  // Texte du plan, une fois complété (affiché au-dessus de l'éditeur)
  function resumePlan(m) {
    const bloc = el("div.plan-fait", null, el("h3", null, "✓ Ton plan"));
    (m.avant || []).forEach((e) => {
      if (e.type === "phrase") {
        const t = e.phrase.replace(/\{\{(\d+)\}\}/g, (_, k) => "**" + e.trous[+k].choix[e.trous[+k].bonne] + "**");
        bloc.append(el("p", { html: enLigne(t) }));
      } else if (e.type === "annoter") {
        const lignes = e.code.split("\n");
        e.notes.forEach((n) => bloc.append(el("p", { html: enLigne(`@${lignes[n.ligne - 1].trim()}@ → ${e.etiquettes[n.bonne]}`) })));
      } else if (e.expl) bloc.append(el("p", { html: enLigne(e.expl) }));
    });
    return bloc;
  }

  // ---------------------------------------------------------------------------
  //  Étiquettes à placer dans des trous (phrases, code à trous, annotations)
  // ---------------------------------------------------------------------------
  function plateauPuces(api, slots, trous, options = {}) {
    const valeurs = slots.map(() => null);
    const plateau = el("div.plateau-puces", { role: "group", "aria-label": "Étiquettes à placer" });
    let actif = -1;
    const verrou = () => api.reponse.classList.contains("verrouillee");

    function activer(k) {
      actif = k;
      slots.forEach((s, j) => s.classList.toggle("actif", j === k));
      plateau.innerHTML = "";
      if (k < 0) { plateau.hidden = true; return; }
      plateau.hidden = false;
      plateau.append(el("p.plateau-puces-titre", null, slots.length > 1 ? `Touche une étiquette pour la case ${k + 1} :` : "Touche une étiquette :"));
      const ordre = melanger(trous[k].choix.map((_, x) => x), api.graine + (options.memeOrdre ? "" : "-" + k));
      ordre.forEach((x) => {
        const b = el("button.puce-choix" + (valeurs[k] === x ? ".prise" : ""), { type: "button", html: enLigne(trous[k].choix[x]) });
        b.addEventListener("click", () => choisir(k, x));
        plateau.append(b);
      });
    }
    function choisir(k, x) {
      if (verrou()) return;
      valeurs[k] = x;
      const s = slots[k];
      s.innerHTML = enLigne(trous[k].choix[x]);
      s.classList.remove("vide", "juste", "faux", "actif");
      s.classList.add("rempli");
      let suivant = valeurs.findIndex((v, j) => v === null && j > k);
      if (suivant < 0) suivant = valeurs.findIndex((v) => v === null);
      activer(suivant);
    }
    slots.forEach((s, k) => {
      s.classList.add("vide");
      s.setAttribute("aria-label", `Case ${k + 1} à remplir`);
      s.addEventListener("click", () => { if (!verrou()) activer(k); });
    });
    api.valider = () => {
      if (verrou()) return;
      const vide = valeurs.findIndex((v) => v === null);
      if (vide >= 0) {
        api.retour.innerHTML = "";
        api.retour.append(message("neutre", "Remplis toutes les cases avant de valider."));
        activer(vide);
        return;
      }
      const aides = [];
      valeurs.forEach((v, k) => {
        const ok = v === trous[k].bonne;
        slots[k].classList.toggle("juste", ok);
        slots[k].classList.toggle("faux", !ok);
        if (!ok && trous[k].aide) aides.push(trous[k].aide);
      });
      const ok = valeurs.every((v, k) => v === trous[k].bonne);
      if (ok) activer(-1);
      api.repondre(api, ok, ok ? null : ([...new Set(aides)].join(" ") || (slots.length > 1 ? "Au moins une case est fausse (en rouge) : touche-la pour la changer." : null)));
    };
    api.reveler = () => {
      trous.forEach((t, k) => { valeurs[k] = t.bonne; slots[k].innerHTML = enLigne(t.choix[t.bonne]); slots[k].classList.remove("faux", "vide"); slots[k].classList.add("juste", "montre"); });
      activer(-1);
    };
    activer(0);
    return plateau;
  }

  const slotPuce = () => el("button.trou-puce", { type: "button" });

  // Rendu de chaque type d'étape -------------------------------------------------
  const RENDUS = {
    choix(api) {
      const { e, reponse } = api;
      if (e.code) reponse.append(codeNumerote(e.code, { surligne: e.surligne }));
      const multi = Array.isArray(e.bonnes);
      const groupe = el("div.quiz-choix", { role: "group", "aria-label": "Réponses possibles" });
      const choisis = new Set();
      e.choix.forEach((c, k) => {
        const b = el("button.choix", { type: "button", "aria-pressed": multi ? "false" : null,
          html: `<span class="choix-lettre">${multi ? "☐" : "ABCDEF"[k]}</span><span>${enLigne(c)}</span>` });
        b.addEventListener("click", () => {
          if (api.reponse.classList.contains("verrouillee")) return;
          if (multi) {
            if (choisis.has(k)) choisis.delete(k); else choisis.add(k);
            b.classList.toggle("coche", choisis.has(k));
            b.setAttribute("aria-pressed", choisis.has(k) ? "true" : "false");
            b.querySelector(".choix-lettre").textContent = choisis.has(k) ? "☑" : "☐";
            return;
          }
          if (k === e.bonne) {
            b.classList.add("juste");
            api.repondre(api, true);
          } else {
            b.classList.add("faux");
            b.disabled = true;
            api.repondre(api, false, e.pieges && e.pieges[k]);
          }
        });
        groupe.append(b);
      });
      reponse.append(groupe);
      const boutons = () => $$(".choix", groupe);
      if (multi) {
        api.valider = () => {
          if (api.reponse.classList.contains("verrouillee")) return;
          const ok = memeEnsemble([...choisis], e.bonnes);
          boutons().forEach((b, k) => {
            b.classList.remove("juste", "faux");
            if (choisis.has(k)) b.classList.add(e.bonnes.includes(k) ? "juste" : "faux");
          });
          if (!choisis.size) { api.retour.innerHTML = ""; api.retour.append(message("neutre", "Coche au moins une réponse.")); return; }
          const faux = [...choisis].find((k) => !e.bonnes.includes(k));
          api.repondre(api, ok, faux !== undefined && e.pieges ? e.pieges[faux] : (ok ? null : "Il manque au moins une bonne réponse."));
        };
      }
      api.reveler = () => boutons().forEach((b, k) => {
        if (multi ? e.bonnes.includes(k) : k === e.bonne) b.classList.add("juste", "montre");
      });
    },

    case(api, m) {
      const { e, reponse } = api;
      if (e.code) reponse.append(codeNumerote(e.code, { surligne: e.surligne }));
      const valeur = e.valeur !== undefined ? e.valeur : (m.donnees || {})[e.donnee];
      const multi = Array.isArray(e.bonnes);
      const choisis = new Map();
      const nomTexte = e.nom || e.donnee;
      const nom = nomTexte ? el("p.cases-nom", null, el("code", null, nomTexte)) : null;
      const dessin = cases(valeur, (cle, b) => {
        if (api.reponse.classList.contains("verrouillee")) return;
        if (multi) {
          const k = cleCase(cle);
          if (choisis.has(k)) choisis.delete(k); else choisis.set(k, cle);
          b.classList.toggle("coche", choisis.has(k));
          return;
        }
        if (cleCase(cle) === cleCase(e.bonne)) {
          b.classList.add("juste");
          api.repondre(api, true);
        } else {
          b.classList.add("faux");
          setTimeout(() => b.classList.remove("faux"), 1200);
          api.repondre(api, false, e.pieges && e.pieges[cleCase(cle)]);
        }
      });
      reponse.append(el("p.aide-texte.consigne-clic", null, multi ? "👆 Touche les cases, puis valide." : "👆 Touche directement la bonne case."), el("div.cases-cadre", null, nom, dessin));
      if (multi) {
        api.valider = () => {
          if (api.reponse.classList.contains("verrouillee")) return;
          const cles = [...choisis.values()];
          if (!cles.length) { api.retour.innerHTML = ""; api.retour.append(message("neutre", "Touche au moins une case, puis valide.")); return; }
          const ok = memeEnsemble(cles, e.bonnes);
          const faux = cles.find((c) => !e.bonnes.map(cleCase).includes(cleCase(c)));
          $$(".case", dessin).forEach((b) => {
            b.classList.remove("juste", "faux");
            if (choisis.has(b.dataset.cle)) b.classList.add(e.bonnes.map(cleCase).includes(b.dataset.cle) ? "juste" : "faux");
          });
          api.repondre(api, ok, faux !== undefined && e.pieges ? e.pieges[cleCase(faux)] : (ok ? null : "Il manque au moins une case."));
        };
      }
      api.reveler = () => {
        const bonnes = (multi ? e.bonnes : [e.bonne]).map(cleCase);
        $$(".case", dessin).forEach((b) => { if (bonnes.includes(b.dataset.cle)) b.classList.add("juste", "montre"); });
      };
    },

    ligne(api) {
      const { e, reponse } = api;
      const multi = Array.isArray(e.bonnes);
      const choisies = new Set();
      const bloc = codeNumerote(e.code, {
        cliquable: (n, b) => {
          if (api.reponse.classList.contains("verrouillee")) return;
          if (multi) {
            if (choisies.has(n)) choisies.delete(n); else choisies.add(n);
            b.classList.toggle("coche", choisies.has(n));
            return;
          }
          if (n === e.bonne) { b.classList.add("juste"); api.repondre(api, true); }
          else {
            b.classList.add("faux");
            setTimeout(() => b.classList.remove("faux"), 1200);
            api.repondre(api, false, e.pieges && e.pieges[n]);
          }
        },
      });
      reponse.append(el("p.aide-texte", null, multi ? "👆 Touche les lignes, puis valide." : "👆 Touche directement la ligne."), bloc);
      if (multi) {
        api.valider = () => {
          if (api.reponse.classList.contains("verrouillee")) return;
          if (!choisies.size) { api.retour.innerHTML = ""; api.retour.append(message("neutre", "Touche au moins une ligne, puis valide.")); return; }
          const ok = memeEnsemble([...choisies], e.bonnes);
          $$(".code-ligne", bloc).forEach((b) => {
            const n = +b.dataset.ligne;
            b.classList.remove("juste", "faux");
            if (choisies.has(n)) b.classList.add(e.bonnes.includes(n) ? "juste" : "faux");
          });
          const faux = [...choisies].find((n) => !e.bonnes.includes(n));
          api.repondre(api, ok, faux !== undefined && e.pieges ? e.pieges[faux] : (ok ? null : "Il manque au moins une ligne."));
        };
      }
      api.reveler = () => {
        const bonnes = multi ? e.bonnes : [e.bonne];
        $$(".code-ligne", bloc).forEach((b) => { if (bonnes.includes(+b.dataset.ligne)) b.classList.add("juste", "montre"); });
      };
    },

    saisie(api) {
      const { e, reponse } = api;
      if (e.code) reponse.append(codeNumerote(e.code, { surligne: e.surligne }));
      const champ = el("input.saisie-champ", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false",
        placeholder: e.placeholder || "Ta réponse", "aria-label": "Ta réponse", inputmode: /^\-?\d+$/.test(String(e.rep[0])) ? "numeric" : null });
      reponse.append(champ);
      api.valider = () => {
        if (api.reponse.classList.contains("verrouillee")) return;
        if (!champ.value.trim()) { champ.focus(); return; }
        const ok = e.rep.some((r) => normSaisie(r) === normSaisie(champ.value));
        champ.classList.toggle("juste", ok);
        champ.classList.toggle("faux", !ok);
        const piege = e.pieges && Object.entries(e.pieges).find(([k]) => normSaisie(k) === normSaisie(champ.value));
        api.repondre(api, ok, piege ? piege[1] : null);
        if (ok) champ.readOnly = true;
      };
      champ.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); api.valider(); } });
      api.reveler = () => { champ.value = e.rep[0]; champ.classList.remove("faux"); champ.classList.add("juste", "montre"); champ.readOnly = true; };
      setTimeout(() => champ.focus({ preventScroll: true }), 80);
    },

    // Relier par des traits (on touche un élément à gauche, puis un à droite)
    associer(api, m) {
      const { e, reponse } = api;
      const COULEURS = ["#0b8793", "#c2410c", "#7c3aed", "#15803d", "#be185d", "#1d4ed8", "#a16207"];
      const ordre = melanger(e.droite.map((_, k) => k), m.id + e.q);
      const liens = new Map(); // indice à gauche → indice à droite
      let selection = null;
      const conteneur = el("div.relier");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "relier-svg");
      svg.setAttribute("aria-hidden", "true");
      const colG = el("div.relier-col.relier-gauche");
      const colD = el("div.relier-col.relier-droite");
      const boutonsG = e.gauche.map((g, k) => {
        const b = el("button.relier-item", { type: "button", html: enLigne(g) });
        b.append(el("span.relier-point"));
        b.addEventListener("click", () => toucher("g", k));
        colG.append(b);
        return b;
      });
      const boutonsD = {};
      ordre.forEach((d) => {
        const b = el("button.relier-item", { type: "button", html: enLigne(e.droite[d]) });
        b.append(el("span.relier-point"));
        b.addEventListener("click", () => toucher("d", d));
        colD.append(b);
        boutonsD[d] = b;
      });
      conteneur.append(svg, colG, el("div"), colD);
      reponse.append(el("p.aide-texte", null, "👆 Touche un élément à gauche, puis celui qui lui correspond à droite. Touche un lien pour le défaire."), conteneur);
      const verrou = () => api.reponse.classList.contains("verrouillee");
      function gaucheDe(d) { for (const [k, x] of liens) if (x === d) return k; return -1; }
      function toucher(cote, k) {
        if (verrou()) return;
        const deja = cote === "g" ? liens.has(k) : gaucheDe(k) >= 0;
        if (deja && (!selection || selection.cote === cote)) {
          if (cote === "g") liens.delete(k); else liens.delete(gaucheDe(k));
          selection = null;
          dessiner();
          return;
        }
        if (selection && selection.cote !== cote) {
          const g = cote === "g" ? k : selection.k;
          const d = cote === "d" ? k : selection.k;
          const autre = gaucheDe(d);
          if (autre >= 0) liens.delete(autre);
          liens.set(g, d);
          selection = null;
        } else {
          selection = selection && selection.cote === cote && selection.k === k ? null : { cote, k };
        }
        dessiner();
      }
      function dessiner() {
        boutonsG.forEach((b, k) => {
          b.classList.toggle("choisi", !!selection && selection.cote === "g" && selection.k === k);
          b.classList.toggle("lie", liens.has(k));
          b.classList.remove("juste", "faux");
          b.style.setProperty("--lien", liens.has(k) ? COULEURS[k % COULEURS.length] : "");
        });
        Object.entries(boutonsD).forEach(([d, b]) => {
          const g = gaucheDe(+d);
          b.classList.toggle("choisi", !!selection && selection.cote === "d" && selection.k === +d);
          b.classList.toggle("lie", g >= 0);
          b.classList.remove("juste", "faux");
          b.style.setProperty("--lien", g >= 0 ? COULEURS[g % COULEURS.length] : "");
        });
        tracer();
      }
      function tracer(faux = new Set()) {
        const r = conteneur.getBoundingClientRect();
        let html = "";
        for (const [g, d] of liens) {
          const a = boutonsG[g].getBoundingClientRect(), b = boutonsD[d].getBoundingClientRect();
          const x1 = a.right - r.left, y1 = a.top + a.height / 2 - r.top, x2 = b.left - r.left, y2 = b.top + b.height / 2 - r.top;
          const mx = (x1 + x2) / 2;
          html += `<path d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" stroke="${COULEURS[g % COULEURS.length]}"${faux.has(g) ? ' class="faux"' : ""}/>`;
        }
        svg.innerHTML = html;
      }
      if (window.ResizeObserver) new ResizeObserver(() => tracer()).observe(conteneur);
      api.valider = () => {
        if (verrou()) return;
        if (liens.size < e.gauche.length) {
          api.retour.innerHTML = "";
          api.retour.append(message("neutre", "Relie chaque élément de gauche avant de valider."));
          return;
        }
        const faux = new Set();
        boutonsG.forEach((b, k) => {
          const ok = liens.get(k) === e.bonnes[k];
          b.classList.toggle("juste", ok);
          b.classList.toggle("faux", !ok);
          boutonsD[liens.get(k)].classList.toggle("juste", ok);
          boutonsD[liens.get(k)].classList.toggle("faux", !ok);
          if (!ok) faux.add(k);
        });
        tracer(faux);
        api.repondre(api, faux.size === 0, faux.size ? `${faux.size} lien${faux.size > 1 ? "s" : ""} à revoir (en pointillés).` + (e.aide ? " " + e.aide : "") : null);
      };
      api.reveler = () => {
        liens.clear();
        e.bonnes.forEach((d, g) => liens.set(g, d));
        selection = null;
        dessiner();
        boutonsG.forEach((b) => b.classList.add("juste", "montre"));
      };
      requestAnimationFrame(() => tracer());
    },

    // Code à trous : on touche un trou, puis une étiquette
    trous(api) {
      const { e, reponse } = api;
      const slots = [];
      const pre = el("pre.code-statique.code-trous");
      e.code.split(/(\{\{\d+\}\})/).forEach((mo) => {
        const t = mo.match(/^\{\{(\d+)\}\}$/);
        if (!t) { pre.append(el("span", { html: colorer(mo) })); return; }
        const s = slotPuce();
        s.dataset.trou = t[1];
        slots[+t[1]] = s;
        pre.append(s);
      });
      reponse.append(el("div.bloc-code", null, pre));
      reponse.append(plateauPuces(api, slots, e.trous));
    },

    // Phrase à compléter avec des étiquettes (expliquer avec ses mots)
    phrase(api) {
      const { e, reponse } = api;
      if (e.code) reponse.append(codeNumerote(e.code, { surligne: e.surligne }));
      const slots = [];
      const p = el("p");
      e.phrase.split(/(\{\{\d+\}\})/).forEach((mo) => {
        const t = mo.match(/^\{\{(\d+)\}\}$/);
        if (!t) { p.append(el("span", { html: enLigne(mo) })); return; }
        const s = slotPuce();
        slots[+t[1]] = s;
        p.append(s);
      });
      reponse.append(el("div.puces-texte", null, p));
      reponse.append(plateauPuces(api, slots, e.trous));
    },

    // Annoter un programme : dire ce que fait chaque ligne marquée
    annoter(api) {
      const { e, reponse } = api;
      const lignes = e.code.split("\n");
      const bloc = el("div.annoter");
      const slots = [];
      lignes.forEach((l, k) => {
        bloc.append(el("div.code-ligne", null, el("span.num", { "aria-hidden": "true" }, String(k + 1)), el("span.code-ligne-texte", { html: colorer(l) || "&nbsp;" })));
        e.notes.forEach((n, j) => {
          if (n.ligne !== k + 1) return;
          const s = slotPuce();
          slots[j] = s;
          bloc.append(el("div.annoter-note", null, s));
        });
      });
      reponse.append(bloc);
      reponse.append(plateauPuces(api, slots, e.notes.map((n) => ({ choix: e.etiquettes, bonne: n.bonne, aide: n.aide })), { memeOrdre: true }));
    },

    // Toucher l'endroit où un élément arrive dans une liste
    emplacement(api) {
      const { e, reponse } = api;
      if (e.code) reponse.append(codeNumerote(e.code, { surligne: e.surligne }));
      const zoneE = el("div.emplacements");
      const verrou = () => api.reponse.classList.contains("verrouillee");
      const fentes = [];
      for (let g = 0; g <= e.liste.length; g++) {
        const f = el("button.emplacement", { type: "button", "aria-label": `Emplacement ${g}` }, "+");
        f.addEventListener("click", () => {
          if (verrou()) return;
          if (g === e.bonne) {
            f.classList.add("juste");
            f.innerHTML = rendreScalaire(e.valeur);
            api.repondre(api, true);
          } else {
            f.classList.add("faux");
            setTimeout(() => f.classList.remove("faux"), 1200);
            api.repondre(api, false, e.pieges && e.pieges[g]);
          }
        });
        fentes.push(f);
        zoneE.append(f);
        if (g < e.liste.length) {
          zoneE.append(el("span.v-case", null, el("span.v-indice", null, String(g)), el("span.v-valeur", { html: rendreScalaire(e.liste[g]) })));
        }
      }
      reponse.append(el("p.aide-texte.consigne-clic", null, "👆 Touche le + à l'endroit où l'élément arrive."),
        el("div.cases-cadre", null, e.nom ? el("p.cases-nom", null, el("code", null, e.nom)) : null, zoneE));
      api.reveler = () => { fentes[e.bonne].classList.add("juste", "montre"); fentes[e.bonne].innerHTML = rendreScalaire(e.valeur); };
    },
  };
  RENDUS.relier = RENDUS.associer;

  // ===========================================================================
  //  2) CONSOLE DE COMMANDES
  // ===========================================================================
  function commande(ctx) {
    const { mission: m, ms, zone } = ctx;
    const N = m.commandes.length;
    const deja = ms.statut === "reussie";
    let historique = (ctx.brouillon("historique") || []).slice(0, N);
    let i = deja ? N : Math.min(ms.etape || 0, historique.length, N);
    historique = historique.slice(0, i);
    let essaisIci = 0;
    let occupe = false;
    const tapees = [];
    let posTapees = 0;

    const fil = el("div.console-fil", { "aria-live": "polite" });
    const editeurNoeud = el("div.console-editeur", { "aria-label": "Ligne de commande Python" });
    const entree = el("button.bouton.principal.console-entree", { type: "button", title: "Exécuter (Entrée)" }, "Entrée ⏎");
    const aides = el("div.console-aides");
    const saisie = el("div.console-saisie", null, el("span.console-invite", { "aria-hidden": "true" }, ">>>"), editeurNoeud, entree);
    zone.append(el("div.travail-console", null,
      el("div.console-tete", null, el("span.console-voyant"), el("span", null, "Console Python de la Luciole"), el("span.espace"), el("span.etat-python")),
      fil, saisie, aides));

    const ed = BNL.Editeur.creer(editeurNoeud, { theme: ctx.themeAce(), taille: S.etat.taillePolice || 16, uneLigne: true });
    ctx.enregistrerEditeur(ed);
    BNL.Editeur.definirContexte(ctx.dossier() || {});
    ed.commands.addCommand({ name: "valider", bindKey: { win: "Enter|Shift-Enter", mac: "Enter|Shift-Enter" }, exec: () => executer() });
    ed.commands.addCommand({ name: "precedente", bindKey: "Up", exec: () => naviguer(-1) });
    ed.commands.addCommand({ name: "suivante", bindKey: "Down", exec: () => naviguer(1) });
    ed.on("change", () => {
      const v = ed.getValue();
      if (v.includes("\n")) {
        // Touche Entrée d'un clavier de téléphone (ou collage de plusieurs lignes)
        setTimeout(() => {
          ed.setValue(v.replace(/\s*\n\s*/g, " ").trim(), 1);
          executer();
        }, 0);
      }
      ctx.actif();
    });
    entree.addEventListener("click", () => executer());
    // Entrée alors que la suggestion affichée est déjà exactement le mot tapé : on exécute directement
    // (sinon il faudrait appuyer deux fois sur Entrée, ce qui est déroutant).
    editeurNoeud.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" || !ed.completer || !ed.completer.activated) return;
      const popup = ed.completer.popup;
      const donnee = popup && popup.getData(popup.getRow());
      const valeur = donnee && (donnee.value || donnee.caption || "");
      const pos = ed.getCursorPosition();
      const avant = ed.session.getLine(pos.row).slice(0, pos.column);
      const mot = (avant.match(/[A-Za-z_À-ÿ][\wÀ-ÿ]*$/) || [""])[0];
      if (mot && valeur && (valeur === mot || valeur.replace(/\(\)$/, "") === mot)) {
        ev.preventDefault();
        ev.stopPropagation();
        ed.completer.detach();
        executer();
      }
    }, true);

    function naviguer(sens) {
      if (!tapees.length) return;
      posTapees = Math.max(0, Math.min(tapees.length, posTapees + sens));
      ed.setValue(tapees[posTapees] || "", 1);
    }

    function carteEtape(k, etat) {
      const c = m.commandes[k];
      return el("div.console-etape" + (etat ? "." + etat : ""), null,
        el("span.console-etape-num", null, etat === "faite" ? "✓" : String(k + 1)),
        el("div.console-etape-texte", null, el("span.console-etape-titre", null, `Commande ${k + 1} sur ${N}`), el("div", { html: md(c.consigne) })));
    }

    function ligneCommande(texte) {
      return el("div.console-cmd", null, el("span.console-invite", { "aria-hidden": "true" }, ">>> "), el("span", { html: colorer(texte) }));
    }

    function reponseLuci(texte) {
      return el("div.console-luci", null, el("span.console-luci-nom", null, "LUCI"), el("span", { html: sansP(md(texte)) }));
    }

    function defiler() { fil.scrollTop = fil.scrollHeight; }

    function rendreDebut() {
      fil.innerHTML = "";
      fil.append(el("div.console-accueil", null, "Console prête. Tape la commande demandée, puis appuie sur Entrée."));
      for (let k = 0; k < i; k++) {
        fil.append(carteEtape(k, "faite"));
        if (historique[k]) fil.append(ligneCommande(historique[k]));
        if (m.commandes[k].reponse) fil.append(reponseLuci(m.commandes[k].reponse));
      }
      if (i < N) fil.append(carteEtape(i, "actuelle"));
      else finir(true);
      majAides();
      defiler();
    }

    function majAides() {
      aides.innerHTML = "";
      if (i >= N) return;
      const c = m.commandes[i];
      if (essaisIci >= 1 && c.indice) {
        const b = el("button.bouton.petit", { type: "button" }, "💡 Indice");
        b.addEventListener("click", () => {
          if (!deja) { ms.indicesCmd = (ms.indicesCmd || 0) + 1; ctx.sauver(); }
          ctx.journal("indice", { detail: `Commande ${i + 1}` });
          b.replaceWith(el("div.console-indice", { html: "💡 " + sansP(md(c.indice)) }));
        });
        aides.append(b);
      }
      if (essaisIci >= 2 && c.solution) {
        const b = el("button.bouton.petit.discret", { type: "button" }, "🙋 Montre-moi la commande");
        b.addEventListener("click", () => {
          if (!deja) { ms.reveles = (ms.reveles || 0) + 1; ctx.sauver(); }
          ctx.journal("solution", { detail: `Commande ${i + 1}` });
          ed.setValue(c.solution, 1);
          ed.focus();
          b.replaceWith(el("p.aide-texte", null, "La commande est dans la console : lis-la, puis appuie sur Entrée."));
        });
        aides.append(b);
      }
    }

    async function executer() {
      if (occupe || i >= N) return;
      const texte = ed.getValue().trim();
      if (!texte) { ed.focus(); return; }
      occupe = true;
      entree.disabled = true;
      tapees.push(texte);
      posTapees = tapees.length;
      fil.append(ligneCommande(texte));
      const attente = el("div.console-attente", null, el("span.rouage", { "aria-hidden": "true" }), BNL.Python.etat() === "pret" ? " LUCI exécute…" : " Python se prépare (quelques secondes la première fois)…");
      fil.append(attente);
      defiler();
      const c = m.commandes[i];
      let r;
      try {
        r = await BNL.Python.executer({ action: "commande", setup: m.setup || "", historique, commande: texte, check: c.check || "" });
      } finally {
        occupe = false;
        entree.disabled = false;
        attente.remove();
      }
      ctx.actif();
      if (r.phase === "indisponible") {
        fil.append(el("div.console-erreur", null, el("div.console-erreur-explication", null,
          "⚠️ Python n'a pas pu démarrer : LUCI ne peut pas exécuter ta commande pour l'instant. ",
          el("button.lien", { type: "button", onclick: () => BNL.App.diagnosticPython() }, "Pourquoi ?"))));
        defiler();
        return;
      }
      if (r.sortie) fil.append(el("pre.console-sortie", null, r.sortie.replace(/\n$/, "")));
      if (r.reussi) {
        if (r.expression && r.repr != null && r.repr !== "None") fil.append(el("pre.console-sortie", null, r.repr));
        historique.push(texte);
        ctx.setBrouillon("historique", historique.slice());
        ctx.journal("commande", { ok: true, detail: `C${i + 1} : ${texte}`.slice(0, 300) });
        if (c.reponse) fil.append(reponseLuci(c.reponse));
        fil.lastElementChild.classList.add("apparait");
        $$(".console-etape.actuelle", fil).forEach((x) => { x.classList.remove("actuelle"); x.classList.add("faite"); x.querySelector(".console-etape-num").textContent = "✓"; });
        i++;
        essaisIci = 0;
        if (!deja) { ms.etape = i; ctx.sauver(); }
        ed.setValue("", 1);
        if (i < N) fil.append(carteEtape(i, "actuelle"));
        else finir(false);
        majAides();
        defiler();
        ed.focus();
        return;
      }
      essaisIci++;
      if (!deja) { ms.erreurs = (ms.erreurs || 0) + 1; ms.essais = (ms.essais || 0) + 1; ctx.sauver(); }
      if (r.erreur) {
        const e = r.erreur;
        const types = ms.types || (ms.types = {});
        types[e.type] = (types[e.type] || 0) + 1;
        fil.append(el("div.console-erreur", null,
          el("div.console-erreur-brut", null, e.brut),
          el("div.console-erreur-explication", { html: "💡 " + sansP(md(e.explication || "")) })));
      } else if (r.phase === "interne" && !r.message) {
        fil.append(el("div.console-erreur", null, "Problème technique : relance la commande. " + (r.interne || "")));
      } else {
        if (r.expression && r.repr != null && r.repr !== "None") fil.append(el("pre.console-sortie", null, r.repr));
        fil.append(el("div.console-pasencore", { html: "🔎 " + sansP(md(r.message || "Ce n'est pas la commande demandée. Relis la consigne.")) }));
      }
      ctx.journal("commande", { ok: false, detail: `C${i + 1} : ${texte} → ${r.erreur ? r.erreur.brut : BNL.U.texteBrut(r.message || "")}`.slice(0, 400) });
      majAides();
      defiler();
      ed.focus();
    }

    function finir(dejaFait) {
      fil.append(el("div.console-fin", null, "✔ Toutes les commandes sont faites."),
        el("button.bouton.petit", { type: "button", onclick: recommencer }, "↺ Recommencer la console"));
      saisie.classList.add("finie");
      defiler();
      if (dejaFait) return;
      if (!deja) {
        const etoiles = (ms.reveles || 0) > 0 ? 1 : (ms.indicesCmd || 0) > 0 ? 2 : 3;
        ctx.reussir({ etoiles });
      } else ctx.reussir({});
    }

    function recommencer() {
      historique = [];
      i = 0;
      essaisIci = 0;
      saisie.classList.remove("finie");
      rendreDebut();
      ed.focus();
    }

    rendreDebut();
    if (i < N) setTimeout(() => ed.focus(), 120);
  }

  // ===========================================================================
  //  3) LIGNES À REMETTRE DANS L'ORDRE (PARSONS)
  // ===========================================================================
  function parsons(ctx) {
    const { mission: m, ms, zone } = ctx;
    const pz = m.parsons;
    const items = [...pz.lignes.map((t, k) => ({ id: k, texte: t.trim(), niveau: (t.match(/^ */)[0].length / 4) | 0, utile: true })),
      ...(pz.distracteurs || []).map((t, k) => ({ id: pz.lignes.length + k, texte: t.trim(), niveau: 0, utile: false }))];
    const ordreReserve = melanger(items.map((x) => x.id), (S.etat.joueur ? S.etat.joueur.pseudo : "") + m.id);
    let programme = (ctx.brouillon("programme") || []).filter((x) => Array.isArray(x) && items[x[0]]);

    const reserve = el("ul.parsons-liste.parsons-reserve-liste");
    const prog = el("ol.parsons-liste.parsons-programme-liste");
    const verdict = el("div.verdict", { "aria-live": "polite" });
    const sortie = el("pre.sortie.parsons-sortie", { hidden: true });
    const verifier = el("button.bouton.principal.bouton-lancer", { type: "button" }, el("span", { "aria-hidden": "true" }, "▶ "), "Vérifier mon programme");
    zone.append(el("div.travail-parsons", null,
      el("p.aide-texte.parsons-mode-emploi", { html: "👆 Touche une ligne de <strong>la réserve</strong> pour l'ajouter à ton programme. Puis range-la avec <strong>↑ ↓</strong> et décale-la avec <strong>→</strong> (vers la droite) ou <strong>←</strong>." }),
      el("div.parsons-zones", null,
        el("section.parsons-reserve", null, el("h3", null, "La réserve"), reserve),
        el("section.parsons-programme", null, el("h3", null, "Ton programme"), prog)),
      el("div.barre-outils", null, verifier, el("span.etat-python"), el("span.espace"),
        el("button.bouton.discret", { type: "button", onclick: async () => {
          if (!programme.length) return;
          const ok = await P.confirmer("Toutes les lignes retournent dans la réserve.", { titre: "Tout recommencer ?", oui: "Recommencer" });
          if (ok) { programme = []; sauver(); rendre(); }
        } }, "↺ Tout remettre")),
      verdict, sortie));

    const sauver = () => ctx.setBrouillon("programme", programme.map((x) => x.slice()));

    function rendre() {
      reserve.innerHTML = "";
      const utilises = new Set(programme.map((x) => x[0]));
      const restants = ordreReserve.filter((id) => !utilises.has(id));
      if (!restants.length) reserve.append(el("li.parsons-vide", null, "Toutes les lignes sont dans ton programme."));
      restants.forEach((id) => {
        const it = items[id];
        const b = el("button.parsons-ligne", { type: "button", title: "Ajouter au programme", html: `<code>${colorer(it.texte)}</code><span class="parsons-ajout" aria-hidden="true">＋</span>` });
        b.addEventListener("click", () => { programme.push([id, 0]); sauver(); ctx.actif(); rendre(); flash(prog.lastElementChild); });
        reserve.append(el("li", null, b));
      });
      prog.innerHTML = "";
      if (!programme.length) prog.append(el("li.parsons-vide", null, "Ton programme est vide. Touche une ligne de la réserve pour commencer."));
      programme.forEach(([id, niveau], k) => {
        const it = items[id];
        const outils = el("span.parsons-outils", null,
          bouton("↑", "Monter", k === 0, () => echanger(k, k - 1)),
          bouton("↓", "Descendre", k === programme.length - 1, () => echanger(k, k + 1)),
          bouton("←", "Décaler à gauche", niveau === 0, () => decaler(k, -1)),
          bouton("→", "Décaler à droite", niveau >= 4, () => decaler(k, 1)),
          bouton("✕", "Remettre dans la réserve", false, () => { programme.splice(k, 1); sauver(); rendre(); }));
        const li = el("li.parsons-rangee", { style: { "--niveau": niveau } },
          el("span.parsons-num", null, String(k + 1)),
          el("span.parsons-code", null, el("span.parsons-retrait", { "aria-hidden": "true" }, ...Array.from({ length: niveau }, () => el("i"))), el("code", { html: colorer(it.texte) })),
          outils);
        prog.append(li);
      });
    }

    function bouton(texte, titre, desactive, action) {
      return el("button.parsons-outil", { type: "button", title: titre, "aria-label": titre, disabled: desactive || null, onclick: () => { ctx.actif(); action(); } }, texte);
    }
    function echanger(a, b) {
      [programme[a], programme[b]] = [programme[b], programme[a]];
      sauver(); rendre(); flash(prog.children[b]);
    }
    function decaler(k, sens) {
      programme[k][1] = Math.max(0, Math.min(4, programme[k][1] + sens));
      sauver(); rendre(); flash(prog.children[k]);
    }
    function flash(n) { if (n) { n.classList.remove("flash"); void n.offsetWidth; n.classList.add("flash"); } }

    const codeAssemble = () => programme.map(([id, niveau]) => "    ".repeat(niveau) + items[id].texte).join("\n") + "\n";

    verifier.addEventListener("click", async () => {
      if (!programme.length) { verdict.innerHTML = ""; verdict.append(message("neutre", "Ton programme est vide : ajoute des lignes depuis la réserve.")); return; }
      verifier.disabled = true;
      verdict.innerHTML = `<div class="v-message v-neutre"><span class="rouage" aria-hidden="true"></span> ${BNL.Python.etat() === "pret" ? "LUCI teste ton programme…" : "Python se prépare (quelques secondes la première fois)…"}</div>`;
      const code = codeAssemble();
      let r;
      try { r = await BNL.Python.executer({ setup: m.setup || "", code, check: m.check || "" }); }
      finally { verifier.disabled = false; }
      ms.lancers = (ms.lancers || 0) + 1;
      sortie.hidden = false;
      sortie.textContent = (r.sortie || "(Ton programme n'a rien affiché.)") + (r.erreur && r.phase !== "fonction" ? "\n" + (r.erreur.ligne ? `Ligne ${r.erreur.ligne} → ` : "") + r.erreur.brut : "");
      $$(".parsons-rangee", prog).forEach((li) => li.classList.remove("erreur"));
      if (r.reussi) {
        verdict.innerHTML = "";
        verdict.append(message("reussi", "<strong>Programme correct !</strong> LUCI l'a exécuté sans problème."));
        ctx.reussir({ sortie: r.sortie || "" });
        return;
      }
      if (r.phase === "indisponible") { verdict.innerHTML = ""; verdict.append(ctx.boiteEchec(r)); sortie.hidden = true; return; }
      if (r.erreur && r.erreur.ligne && prog.children[r.erreur.ligne - 1]) prog.children[r.erreur.ligne - 1].classList.add("erreur");
      ctx.echec(r, code);
      verdict.innerHTML = "";
      verdict.append(ctx.boiteEchec(r));
      const utiles = programme.filter(([id]) => items[id].utile).length;
      if (programme.some(([id]) => !items[id].utile)) {
        verdict.append(el("p.aide-texte", null, "Rappel : certaines lignes de la réserve sont des pièges et ne servent pas."));
      } else if (utiles < pz.lignes.length) {
        verdict.append(el("p.aide-texte", null, `Ton programme contient ${utiles} ligne${utiles > 1 ? "s" : ""}. La bonne solution en utilise ${pz.lignes.length}.`));
      }
    });

    ctx.surSolution(() => {
      programme = pz.lignes.map((t, k) => [k, (t.match(/^ */)[0].length / 4) | 0]);
      sauver();
      rendre();
    });
    rendre();
  }

  // ===========================================================================
  //  4) TABLEAU D'AVANCEMENT
  // ===========================================================================
  function trace(ctx) {
    const { mission: m, ms, zone } = ctx;
    const t = m.trace;
    const conteneur = el("div.travail-trace");
    conteneur.append(el("h2", null, "Le programme à faire tourner « à la main »"), codeNumerote(m.code));

    const champ = (type, idx) => {
      if (type === "bool") {
        return el("select.trace-champ", { "data-idx": idx, "aria-label": "Réponse" }, el("option", { value: "" }, "?"),
          el("option", { value: "True" }, "True"), el("option", { value: "False" }, "False"));
      }
      return el("input.trace-champ", { type: "text", "data-idx": idx, autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": "Réponse" });
    };
    const attendus = [];
    const ajouterQuestions = (liste, titre) => {
      if (!liste || !liste.length) return;
      const bloc = el("div.trace-questions");
      if (titre) bloc.append(el("h3", null, titre));
      liste.forEach((qq) => {
        const idx = attendus.length;
        attendus.push({ rep: qq.rep, aide: qq.aide });
        bloc.append(el("label.trace-question", null, el("span", { html: enLigne(qq.q) }), champ("texte", idx)));
      });
      conteneur.append(bloc);
    };
    ajouterQuestions(t.avant, "Avant de commencer");
    const table = el("table.trace-table");
    table.append(el("thead", null, el("tr", null, t.colonnes.map((c) => el("th", null, c.titre)))));
    const corps = el("tbody");
    t.lignes.forEach((ligne, i) => {
      const tr = el("tr");
      ligne.forEach((val, j) => {
        if (t.donnees && t.donnees[i] && t.donnees[i][j]) tr.append(el("td.donnee", null, val));
        else {
          const idx = attendus.length;
          attendus.push({ rep: [val], aide: t.colonnes[j].aide });
          tr.append(el("td", null, champ(t.colonnes[j].type, idx)));
        }
      });
      corps.append(tr);
    });
    table.append(corps);
    conteneur.append(el("h3", null, "Le tableau d'avancement"), el("div.tableau-defile", null, table));
    ajouterQuestions(t.apres, "Pour finir");
    const retour = el("div.trace-retour", { "aria-live": "polite" });
    const bouton = el("button.bouton.principal", { type: "button" }, "Vérifier mes réponses");
    conteneur.append(el("div.trace-actions", null, bouton), retour);
    zone.append(conteneur);

    const champs = $$(".trace-champ", conteneur);
    const sauvegarde = ctx.brouillon("reponses") || [];
    champs.forEach((c, i) => { if (sauvegarde[i]) c.value = sauvegarde[i]; });
    const sauverRetarde = BNL.U.retarder(() => ctx.setBrouillon("reponses", champs.map((c) => c.value)), 800);
    conteneur.addEventListener("input", () => { ctx.actif(); sauverRetarde(); });
    conteneur.addEventListener("change", () => { ctx.actif(); sauverRetarde(); });

    bouton.addEventListener("click", () => {
      const faux = [];
      const vides = champs.filter((c) => !c.value.trim()).length;
      champs.forEach((c, i) => {
        const ok = attendus[i].rep.some((r) => normSaisie(r) === normSaisie(c.value));
        c.classList.toggle("juste", ok);
        c.classList.toggle("faux", !ok);
        c.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok) faux.push(i);
      });
      ctx.setBrouillon("reponses", champs.map((c) => c.value));
      if (!faux.length) {
        retour.innerHTML = "";
        retour.append(message("reussi", "<strong>Tout est juste !</strong>"));
        ctx.reussir({});
        return;
      }
      ctx.echec({ phase: "verification", message: `${faux.length} case(s) fausse(s)` }, null);
      const aides = [...new Set(faux.map((i) => attendus[i].aide).filter(Boolean))].slice(0, 3);
      retour.innerHTML = "";
      retour.append(el("div.v-message.v-pasencore", null,
        el("div.v-titre", null, el("span.v-pictogramme", { "aria-hidden": "true" }, "🔎"), el("strong", null, `${faux.length} réponse${faux.length > 1 ? "s" : ""} à revoir`), " (en rouge)"),
        vides ? el("p", null, `Il reste ${vides} case${vides > 1 ? "s" : ""} vide${vides > 1 ? "s" : ""}.`) : null,
        aides.length ? el("ul", null, aides.map((a) => el("li", { html: enLigne(a) }))) : null));
    });

    ctx.surSolution(() => {
      const valeurs = [];
      (t.avant || []).forEach((q) => valeurs.push(q.rep[0]));
      t.lignes.forEach((l, i) => l.forEach((v, j) => { if (!(t.donnees && t.donnees[i] && t.donnees[i][j])) valeurs.push(v); }));
      (t.apres || []).forEach((q) => valeurs.push(q.rep[0]));
      champs.forEach((c, i) => { c.value = valeurs[i]; c.classList.remove("faux"); c.classList.add("montre"); });
      ctx.setBrouillon("reponses", valeurs);
    });
  }

  // ===========================================================================
  //  5) PROGRAMME (éditeur de code)
  // ===========================================================================
  function code(ctx) {
    const { mission: m, ms, zone } = ctx;
    let enCours = false;
    const outils = el("div.barre-outils", null,
      el("button.bouton.principal.bouton-lancer", { type: "button", title: "Lancer le programme (Ctrl + Entrée)" },
        el("span.icone-lancer", { "aria-hidden": "true" }, "▶"), el("span", null, "Lancer"), el("kbd", null, "Ctrl+Entrée")),
      el("span.etat-python"),
      el("span.espace"),
      el("button.bouton.discret", { type: "button", title: "Remettre le code de départ", "data-action": "depart" }, "↺ Départ"),
      el("div.taille-police", { role: "group", "aria-label": "Taille du texte" },
        el("button.bouton.discret", { type: "button", "data-action": "moins", title: "Texte plus petit" }, "A−"),
        el("button.bouton.discret", { type: "button", "data-action": "plus", title: "Texte plus grand" }, "A+")));
    const noeud = el("div.editeur", { "aria-label": "Éditeur de code Python" });
    const resultats = el("div.resultats", null,
      el("div.verdict", { "aria-live": "polite" }, verdictInitial()),
      el("div.onglets", { role: "tablist" },
        el("button.onglet.actif", { type: "button", role: "tab", "data-onglet": "console" }, "Console"),
        el("button.onglet", { type: "button", role: "tab", "data-onglet": "variables" }, "Variables")),
      el("div.panneau-resultat.console", { "data-panneau": "console" }, el("pre.sortie", null, el("span.sortie-vide", null, "Ce que ton programme affiche avec print(…) apparaîtra ici."))),
      el("div.panneau-resultat.variables", { "data-panneau": "variables", hidden: true }, el("p.vide", null, "Lance ton programme pour voir ce qu'il range en mémoire.")));
    zone.append(el("div.travail-code", null, outils, noeud, resultats));

    const ed = BNL.Editeur.creer(noeud, { theme: ctx.themeAce(), taille: S.etat.taillePolice || 16 });
    ctx.enregistrerEditeur(ed);
    const brouillon = ctx.brouillon("code");
    ed.setValue(brouillon != null ? brouillon : m.starter, 1);
    ed.clearSelection();
    ed.session.getUndoManager().reset();
    ed.commands.addCommand({ name: "lancer", bindKey: { win: "Ctrl-Enter", mac: "Cmd-Enter" }, exec: () => lancer() });
    const sauverCode = BNL.U.retarder(() => ctx.setBrouillon("code", ed.getValue()), 900);
    ed.on("change", () => { ctx.actif(); sauverCode(); });
    if (!ed.find("___", { start: { row: 0, column: 0 }, wrap: true })) ed.gotoLine(1, 0);

    $(".bouton-lancer", outils).addEventListener("click", lancer);
    outils.addEventListener("click", async (e) => {
      const a = e.target.closest("[data-action]");
      if (!a) return;
      if (a.dataset.action === "depart") {
        const ok = await P.confirmer("Ton code actuel sera remplacé par le code de départ de la mission.", { titre: "Recommencer ?", oui: "Recommencer" });
        if (ok) { ed.setValue(m.starter, -1); ed.focus(); }
      }
      if (a.dataset.action === "moins" || a.dataset.action === "plus") {
        const t = Math.min(26, Math.max(12, (S.etat.taillePolice || 16) + (a.dataset.action === "plus" ? 2 : -2)));
        S.etat.taillePolice = t;
        ed.setFontSize(t);
        S.sauver();
      }
    });
    $(".onglets", resultats).addEventListener("click", (e) => {
      const o = e.target.closest("[data-onglet]");
      if (o) choisirOnglet(o.dataset.onglet);
    });

    function choisirOnglet(nom) {
      $$(".onglet", resultats).forEach((o) => o.classList.toggle("actif", o.dataset.onglet === nom));
      $$("[data-panneau]", resultats).forEach((p) => { p.hidden = p.dataset.panneau !== nom; });
    }

    function verdictInitial() {
      if (ms.statut === "reussie") return message("reussi", "<strong>Mission déjà réussie.</strong> Tu peux relancer ton programme, ou passer à la suite.");
      return message("neutre", m.starter && m.starter.includes("___")
        ? "Remplace chaque <code>___</code> dans le code, puis clique sur ▶ Lancer."
        : "Écris ou corrige le programme, puis clique sur ▶ Lancer.");
    }

    const lignesAvecTrous = (c) => c.split("\n").map((l, i) => (/(?<![A-Za-z0-9_])___(?![A-Za-z0-9_])/.test(l.replace(/#.*$/, "")) ? i + 1 : 0)).filter(Boolean);

    async function lancer() {
      if (enCours) return;
      const c = ed.getValue();
      ctx.actif();
      BNL.Editeur.effacerErreurs(ed);
      const verdict = $(".verdict", resultats);
      if (!c.trim()) { verdict.innerHTML = ""; verdict.append(message("neutre", "Ton programme est vide : écris quelques lignes avant de le lancer.")); return; }
      const trous = lignesAvecTrous(c);
      if (trous.length) {
        BNL.Editeur.montrerTrous(ed, trous);
        verdict.innerHTML = "";
        verdict.append(message("trous", `<strong>Il reste ${trous.length > 1 ? "des trous" : "un trou"} <code>___</code> à compléter</strong> (ligne${trous.length > 1 ? "s" : ""} ${trous.join(", ")}). Remplace-${trous.length > 1 ? "les" : "le"} par du code, puis relance.`));
        ctx.journal("essai", { ok: false, detail: "trous non complétés" });
        return;
      }
      enCours = true;
      const bouton = $(".bouton-lancer", outils);
      bouton.classList.add("occupe");
      bouton.disabled = true;
      verdict.innerHTML = `<div class="v-message v-neutre"><span class="rouage" aria-hidden="true"></span> ${BNL.Python.etat() === "pret" ? "Python exécute ton programme…" : "Python se prépare (quelques secondes la première fois)…"}</div>`;
      let r;
      try { r = await BNL.Python.executer({ setup: m.setup || "", code: c, check: m.check || "" }); }
      finally { enCours = false; bouton.classList.remove("occupe"); bouton.disabled = false; }
      ms.lancers = (ms.lancers || 0) + 1;
      S.etat.stats.lancers = (S.etat.stats.lancers || 0) + 1;
      afficherSortie(r);
      if (r.reussi) {
        verdict.innerHTML = "";
        verdict.append(message("reussi", "<strong>Mission réussie !</strong>" + (r.message ? " " + sansP(md(r.message)) : "")));
        ctx.reussir({ code: c, sortie: r.sortie || "" });
        return;
      }
      if (r.phase === "trous") {
        BNL.Editeur.montrerTrous(ed, r.lignes_trous || []);
        verdict.innerHTML = "";
        verdict.append(message("trous", md(r.message)));
        return;
      }
      if (r.phase !== "indisponible") ctx.echec(r, c);
      if (r.erreur && r.erreur.ligne) BNL.Editeur.montrerErreur(ed, r.erreur.ligne, r.erreur.explication);
      verdict.innerHTML = "";
      verdict.append(ctx.boiteEchec(r));
    }

    function afficherSortie(r) {
      const pre = $(".console .sortie", resultats);
      pre.innerHTML = "";
      const s = r.sortie || "";
      if (s) pre.append(document.createTextNode(s.length > 15000 ? s.slice(0, 15000) + "\n…" : s));
      if (r.erreur && r.phase !== "fonction") {
        pre.append(el("span.sortie-erreur", null, (s && !s.endsWith("\n") ? "\n" : "") + (r.erreur.ligne ? `Ligne ${r.erreur.ligne} → ` : "") + r.erreur.brut));
      }
      if (!s && !r.erreur) pre.append(el("span.sortie-vide", null, "(Ton programme n'a rien affiché.)"));
      $(".variables[data-panneau]", resultats).innerHTML = BNL.Visu.variables(r.variables || []);
    }

    ctx.surSolution(() => {}, async () => {
      const ok = await P.confirmer("Ton code actuel sera remplacé par la correction.", { titre: "Remplacer ton code ?", oui: "Remplacer" });
      if (!ok) return;
      ed.setValue(m.solution, -1);
      ed.focus();
    });
    ctx.surLancer(lancer);
  }

  return { etapes, plan, resumePlan, sequence, commande, parsons, trace, code, codeNumerote, melanger, normSaisie, RENDUS };
})();
