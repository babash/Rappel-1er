// Exporte toutes les missions en JSON (utilisé par les tests automatiques).
const fs = require("fs");
const path = require("path");
global.window = global;
const racine = path.join(__dirname, "..", "js", "data");
for (const f of ["univers.js", "missions-principales.js", "missions-bonus.js", "memo.js"]) {
  eval(fs.readFileSync(path.join(racine, f), "utf8"));
}
const toutes = [...BNL.MISSIONS_PRINCIPALES, ...BNL.MISSIONS_BONUS];
const memoCodes = [];
for (const g of BNL.MEMO) for (const fi of g.fiches) {
  const re = /~~~\n([\s\S]*?)\n~~~/g; let m;
  while ((m = re.exec(fi.texte))) memoCodes.push({ fiche: fi.id, code: m[1] });
}
fs.writeFileSync(process.argv[2] || "/dev/stdout", JSON.stringify({ missions: toutes, memo: memoCodes }, null, 1));
