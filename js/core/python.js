// Démarrage de Python (Pyodide) et exécution des programmes des élèves.
//
// Plusieurs façons de démarrer, essayées dans l'ordre jusqu'à ce que l'une marche :
//   1. dans un « worker » avec les fichiers du site (vendor/pyodide) : le cas normal sur GitHub Pages ;
//   2. dans un worker avec Pyodide téléchargé depuis le CDN jsDelivr (si un serveur local
//      sert mal les fichiers .mjs ou .wasm) ;
//   3. directement dans la page, depuis le CDN : seule possibilité quand le site est ouvert
//      en double-cliquant sur index.html (adresse file://), où les workers sont interdits.
window.BNL = window.BNL || {};

BNL.Python = (() => {
  const cfg = window.BNL_CONFIG || {};
  const VERSION = "314.0.7";
  // Deux copies publiques de Pyodide sur jsDelivr : le paquet npm (mêmes fichiers que vendor/pyodide)
  // et le miroir officiel des versions de Pyodide.
  const CDN = `https://cdn.jsdelivr.net/npm/pyodide@${VERSION}/`;
  const CDN2 = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/`;
  const urlLocal = new URL(cfg.PYODIDE_URL || "vendor/pyodide/", document.baseURI).href;
  const urlWorker = new URL("js/core/py-worker.js", document.baseURI).href;
  const fichierLocal = location.protocol === "file:";
  const delaiMs = cfg.DELAI_EXECUTION_MS || 7000;

  let etat = "arret"; // arret | chargement | pret | erreur
  let mode = null;    // worker | page
  let worker = null;
  let executerPage = null;
  let promessePret = null;
  let idSuivant = 1;
  const enAttente = new Map();
  const abonnes = [];
  const diagnostic = [];
  let tentativeReussie = null;

  function changerEtat(nouveau, detail) {
    etat = nouveau;
    abonnes.forEach((f) => { try { f(nouveau, detail); } catch (e) { console.error(e); } });
  }

  function tentatives() {
    const page = [
      { mode: "page", url: CDN, nom: "dans la page, depuis Internet (jsDelivr, paquet npm)" },
      { mode: "page", url: CDN2, nom: "dans la page, depuis Internet (jsDelivr, miroir Pyodide)" },
    ];
    if (fichierLocal) return page;
    const liste = [{ mode: "worker", url: urlLocal, nom: "avec les fichiers du site" }];
    if (urlLocal !== CDN) liste.push({ mode: "worker", url: CDN, nom: "dans un worker, depuis Internet (jsDelivr)" });
    return liste.concat(page);
  }

  function demarrerWorker(url) {
    return new Promise((resoudre, rejeter) => {
      let w;
      try {
        w = new Worker(urlWorker, { type: "module" });
      } catch (e) {
        rejeter(new Error("le navigateur refuse de lancer un worker (" + e.message + ")"));
        return;
      }
      const minuteur = setTimeout(() => { w.terminate(); rejeter(new Error("trop long (plus de 3 minutes)")); }, 180000);
      w.onmessage = (evt) => {
        const m = evt.data;
        if (m.type === "pret") { clearTimeout(minuteur); w.onmessage = surMessage; resoudre(w); }
        else if (m.type === "echec_init") { clearTimeout(minuteur); w.terminate(); rejeter(new Error(m.message)); }
      };
      w.onerror = (e) => { clearTimeout(minuteur); w.terminate(); rejeter(new Error((e && e.message) || "erreur du worker")); };
      w.postMessage({ type: "init", urlPyodide: url, harness: BNL.HARNESS_PY });
    });
  }

  async function demarrerPage(url) {
    const module = await import(url + "pyodide.mjs");
    const py = await module.loadPyodide({ indexURL: url });
    py.FS.writeFile("/home/pyodide/harness.py", BNL.HARNESS_PY);
    py.runPython("import sys\nsys.path.insert(0, '/home/pyodide')\nimport harness");
    const f = py.runPython("harness.executer_json");
    return (requete) => JSON.parse(f(JSON.stringify(requete)));
  }

  function surMessage(evt) {
    const m = evt.data;
    if (m.type !== "resultat") return;
    const attente = enAttente.get(m.id);
    if (attente) {
      clearTimeout(attente.minuteur);
      enAttente.delete(m.id);
      attente.resoudre(m.resultat);
    }
  }

  function demarrer() {
    if (promessePret) return promessePret;
    changerEtat("chargement");
    promessePret = (async () => {
      for (const t of (tentativeReussie ? [tentativeReussie] : tentatives())) {
        try {
          if (t.mode === "worker") {
            worker = await demarrerWorker(t.url);
          } else {
            executerPage = await demarrerPage(t.url);
          }
          mode = t.mode;
          tentativeReussie = t;
          changerEtat("pret");
          return true;
        } catch (e) {
          diagnostic.push(`Échec ${t.nom} : ${e.message}`);
          console.warn("[Python]", t.nom, e);
        }
      }
      changerEtat("erreur", diagnostic.join("\n"));
      return false;
    })();
    return promessePret;
  }

  function redemarrerWorker() {
    if (worker) worker.terminate();
    worker = null;
    promessePret = null;
    for (const [, attente] of enAttente) {
      clearTimeout(attente.minuteur);
      attente.resoudre({ phase: "interne", interne: "Python a redémarré", reussi: false, sortie: "", variables: [] });
    }
    enAttente.clear();
    return demarrer();
  }

  const reponseTemps = () => ({
    phase: "temps", reussi: false, sortie: "", variables: [],
    erreur: {
      type: "Temps", titre: "Programme trop long", ligne: null, texte_ligne: "",
      explication: "Ton programme ne s'arrête pas. As-tu écrit une boucle qui ne finit jamais (un `while` dont la condition reste vraie, ou une liste qui grandit pendant qu'on la parcourt) ?",
      brut: "Arrêté au bout de " + Math.round(delaiMs / 1000) + " s",
    },
  });

  async function executer(requete) {
    const ok = await demarrer();
    if (!ok) {
      return { phase: "indisponible", reussi: false, sortie: "", variables: [], interne: "Python n'a pas pu démarrer." };
    }
    const r = Object.assign({ limite_s: Math.max(2, delaiMs / 1000 - 1) }, requete);
    if (mode === "page") {
      await new Promise((ok2) => setTimeout(ok2, 30)); // laisse la page afficher « Python exécute… »
      try { return executerPage(r); } catch (e) {
        return { phase: "interne", interne: String(e.message || e), reussi: false, sortie: "", variables: [] };
      }
    }
    return new Promise((resoudre) => {
      const id = idSuivant++;
      const minuteur = setTimeout(() => {
        enAttente.delete(id);
        resoudre(reponseTemps());
        redemarrerWorker();
      }, delaiMs + 4000);
      enAttente.set(id, { resoudre, minuteur });
      worker.postMessage({ type: "executer", id, requete: r });
    });
  }

  // Texte d'aide affiché quand Python ne démarre pas.
  function aideEchec() {
    const lignes = [];
    if (fichierLocal) {
      lignes.push("Le site est ouvert directement depuis un fichier (adresse file://). Dans ce cas, Python se télécharge depuis Internet : vérifie la connexion.");
      lignes.push("Pour tester sans Internet, lance un petit serveur dans le dossier du site (`python -m http.server 8000`) puis ouvre http://localhost:8000.");
    } else {
      lignes.push("Vérifie la connexion internet, puis recharge la page. Utilise un navigateur récent (Chrome, Edge, Firefox ou Safari 15 et plus).");
      lignes.push("Si le réseau de l'établissement bloque certains fichiers (.wasm, cdn.jsdelivr.net), essaie depuis un autre réseau ou demande leur ouverture.");
    }
    return lignes;
  }

  return {
    demarrer,
    executer,
    etat: () => etat,
    mode: () => mode,
    diagnostic: () => diagnostic.slice(),
    aideEchec,
    fichierLocal,
    surEtat: (f) => { abonnes.push(f); f(etat); },
  };
})();
