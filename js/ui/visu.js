// Dessins des données : listes avec leurs indices, dictionnaires, grilles,
// inspecteur de variables, et animations pas à pas des algorithmes.
window.BNL = window.BNL || {};

BNL.Visu = (() => {
  const { echapper } = BNL.U;

  const NOM_TYPE = { list: "liste", tuple: "tuple", dict: "dictionnaire", str: "texte", int: "entier", float: "décimal",
    bool: "booléen", none: "None", func: "fonction", set: "ensemble", autre: "objet" };

  // Convertit une valeur JSON (du mémo) vers le format sérialisé du moteur Python
  function depuisJSON(v) {
    if (v === null) return { t: "none" };
    if (Array.isArray(v)) return { t: "list", v: v.map(depuisJSON), n: v.length };
    if (typeof v === "object") return { t: "dict", v: Object.entries(v).map(([k, x]) => [{ t: "str", v: k }, depuisJSON(x)]), n: Object.keys(v).length };
    if (typeof v === "string") return { t: "str", v };
    if (typeof v === "boolean") return { t: "bool", v };
    if (Number.isInteger(v)) return { t: "int", v };
    return { t: "float", v: String(v) };
  }

  function scalaire(s) {
    switch (s.t) {
      case "str": return `<span class="v-str">"${echapper(s.v)}"</span>`;
      case "int": return `<span class="v-num">${echapper(s.v)}</span>`;
      case "float": return `<span class="v-num">${echapper(s.v)}</span>`;
      case "bool": return `<span class="v-bool">${s.v ? "True" : "False"}</span>`;
      case "none": return `<span class="v-none">None</span>`;
      case "func": return `<span class="v-func">ƒ ${echapper(s.v)}</span>`;
      case "plus": return `<span class="v-none">…</span>`;
      default: return `<span class="v-autre">${echapper(s.v)}</span>`;
    }
  }

  const estScalaire = (s) => !["list", "tuple", "dict", "set"].includes(s.t);
  const estGrille = (s) => (s.t === "list" || s.t === "tuple") && s.v.length > 0 && s.v.length <= 12 &&
    s.v.every((x) => (x.t === "list" || x.t === "tuple") && !x.alias && x.v.length <= 10 && x.v.every(estScalaire));

  function alias(s) {
    return `<span class="v-alias" title="Ces deux noms désignent le même objet en mémoire">🔗 même ${s.t === "dict" ? "dictionnaire" : "liste"} que <code>${echapper(s.alias)}</code></span>`;
  }

  // Une liste dessinée en cases, avec indices positifs au-dessus et négatifs en dessous
  function liste(s, profondeur = 0) {
    if (s.alias) return alias(s);
    if (!s.v.length) return `<span class="v-vide">${s.t === "tuple" ? "( )" : "[ ]"} vide</span>`;
    if (estGrille(s) && profondeur === 0) return grille(s);
    const montrerNegatifs = profondeur === 0 && s.v.length <= 10;
    const cases = s.v.map((x, i) => `
      <div class="v-case">
        <span class="v-indice">${i}</span>
        <div class="v-valeur">${estScalaire(x) ? scalaire(x) : valeur(x, profondeur + 1)}</div>
        ${montrerNegatifs ? `<span class="v-indice v-neg">${i - s.v.length}</span>` : ""}
      </div>`).join("");
    const reste = s.n > s.v.length ? `<div class="v-case v-reste">+${s.n - s.v.length}</div>` : "";
    return `<div class="v-liste ${s.t === "tuple" ? "v-tuple" : ""}">${cases}${reste}</div>`;
  }

  function grille(s) {
    const nbCol = Math.max(...s.v.map((l) => l.v.length));
    const tete = `<tr><th></th>${Array.from({ length: nbCol }, (_, j) => `<th class="v-indice">${j}</th>`).join("")}</tr>`;
    const corps = s.v.map((l, i) => `<tr><th class="v-indice">${i}</th>${l.v.map((x) => `<td>${scalaire(x)}</td>`).join("")}</tr>`).join("");
    return `<table class="v-grille">${tete}${corps}</table>`;
  }

  function dico(s, profondeur = 0) {
    if (s.alias) return alias(s);
    if (!s.v.length) return `<span class="v-vide">{ } vide</span>`;
    const lignes = s.v.map(([k, x]) => `
      <tr><td class="v-cle">${scalaire(k)}</td><td class="v-fleche">→</td>
      <td>${estScalaire(x) ? scalaire(x) : valeur(x, profondeur + 1)}</td></tr>`).join("");
    const reste = s.n > s.v.length ? `<tr><td colspan="3" class="v-reste">… et ${s.n - s.v.length} autres</td></tr>` : "";
    return `<table class="v-dico">${lignes}${reste}</table>`;
  }

  function valeur(s, profondeur = 0) {
    if (s.t === "list" || s.t === "tuple") return liste(s, profondeur);
    if (s.t === "dict") return dico(s, profondeur);
    if (s.t === "set") return `<span class="v-autre">{${s.v.map(scalaire).join(", ")}}</span>`;
    return scalaire(s);
  }

  function carteVariable(v) {
    const s = v.val;
    const type = NOM_TYPE[s.t] || s.t;
    const taille = (s.t === "list" || s.t === "tuple" || s.t === "dict" || s.t === "str") && s.n != null && !s.alias
      ? `<span class="v-taille" title="len(${echapper(v.nom)})">${s.n} élément${s.n > 1 ? "s" : ""}</span>` : "";
    return `<div class="v-carte ${v.dossier ? "v-dossier" : "v-nouvelle"}">
      <div class="v-entete"><code class="v-nom">${echapper(v.nom)}</code><span class="v-type">${type}</span>${taille}</div>
      <div class="v-corps">${valeur(s)}</div></div>`;
  }

  function variables(liste, options = {}) {
    if (!liste || !liste.length) return `<p class="vide">Aucune variable pour l'instant. Lance ton programme pour voir ce qu'il range en mémoire.</p>`;
    const filtrees = options.seulement ? liste.filter((v) => options.seulement.includes(v.nom)) : liste;
    return `<div class="v-variables">${filtrees.map(carteVariable).join("")}</div>`;
  }

  function diagrammeJSON(nom, valeurJS) {
    return `<div class="v-diagramme">${carteVariable({ nom, val: depuisJSON(valeurJS), dossier: true })}</div>`;
  }

  function schemaReference() {
    return `<div class="schema-ref" role="img" aria-label="Avec b = a, deux noms désignent la même liste. Avec c = a.copy(), on obtient deux listes différentes.">
      <div class="sr-col"><div class="sr-titre"><code>b = a</code></div>
        <div class="sr-noms"><span>a</span><span>b</span></div>
        <div class="sr-fleches">↘ ↙</div>
        <div class="sr-objet">[1, 2, 3]</div>
        <div class="sr-note">une seule liste, deux noms</div></div>
      <div class="sr-col"><div class="sr-titre"><code>c = a.copy()</code></div>
        <div class="sr-noms"><span>a</span><span>c</span></div>
        <div class="sr-fleches">↓&nbsp;&nbsp;&nbsp;&nbsp;↓</div>
        <div class="sr-objets"><span class="sr-objet">[1, 2, 3]</span><span class="sr-objet">[1, 2, 3]</span></div>
        <div class="sr-note">deux listes indépendantes</div></div>
    </div>`;
  }

  // ---------------------------------------------------------------------------
  //  Animations pas à pas
  // ---------------------------------------------------------------------------
  function etapesMaximum(tab, nom) {
    const etapes = [];
    let maxi = tab[0], position = 0;
    etapes.push({ tab, marques: { 0: "champion" }, vars: { maxi, position }, texte: `On commence : le premier élément, ${tab[0]}, est le champion provisoire (maxi = ${maxi}, position = 0).` });
    for (let i = 0; i < tab.length; i++) {
      const plus = tab[i] > maxi;
      const marques = { [position]: "champion", [i]: plus ? "nouveau" : "regarde" };
      const texte = `i = ${i} : ${nom}[${i}] vaut ${tab[i]}. ${tab[i]} > ${maxi} ? ` + (plus
        ? `Oui ! Nouveau champion : maxi = ${tab[i]}, position = ${i}.` : `Non, on garde le champion.`);
      if (plus) { maxi = tab[i]; position = i; }
      etapes.push({ tab, marques, vars: { i, maxi, position }, texte });
    }
    etapes.push({ tab, marques: { [position]: "champion" }, vars: { maxi, position }, texte: `Fin de la boucle : le maximum est ${maxi}, à l'indice ${position}.` });
    return etapes;
  }

  function etapesSelection(tab0) {
    const t = tab0.slice();
    const etapes = [{ tab: t.slice(), marques: {}, vars: {}, texte: "Au départ, rien n'est trié." }];
    for (let i = 0; i < t.length; i++) {
      let iMin = i;
      for (let j = i + 1; j < t.length; j++) if (t[j] < t[iMin]) iMin = j;
      const marques = {};
      for (let k = 0; k < i; k++) marques[k] = "trie";
      marques[i] = "regarde"; marques[iMin] = "champion";
      etapes.push({ tab: t.slice(), marques, vars: { i, i_min: iMin }, texte: `i = ${i} : le plus petit élément entre l'indice ${i} et la fin est ${t[iMin]} (indice ${iMin}).` });
      [t[i], t[iMin]] = [t[iMin], t[i]];
      const m2 = {};
      for (let k = 0; k <= i; k++) m2[k] = "trie";
      etapes.push({ tab: t.slice(), marques: m2, vars: { i }, texte: iMin === i ? `Il est déjà à sa place.` : `On échange les indices ${i} et ${iMin} : ${t[i]} est maintenant à sa place.` });
    }
    etapes.push({ tab: t.slice(), marques: Object.fromEntries(t.map((_, k) => [k, "trie"])), vars: {}, texte: "La liste est triée !" });
    return etapes;
  }

  function animation(conteneur, type, tab, nom) {
    const etapes = type === "selection" ? etapesSelection(tab) : etapesMaximum(tab, nom || "liste");
    let n = 0;
    let minuteur = null;
    conteneur.innerHTML = `
      <div class="anim">
        <div class="anim-tab"></div>
        <div class="anim-vars"></div>
        <p class="anim-texte" aria-live="polite"></p>
        <div class="anim-boutons">
          <button type="button" class="bouton petit" data-a="debut">⏮</button>
          <button type="button" class="bouton petit" data-a="prec">◀ Étape</button>
          <button type="button" class="bouton petit principal" data-a="suiv">Étape ▶</button>
          <button type="button" class="bouton petit" data-a="lecture">Lecture auto</button>
          <span class="anim-compte"></span>
        </div>
      </div>`;
    const dessiner = () => {
      const e = etapes[n];
      conteneur.querySelector(".anim-tab").innerHTML = e.tab.map((x, i) =>
        `<div class="v-case ${e.marques[i] ? "a-" + e.marques[i] : ""}"><span class="v-indice">${i}</span><div class="v-valeur"><span class="v-num">${x}</span></div></div>`).join("");
      conteneur.querySelector(".anim-vars").innerHTML = Object.entries(e.vars).map(([k, v]) => `<span class="anim-var"><code>${k}</code> = <strong>${v}</strong></span>`).join("");
      conteneur.querySelector(".anim-texte").textContent = e.texte;
      conteneur.querySelector(".anim-compte").textContent = `${n + 1} / ${etapes.length}`;
    };
    conteneur.addEventListener("click", (ev) => {
      const a = ev.target.closest("[data-a]");
      if (!a) return;
      const action = a.dataset.a;
      if (action !== "lecture") { clearInterval(minuteur); minuteur = null; }
      if (action === "debut") n = 0;
      if (action === "prec") n = Math.max(0, n - 1);
      if (action === "suiv") n = Math.min(etapes.length - 1, n + 1);
      if (action === "lecture") {
        if (minuteur) { clearInterval(minuteur); minuteur = null; a.textContent = "Lecture auto"; return; }
        a.textContent = "Pause";
        minuteur = setInterval(() => {
          if (n >= etapes.length - 1) { clearInterval(minuteur); minuteur = null; a.textContent = "Lecture auto"; return; }
          n++; dessiner();
        }, 1600);
      }
      dessiner();
    });
    dessiner();
  }

  return { variables, valeur, carteVariable, diagrammeJSON, depuisJSON, schemaReference, animation, NOM_TYPE };
})();
