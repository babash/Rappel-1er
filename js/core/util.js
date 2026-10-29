// Petits outils partagés : DOM, mise en forme du texte, coloration Python, synthèse vocale.
window.BNL = window.BNL || {};

BNL.U = (() => {
  const $ = (sel, racine = document) => racine.querySelector(sel);
  const $$ = (sel, racine = document) => Array.from(racine.querySelectorAll(sel));

  function echapper(t) {
    return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Crée un élément : el("div.classe#id", { attr }, enfants...)
  function el(spec, attrs, ...enfants) {
    const m = spec.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i);
    const n = document.createElement((m && m[1]) || "div");
    if (m && m[2]) {
      for (const part of m[2].match(/[.#][\w-]+/g)) {
        if (part[0] === ".") n.classList.add(part.slice(1)); else n.id = part.slice(1);
      }
    }
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "html") n.innerHTML = v;
        else if (k === "texte") n.textContent = v;
        else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
        else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
        else n.setAttribute(k, v === true ? "" : v);
      }
    }
    for (const e of enfants.flat()) {
      if (e == null || e === false) continue;
      n.append(e instanceof Node ? e : document.createTextNode(String(e)));
    }
    return n;
  }

  // --------------------------------------------------------------------------
  //  Coloration syntaxique Python (pour les blocs de code statiques)
  // --------------------------------------------------------------------------
  const MOTS_CLES = new Set(["def", "return", "if", "elif", "else", "for", "while", "in", "not", "and", "or", "is",
    "True", "False", "None", "del", "import", "from", "as", "pass", "break", "continue", "lambda", "with", "try", "except", "global"]);
  const FONCTIONS = new Set(["print", "len", "range", "enumerate", "str", "int", "float", "list", "dict", "tuple", "set",
    "sum", "min", "max", "sorted", "type", "abs", "round", "all", "any", "isinstance", "input", "bool", "reversed", "zip"]);

  function colorer(code) {
    const re = /(#[^\n]*)|([rfbRFB]{0,2}"(?:[^"\\\n]|\\.)*"|[rfbRFB]{0,2}'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_À-ÿ][\wÀ-ÿ]*)|(\s+)|([^\w\s])/g;
    let sortie = "";
    let m;
    let apresDef = false;
    while ((m = re.exec(code))) {
      const [tout, com, chaine, nombre, mot, espace] = m;
      if (com) sortie += `<span class="tk-c">${echapper(com)}</span>`;
      else if (chaine) sortie += `<span class="tk-s">${echapper(chaine)}</span>`;
      else if (nombre) sortie += `<span class="tk-n">${nombre}</span>`;
      else if (mot) {
        if (apresDef) { sortie += `<span class="tk-f">${mot}</span>`; apresDef = false; }
        else if (MOTS_CLES.has(mot)) { sortie += `<span class="tk-k">${mot}</span>`; apresDef = mot === "def"; }
        else if (FONCTIONS.has(mot)) sortie += `<span class="tk-b">${mot}</span>`;
        else sortie += echapper(mot);
      } else if (espace) sortie += espace;
      else sortie += echapper(tout);
    }
    return sortie;
  }

  // --------------------------------------------------------------------------
  //  Mini-Markdown : **gras**, *italique*, `code` ou @code@, listes, tableaux,
  //  blocs ~~~ ... ~~~ et directives ::liste / ::dico / ::reference
  // --------------------------------------------------------------------------
  function enLigne(texte) {
    const codes = [];
    let t = echapper(texte);
    t = t.replace(/`([^`]+)`|@([^@\n]+)@/g, (_, a, b) => {
      codes.push(`<code>${a ?? b}</code>`);
      return `\u0000${codes.length - 1}\u0000`;
    });
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    return t.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[+i]);
  }

  function blocCode(code, options) {
    const id = "c" + Math.random().toString(36).slice(2, 9);
    const bouton = options && options.essayer
      ? `<button class="bouton-essayer" data-essayer="${id}" type="button" title="Lancer cet exemple dans le bac à sable">▶ Essayer</button>` : "";
    if (options && options.essayer) {
      BNL.U.codesEssai = BNL.U.codesEssai || {};
      BNL.U.codesEssai[id] = code;
    }
    return `<div class="bloc-code">${bouton}<pre class="code-statique">${colorer(code)}</pre></div>`;
  }

  function md(texte, options = {}) {
    if (!texte) return "";
    const lignes = String(texte).replace(/\r/g, "").split("\n");
    const html = [];
    let i = 0;
    let paragraphe = [];
    const finirParagraphe = () => {
      if (paragraphe.length) html.push(`<p>${paragraphe.map(enLigne).join("<br>")}</p>`);
      paragraphe = [];
    };
    while (i < lignes.length) {
      const l = lignes[i];
      if (/^(~~~|```)/.test(l.trim())) {
        finirParagraphe();
        const code = [];
        i++;
        while (i < lignes.length && !/^(~~~|```)/.test(lignes[i].trim())) code.push(lignes[i++]);
        i++;
        html.push(blocCode(code.join("\n"), options));
        continue;
      }
      const directive = l.match(/^::(liste|dico)\s+(\w+)\s+(.+)$/);
      if (directive) {
        finirParagraphe();
        try {
          const valeur = JSON.parse(directive[3]);
          html.push(BNL.Visu.diagrammeJSON(directive[2], valeur));
        } catch (e) { html.push(`<p>${echapper(l)}</p>`); }
        i++;
        continue;
      }
      if (l.trim() === "::reference") {
        finirParagraphe();
        html.push(BNL.Visu.schemaReference());
        i++;
        continue;
      }
      if (/^\s*\|/.test(l)) {
        finirParagraphe();
        const rangs = [];
        while (i < lignes.length && /^\s*\|/.test(lignes[i])) rangs.push(lignes[i++]);
        const cellules = rangs.filter((r) => !/^\s*\|[\s:|-]+\|\s*$/.test(r))
          .map((r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        const [entete, ...corps] = cellules;
        html.push(`<div class="tableau-defile"><table class="tableau-md"><thead><tr>${entete.map((c) => `<th>${enLigne(c)}</th>`).join("")}</tr></thead><tbody>${corps.map((r) => `<tr>${r.map((c) => `<td>${enLigne(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
        continue;
      }
      if (/^\s*[-•]\s+/.test(l)) {
        finirParagraphe();
        const items = [];
        while (i < lignes.length && /^\s*[-•]\s+/.test(lignes[i])) items.push(lignes[i++].replace(/^\s*[-•]\s+/, ""));
        html.push(`<ul>${items.map((x) => `<li>${enLigne(x)}</li>`).join("")}</ul>`);
        continue;
      }
      if (/^\s*\d+\.\s+/.test(l)) {
        finirParagraphe();
        const items = [];
        while (i < lignes.length && /^\s*\d+\.\s+/.test(lignes[i])) items.push(lignes[i++].replace(/^\s*\d+\.\s+/, ""));
        html.push(`<ol>${items.map((x) => `<li>${enLigne(x)}</li>`).join("")}</ol>`);
        continue;
      }
      if (!l.trim()) { finirParagraphe(); i++; continue; }
      paragraphe.push(l);
      i++;
    }
    finirParagraphe();
    return html.join("");
  }

  // Texte brut (pour la lecture à voix haute)
  function texteBrut(t) {
    return String(t || "").replace(/~~~[\s\S]*?~~~/g, " ").replace(/[@`*]/g, "")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]/gu, "").replace(/\s+/g, " ").trim();
  }

  // --------------------------------------------------------------------------
  //  Lecture à voix haute (aide à la lecture)
  // --------------------------------------------------------------------------
  let voix = null;
  function choisirVoix() {
    if (!("speechSynthesis" in window)) return null;
    const toutes = speechSynthesis.getVoices();
    voix = toutes.find((v) => /^fr(-|_)FR/i.test(v.lang)) || toutes.find((v) => /^fr/i.test(v.lang)) || null;
    return voix;
  }
  if ("speechSynthesis" in window) {
    choisirVoix();
    speechSynthesis.onvoiceschanged = choisirVoix;
  }
  function lire(texte, bouton) {
    if (!("speechSynthesis" in window)) return;
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      $$(".lecture-en-cours").forEach((b) => b.classList.remove("lecture-en-cours"));
      if (bouton && bouton.dataset.lit === "1") { bouton.dataset.lit = "0"; return; }
    }
    const u = new SpeechSynthesisUtterance(texteBrut(texte));
    u.lang = "fr-FR";
    u.rate = 0.95;
    if (voix || choisirVoix()) u.voice = voix;
    if (bouton) {
      bouton.classList.add("lecture-en-cours");
      bouton.dataset.lit = "1";
      u.onend = u.onerror = () => { bouton.classList.remove("lecture-en-cours"); bouton.dataset.lit = "0"; };
    }
    speechSynthesis.speak(u);
  }
  const peutLire = () => "speechSynthesis" in window;

  // --------------------------------------------------------------------------
  //  Divers
  // --------------------------------------------------------------------------
  function duree(secondes) {
    secondes = Math.round(secondes || 0);
    if (secondes < 60) return secondes + " s";
    const m = Math.floor(secondes / 60);
    if (m < 60) return m + " min" + (secondes % 60 >= 30 && m < 10 ? " " + (secondes % 60) + " s" : "");
    return Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0");
  }

  function depuis(date) {
    if (!date) return "jamais";
    const s = (Date.now() - new Date(date).getTime()) / 1000;
    if (s < 60) return "à l'instant";
    if (s < 3600) return "il y a " + Math.floor(s / 60) + " min";
    if (s < 86400) return "il y a " + Math.floor(s / 3600) + " h";
    return "il y a " + Math.floor(s / 86400) + " j";
  }

  function retarder(f, ms) {
    let t = null;
    const g = (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); };
    g.maintenant = (...a) => { clearTimeout(t); f(...a); };
    return g;
  }

  const reduitMouvement = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return { $, $$, el, echapper, colorer, md, enLigne, texteBrut, lire, peutLire, duree, depuis, retarder, reduitMouvement };
})();
