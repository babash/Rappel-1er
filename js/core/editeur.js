// L'éditeur de code (Ace) : coloration, indentation visible, autocomplétion en français.
window.BNL = window.BNL || {};

BNL.Editeur = (() => {
  ace.config.set("basePath", "vendor/ace");

  // Indentation bien visible : Ace ne dessine normalement pas le dernier niveau
  // d'indentation d'une ligne. On le dessine aussi, pour que chaque bloc forme
  // une bande de couleur continue (voir .ace_indent-guide dans style.css).
  try {
    const Text = ace.require("ace/layer/text").Text;
    const original = Text.prototype.renderIndentGuide;
    Text.prototype.renderIndentGuide = function (parent, value, max) {
      let cols = value.search(/\S/);
      if (cols === -1) cols = value.length; // jeton composé uniquement d'espaces (début de ligne)
      if (cols <= 0 || cols >= max || value[0] !== " " || !this.$tabStrings || !this.$tabStrings[" "] || !this.displayIndentGuides) {
        return original.call(this, parent, value, max);
      }
      const nb = Math.floor(cols / this.tabSize);
      for (let i = 0; i < nb; i++) parent.appendChild(this.$tabStrings[" "].cloneNode(true));
      this.$highlightIndentGuide();
      return value.substr(nb * this.tabSize);
    };
  } catch (e) { /* version d'Ace différente : on garde le rendu normal */ }
  const langTools = ace.require("ace/ext/language_tools");
  const Range = ace.require("ace/range").Range;

  // Documentation affichée dans la bulle d'autocomplétion
  const DOC_FONCTIONS = {
    print: ["print(valeur, ...)", "Affiche une ou plusieurs valeurs dans la console, séparées par des espaces."],
    len: ["len(objet)", "Nombre d'éléments d'une liste, d'un dictionnaire, d'un tuple ou d'un texte."],
    range: ["range(fin) / range(debut, fin)", "Les nombres de debut (0 par défaut) jusqu'à fin exclue. Exemple : range(3) → 0, 1, 2."],
    enumerate: ["enumerate(liste)", "Donne les paires (indice, élément) : for i, x in enumerate(liste):"],
    str: ["str(valeur)", "Convertit en texte. Exemple : str(5) → \"5\"."],
    int: ["int(valeur)", "Convertit en nombre entier. Exemple : int(\"12\") → 12."],
    float: ["float(valeur)", "Convertit en nombre à virgule."],
    list: ["list(objet)", "Crée une liste (par exemple à partir d'un tuple ou de dico.keys())."],
    dict: ["dict()", "Crée un dictionnaire vide (comme {})."],
    tuple: ["tuple(objet)", "Crée un tuple."],
    sum: ["sum(liste)", "Somme des nombres d'une liste."],
    min: ["min(liste)", "Plus petite valeur."],
    max: ["max(liste)", "Plus grande valeur."],
    sorted: ["sorted(liste)", "Renvoie une NOUVELLE liste triée."],
    type: ["type(valeur)", "Le type d'une valeur : list, dict, str, int…"],
    abs: ["abs(x)", "Valeur absolue."],
    round: ["round(x, n)", "Arrondi de x avec n chiffres après la virgule."],
    all: ["all(conditions)", "True si toutes les conditions sont vraies."],
    any: ["any(conditions)", "True si au moins une condition est vraie."],
  };
  const DOC_METHODES = {
    list: {
      append: ["liste.append(x)", "Ajoute x à la FIN de la liste."],
      insert: ["liste.insert(i, x)", "Insère x à l'indice i."],
      extend: ["liste.extend(autre)", "Ajoute tous les éléments d'une autre liste à la fin."],
      pop: ["liste.pop(i)", "Retire l'élément d'indice i et le renvoie (le dernier si i est omis)."],
      remove: ["liste.remove(x)", "Retire la première valeur égale à x."],
      index: ["liste.index(x)", "Indice de la première valeur égale à x."],
      count: ["liste.count(x)", "Nombre de fois où x apparaît."],
      copy: ["liste.copy()", "Renvoie une vraie copie de la liste."],
      sort: ["liste.sort()", "Trie la liste (la modifie, ne renvoie rien)."],
      reverse: ["liste.reverse()", "Inverse l'ordre des éléments."],
    },
    dict: {
      get: ["dico.get(cle, defaut)", "Valeur de la clé, ou defaut si la clé n'existe pas (pas d'erreur)."],
      keys: ["dico.keys()", "Les clés du dictionnaire."],
      values: ["dico.values()", "Les valeurs du dictionnaire."],
      items: ["dico.items()", "Les paires (clé, valeur) : for cle, valeur in dico.items():"],
      pop: ["dico.pop(cle)", "Supprime la clé et renvoie sa valeur."],
      copy: ["dico.copy()", "Renvoie une vraie copie du dictionnaire."],
      update: ["dico.update(autre)", "Ajoute ou remplace les paires d'un autre dictionnaire."],
    },
    str: {
      upper: ["texte.upper()", "En MAJUSCULES."], lower: ["texte.lower()", "En minuscules."],
      split: ["texte.split(sep)", "Découpe le texte en liste."], strip: ["texte.strip()", "Enlève les espaces au début et à la fin."],
      replace: ["texte.replace(a, b)", "Remplace a par b."], join: ["sep.join(liste)", "Colle les textes d'une liste."],
      startswith: ["texte.startswith(debut)", "True si le texte commence par debut."], count: ["texte.count(x)", "Nombre d'apparitions de x."],
    },
    tuple: { count: ["tuple.count(x)", "Nombre d'apparitions de x."], index: ["tuple.index(x)", "Indice de x."] },
  };
  const MOTS_CLES = ["for", "in", "if", "elif", "else", "while", "def", "return", "True", "False", "None", "and", "or", "not", "del", "break", "continue", "pass", "is", "import", "from", "lambda"];

  const doc = (sig, texte) => `<div class="doc-auto"><code>${BNL.U.echapper(sig)}</code><p>${BNL.U.echapper(texte)}</p></div>`;

  // Le contexte de la mission (types et clés des variables du dossier)
  let contexte = { types: {}, cles: {} };

  function typesDuCode(code) {
    const types = Object.assign({}, contexte.types);
    const re = /^\s*([A-Za-z_]\w*)\s*=\s*(.)/gm;
    let m;
    while ((m = re.exec(code))) {
      const debut = m[2];
      if (debut === "[") types[m[1]] = "list";
      else if (debut === "{") types[m[1]] = "dict";
      else if (debut === "(") types[m[1]] = "tuple";
      else if (debut === "\"" || debut === "'") types[m[1]] = "str";
    }
    return types;
  }

  const completeurBNL = {
    id: "bnl",
    triggerCharacters: [".", "\"", "'"],
    getCompletions(editor, session, pos, prefixe, rappel) {
      const ligne = session.getLine(pos.row).slice(0, pos.column);
      const code = session.getValue();
      // 1) Après « nom. » : les méthodes adaptées au type
      const point = ligne.match(/([A-Za-z_]\w*)\.(\w*)$/);
      if (point) {
        const type = typesDuCode(code)[point[1]];
        const groupes = type && DOC_METHODES[type] ? { [type]: DOC_METHODES[type] } : DOC_METHODES;
        const res = [];
        for (const [t, meths] of Object.entries(groupes)) {
          for (const [nom, [sig, texte]] of Object.entries(meths)) {
            const item = { caption: nom + "()", meta: type ? "méthode" : "méthode de " + (t === "list" ? "liste" : t === "dict" ? "dico" : t), score: 1000, docHTML: doc(sig, texte) };
            if (SANS_PARAM.has(nom)) item.value = nom + "()"; else item.snippet = nom + "(${1})";
            res.push(item);
          }
        }
        return rappel(null, res);
      }
      // 2) Après « dico[" » : les clés du dictionnaire
      const crochet = ligne.match(/([A-Za-z_]\w*)\[\s*["']([^"']*)$/);
      if (crochet) {
        const cles = contexte.cles[crochet[1]] || [];
        return rappel(null, cles.map((k) => ({ caption: k, value: k, meta: "clé de " + crochet[1], score: 2000 })));
      }
      if (/["']$/.test(ligne)) return rappel(null, []);
      // 3) Sinon : variables, fonctions, mots-clés
      const res = [];
      const vus = new Set();
      const ajouter = (o) => { if (!vus.has(o.caption)) { vus.add(o.caption); res.push(o); } };
      for (const [nom, type] of Object.entries(typesDuCode(code))) {
        ajouter({ caption: nom, value: nom, meta: BNL.Visu.NOM_TYPE[type] || "variable", score: 900 });
      }
      const re = /\b(?:def\s+([A-Za-z_]\w*)|for\s+([A-Za-z_]\w*)(?:\s*,\s*([A-Za-z_]\w*))?)/g;
      let m;
      while ((m = re.exec(code))) {
        for (const nom of [m[1], m[2], m[3]]) if (nom) ajouter({ caption: nom, value: nom, meta: m[1] ? "fonction" : "variable de boucle", score: 850 });
      }
      for (const [nom, [sig, texte]] of Object.entries(DOC_FONCTIONS)) ajouter({ caption: nom, value: nom, meta: "fonction", score: 500, docHTML: doc(sig, texte) });
      for (const k of MOTS_CLES) ajouter({ caption: k, value: k, meta: "mot-clé", score: 400 });
      rappel(null, res);
    },
  };

  // Méthodes sans paramètre : on insère « nom() » ; sinon le curseur se place entre les parenthèses.
  const SANS_PARAM = new Set(["copy", "keys", "values", "items", "sort", "reverse", "upper", "lower", "strip", "clear"]);

  const snippets = [
    { name: "for … in …", tabTrigger: "for", content: "for ${1:element} in ${2:liste}:\n\t${3:print(${1:element})}" },
    { name: "for i in range(len(…))", tabTrigger: "forr", content: "for ${1:i} in range(len(${2:liste})):\n\t${3:print(${2:liste}[${1:i}])}" },
    { name: "for cle, valeur in ….items()", tabTrigger: "fori", content: "for ${1:cle}, ${2:valeur} in ${3:dico}.items():\n\t${4:print(${1:cle}, ${2:valeur})}" },
    { name: "if … :", tabTrigger: "if", content: "if ${1:condition}:\n\t${2:pass}" },
    { name: "if … else", tabTrigger: "ife", content: "if ${1:condition}:\n\t${2:pass}\nelse:\n\t${3:pass}" },
    { name: "def fonction(…)", tabTrigger: "def", content: "def ${1:nom}(${2:parametres}):\n\t${3:return}" },
  ];
  try {
    const sm = ace.require("ace/snippets").snippetManager;
    sm.register(snippets, "python");
  } catch (e) { /* pas grave */ }

  function creer(noeud, options = {}) {
    const editeur = ace.edit(noeud, {
      mode: "ace/mode/python",
      theme: "ace/theme/" + (options.theme || "tomorrow"),
      fontSize: options.taille || 16,
      fontFamily: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
      tabSize: 4, useSoftTabs: true, navigateWithinSoftTabs: true,
      showPrintMargin: false, displayIndentGuides: true, highlightIndentGuides: true,
      enableBasicAutocompletion: true, enableLiveAutocompletion: true, enableSnippets: true,
      liveAutocompletionThreshold: 2, liveAutocompletionDelay: 120,
      scrollPastEnd: 0.4, wrap: false, showFoldWidgets: false, fixedWidthGutter: true,
      highlightActiveLine: true, copyWithEmptySelection: true, behavioursEnabled: true,
    });
    editeur.completers = options.uneLigne ? [completeurBNL] : [completeurBNL, langTools.snippetCompleter];
    editeur.session.setUseWorker(false);
    noeud.classList.add("bnl-editeur");
    if (options.uneLigne) {
      // Console : une seule ligne, comme l'invite >>> de Python
      editeur.setOptions({
        maxLines: 1, minLines: 1, showGutter: false, highlightActiveLine: false, displayIndentGuides: false,
        scrollPastEnd: 0, enableSnippets: false, liveAutocompletionThreshold: 2,
      });
      editeur.renderer.setScrollMargin(6, 6);
      editeur.renderer.setPadding(8);
      noeud.classList.add("editeur-une-ligne");
    } else {
      editeur.renderer.setScrollMargin(8, 8);
    }
    // Sur les écrans tactiles : pas de correction automatique du clavier
    const zoneTexte = editeur.textInput && editeur.textInput.getElement && editeur.textInput.getElement();
    if (zoneTexte) {
      zoneTexte.setAttribute("autocapitalize", "off");
      zoneTexte.setAttribute("autocorrect", "off");
      zoneTexte.setAttribute("spellcheck", "false");
    }
    if (options.lecture) editeur.setReadOnly(true);
    return editeur;
  }

  let marqueurs = [];
  function effacerErreurs(editeur) {
    editeur.session.clearAnnotations();
    marqueurs.forEach((id) => editeur.session.removeMarker(id));
    marqueurs = [];
  }
  function montrerErreur(editeur, ligne, message, type = "error") {
    if (!ligne) return;
    const r = ligne - 1;
    editeur.session.setAnnotations([{ row: r, column: 0, text: message, type }]);
    marqueurs.push(editeur.session.addMarker(new Range(r, 0, r, 1), type === "error" ? "ligne-erreur" : "ligne-trou", "fullLine"));
  }
  function montrerTrous(editeur, lignes) {
    editeur.session.setAnnotations(lignes.map((l) => ({ row: l - 1, column: 0, text: "Trou à compléter", type: "warning" })));
    lignes.forEach((l) => marqueurs.push(editeur.session.addMarker(new Range(l - 1, 0, l - 1, 1), "ligne-trou", "fullLine")));
    const premier = lignes[0];
    const texte = editeur.session.getLine(premier - 1);
    const col = texte.indexOf("___");
    if (col >= 0) {
      editeur.focus();
      editeur.selection.setRange(new Range(premier - 1, col, premier - 1, col + 3));
      editeur.scrollToLine(premier - 1, true, true, () => {});
    }
  }

  return {
    creer,
    effacerErreurs,
    montrerErreur,
    montrerTrous,
    definirContexte: (c) => { contexte = { types: (c && c.types) || {}, cles: (c && c.cles) || {} }; },
  };
})();
