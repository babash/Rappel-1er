// Illustrations originales (SVG dessinés pour ce jeu) : personnages, sous-marin et espèces.
window.BNL = window.BNL || {};

BNL.Illus = (() => {
  let n = 0;
  const uid = (p) => `${p}${++n}`;

  // Petites taches réparties dans une ellipse (motifs de peau)
  function taches(cx, cy, rx, ry, nb, couleur, rmin, rmax, graine) {
    let s = graine || 7;
    const alea = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    let out = "";
    for (let i = 0; i < nb; i++) {
      const a = alea() * Math.PI * 2, d = Math.sqrt(alea());
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      const r = rmin + alea() * (rmax - rmin);
      out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * (0.7 + alea() * 0.5)).toFixed(1)}" fill="${couleur}"/>`;
    }
    return out;
  }

  const fondEau = (id, haut, bas) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${haut}"/><stop offset="1" stop-color="${bas}"/></linearGradient></defs><rect width="240" height="160" rx="14" fill="url(#${id})"/>`;
  const bulles = (pts) => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="1.4"/>`).join("");

  // ---------------------------------------------------------------- espèces
  const DESSINS = {
    poulpe() {
      const g = uid("pl");
      const bras = [
        "M98 88 C72 96 52 110 44 128 C40 140 54 146 59 136",
        "M104 92 C90 108 84 126 92 140 C100 150 112 141 104 135",
        "M114 94 C112 114 116 132 128 144 C136 150 145 139 135 134",
        "M126 94 C136 110 146 122 160 130 C170 136 175 124 164 121",
        "M136 90 C156 96 176 104 190 118 C198 128 188 136 182 127",
        "M142 84 C164 84 186 86 200 98 C208 106 198 114 193 106",
        "M92 84 C70 82 50 86 38 100 C30 110 40 118 46 110",
        "M120 95 C122 116 106 130 100 146 C97 154 108 158 110 150",
      ];
      return fondEau(g, "#6fd0d8", "#1f8fa3") +
        bras.map((d, i) => `<path d="${d}" fill="none" stroke="${i % 2 ? "#a9522e" : "#c4643b"}" stroke-width="${10 - (i % 3)}" stroke-linecap="round"/>`).join("") +
        bras.slice(0, 5).map((d) => `<path d="${d}" fill="none" stroke="#f3c09a" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0.1 7"/>`).join("") +
        `<path d="M78 70 C74 38 98 18 124 20 C152 22 168 44 162 68 C158 86 142 94 120 94 C98 94 82 86 78 70 Z" fill="#c8693f"/>` +
        taches(120, 54, 34, 28, 14, "#a14d2a", 2, 5, 11) + taches(120, 50, 30, 24, 10, "#e9a477", 1.5, 3.5, 5) +
        `<path d="M92 34 C100 26 112 24 120 26" fill="none" stroke="#f0b48a" stroke-width="3" stroke-linecap="round" opacity=".7"/>` +
        `<ellipse cx="102" cy="78" rx="8" ry="7" fill="#fff3d6"/><ellipse cx="140" cy="78" rx="8" ry="7" fill="#fff3d6"/>` +
        `<rect x="96" y="76" width="12" height="4" rx="2" fill="#2b1a10"/><rect x="134" y="76" width="12" height="4" rx="2" fill="#2b1a10"/>` +
        bulles([[196, 40, 4], [206, 26, 6], [188, 18, 3]]);
    },
    dugong() {
      const g = uid("dg");
      let herbes = "";
      for (let i = 0; i < 22; i++) {
        const x = 8 + i * 11 + (i % 3) * 2, h = 18 + ((i * 37) % 22);
        herbes += `<path d="M${x} 160 C${x - 4} ${160 - h / 2} ${x + 4} ${160 - h * 0.8} ${x + (i % 2 ? 6 : -5)} ${160 - h}" fill="none" stroke="${i % 2 ? "#3f9e5a" : "#5cb873"}" stroke-width="4" stroke-linecap="round"/>`;
      }
      return fondEau(g, "#8fe1d9", "#2a9a9e") +
        `<path d="M44 92 C44 70 74 58 112 60 C150 62 176 70 194 80 C202 84 208 86 214 86 L232 70 C236 78 236 92 232 102 L214 88 C206 92 196 96 184 100 C152 112 112 114 80 110 C60 108 44 104 44 92 Z" fill="#9a928a"/>` +
        `<path d="M60 104 C90 112 140 112 184 100 C176 104 150 112 112 113 C88 113 70 110 60 104 Z" fill="#c6bdb2"/>` +
        `<path d="M44 92 C36 92 30 98 30 106 C30 114 40 118 48 114 C54 110 54 100 50 94 Z" fill="#b7aea3"/>` +
        `<circle cx="36" cy="108" r="1.3" fill="#6d655d"/><circle cx="41" cy="111" r="1.3" fill="#6d655d"/><circle cx="39" cy="104" r="1.3" fill="#6d655d"/>` +
        `<circle cx="62" cy="80" r="3" fill="#2f2a26"/><circle cx="63" cy="79" r="1" fill="#fff"/>` +
        `<path d="M96 104 C98 116 92 126 80 130 C86 120 86 112 84 106 Z" fill="#857d75"/>` +
        `<path d="M70 70 C96 64 140 64 176 74" fill="none" stroke="#b5aea6" stroke-width="3" stroke-linecap="round" opacity=".6"/>` +
        herbes + bulles([[24, 70, 3], [30, 56, 4.5], [22, 44, 3]]);
    },
    nudibranche() {
      const g = uid("nb");
      let bord = "";
      for (let i = 0; i < 40; i++) {
        const t = (i / 40) * Math.PI * 2;
        bord += `<circle cx="${(118 + Math.cos(t) * 84).toFixed(1)}" cy="${(92 + Math.sin(t) * 30).toFixed(1)}" r="7" fill="#f6a33b"/>`;
      }
      let panache = "";
      for (let i = 0; i < 9; i++) {
        const a = -0.9 + i * 0.22;
        panache += `<path d="M178 80 Q${(178 + Math.cos(a) * 18).toFixed(1)} ${(80 + Math.sin(a) * 18 - 10).toFixed(1)} ${(178 + Math.cos(a) * 26).toFixed(1)} ${(80 + Math.sin(a) * 26 - 14).toFixed(1)}" fill="none" stroke="#ffb347" stroke-width="3.2" stroke-linecap="round"/>`;
      }
      return fondEau(g, "#7fd6e8", "#2276a8") +
        `<path d="M0 138 C40 128 80 140 120 134 C160 128 200 140 240 132 L240 160 L0 160 Z" fill="#e9d7a8"/>` +
        bord + `<ellipse cx="118" cy="92" rx="82" ry="28" fill="#7a3fb6"/>` +
        `<ellipse cx="118" cy="92" rx="70" ry="20" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-dasharray="1 6" stroke-linecap="round"/>` +
        `<path d="M58 88 C90 80 150 80 176 88" fill="none" stroke="#b48ae6" stroke-width="4" stroke-linecap="round" opacity=".7"/>` +
        panache +
        `<path d="M56 74 C50 58 52 46 58 40" fill="none" stroke="#f6a33b" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M72 72 C70 56 74 46 80 40" fill="none" stroke="#f6a33b" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M54 50 l8 -3 M56 58 l8 -3 M73 52 l8 -2 M72 60 l8 -2" stroke="#c46a12" stroke-width="2" stroke-linecap="round"/>` +
        bulles([[206, 30, 4], [214, 18, 2.5]]);
    },
    manta() {
      const g = uid("mt");
      return fondEau(g, "#4ab8d6", "#0e4f7a") +
        `<path d="M0 30 L240 30" stroke="#ffffff" stroke-opacity=".15" stroke-width="20"/>` +
        `<path d="M120 50 C100 50 80 58 60 70 C40 82 22 94 10 102 C40 104 70 102 92 106 C104 108 112 114 120 122 C128 114 136 108 148 106 C170 102 200 104 230 102 C218 94 200 82 180 70 C160 58 140 50 120 50 Z" fill="#283a4f"/>` +
        `<path d="M120 122 C121 134 122 146 124 158" fill="none" stroke="#283a4f" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M108 52 C102 44 100 36 106 32 C110 38 112 44 114 50 Z M132 52 C138 44 140 36 134 32 C130 38 128 44 126 50 Z" fill="#1e2d3e"/>` +
        `<path d="M76 74 C86 70 96 70 104 74 C96 80 86 82 76 74 Z M164 74 C154 70 144 70 136 74 C144 80 154 82 164 74 Z" fill="#e3edf2" opacity=".9"/>` +
        `<path d="M64 84 C90 90 104 96 120 108 C136 96 150 90 176 84" fill="none" stroke="#3d5570" stroke-width="2"/>` +
        `<g fill="#f7d36a"><path d="M40 132 l10 -4 l-2 4 l2 4 z"/><path d="M58 142 l10 -4 l-2 4 l2 4 z"/><path d="M196 136 l-10 -4 l2 4 l-2 4 z"/></g>`;
    },
    dauphin() {
      const g = uid("dp");
      return fondEau(g, "#7cd4f0", "#1a6fa8") +
        `<path d="M0 44 C40 38 80 50 120 44 C160 38 200 50 240 42 L240 0 L0 0 Z" fill="#bdeefa" opacity=".5"/>` +
        `<path d="M34 104 C46 82 78 62 116 58 C150 54 180 62 198 80 C206 88 214 92 224 90 C222 98 214 104 204 102 C190 110 168 118 138 118 C104 118 66 116 46 112 C40 112 36 110 34 104 Z" fill="#7f97a8"/>` +
        `<path d="M46 112 C70 108 110 112 150 108 C170 106 186 102 198 96 C186 108 166 118 138 118 C104 118 66 116 46 112 Z" fill="#d6e1e8"/>` +
        `<path d="M34 104 C24 104 16 102 12 98 C18 94 26 94 36 96 Z" fill="#7f97a8"/>` +
        `<path d="M112 60 C118 44 128 36 140 34 C136 44 134 52 136 60 Z" fill="#6c8496"/>` +
        `<path d="M96 108 C98 120 92 130 80 136 C84 126 84 118 82 112 Z" fill="#6c8496"/>` +
        `<path d="M204 88 L226 72 C232 80 232 94 228 104 L208 96 Z" fill="#6c8496"/>` +
        `<circle cx="56" cy="92" r="3" fill="#1d2a33"/><path d="M24 101 C32 104 40 104 48 102" fill="none" stroke="#4d6070" stroke-width="1.6" stroke-linecap="round"/>` +
        bulles([[18, 120, 3], [12, 132, 4], [24, 142, 2.5]]);
    },
    lumieres() {
      const g = uid("lu"), f = uid("fl");
      let points = "";
      for (let i = 0; i < 26; i++) {
        const x = (i * 53) % 230 + 6, y = (i * 37) % 150 + 6;
        points += `<circle cx="${x}" cy="${y}" r="${1 + (i % 3) * 0.6}" fill="${i % 4 ? "#6ff7e8" : "#c7a3ff"}" opacity="${0.4 + (i % 5) * 0.12}"/>`;
      }
      return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e2747"/><stop offset="1" stop-color="#030a17"/></linearGradient>` +
        `<filter id="${f}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>` +
        `<rect width="240" height="160" rx="14" fill="url(#${g})"/>` + points +
        `<g filter="url(#${f})" opacity=".9"><path d="M76 66 C76 42 116 42 116 66 Z" fill="#45f0de"/></g>` +
        `<path d="M76 66 C76 42 116 42 116 66 C110 70 102 66 96 70 C90 66 82 70 76 66 Z" fill="#7ff7ea" opacity=".85"/>` +
        [80, 88, 96, 104, 112].map((x, i) => `<path d="M${x} 68 C${x - 6} 86 ${x + 6} 100 ${x - 2} ${118 + i * 3}" fill="none" stroke="#7ff7ea" stroke-width="2" stroke-linecap="round" opacity=".7"/>`).join("") +
        `<path d="M150 104 C160 94 186 92 200 102 C186 112 160 112 150 104 Z" fill="#3b4f6e"/>` +
        `<path d="M200 102 L214 94 L212 110 Z" fill="#3b4f6e"/>` +
        `<g filter="url(#${f})">${[158, 166, 174, 182, 190].map((x) => `<circle cx="${x}" cy="108" r="2.4" fill="#ffe36b"/>`).join("")}</g>` +
        [158, 166, 174, 182, 190].map((x) => `<circle cx="${x}" cy="108" r="1.4" fill="#fff6c2"/>`).join("") +
        `<circle cx="158" cy="100" r="2" fill="#dff8ff"/>`;
    },
    coelacanthe() {
      const g = uid("ce"), c = uid("cc");
      return fondEau(g, "#1c3f6e", "#06162e") +
        `<defs><linearGradient id="${c}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f78bd"/><stop offset="1" stop-color="#253f72"/></linearGradient></defs>` +
        `<path d="M0 150 C30 130 50 140 70 126 C90 112 110 132 130 124 L160 160 L0 160 Z" fill="#132640"/>` +
        `<path d="M190 74 C204 62 218 56 228 58 C224 70 216 78 200 82 Z" fill="#2c4a82"/>` +
        `<path d="M190 94 C204 106 218 112 228 110 C224 98 216 90 200 86 Z" fill="#2c4a82"/>` +
        `<path d="M196 84 C210 80 222 81 232 84 C222 87 210 88 196 84 Z" fill="#35588f"/>` +
        `<path d="M112 58 C116 42 128 34 138 36 C136 46 134 52 132 60 Z" fill="#2c4a82"/>` +
        `<path d="M158 64 C162 54 170 48 178 50 C176 58 172 66 168 70 Z" fill="#2c4a82"/>` +
        `<path d="M158 104 C162 114 170 120 178 118 C176 110 172 102 168 100 Z" fill="#2c4a82"/>` +
        `<path d="M34 84 C36 68 56 58 86 56 C126 54 162 60 186 72 C192 76 196 80 198 84 C196 88 192 92 186 96 C162 108 126 114 86 112 C56 110 36 100 34 84 Z" fill="url(#${c})"/>` +
        `<path d="M80 92 C84 104 92 116 106 124 C110 116 106 104 96 96 Z" fill="#35588f"/>` +
        `<path d="M122 108 C126 118 134 126 146 128 C148 120 142 112 134 108 Z" fill="#35588f"/>` +
        taches(120, 82, 70, 20, 26, "#eef4ff", 1.6, 3.6, 3) +
        `<path d="M72 64 C66 76 66 92 72 104" fill="none" stroke="#1d3561" stroke-width="2.5" stroke-linecap="round"/>` +
        `<circle cx="54" cy="76" r="8" fill="#0d1a2e"/><circle cx="54" cy="76" r="5" fill="#c9f06b" opacity=".85"/><circle cx="52" cy="74" r="1.8" fill="#fff"/>` +
        `<path d="M34 86 C40 88 46 89 52 88" fill="none" stroke="#162a4d" stroke-width="2" stroke-linecap="round"/>`;
    },
    stromatolithes() {
      const g = uid("st");
      const dome = (x, w, h, couleurs) => couleurs.map((col, i) => {
        const hh = h - i * (h / couleurs.length), ww = w - i * (w / (couleurs.length * 1.6));
        return `<path d="M${x - ww} 140 C${x - ww} ${140 - hh} ${x + ww} ${140 - hh} ${x + ww} 140 Z" fill="${col}"/>`;
      }).join("");
      return fondEau(g, "#a7d8a0", "#3f7e66") +
        `<rect x="0" y="0" width="240" height="40" fill="#d7efc9" opacity=".5"/>` +
        `<path d="M0 140 L240 140 L240 160 L0 160 Z" fill="#6b5a3e"/>` +
        dome(60, 42, 56, ["#8a6b45", "#a7855a", "#7c9a5a", "#9c7a52", "#b89666"]) +
        dome(140, 34, 44, ["#7c6040", "#9c7a52", "#6f8f50", "#a98a5e"]) +
        dome(196, 26, 34, ["#8a6b45", "#b08e60", "#7c9a5a"]) +
        bulles([[60, 66, 3], [66, 52, 4], [58, 38, 2.5], [140, 84, 3], [146, 70, 2], [196, 96, 2.5]]);
    },
    barriere() {
      const g = uid("br");
      const coraux = (x, y, n2, c1, c2) => {
        let s = "";
        for (let i = 0; i < n2; i++) s += `<circle cx="${x + i * 7 - n2 * 3}" cy="${y - (i % 2) * 5}" r="${5 + (i % 3)}" fill="${i % 2 ? c1 : c2}"/>`;
        return s;
      };
      return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7fe0d4"/><stop offset=".55" stop-color="#3cb9c9"/><stop offset="1" stop-color="#0c3f72"/></linearGradient></defs>` +
        `<rect width="240" height="160" rx="14" fill="#cdeffc"/><rect y="46" width="240" height="114" fill="url(#${g})"/>` +
        `<path d="M0 46 C10 20 30 10 46 18 C56 24 60 40 64 46 Z" fill="#5aa46a"/>` +
        `<path d="M0 46 L64 46 L80 160 L0 160 Z" fill="#e8d7a6" opacity=".9"/>` +
        `<path d="M64 46 C80 80 90 96 104 98 L132 98 L132 160 L64 160 Z" fill="#e8d7a6" opacity=".55"/>` +
        `<path d="M118 98 C122 70 130 54 138 50 C146 54 150 70 152 98 Z" fill="#e0b98c"/>` + coraux(136, 52, 5, "#f28c7b", "#f6b26b") +
        `<path d="M152 98 L166 98 C170 74 176 56 184 52 C192 56 196 74 198 98 L240 160 L132 160 Z" fill="#d8ae80" opacity=".9"/>` + coraux(184, 54, 5, "#f39bb1", "#f6c26b") +
        `<path d="M198 98 C210 120 224 140 240 150 L240 160 L190 160 Z" fill="#0a2f55" opacity=".6"/>` +
        `<path d="M74 46 L240 46" stroke="#ffffff" stroke-width="2" stroke-dasharray="6 6" opacity=".7"/>`;
    },
    baleine() {
      const g = uid("bl");
      return fondEau(g, "#5ab3e0", "#0d3d6e") +
        `<path d="M20 82 C26 60 60 50 100 52 C140 54 170 62 192 74 C200 78 206 80 212 80 L230 66 C234 74 234 88 230 98 L212 86 C200 94 180 104 150 108 C110 114 62 112 38 102 C26 98 18 92 20 82 Z" fill="#37424e"/>` +
        `<path d="M38 102 C62 112 110 114 150 108 C170 104 186 98 196 90 C180 102 150 112 110 114 C80 114 54 110 38 102 Z" fill="#cfd8dd"/>` +
        [0, 1, 2, 3, 4, 5].map((i) => `<path d="M${46 + i * 12} ${100 + i * 0.6} C${70 + i * 12} ${104 + i} ${100 + i * 10} ${106 + i * 0.5} ${124 + i * 8} ${105}" fill="none" stroke="#8d989f" stroke-width="1.4"/>`).join("") +
        `<path d="M64 96 C56 116 40 138 18 148 C26 150 38 148 50 140 C64 128 74 112 78 100 Z" fill="#e6edf0"/>` +
        `<path d="M150 62 C156 56 162 54 168 56 C166 60 164 64 164 68 Z" fill="#2c353f"/>` +
        taches(44, 70, 16, 8, 6, "#4f5b67", 1.2, 2.4, 19) +
        `<circle cx="52" cy="86" r="2.6" fill="#11161b"/>` +
        `<path d="M150 128 C156 120 176 118 190 124 C196 126 200 128 204 128 L214 120 C216 126 216 132 214 136 L204 132 C196 136 180 140 166 138 C156 136 148 134 150 128 Z" fill="#46525e"/>`;
    },
    tortue() {
      const g = uid("tt");
      let ecailles = "";
      const centres = [[120, 60], [104, 74], [136, 74], [120, 88], [104, 102], [136, 102], [120, 114]];
      centres.forEach(([x, y], i) => {
        const r = 12;
        let d = "";
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 6 + k * Math.PI / 3;
          d += (k ? "L" : "M") + (x + Math.cos(a) * r).toFixed(1) + " " + (y + Math.sin(a) * r).toFixed(1);
        }
        ecailles += `<path d="${d}Z" fill="${i % 2 ? "#8ea452" : "#9db45c"}" stroke="#55632a" stroke-width="2"/>`;
      });
      return fondEau(g, "#7fdad0", "#21909a") +
        `<path d="M86 64 C70 50 50 44 34 48 C46 58 62 68 82 76 Z M154 64 C170 50 190 44 206 48 C194 58 178 68 158 76 Z" fill="#8a9a58"/>` +
        `<path d="M90 112 C78 122 70 134 72 144 C84 138 94 128 100 118 Z M150 112 C162 122 170 134 168 144 C156 138 146 128 140 118 Z" fill="#8a9a58"/>` +
        `<ellipse cx="120" cy="40" rx="13" ry="15" fill="#9aa86a"/>` +
        `<circle cx="113" cy="36" r="2.4" fill="#1f2a12"/><circle cx="127" cy="36" r="2.4" fill="#1f2a12"/>` +
        `<ellipse cx="120" cy="88" rx="40" ry="44" fill="#6e7f3c"/>` + ecailles +
        `<ellipse cx="120" cy="88" rx="40" ry="44" fill="none" stroke="#4f5d26" stroke-width="3"/>` +
        bulles([[200, 112, 3], [208, 98, 4.5], [196, 86, 2.5]]);
    },
    mangrove() {
      const g = uid("mg");
      const racines = [[64, 96], [80, 100], [100, 102], [124, 102], [146, 100], [164, 96]].map(([x, y], i) =>
        `<path d="M${120 + (x - 120) * 0.3} 84 C${x} ${y - 20} ${x + (i < 3 ? -10 : 10)} ${y} ${x + (i < 3 ? -16 : 16)} 132" fill="none" stroke="#6e4f35" stroke-width="5" stroke-linecap="round"/>`).join("");
      return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9f3ee"/><stop offset=".6" stop-color="#bfe8e0"/><stop offset=".6" stop-color="#58b9b0"/><stop offset="1" stop-color="#1f7f86"/></linearGradient></defs>` +
        `<rect width="240" height="160" rx="14" fill="url(#${g})"/>` +
        `<rect x="114" y="54" width="12" height="40" fill="#7a573a"/>` + racines +
        `<circle cx="96" cy="46" r="26" fill="#3d8f4c"/><circle cx="126" cy="34" r="30" fill="#4aa35a"/><circle cx="156" cy="48" r="24" fill="#3d8f4c"/><circle cx="120" cy="58" r="22" fill="#57b066"/>` +
        `<path d="M0 98 C40 94 80 102 120 98 C160 94 200 102 240 98" fill="none" stroke="#ffffff" stroke-width="2" opacity=".6"/>` +
        `<g fill="#f7d36a"><path d="M40 128 l10 -4 l-2 4 l2 4 z"/><path d="M196 140 l-10 -4 l2 4 l-2 4 z"/><path d="M180 122 l-8 -3 l2 3 l-2 3 z"/></g>`;
    },
  };

  // ---------------------------------------------------------------- sous-marin
  function luciole(options = {}) {
    const f = uid("lf"), r = uid("lr");
    return `<svg viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="${options.classe || ""}">
      <defs><linearGradient id="${f}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6b0" stop-opacity=".75"/><stop offset="1" stop-color="#fff6b0" stop-opacity="0"/></linearGradient>
      <linearGradient id="${r}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd86a"/><stop offset="1" stop-color="#e7a92c"/></linearGradient></defs>
      ${options.faisceau === false ? "" : `<path d="M168 62 L220 30 L220 100 Z" fill="url(#${f})"/>`}
      <path d="M22 62 L8 48 L8 76 Z" fill="#c78a1e"/>
      <ellipse cx="14" cy="62" rx="4" ry="14" fill="#9aa5ad"/>
      <path d="M30 62 C30 40 60 32 100 32 C140 32 172 42 172 62 C172 82 140 92 100 92 C60 92 30 84 30 62 Z" fill="url(#${r})"/>
      <path d="M78 34 L84 18 L118 18 L122 34 Z" fill="#e7a92c"/><rect x="96" y="8" width="4" height="12" rx="2" fill="#9aa5ad"/>
      <circle cx="140" cy="60" r="20" fill="#0f5f78"/><circle cx="140" cy="60" r="16" fill="#7fd8e6"/>
      <path d="M130 52 C134 48 140 46 146 48" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
      <circle cx="96" cy="62" r="7" fill="#0f5f78"/><circle cx="96" cy="62" r="4.5" fill="#bdeef5"/>
      <circle cx="70" cy="62" r="7" fill="#0f5f78"/><circle cx="70" cy="62" r="4.5" fill="#bdeef5"/>
      <path d="M44 84 L60 100 L80 92" fill="none" stroke="#c78a1e" stroke-width="5" stroke-linecap="round"/>
      <circle cx="170" cy="62" r="4" fill="#fff6b0"/>
    </svg>`;
  }

  // ---------------------------------------------------------------- portraits (64 × 64)
  const PORTRAITS = {
    luci: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#0b2b3a"/>
      <circle cx="32" cy="32" r="22" fill="none" stroke="#2fd3c6" stroke-width="2" opacity=".5"/>
      <circle cx="32" cy="32" r="14" fill="none" stroke="#2fd3c6" stroke-width="3"/>
      <circle cx="32" cy="32" r="6" fill="#8ff7ee"/><circle cx="30" cy="30" r="2" fill="#ffffff"/>
      <path d="M10 46 l6 -4 l5 6 l6 -9 l5 7 l5 -5 l6 6 l6 -4" fill="none" stroke="#2fd3c6" stroke-width="1.6" opacity=".7"/></svg>`,
    poulpe: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#9fe2e6"/>
      <path d="M14 46 C10 54 16 60 20 56 M22 48 C20 58 26 62 28 56 M36 48 C38 58 44 60 44 54 M44 46 C50 54 56 52 52 46" fill="none" stroke="#b35a34" stroke-width="5" stroke-linecap="round"/>
      <path d="M14 30 C12 14 24 6 34 6 C46 6 54 16 52 30 C50 42 42 48 32 48 C22 48 15 42 14 30 Z" fill="#c8693f"/>
      <circle cx="24" cy="18" r="2.4" fill="#a14d2a"/><circle cx="40" cy="14" r="3" fill="#a14d2a"/><circle cx="34" cy="24" r="2" fill="#e9a477"/>
      <ellipse cx="24" cy="36" rx="5" ry="4.5" fill="#fff3d6"/><ellipse cx="42" cy="36" rx="5" ry="4.5" fill="#fff3d6"/>
      <rect x="20" y="35" width="8" height="2.6" rx="1.3" fill="#2b1a10"/><rect x="38" y="35" width="8" height="2.6" rx="1.3" fill="#2b1a10"/></svg>`,
    coelacanthe: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#10284a"/>
      <path d="M4 34 C6 20 22 12 40 12 C52 12 62 16 66 20 L66 50 C58 54 50 56 40 56 C22 56 6 48 4 34 Z" fill="#3d64a6"/>
      ${taches(44, 34, 16, 14, 8, "#eef4ff", 1.2, 2.6, 4)}
      <path d="M28 18 C24 28 24 42 28 50" fill="none" stroke="#1d3561" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="16" cy="28" r="6" fill="#0d1a2e"/><circle cx="16" cy="28" r="4" fill="#c9f06b"/><circle cx="14.5" cy="26.5" r="1.4" fill="#fff"/>
      <path d="M4 36 C9 38 13 38 17 37" fill="none" stroke="#162a4d" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    journal: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#e6ecef"/>
      <rect x="18" y="14" width="28" height="36" rx="3" fill="#2f6f86"/><rect x="22" y="14" width="24" height="36" rx="2" fill="#3f88a2"/>
      <path d="M27 24 h14 M27 30 h14 M27 36 h10" stroke="#e6f6fa" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M40 50 l0 8 l3 -3 l3 3 l0 -8" fill="#f2c14e"/></svg>`,
  };

  function carte(id) {
    const f = DESSINS[id];
    if (!f) return "";
    return `<svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${BNL.ESPECES[id] ? BNL.ESPECES[id].nom : id}">${f()}</svg>`;
  }

  function portrait(id) {
    const f = PORTRAITS[id];
    return f ? f() : "";
  }

  return { carte, portrait, luciole, especes: Object.keys(DESSINS) };
})();
