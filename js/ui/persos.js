// Personnages dessinés façon manga (SVG originaux) : bustes avec expressions.
// BNL.Persos.dessin(id, expression) → chaîne SVG (viewBox 0 0 200 220).
// Expressions : neutre, sourire, rire, serieux, colere, choc, sueur, triste, malin.
window.BNL = window.BNL || {};

BNL.Persos = (() => {
  const ENCRE = "#151515";
  let n = 0;
  const uid = (p) => `${p}${++n}`;

  // ---------------------------------------------------------------- morceaux communs
  const trame = (id, couleur = ENCRE, opacite = 0.22, pas = 5) =>
    `<pattern id="${id}" width="${pas}" height="${pas}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${pas / 2}" cy="${pas / 2}" r="${pas * 0.22}" fill="${couleur}" fill-opacity="${opacite}"/></pattern>`;

  function corps(tissu, ombre, extra = "") {
    return `<path d="M10 222 C14 180 50 160 100 158 C150 160 186 180 190 222 Z" fill="${tissu}" stroke="${ENCRE}" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M10 222 C14 196 30 182 52 172 C46 190 44 206 46 222 Z" fill="${ombre}" opacity=".55"/>${extra}`;
  }
  function cou(peau, ombre) {
    return `<path d="M85 122 L85 162 C93 170 107 170 115 162 L115 122 Z" fill="${peau}" stroke="${ENCRE}" stroke-width="3"/>
      <path d="M85 132 C95 146 105 146 115 132 L115 146 C105 152 95 152 85 146 Z" fill="${ombre}"/>`;
  }
  function tete(peau, ombre) {
    return `<path d="M60 92 C50 86 46 104 58 110" fill="${peau}" stroke="${ENCRE}" stroke-width="2.6"/>
      <path d="M140 92 C150 86 154 104 142 110" fill="${peau}" stroke="${ENCRE}" stroke-width="2.6"/>
      <path d="M58 78 C58 44 76 28 100 28 C124 28 142 44 142 78 C142 102 136 118 123 130 C114 139 106 143 100 143 C94 143 86 139 77 130 C64 118 58 102 58 78 Z" fill="${peau}" stroke="${ENCRE}" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M77 130 C86 139 94 143 100 143 C106 143 114 139 123 130 C114 134 106 136 100 136 C94 136 86 134 77 130 Z" fill="${ombre}" opacity=".7"/>
      <path d="M131 62 C141 80 140 106 123 130 C116 136 110 140 104 142 C120 122 129 98 131 62 Z" fill="${ombre}" opacity=".45"/>`;
  }

  // Yeux : cx gauche 80, droite 120, cy 91
  function oeil(cx, iris, expr, cote) {
    const s = cote; // -1 gauche, 1 droite (pour les symétries)
    const x0 = cx - 12, x1 = cx + 12;
    if (expr === "rire") {
      return `<path d="M${x0 + 2} 94 C${cx - 6} 84 ${cx + 6} 84 ${x1 - 2} 94" fill="none" stroke="${ENCRE}" stroke-width="4" stroke-linecap="round"/>`;
    }
    if (expr === "choc") {
      return `<ellipse cx="${cx}" cy="91" rx="10" ry="11" fill="#fff" stroke="${ENCRE}" stroke-width="3"/>
        <circle cx="${cx}" cy="92" r="2.6" fill="${ENCRE}"/>`;
    }
    const paupiere = expr === "colere" ? `M${x0} ${s < 0 ? 84 : 88} L${x1} ${s < 0 ? 88 : 84}`
      : expr === "serieux" || expr === "malin" ? `M${x0} 87 C${cx - 6} 84 ${cx + 6} 84 ${x1} 87`
      : expr === "triste" ? `M${x0} ${s < 0 ? 87 : 84} C${cx - 4} 82 ${cx + 4} 82 ${x1} ${s < 0 ? 84 : 87}`
      : `M${x0} 86 C${cx - 7} 79 ${cx + 7} 79 ${x1} 86`;
    const haut = expr === "serieux" || expr === "malin" || expr === "colere" ? 3 : 0;
    const ry = 8.5 - haut * 0.8;
    const cid = uid("oe");
    return `<clipPath id="${cid}"><path d="${paupiere} L${x1} 103 L${x0} 103 Z"/></clipPath>
      <g clip-path="url(#${cid})">
        <ellipse cx="${cx}" cy="${93}" rx="11" ry="10" fill="#fff"/>
        <ellipse cx="${cx + s * 0.5}" cy="${93 + haut * 0.4}" rx="6.6" ry="${ry}" fill="${iris}" stroke="${ENCRE}" stroke-width="1.4"/>
        <ellipse cx="${cx + s * 0.5}" cy="${94 + haut * 0.4}" rx="3.2" ry="${ry * 0.5}" fill="${ENCRE}"/>
        <circle cx="${cx - 2.4}" cy="${89 + haut}" r="2.3" fill="#fff"/>
        <circle cx="${cx + 2.6}" cy="${97}" r="1.1" fill="#fff"/>
      </g>
      <path d="${paupiere}" fill="none" stroke="${ENCRE}" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M${x0 + 4} 102 C${cx - 3} 104 ${cx + 3} 104 ${x1 - 4} 102" fill="none" stroke="${ENCRE}" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`;
  }

  function sourcils(expr, couleur = ENCRE) {
    const d = {
      colere: ["M66 74 L92 80", "M134 74 L108 80"],
      triste: ["M68 78 L90 72", "M132 78 L110 72"],
      choc: ["M68 68 C76 64 84 64 92 67", "M132 68 C124 64 116 64 108 67"],
      serieux: ["M66 76 L92 77", "M134 76 L108 77"],
      malin: ["M66 74 L92 77", "M134 70 C126 68 116 70 108 74"],
    }[expr] || ["M67 74 C75 70 84 70 92 73", "M133 74 C125 70 116 70 108 73"];
    return d.map((p) => `<path d="${p}" fill="none" stroke="${couleur}" stroke-width="5" stroke-linecap="round"/>`).join("");
  }

  function nez() {
    return `<path d="M101 99 L98 110 L103 110" fill="none" stroke="${ENCRE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>`;
  }

  function bouche(expr, levres) {
    const L = levres || "#7a2b2b";
    switch (expr) {
      case "sourire": return `<path d="M88 119 C94 126 106 126 112 119" fill="none" stroke="${ENCRE}" stroke-width="2.8" stroke-linecap="round"/>`;
      case "rire": return `<path d="M86 116 C92 132 108 132 114 116 Z" fill="${L}" stroke="${ENCRE}" stroke-width="2.6" stroke-linejoin="round"/><path d="M88 117 L112 117 L111 120 L89 120 Z" fill="#fff"/><path d="M94 126 C98 122 104 122 107 126" fill="#e2777a"/>`;
      case "choc": return `<ellipse cx="100" cy="122" rx="6" ry="7.5" fill="${L}" stroke="${ENCRE}" stroke-width="2.6"/>`;
      case "colere": return `<path d="M88 118 L112 118 L110 126 L90 126 Z" fill="#fff" stroke="${ENCRE}" stroke-width="2.6" stroke-linejoin="round"/><path d="M94 118 L94 126 M100 118 L100 126 M106 118 L106 126 M89 122 L111 122" stroke="${ENCRE}" stroke-width="1.3"/>`;
      case "triste": return `<path d="M90 123 C95 118 105 118 110 123" fill="none" stroke="${ENCRE}" stroke-width="2.6" stroke-linecap="round"/>`;
      case "malin": return `<path d="M90 121 C98 122 106 120 112 114" fill="none" stroke="${ENCRE}" stroke-width="2.8" stroke-linecap="round"/>`;
      case "sueur": return `<path d="M90 121 C94 118 97 123 100 120 C103 117 106 123 110 120" fill="none" stroke="${ENCRE}" stroke-width="2.6" stroke-linecap="round"/>`;
      case "serieux": return `<path d="M91 121 L109 121" stroke="${ENCRE}" stroke-width="2.8" stroke-linecap="round"/>`;
      default: return `<path d="M91 120 C96 122 104 122 109 120" fill="none" stroke="${ENCRE}" stroke-width="2.6" stroke-linecap="round"/>`;
    }
  }

  // Symboles manga (sueur, veine de colère, rougeur, lignes de choc)
  function symboles(expr) {
    let s = "";
    if (expr === "sueur" || expr === "choc") {
      s += `<path d="M150 58 C144 70 142 78 148 82 C154 84 158 76 150 58 Z" fill="#cfeeff" stroke="${ENCRE}" stroke-width="2.2"/>`;
    }
    if (expr === "colere") {
      s += `<g transform="translate(140 46)" stroke="#d6262f" stroke-width="3.4" stroke-linecap="round" fill="none">
        <path d="M-8 -2 C-4 -2 -2 -4 -2 -8"/><path d="M8 -2 C4 -2 2 -4 2 -8"/><path d="M-8 2 C-4 2 -2 4 -2 8"/><path d="M8 2 C4 2 2 4 2 8"/></g>`;
    }
    if (expr === "rire" || expr === "sueur") {
      s += `<g stroke="#e0566b" stroke-width="2" stroke-linecap="round" opacity=".7"><path d="M66 106 l5 -6 M72 107 l5 -6 M78 108 l5 -6"/><path d="M118 108 l5 -6 M124 107 l5 -6 M130 106 l5 -6"/></g>`;
    }
    if (expr === "choc") {
      s += `<g stroke="${ENCRE}" stroke-width="3" stroke-linecap="round"><path d="M40 40 L52 52"/><path d="M30 62 L46 66"/><path d="M58 24 L64 38"/><path d="M162 30 L152 44"/><path d="M174 54 L158 60"/></g>`;
    }
    return s;
  }

  function visage(peau, ombre, iris, expr, options = {}) {
    return tete(peau, ombre) + (options.sousCheveux || "") + oeil(80, iris, expr, -1) + oeil(120, iris, expr, 1) +
      sourcils(expr, options.sourcils) + nez() + bouche(expr, options.levres) + (options.surVisage || "");
  }

  // ---------------------------------------------------------------- personnages
  const PERSOS = {
    // Capitaine Sel : vétérane, cheveux blancs courts, cicatrice, veste marine
    cap(expr) {
      const peau = "#6e432a", ombre = "#55311d";
      const veste = corps("#1d2f52", "#0c1a33",
        `<path d="M70 162 L100 206 L130 162" fill="none" stroke="#e2b04a" stroke-width="4"/>
         <path d="M64 164 C70 150 80 144 88 146 L100 176 L112 146 C120 144 130 150 136 164" fill="#22375f" stroke="${ENCRE}" stroke-width="3"/>
         <circle cx="148" cy="190" r="6" fill="#e2b04a" stroke="${ENCRE}" stroke-width="2"/><path d="M148 185 L148 196 M144 192 C146 196 150 196 152 192" stroke="${ENCRE}" stroke-width="1.6" fill="none"/>`);
      const cheveux = `<path d="M57 84 C50 52 66 22 104 20 C138 18 154 44 145 84 C142 70 138 60 130 52 C122 58 110 60 98 56 C90 62 78 62 68 58 C62 66 58 74 57 84 Z" fill="#edf1f4" stroke="${ENCRE}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M70 40 C84 30 104 28 122 34 M66 50 C82 40 106 38 128 46" fill="none" stroke="#9aa7b2" stroke-width="2"/>
        <path d="M98 56 C92 48 84 42 74 40" fill="none" stroke="#9aa7b2" stroke-width="2"/>`;
      const cicatrice = `<path d="M70 66 L88 108" stroke="#b67a62" stroke-width="3" stroke-linecap="round"/><path d="M72 76 l6 -3 M76 86 l6 -3 M80 96 l6 -3" stroke="#b67a62" stroke-width="2" stroke-linecap="round"/>`;
      const boucle = `<circle cx="145" cy="114" r="4" fill="none" stroke="#e2b04a" stroke-width="2.4"/>`;
      return veste + cou(peau, ombre) + visage(peau, ombre, "#c98a2b", expr, { surVisage: cicatrice + boucle, levres: "#5a2420" }) + cheveux + symboles(expr);
    },

    // Bolt : mécano, cheveux en pics, lunettes sur le front, combinaison orange
    bolt(expr) {
      const peau = "#8a5634", ombre = "#6b3f24";
      const combi = corps("#e8742a", "#b5521a",
        `<path d="M100 160 L100 222" stroke="${ENCRE}" stroke-width="3"/><path d="M96 170 h8 M96 182 h8 M96 194 h8 M96 206 h8" stroke="#9aa5ad" stroke-width="2.4"/>
         <rect x="128" y="186" width="30" height="20" rx="4" fill="#f4b04a" stroke="${ENCRE}" stroke-width="2.4"/>
         <path d="M134 196 l18 0 M136 192 l4 8 M150 192 l-4 8" stroke="${ENCRE}" stroke-width="2"/>`);
      const pics = `<path d="M54 86 L40 70 L58 66 L44 44 L66 50 L62 24 L82 40 L90 12 L102 36 L118 10 L122 38 L144 22 L138 48 L160 44 L146 64 L162 72 L146 84 C142 64 128 52 100 50 C74 50 60 62 54 86 Z" fill="#1c1c1f" stroke="${ENCRE}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M78 46 L92 22 M108 46 L118 20 M126 50 L142 30" stroke="#4a4a52" stroke-width="2"/>
        <path d="M70 58 C82 50 96 48 108 49" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
      const lunettes = `<path d="M56 66 C80 56 120 56 146 66 L146 76 C120 66 80 66 56 76 Z" fill="#3a2a22" stroke="${ENCRE}" stroke-width="2.6"/>
        <circle cx="82" cy="62" r="13" fill="#9fe0f0" stroke="#e2a33a" stroke-width="5"/><circle cx="118" cy="62" r="13" fill="#9fe0f0" stroke="#e2a33a" stroke-width="5"/>
        <circle cx="82" cy="62" r="13" fill="none" stroke="${ENCRE}" stroke-width="2"/><circle cx="118" cy="62" r="13" fill="none" stroke="${ENCRE}" stroke-width="2"/>
        <path d="M76 56 l6 -4 M112 56 l6 -4" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`;
      const pansement = `<g transform="translate(126 110) rotate(-20)"><rect x="-9" y="-4" width="18" height="8" rx="3" fill="#f2d3a8" stroke="${ENCRE}" stroke-width="1.8"/><path d="M-3 -4 L-3 4 M3 -4 L3 4" stroke="${ENCRE}" stroke-width="1" opacity=".6"/></g>`;
      return combi + cou(peau, ombre) + visage(peau, ombre, "#3d2616", expr, { surVisage: pansement, levres: "#6a2620" }) + pics + lunettes + symboles(expr);
    },

    // Docteure Nour : biologiste, chignon de tresses, lunettes rondes, veste turquoise
    nour(expr) {
      const peau = "#b47650", ombre = "#94593a";
      const veste = corps("#1f8c86", "#11605c",
        `<path d="M74 160 L100 196 L126 160" fill="#f3efe4" stroke="${ENCRE}" stroke-width="3"/>
         <path d="M100 196 L100 222" stroke="${ENCRE}" stroke-width="2.4"/>
         <rect x="128" y="178" width="20" height="26" rx="3" fill="#e8f6f4" stroke="${ENCRE}" stroke-width="2"/><path d="M132 186 h12 M132 192 h9" stroke="#1f8c86" stroke-width="2"/>`);
      const arriere = `<path d="M58 70 C50 110 54 150 62 170 L80 168 C74 140 72 110 74 88 Z" fill="#231713" stroke="${ENCRE}" stroke-width="3"/>
        <path d="M142 70 C150 110 146 150 138 170 L120 168 C126 140 128 110 126 88 Z" fill="#231713" stroke="${ENCRE}" stroke-width="3"/>
        <path d="M62 100 C64 120 64 140 68 160 M136 100 C134 120 134 140 132 160" stroke="#4b3328" stroke-width="2" fill="none"/>`;
      const cheveux = `<circle cx="100" cy="20" r="18" fill="#231713" stroke="${ENCRE}" stroke-width="3"/>
        <path d="M86 12 C94 18 106 18 114 12 M84 22 C94 28 106 28 116 22" stroke="#4b3328" stroke-width="2" fill="none"/>
        <path d="M56 84 C54 50 72 32 100 32 C128 32 146 50 144 84 C136 70 128 60 116 56 C104 64 90 62 82 54 C70 60 62 70 56 84 Z" fill="#231713" stroke="${ENCRE}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M70 52 C80 44 92 40 104 40 M108 42 C120 44 130 50 136 60" stroke="#4b3328" stroke-width="2" fill="none"/>
        <path d="M74 46 C84 40 94 38 104 38" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" opacity=".45"/>`;
      const lunettes = `<circle cx="80" cy="93" r="15" fill="#dff4ff" fill-opacity=".18" stroke="${ENCRE}" stroke-width="2.6"/><circle cx="120" cy="93" r="15" fill="#dff4ff" fill-opacity=".18" stroke="${ENCRE}" stroke-width="2.6"/>
        <path d="M95 92 C98 89 102 89 105 92" stroke="${ENCRE}" stroke-width="2.4" fill="none"/>
        <path d="M70 86 l6 -5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`;
      return arriere + veste + cou(peau, ombre) + visage(peau, ombre, "#3c2a1a", expr, { surVisage: lunettes, levres: "#6c2a24" }) + cheveux + symboles(expr);
    },

    // Vex : pilote d'Abyssal, mèche asymétrique, col haut noir, oreillette
    vex(expr) {
      const peau = "#efcdb2", ombre = "#d4a98a";
      const tenue = corps("#1b1b24", "#08080c",
        `<path d="M68 166 C74 150 86 146 100 146 C114 146 126 150 132 166 L124 172 C118 160 110 156 100 156 C90 156 82 160 76 172 Z" fill="#26263a" stroke="${ENCRE}" stroke-width="3"/>
         <g transform="translate(146 192)"><path d="M0 -11 L11 8 L-11 8 Z" fill="none" stroke="#a46cff" stroke-width="3"/><circle cx="0" cy="2" r="3.2" fill="#a46cff"/></g>`);
      const arriere = `<path d="M58 76 C52 96 54 112 60 122 L74 112 Z M142 76 C148 96 146 112 140 122 L126 112 Z" fill="#1d2140" stroke="${ENCRE}" stroke-width="3"/>`;
      const cheveux = `<path d="M56 86 C50 48 72 22 104 22 C136 22 152 46 146 84 C140 70 132 62 124 58 C128 76 126 98 118 116 C112 96 104 78 92 64 C84 70 74 76 66 76 C62 78 58 82 56 86 Z" fill="#1d2140" stroke="${ENCRE}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M118 116 C114 104 112 94 108 84 L114 86 C118 96 120 106 118 116 Z" fill="#a46cff"/>
        <path d="M80 40 C96 30 116 30 132 40 M94 64 C102 56 114 52 124 56" stroke="#3c4378" stroke-width="2" fill="none"/>
        <path d="M72 50 C84 40 100 36 116 37" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".5"/>`;
      const oreillette = `<rect x="140" y="92" width="9" height="16" rx="3" fill="#2b2b3a" stroke="${ENCRE}" stroke-width="2"/><circle cx="144.5" cy="97" r="2" fill="#6ff7e8"/>`;
      return arriere + tenue + cou(peau, ombre) + visage(peau, ombre, "#7c4dff", expr, { surVisage: oreillette, levres: "#9a5a52" }) + cheveux + symboles(expr);
    },

    // Orsa Kell : directrice d'Abyssal Collection, carré platine, rouge à lèvres, col montant
    orsa(expr) {
      const peau = "#ecd2bf", ombre = "#cfac94";
      const manteau = corps("#121216", "#000",
        `<path d="M62 168 C64 146 76 136 86 134 L100 170 L114 134 C124 136 136 146 138 168 L126 176 L100 160 L74 176 Z" fill="#1c1c22" stroke="${ENCRE}" stroke-width="3"/>
         <circle cx="100" cy="182" r="7" fill="#b3122a" stroke="${ENCRE}" stroke-width="2.2"/>`);
      const arriere = `<path d="M54 74 C46 110 52 132 62 138 L140 138 C150 132 154 110 146 74 Z" fill="#e6e1d6" stroke="${ENCRE}" stroke-width="3"/>`;
      const cheveux = `<path d="M54 92 C46 48 72 22 100 22 C128 22 154 48 146 92 L140 92 L140 70 C132 66 120 64 100 64 C80 64 68 66 60 70 L60 92 Z" fill="#ece6da" stroke="${ENCRE}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M64 66 L136 66" stroke="${ENCRE}" stroke-width="3"/>
        <path d="M74 34 C88 28 112 28 126 34 M66 48 C86 40 114 40 134 48" stroke="#bdb5a4" stroke-width="2" fill="none"/>`;
      const e = expr === "sourire" ? "malin" : expr;
      return arriere + manteau + cou(peau, ombre) + visage(peau, ombre, "#5d7d8f", e, { levres: "#a3202f", sourcils: "#8f8576" }) + cheveux + symboles(e === "malin" ? "" : e);
    },

    // LUCI : l'IA de bord (écran et œil)
    luci(expr) {
      const g = uid("lg");
      const alerte = expr === "choc" || expr === "colere";
      const c = alerte ? "#ff4d5e" : "#38e8d6";
      let oeilLuci;
      if (expr === "sourire" || expr === "rire") oeilLuci = `<path d="M74 104 C84 86 116 86 126 104" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>`;
      else if (expr === "serieux") oeilLuci = `<rect x="66" y="94" width="68" height="14" rx="7" fill="${c}"/>`;
      else if (expr === "sueur") oeilLuci = `<circle cx="100" cy="100" r="22" fill="none" stroke="${c}" stroke-width="7" stroke-dasharray="12 8"/><circle cx="100" cy="100" r="7" fill="${c}"/>`;
      else oeilLuci = `<circle cx="100" cy="100" r="24" fill="none" stroke="${c}" stroke-width="7"/><circle cx="100" cy="100" r="10" fill="${c}"/><circle cx="94" cy="94" r="3.5" fill="#fff"/>`;
      const glitch = expr === "choc"
        ? `<g opacity=".8"><rect x="38" y="70" width="70" height="6" fill="#ff3df2" opacity=".6"/><rect x="96" y="124" width="66" height="5" fill="#3dfff5" opacity=".7"/><rect x="50" y="138" width="40" height="4" fill="#fff" opacity=".5"/></g>` : "";
      return `<defs><radialGradient id="${g}"><stop offset="0" stop-color="#11324a"/><stop offset="1" stop-color="#061420"/></radialGradient></defs>
        <rect x="22" y="22" width="156" height="156" rx="34" fill="url(#${g})" stroke="${ENCRE}" stroke-width="4"/>
        <rect x="30" y="30" width="140" height="140" rx="28" fill="none" stroke="${c}" stroke-width="2" opacity=".5"/>
        ${[48, 60, 72, 132, 144, 156].map((y) => `<path d="M34 ${y} L166 ${y}" stroke="${c}" stroke-width="1" opacity=".12"/>`).join("")}
        ${oeilLuci}${glitch}
        <path d="M60 150 l8 -6 l8 8 l8 -10 l8 8 l8 -6 l8 6 l8 -8 l8 8" fill="none" stroke="${c}" stroke-width="2" opacity=".7"/>
        <rect x="84" y="178" width="32" height="30" fill="#2b3640" stroke="${ENCRE}" stroke-width="3"/>
        <path d="M40 222 C44 206 64 200 100 200 C136 200 156 206 160 222 Z" fill="#2b3640" stroke="${ENCRE}" stroke-width="3"/>
        ${alerte ? `<text x="100" y="66" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="30" fill="${c}">!</text>` : ""}`;
    },

    // Huit : le poulpe clandestin (mascotte, ne parle pas)
    huit(expr) {
      const corpsP = "#d0603a", ombre = "#a8462a";
      const bras = [
        "M64 150 C40 160 28 186 40 204 C48 214 60 206 54 198",
        "M78 160 C68 182 70 204 84 214 C94 220 100 208 92 204",
        "M100 164 C100 188 108 206 122 214 C132 220 138 206 128 202",
        "M122 158 C138 176 152 186 168 190 C180 192 180 178 170 178",
        "M134 148 C156 150 174 160 182 176 C186 186 174 190 170 182",
      ];
      const yeuxH = expr === "malin"
        ? `<path d="M70 108 C76 100 88 100 92 108 Z" fill="#fff8e6" stroke="${ENCRE}" stroke-width="2.6"/><path d="M108 108 C112 100 124 100 130 108 Z" fill="#fff8e6" stroke="${ENCRE}" stroke-width="2.6"/><rect x="76" y="103" width="12" height="4" rx="2" fill="${ENCRE}"/><rect x="112" y="103" width="12" height="4" rx="2" fill="${ENCRE}"/>`
        : expr === "choc"
          ? `<circle cx="82" cy="106" r="11" fill="#fff8e6" stroke="${ENCRE}" stroke-width="2.6"/><circle cx="118" cy="106" r="11" fill="#fff8e6" stroke="${ENCRE}" stroke-width="2.6"/><circle cx="82" cy="107" r="2.6" fill="${ENCRE}"/><circle cx="118" cy="107" r="2.6" fill="${ENCRE}"/>`
          : expr === "rire" || expr === "sourire"
            ? `<path d="M72 108 C76 98 88 98 92 108" fill="none" stroke="${ENCRE}" stroke-width="4" stroke-linecap="round"/><path d="M108 108 C112 98 124 98 128 108" fill="none" stroke="${ENCRE}" stroke-width="4" stroke-linecap="round"/>`
            : `<ellipse cx="82" cy="106" rx="10" ry="9" fill="#fff8e6" stroke="${ENCRE}" stroke-width="2.6"/><ellipse cx="118" cy="106" rx="10" ry="9" fill="#fff8e6" stroke="${ENCRE}" stroke-width="2.6"/><rect x="75" y="104" width="14" height="5" rx="2.5" fill="${ENCRE}"/><rect x="111" y="104" width="14" height="5" rx="2.5" fill="${ENCRE}"/>`;
      return bras.map((d, i) => `<path d="${d}" fill="none" stroke="${ENCRE}" stroke-width="${17 - (i % 2)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${i % 2 ? ombre : corpsP}" stroke-width="${12 - (i % 2)}" stroke-linecap="round"/>`).join("") +
        `<path d="M54 98 C48 54 74 30 102 30 C132 30 156 54 148 98 C144 128 124 146 100 146 C76 146 58 128 54 98 Z" fill="${corpsP}" stroke="${ENCRE}" stroke-width="3.4"/>
        <path d="M70 54 C80 42 96 38 110 40" fill="none" stroke="#f3b08a" stroke-width="4" stroke-linecap="round" opacity=".8"/>
        <circle cx="120" cy="60" r="5" fill="${ombre}"/><circle cx="84" cy="74" r="4" fill="${ombre}"/><circle cx="132" cy="84" r="3.5" fill="${ombre}"/>
        ${yeuxH}${expr === "choc" || expr === "sueur" ? `<path d="M150 50 C144 62 142 70 148 74 C154 76 158 68 150 50 Z" fill="#cfeeff" stroke="${ENCRE}" stroke-width="2"/>` : ""}`;
    },

    // Le gombessa (cœlacanthe)
    gombessa() {
      const g = uid("gb");
      return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f78bd"/><stop offset="1" stop-color="#22396a"/></linearGradient></defs>
        <g transform="translate(-14 26) scale(.95)">
        <path d="M190 84 C204 70 218 64 228 66 C224 78 216 86 200 90 Z M190 102 C204 114 218 120 228 118 C224 106 216 98 200 94 Z" fill="#2c4a82" stroke="${ENCRE}" stroke-width="3"/>
        <path d="M112 62 C116 44 128 36 140 38 C138 48 134 56 132 64 Z M158 68 C162 56 170 50 180 52 C178 62 172 70 168 74 Z" fill="#2c4a82" stroke="${ENCRE}" stroke-width="3"/>
        <path d="M30 90 C32 70 56 58 88 56 C128 54 164 62 188 76 C196 82 200 88 200 92 C198 96 194 100 186 104 C162 118 126 124 88 122 C56 120 32 110 30 90 Z" fill="url(#${g})" stroke="${ENCRE}" stroke-width="3.4"/>
        <path d="M80 102 C84 116 92 128 108 136 C112 126 106 114 96 106 Z" fill="#35588f" stroke="${ENCRE}" stroke-width="2.6"/>
        ${[[70, 76], [96, 70], [120, 84], [146, 78], [108, 104], [134, 100], [160, 92], [84, 92]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="3.4" fill="#eef4ff"/>`).join("")}
        <path d="M70 66 C64 80 64 98 70 112" fill="none" stroke="#162a4d" stroke-width="3" stroke-linecap="round"/>
        <circle cx="50" cy="82" r="10" fill="#0d1a2e" stroke="${ENCRE}" stroke-width="2"/><circle cx="50" cy="82" r="6.5" fill="#c9f06b"/><circle cx="47" cy="79" r="2.4" fill="#fff"/>
        </g>`;
    },

    // Toi : silhouette avec casque audio (le visage reste dans l'ombre)
    toi() {
      const t = uid("tt");
      return `<defs>${trame(t, "#ffffff", 0.18, 6)}</defs>
        ${corps("#2a3446", "#151b26", `<path d="M10 222 C14 180 50 160 100 158 C150 160 186 180 190 222 Z" fill="url(#${t})"/>`)}
        ${cou("#2c3442", "#1b212b")}
        <path d="M58 78 C58 44 76 28 100 28 C124 28 142 44 142 78 C142 102 136 118 123 130 C114 139 106 143 100 143 C94 143 86 139 77 130 C64 118 58 102 58 78 Z" fill="#323c4e" stroke="${ENCRE}" stroke-width="3.2"/>
        <path d="M54 90 C46 50 70 20 102 20 C134 20 156 48 148 90 C142 70 128 52 102 50 C76 50 62 66 54 90 Z" fill="#1e2532" stroke="${ENCRE}" stroke-width="3.2"/>
        <path d="M50 92 C48 52 70 30 100 30 C130 30 152 52 150 92" fill="none" stroke="#11151d" stroke-width="10"/>
        <rect x="40" y="84" width="20" height="34" rx="9" fill="#f2c14e" stroke="${ENCRE}" stroke-width="3"/>
        <rect x="140" y="84" width="20" height="34" rx="9" fill="#f2c14e" stroke="${ENCRE}" stroke-width="3"/>
        <path d="M50 116 C54 132 70 140 86 136" fill="none" stroke="${ENCRE}" stroke-width="3"/><circle cx="88" cy="136" r="4" fill="#f2c14e" stroke="${ENCRE}" stroke-width="2"/>
        <path d="M74 94 L90 94 M110 94 L126 94" stroke="#6ff7e8" stroke-width="4" stroke-linecap="round" opacity=".9"/>`;
    },
  };

  // options.tete : cadrage serré sur le visage (portraits ronds)
  function dessin(id, expr = "neutre", options = {}) {
    const f = PERSOS[id];
    if (!f) return "";
    const vb = options.tete ? (id === "gombessa" ? "10 40 200 140" : "34 14 132 132") : "0 0 200 222";
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="perso perso-${id}">${f(expr || "neutre")}</svg>`;
  }

  return { dessin, ids: Object.keys(PERSOS) };
})();
