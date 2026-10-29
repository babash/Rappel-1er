// Worker (module) qui fait tourner Python grâce à Pyodide, sans bloquer la page.
// Une boucle infinie est arrêtée par le chronomètre Python, et en dernier recours
// la page supprime ce worker.

let pyodide = null;
let executerJson = null;

async function initialiser(urlPyodide, sourceHarness) {
  const { loadPyodide } = await import(urlPyodide + "pyodide.mjs");
  pyodide = await loadPyodide({ indexURL: urlPyodide });
  pyodide.FS.writeFile("/home/pyodide/harness.py", sourceHarness);
  pyodide.runPython("import sys\nsys.path.insert(0, '/home/pyodide')\nimport harness");
  executerJson = pyodide.runPython("harness.executer_json");
}

self.onmessage = async (evt) => {
  const msg = evt.data || {};
  if (msg.type === "init") {
    try {
      await initialiser(msg.urlPyodide, msg.harness);
      self.postMessage({ type: "pret", version: pyodide.version });
    } catch (e) {
      self.postMessage({ type: "echec_init", message: String((e && e.message) || e) });
    }
    return;
  }
  if (msg.type === "executer") {
    try {
      const texte = executerJson(JSON.stringify(msg.requete));
      self.postMessage({ type: "resultat", id: msg.id, resultat: JSON.parse(texte) });
    } catch (e) {
      self.postMessage({
        type: "resultat", id: msg.id,
        resultat: { phase: "interne", interne: String((e && e.message) || e), reussi: false, sortie: "", variables: [] },
      });
    }
  }
};
