// =============================================================================
//  EXPÉDITION GOMBESSA — parcours principal (environ 1 h 15)
// =============================================================================
//  Champs communs à toutes les missions :
//    id, chap, type, competence, xp, titre
//    objectif : UNE phrase courte et claire (affichée dans le cadre bleu)
//    recit    : la scène, en cases de manga (lecture obligatoire à la première visite)
//               [{ qui, texte, expr, type, fx, decor, radio }] — voir js/ui/manga.js
//    replique : la réponse du joueur à la fin de la scène { q, choix, bonne, retours, ok }
//    rappel   : { titre, texte, memo, anim } → le BRIEFING (à fermer avant de commencer)
//    avant    : (facultatif) le PLAN à expliquer avant de coder : des étapes « phrase » ou « annoter »
//    donnees  : valeurs (JavaScript) dessinées dans les étapes (cases cliquables…)
//    setup    : code Python déjà chargé (le « dossier » de la mission)
//    retenir  : à retenir (après la réussite)      apres : suite de l'histoire (cases de manga)
//
//  Types d'activité :
//    "etapes"   : une suite de petites étapes. Chaque étape a un type :
//                 choix (qcm), case (toucher une case d'une liste / d'un dictionnaire / d'une grille),
//                 ligne (toucher une ligne de code), saisie (réponse courte), associer (relier par des traits),
//                 trous (code à trous, avec des étiquettes), phrase (phrase à compléter avec des étiquettes),
//                 annoter (dire ce que fait chaque ligne marquée), emplacement (où arrive un élément).
//    "commande" : console Python, une commande à la fois  → commandes: [{ consigne, check, solution, indice, reponse }]
//    "parsons"  : remettre des lignes dans l'ordre (et les décaler) → parsons: { lignes, distracteurs }, check
//    "trace"    : tableau d'avancement à remplir → code, trace
//    "code"     : programme à écrire / compléter / corriger → consigne, starter, check, solution, indices
//
//  Dans les textes : **gras**, @code@, listes « - », et blocs de code entre deux lignes ~~~
//  Les vérificateurs Python (check) utilisent les outils de js/core/harness.py :
//    echec(msg), verifie(cond, msg), var(nom, type), lignes, sortie, utilise(regex), D (dossier neuf)…
// =============================================================================
window.BNL = window.BNL || {};
(() => {
const R = String.raw;
const CASIERS = ["lampe", "caméra", "sonar", "pince", "carnet", "boussole", "câble", "filet"];

BNL.MISSIONS_PRINCIPALES = [
// ============================ CHAPITRE 1 : LE HANGAR ===========================
{
  id: "m01", chap: "p0", type: "etapes", competence: "reperer", xp: 60,
  titre: "Les casiers du hangar",
  objectif: "Trouve des éléments de la liste @casiers@ grâce à leur indice.",
  recit: [
    { qui: "narration", decor: "hangar", texte: "Avant de s'enfuir, le drone a fouillé les **8 casiers** du hangar." },
    { qui: "bolt", expr: "colere", texte: "Mes casiers ! Il a pris quoi, ce drone ?" },
    { qui: "luci", texte: "Inventaire chargé dans la liste @casiers@. Rappel : je compte à partir de **0**. Le premier casier a l'indice 0." },
    { qui: "cap", expr: "serieux", texte: "Recrue, vérifie l'inventaire avec LUCI. Casier par casier." },
  ],
  replique: {
    q: "Comment LUCI numérote-t-elle les casiers ?",
    choix: ["À partir de 0 : le premier casier a l'indice 0.", "À partir de 1 : le premier casier a l'indice 1."],
    bonne: 0,
    retours: { 1: { qui: "luci", expr: "serieux", texte: "Négatif. En Python, le premier indice est **0**. Ce n'est pas négociable." } },
    ok: { qui: "luci", expr: "sourire", texte: "Correct. On commence l'inventaire." },
  },
  rappel: {
    titre: "Une liste et ses indices",
    texte: R`Une **liste** range des éléments dans un ordre précis, entre crochets @[ ]@.
Chaque élément a un numéro de place : son **indice**.

::liste casiers ["lampe", "caméra", "sonar", "pince", "carnet", "boussole", "câble", "filet"]

- ⚠️ Le premier élément a l'indice **0**.
- L'indice **-1** désigne le dernier élément.
- @len(casiers)@ donne le nombre d'éléments.`,
    memo: "listes-indices",
  },
  donnees: { casiers: CASIERS },
  setup: R`casiers = ["lampe", "caméra", "sonar", "pince", "carnet", "boussole", "câble", "filet"]`,
  etapes: [
    { type: "phrase", q: "Pour commencer, décris la variable @casiers@.",
      phrase: "@casiers@ est une {{0}} : ses éléments sont rangés dans un {{1}} précis, entre {{2}}.",
      trous: [
        { choix: ["liste", "dictionnaire"], bonne: 0, aide: "Des éléments numérotés, entre crochets : c'est une **liste**." },
        { choix: ["ordre", "désordre"], bonne: 0, aide: "Dans une liste, chaque élément a une place : l'ordre compte." },
        { choix: ["crochets @[ ]@", "accolades @{ }@"], bonne: 0, aide: "Regarde le briefing : une liste s'écrit entre **crochets**." },
      ],
      expl: "Une **liste** range ses éléments dans un ordre précis, entre crochets. Chaque élément a un numéro : son **indice**." },
    { type: "case", donnee: "casiers", q: "Touche la case @casiers[0]@.", bonne: 0,
      expl: "@casiers[0]@ vaut @\"lampe\"@ : c'est le **premier** élément.",
      pieges: { 1: "Tu as touché l'indice 1. Le premier élément a l'indice **0**." },
      aide: "Regarde les petits numéros au-dessus des cases : ce sont les indices." },
    { type: "case", donnee: "casiers", q: "Touche la case @casiers[3]@.", bonne: 3,
      expl: "@casiers[3]@ vaut @\"pince\"@.",
      pieges: { 2: "Ça, c'est @casiers[2]@. Compte depuis 0 : 0, 1, 2, **3**.", 4: "Tu as compté à partir de 1. Recommence en partant de 0." },
      aide: "Compte les cases en commençant à 0 : lampe 0, caméra 1…" },
    { type: "case", donnee: "casiers", q: "Touche la case @casiers[-1]@.", bonne: 7,
      expl: "L'indice @-1@ désigne le **dernier** élément : @\"filet\"@.",
      pieges: { 0: "Ça, c'est @casiers[0]@, le premier. Avec @-1@, on compte depuis la **fin**.", 6: "Presque ! @-1@ est le tout dernier ; celui-ci, c'est @-2@." },
      aide: "Sous chaque case, le petit nombre gris est l'indice négatif." },
    { type: "choix", q: "Que vaut @len(casiers)@ ?",
      choix: ["7", "8", "9"], bonne: 1,
      expl: "Il y a **8** éléments. Le dernier indice est donc 7 (on commence à 0).",
      pieges: { 0: "7 est le **dernier indice**. Mais il y a 8 éléments : de l'indice 0 à l'indice 7.", 2: "Compte les cases une par une." } },
    { type: "saisie", q: "À quel indice se trouve @\"boussole\"@ ? Écris seulement le nombre.", montrer: "casiers",
      rep: ["5"], placeholder: "un nombre",
      expl: "@\"boussole\"@ est à l'indice **5**, donc @casiers[5]@ vaut @\"boussole\"@.",
      pieges: { 6: "Tu as compté à partir de 1. En Python, on part de **0**." },
      aide: "Compte depuis 0 : lampe 0, caméra 1, sonar 2, pince 3…" },
    { type: "choix", q: "Le drone a demandé @casiers[8]@. Que s'est-il passé ?",
      choix: ["Python a répondu @\"filet\"@", "Python s'est arrêté avec l'erreur @IndexError@", "Python a répondu @\"lampe\"@"], bonne: 1,
      expl: "Les indices vont de 0 à 7. L'indice 8 n'existe pas : Python s'arrête avec @IndexError: list index out of range@.",
      pieges: { 0: "@\"filet\"@ est à l'indice 7 : c'est le dernier.", 2: "Python ne revient pas au début : l'indice 8 n'existe pas." } },
  ],
  retenir: R`- @liste[0]@ est le premier élément, @liste[-1]@ le dernier.
- @len(liste)@ donne le nombre d'éléments. Le dernier indice vaut @len(liste) - 1@.
- Un indice qui n'existe pas provoque l'erreur @IndexError@.`,
  apres: [
    { qui: "luci", texte: "Le drone a demandé @casiers[8]@. Réponse de Python : **IndexError**. Il est reparti les mains vides." },
    { qui: "bolt", expr: "rire", texte: "Ha ! Battu par un indice qui n'existe pas !" },
  ],
},
// -----------------------------------------------------------------------------
{
  id: "m02", chap: "p0", type: "commande", competence: "ecrire", xp: 80,
  titre: "Réveiller LUCI",
  objectif: "Tape des commandes Python pour allumer les systèmes du sous-marin.",
  recit: [
    { qui: "narration", decor: "hangar", texte: "Minuit. La Luciole est éteinte. Pour l'allumer, il faut parler à LUCI en Python, **une commande à la fois**." },
    { qui: "luci", expr: "serieux", texte: "Console prête. Tape une commande, puis appuie sur **Entrée**. Je réponds juste en dessous." },
    { qui: "cap", texte: "Allume tous les systèmes. On part à l'aube : Abyssal a déjà de l'avance." },
  ],
  replique: {
    q: "Comment parle-t-on à LUCI, maintenant ?",
    choix: ["On tape une commande Python, puis on appuie sur Entrée.", "On lui explique en français.", "On redémarre l'ordinateur."],
    bonne: 0,
    retours: {
      1: { qui: "bolt", expr: "sueur", texte: "J'ai essayé. Elle m'a répondu « SyntaxError ». Deux fois." },
      2: { qui: "luci", expr: "colere", texte: "Me redémarrer ? Essaie seulement." },
    },
    ok: { qui: "luci", texte: "J'attends ta première commande." },
  },
  rappel: {
    titre: "La console Python",
    texte: R`Dans une **console**, on tape une instruction, on appuie sur **Entrée**, et Python répond tout de suite.
~~~
>>> outils = ["pince", "lampe"]
>>> outils[0]
'pince'
>>> len(outils)
2
>>> outils.append("filet")
>>> outils[1] = "phare"
>>> outils
['pince', 'phare', 'filet']
~~~
- @liste.append(x)@ ajoute x **à la fin** de la liste.
- @liste[i] = x@ **remplace** l'élément d'indice i.`,
    memo: "listes-modifier",
  },
  setup: R`systemes = ["moteur", "lumières", "oxygène", "sonar", "radio"]`,
  commandes: [
    { consigne: "Affiche la liste des systèmes : tape @systemes@ puis appuie sur Entrée.",
      check: R`verifie(compact(commande) == "systemes", "Tape seulement le nom de la variable : @systemes@ (sans accent).")`,
      solution: "systemes", indice: "Écris le nom de la variable, sans guillemets : @systemes@.",
      reponse: "5 systèmes détectés. Tous éteints." },
    { consigne: "Affiche le **premier** système, avec son indice.",
      check: R`
verifie(utilise(r"systemes\s*\["), "Utilise un indice entre crochets : @systemes[...]@.")
verifie(resultat == "moteur", "Ce n'est pas le premier système. Le premier élément a l'indice **0**.")`,
      solution: "systemes[0]", indice: "Le premier élément a l'indice 0 : @systemes[0]@.",
      reponse: "Moteur : allumé. Vrrrrr." },
    { consigne: "Affiche le **dernier** système avec l'indice @-1@.",
      check: R`
verifie(utilise(r"systemes\s*\["), "Utilise un indice entre crochets : @systemes[...]@.")
if resultat == "radio" and not utilise(r"\[\s*-\s*1\s*\]"):
    echec("C'est bien \"radio\" ! Mais la consigne demande l'indice @-1@ : il marche quelle que soit la longueur de la liste.")
verifie(resultat == "radio", "Ce n'est pas le dernier système. L'indice @-1@ désigne le dernier élément.")`,
      solution: "systemes[-1]", indice: "Mets @-1@ entre les crochets : @systemes[-1]@.",
      reponse: "Radio : allumée. Krrrsh… Personne ne répond. Tant mieux." },
    { consigne: "Combien y a-t-il de systèmes ? Utilise la fonction @len@.",
      check: R`
verifie(utilise(r"\blen\s*\("), "Utilise la fonction @len(...)@ : elle compte les éléments.")
verifie(resultat == 5, "Il faut compter les éléments de la liste @systemes@ : @len(systemes)@.")`,
      solution: "len(systemes)", indice: "@len@ s'écrit avec des parenthèses : @len(systemes)@.",
      reponse: "5 systèmes. Exact." },
    { consigne: "Ajoute @\"caméra\"@ à la **fin** de la liste avec @append@.",
      check: R`
s = var("systemes", list)
verifie(utilise(r"\.append\s*\("), "Utilise la méthode @append@ : @systemes.append(...)@.")
verifie(len(s) == 6, "La liste devrait contenir 6 systèmes après l'ajout.")
if s[-1] in ("caméra", "camera"):
    succes("Caméra ajoutée.")
elif s[-1] == "Caméra":
    succes("Caméra ajoutée.")
else:
    echec("Le dernier élément vaut %s. Ajoute le texte @\"caméra\"@ (entre guillemets)." % montre(s[-1]))`,
      solution: "systemes.append(\"caméra\")", indice: "La méthode s'écrit après un point : @systemes.append(\"caméra\")@.",
      reponse: "Caméra branchée. Je vois… un poulpe dans la soute ?" },
    { consigne: "Les lumières sont en panne. Remplace @\"lumières\"@ (indice 1) par @\"phares\"@.",
      check: R`
s = var("systemes", list)
verifie(len(s) == 6, "La liste doit garder 6 éléments : on **remplace** un élément, on n'en ajoute pas.")
verifie(utilise(r"systemes\s*\[\s*1\s*\]\s*="), "Remplace l'élément d'indice 1 avec @systemes[1] = ...@.")
verifie(s[1] == "phares", "@systemes[1]@ vaut %s au lieu de @\"phares\"@." % montre(s[1]))`,
      solution: "systemes[1] = \"phares\"", indice: "On remplace avec un @=@ : @systemes[1] = \"phares\"@.",
      reponse: "Phares : allumés. Je vois tout." },
    { consigne: "Vérifie le résultat : affiche toute la liste @systemes@.",
      check: R`
verifie(compact(commande) == "systemes", "Tape seulement @systemes@.")
verifie(isinstance(resultat, list) and len(resultat) == 6, "La liste devrait contenir 6 systèmes.")`,
      solution: "systemes", indice: "Comme au début : @systemes@.",
      reponse: "Tous les systèmes sont en ligne. [0 erreur]" },
  ],
  retenir: R`- On lit un élément avec son indice : @systemes[0]@, @systemes[-1]@.
- @len(systemes)@ compte les éléments.
- @systemes.append(x)@ ajoute x à la fin ; @systemes[1] = x@ remplace l'élément d'indice 1.`,
  apres: [
    { qui: "luci", expr: "sourire", texte: "Systèmes en ligne. Merci, Recrue. Ta syntaxe est… acceptable." },
    { qui: "bolt", expr: "rire", texte: "« Acceptable » ! Elle ne m'a jamais dit ça, à moi." },
  ],
},
// -----------------------------------------------------------------------------
{
  id: "m03", chap: "p0", type: "etapes", competence: "comprendre", xp: 70,
  titre: "Le chargement de la soute",
  objectif: "Prévois ce que devient la liste @soute@ après chaque instruction.",
  recit: [
    { qui: "narration", decor: "hangar", texte: "5 h du matin. Bolt charge la soute. LUCI note chaque geste dans la liste @soute@." },
    { qui: "bolt", texte: "Je charge, tu suis. Dis-moi où atterrit chaque objet dans la liste." },
    { qui: "luci", texte: "Chaque instruction **modifie** la liste. Je les exécute dans l'ordre, de haut en bas." },
  ],
  replique: {
    q: "Quel est ton rôle pendant le chargement ?",
    choix: ["Prévoir ce que devient la liste après chaque instruction.", "Porter les caisses avec Bolt.", "Recopier la liste à la main."],
    bonne: 0,
    retours: {
      1: { qui: "bolt", expr: "rire", texte: "Avec ces bras ? Laisse, je m'en occupe. Toi, tu suis la liste." },
      2: { qui: "luci", expr: "serieux", texte: "Inutile. Je la tiens à jour. Toi, tu dois **prévoir** ce qu'elle devient." },
    },
  },
  rappel: {
    titre: "Modifier une liste",
    texte: R`| Instruction | Effet |
|---|---|
| @liste.append(x)@ | ajoute x **à la fin** |
| @liste.insert(i, x)@ | insère x **à l'indice i** (les suivants se décalent) |
| @liste.pop()@ | retire le **dernier** élément |
| @liste.pop(i)@ | retire l'élément d'indice i |
| @liste.remove(x)@ | retire la valeur x |
| @liste[i] = x@ | remplace l'élément d'indice i |`,
    memo: "listes-modifier",
  },
  etapes: [
    { type: "emplacement", nom: "soute", q: "Bolt exécute @soute.append(\"bouée\")@. Où arrive @\"bouée\"@ ?",
      code: R`soute.append("bouée")`, liste: ["eau", "corde"], valeur: "bouée", bonne: 2,
      expl: "@append@ ajoute l'élément **à la fin** de la liste.",
      pieges: { 0: "@append@ n'ajoute pas au début : il ajoute **à la fin**.", 1: "@append@ ajoute toujours **à la fin**, après le dernier élément." },
      resultat: ["eau", "corde", "bouée"] },
    { type: "emplacement", nom: "soute", q: "Puis @soute.insert(0, \"trousse\")@. Où arrive @\"trousse\"@ ?",
      code: R`soute.insert(0, "trousse")`, liste: ["eau", "corde", "bouée"], valeur: "trousse", bonne: 0,
      expl: "@insert(0, x)@ place x à l'indice 0 : **au début**. Les autres éléments se décalent.",
      pieges: { 3: "@insert(0, ...)@ ne met pas à la fin : le 0 est l'**indice** où on insère.", 1: "Ici, x arriverait à l'indice 1. Le premier nombre dans @insert(0, ...)@ est l'indice : 0." },
      resultat: ["trousse", "eau", "corde", "bouée"] },
    { type: "case", nom: "soute", q: "Puis @soute.pop()@. Touche l'élément qui **sort** de la liste.",
      code: R`soute.pop()`, valeur: ["trousse", "eau", "corde", "bouée"], bonne: 3,
      expl: "@pop()@ sans indice retire le **dernier** élément : @\"bouée\"@ s'en va.",
      pieges: { 0: "@pop()@ sans indice ne retire pas le premier : il retire le **dernier**." },
      resultat: ["trousse", "eau", "corde"] },
    { type: "case", nom: "soute", q: "Puis @soute.remove(\"eau\")@. Touche l'élément qui sort.",
      code: R`soute.remove("eau")`, valeur: ["trousse", "eau", "corde"], bonne: 1,
      expl: "@remove(\"eau\")@ cherche la **valeur** @\"eau\"@ et la retire.",
      pieges: { 0: "@remove@ retire la **valeur** donnée entre parenthèses : ici @\"eau\"@.", 2: "@remove@ retire la **valeur** donnée entre parenthèses : ici @\"eau\"@." },
      resultat: ["trousse", "corde"] },
    { type: "case", nom: "soute", q: "Enfin @soute[1] = \"filet\"@. Touche la case qui **change**.",
      code: R`soute[1] = "filet"`, valeur: ["trousse", "corde"], bonne: 1,
      expl: "@soute[1] = \"filet\"@ **remplace** l'élément d'indice 1 (@\"corde\"@). La longueur ne change pas.",
      pieges: { 0: "L'indice 1 est la **deuxième** case, pas la première." },
      resultat: ["trousse", "filet"] },
    { type: "associer", q: "Relie chaque instruction à son effet.",
      gauche: ["@soute.append(x)@", "@soute.insert(0, x)@", "@soute.pop()@", "@soute.remove(x)@", "@soute[1] = x@"],
      droite: ["ajoute x à la fin", "ajoute x au début", "retire le dernier élément", "retire la valeur x", "remplace l'élément d'indice 1"],
      bonnes: [0, 1, 2, 3, 4],
      expl: "Tu sais maintenant dire ce que fait chaque instruction.",
      aide: "Repense aux étapes que tu viens de faire : chaque instruction y était." },
    { type: "trous", q: "Complète l'instruction pour ajouter @\"carte\"@ **à la fin** de la soute.",
      code: "soute.{{0}}(\"carte\")",
      trous: [{ choix: ["append", "add", "push", "insert"], bonne: 0, aide: "Les listes Python n'ont ni @add@ ni @push@. Et @insert@ demande un indice." }],
      expl: "@soute.append(\"carte\")@ ajoute @\"carte\"@ à la fin." },
  ],
  retenir: R`- @append@ ajoute à la fin, @insert(i, x)@ insère à l'indice i.
- @pop()@ retire le dernier élément ; @remove(x)@ retire la valeur x.
- @liste[i] = x@ remplace : la longueur ne change pas.`,
  apres: [
    { qui: "cap", expr: "serieux", texte: "Soute verrouillée. On plonge." },
    { qui: "narration", decor: "duo", fx: "SPLASH !", texte: "La Luciole s'enfonce dans le lagon. Au loin, une ombre noire la suit : le **Léviathan**." },
  ],
},
// ============================ CHAPITRE 2 : L'HERBIER ===========================
{
  id: "m04", chap: "p1", type: "code", competence: "completer", xp: 100,
  titre: "Les traces du dugong",
  objectif: "Complète le programme pour additionner tous les nombres de la liste @traces@.",
  recit: [
    { qui: "narration", decor: "espece:dugong", texte: "−3 m. L'herbier. Dans le sable, de longs sillons : un **dugong** est venu brouter ici." },
    { qui: "nour", expr: "sourire", texte: "Il en reste moins de 10 dans le lagon. Si on sait où il mange, on saura quelle zone laisser tranquille." },
    { qui: "luci", texte: "Traces comptées dans 6 zones : liste @traces@. Il manque le **total**. Mon programme a des trous." },
    { qui: "vex", expr: "malin", radio: true, texte: "Vous comptez des traces de vache marine ? Le Léviathan a déjà 3 km d'avance." },
    { qui: "cap", expr: "serieux", texte: "Ignore-le. Complète le programme de LUCI." },
  ],
  replique: {
    q: "Que veut savoir Nour ?",
    choix: ["Le total des traces des 6 zones.", "Le nombre de zones.", "La zone qui a le plus de traces."],
    bonne: 0,
    retours: {
      1: { qui: "nour", expr: "sueur", texte: "Le nombre de zones ? Ça, c'est 6. Je veux le total des **traces**." },
      2: { qui: "nour", texte: "Ça viendra plus tard. Pour l'instant : le **total** des traces." },
    },
  },
  rappel: {
    titre: "Additionner avec une boucle for",
    texte: R`~~~
notes = [12, 15, 9]
somme = 0                 # on part de 0
for n in notes:           # n prend chaque valeur : 12, puis 15, puis 9
    somme = somme + n     # on ajoute n à la somme
print(somme)              # 36
~~~
- Les lignes **décalées** sous le @for@ sont répétées pour chaque élément.
- La variable @somme@ grandit à chaque tour : 0 → 12 → 27 → 36. On l'appelle un **accumulateur**.`,
    memo: "algo-somme",
  },
  avant: [
    { type: "phrase", q: "Explique ta méthode avant de coder.",
      phrase: "Pour faire un total, je pars de {{0}}. Je parcours la liste {{1}}. À chaque tour, {{2}} l'élément au total.",
      trous: [
        { choix: ["0", "la dernière valeur", "6"], bonne: 0, aide: "Avant d'avoir additionné quoi que ce soit, le total vaut **0**." },
        { choix: ["élément par élément", "seulement au début", "en sautant un élément sur deux"], bonne: 0, aide: "Pour un total, il faut **tous** les éléments, un par un." },
        { choix: ["j'ajoute", "je remplace", "je compare"], bonne: 0, aide: "Le total grandit : on **ajoute**." },
      ],
      expl: "C'est l'algorithme de la **somme** : un accumulateur qui part de 0 et grandit à chaque tour." },
  ],
  consigne: R`1. La boucle doit parcourir la liste @traces@.
2. À chaque tour, ajoute @nb@ au @total@.`,
  setup: R`traces = [4, 0, 7, 2, 5, 3]`,
  starter: R`total = 0
for nb in ___:
    total = total + ___
print("Nombre de traces :", total)
`,
  check: R`
if re.search(r"\b21\b", code_sc):
    echec("N'écris pas le résultat toi-même : c'est la boucle qui doit le calculer.")
if not utilise(r"\bfor\b"):
    echec("Garde la boucle @for@ : elle parcourt la liste.")
t = var("total")
if t == 0:
    echec("@total@ vaut encore 0. Dans la boucle, ajoute @nb@ : @total = total + nb@.")
if t == 6:
    echec("@total@ vaut 6 : tu as compté les zones (+ 1 à chaque tour). Il faut ajouter le **nombre** de traces : @nb@.")
if t == 3:
    echec("@total@ vaut 3 : c'est seulement la dernière valeur. Il faut **ajouter** à chaque tour : @total = total + nb@.")
if t != 21:
    echec("@total@ vaut %s au lieu de 21. Vérifie les deux trous." % montre(t))
if not lignes or "21" not in lignes[-1]:
    echec("Garde la ligne @print@ pour afficher le total.")
`,
  indices: [
    "Le premier trou : le nom de la liste à parcourir. Regarde les données de LUCI.",
    "À chaque tour, @nb@ contient le nombre de traces d'une zone. C'est lui qu'on ajoute.",
    "Les deux trous : @traces@ puis @nb@.",
  ],
  solution: R`total = 0
for nb in traces:
    total = total + nb
print("Nombre de traces :", total)
`,
  retenir: R`Pour additionner : on part de @total = 0@, puis on ajoute chaque élément dans la boucle : @total = total + nb@. Python a aussi la fonction @sum(traces)@, mais il faut savoir écrire la boucle : c'est la base de tous les algorithmes.`,
  apres: [
    { qui: "luci", ecran: true, sortie: true, texte: "Sortie de ton programme :" },
    { qui: "nour", expr: "sourire", texte: "21 traces. Je marque la zone : on n'y passera pas avec les moteurs." },
    { qui: "bolt", expr: "sueur", texte: "Pendant ce temps, le Léviathan file vers la passe…" },
  ],
},
// -----------------------------------------------------------------------------
{
  id: "m05", chap: "p1", type: "etapes", competence: "expliquer", xp: 80,
  titre: "Bolt contre LUCI",
  objectif: "Explique la différence entre parcourir les éléments et parcourir les indices.",
  recit: [
    { qui: "narration", decor: "luciole", texte: "Le Léviathan prend de l'avance. Dans la Luciole, ça se dispute." },
    { qui: "bolt", expr: "colere", texte: "Pour parcourir une liste, je prends les **éléments**, un par un. Direct !" },
    { qui: "luci", expr: "serieux", texte: "Je parcours les **indices**. Comme ça, je sais **où** je suis dans la liste." },
    { qui: "nour", expr: "sueur", texte: "Vous avez raison tous les deux… Recrue, explique-leur la différence. Vite." },
  ],
  replique: {
    q: "Qu'est-ce qu'on attend de toi ?",
    choix: ["Expliquer ce que donne chaque façon de parcourir la liste.", "Dire qui a gagné la dispute."],
    bonne: 0,
    retours: { 1: { qui: "cap", expr: "serieux", texte: "Pas de gagnant à bord. Je veux une **explication**." } },
  },
  rappel: {
    titre: "Parcourir une liste",
    texte: R`~~~
herbes = ["courte", "longue", "broutée"]

for h in herbes:               # parcours par VALEUR : h = chaque élément
    print(h)                   # courte, longue, broutée

for i in range(len(herbes)):   # parcours par INDICE : i = 0, 1, 2
    print(i, herbes[i])        # 0 courte, 1 longue, 2 broutée
~~~
- @range(3)@ donne 0, 1, 2 : il commence à 0 et s'arrête **avant** 3.
- @herbes[i]@ est l'élément qui se trouve à l'indice @i@.`,
    memo: "listes-parcours",
  },
  donnees: { herbes: ["courte", "longue", "broutée"] },
  etapes: [
    { type: "annoter", q: "Bolt et LUCI ont chacun écrit une boucle. Dis comment chacune parcourt la liste.",
      code: R`for h in herbes:
    print(h)
for i in range(len(herbes)):
    print(i, herbes[i])`,
      etiquettes: ["parcours par valeur (les éléments)", "parcours par indice (les positions)", "parcours des clés d'un dictionnaire"],
      notes: [
        { ligne: 1, bonne: 0, aide: "@h@ prend directement les éléments : c'est un parcours par **valeur**." },
        { ligne: 3, bonne: 1, aide: "Avec @range(len(...))@, la variable prend 0, 1, 2 : ce sont des **indices**." },
      ],
      expl: "La boucle de Bolt parcourt les **valeurs** ; celle de LUCI parcourt les **indices**." },
    { type: "case", donnee: "herbes", q: "Dans la boucle de Bolt, que vaut @h@ au **premier** tour ? Touche la case.",
      code: R`for h in herbes:
    print(h)`, bonne: 0,
      expl: "@h@ prend directement les **éléments** : d'abord @\"courte\"@, puis @\"longue\"@, puis @\"broutée\"@.",
      pieges: { 1: "C'est la valeur du **deuxième** tour.", 2: "C'est la valeur du **dernier** tour." } },
    { type: "choix", q: "Qu'affiche la boucle de LUCI, si on écrit seulement @print(i)@ ?", montrer: "herbes",
      code: R`for i in range(len(herbes)):
    print(i)`,
      choix: ["@0@, @1@, @2@ (une valeur par ligne)", "@courte@, @longue@, @broutée@", "@1@, @2@, @3@"], bonne: 0,
      expl: "@len(herbes)@ vaut 3, donc @range(3)@ donne 0, 1, 2 : ce sont les **indices**.",
      pieges: { 1: "On affiche @i@, pas @herbes[i]@ : ce sont des nombres.", 2: "@range@ commence à **0** et s'arrête **avant** 3." } },
    { type: "associer", q: "Relie chaque boucle à ce qu'elle affiche.",
      gauche: ["@for h in herbes: print(h)@", "@for i in range(len(herbes)): print(i)@", "@for i in range(len(herbes)): print(i, herbes[i])@"],
      droite: ["les éléments : courte, longue, broutée", "les indices : 0, 1, 2", "les indices et les éléments : 0 courte, 1 longue…"],
      bonnes: [0, 1, 2],
      expl: "Avec @for h in herbes@, on a les éléments. Avec @range(len(...))@, on a les indices, et @herbes[i]@ redonne l'élément.",
      aide: "Cherche d'abord les boucles qui ont @range@ : elles donnent des indices." },
    { type: "phrase", q: "Explique @herbes[i]@ avec tes mots.",
      phrase: "Dans @herbes[i]@, @i@ est {{0}}, et @herbes[i]@ est {{1}}.",
      trous: [
        { choix: ["l'indice (la position)", "l'élément (la valeur)", "la longueur de la liste"], bonne: 0, aide: "@i@ est un numéro de place : un **indice**." },
        { choix: ["l'élément qui se trouve à cette position", "l'indice de l'élément", "le nombre d'éléments"], bonne: 0, aide: "Avec les crochets, on va **chercher l'élément** rangé à cette place." },
      ],
      expl: "@i@ est une position ; @herbes[i]@ est ce qu'on trouve à cette position." },
    { type: "choix", q: "Bolt veut **remplacer** chaque élément par @\"mangée\"@. Quelle boucle doit-il utiliser ?",
      choix: ["@for i in range(len(herbes)):@ puis @herbes[i] = \"mangée\"@", "@for h in herbes:@ puis @h = \"mangée\"@", "Les deux marchent"], bonne: 0,
      expl: "Pour **modifier** une liste, il faut savoir **où** écrire : il faut l'indice. @h = \"mangée\"@ change seulement la variable @h@, pas la liste.",
      pieges: { 1: "@h = \"mangée\"@ change la variable @h@, mais la liste reste la même. Il faut écrire dans la liste : @herbes[i] = ...@.", 2: "Seule la boucle avec les indices modifie vraiment la liste." } },
    { type: "trous", q: "Complète pour afficher chaque herbe avec son indice.",
      code: "for i in range({{0}}):\n    print(i, herbes[{{1}}])",
      trous: [
        { choix: ["len(herbes)", "herbes", "3 + 1"], bonne: 0, aide: "@range@ a besoin d'un **nombre** : le nombre d'éléments de la liste." },
        { choix: ["i", "h", "len(herbes)"], bonne: 0, aide: "Entre les crochets, on met l'indice du tour : la variable de la boucle." },
      ],
      expl: "@range(len(herbes))@ donne les indices, et @herbes[i]@ l'élément correspondant." },
  ],
  retenir: R`- @for x in liste:@ → **parcours par valeur** : x prend chaque élément. Simple et lisible.
- @for i in range(len(liste)):@ → **parcours par indice** : i prend chaque position. Indispensable pour **modifier** la liste ou connaître la **position**.`,
  apres: [
    { qui: "bolt", expr: "sueur", texte: "Bon. Les valeurs pour lire, les indices pour savoir où on est et pour modifier. J'avoue." },
    { qui: "luci", expr: "sourire", texte: "Enregistré : « Bolt avoue ». Je garde ce fichier pour toujours." },
  ],
},
// ============================ CHAPITRE 3 : LE RÉCIF ============================
{
  id: "m06", chap: "p2", type: "commande", competence: "ecrire", xp: 90,
  titre: "La fiche du nudibranche",
  objectif: "Lis et complète la fiche du nudibranche avec des commandes.",
  recit: [
    { qui: "narration", decor: "espece:nudibranche", texte: "−12 m. Le récif. Sur une éponge, une petite limace violette bordée d'orange." },
    { qui: "nour", expr: "rire", texte: "Un **nudibranche** ! Ses couleurs disent aux prédateurs : « je suis toxique »." },
    { qui: "luci", texte: "Je crée sa fiche : un **dictionnaire**. Chaque information a un nom, la **clé**, et une **valeur**." },
    { qui: "nour", expr: "serieux", texte: "Abyssal en vend à des collectionneurs. Je veux une fiche **exacte** : couleur, taille, lieu." },
  ],
  replique: {
    q: "Avec quoi vas-tu travailler ?",
    choix: ["Un dictionnaire : chaque valeur a une clé.", "Une liste : chaque valeur a un indice."],
    bonne: 0,
    retours: { 1: { qui: "luci", expr: "serieux", texte: "Négatif. Pas d'indices dans une fiche : des **clés**." } },
  },
  rappel: {
    titre: "Un dictionnaire",
    texte: R`Un **dictionnaire** associe des **clés** à des **valeurs**, entre accolades @{ }@.

::dico fiche {"nom": "nudibranche", "couleur": "violet", "taille_cm": 4, "toxique": true}

~~~
fiche["couleur"]          # lire une valeur : 'violet'
fiche["taille_cm"] = 5    # modifier une valeur
fiche["lieu"] = "récif"   # ajouter une clé
"nom" in fiche            # True : la clé existe
len(fiche)                # nombre de paires (clé, valeur)
~~~
⚠️ Ici, les clés sont des textes : n'oublie pas les **guillemets**.`,
    memo: "dicos-acces",
  },
  avant: [
    { type: "phrase", q: "Décris la variable @fiche@ avant de l'utiliser.",
      phrase: "@fiche@ est un {{0}}. Chaque information a une {{1}} (son nom) et une {{2}}. Pour lire la couleur, j'écris {{3}}.",
      trous: [
        { choix: ["dictionnaire", "liste", "tuple"], bonne: 0, aide: "Des paires @clé: valeur@ entre accolades : c'est un **dictionnaire**." },
        { choix: ["clé", "case", "ligne"], bonne: 0, aide: "Le nom d'une information dans un dictionnaire s'appelle une **clé**." },
        { choix: ["valeur", "position", "longueur"], bonne: 0, aide: "Chaque clé est associée à une **valeur**." },
        { choix: ["@fiche[\"couleur\"]@", "@fiche[1]@", "@fiche.couleur@"], bonne: 0, aide: "On lit une valeur avec sa **clé** entre crochets (et entre guillemets si c'est un texte)." },
      ],
      expl: "Un **dictionnaire** associe des **clés** à des **valeurs**. On lit une valeur avec sa clé : @fiche[\"couleur\"]@." },
  ],
  setup: R`fiche = {"nom": "nudibranche", "couleur": "violet", "taille_cm": 4, "toxique": True}`,
  commandes: [
    { consigne: "Affiche la fiche : tape @fiche@.",
      check: R`verifie(compact(commande) == "fiche", "Tape seulement le nom du dictionnaire : @fiche@.")`,
      solution: "fiche", indice: "Tape @fiche@ puis Entrée.", reponse: "Fiche ouverte : 4 informations." },
    { consigne: "Affiche la **couleur** du nudibranche.",
      check: R`
verifie(utilise(r"fiche\s*\["), "Lis la valeur avec des crochets : @fiche[\"...\"]@.")
verifie(resultat == "violet", "Ce n'est pas la couleur. La clé à utiliser est @\"couleur\"@.")`,
      solution: "fiche[\"couleur\"]", indice: "On lit une valeur avec sa clé entre crochets et guillemets : @fiche[\"couleur\"]@.",
      reponse: "Violet, avec une bordure orange." },
    { consigne: "Nouvelle mesure : il mesure **5** cm. Change la valeur de la clé @\"taille_cm\"@.",
      check: R`
f = var("fiche", dict)
nouvelles = [k for k in f if k not in D["fiche"]]
if nouvelles:
    echec("Tu as créé une nouvelle clé %s ! Vérifie l'orthographe : la clé s'écrit @\"taille_cm\"@." % montre(nouvelles[0]))
verifie(f["taille_cm"] == 5, "@fiche[\"taille_cm\"]@ vaut %s au lieu de 5." % montre(f["taille_cm"]))`,
      solution: "fiche[\"taille_cm\"] = 5", indice: "Comme pour une liste, on remplace avec @=@ : @fiche[\"taille_cm\"] = 5@.",
      reponse: "Taille mise à jour : 5 cm." },
    { consigne: "Ajoute une clé @\"lieu\"@ avec la valeur @\"récif\"@.",
      check: R`
f = var("fiche", dict)
verifie("lieu" in f, "La fiche n'a pas de clé @\"lieu\"@. On ajoute une clé comme on modifie : @fiche[\"lieu\"] = \"récif\"@.")
verifie(f["lieu"] in ("récif", "recif"), "La clé @\"lieu\"@ vaut %s au lieu de @\"récif\"@." % montre(f["lieu"]))`,
      solution: "fiche[\"lieu\"] = \"récif\"", indice: "Si la clé n'existe pas, @fiche[\"lieu\"] = \"récif\"@ la crée.",
      reponse: "Nouvelle information enregistrée." },
    { consigne: "La fiche a-t-elle une clé @\"poids\"@ ? Pose la question avec le mot @in@.",
      check: R`
verifie(utilise(r"\bin\b"), "Utilise le mot @in@ : @\"poids\" in fiche@.")
verifie(resultat is False, "La réponse attendue est @True@ ou @False@ : écris @\"poids\" in fiche@.")`,
      solution: "\"poids\" in fiche", indice: "La question s'écrit : @\"poids\" in fiche@.",
      reponse: "False : pas de poids dans la fiche. Je ne pèse pas les nudibranches." },
    { consigne: "Combien d'informations (de paires) contient la fiche maintenant ?",
      check: R`
verifie(utilise(r"\blen\s*\("), "Utilise la fonction @len@.")
verifie(resultat == 5, "Compte les paires du dictionnaire @fiche@ : @len(fiche)@.")`,
      solution: "len(fiche)", indice: "@len@ marche aussi avec un dictionnaire : @len(fiche)@.",
      reponse: "5 informations. Fiche complète." },
  ],
  retenir: R`- @dico[cle]@ lit une valeur ; @dico[cle] = valeur@ la modifie, ou crée la clé si elle n'existe pas.
- @cle in dico@ vaut @True@ si la clé existe.
- @len(dico)@ donne le nombre de paires.`,
  apres: [
    { qui: "nour", expr: "sourire", texte: "Fiche parfaite. Personne ne pourra dire qu'il n'y en a pas ici." },
    { qui: "bolt", expr: "rire", texte: "Toxique, hein ? Promis, je ne la goûte pas." },
  ],
},
// -----------------------------------------------------------------------------
{
  id: "m07", chap: "p2", type: "parsons", competence: "concevoir", xp: 110,
  titre: "Le recensement du récif",
  objectif: "Remets les lignes dans l'ordre pour afficher chaque espèce, puis le total.",
  recit: [
    { qui: "narration", decor: "luciole", texte: "Un bruit dans la soute. Un **poulpe** en sort : le passager clandestin que la caméra avait repéré." },
    { qui: "huit", expr: "malin", texte: "…♪" },
    { qui: "bolt", expr: "choc", type: "cri", texte: "Il a pris les cartes du programme de recensement ! Et il les a toutes **mélangées** !" },
    { qui: "luci", expr: "serieux", texte: "Programme en désordre. Attention : **2 lignes** sont des intrus. Elles ne servent pas." },
    { qui: "cap", expr: "sourire", texte: "Remets les lignes dans l'ordre. Et le poulpe reste à bord : on l'appellera **Huit**." },
  ],
  replique: {
    q: "Que doit afficher le programme de recensement ?",
    choix: ["Chaque espèce avec son nombre, puis le total.", "Seulement le total."],
    bonne: 0,
    retours: { 1: { qui: "luci", texte: "Incomplet. Je veux **chaque espèce**, puis le total." } },
  },
  rappel: {
    titre: "Parcourir un dictionnaire",
    texte: R`~~~
stock = {"masques": 3, "palmes": 5}
for cle, valeur in stock.items():
    print(cle, valeur)
~~~
- @.items()@ donne les paires (clé, valeur) : c'est un **parcours clé-valeur**.
- Sans @.items()@, la boucle ne donne que les **clés**.
- Les lignes **décalées** sont répétées à chaque tour. Les lignes **pas décalées** après la boucle sont exécutées **une seule fois**, à la fin.`,
    memo: "dicos-parcours",
  },
  avant: [
    { type: "phrase", q: "Explique ton plan avant de ranger les lignes.",
      phrase: "Pour avoir l'espèce **et** son nombre, je parcours le dictionnaire avec {{0}}. Le total commence à 0 {{1}} la boucle, et s'affiche {{2}} la boucle.",
      trous: [
        { choix: ["@comptage.items()@", "@comptage@", "@range(len(comptage))@"], bonne: 0, aide: "Sans @.items()@, on n'a que les clés. Avec @.items()@, on a les paires (clé, valeur)." },
        { choix: ["avant", "dans", "après"], bonne: 0, aide: "Le total doit exister avant le premier tour : on le crée **avant** la boucle." },
        { choix: ["après", "dans", "avant"], bonne: 0, aide: "On affiche le total une seule fois, quand tout est additionné : **après** la boucle." },
      ],
      expl: "Avant la boucle : on prépare. Dans la boucle : on traite chaque paire. Après la boucle : on affiche le résultat." },
  ],
  setup: R`comptage = {"poisson-clown": 12, "nudibranche": 3, "tortue": 1, "mérou": 2}`,
  parsons: {
    lignes: [
      "total = 0",
      "for espece, nombre in comptage.items():",
      "    print(espece, \":\", nombre)",
      "    total = total + nombre",
      "print(\"Total :\", total)",
    ],
    distracteurs: ["for espece, nombre in comptage:", "total = nombre"],
  },
  check: R`
attendu = ["poisson-clown : 12", "nudibranche : 3", "tortue : 1", "mérou : 2", "Total : 18"]
if not utilise(r"\.items\s*\("):
    echec("Il faut @comptage.items()@ pour obtenir à la fois l'espèce et le nombre.")
nb_total = len([l for l in lignes if l.startswith("Total")])
if nb_total > 1:
    echec("Le total s'affiche plusieurs fois : la ligne @print(\"Total :\", total)@ doit être **après** la boucle, sans décalage.")
if nb_total == 0:
    echec("Le total ne s'affiche pas. Il manque la ligne @print(\"Total :\", total)@.")
especes = [l for l in lignes if not l.startswith("Total")]
if len(especes) == 1:
    echec("Une seule espèce s'affiche : la ligne @print(espece, \":\", nombre)@ doit être **dans** la boucle (décalée).")
if lignes and lignes[0].startswith("Total"):
    echec("Le total s'affiche avant les espèces : il doit être à la **fin**.")
if lignes[-1] != "Total : 18":
    if lignes[-1] == "Total : 2":
        echec("Le total vaut 2 : la ligne @total = total + nombre@ doit être **dans** la boucle (décalée), sinon elle n'est faite qu'une fois.")
    echec("La dernière ligne affiche %s au lieu de @Total : 18@." % montre(lignes[-1]))
if lignes != attendu:
    echec("L'affichage n'est pas encore le bon. Il faut une ligne par espèce, puis le total.")
`,
  indices: [
    "On commence par créer le total, avant la boucle : @total = 0@.",
    "Les deux lignes **décalées** (dans la boucle) : afficher l'espèce, et ajouter le nombre au total. Les lignes en trop : la boucle sans @.items()@, et @total = nombre@.",
    "Ordre : @total = 0@, la boucle avec @.items()@, les deux lignes décalées, puis @print(\"Total :\", total)@ sans décalage.",
  ],
  solution: R`total = 0
for espece, nombre in comptage.items():
    print(espece, ":", nombre)
    total = total + nombre
print("Total :", total)`,
  retenir: R`Un algorithme a souvent 3 parties : **avant** la boucle (on prépare, @total = 0@), **dans** la boucle (décalé : répété pour chaque paire), **après** la boucle (on affiche le résultat, une seule fois).`,
  apres: [
    { qui: "luci", ecran: true, sortie: true, texte: "Recensement du récif :" },
    { qui: "nour", expr: "sourire", texte: "18 animaux autour de la station. Le récif est en bonne santé." },
    { qui: "huit", expr: "rire", texte: "♪♪" },
  ],
},
// ============================ CHAPITRE 4 : LA PASSE ============================
{
  id: "m08", chap: "p3", type: "code", competence: "corriger", xp: 120,
  titre: "Le scanner saboté",
  objectif: "Corrige les 3 erreurs du programme pour garder les raies de plus de 4 mètres.",
  recit: [
    { qui: "narration", decor: "espece:manta", fx: "VRRRM !", texte: "−30 m. La passe. Le courant secoue la Luciole. Au-dessus, des ombres immenses : des **raies manta**." },
    { qui: "luci", expr: "choc", texte: "Scanner… défaillant. **3 erreurs** dans mon programme. Ce n'est pas moi." },
    { qui: "vex", expr: "malin", radio: true, texte: "Petit cadeau du drone : trois bugs. Bonne chance, la Recrue." },
    { qui: "cap", expr: "colere", texte: "Le scanner doit garder les raies de **plus de 4 mètres**. Répare-le." },
  ],
  replique: {
    q: "Que doit garder le scanner ?",
    choix: ["Les envergures de plus de 4 mètres.", "Les envergures de moins de 4 mètres.", "Toutes les envergures."],
    bonne: 0,
    retours: {
      1: { qui: "bolt", expr: "sueur", texte: "Les petites ? Non ! On cherche les **géantes**." },
      2: { qui: "luci", texte: "Négatif. Il faut **filtrer** : garder seulement celles de plus de 4 m." },
    },
  },
  rappel: {
    titre: "Filtrer une liste",
    texte: R`Pour **filtrer**, on part d'une liste vide et on ajoute seulement les éléments qui conviennent :
~~~
notes = [8, 14, 11, 6]
bonnes = []
for n in notes:
    if n >= 10:
        bonnes.append(n)
print(bonnes)    # [14, 11]
~~~
**Corriger un programme** : lance-le, lis le numéro de **ligne** et l'**explication**, corrige **une** erreur, puis relance.`,
    memo: "algo-filtrer",
  },
  avant: [
    { type: "annoter", q: "Avant de corriger, dis le rôle de chaque ligne du scanner.",
      code: R`grandes = []
for e in envergures
    if e < 4:
        grandes = grandes.append(e)
print(grandes)`,
      etiquettes: ["créer une liste vide", "parcourir la liste par valeur", "tester une condition", "ajouter à la fin de la liste", "afficher le résultat"],
      notes: [
        { ligne: 1, bonne: 0 }, { ligne: 2, bonne: 1 }, { ligne: 3, bonne: 2 }, { ligne: 4, bonne: 3 }, { ligne: 5, bonne: 4 },
      ],
      expl: "C'est un algorithme de **filtre** : une liste vide, un parcours, une condition, un ajout." },
  ],
  consigne: R`Le programme doit créer la liste @grandes@ avec les envergures de **plus de 4 mètres**, puis l'afficher.
Il contient **3 erreurs** : trouve-les et corrige-les.`,
  setup: R`envergures = [3.2, 4.1, 2.8, 4.5, 3.9, 4.8]`,
  starter: R`grandes = []
for e in envergures
    if e < 4:
        grandes = grandes.append(e)
print(grandes)
`,
  check: R`
g = var("grandes")
if g is None:
    echec("@grandes@ vaut @None@ : n'écris pas @grandes = grandes.append(e)@. La méthode @append@ modifie la liste toute seule : écris juste @grandes.append(e)@.")
verifie(isinstance(g, list), "@grandes@ doit rester une liste.")
if g == [3.2, 2.8, 3.9]:
    echec("@grandes@ contient les **petites** raies (moins de 4 m). Vérifie le signe de comparaison, ligne 3.")
if g == [4.1, 4.5, 3.9, 4.8] or g == [3.2, 4.1, 2.8, 4.5, 3.9, 4.8]:
    echec("Il y a des raies de moins de 4 m dans @grandes@. Vérifie la condition de la ligne 3.")
if g != [4.1, 4.5, 4.8]:
    echec("@grandes@ vaut %s au lieu de @[4.1, 4.5, 4.8]@." % montre(g))
if not lignes:
    echec("Le programme doit afficher la liste @grandes@ à la fin.")
`,
  indices: [
    "Lance le programme : Python indique la ligne de la première erreur. À la ligne 2, il manque un symbole à la fin.",
    "Ligne 4 : @append@ modifie la liste directement et ne renvoie rien. N'écris pas @grandes = ...@ devant.",
    "Ligne 3 : on veut les raies de **plus** de 4 m. Le signe doit être @>@.",
  ],
  solution: R`grandes = []
for e in envergures:
    if e > 4:
        grandes.append(e)
print(grandes)
`,
  retenir: R`Trois erreurs très fréquentes :
- oublier les deux-points @:@ après @for@, @if@, @def@ (erreur de **syntaxe**) ;
- écrire @liste = liste.append(x)@ : @append@ ne renvoie rien, la liste devient @None@ ;
- se tromper de comparaison (@<@ au lieu de @>@) : pas d'erreur Python, mais un **résultat faux**. Il faut toujours vérifier le résultat !`,
  apres: [
    { qui: "luci", ecran: true, sortie: true, texte: "Scanner réparé. Raies géantes détectées :" },
    { qui: "vex", expr: "sueur", radio: true, texte: "…Pas mal. Pour une recrue." },
    { qui: "bolt", expr: "rire", texte: "Il est vexé. Ha ! Vex est vexé !" },
  ],
},
// -----------------------------------------------------------------------------
{
  id: "m09", chap: "p3", type: "trace", competence: "comprendre", xp: 100,
  titre: "Compter les géantes",
  objectif: "Fais tourner le programme à la main : remplis le tableau, tour par tour.",
  recit: [
    { qui: "luci", expr: "serieux", texte: "Avant de te confier mon scanner, je vérifie que tu comprends **vraiment** ce programme." },
    { qui: "luci", texte: "Joue l'ordinateur : remplis mon **tableau d'avancement**, tour par tour." },
    { qui: "nour", texte: "Comme un ralenti. Une ligne du tableau par tour de boucle." },
  ],
  replique: {
    q: "Comment vas-tu faire ?",
    choix: ["J'exécute le programme à la main, tour par tour.", "Je lance le programme et je recopie le résultat."],
    bonne: 0,
    retours: { 1: { qui: "luci", expr: "serieux", texte: "Interdit. Le but est de **comprendre** chaque tour, pas de recopier." } },
  },
  rappel: {
    titre: "Faire tourner un programme « à la main »",
    texte: R`Un **tableau d'avancement** note la valeur des variables à chaque tour de boucle.
- Colonne @e@ : l'élément de la liste pour ce tour.
- Colonne @e > 4@ : @True@ (vrai) ou @False@ (faux).
- Colonne @nb@ : la valeur de @nb@ **à la fin** du tour. Elle augmente de 1 seulement si la condition est vraie.`,
    memo: "algo-somme",
  },
  avant: [
    { type: "phrase", q: "Avant de remplir le tableau, dis à quoi sert la variable @nb@.",
      code: R`nb = 0
for e in envergures:
    if e > 4:
        nb = nb + 1`,
      phrase: "@nb@ est un {{0}} : il part de 0 et augmente de 1 {{1}}.",
      trous: [
        { choix: ["compteur", "indice", "élément de la liste"], bonne: 0, aide: "@nb@ compte combien d'éléments vérifient la condition : c'est un **compteur**." },
        { choix: ["seulement quand la condition est vraie", "à chaque tour de boucle", "une seule fois, à la fin"], bonne: 0, aide: "La ligne @nb = nb + 1@ est **dans le if** : elle n'est faite que si @e > 4@ est vrai." },
      ],
      expl: "@nb@ est un **compteur** : il augmente seulement quand la condition est vraie." },
  ],
  code: R`envergures = [3.2, 4.1, 2.8, 4.5]
nb = 0
for e in envergures:
    if e > 4:
        nb = nb + 1
print(nb)`,
  trace: {
    avant: [
      { q: "Avant la boucle, combien vaut @nb@ ?", rep: ["0"], aide: "Regarde la ligne 2." },
    ],
    colonnes: [
      { titre: "Tour", type: "texte" },
      { titre: "e", type: "texte", aide: "e prend les valeurs de la liste, dans l'ordre : 3.2, 4.1, 2.8, 4.5." },
      { titre: "e > 4", type: "bool", aide: "Compare e avec 4 : True si e est plus grand que 4." },
      { titre: "nb (fin du tour)", type: "texte", aide: "nb augmente de 1 seulement quand e > 4 est True." },
    ],
    lignes: [
      ["1", "3.2", "False", "0"],
      ["2", "4.1", "True", "1"],
      ["3", "2.8", "False", "1"],
      ["4", "4.5", "True", "2"],
    ],
    donnees: [[true, false, false, false], [true, false, false, false], [true, false, false, false], [true, false, false, false]],
    apres: [
      { q: "Qu'affiche le programme ?", rep: ["2"], aide: "C'est la valeur de nb à la fin du dernier tour." },
      { q: "Si on ajoute @5.0@ à la fin de la liste, que vaudra @nb@ à la fin ?", rep: ["3"], aide: "5.0 > 4 est True : nb augmente encore de 1." },
    ],
  },
  indices: [
    "Colonne e : recopie les valeurs de la liste dans l'ordre.",
    "Colonne e > 4 : seuls 4.1 et 4.5 sont plus grands que 4.",
    "nb vaut 0, puis 1 au tour 2, reste à 1 au tour 3, puis 2 au tour 4.",
  ],
  retenir: R`Ce programme **compte** les éléments qui vérifient une condition : on part de @nb = 0@ et on fait @nb = nb + 1@ seulement quand la condition est vraie. C'est l'algorithme de **comptage**.`,
  apres: [
    { qui: "luci", expr: "sourire", texte: "Tableau parfait. Tu raisonnes comme une machine. C'est un compliment." },
    { qui: "cap", texte: "Derrière la passe, c'est le grand bleu. Accrochez-vous." },
  ],
},
// ============================ CHAPITRE 5 : LE TOMBANT ==========================
{
  id: "m10", chap: "p4", type: "etapes", competence: "expliquer", xp: 100,
  titre: "Le point le plus profond",
  objectif: "Explique comment l'algorithme trouve la plus grande valeur d'une liste.",
  recit: [
    { qui: "narration", decor: "espece:dauphin", texte: "−80 m. Le récif plonge à pic : c'est le **tombant**. Des dauphins tournent autour de la Luciole." },
    { qui: "luci", texte: "Mon sonar a mesuré 6 profondeurs. Je cherche la **plus grande** avec l'algorithme du **maximum**." },
    { qui: "cap", expr: "serieux", texte: "Si LUCI se trompe, on racle la paroi. Recrue : explique-moi son algorithme avant que je lui laisse la barre." },
  ],
  replique: {
    q: "Que demande la capitaine ?",
    choix: ["Comprendre comment LUCI trouve la plus grande valeur.", "Remonter à la surface.", "Choisir une profondeur au hasard."],
    bonne: 0,
    retours: {
      1: { qui: "cap", expr: "colere", texte: "Remonter ? Jamais." },
      2: { qui: "luci", expr: "choc", texte: "Au hasard ?! Je refuse." },
    },
  },
  rappel: {
    titre: "L'algorithme du maximum",
    texte: R`On garde un **champion** : la plus grande valeur vue jusqu'ici.
~~~
maxi = profondeurs[0]        # le premier élément est le champion de départ
for p in profondeurs:        # on regarde chaque valeur, une par une
    if p > maxi:             # plus grande que le champion ?
        maxi = p             # oui : nouveau champion
print(maxi)
~~~`,
    anim: "maximum",
    memo: "algo-maximum",
  },
  donnees: { profondeurs: [85, 120, 97, 143, 110, 128] },
  setup: R`profondeurs = [85, 120, 97, 143, 110, 128]`,
  etapes: [
    { type: "phrase", q: "Résume l'idée de l'algorithme.",
      phrase: "Pour trouver le maximum, je dois regarder {{0}}, une par une, et garder {{1}}.",
      trous: [
        { choix: ["toutes les valeurs", "seulement la première et la dernière valeur", "la moitié des valeurs"], bonne: 0, aide: "Le maximum peut être n'importe où : il faut regarder **toutes** les valeurs." },
        { choix: ["la plus grande vue jusqu'ici", "la dernière valeur vue", "la somme des valeurs"], bonne: 0, aide: "On garde un **champion** : la plus grande valeur rencontrée jusqu'ici." },
      ],
      expl: "On parcourt **toute** la liste, et on garde à chaque instant le **champion** : la plus grande valeur vue." },
    { type: "case", donnee: "profondeurs", q: "Au départ (ligne 1), quel est le champion ? Touche la case.",
      code: R`maxi = profondeurs[0]`, bonne: 0,
      expl: "@profondeurs[0]@ est le premier élément : 85. C'est le champion de départ.",
      pieges: { 3: "143 est la plus grande valeur, mais au départ, l'algorithme ne le sait pas encore : il commence par la **première**." } },
    { type: "ligne", q: "Touche la ligne qui **compare** une valeur au champion.",
      code: R`maxi = profondeurs[0]
for p in profondeurs:
    if p > maxi:
        maxi = p
print(maxi)`,
      bonne: 3,
      expl: "@if p > maxi:@ compare la valeur @p@ au champion actuel.",
      pieges: { 4: "Cette ligne **remplace** le champion. La comparaison se fait juste avant.", 2: "Cette ligne parcourt la liste. Cherche le @if@." } },
    { type: "ligne", q: "Touche la ligne qui **remplace** le champion.",
      code: R`maxi = profondeurs[0]
for p in profondeurs:
    if p > maxi:
        maxi = p
print(maxi)`,
      bonne: 4,
      expl: "@maxi = p@ : la valeur @p@ devient le nouveau champion.",
      pieges: { 3: "Cette ligne compare. Le remplacement se fait juste en dessous.", 1: "Cette ligne donne le champion de **départ**." } },
    { type: "case", donnee: "profondeurs", q: "Pendant la boucle, quelles valeurs **deviennent** champion ? Touche-les, puis valide.",
      bonnes: [1, 3],
      expl: "@maxi@ passe de 85 à **120**, puis de 120 à **143**. Ensuite, rien n'est plus grand que 143.",
      pieges: { 0: "85 est le champion **de départ** (ligne 1) : il ne le devient pas pendant la boucle.", 5: "128 est plus grand que 120… mais quand on arrive à 128, le champion est déjà 143.", 4: "110 n'est pas plus grand que le champion de ce moment-là (143).", 2: "97 n'est pas plus grand que le champion de ce moment-là (120)." },
      aide: "Avance de gauche à droite en gardant le champion en tête : 85, puis… ?" },
    { type: "choix", q: "Pourquoi commencer avec @maxi = profondeurs[0]@ plutôt qu'avec @maxi = 0@ ?",
      choix: ["Parce que si toutes les valeurs sont négatives (par exemple @[-5, -2, -9]@), @maxi = 0@ donnerait 0, qui n'est même pas dans la liste.", "Parce que @0@ est interdit en Python.", "Il n'y a aucune différence."], bonne: 0,
      expl: "Partir du premier élément marche **toujours**. Partir de 0 se trompe dès que toutes les valeurs sont négatives.",
      pieges: { 1: "0 est autorisé. Le problème vient des listes de nombres négatifs.", 2: "Essaie avec @[-5, -2, -9]@ : le maximum est -2, mais en partant de 0 on obtiendrait 0." } },
    { type: "associer", q: "Relie chaque ligne à son rôle.",
      gauche: ["@maxi = profondeurs[0]@", "@for p in profondeurs:@", "@if p > maxi:@", "@maxi = p@"],
      droite: ["choisir le champion de départ", "regarder chaque valeur, une par une", "comparer avec le champion", "garder un nouveau champion"],
      bonnes: [0, 1, 2, 3],
      expl: "Tu sais maintenant expliquer l'algorithme du maximum ligne par ligne." },
  ],
  retenir: R`Algorithme du maximum : 1) le premier élément est le champion ; 2) on regarde **chaque** valeur ; 3) si elle est plus grande que le champion, elle devient le champion. À la fin, le champion est le maximum. Pour le **minimum**, on change seulement @>@ en @<@.`,
  apres: [
    { qui: "luci", texte: "Point le plus profond : **143 m**. Trajectoire validée." },
    { qui: "narration", decor: "duo", texte: "Sous eux, le Léviathan prend un raccourci. Il fonce vers les profondeurs." },
  ],
},
// ===================== CHAPITRE 6 : LA ZONE CRÉPUSCULAIRE =====================
{
  id: "m11", chap: "p5", type: "code", competence: "completer", xp: 120,
  titre: "La lumière la plus forte",
  objectif: "Complète le programme pour trouver la lumière la plus forte et sa position.",
  recit: [
    { qui: "narration", decor: "lumieres", texte: "−200 m. La zone crépusculaire. Autour de la Luciole, des animaux s'allument et s'éteignent." },
    { qui: "nour", expr: "rire", texte: "La **bioluminescence** ! Ils fabriquent leur propre lumière." },
    { qui: "luci", expr: "choc", texte: "Anomalie. Une des 7 lumières est **beaucoup trop forte** pour un animal." },
    { qui: "cap", expr: "colere", texte: "C'est le projecteur du Léviathan. Ils éblouissent les animaux pour les attraper. Trouve **où** il est." },
  ],
  replique: {
    q: "Que faut-il trouver ?",
    choix: ["La lumière la plus forte ET sa position dans la liste.", "Seulement la valeur de la lumière la plus forte."],
    bonne: 0,
    retours: { 1: { qui: "cap", expr: "serieux", texte: "La valeur ne me dit pas **où** ils sont. Il me faut aussi la **position**." } },
  },
  rappel: {
    titre: "Le maximum et sa position",
    texte: R`Pour connaître la **position** du maximum, on fait un **parcours par indice** :
~~~
temperatures = [24, 27, 22, 29, 25]
maxi = temperatures[0]
position = 0
for i in range(len(temperatures)):
    if temperatures[i] > maxi:
        maxi = temperatures[i]
        position = i
print(maxi, position)    # 29 3
~~~
- @maxi@ garde la **valeur** du champion.
- @position@ garde son **indice** (sa place dans la liste).`,
    anim: "maximum",
    memo: "algo-maximum",
  },
  avant: [
    { type: "phrase", q: "Explique ton plan avant de compléter le programme.",
      phrase: "Pour connaître la position, je fais un parcours par {{0}} avec @range(len(intensites))@. @maxi@ garde {{1}} du champion, et @position@ garde {{2}}.",
      trous: [
        { choix: ["indice", "valeur"], bonne: 0, aide: "Pour savoir **où** est le champion, il faut parcourir les **indices**." },
        { choix: ["la valeur", "l'indice"], bonne: 0, aide: "@maxi@ sert à comparer : il garde la **valeur**." },
        { choix: ["son indice", "sa valeur"], bonne: 0, aide: "@position@ dit **où** est le champion : c'est un **indice**." },
      ],
      expl: "Parcours par **indice** ; deux variables : la **valeur** du champion et son **indice**." },
  ],
  consigne: R`Remplace les @___@ pour que :
- @maxi@ contienne la **plus forte** intensité ;
- @position@ contienne son **indice**.`,
  setup: R`intensites = [12, 45, 7, 63, 88, 31, 19]`,
  starter: R`maxi = intensites[0]
position = 0
for i in range(len(intensites)):
    if intensites[i] > ___:
        maxi = ___
        position = ___
print("Lumière la plus forte :", maxi)
print("Position :", position)
`,
  check: R`
if re.search(r"\b88\b", code_sc):
    echec("N'écris pas 88 toi-même : c'est l'algorithme qui doit trouver le maximum.")
if utilise(r"\bmax\s*\("):
    echec("Ici, on écrit l'algorithme soi-même, sans la fonction @max@.")
m = var("maxi")
p = var("position")
if m == 4 and p == 88:
    echec("Tu as inversé : @maxi@ doit recevoir la **valeur** @intensites[i]@, et @position@ l'**indice** @i@.")
if p == 88:
    echec("@position@ vaut 88 : c'est la valeur ! @position@ doit contenir l'**indice**, c'est-à-dire @i@.")
if m == 6 or m == 4:
    echec("@maxi@ vaut %s : c'est un indice. @maxi@ doit recevoir la **valeur** : @intensites[i]@." % montre(m))
if m == 19:
    echec("@maxi@ vaut 19, la dernière valeur. La condition doit comparer avec le champion : @intensites[i] > maxi@.")
if m != 88:
    echec("@maxi@ vaut %s au lieu de 88. Vérifie la condition et la ligne @maxi = ...@." % montre(m))
if p != 4:
    echec("@position@ vaut %s au lieu de 4. Elle doit recevoir l'indice du tour : @position = i@." % montre(p))
`,
  indices: [
    "Dans la condition, on compare l'élément @intensites[i]@ avec le champion actuel : @maxi@.",
    "Si l'élément est plus grand, il devient le champion : @maxi@ reçoit la **valeur** @intensites[i]@.",
    "Les trois trous : @maxi@, puis @intensites[i]@, puis @i@.",
  ],
  solution: R`maxi = intensites[0]
position = 0
for i in range(len(intensites)):
    if intensites[i] > maxi:
        maxi = intensites[i]
        position = i
print("Lumière la plus forte :", maxi)
print("Position :", position)
`,
  retenir: R`Pour la position du maximum, on fait un **parcours par indice** avec @range(len(...))@ et on met à jour **deux** variables en même temps : la valeur (@maxi = intensites[i]@) et l'indice (@position = i@).`,
  apres: [
    { qui: "luci", ecran: true, sortie: true, texte: "Analyse des lumières :" },
    { qui: "cap", expr: "serieux", texte: "Position 4 : c'est eux. On coupe nos phares et on passe dans leur ombre." },
    { qui: "bolt", expr: "sueur", texte: "J'aime pas le noir… J'aime pas le noir…" },
  ],
},
// ===================== CHAPITRE 7 : LES GROTTES DU GOMBESSA ====================
{
  id: "m12", chap: "p6", type: "parsons", competence: "concevoir", xp: 120,
  titre: "Le registre des grottes",
  objectif: "Remets les lignes dans l'ordre pour compter combien de fois chaque animal a été vu.",
  recit: [
    { qui: "narration", decor: "grotte", texte: "−250 m. Une paroi de lave noire, percée de grottes. Le territoire du gombessa." },
    { qui: "luci", texte: "J'ai noté chaque animal aperçu dans la liste @observations@. Je veux un **dictionnaire** qui compte chaque espèce." },
    { qui: "huit", expr: "malin", texte: "…♪" },
    { qui: "bolt", expr: "colere", type: "cri", texte: "HUIT ! Il a encore mélangé les lignes ! Et cette fois, il y a **deux niveaux** de décalage !" },
    { qui: "cap", expr: "serieux", texte: "Remets-les en ordre. Vite : le Léviathan approche." },
  ],
  replique: {
    q: "Que doit contenir le dictionnaire @compte@ ?",
    choix: ["Pour chaque animal, le nombre de fois où il a été vu.", "La liste des animaux, dans l'ordre où ils ont été vus."],
    bonne: 0,
    retours: { 1: { qui: "luci", texte: "Ça, c'est déjà @observations@. Je veux **compter** chaque animal." } },
  },
  rappel: {
    titre: "Compter avec un dictionnaire",
    texte: R`~~~
votes = ["oui", "non", "oui"]
compte = {}                          # dictionnaire vide
for v in votes:
    if v in compte:                  # déjà vu ?
        compte[v] = compte[v] + 1    # on ajoute 1
    else:                            # première fois :
        compte[v] = 1                # on crée la clé
print(compte)                        # {'oui': 2, 'non': 1}
~~~
Ce qui est sous le @if@ et sous le @else@ est décalé **deux fois** : une fois pour le @for@, une fois pour le @if@ / @else@.`,
    memo: "algo-compter",
  },
  avant: [
    { type: "phrase", q: "Décris le dictionnaire que tu vas construire.",
      phrase: "@compte@ est un {{0}}. Ses clés sont {{1}}, et ses valeurs sont {{2}}.",
      trous: [
        { choix: ["dictionnaire", "liste"], bonne: 0, aide: "On associe un nombre à chaque animal : c'est un **dictionnaire**." },
        { choix: ["les noms des animaux", "des indices 0, 1, 2…"], bonne: 0, aide: "On cherche un animal par son **nom** : les noms sont les clés." },
        { choix: ["le nombre de fois où chaque animal est vu", "les noms des animaux"], bonne: 0, aide: "La valeur associée à un animal, c'est **combien de fois** on l'a vu." },
      ],
      expl: "Clé : le nom de l'animal. Valeur : son nombre d'apparitions." },
    { type: "phrase", q: "Et pour chaque observation ?",
      phrase: "Si l'animal est déjà une clé de @compte@, {{0}}. Sinon, {{1}}.",
      trous: [
        { choix: ["j'ajoute 1 à sa valeur", "je crée la clé avec la valeur 1", "je remets sa valeur à 0"], bonne: 0, aide: "Déjà vu → on l'a vu **une fois de plus**." },
        { choix: ["je crée la clé avec la valeur 1", "j'ajoute 1 à sa valeur", "je ne fais rien"], bonne: 0, aide: "Première fois → il faut **créer** la clé, avec 1." },
      ],
      expl: "Déjà vu : **+ 1**. Première fois : on **crée** la clé avec **1**." },
  ],
  setup: R`observations = ["mérou", "langouste", "mérou", "gombessa", "mérou", "langouste"]`,
  parsons: {
    lignes: [
      "compte = {}",
      "for animal in observations:",
      "    if animal in compte:",
      "        compte[animal] = compte[animal] + 1",
      "    else:",
      "        compte[animal] = 1",
      "print(compte)",
    ],
    distracteurs: ["compte = []", "compte[animal] = 0"],
  },
  check: R`
c = var("compte")
if isinstance(c, list):
    echec("@compte@ doit être un **dictionnaire** : @compte = {}@, pas une liste.")
verifie(isinstance(c, dict), "@compte@ doit être un dictionnaire.")
att = {"mérou": 3, "langouste": 2, "gombessa": 1}
if c == {"mérou": 1, "langouste": 1, "gombessa": 1}:
    echec("Chaque animal vaut 1 : quand l'animal est déjà dans le dictionnaire, il faut **ajouter 1** (@compte[animal] = compte[animal] + 1@).")
if any(v == 0 for v in c.values()):
    echec("Un animal vaut 0 : la ligne @compte[animal] = 0@ est en trop.")
if len(c) < 3:
    echec("Il manque des animaux dans @compte@ : la boucle doit traiter **toutes** les observations (lignes bien décalées sous le @for@).")
if c != att:
    echec("@compte@ vaut %s au lieu de %s." % (montre(c), montre(att)))
if not lignes:
    echec("Le programme doit afficher @compte@ à la fin (sans décalage).")
if len(lignes) > 1:
    echec("@compte@ s'affiche plusieurs fois : le @print@ doit être **après** la boucle, sans décalage.")
`,
  indices: [
    "Le dictionnaire vide se crée avant la boucle : @compte = {}@. Les lignes en trop : @compte = []@ et @compte[animal] = 0@.",
    "Dans la boucle : @if animal in compte:@ puis, décalée deux fois, la ligne qui ajoute 1. Ensuite @else:@ (même décalage que le @if@) et la ligne qui crée la clé avec 1.",
    "Décalages : @compte = {}@ (0), @for@ (0), @if@ (1), ajouter 1 (2), @else:@ (1), créer avec 1 (2), @print(compte)@ (0).",
  ],
  solution: R`compte = {}
for animal in observations:
    if animal in compte:
        compte[animal] = compte[animal] + 1
    else:
        compte[animal] = 1
print(compte)`,
  retenir: R`Pour compter des apparitions : un dictionnaire vide, puis pour chaque élément, **+ 1** s'il est déjà une clé, sinon on crée la clé avec **1**. Version courte : @compte[animal] = compte.get(animal, 0) + 1@.`,
  apres: [
    { qui: "luci", ecran: true, sortie: true, texte: "Registre des grottes :" },
    { qui: "luci", expr: "sourire", texte: "1 gombessa observé. Il est là. Tout près." },
    { qui: "vex", expr: "serieux", radio: true, texte: "On a sa position aussi. Désolé, la Luciole. Notre filet est prêt." },
  ],
},
// -----------------------------------------------------------------------------
{
  id: "m13", chap: "p6", type: "code", competence: "ecrire", xp: 150, final: true,
  titre: "La rencontre",
  objectif: "Écris un programme qui compte les gombessas de plus de 1,5 m, puis trouve la plus grande taille.",
  recit: [
    { qui: "narration", decor: "grotte", fx: "TOUM… TOUM…", texte: "Le sonar détecte **5 silhouettes** dans la grotte. Le Léviathan se place juste au-dessus." },
    { qui: "orsa", expr: "malin", radio: true, texte: "Capitaine Sel. Vingt ans plus tard… Laissez-nous le plus grand. Vous garderez vos souvenirs." },
    { qui: "cap", expr: "colere", type: "cri", texte: "Il a peut-être 100 ans, il est protégé, et il ne finira **jamais** dans votre vitrine !" },
    { qui: "luci", texte: "Je peux tromper leur filet avec un leurre. Il me faut **deux** informations : le nombre de gombessas de **plus de 1,5 m**, et la **plus grande** taille." },
    { qui: "bolt", expr: "serieux", texte: "Cette fois, c'est toi qui écris tout, Recrue. On compte sur toi." },
  ],
  replique: {
    q: "Que doit calculer ton programme ?",
    choix: ["Le nombre de gombessas de plus de 1,5 m ET la plus grande taille.", "Seulement la plus grande taille.", "La somme de toutes les tailles."],
    bonne: 0,
    retours: {
      1: { qui: "luci", expr: "serieux", texte: "Incomplet. J'ai besoin des **deux** informations." },
      2: { qui: "luci", expr: "serieux", texte: "La somme ? Inutile pour le leurre. Relis ma demande." },
    },
  },
  rappel: {
    titre: "Compter et chercher le maximum",
    texte: R`~~~
notes = [8, 14, 11, 6]

nb = 0                     # COMPTER
for n in notes:
    if n >= 10:
        nb = nb + 1

meilleure = notes[0]       # MAXIMUM
for n in notes:
    if n > meilleure:
        meilleure = n

print(nb, meilleure)       # 2 14
~~~`,
    memo: "algo-maximum",
  },
  avant: [
    { type: "phrase", q: "Ton plan, partie 1 : compter.",
      phrase: "Pour compter, je pars de {{0}}. Je parcours @tailles@, et j'ajoute 1 {{1}}.",
      trous: [
        { choix: ["0", "@tailles[0]@"], bonne: 0, aide: "Un compteur part de **0** : on n'a encore rien compté." },
        { choix: ["quand la taille est plus grande que 1.5", "à chaque tour", "à la fin"], bonne: 0, aide: "On compte seulement les **grands** : il faut une condition." },
      ],
      expl: "Un **compteur** part de 0 et augmente quand la condition est vraie." },
    { type: "phrase", q: "Ton plan, partie 2 : le maximum.",
      phrase: "Pour le maximum, mon champion de départ est {{0}}. Je le remplace {{1}}.",
      trous: [
        { choix: ["@tailles[0]@", "0"], bonne: 0, aide: "Le champion de départ est le **premier élément** de la liste." },
        { choix: ["quand je trouve une taille plus grande que lui", "à chaque tour", "quand la taille est plus grande que 1.5"], bonne: 0, aide: "On remplace le champion seulement par **plus grand que lui**." },
      ],
      expl: "Le **champion** part du premier élément et est remplacé par toute valeur plus grande." },
  ],
  consigne: R`1. Compte dans @nb_grands@ les tailles **strictement plus grandes que 1.5**.
2. Trouve dans @plus_grand@ la **plus grande** taille (sans la fonction @max@).
Les deux lignes @print@ sont déjà écrites à la fin.`,
  setup: R`tailles = [1.2, 1.7, 0.9, 1.9, 1.6]`,
  starter: R`# 1) Compter les gombessas de plus de 1,5 m
nb_grands = 0
# écris ta boucle ici


# 2) Trouver la plus grande taille
plus_grand = tailles[0]
# écris ta boucle ici


print("Plus de 1,5 m :", nb_grands)
print("Le plus grand :", plus_grand)
`,
  check: R`
if utilise(r"\bmax\s*\("):
    echec("Écris l'algorithme du maximum toi-même, sans la fonction @max@ : c'est l'objectif de l'expédition !")
if len(re.findall(r"\bfor\b", code_ss)) < 1:
    echec("Il faut au moins une boucle @for@ pour parcourir la liste @tailles@.")
if re.search(r"nb_grands\s*=\s*3\b", code_sc) or re.search(r"plus_grand\s*=\s*1\.9\b", code_sc):
    echec("N'écris pas les réponses toi-même : c'est ton programme qui doit les calculer.")
n = var("nb_grands")
g = var("plus_grand")
if n == 0:
    echec("@nb_grands@ vaut encore 0. Dans une boucle, ajoute 1 quand la taille est plus grande que 1.5 : @nb_grands = nb_grands + 1@.")
if n == 5:
    echec("@nb_grands@ vaut 5 : tu as compté **toutes** les tailles. Ajoute 1 seulement si @t > 1.5@.")
if n != 3:
    echec("@nb_grands@ vaut %s au lieu de 3 (1.7, 1.9 et 1.6 sont plus grands que 1.5)." % montre(n))
if g == 1.2:
    echec("@plus_grand@ vaut encore 1.2 (la première taille). Écris la boucle du maximum : si @t > plus_grand@, alors @plus_grand = t@.")
if g == 1.6:
    echec("@plus_grand@ vaut 1.6, la dernière taille. Il faut comparer avec le champion : @if t > plus_grand:@.")
if g != 1.9:
    echec("@plus_grand@ vaut %s au lieu de 1.9." % montre(g))
if len(lignes) < 2:
    echec("Garde les deux lignes @print@ de la fin.")
succes("Les deux algorithmes fonctionnent.")
`,
  indices: [
    "Partie 1 : une boucle @for t in tailles:@, et dedans un @if t > 1.5:@ qui ajoute 1 à @nb_grands@.",
    "Partie 2 : une autre boucle @for t in tailles:@. Si @t@ est plus grand que @plus_grand@, @t@ devient le nouveau @plus_grand@.",
    "Partie 1 : @for t in tailles:@ / @if t > 1.5:@ / @nb_grands = nb_grands + 1@. Partie 2 : @for t in tailles:@ / @if t > plus_grand:@ / @plus_grand = t@. Attention aux décalages.",
  ],
  solution: R`# 1) Compter les gombessas de plus de 1,5 m
nb_grands = 0
for t in tailles:
    if t > 1.5:
        nb_grands = nb_grands + 1

# 2) Trouver la plus grande taille
plus_grand = tailles[0]
for t in tailles:
    if t > plus_grand:
        plus_grand = t

print("Plus de 1,5 m :", nb_grands)
print("Le plus grand :", plus_grand)
`,
  retenir: R`Tu sais maintenant **écrire** deux algorithmes de base sur les listes :
- **compter** : @nb = 0@, puis @nb = nb + 1@ quand la condition est vraie ;
- **maximum** : le premier élément est le champion, puis on le remplace dès qu'on trouve plus grand.
On peut aussi les faire dans **une seule** boucle !`,
  apres: [
    { qui: "luci", ecran: true, sortie: true, texte: "Calcul du leurre :" },
    { qui: "luci", expr: "sourire", texte: "Données reçues. Envoi du leurre… maintenant." },
  ],
},
];
})();
