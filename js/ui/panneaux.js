// Panneaux, fenêtres, bulles d'aide et notifications.
window.BNL = window.BNL || {};

BNL.Panneaux = (() => {
  const { $, $$, el, md, echapper } = BNL.U;

  // ---------------------------------------------------------------------------
  //  Notifications (toasts)
  // ---------------------------------------------------------------------------
  function toast(html, options = {}) {
    const zone = $("#toasts");
    const t = el("div.toast" + (options.type ? "." + options.type : ""), { role: "status", html });
    zone.append(t);
    requestAnimationFrame(() => t.classList.add("visible"));
    const fermer = () => { t.classList.remove("visible"); setTimeout(() => t.remove(), 300); };
    setTimeout(fermer, options.duree || 4500);
    t.addEventListener("click", fermer);
    return t;
  }

  // ---------------------------------------------------------------------------
  //  Fenêtres modales et tiroirs
  // ---------------------------------------------------------------------------
  let pile = [];
  function ouvrir(contenu, options = {}) {
    const fond = el("div.voile" + (options.tiroir ? ".voile-tiroir" : ""));
    const boite = el("div" + (options.tiroir ? ".tiroir" : ".modale") + (options.classe ? "." + options.classe : ""),
      { role: "dialog", "aria-modal": "true", "aria-label": options.titre || "Fenêtre" });
    if (options.titre) {
      boite.append(el("div.fenetre-entete", null,
        el("h2", { html: options.titre }),
        el("button.bouton-fermer", { type: "button", "aria-label": "Fermer", onclick: () => fermer() }, "✕")));
    }
    const corps = el("div.fenetre-corps");
    if (typeof contenu === "string") corps.innerHTML = contenu; else corps.append(contenu);
    boite.append(corps);
    fond.append(boite);
    document.body.append(fond);
    const precedent = document.activeElement;
    requestAnimationFrame(() => fond.classList.add("visible"));
    fond.addEventListener("mousedown", (e) => { if (e.target === fond && !options.bloquant) fermer(); });
    const entree = { fond, boite, corps, options, precedent };
    pile.push(entree);
    setTimeout(() => {
      const focusable = boite.querySelector("[autofocus], button.principal, input, button");
      if (focusable) focusable.focus({ preventScroll: true });
    }, 60);
    return entree;
  }

  function fermer(entree) {
    entree = entree || pile[pile.length - 1];
    if (!entree) return;
    pile = pile.filter((x) => x !== entree);
    entree.fond.classList.remove("visible");
    setTimeout(() => entree.fond.remove(), 220);
    if (entree.options.surFermeture) entree.options.surFermeture();
    if (entree.precedent && entree.precedent.focus) entree.precedent.focus({ preventScroll: true });
  }
  const fermerTout = () => [...pile].reverse().forEach((e) => fermer(e));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && pile.length && !pile[pile.length - 1].options.bloquant) {
      if (document.querySelector(".ace_autocomplete:not([style*='display: none'])")) return;
      fermer();
    }
  });

  function confirmer(question, options = {}) {
    return new Promise((resoudre) => {
      const contenu = el("div.confirmation", null,
        el("div", { html: md(question) }),
        el("div.boutons", null,
          el("button.bouton", { type: "button", onclick: () => { fermer(f); resoudre(false); } }, options.non || "Annuler"),
          el("button.bouton.principal", { type: "button", onclick: () => { fermer(f); resoudre(true); } }, options.oui || "Oui")));
      const f = ouvrir(contenu, { titre: options.titre || "Confirmation", classe: "petite" });
    });
  }

  // ---------------------------------------------------------------------------
  //  Bulles de dialogue des personnages
  // ---------------------------------------------------------------------------
  // Portrait rond (tête seule) d'un personnage
  function portrait(qui, expr) {
    const html = BNL.Persos ? BNL.Persos.dessin(qui, expr || "neutre", { tete: true }) : "";
    return el("div.portrait", { "aria-hidden": "true", html });
  }

  function bulle(b) {
    const p = BNL.PERSONNAGES[b.qui] || BNL.PERSONNAGES.journal;
    const n = el("div.bulle.bulle-" + b.qui + (b.qui === "journal" ? ".bulle-narration" : ""));
    n.style.setProperty("--perso", p.couleur);
    n.append(portrait(b.qui, b.expr));
    const texte = el("div.bulle-texte");
    texte.append(el("div.bulle-nom", null, el("strong", null, p.nom), p.role ? el("span", null, p.role) : null));
    texte.append(el("div.bulle-contenu", { html: md(b.texte) }));
    n.append(texte);
    if (BNL.U.peutLire()) {
      const bouton = el("button.bouton-lire", { type: "button", title: "Écouter", "aria-label": "Écouter ce texte" }, "🔊");
      bouton.addEventListener("click", () => BNL.U.lire(p.nom + ". " + b.texte, bouton));
      n.append(bouton);
    }
    return n;
  }

  // Bulle d'aide de la commandante, en bas de l'espace de travail
  let coachActuel = null;
  function coach(texte, actions = [], options = {}) {
    if (coachActuel) coachActuel.remove();
    const n = el("div.coach", { role: "status" },
      portrait(options.qui || "luci", options.expr),
      el("div.coach-texte", null, el("div", { html: md(texte) }),
        actions.length ? el("div.coach-actions", null, actions.map((a) => el("button.bouton.petit" + (a.principal ? ".principal" : ""),
          { type: "button", onclick: () => { n.remove(); a.action(); } }, a.texte))) : null),
      el("button.bouton-fermer", { type: "button", "aria-label": "Fermer", onclick: () => n.remove() }, "✕"));
    (options.dans || document.body).append(n);
    coachActuel = n;
    requestAnimationFrame(() => n.classList.add("visible"));
    if (options.duree !== 0) setTimeout(() => { if (n.isConnected) n.remove(); }, options.duree || 20000);
    return n;
  }

  // ---------------------------------------------------------------------------
  //  Visite guidée (première fois)
  // ---------------------------------------------------------------------------
  function visite(etapes, fin) {
    etapes = etapes.filter((e) => !e.cible || $(e.cible));
    if (!etapes.length) { if (fin) fin(); return; }
    let i = 0;
    const voile = el("div.visite-voile");
    const cadre = el("div.visite-cadre");
    const info = el("div.visite-info", { role: "dialog", "aria-live": "polite" });
    document.body.append(voile, cadre, info);
    const terminer = () => { voile.remove(); cadre.remove(); info.remove(); window.removeEventListener("resize", placer); if (fin) fin(); };
    function placer() {
      const e = etapes[i];
      const cible = e.cible && $(e.cible);
      info.innerHTML = "";
      info.append(el("div", { html: md(e.texte) }),
        el("div.visite-boutons", null,
          el("button.bouton.petit", { type: "button", onclick: terminer }, "Passer"),
          el("span.visite-compte", null, `${i + 1} / ${etapes.length}`),
          el("button.bouton.petit.principal", { type: "button", onclick: () => { i++; if (i >= etapes.length) terminer(); else placer(); } },
            i === etapes.length - 1 ? "C'est parti !" : "Suivant")));
      if (cible) {
        cible.scrollIntoView({ block: "nearest", behavior: "smooth" });
        const r = cible.getBoundingClientRect();
        const H = window.innerHeight, W = window.innerWidth, L = Math.min(340, W - 24), h = info.offsetHeight || 170;
        Object.assign(cadre.style, { display: "block", top: Math.max(4, r.top - 6) + "px", left: Math.max(4, r.left - 6) + "px",
          width: Math.min(W - 8, r.width + 12) + "px", height: Math.min(H - 8, r.height + 12) + "px" });
        let top, left;
        if (r.bottom + h + 24 < H) { top = r.bottom + 16; left = r.left; }                 // en dessous
        else if (r.top - h - 24 > 0) { top = r.top - h - 16; left = r.left; }              // au-dessus
        else if (r.right + L + 24 < W) { top = r.top + 40; left = r.right + 18; }           // à droite
        else if (r.left - L - 24 > 0) { top = r.top + 40; left = r.left - L - 18; }          // à gauche
        else { top = H - h - 24; left = (W - L) / 2; }                                       // en bas, au centre
        Object.assign(info.style, { top: Math.max(12, Math.min(top, H - h - 12)) + "px", left: Math.max(12, Math.min(left, W - L - 12)) + "px" });
      } else {
        cadre.style.display = "none";
        Object.assign(info.style, { top: "30%", left: "calc(50% - 170px)" });
      }
      const bouton = info.querySelector(".principal");
      if (bouton) bouton.focus();
    }
    window.addEventListener("resize", placer);
    placer();
  }

  // ---------------------------------------------------------------------------
  //  Confettis (succès)
  // ---------------------------------------------------------------------------
  function confettis() {
    if (BNL.U.reduitMouvement()) return;
    const c = el("canvas.confettis");
    document.body.append(c);
    const ctx = c.getContext("2d");
    c.width = innerWidth; c.height = innerHeight;
    const couleurs = ["#19a7a0", "#f2c14e", "#e5484d", "#2f9e5b", "#0b6e8f", "#ffffff"];
    const bouts = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight / 3,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 3,
      c: couleurs[Math.floor(Math.random() * couleurs.length)], a: Math.random() * 6,
    }));
    let t = 0;
    (function frame() {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const b of bouts) {
        b.vy += 0.35; b.x += b.vx; b.y += b.vy; b.a += 0.2;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
        ctx.fillStyle = b.c; ctx.fillRect(-b.r / 2, -b.r / 4, b.r, b.r / 2); ctx.restore();
      }
      if (t++ < 120) requestAnimationFrame(frame); else c.remove();
    })();
  }

  const fermerCoach = () => { if (coachActuel) { coachActuel.remove(); coachActuel = null; } };

  return { toast, ouvrir, fermer, fermerTout, confirmer, bulle, portrait, coach, fermerCoach, visite, confettis, enCours: () => pile.length };
})();
