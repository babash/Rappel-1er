// Les scènes de l'histoire, en planches de manga verticales (façon webtoon).
//
// Une case : { qui, texte, expr, type, fx, decor, cote, radio, sortie }
//   qui    : cap, bolt, nour, luci, huit, vex, orsa, gombessa, toi, narration
//   type   : "dialogue" (défaut), "cri", "pensee", "ecran" (terminal de LUCI), "titre"
//   expr   : neutre, sourire, rire, serieux, colere, choc, sueur, triste, malin
//   fx     : onomatopée (« BZZZT ! »)      decor : décor d'une case de narration
//   radio  : le personnage parle depuis un écran      sortie : affiche la sortie du programme de l'élève
// Une réplique (choix du joueur) : { q, choix: [...], bonne, retours: { k: case }, ok: case }
window.BNL = window.BNL || {};

BNL.Manga = (() => {
  const { $, $$, el, md, enLigne, echapper } = BNL.U;

  // ---------------------------------------------------------------- ambiances (fond des cases)
  const AMBIANCES = {
    p0: ["#22324a", "#0d1626"], p1: ["#2f9d8c", "#0f4f5c"], p2: ["#25a3b8", "#0d4a72"], p3: ["#1c78b8", "#0a2f5e"],
    p4: ["#155a9a", "#06203f"], p5: ["#0e2a4d", "#030912"], p6: ["#2a1d1d", "#080505"],
    e1: ["#5f9e6e", "#1d4a3a"], e2: ["#2ab3b0", "#0b4f6b"], e3: ["#2a6fb3", "#071f45"], e4: ["#2c3155", "#0b0d1f"], e5: ["#4f8d5c", "#163a2a"],
    alerte: ["#5a1420", "#1a0408"], nuit: ["#1a2236", "#06080f"],
  };

  // ---------------------------------------------------------------- décors des cases de narration
  const E = "#151515";
  function sousMarinLuciole(x, y, s = 1, faisceau = true) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      ${faisceau ? `<path d="M30 0 L170 -60 L170 60 Z" fill="#fff6b0" opacity=".28"/>` : ""}
      <path d="M-70 0 C-70 -24 -36 -32 0 -32 C36 -32 62 -22 62 0 C62 22 36 32 0 32 C-36 32 -70 24 -70 0 Z" fill="#ffd86a" stroke="${E}" stroke-width="4"/>
      <path d="M-20 -30 L-14 -48 L16 -48 L20 -30 Z" fill="#e7a92c" stroke="${E}" stroke-width="3.4"/>
      <circle cx="30" cy="-2" r="15" fill="#0f5f78" stroke="${E}" stroke-width="3"/><circle cx="30" cy="-2" r="10" fill="#9fe6f0"/>
      <circle cx="-10" cy="0" r="6" fill="#0f5f78" stroke="${E}" stroke-width="2"/><circle cx="-34" cy="0" r="6" fill="#0f5f78" stroke="${E}" stroke-width="2"/>
      <path d="M-70 0 L-88 -14 L-88 14 Z" fill="#c78a1e" stroke="${E}" stroke-width="3"/>
    </g>`;
  }
  function leviathan(x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-120 6 L-96 -26 L40 -34 L110 -10 L126 6 L104 24 L-90 30 Z" fill="#141418" stroke="#000" stroke-width="4"/>
      <path d="M-40 -32 L-30 -60 L30 -60 L44 -34 Z" fill="#1d1d24" stroke="#000" stroke-width="3.4"/>
      <path d="M-120 6 L-146 -16 L-146 28 Z" fill="#1d1d24" stroke="#000" stroke-width="3"/>
      ${[-70, -40, -10, 20, 50].map((cx) => `<rect x="${cx}" y="-6" width="16" height="6" rx="2" fill="#ff2a3d"/>`).join("")}
      <circle cx="96" cy="2" r="9" fill="#ff2a3d"/><circle cx="96" cy="2" r="18" fill="#ff2a3d" opacity=".25"/>
      <path d="M-4 -46 L4 -38 L-4 -30 L-12 -38 Z" fill="none" stroke="#a46cff" stroke-width="2.4"/>
    </g>`;
  }
  function drone(x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-30 -10 L30 -10 L40 10 L-40 10 Z" fill="#18181d" stroke="#000" stroke-width="3"/>
      <path d="M-40 10 L-56 30 M40 10 L56 30 M-14 10 L-20 32 M14 10 L20 32" stroke="#18181d" stroke-width="5" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="7" fill="#ff2a3d"/><circle cx="0" cy="0" r="16" fill="#ff2a3d" opacity=".3"/>
    </g>`;
  }
  function bulles(n, graine = 3) {
    let s = "", g = graine;
    for (let i = 0; i < n; i++) {
      g = (g * 9301 + 49297) % 233280;
      const x = (g / 233280) * 600, y = ((g * 7) % 233280) / 233280 * 260;
      s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${2 + (i % 4)}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6"/>`;
    }
    return s;
  }
  const DECORS = {
    hangar: () => `<rect width="600" height="260" fill="#101a2c"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 97) % 600}" cy="${(i * 41) % 110}" r="${1 + (i % 2)}" fill="#fff" opacity=".6"/>`).join("")}
      <path d="M0 150 L600 150 L600 260 L0 260 Z" fill="#0b2a44"/><path d="M0 150 C100 146 200 156 300 150 C400 144 500 156 600 150" stroke="#6fb7d6" stroke-width="2" fill="none" opacity=".6"/>
      <rect x="0" y="120" width="230" height="22" fill="#3a3530" stroke="${E}" stroke-width="3"/>${[20, 80, 140, 200].map((x) => `<rect x="${x}" y="142" width="10" height="60" fill="#2a2420" stroke="${E}" stroke-width="2"/>`).join("")}
      <path d="M380 0 L380 120 M380 40 L460 40 L460 60" stroke="#c9b37a" stroke-width="5" fill="none"/><circle cx="380" cy="12" r="8" fill="#ffe39a"/><circle cx="380" cy="12" r="40" fill="#ffe39a" opacity=".12"/>
      ${sousMarinLuciole(350, 160, 1.1, false)}`,
    luciole: () => `${sousMarinLuciole(250, 140, 1.2)}${bulles(14)}`,
    leviathan: () => `${bulles(10, 7)}${leviathan(330, 130, 1.3)}`,
    duo: () => `${sousMarinLuciole(150, 170, .8)}${leviathan(430, 90, .9)}${bulles(12, 11)}`,
    drone: () => `${sousMarinLuciole(220, 160, 1.2, false)}${drone(250, 110, 1.3)}
      <g stroke="#ff2a3d" stroke-width="3" opacity=".8"><path d="M250 90 L230 40"/><path d="M262 92 L290 46"/><path d="M240 96 L196 70"/></g>`,
    grotte: () => `<rect width="600" height="260" fill="#0c0806"/>
      <path d="M0 0 L600 0 L600 260 L0 260 Z M120 200 C120 140 170 110 210 120 C250 130 260 180 250 230 Z M360 220 C360 170 400 150 430 160 C460 170 464 210 456 240 Z" fill="#2b211c" fill-rule="evenodd"/>
      ${Array.from({ length: 20 }, (_, i) => `<circle cx="${(i * 131) % 600}" cy="${(i * 53) % 260}" r="1.6" fill="#6ff7e8" opacity="${0.2 + (i % 4) * 0.15}"/>`).join("")}
      <circle cx="190" cy="180" r="5" fill="#c9f06b"/><circle cx="190" cy="180" r="16" fill="#c9f06b" opacity=".25"/>`,
    gombessa: () => `<rect width="600" height="260" fill="#06101f"/><g transform="translate(60 -125) scale(2.2)">${BNL.Persos.dessin("gombessa").replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`,
    lumieres: () => `${Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 97) % 600}" cy="${(i * 53) % 260}" r="${1 + (i % 3)}" fill="${i % 4 ? "#6ff7e8" : "#c7a3ff"}" opacity="${0.3 + (i % 5) * 0.14}"/>`).join("")}
      <circle cx="470" cy="80" r="30" fill="#fff" opacity=".9"/><circle cx="470" cy="80" r="90" fill="#fff" opacity=".18"/>${sousMarinLuciole(160, 170, .8, false)}`,
  };
  function decor(cle) {
    if (!cle) return "";
    if (cle.startsWith("espece:")) return `<div class="cm-decor cm-decor-espece">${BNL.Illus.carte(cle.slice(7))}</div>`;
    const f = DECORS[cle];
    return f ? `<div class="cm-decor"><svg viewBox="0 0 600 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${f()}</svg></div>` : "";
  }

  // ---------------------------------------------------------------- noms
  function personnage(qui) {
    if (qui === "toi") {
      const j = BNL.Store && BNL.Store.etat.joueur;
      return { nom: j ? j.pseudo : "Toi", role: "la Recrue" };
    }
    return BNL.PERSONNAGES[qui] || { nom: "", role: "" };
  }

  // ---------------------------------------------------------------- une case
  function caseManga(c, options = {}) {
    const type = c.type || (c.qui === "narration" || !c.qui ? "narration" : c.qui === "luci" && c.ecran ? "ecran" : "dialogue");
    const amb = AMBIANCES[c.fond] || AMBIANCES[options.ambiance] || AMBIANCES.p0;
    const fig = el(`figure.cm.cm-${type}` + (c.fx ? ".cm-avec-fx" : "") + (c.expr === "choc" || c.type === "cri" ? ".cm-vitesse" : "") + (options.statique ? ".cm-statique" : ""));
    fig.style.setProperty("--amb1", amb[0]);
    fig.style.setProperty("--amb2", amb[1]);
    if (type === "titre") {
      fig.append(el("div.cm-titre-carte", null, el("span.cm-titre-sur", null, c.sur || ""), el("strong", null, c.texte), c.sous ? el("span.cm-titre-sous", null, c.sous) : null));
      return fig;
    }
    if (type === "narration") {
      fig.insertAdjacentHTML("beforeend", decor(c.decor || "luciole"));
      fig.append(el("div.cm-legende", { html: enLigne(c.texte) }));
    } else if (type === "ecran") {
      const ecran = el("div.cm-terminal", null, el("div.cm-ecran-tete", null, "LUCI · terminal"));
      if (c.texte) ecran.append(el("div.cm-ecran-texte", { html: enLigne(c.texte) }));
      if (c.sortie) {
        const s = options.sortie;
        ecran.append(el("pre.cm-ecran-sortie", null, s && s.trim() ? s.trim().split("\n").slice(-6).join("\n") : "> programme exécuté. 0 erreur."));
      }
      fig.append(el("div.cm-perso.cm-perso-luci", { html: BNL.Persos.dessin("luci", c.expr || "neutre") }), ecran);
    } else {
      const p = personnage(c.qui);
      if (p.couleur) fig.style.setProperty("--perso", p.couleur);
      const cote = c.cote || options.cote || "g";
      fig.classList.add("cm-cote-" + cote);
      const perso = el("div.cm-perso" + (c.radio ? ".cm-radio" : ""), { html: BNL.Persos.dessin(c.qui, c.expr || "neutre") });
      if (c.radio) perso.append(el("span.cm-radio-badge", null, "RADIO"));
      const bulle = el(`div.cm-bulle.cm-bulle-${type}` + (c.qui === "luci" ? ".cm-bulle-luci" : ""),
        null, el("span.cm-nom", null, p.nom), el("p", { html: enLigne(c.texte) }));
      fig.append(perso, bulle);
    }
    if (c.fx) fig.append(el("span.cm-fx", null, c.fx));
    if (!options.statique && BNL.U.peutLire() && c.texte) {
      const b = el("button.cm-lire", { type: "button", title: "Écouter", "aria-label": "Écouter cette case" }, "🔊");
      b.addEventListener("click", (e) => { e.stopPropagation(); BNL.U.lire(texteALire(c), b); });
      fig.append(b);
    }
    return fig;
  }

  function texteALire(c) {
    const p = c.qui && c.qui !== "narration" ? personnage(c.qui).nom + ". " : "";
    return p + (c.texte || "");
  }

  // Alterne les côtés quand l'auteur ne les précise pas
  function avecCotes(cases) {
    let dernier = "d", dernierQui = null;
    return cases.map((c) => {
      if (c.cote || !c.qui || c.qui === "narration" || c.type === "titre") return c;
      let cote;
      if (c.qui === dernierQui) cote = dernier; else cote = dernier === "g" ? "d" : "g";
      dernier = cote; dernierQui = c.qui;
      return Object.assign({ cote }, c);
    });
  }

  // ---------------------------------------------------------------- planche statique (fenêtre de réussite, récapitulatif)
  function planche(cases, options = {}) {
    const z = el("div.planche.planche-statique");
    avecCotes(cases).forEach((c) => z.append(caseManga(c, Object.assign({ statique: false }, options))));
    return z;
  }

  // ---------------------------------------------------------------- jouer une scène (plein écran)
  // options : { titre, ambiance, obligatoire, replique, boutonFin, sortie, chapitre }
  function jouer(cases, options = {}) {
    return new Promise((resoudre) => {
      if (window.speechSynthesis) speechSynthesis.cancel();
      const S = BNL.Store;
      const liste = avecCotes(cases.slice());
      const bande = el("div.planche", { "aria-live": "polite" });
      const defile = el("div.scene-defile", null, bande);
      const suite = el("button.bouton.principal.large.scene-suite", { type: "button" }, "Suite ▶");
      const passer = el("button.bouton.discret.scene-passer", { type: "button" }, "Passer la scène");
      const auto = el("button.bouton.petit.scene-auto", { type: "button", "aria-pressed": S && S.etat.lectureAuto ? "true" : "false", title: "Lire chaque case à voix haute (activer / désactiver)" },
        "🔊", el("span", null, " Lecture auto"));
      const compteur = el("span.scene-compte");
      const scene = el("div.scene", { role: "dialog", "aria-modal": "true", "aria-label": options.titre || "Scène" },
        el("div.scene-tete", null, el("span.scene-titre", null, options.titre || ""), el("span.espace"), BNL.U.peutLire() ? auto : null),
        defile,
        el("div.scene-pied", null, options.obligatoire ? el("span") : passer, compteur, suite));
      document.body.append(scene);
      document.body.classList.add("scene-ouverte");
      requestAnimationFrame(() => scene.classList.add("visible"));
      let i = 0;
      let fini = false;

      auto.addEventListener("click", () => {
        if (!S) return;
        S.etat.lectureAuto = !S.etat.lectureAuto;
        S.sauver();
        auto.setAttribute("aria-pressed", S.etat.lectureAuto ? "true" : "false");
        if (S.etat.lectureAuto && i > 0) BNL.U.lire(texteALire(liste[i - 1]));
        else if (window.speechSynthesis) speechSynthesis.cancel();
      });

      function montrer(c) {
        const n = caseManga(c, { ambiance: options.ambiance, sortie: options.sortie });
        n.classList.add("cm-apparait");
        bande.append(n);
        requestAnimationFrame(() => n.scrollIntoView({ block: "end", behavior: BNL.U.reduitMouvement() ? "auto" : "smooth" }));
        if (S && S.etat.lectureAuto && c.texte) BNL.U.lire(texteALire(c));
        return n;
      }

      function avancer() {
        if (fini) return;
        if (i < liste.length) {
          montrer(liste[i]);
          i++;
          compteur.textContent = `${i} / ${liste.length}`;
          if (i === liste.length) {
            if (options.replique) { suite.hidden = true; poserReplique(); }
            else suite.textContent = options.boutonFin || "Continuer ▶";
          }
          setTimeout(() => suite.focus({ preventScroll: true }), 30);
          return;
        }
        terminer();
      }

      function poserReplique() {
        const r = options.replique;
        const zone = el("div.replique", null,
          el("div.replique-q", null, el("span.replique-toi", { html: BNL.Persos.dessin("toi") }),
            el("div", null, el("span.replique-label", null, "À toi de répondre"), el("p", { html: enLigne(r.q) }))));
        const choix = el("div.replique-choix");
        const ordre = r.choix.map((_, k) => k);
        ordre.forEach((k) => {
          const b = el("button.replique-bouton", { type: "button", html: enLigne(r.choix[k]) });
          b.addEventListener("click", () => {
            if (b.disabled) return;
            if (k === r.bonne) {
              zone.remove();
              montrer({ qui: "toi", texte: r.choix[k], expr: "neutre" });
              if (S) S.journal("replique", S.etat.courante, { ok: true, detail: (r.q || "").slice(0, 120) });
              if (r.ok) setTimeout(() => montrer(r.ok), 350);
              suite.hidden = false;
              suite.textContent = options.boutonFin || "Commencer la mission ▶";
              i = liste.length;
              setTimeout(() => suite.focus({ preventScroll: true }), 60);
              return;
            }
            b.disabled = true;
            b.classList.add("faux");
            if (S) S.journal("replique", S.etat.courante, { ok: false, detail: BNL.U.texteBrut(r.choix[k]).slice(0, 160) });
            const ret = (r.retours && r.retours[k]) || { qui: "luci", expr: "serieux", texte: "Négatif. Relis la scène : la réponse y est." };
            const n = caseManga(Object.assign({}, ret), { ambiance: options.ambiance });
            n.classList.add("cm-apparait", "cm-retour");
            bande.insertBefore(n, zone);
            requestAnimationFrame(() => zone.scrollIntoView({ block: "end", behavior: "smooth" }));
            if (S && S.etat.lectureAuto) BNL.U.lire(texteALire(ret));
          });
          choix.append(b);
        });
        zone.append(choix);
        bande.append(zone);
        requestAnimationFrame(() => zone.scrollIntoView({ block: "end", behavior: "smooth" }));
        if (S && S.etat.lectureAuto) BNL.U.lire("À toi de répondre. " + r.q);
      }

      function terminer() {
        if (fini) return;
        fini = true;
        if (window.speechSynthesis) speechSynthesis.cancel();
        scene.classList.remove("visible");
        document.body.classList.remove("scene-ouverte");
        document.removeEventListener("keydown", clavier, true);
        setTimeout(() => scene.remove(), 220);
        resoudre(true);
      }

      function clavier(e) {
        if (e.key === "Escape" && !options.obligatoire) { e.preventDefault(); terminer(); }
      }
      document.addEventListener("keydown", clavier, true);
      suite.addEventListener("click", avancer);
      passer.addEventListener("click", terminer);
      // Un clic dans la planche fait aussi avancer (sauf sur un bouton)
      defile.addEventListener("click", (e) => { if (!e.target.closest("button") && !suite.hidden) avancer(); });
      avancer();
    });
  }

  return { jouer, planche, caseManga, AMBIANCES };
})();
