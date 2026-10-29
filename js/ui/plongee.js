// La coupe de la plongée : du hangar à la surface jusqu'aux grottes du gombessa.
// 7 balises (une par palier), le sous-marin de l'élève et ceux de l'équipage.
window.BNL = window.BNL || {};

BNL.Plongee = (() => {
  const { el, echapper } = BNL.U;

  // Position de chaque balise dans la coupe (viewBox 1000 × 640)
  const POS = {
    p0: { x: 92, y: 74 },
    p1: { x: 220, y: 142 },
    p2: { x: 352, y: 196 },
    p3: { x: 486, y: 258 },
    p4: { x: 612, y: 346 },
    p5: { x: 752, y: 458 },
    p6: { x: 892, y: 560 },
  };

  let compteur = 0;

  function decor(id, avecVie) {
    const g = `pl${id}`;
    let lumieres = "";
    let bulles = "";
    if (avecVie) {
      for (let i = 0; i < 46; i++) {
        const x = 640 + ((i * 97) % 350), y = 390 + ((i * 53) % 230);
        lumieres += `<circle class="plongee-lumiere" cx="${x}" cy="${y}" r="${1.2 + (i % 3) * 0.7}" fill="${i % 4 ? "#6ff7e8" : "#c7a3ff"}" style="animation-delay:${(i % 7) * 0.6}s"/>`;
      }
      for (let i = 0; i < 14; i++) {
        const x = 120 + ((i * 131) % 760), y = 120 + ((i * 89) % 460);
        bulles += `<circle class="plongee-bulle" cx="${x}" cy="${y}" r="${2 + (i % 3)}" style="animation-delay:${(i % 5) * 1.3}s"/>`;
      }
    }
    return `
      <defs>
        <linearGradient id="${g}-mer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7fe0d6"/><stop offset=".18" stop-color="#2fb0bf"/>
          <stop offset=".42" stop-color="#136f9a"/><stop offset=".7" stop-color="#0b2f5a"/><stop offset="1" stop-color="#050f24"/>
        </linearGradient>
        <linearGradient id="${g}-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7b8"/><stop offset="1" stop-color="#cdeffc"/></linearGradient>
        <linearGradient id="${g}-sol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9d6a3"/><stop offset=".35" stop-color="#7b6a52"/><stop offset="1" stop-color="#1a1714"/></linearGradient>
        <radialGradient id="${g}-halo"><stop offset="0" stop-color="#fff6b0" stop-opacity=".9"/><stop offset="1" stop-color="#fff6b0" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1000" height="640" fill="url(#${g}-mer)"/>
      <rect width="1000" height="48" fill="url(#${g}-ciel)"/>
      <path d="M0 48 C60 44 120 52 180 48 C240 44 300 52 360 48 C420 44 480 52 540 48 C600 44 660 52 720 48 C780 44 840 52 900 48 C940 45 970 50 1000 48" fill="none" stroke="#ffffff" stroke-width="3" opacity=".8"/>
      <g opacity=".25" fill="#ffffff">
        <path d="M150 48 L120 260 L170 260 Z"/><path d="M330 48 L300 300 L360 300 Z"/><path d="M520 48 L500 260 L560 260 Z"/>
      </g>
      <!-- Le rivage, la mangrove et le hangar -->
      <path d="M0 30 C30 26 50 34 70 40 L70 640 L0 640 Z" fill="url(#${g}-sol)"/>
      <path d="M0 30 C30 26 50 34 70 40 L70 47 C50 41 30 33 0 37 Z" fill="#4f8f55"/>
      <circle cx="22" cy="24" r="16" fill="#3d8f4c"/><circle cx="44" cy="20" r="14" fill="#4aa35a"/>
      <path d="M14 36 C18 46 10 52 6 56 M30 36 C30 48 36 54 42 58 M44 34 C48 44 56 48 62 50" stroke="#6e4f35" stroke-width="3" fill="none"/>
      <rect x="62" y="38" width="70" height="6" fill="#8a6b45"/>
      <rect x="72" y="44" width="4" height="22" fill="#6e5235"/><rect x="118" y="44" width="4" height="22" fill="#6e5235"/>
      <path d="M58 38 L64 18 L118 18 L124 38 Z" fill="#e7e2d4" stroke="#b7ab90" stroke-width="2"/>
      <!-- Le fond : herbier, récif, passe, tombant, grottes -->
      <path d="M70 66 C120 92 170 156 230 160 C280 164 300 170 330 208 C350 232 372 220 396 150 C406 120 420 96 440 96
               C458 96 466 140 474 200 C480 250 492 280 520 284 C548 288 560 300 572 360 C590 450 640 470 690 486
               C740 500 760 540 800 560 C840 580 860 596 920 602 C960 606 990 604 1000 604 L1000 640 L70 640 Z" fill="url(#${g}-sol)"/>
      <!-- Herbier -->
      ${Array.from({ length: 18 }, (_, i) => { const x = 150 + i * 7; const y = 128 + i * 1.9; return `<path d="M${x} ${y + 26} C${x - 4} ${y + 12} ${x + 4} ${y + 6} ${x + (i % 2 ? 5 : -4)} ${y - 4}" stroke="${i % 2 ? "#3f9e5a" : "#5cb873"}" stroke-width="3" fill="none" stroke-linecap="round"/>`; }).join("")}
      <!-- Coraux du récif -->
      ${[[352, 222], [374, 172], [398, 136], [424, 104], [452, 102], [462, 132]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${9 + (i % 3) * 3}" fill="${["#f28c7b", "#f6b26b", "#f39bb1", "#c58ef0"][i % 4]}" opacity=".9"/>`).join("")}
      <!-- Grottes de lave -->
      <path d="M840 588 C846 560 870 552 886 560 C902 568 904 590 900 600 Z" fill="#0a0806"/>
      <path d="M930 600 C934 580 952 574 964 582 C974 590 972 600 970 604 Z" fill="#0a0806"/>
      ${lumieres}${bulles}`;
  }

  function sousMarin(x, y, echelle = 1, classe = "") {
    return `<g class="plongee-sousmarin ${classe}" transform="translate(${x} ${y}) scale(${echelle})">
      <path d="M10 0 L58 -26 L58 26 Z" fill="#fff6b0" opacity=".35"/>
      <path d="M-34 0 C-34 -12 -18 -16 0 -16 C18 -16 30 -10 30 0 C30 10 18 16 0 16 C-18 16 -34 12 -34 0 Z" fill="#ffd86a" stroke="#c78a1e" stroke-width="2"/>
      <path d="M-10 -15 L-7 -24 L8 -24 L10 -15 Z" fill="#e7a92c"/>
      <circle cx="14" cy="-1" r="7" fill="#0f5f78"/><circle cx="14" cy="-1" r="5" fill="#7fd8e6"/>
      <circle cx="-6" cy="0" r="3.5" fill="#0f5f78"/><circle cx="-18" cy="0" r="3.5" fill="#0f5f78"/>
      <path d="M-34 0 L-42 -7 L-42 7 Z" fill="#c78a1e"/>
    </g>`;
  }

  // options : { actuel, faits: Set, ouverts: Set, camarades: [{ pseudo, avatar, chap, moi }], clic(chap) }
  function dessiner(conteneur, options = {}) {
    const id = ++compteur;
    const paliers = BNL.CHAPITRES.filter((c) => !c.bonus);
    const faits = options.faits || new Set();
    const ouverts = options.ouverts || new Set();
    let chemin = "";
    paliers.forEach((c, i) => {
      const p = POS[c.id];
      chemin += (i ? " L" : "M") + p.x + " " + p.y;
    });
    let balises = "";
    paliers.forEach((c, i) => {
      const p = POS[c.id];
      const fait = faits.has(c.id);
      const ouvert = ouverts.has(c.id);
      const actuel = options.actuel === c.id;
      balises += `<g class="plongee-balise${fait ? " allumee" : ""}${ouvert ? " ouverte" : " fermee"}${actuel ? " actuelle" : ""}" data-chap="${c.id}"
          ${options.clic && ouvert ? `role="button" tabindex="0"` : ""} aria-label="Balise ${i + 1} : ${echapper(c.titre)}, ${c.prof} mètres${fait ? ", allumée" : ""}">
        ${fait ? `<circle cx="${p.x}" cy="${p.y}" r="30" fill="url(#pl${id}-halo)"/>` : ""}
        <circle cx="${p.x}" cy="${p.y}" r="15" class="balise-corps"/>
        <text x="${p.x}" y="${p.y + 5}" text-anchor="middle" class="balise-num">${fait ? "✓" : ouvert ? i + 1 : "🔒"}</text>
        <text x="${p.x}" y="${p.y + 34}" text-anchor="middle" class="balise-nom">${echapper(c.titre)}</text>
        <text x="${p.x}" y="${p.y + 50}" text-anchor="middle" class="balise-prof">${c.prof ? "−" + c.prof + " m" : "surface"}</text>
      </g>`;
    });
    // Les sous-marins de l'équipage, regroupés par palier
    let equipage = "";
    const parChap = {};
    (options.camarades || []).forEach((c) => {
      if (c.moi || !POS[c.chap]) return;
      (parChap[c.chap] = parChap[c.chap] || []).push(c);
    });
    Object.entries(parChap).forEach(([chap, liste]) => {
      const p = POS[chap];
      liste.slice(0, 8).forEach((c, k) => {
        const angle = -Math.PI / 2 + (k - (Math.min(liste.length, 8) - 1) / 2) * 0.55;
        const x = p.x + Math.cos(angle) * 44, y = p.y + Math.sin(angle) * 44 - 6;
        equipage += `<g class="plongee-camarade"><title>${echapper(c.pseudo)}</title>
          <circle cx="${x}" cy="${y}" r="13" fill="#ffffff" opacity=".85"/>
          <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15">${echapper(c.avatar || "🐠")}</text></g>`;
      });
      if (liste.length > 8) equipage += `<text x="${p.x + 30}" y="${p.y - 46}" class="balise-prof">+${liste.length - 8}</text>`;
    });
    const actuel = POS[options.actuel];
    const sm = actuel ? sousMarin(Math.min(actuel.x + 46, 955), actuel.y - 6, 0.7, "moi") : "";
    // Échelle de profondeur (non proportionnelle)
    const echelle = paliers.map((c) => `<g class="plongee-echelle"><line x1="986" x2="1000" y1="${POS[c.id].y}" y2="${POS[c.id].y}"/><text x="982" y="${POS[c.id].y + 4}" text-anchor="end">${c.prof} m</text></g>`).join("");
    conteneur.innerHTML = `<svg class="plongee-svg" viewBox="0 0 1000 640" role="img" aria-label="Coupe de la plongée : 7 balises de la surface jusqu'à 250 mètres">
      ${decor(id, true)}
      <path d="${chemin}" class="plongee-chemin"/>
      ${echelle}${balises}${equipage}${sm}
    </svg>`;
    if (options.clic) {
      conteneur.querySelectorAll(".plongee-balise.ouverte").forEach((g) => {
        const choisir = () => options.clic(g.dataset.chap);
        g.addEventListener("click", choisir);
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choisir(); } });
      });
    }
  }

  // Décor seul (accueil, histoire)
  function fond(conteneur) {
    const id = ++compteur;
    conteneur.innerHTML = `<svg class="plongee-svg decor" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      ${decor(id, true)}${sousMarin(300, 230, 1.6, "flotte")}
    </svg>`;
  }

  return { dessiner, fond, sousMarin, POS };
})();
