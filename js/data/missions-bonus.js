// =============================================================================
//  EXPÉDITIONS BONUS — pour aller plus loin (ouvertes après la rencontre du gombessa)
//  Même format que missions-principales.js. Les données sont inventées pour les exercices.
// =============================================================================
window.BNL = window.BNL || {};
(() => {
const R = String.raw;

const RELEVE = R`releve = [["station", "poissons", "coraux", "tortues"],
          ["Jardin de corail", 120, 35, 2],
          ["Tombant bleu", 85, 20, 0],
          ["Grand herbier", 40, 2, 6],
          ["Arche", 150, 28, 1],
          ["Patate aux mérous", 95, 40, 0],
          ["Passe nord", 60, 12, 3]]`;
const RELEVE_JS = [["station", "poissons", "coraux", "tortues"], ["Jardin de corail", 120, 35, 2], ["Tombant bleu", 85, 20, 0],
  ["Grand herbier", 40, 2, 6], ["Arche", 150, 28, 1], ["Patate aux mérous", 95, 40, 0], ["Passe nord", 60, 12, 3]];
const STATIONS = R`stations = {l[0]: {"poissons": l[1], "coraux": l[2], "tortues": l[3]} for l in releve[1:]}`;

const PLAGES = R`plages = {"Anse aux Baobabs": (12, 300), "Plage du Phare": (30, 450), "Petite Crique": (9, 120),
          "Grande Plage": (41, 900), "Plage des Galets": (5, 200)}`;
const PLAGES_JS = { "Anse aux Baobabs": [12, 300], "Plage du Phare": [30, 450], "Petite Crique": [9, 120], "Grande Plage": [41, 900], "Plage des Galets": [5, 200] };

BNL.MISSIONS_BONUS = [
// ======================= EXPÉDITION 1 : LE LAC DZIANI ========================
{
  id: "b01", chap: "e1", type: "commande", competence: "ecrire", xp: 150,
  titre: "Les mesures de la sonde",
  objectif: "Découpe la liste @oxygene@ avec des commandes pour extraire les bonnes mesures.",
  recit: [
    { qui: "narration", decor: "espece:stromatolithes", texte: "Petite-Terre. Au fond d'un ancien cratère dort le **lac Dziani** : une eau verte, salée, presque sans oxygène." },
    { qui: "orsa", expr: "malin", radio: true, texte: "Les microbes de ce lac valent une fortune pour nos laboratoires. Nous viendrons les chercher, Capitaine." },
    { qui: "nour", expr: "colere", texte: "Ces microbes construisent des roches depuis des milliers d'années. On les étudie. On ne les vend pas." },
    { qui: "luci", texte: "Ma sonde a mesuré l'oxygène tous les 50 cm, dans la liste @oxygene@. Découpe-la pour isoler les bonnes mesures." },
  ],
  replique: {
    q: "Que vas-tu faire avec la liste @oxygene@ ?",
    choix: ["En extraire des morceaux (des tranches) avec des commandes.", "La trier du plus petit au plus grand."],
    bonne: 0,
    retours: { 1: { qui: "luci", expr: "serieux", texte: "Négatif. Les mesures suivent la profondeur : on ne trie pas, on **découpe**." } },
  },
  rappel: {
    titre: "Découper une liste (slicing) et chercher",
    texte: R`@liste[debut:fin]@ crée une **nouvelle liste** de l'indice @debut@ jusqu'à @fin@ **exclu**.
~~~
>>> lettres = ["a", "b", "c", "d", "e"]
>>> lettres[1:3]        # indices 1 et 2 (le 3 est exclu)
['b', 'c']
>>> lettres[:2]         # depuis le début
['a', 'b']
>>> lettres[-2:]        # les 2 derniers
['d', 'e']
>>> lettres.count("b")  # combien de fois "b" ?
1
>>> lettres.index("d")  # à quel indice est "d" ?
3
~~~`,
    memo: "listes-slicing",
  },
  setup: R`oxygene = [7.8, 6.1, 3.2, 0.4, 0.0, 0.0, 0.0, 0.0]`,
  commandes: [
    { consigne: "Affiche les **3 premières** mesures avec un découpage @[début:fin]@.",
      check: R`
verifie(utilise(r"oxygene\s*\[[^\]]*:[^\]]*\]"), "Utilise un découpage, avec deux-points entre les crochets : @oxygene[début:fin]@.")
if resultat == [7.8, 6.1]:
    echec("Il manque une mesure : la fin est **exclue**. Pour 3 mesures, la fin vaut 3.")
verifie(resultat == [7.8, 6.1, 3.2], "Ce ne sont pas les 3 premières mesures. On part du début (indice 0) et la fin est exclue.")`,
      solution: "oxygene[:3]", indice: "Si on ne met rien avant les deux-points, on part du début : @oxygene[:3]@.",
      reponse: "Surface : beaucoup d'oxygène." },
    { consigne: "Affiche les mesures d'indices **2 à 4 inclus**.",
      check: R`
verifie(utilise(r"oxygene\s*\[[^\]]*:[^\]]*\]"), "Utilise un découpage : @oxygene[début:fin]@.")
if resultat == [3.2, 0.4]:
    echec("Il manque l'indice 4 : la fin est **exclue**, il faut écrire 5.")
verifie(resultat == [3.2, 0.4, 0.0], "Ce ne sont pas les indices 2, 3 et 4.")`,
      solution: "oxygene[2:5]", indice: "Pour aller jusqu'à l'indice 4 inclus, la fin vaut 5 : @oxygene[2:5]@.",
      reponse: "L'oxygène chute très vite." },
    { consigne: "Affiche les **2 dernières** mesures, avec un indice négatif.",
      check: R`
verifie(utilise(r"oxygene\s*\[[^\]]*:[^\]]*\]"), "Utilise un découpage : @oxygene[début:fin]@.")
if resultat == [0.0, 0.0] and not utilise(r"-\s*2"):
    echec("Le résultat est juste, mais la consigne demande un indice négatif : @-2@ marche quelle que soit la longueur.")
verifie(resultat == [0.0, 0.0] and utilise(r"-\s*2"), "Pour les 2 dernières : on part de @-2@ et on va jusqu'au bout.")`,
      solution: "oxygene[-2:]", indice: "Rien après les deux-points = jusqu'à la fin : @oxygene[-2:]@.",
      reponse: "Au fond : zéro oxygène." },
    { consigne: "Combien de mesures valent @0.0@ ? Utilise la méthode @count@.",
      check: R`
verifie(utilise(r"\.count\s*\("), "Utilise la méthode @count@ : @oxygene.count(...)@.")
verifie(resultat == 4, "Compte les mesures égales à @0.0@ : @oxygene.count(0.0)@.")`,
      solution: "oxygene.count(0.0)", indice: "@count(x)@ compte les éléments égaux à x : @oxygene.count(0.0)@.",
      reponse: "4 mesures sans oxygène." },
    { consigne: "À quel indice se trouve le **premier** @0.0@ ? Utilise la méthode @index@.",
      check: R`
verifie(utilise(r"\.index\s*\("), "Utilise la méthode @index@ : @oxygene.index(...)@.")
verifie(resultat == 4, "@index@ donne l'indice de la première valeur égale : @oxygene.index(0.0)@.")`,
      solution: "oxygene.index(0.0)", indice: "@oxygene.index(0.0)@.",
      reponse: "Indice 4, soit 2 mètres de profondeur." },
    { consigne: "Range les **4 premières** mesures dans une nouvelle variable @surface@.",
      check: R`
verifie(not est_expression, "Il faut **ranger** le résultat dans une variable : @surface = ...@.")
s = var("surface", list)
verifie(utilise(r"oxygene\s*\[[^\]]*:[^\]]*\]"), "Découpe la liste @oxygene@ au lieu de recopier les valeurs.")
verifie(s == [7.8, 6.1, 3.2, 0.4], "@surface@ vaut %s au lieu des 4 premières mesures." % montre(s))`,
      solution: "surface = oxygene[:4]", indice: "@surface = oxygene[:4]@.",
      reponse: "Mesures de surface enregistrées. La sonde remonte." },
  ],
  retenir: R`- @liste[a:b]@ : de l'indice a **inclus** à b **exclu** (b − a éléments). @liste[:n]@ = les n premiers, @liste[-n:]@ = les n derniers.
- Le découpage crée une **nouvelle** liste.
- @liste.count(x)@ compte, @liste.index(x)@ donne la première position.`,
  apres: [
    { qui: "luci", texte: "Sous 1,5 m, plus d'oxygène : la vie du fond est microscopique." },
    { qui: "nour", expr: "sourire", texte: "Ce lac ressemble aux océans d'il y a plus de deux milliards d'années. Un trésor scientifique." },
  ],
},
// -----------------------------------------------------------------------------
{
  id: "b02", chap: "e1", type: "code", competence: "corriger", xp: 150,
  titre: "La copie de Bolt",
  objectif: "Corrige une seule ligne pour que la liste de LUCI ne soit plus modifiée par Bolt.",
  recit: [
    { qui: "bolt", expr: "sourire", texte: "J'ai copié la liste des échantillons de LUCI pour faire mes tests. Puis j'ai retiré « bulles » de MA copie." },
    { qui: "luci", expr: "colere", texte: "Alerte : « bulles » a aussi disparu de MA liste. Bolt, tu n'as pas fait une copie." },
    { qui: "vex", expr: "malin", texte: "Classique. Deux noms pour une seule liste. Recrue, tu lui montres ?" },
  ],
  rappel: {
    titre: "Copie ou référence ?",
    texte: R`Avec @b = a@, on ne copie pas la liste : on lui donne **un deuxième nom**. Les deux noms désignent la même liste.

::reference

~~~
a = [1, 2, 3]
b = a           # même liste, deux noms
b.append(4)
print(a)        # [1, 2, 3, 4]  !

c = a.copy()    # vraie copie (ou a[:])
c.append(5)
print(a)        # [1, 2, 3, 4]  (a n'a pas bougé)
~~~`,
    memo: "listes-copie",
  },
  consigne: R`1. Lance le programme et regarde l'onglet **Variables** : que remarques-tu ?
2. Corrige **une ligne** : la liste de LUCI doit garder ses 4 échantillons, la copie de Bolt doit en avoir 3.`,
  setup: "",
  starter: R`echantillons = ["eau", "boue", "roche", "bulles"]

copie = echantillons          # Bolt pense faire une copie...
copie.remove("bulles")        # il retire les bulles de SA copie

print("LUCI :", echantillons)
print("Bolt :", copie)
`,
  check: R`
e = var("echantillons", list)
c = var("copie", list)
if not utilise(r"\.remove\s*\("):
    echec("Garde la ligne @copie.remove(\"bulles\")@ : Bolt veut faire son test !")
if re.search(r'copie\s*=\s*\[\s*["\']', code_sc):
    echec("Ne recopie pas la liste à la main : utilise @.copy()@ (imagine une liste de 3 000 échantillons !).")
if e is c:
    echec("@echantillons@ et @copie@ sont toujours **la même liste** (regarde l'onglet Variables). Il faut une vraie copie : @echantillons.copy()@ ou @echantillons[:]@.")
if e != ["eau", "boue", "roche", "bulles"]:
    echec("La liste de LUCI a été modifiée : elle doit garder ses 4 échantillons.")
if c != ["eau", "boue", "roche"]:
    echec("La copie de Bolt doit avoir perdu « bulles ».")
`,
  indices: [
    "Le problème vient de la ligne 3 : @copie = echantillons@ ne crée pas de nouvelle liste.",
    "Une liste possède une méthode qui fabrique une vraie copie indépendante.",
    "Remplace la ligne 3 par @copie = echantillons.copy()@ (ou @echantillons[:]@).",
  ],
  solution: R`echantillons = ["eau", "boue", "roche", "bulles"]

copie = echantillons.copy()   # une vraie copie
copie.remove("bulles")        # il retire les bulles de SA copie

print("LUCI :", echantillons)
print("Bolt :", copie)
`,
  retenir: R`@=@ ne copie jamais une liste ni un dictionnaire : il crée un deuxième nom pour le **même** objet. Pour une copie indépendante : @.copy()@ ou @liste[:]@.`,
  apres: [
    { qui: "bolt", expr: "sueur", texte: "Deux listes, enfin. Je ne touche plus aux affaires de LUCI." },
    { qui: "vex", expr: "rire", texte: "Note pour plus tard : ne jamais prêter une liste à Bolt." },
  ],
},
// -----------------------------------------------------------------------------
{
  id: "b03", chap: "e1", type: "code", competence: "completer", xp: 150,
  titre: "Le carnet de la sonde",
  objectif: "Complète le programme pour mettre à jour le planning et la fiche de la sonde.",
  recit: [
    { qui: "luci", texte: "La sonde plongera plusieurs jours. Il faut mettre à jour son **planning** (une liste) et sa **fiche** (un dictionnaire)." },
    { qui: "vex", expr: "serieux", texte: "Chez Abyssal, on m'apprenait à effacer les traces. Ici, c'est l'inverse : on garde tout, proprement." },
  ],
  rappel: {
    titre: "Insérer, étendre, supprimer",
    texte: R`~~~
jours = ["lundi", "jeudi"]
jours.insert(1, "mardi")             # insère à l'indice 1
jours.extend(["vendredi", "samedi"]) # ajoute TOUS les éléments à la fin
jours.append(["dimanche"])           # ⚠️ ajoute la liste comme UN seul élément

fiche = {"nom": "Libellule", "code": "0000"}
del fiche["code"]                    # supprime la clé
fiche["nom"] = "Libellule 2"         # modifie une valeur
~~~`,
    memo: "listes-modifier",
  },
  consigne: R`1. Insère @"mardi"@ à l'indice 1 de @plongees@.
2. Ajoute **tous** les jours de @renforts@ à la fin de @plongees@, en une instruction.
3. Supprime la clé @"code_secret"@ de la fiche @sonde@.
4. La sonde est rechargée : sa @"batterie"@ vaut maintenant @100@.`,
  setup: R`plongees = ["lundi", "jeudi"]
renforts = ["vendredi", "samedi"]
sonde = {"nom": "Libellule", "batterie": 35, "code_secret": "4321", "capteurs": 3}`,
  starter: R`# 1) Insère "mardi" à l'indice 1
plongees.___(___, ___)

# 2) Ajoute tous les renforts à la fin
plongees.___(renforts)

# 3) Supprime la clé "code_secret"
___ sonde[___]

# 4) La batterie vaut 100
___

print(plongees)
print(sonde)
`,
  check: R`
p = var("plongees", list)
s = var("sonde", dict)
att = ["lundi", "mardi", "jeudi", "vendredi", "samedi"]
if ["vendredi", "samedi"] in p:
    echec("La liste @renforts@ a été ajoutée comme **un seul élément** (c'est ce que fait @append@). Pour ajouter ses éléments un par un : @plongees.extend(renforts)@.")
if "mardi" not in p:
    echec("@\"mardi\"@ n'est pas dans le planning : @plongees.insert(1, \"mardi\")@.")
if p.index("mardi") != 1:
    echec("@\"mardi\"@ doit être à l'indice 1. Avec @insert(indice, element)@, l'indice vient en premier.")
if p != att:
    echec("Le planning vaut %s au lieu de %s." % (montre(p), montre(att)))
if "code_secret" in s:
    echec("La clé @\"code_secret\"@ est toujours dans la fiche : @del sonde[\"code_secret\"]@.")
if s.get("batterie") != 100:
    echec("La batterie vaut %s au lieu de 100 : @sonde[\"batterie\"] = 100@." % montre(s.get("batterie")))
if s != {"nom": "Libellule", "batterie": 100, "capteurs": 3}:
    echec("La fiche vaut %s : elle doit garder le nom et les capteurs." % montre(s))
`,
  indices: [
    "@insert@ prend deux paramètres : d'abord l'**indice**, ensuite l'élément.",
    "Pour ajouter plusieurs éléments d'un coup : @extend@. Pour supprimer une clé : le mot-clé @del@.",
    "Les lignes : @plongees.insert(1, \"mardi\")@, @plongees.extend(renforts)@, @del sonde[\"code_secret\"]@, @sonde[\"batterie\"] = 100@.",
  ],
  solution: R`# 1) Insère "mardi" à l'indice 1
plongees.insert(1, "mardi")

# 2) Ajoute tous les renforts à la fin
plongees.extend(renforts)

# 3) Supprime la clé "code_secret"
del sonde["code_secret"]

# 4) La batterie vaut 100
sonde["batterie"] = 100

print(plongees)
print(sonde)
`,
  retenir: R`- @insert(i, x)@ insère à une position précise.
- @extend(autre_liste)@ ajoute tous les éléments ; @append(autre_liste)@ ajouterait la liste comme **un seul** élément.
- @del dico[cle]@ (ou @dico.pop(cle)@) supprime une paire.`,
  apres: [{ qui: "luci", texte: "Planning et fiche à jour. Code secret effacé : je ne garde pas de secrets inutiles." }],
},
// -----------------------------------------------------------------------------
{
  id: "b04", chap: "e1", type: "parsons", competence: "concevoir", xp: 150,
  titre: "Les flacons numérotés",
  objectif: "Remets les lignes dans l'ordre pour numéroter les flacons à partir de 1, puis afficher leur nombre.",
  recit: [
    { qui: "nour", texte: "J'ai rempli 4 flacons d'eau du lac. Il faut une étiquette pour chacun : « Flacon 1 : … »." },
    { qui: "luci", texte: "Les humains comptent à partir de 1. Moi, à partir de 0. Il faudra **décaler** de 1." },
    { qui: "huit", expr: "malin", texte: "…♪" },
    { qui: "bolt", expr: "choc", type: "cri", texte: "Il a mélangé les lignes. ENCORE !" },
  ],
  rappel: {
    titre: "Indice et élément en même temps : enumerate",
    texte: R`~~~
outils = ["lampe", "sonar"]
for i, outil in enumerate(outils):   # i = 0, 1…   outil = "lampe", "sonar"
    print(i + 1, outil)               # 1 lampe, puis 2 sonar
~~~
@enumerate@ donne à chaque tour la paire (indice, élément).`,
    memo: "listes-parcours",
  },
  setup: R`flacons = ["eau de surface", "eau à 1 m", "boue", "roche"]`,
  parsons: {
    lignes: [
      "for i, contenu in enumerate(flacons):",
      "    numero = i + 1",
      "    print(\"Flacon\", numero, \":\", contenu)",
      "print(\"Total :\", len(flacons), \"flacons\")",
    ],
    distracteurs: ["numero = i", "for i in flacons:"],
  },
  check: R`
att = ["Flacon 1 : eau de surface", "Flacon 2 : eau à 1 m", "Flacon 3 : boue", "Flacon 4 : roche", "Total : 4 flacons"]
if lignes and lignes[0].startswith("Flacon 0"):
    echec("La numérotation commence à 0 : il faut @numero = i + 1@.")
nb = len([l for l in lignes if l.startswith("Total")])
if nb > 1:
    echec("Le total s'affiche plusieurs fois : sa ligne doit être après la boucle, sans décalage.")
if nb == 0:
    echec("Il manque la ligne qui affiche le total.")
if len([l for l in lignes if l.startswith("Flacon")]) == 1:
    echec("Un seul flacon s'affiche : le @print@ des flacons doit être **dans** la boucle (décalé).")
if lignes != att:
    echec("L'affichage n'est pas encore le bon. Attendu : une ligne par flacon (de 1 à 4), puis le total.")
`,
  indices: [
    "La boucle utilise @enumerate@ pour avoir l'indice ET le contenu. La ligne @for i in flacons:@ est un piège.",
    "Dans la boucle (décalées) : calculer @numero = i + 1@, puis afficher. La ligne @numero = i@ est un piège.",
    "Ordre : la boucle avec @enumerate@, @numero = i + 1@ (décalée), le @print@ du flacon (décalé), puis le @print@ du total (pas décalé).",
  ],
  solution: R`for i, contenu in enumerate(flacons):
    numero = i + 1
    print("Flacon", numero, ":", contenu)
print("Total :", len(flacons), "flacons")`,
  retenir: R`@enumerate(liste)@ donne les paires (indice, élément) : plus lisible que @range(len(liste))@ quand on a besoin des deux. Pour numéroter à partir de 1, on ajoute 1 à l'indice.`,
  apres: [{ qui: "nour", expr: "sourire", texte: "Flacon 1, flacon 2… Tout est étiqueté. Merci !" }],
},
// -----------------------------------------------------------------------------
{
  id: "b05", chap: "e1", type: "trace", competence: "comprendre", xp: 150,
  titre: "Les couches du fond",
  objectif: "Fais tourner la fonction @est_triee@ à la main : remplis le tableau, tour par tour.",
  recit: [
    { qui: "luci", texte: "Au fond du lac, les couches de vase s'empilent : plus on descend, plus elles sont anciennes. La fonction @est_triee@ vérifie que les âges sont bien rangés." },
    { qui: "nour", texte: "Fais-la tourner à la main. Je veux être sûre qu'elle ne se trompe pas." },
  ],
  rappel: {
    titre: "Vérifier qu'une liste est triée",
    texte: R`On compare chaque élément au **suivant**.
- @range(len(tab) - 1)@ s'arrête **un tour avant la fin**, pour que @tab[i + 1]@ existe toujours.
- @return@ **arrête immédiatement** la fonction, même au milieu d'une boucle.`,
    memo: "algo-trie",
  },
  code: R`def est_triee(tab):
    for i in range(len(tab) - 1):
        if tab[i] > tab[i + 1]:
            return False
    return True

ages = [100, 250, 250, 600, 900]
print(est_triee(ages))`,
  trace: {
    avant: [
      { q: "Combien vaut @len(ages) - 1@ ?", rep: ["4"], aide: "ages contient 5 éléments : 5 - 1 = 4." },
      { q: "Combien de tours la boucle fait-elle au maximum ?", rep: ["4"], aide: "range(4) donne 0, 1, 2, 3 : quatre tours." },
    ],
    colonnes: [
      { titre: "Tour", type: "texte" },
      { titre: "i", type: "texte", aide: "i prend les valeurs de range(4) : 0, 1, 2, 3." },
      { titre: "tab[i]", type: "texte", aide: "Lis l'élément d'indice i dans ages (l'indice 0 vaut 100)." },
      { titre: "tab[i+1]", type: "texte", aide: "C'est l'élément juste après tab[i]." },
      { titre: "tab[i] > tab[i+1]", type: "bool", aide: "Attention : 250 > 250 est False (ils sont égaux)." },
    ],
    lignes: [
      ["1", "0", "100", "250", "False"],
      ["2", "1", "250", "250", "False"],
      ["3", "2", "250", "600", "False"],
      ["4", "3", "600", "900", "False"],
    ],
    donnees: [[true, false, false, false, false], [true, false, false, false, false], [true, false, false, false, false], [true, false, false, false, false]],
    apres: [
      { q: "Que renvoie @est_triee(ages)@ ?", rep: ["True", "vrai"], aide: "La condition n'est jamais vraie : la boucle va jusqu'au bout, puis la fonction renvoie True." },
      { q: "Avec @est_triee([100, 600, 250, 900])@, combien de tours de boucle sont faits ?", rep: ["2"], aide: "Au tour 2, 600 > 250 est vrai : return False arrête tout de suite la fonction." },
      { q: "Et que renvoie @est_triee([100, 600, 250, 900])@ ?", rep: ["False", "faux"], aide: "600 > 250 : la liste n'est pas triée." },
    ],
  },
  indices: [
    "Commence par la colonne i : 0, 1, 2, 3.",
    "Pour chaque ligne, lis @ages[i]@ et @ages[i + 1]@ dans [100, 250, 250, 600, 900].",
    "Toutes les comparaisons sont fausses (même 250 > 250), donc la fonction renvoie True.",
  ],
  retenir: R`La boucle s'arrête **un tour avant la fin** grâce à @range(len(tab) - 1)@, et @return False@ interrompt la fonction dès qu'on trouve deux éléments dans le mauvais ordre. @return True@ est **après** la boucle : on ne peut conclure qu'après avoir tout vérifié.`,
  apres: [{ qui: "luci", texte: "Couches dans l'ordre. Le fond du lac raconte son histoire, page après page." }],
},
// -----------------------------------------------------------------------------
{
  id: "b06", chap: "e1", type: "code", competence: "completer", xp: 180,
  titre: "Dans les deux sens",
  objectif: "Complète la fonction pour qu'elle vérifie aussi l'ordre décroissant.",
  recit: [{ qui: "luci", texte: "La température, elle, **baisse** quand on descend. Ma fonction doit savoir vérifier les deux sens : croissant et décroissant." }],
  rappel: {
    titre: "Paramètre par défaut",
    texte: R`Dans @def est_triee(tab, ordre="croissant"):@, le paramètre @ordre@ a une **valeur par défaut**.
~~~
est_triee([1, 2, 3])                   # ordre vaut "croissant"
est_triee([3, 2, 1], "decroissant")    # ordre vaut "decroissant"
~~~
Dans l'ordre décroissant, il y a un problème quand un élément est **plus petit** que le suivant.`,
    memo: "algo-trie",
  },
  consigne: R`Complète la partie @else@ : la fonction renvoie @True@ si @tab@ est trié dans l'ordre demandé, @False@ sinon.`,
  setup: "",
  starter: R`def est_triee(tab, ordre="croissant"):
    if ordre == "croissant":
        for i in range(len(tab) - 1):
            if tab[i] > tab[i + 1]:
                return False
        return True
    else:
        for i in range(len(tab) - 1):
            if ___:
                return ___
        return ___


print(est_triee([2, 5, 9]))                    # True
print(est_triee([31, 28, 24], "decroissant"))  # True
print(est_triee([24, 31, 28], "decroissant"))  # False
`,
  check: R`
f = fonction("est_triee")
tests = [
    (([600, 645, 730, 730, 815],), True), (([5, 3, 1],), False), (([1, 3, 2],), False), (([42],), True),
    (([5, 3, 1], "decroissant"), True), (([815, 730, 730, 600], "decroissant"), True),
    (([7, 8, 9], "decroissant"), False), (([9, 7, 8], "decroissant"), False), (([4, 4, 4], "decroissant"), True), (([42], "decroissant"), True),
]
for args, att in tests:
    r = appel(f, *args)
    if isinstance(r, str):
        echec("Ta fonction renvoie le texte %s : renvoie le booléen @True@ ou @False@, sans guillemets." % montre(r))
    if r is None:
        echec("@est_triee%s@ ne renvoie rien (None). Il manque un @return@ ?" % montre(args))
    if r != att:
        echec("@est_triee%s@ renvoie %s au lieu de %s." % (montre(args), montre(r), montre(att)))
`,
  indices: [
    "Dans l'ordre décroissant, il y a un problème si un élément est **plus petit** que le suivant.",
    "Dès qu'on trouve un problème, on renvoie @False@. Si la boucle se termine sans problème, on renvoie @True@.",
    "Les trois trous : @tab[i] < tab[i + 1]@, @False@, @True@.",
  ],
  solution: R`def est_triee(tab, ordre="croissant"):
    if ordre == "croissant":
        for i in range(len(tab) - 1):
            if tab[i] > tab[i + 1]:
                return False
        return True
    else:
        for i in range(len(tab) - 1):
            if tab[i] < tab[i + 1]:
                return False
        return True


print(est_triee([2, 5, 9]))                    # True
print(est_triee([31, 28, 24], "decroissant"))  # True
print(est_triee([24, 31, 28], "decroissant"))  # False
`,
  retenir: R`Défi : une version très courte existe avec @all()@ :
~~~
def est_triee(tab, ordre="croissant"):
    if ordre == "croissant":
        return all(tab[i] <= tab[i + 1] for i in range(len(tab) - 1))
    return all(tab[i] >= tab[i + 1] for i in range(len(tab) - 1))
~~~`,
  apres: [
    { qui: "cap", expr: "sourire", texte: "Expédition du lac terminée. Tout est publié, ouvert à tous les chercheurs. Abyssal arrive trop tard." },
    { qui: "huit", expr: "rire", texte: "♪" },
  ],
},
// =================== EXPÉDITION 2 : LE GRAND RECENSEMENT =====================
{
  id: "b07", chap: "e2", type: "etapes", competence: "reperer", xp: 150,
  titre: "Le tableau du recensement",
  objectif: "Trouve des valeurs dans le tableau @releve@ grâce à leur ligne et leur colonne.",
  recit: [
    { qui: "narration", decor: "espece:barriere", texte: "Abyssal publie une vidéo : « Le récif de Mayotte est mort, il n'y a plus rien à protéger. » C'est faux." },
    { qui: "cap", expr: "colere", texte: "Ils veulent qu'on oublie ce récif. On va prouver qu'il est vivant. Avec des chiffres." },
    { qui: "luci", texte: "6 stations visitées. Tout est rangé dans un **tableau** : une liste de listes. On lit une case avec deux indices : la **ligne**, puis la **colonne**." },
  ],
  replique: {
    q: "Comment lit-on une case du tableau @releve@ ?",
    choix: ["Avec deux indices : d'abord la ligne, puis la colonne.", "Avec un seul indice.", "D'abord la colonne, puis la ligne."],
    bonne: 0,
    retours: {
      1: { qui: "luci", texte: "Un seul indice donne une **ligne entière**. Pour une case, il en faut deux." },
      2: { qui: "luci", expr: "serieux", texte: "Inversé. D'abord la **ligne**, puis la **colonne**." },
    },
  },
  rappel: {
    titre: "Une liste de listes (un tableau)",
    texte: R`Chaque élément de @releve@ est une liste : une **ligne** du tableau.
~~~
releve[0]       # la ligne d'en-tête : les titres des colonnes
releve[1]       # la 1re station : ['Jardin de corail', 120, 35, 2]
releve[1][0]    # ligne 1, colonne 0 : 'Jardin de corail'
releve[1][1]    # ligne 1, colonne 1 : 120 (poissons)
~~~
⚠️ La ligne 0 contient les **titres**, pas une station.`,
    memo: "tableaux",
  },
  donnees: { releve: RELEVE_JS },
  setup: RELEVE,
  etapes: [
    { type: "case", donnee: "releve", q: "Clique sur la case @releve[1][0]@.", bonne: [1, 0],
      expl: "Ligne 1, colonne 0 : le nom de la première station, @\"Jardin de corail\"@.",
      pieges: { "0,1": "Tu as inversé : le **premier** indice est la ligne, le second la colonne.", "0,0": "La ligne 0 est l'en-tête. Il faut la ligne 1." },
      aide: "Les numéros à gauche sont les lignes, ceux du haut sont les colonnes." },
    { type: "case", donnee: "releve", q: "Clique sur le nombre de **tortues** de la station « Grand herbier ».", bonne: [3, 3],
      expl: "Grand herbier est à la ligne 3, et les tortues sont dans la colonne 3 : @releve[3][3]@ vaut 6.",
      aide: "Trouve d'abord la ligne de « Grand herbier », puis la colonne « tortues »." },
    { type: "choix", q: "Que contient @releve[0]@ ?",
      choix: ["La ligne des titres : @['station', 'poissons', 'coraux', 'tortues']@", "La première station", "Le nombre 120"], bonne: 0,
      expl: "@releve[0]@ est la ligne d'en-tête : elle donne le nom de chaque colonne.",
      pieges: { 1: "La première station est à la ligne 1. La ligne 0, ce sont les titres.", 2: "Avec un seul indice, on obtient une **ligne entière** (une liste)." } },
    { type: "choix", q: "Que vaut @releve[4][1]@ ?", montrer: "releve",
      choix: ["150", "28", "@\"Arche\"@", "95"], bonne: 0,
      expl: "Ligne 4 : Arche. Colonne 1 : les poissons. @releve[4][1]@ vaut 150.",
      pieges: { 1: "28, c'est la colonne 2 (les coraux).", 2: "Le nom est dans la colonne 0.", 3: "95 est à la ligne 5. Compte les lignes depuis 0 (l'en-tête)." } },
    { type: "saisie", q: "Combien y a-t-il de **stations** dans le tableau ? (Attention à l'en-tête !)", rep: ["6"], placeholder: "un nombre",
      expl: "@len(releve)@ vaut 7, mais il faut enlever l'en-tête : 6 stations.",
      pieges: { "7": "7, c'est le nombre de lignes, en-tête compris. Combien de **stations** ?" } },
    { type: "choix", q: "Quelle écriture donne le nombre de **coraux** de la **dernière** station ?",
      choix: ["@releve[-1][2]@", "@releve[2][-1]@", "@releve[-1]@"], bonne: 0,
      expl: "@releve[-1]@ est la dernière ligne, et @[2]@ sa colonne « coraux ».",
      pieges: { 1: "Le premier indice est la ligne : @-1@ doit être en premier.", 2: "@releve[-1]@ donne toute la ligne. Il faut un deuxième indice pour la colonne." } },
  ],
  retenir: R`Dans un tableau (liste de listes) : @tab[ligne][colonne]@. Le premier indice choisit la ligne, le second l'élément dans cette ligne. Quand il y a une ligne d'en-tête, on la saute : @tab[1:]@ ou @range(1, len(tab))@.`,
  apres: [{ qui: "luci", texte: "Tableau maîtrisé. Passons aux calculs." }],
},
// -----------------------------------------------------------------------------
{
  id: "b08", chap: "e2", type: "code", competence: "ecrire", xp: 180,
  titre: "La station la plus riche",
  objectif: "Écris la fonction @plus_riche(tab)@ qui renvoie le nom et le total de la station la plus peuplée.",
  recit: [
    { qui: "bolt", texte: "Quelle station a le plus d'animaux en tout ? Poissons, coraux et tortues compris. Je parie sur l'Arche !" },
    { qui: "vex", expr: "malin", texte: "Moi, je parie que ta fonction va oublier l'en-tête du tableau." },
  ],
  rappel: {
    titre: "Le maximum dans un tableau",
    texte: R`@tab[1:]@ donne toutes les lignes **sauf l'en-tête**.
~~~
for ligne in releve[1:]:
    total = ligne[1] + ligne[2] + ligne[3]
    print(ligne[0], total)
~~~
Ensuite, c'est l'algorithme du maximum : on garde le meilleur total **et** le nom qui va avec.`,
    memo: "algo-maximum",
  },
  avant: [
    { type: "phrase", q: "Explique ton plan avant d'écrire la fonction.",
      phrase: "Je parcours les lignes du tableau {{0}}. Pour chaque station, je calcule {{1}}, et je garde {{2}}.",
      trous: [
        { choix: ["en sautant l'en-tête (avec @tab[1:]@)", "en commençant par l'en-tête"], bonne: 0, aide: "La ligne 0 contient des titres, pas des nombres : on la saute avec @tab[1:]@." },
        { choix: ["son total d'animaux", "son nom"], bonne: 0, aide: "On compare des **totaux** : poissons + coraux + tortues." },
        { choix: ["le plus grand total vu jusqu'ici, avec le nom", "le dernier total calculé"], bonne: 0, aide: "C'est l'algorithme du **maximum** : un champion, et son nom." },
      ],
      expl: "Parcours sans l'en-tête, un total par station, puis l'algorithme du maximum." },
  ],
  consigne: R`Écris @plus_riche(tab)@ : elle renvoie @(nom, total)@ pour la station qui a le plus d'animaux au total (poissons + coraux + tortues).
- Attendu : @plus_riche(releve)@ renvoie @("Arche", 179)@.
- Ta fonction sera aussi testée sur d'autres tableaux (en cas d'égalité, garde la première station).`,
  setup: RELEVE,
  starter: R`def plus_riche(tab):
    # renvoie (nom, total) de la station la plus peuplée
    # attention : la ligne 0 est l'en-tête !
    ...


print(plus_riche(releve))
`,
  check: R`
f = fonction("plus_riche")
H = ["station", "poissons", "coraux", "tortues"]
tests = [
    (D["releve"], ("Arche", 179)),
    ([H, ["A", 1, 0, 0], ["B", 7, 0, 0], ["C", 3, 0, 0]], ("B", 7)),
    ([H, ["A", 9, 1, 1], ["B", 2, 8, 8]], ("B", 18)),
    ([H, ["A", 5, 0, 0], ["B", 0, 5, 0]], ("A", 5)),
    ([H, ["Seule", 0, 0, 0]], ("Seule", 0)),
]
for tab, att in tests:
    r = appel(f, tab)
    if r is None:
        echec("Ta fonction ne renvoie rien : il faut un @return nom, total@ à la fin.")
    if not isinstance(r, (tuple, list)) or len(r) != 2:
        echec("Ta fonction doit renvoyer deux valeurs (nom, total), pas %s." % montre(r))
    r = tuple(r)
    if r[0] == "station":
        echec("Ta fonction renvoie la ligne d'en-tête : la boucle ne doit pas regarder la ligne 0.")
    if tab is D["releve"] and r == ("Arche", 150):
        echec("Tu ne comptes que les poissons. Le total, c'est @ligne[1] + ligne[2] + ligne[3]@.")
    if r != att:
        echec("Avec le tableau %s, ta fonction renvoie %s au lieu de %s." % (montre(tab, 200), montre(r), montre(att)))
`,
  indices: [
    "Parcours @tab[1:]@ (sans l'en-tête). Pour chaque ligne, calcule @total = ligne[1] + ligne[2] + ligne[3]@.",
    "Avant la boucle : @meilleur = None@ et @maxi = -1@. Dans la boucle : si @total > maxi@, retiens @ligne[0]@ et @total@.",
    "Squelette : @meilleur = None@ / @maxi = -1@ / @for ligne in tab[1:]:@ / calcul du total / @if total > maxi:@ / mise à jour / @return meilleur, maxi@.",
  ],
  solution: R`def plus_riche(tab):
    meilleur = None
    maxi = -1
    for ligne in tab[1:]:
        total = ligne[1] + ligne[2] + ligne[3]
        if total > maxi:
            meilleur = ligne[0]
            maxi = total
    return meilleur, maxi


print(plus_riche(releve))
`,
  retenir: R`Démarrer avec @maxi = -1@ garantit que la première station deviendra championne (un total vaut au moins 0). Une fonction peut renvoyer **plusieurs valeurs** : @return a, b@ renvoie le tuple @(a, b)@.`,
  apres: [
    { qui: "bolt", expr: "rire", texte: "L'Arche ! J'avais raison !" },
    { qui: "vex", expr: "sueur", texte: "…Et l'en-tête n'a pas été compté. D'accord, bien joué." },
  ],
},
// -----------------------------------------------------------------------------
{
  id: "b09", chap: "e2", type: "code", competence: "completer", xp: 160,
  titre: "Changer de rangement",
  objectif: "Complète la fonction qui transforme le tableau en dictionnaire de dictionnaires.",
  recit: [{ qui: "luci", texte: "Pour lire les coraux de l'Arche, il faut savoir que l'Arche est à la ligne 4… Pas pratique. Rangeons tout dans un **dictionnaire de dictionnaires**." }],
  rappel: {
    titre: "Un dictionnaire de dictionnaires",
    texte: R`~~~
stations = {
    "Jardin de corail": {"poissons": 120, "coraux": 35, "tortues": 2},
    "Tombant bleu":     {"poissons": 85, "coraux": 20, "tortues": 0},
}
print(stations["Tombant bleu"])             # {'poissons': 85, ...}
print(stations["Tombant bleu"]["coraux"])   # 20
~~~
On accède directement à une station par son **nom**.`,
    memo: "tableaux",
  },
  consigne: R`Complète @vers_dico(tab)@ : elle transforme la liste de listes en dictionnaire de dictionnaires, comme dans le rappel (sans l'en-tête).`,
  setup: RELEVE,
  starter: R`def vers_dico(tab):
    resultat = {}
    for ligne in tab[1:]:
        nom = ligne[0]
        resultat[___] = {"poissons": ___, "coraux": ___, "tortues": ___}
    return resultat


stations = vers_dico(releve)
print(stations["Arche"]["coraux"])   # doit afficher 28
`,
  check: R`
f = fonction("vers_dico")
H = ["station", "poissons", "coraux", "tortues"]
def attendu(tab):
    return {l[0]: {"poissons": l[1], "coraux": l[2], "tortues": l[3]} for l in tab[1:]}
for tab in (D["releve"], [H, ["A", 9, 1, 1], ["B", 2, 8, 8]]):
    r = appel(f, tab)
    if not isinstance(r, dict):
        echec("@vers_dico@ doit renvoyer un dictionnaire, pas %s." % montre(r))
    if "station" in r:
        echec("Le dictionnaire contient la clé @\"station\"@ : il ne faut pas transformer la ligne d'en-tête.")
    if r != attendu(tab):
        echec("Avec %s, ta fonction renvoie %s au lieu de %s." % (montre(tab, 120), montre(r, 200), montre(attendu(tab), 200)))
var("stations", dict)
if "28" not in lignes:
    echec("Garde la dernière ligne : @print(stations[\"Arche\"][\"coraux\"])@ doit afficher 28.")
`,
  indices: [
    "La clé du grand dictionnaire, c'est le nom de la station : la variable @nom@.",
    "Les valeurs : les poissons sont dans @ligne[1]@, les coraux dans @ligne[2]@, les tortues dans @ligne[3]@.",
    "La ligne complète : @resultat[nom] = {\"poissons\": ligne[1], \"coraux\": ligne[2], \"tortues\": ligne[3]}@.",
  ],
  solution: R`def vers_dico(tab):
    resultat = {}
    for ligne in tab[1:]:
        nom = ligne[0]
        resultat[nom] = {"poissons": ligne[1], "coraux": ligne[2], "tortues": ligne[3]}
    return resultat


stations = vers_dico(releve)
print(stations["Arche"]["coraux"])   # doit afficher 28
`,
  retenir: R`Transformer une structure en une autre : une boucle sur les lignes, et à chaque tour on **ajoute une paire** au dictionnaire résultat. @stations["Arche"]["coraux"]@ se lit bien mieux que @releve[4][2]@.`,
  apres: [{ qui: "luci", texte: "Nouveau rangement prêt. Je peux répondre à toutes les questions." }],
},
// -----------------------------------------------------------------------------
{
  id: "b10", chap: "e2", type: "commande", competence: "ecrire", xp: 160,
  titre: "Les questions de LUCI",
  objectif: "Réponds aux questions de LUCI avec des commandes sur le dictionnaire @stations@.",
  recit: [
    { qui: "luci", texte: "Les données sont rangées dans @stations@ : un dictionnaire de dictionnaires. Interroge-le, et mets-le à jour." },
    { qui: "nour", expr: "serieux", texte: "Chaque chiffre compte : c'est notre réponse à la vidéo d'Abyssal." },
  ],
  rappel: {
    titre: "Lire et modifier un dictionnaire de dictionnaires",
    texte: R`~~~
>>> stations["Arche"]
{'poissons': 150, 'coraux': 28, 'tortues': 1}
>>> stations["Arche"]["poissons"]
150
>>> stations["Arche"]["poissons"] = stations["Arche"]["poissons"] + 10
>>> stations["Récif rose"] = {"poissons": 5, "coraux": 9, "tortues": 0}
>>> "Arche" in stations
True
~~~`,
    memo: "tableaux",
  },
  setup: RELEVE + "\n" + STATIONS,
  commandes: [
    { consigne: "Affiche toutes les informations de la station @\"Arche\"@.",
      check: R`
verifie(utilise(r"stations\s*\["), "Lis la station avec sa clé : @stations[\"...\"]@.")
verifie(resultat == D["stations"]["Arche"], "Ce ne sont pas les informations de l'Arche.")`,
      solution: "stations[\"Arche\"]", indice: "@stations[\"Arche\"]@.", reponse: "L'Arche : 150 poissons, 28 coraux, 1 tortue." },
    { consigne: "Affiche le nombre de **coraux** de la station @\"Tombant bleu\"@.",
      check: R`
verifie(utilise(r"stations\s*\[[^\]]*\]\s*\["), "Il faut deux paires de crochets : la station, puis l'information.")
verifie(resultat == 20, "Ce n'est pas le nombre de coraux du Tombant bleu.")`,
      solution: "stations[\"Tombant bleu\"][\"coraux\"]", indice: "@stations[\"Tombant bleu\"][\"coraux\"]@.", reponse: "20 coraux." },
    { consigne: "On a vu **2 tortues de plus** au @\"Grand herbier\"@ : ajoute 2 à sa valeur.",
      check: R`
t = var("stations", dict)["Grand herbier"]["tortues"]
if t == 2:
    echec("Tu as remplacé la valeur par 2 : il faut **ajouter** 2 à l'ancienne valeur.")
verifie(t == 8, "Le Grand herbier a maintenant %s tortues au lieu de 8 (6 + 2)." % montre(t))`,
      solution: "stations[\"Grand herbier\"][\"tortues\"] = stations[\"Grand herbier\"][\"tortues\"] + 2",
      indice: "On prend l'ancienne valeur et on ajoute 2 : @stations[\"Grand herbier\"][\"tortues\"] = stations[\"Grand herbier\"][\"tortues\"] + 2@ (ou @+= 2@).",
      reponse: "8 tortues au Grand herbier. Elles adorent les herbiers." },
    { consigne: "Ajoute la station @\"Île au sable\"@ : 30 poissons, 0 corail, 4 tortues (mêmes clés que les autres).",
      check: R`
s = var("stations", dict)
cle = "Île au sable" if "Île au sable" in s else "Ile au sable"
verifie(cle in s, "La station @\"Île au sable\"@ n'existe pas encore : @stations[\"Île au sable\"] = {...}@.")
v = s[cle]
verifie(isinstance(v, dict), "La valeur doit être un dictionnaire : @{\"poissons\": 30, \"coraux\": 0, \"tortues\": 4}@.")
verifie(set(v) == {"poissons", "coraux", "tortues"}, "Utilise les mêmes clés que les autres stations : @\"poissons\"@, @\"coraux\"@, @\"tortues\"@.")
verifie(v == {"poissons": 30, "coraux": 0, "tortues": 4}, "Les nombres ne sont pas les bons : 30 poissons, 0 corail, 4 tortues.")`,
      solution: "stations[\"Île au sable\"] = {\"poissons\": 30, \"coraux\": 0, \"tortues\": 4}",
      indice: "On ajoute une clé avec @=@, et la valeur est un petit dictionnaire : @stations[\"Île au sable\"] = {\"poissons\": 30, \"coraux\": 0, \"tortues\": 4}@.",
      reponse: "Nouvelle station enregistrée." },
    { consigne: "La station @\"Passe sud\"@ existe-t-elle ? Pose la question avec @in@.",
      check: R`
verifie(utilise(r"\bin\b"), "Utilise le mot @in@.")
verifie(resultat is False, "La réponse doit être @True@ ou @False@ : @\"Passe sud\" in stations@.")`,
      solution: "\"Passe sud\" in stations", indice: "@\"Passe sud\" in stations@.", reponse: "False : pas encore visitée." },
    { consigne: "Combien de stations y a-t-il maintenant ?",
      check: R`
verifie(utilise(r"\blen\s*\("), "Utilise @len@.")
verifie(resultat == 7, "Compte les clés de @stations@ : @len(stations)@.")`,
      solution: "len(stations)", indice: "@len(stations)@.", reponse: "7 stations recensées." },
  ],
  retenir: R`- @d[cle1][cle2]@ lit une information dans un dictionnaire de dictionnaires.
- On modifie avec @=@ : pour **ajouter** à une valeur, on reprend l'ancienne (@x = x + 2@ ou @x += 2@).
- @cle in d@ teste l'existence d'une clé ; @len(d)@ compte les clés.`,
  apres: [{ qui: "luci", texte: "Toutes les questions ont une réponse. Encore un effort." }],
},
// -----------------------------------------------------------------------------
{
  id: "b11", chap: "e2", type: "code", competence: "completer", xp: 180,
  titre: "Les championnes par espèce",
  objectif: "Complète deux fonctions : la meilleure station pour une espèce, et le total d'une espèce.",
  recit: [{ qui: "nour", texte: "Pour chaque espèce, je veux savoir quelle station en a le plus. Et combien on en a vu en tout." }],
  rappel: {
    titre: "Parcourir un dictionnaire de dictionnaires",
    texte: R`~~~
for nom, infos in stations.items():
    print(nom, infos["poissons"])    # infos est le petit dictionnaire de la station
~~~
La clé de l'espèce peut être une **variable** : si @espece = "coraux"@, alors @infos[espece]@ vaut @infos["coraux"]@.`,
    memo: "dicos-parcours",
  },
  consigne: R`1. @meilleure_station(d, espece)@ renvoie le **nom** de la station qui a le plus de cette espèce.
2. @total_espece(d, espece)@ renvoie le **total** de cette espèce sur toutes les stations.`,
  setup: RELEVE + "\n" + STATIONS,
  starter: R`def meilleure_station(d, espece):
    meilleur = None
    maxi = -1
    for nom, infos in d.items():
        if ___ > maxi:
            meilleur = ___
            maxi = ___
    return meilleur


def total_espece(d, espece):
    total = 0
    for infos in d.values():
        total = ___
    return total


print(meilleure_station(stations, "coraux"))   # Patate aux mérous
print(total_espece(stations, "tortues"))       # 12
`,
  check: R`
m = fonction("meilleure_station")
t = fonction("total_espece")
S = D["stations"]
for esp, att in (("coraux", "Patate aux mérous"), ("poissons", "Arche"), ("tortues", "Grand herbier")):
    r = appel(m, S, esp)
    if isinstance(r, (int, float)) and not isinstance(r, bool):
        echec("@meilleure_station@ renvoie un nombre (%s) : elle doit renvoyer le **nom** de la station." % montre(r))
    if r != att:
        echec("@meilleure_station(stations, %s)@ renvoie %s au lieu de %s." % (montre(esp), montre(r), montre(att)))
autre = {"A": {"poissons": 1, "coraux": 0, "tortues": 0}, "B": {"poissons": 6, "coraux": 0, "tortues": 0}}
if appel(m, autre, "poissons") != "B":
    echec("Avec un autre dictionnaire, @meilleure_station@ ne donne pas le bon nom.")
for esp, att in (("tortues", 12), ("poissons", 550), ("coraux", 137)):
    r = appel(t, S, esp)
    if r == S["Passe nord"][esp]:
        echec("@total_espece@ renvoie seulement la dernière valeur : il faut **ajouter** à chaque tour (@total = total + ...@).")
    if r != att:
        echec("@total_espece(stations, %s)@ renvoie %s au lieu de %s." % (montre(esp), montre(r), att))
`,
  indices: [
    "Dans la boucle, @infos[espece]@ est le nombre d'animaux de l'espèce demandée pour cette station.",
    "Le champion est le **nom** de la station (@nom@), et @maxi@ garde @infos[espece]@. Pour le total : on ajoute @infos[espece]@.",
    "Les trous : @infos[espece]@, @nom@, @infos[espece]@, puis @total + infos[espece]@.",
  ],
  solution: R`def meilleure_station(d, espece):
    meilleur = None
    maxi = -1
    for nom, infos in d.items():
        if infos[espece] > maxi:
            meilleur = nom
            maxi = infos[espece]
    return meilleur


def total_espece(d, espece):
    total = 0
    for infos in d.values():
        total = total + infos[espece]
    return total


print(meilleure_station(stations, "coraux"))   # Patate aux mérous
print(total_espece(stations, "tortues"))       # 12
`,
  retenir: R`Une clé peut être une **variable** : @infos[espece]@. Une seule fonction sert alors pour toutes les espèces. @.values()@ parcourt seulement les valeurs, quand on n'a pas besoin des clés.`,
  apres: [{ qui: "luci", texte: "La Patate aux mérous est la reine des coraux. Recensement presque terminé." }],
},
// -----------------------------------------------------------------------------
{
  id: "b12", chap: "e2", type: "etapes", competence: "expliquer", xp: 140,
  titre: "Le bon rangement",
  objectif: "Explique quelle structure choisir : liste, dictionnaire ou tuple.",
  recit: [
    { qui: "vex", texte: "Liste de listes ou dictionnaire de dictionnaires ? Chez Abyssal, on mettait tout dans un seul fichier géant." },
    { qui: "luci", expr: "serieux", texte: "Il n'y a pas de mauvaise structure, seulement des structures plus ou moins adaptées. Explique-lui." },
  ],
  rappel: {
    titre: "Choisir sa structure",
    texte: R`- **Liste** @[ ]@ : des éléments dans un **ordre**, repérés par leur position (0, 1, 2…).
- **Dictionnaire** @{ }@ : des valeurs repérées par une **clé** (un nom, un identifiant…).
- **Tuple** @( )@ : comme une liste, mais **non modifiable**.`,
    memo: "choisir",
  },
  etapes: [
    { type: "choix", q: "Pour lire les coraux de l'Arche, quelle écriture est la plus claire ?",
      choix: ["@releve[4][2]@", "@stations[\"Arche\"][\"coraux\"]@"], bonne: 1,
      expl: "Avec le dictionnaire, le code se lit presque comme une phrase. Avec la liste, il faut savoir que l'Arche est à la ligne 4 et les coraux en colonne 2.",
      pieges: { 0: "Ça marche, mais il faut connaître la ligne et la colonne par cœur. Laquelle se lit comme une phrase ?" } },
    { type: "choix", q: "Que se passe-t-il avec @releve[\"Arche\"]@ ?",
      choix: ["On obtient la ligne de l'Arche", "Une erreur @TypeError@ : les indices d'une liste sont des nombres", "On obtient None"], bonne: 1,
      expl: "Une liste ne se lit qu'avec des indices numériques. Pour trouver l'Arche dans @releve@, il faut parcourir les lignes.",
      pieges: { 0: "Une liste n'a pas de clés : ses indices sont 0, 1, 2…", 2: "Python ne renvoie pas None : il s'arrête avec une erreur." } },
    { type: "associer", q: "Relie chaque besoin à la structure la plus adaptée.",
      gauche: ["Les profondeurs mesurées toutes les minutes, dans l'ordre", "La fiche d'une tortue : nom, plage, âge", "Une position GPS qui ne doit jamais changer", "Le nombre d'animaux par espèce"],
      droite: ["une liste", "un dictionnaire (clés : nom, plage, âge)", "un tuple", "un dictionnaire (clé : espèce)"],
      bonnes: [0, 1, 2, 3],
      expl: "Ordre → liste. Accès par un nom → dictionnaire. Données figées → tuple.",
      aide: "Demande-toi : est-ce qu'on cherche par position, par nom, ou est-ce que ça ne change jamais ?" },
    { type: "choix", q: "Comment ajouter la station « Récif rose » dans @stations@ ?",
      choix: ["@stations.append({\"poissons\": 5, \"coraux\": 9, \"tortues\": 0})@", "@stations[\"Récif rose\"] = {\"poissons\": 5, \"coraux\": 9, \"tortues\": 0}@", "@stations[7] = {\"poissons\": 5, \"coraux\": 9, \"tortues\": 0}@"], bonne: 1,
      expl: "On ajoute une paire avec @dico[cle] = valeur@. Un dictionnaire n'a pas de @append@.",
      pieges: { 0: "Un dictionnaire n'a pas de méthode @append@ : on écrit @dico[cle] = valeur@.", 2: "Ça marcherait… mais la clé serait le nombre 7 au lieu du nom de la station !" } },
    { type: "choix", q: "Pourquoi une position GPS est-elle souvent rangée dans un **tuple** plutôt que dans une liste ?",
      choix: ["Parce qu'un tuple ne peut pas être modifié par erreur", "Parce qu'un tuple est toujours plus grand", "Parce qu'on ne peut pas lire un tuple avec des indices"], bonne: 0,
      expl: "Un tuple est **immuable** : impossible de changer une coordonnée par erreur. On le lit pourtant comme une liste : @pos[0]@.",
      pieges: { 2: "On lit un tuple avec des indices, comme une liste : @pos[0]@." } },
  ],
  retenir: R`On choisit la structure selon **comment on va chercher l'information** : par position → liste ; par nom ou identifiant → dictionnaire ; données figées → tuple.`,
  apres: [
    { qui: "cap", expr: "sourire", texte: "Recensement publié. Le récif est vivant, et tout le monde peut le vérifier." },
    { qui: "nour", texte: "Par endroits, le lagon a même une double barrière de corail : une rareté mondiale." },
  ],
},
// ================= EXPÉDITION 3 : LE CHANT DES BALEINES ======================
{
  id: "b13", chap: "e3", type: "etapes", competence: "comprendre", xp: 150,
  titre: "Les tuples de l'hydrophone",
  objectif: "Comprends comment on lit, déballe et remplace un tuple.",
  recit: [
    { qui: "narration", decor: "espece:baleine", texte: "Au large, la Luciole coupe ses moteurs et descend un **hydrophone** : un micro sous-marin. Un chant immense remplit la cabine." },
    { qui: "orsa", expr: "malin", radio: true, texte: "Nos navires passeront ici cette semaine. Si vos baleines n'aiment pas le bruit, qu'elles s'écartent." },
    { qui: "cap", expr: "colere", texte: "Elles viennent ici mettre bas et allaiter. On va repérer leurs groupes et prévenir tous les bateaux." },
    { qui: "luci", texte: "Chaque observation est un **tuple** : (heure, nombre de baleines, groupe). Un tuple ne se modifie pas : on ne réécrit pas le passé." },
  ],
  replique: {
    q: "Qu'est-ce qui distingue un tuple d'une liste ?",
    choix: ["On ne peut pas modifier un tuple.", "Un tuple ne peut contenir que des nombres."],
    bonne: 0,
    retours: { 1: { qui: "luci", texte: "Négatif : @(\"10h12\", 3, \"mère et petit\")@ contient du texte et des nombres. La différence : on ne le **modifie** pas." } },
  },
  rappel: {
    titre: "Le tuple",
    texte: R`Un **tuple** s'écrit entre **parenthèses** et ne peut **pas être modifié**.
~~~
obs = ("10h12", 3, "mère et petit")
print(obs[0])              # 10h12
heure, nb, groupe = obs    # déballage : trois variables d'un coup
print(nb)                  # 3
obs = ("10h12", 4, "mère et petit")   # on remplace le tuple entier
~~~
@obs[1] = 4@ provoque une erreur @TypeError@.`,
    memo: "tuples",
  },
  setup: R`obs = ("10h12", 3, "mère et petit")`,
  etapes: [
    { type: "phrase", q: "Décris la variable @obs = (\"10h12\", 3, \"mère et petit\")@.",
      phrase: "@obs@ est un {{0}}. Comme dans une liste, on lit ses éléments avec un {{1}}. Mais on ne peut pas le {{2}}.",
      trous: [
        { choix: ["tuple", "liste", "dictionnaire"], bonne: 0, aide: "Des éléments entre **parenthèses** : c'est un tuple." },
        { choix: ["indice", "nom de clé"], bonne: 0, aide: "Un tuple est rangé dans l'ordre : on lit avec un **indice**, comme une liste." },
        { choix: ["modifier", "lire", "parcourir"], bonne: 0, aide: "La grande différence avec une liste : un tuple est **immuable**." },
      ],
      expl: "Un **tuple** se lit comme une liste (indices), mais ne se **modifie** pas." },
    { type: "case", nom: "obs", valeur: ["10h12", 3, "mère et petit"], q: "Touche la case @obs[1]@.", bonne: 1,
      expl: "Comme pour une liste, les indices commencent à 0 : @obs[1]@ est le deuxième élément, 3.",
      pieges: { 0: "@\"10h12\"@ est à l'indice 0.", 2: "@\"mère et petit\"@ est à l'indice 2 (le dernier)." } },
    { type: "choix", q: "Que fait @obs[1] = 4@ ?",
      choix: ["Le nombre devient 4", "Python s'arrête : erreur @TypeError@, un tuple ne se modifie pas", "Python ajoute 4 à la fin"], bonne: 1,
      expl: "Un tuple est **immuable** : on ne peut changer aucun de ses éléments.",
      pieges: { 0: "Ce serait vrai pour une liste. Mais un tuple ne peut pas être modifié.", 2: "On n'ajoute rien à un tuple : il ne change pas." } },
    { type: "choix", q: "Comment enregistrer qu'il y avait en fait **4** baleines ?",
      choix: ["@obs = (\"10h12\", 4, \"mère et petit\")@", "@obs.append(4)@", "@obs[1] = obs[1] + 1@"], bonne: 0,
      expl: "On ne modifie pas le tuple : on en **crée un nouveau** et on le range dans la variable.",
      pieges: { 1: "Un tuple n'a pas de méthode @append@.", 2: "Toujours une modification du tuple : erreur @TypeError@." } },
    { type: "trous", q: "Complète pour ranger les trois valeurs du tuple dans trois variables d'un coup.",
      code: "{{0}} = obs\nprint(nb)   # affiche 3",
      trous: [{ choix: ["heure, nb, groupe", "heure + nb + groupe", "[heure]"], bonne: 0, aide: "Le déballage : autant de variables, séparées par des virgules, que d'éléments dans le tuple." }],
      expl: "@heure, nb, groupe = obs@ : c'est le **déballage** d'un tuple." },
    { type: "choix", q: "Une fonction peut renvoyer deux valeurs : @return mini, maxi@. Qu'est-ce qu'elle renvoie vraiment ?",
      choix: ["Un tuple @(mini, maxi)@", "Seulement @mini@", "Une erreur"], bonne: 0,
      expl: "@return a, b@ renvoie le tuple @(a, b)@. On le récupère avec @petit, grand = ma_fonction(...)@.",
      pieges: { 1: "Les deux valeurs sont renvoyées, rangées dans un tuple." } },
  ],
  retenir: R`- Un tuple @( )@ se lit comme une liste (indices, @len@, @in@, boucle @for@), mais ne se **modifie** pas.
- Pour changer une valeur : on crée un **nouveau** tuple.
- Le **déballage** @a, b, c = t@ et le @return a, b@ utilisent des tuples.`,
  apres: [{ qui: "luci", texte: "Ce sont les mâles qui chantent. Leur chant, long et complexe, se répète en boucle." }],
},
// -----------------------------------------------------------------------------
{
  id: "b14", chap: "e3", type: "code", competence: "ecrire", xp: 180,
  titre: "Le chant qui tourne en boucle",
  objectif: "Écris la fonction @unite(t)@ qui renvoie le son chanté à la seconde @t@, grâce au modulo @%@.",
  recit: [
    { qui: "luci", texte: "Le chant de cette baleine est fait de 4 sons qui se répètent : @chant = [\"ououou\", \"grrr\", \"iiiip\", \"boum\"]@. Un son par seconde, puis on recommence au début." },
    { qui: "bolt", expr: "sueur", texte: "Seconde 0 : ououou. Seconde 4 : ououou encore ? Et à la seconde 1 000 ? J'ai pas assez de doigts." },
  ],
  rappel: {
    titre: "Le modulo % : revenir au début",
    texte: R`@a % b@ est le **reste** de la division de a par b.
~~~
print(7 % 4)     # 3   (7 = 1 × 4 + 3)
print(8 % 4)     # 0
print(9 % 4)     # 1
~~~
Avec une liste de 4 éléments, @t % 4@ donne toujours un indice entre 0 et 3 : quand on dépasse la fin, on **revient au début**.
~~~
jours = ["lun", "mar", "mer"]
print(jours[4 % len(jours)])   # mar  (4 % 3 = 1)
~~~`,
    memo: "modulo",
  },
  avant: [
    { type: "phrase", q: "Explique ton plan avant d'écrire la fonction.",
      phrase: "Le chant revient au début tous les {{0}} sons. À la seconde @t@, l'indice du son est {{1}}, un nombre toujours entre 0 et 3.",
      trous: [
        { choix: ["4", "1 000", "2"], bonne: 0, aide: "La liste @chant@ contient **4** sons." },
        { choix: ["@t % 4@", "@t // 4@", "@t - 4@"], bonne: 0, aide: "Le **reste** de la division par 4 (le modulo) est toujours entre 0 et 3." },
      ],
      expl: "Le **modulo** @t % len(chant)@ ramène au début de la liste quand on dépasse la fin." },
  ],
  consigne: R`1. Écris @unite(t)@ : elle renvoie le son chanté à la seconde @t@ (t vaut 0, 1, 2…). Utilise @%@ et @len(chant)@.
2. La boucle donnée affiche ensuite les sons des secondes 0 à 9.`,
  setup: R`chant = ["ououou", "grrr", "iiiip", "boum"]`,
  starter: R`def unite(t):
    ...


for t in range(10):
    print(t, unite(t))
`,
  check: R`
f = fonction("unite")
ch = D["chant"]
for t in (0, 1, 3, 4, 5, 9, 103, 1000):
    r = appel(f, t)
    if r is None:
        echec("@unite(%d)@ ne renvoie rien : il faut un @return@." % t)
    if isinstance(r, int) and not isinstance(r, bool):
        echec("@unite(%d)@ renvoie un nombre (%s) : elle doit renvoyer le **son**, c'est-à-dire @chant[...]@." % (t, r))
    if r != ch[t % 4]:
        echec("@unite(%d)@ renvoie %s au lieu de %s." % (t, montre(r), montre(ch[t % 4])))
if not utilise(r"%"):
    echec("Utilise le modulo @%@ : c'est lui qui fait revenir au début.")
if re.search(r"%\s*4\b", code_ss):
    echec("Ça marche, mais utilise @len(chant)@ plutôt que 4 : si le chant change de longueur, ta fonction restera juste.")
if len(lignes) != 10:
    echec("Garde la boucle finale : elle doit afficher 10 lignes.")
`,
  indices: [
    "À la seconde @t@, l'indice du son est le reste de @t@ divisé par la longueur du chant.",
    "Cet indice s'écrit @t % len(chant)@. Il reste à lire le son à cet indice.",
    "La fonction tient en une ligne : @return chant[t % len(chant)]@.",
  ],
  solution: R`def unite(t):
    return chant[t % len(chant)]


for t in range(10):
    print(t, unite(t))
`,
  retenir: R`@t % n@ donne toujours un nombre entre 0 et n − 1 : parfait pour « tourner en rond » dans une liste (jours de la semaine, joueurs à tour de rôle, chant qui se répète…).`,
  apres: [{ qui: "bolt", expr: "rire", texte: "Seconde 1 000 : ououou ! Le modulo, c'est magique." }],
},
// -----------------------------------------------------------------------------
{
  id: "b15", chap: "e3", type: "code", competence: "completer", xp: 170,
  titre: "La carte des souffles",
  objectif: "Complète le programme pour lire une case de la grille et compter toutes les baleines.",
  recit: [{ qui: "luci", texte: "J'ai découpé la zone en 3 × 3 carrés. Dans chaque carré, j'ai compté les souffles de baleines. C'est une **grille** : une liste de listes." }],
  rappel: {
    titre: "Parcourir une grille : deux boucles",
    texte: R`~~~
g = [[1, 0],
     [2, 5]]
print(g[1][0])          # ligne 1, colonne 0 : 2
total = 0
for ligne in g:         # chaque ligne (une liste)
    for case in ligne:  # chaque case de cette ligne
        total = total + case
print(total)            # 8
~~~
La deuxième boucle est **dans** la première : son contenu est décalé deux fois.`,
    memo: "tableaux",
  },
  consigne: R`1. Range dans @coin@ le nombre de la case en **bas à droite** de la grille.
2. Complète @total_grille(g)@ : elle renvoie la somme de toutes les cases.`,
  setup: R`zone = [[0, 2, 1],
        [3, 0, 0],
        [1, 4, 2]]`,
  starter: R`coin = zone[___][___]

def total_grille(g):
    total = 0
    for ligne in ___:
        for case in ___:
            total = total + ___
    return total


print(coin)                 # 2
print(total_grille(zone))   # 13
`,
  check: R`
c = var("coin")
if c == 1:
    echec("@coin@ vaut 1 : c'est la case en bas à **gauche**. La colonne de droite est la colonne 2 (ou -1).")
if c != 2:
    echec("@coin@ vaut %s. En bas à droite : dernière ligne, dernière colonne : @zone[2][2]@ ou @zone[-1][-1]@." % montre(c))
if re.search(r"coin\s*=\s*\d", code_sc):
    echec("Lis la valeur dans la grille au lieu de l'écrire toi-même.")
f = fonction("total_grille")
for g, att in ((D["zone"], 13), ([[1, 1], [1, 1]], 4), ([[5]], 5), ([[0, 0, 0], [0, 7, 0]], 7)):
    r = appel(f, g)
    if r == g[-1][-1] and att != r:
        echec("@total_grille@ renvoie seulement la dernière case : il faut **ajouter** chaque case au total.")
    if r != att:
        echec("@total_grille(%s)@ renvoie %s au lieu de %s." % (montre(g), montre(r), att))
`,
  indices: [
    "En bas à droite : la ligne d'indice 2 et la colonne d'indice 2 (ou -1 et -1).",
    "La première boucle parcourt la grille @g@ (chaque ligne), la seconde parcourt la @ligne@ (chaque case).",
    "Les trous : @2@, @2@, puis @g@, @ligne@, @case@.",
  ],
  solution: R`coin = zone[2][2]

def total_grille(g):
    total = 0
    for ligne in g:
        for case in ligne:
            total = total + case
    return total


print(coin)                 # 2
print(total_grille(zone))   # 13
`,
  retenir: R`Une grille se parcourt avec **deux boucles imbriquées** : la première donne les lignes, la seconde les cases de chaque ligne. Pour connaître la position, on utilise les indices : @for i in range(len(g)):@ puis @for j in range(len(g[i])):@.`,
  apres: [{ qui: "luci", texte: "13 souffles dans la zone. Les baleines viennent ici mettre bas et allaiter leurs petits." }],
},
// -----------------------------------------------------------------------------
{
  id: "b16", chap: "e3", type: "code", competence: "ecrire", xp: 200,
  titre: "Le carré le plus peuplé",
  objectif: "Écris la fonction @plus_peuple(g)@ qui renvoie la position (ligne, colonne) de la plus grande valeur.",
  recit: [{ qui: "cap", expr: "serieux", texte: "Les navires d'Abyssal doivent éviter le groupe le plus important. Trouve la **position** du carré qui a le plus de souffles." }],
  rappel: {
    titre: "Le maximum dans une grille, avec sa position",
    texte: R`Pour connaître la position, on parcourt les **indices** :
~~~
for i in range(len(g)):          # i : numéro de ligne
    for j in range(len(g[i])):   # j : numéro de colonne
        print(i, j, g[i][j])
~~~
On garde le meilleur nombre **et** sa position @(i, j)@.`,
    memo: "algo-maximum",
  },
  avant: [
    { type: "phrase", q: "Explique ton plan avant d'écrire la fonction.",
      phrase: "Je parcours les {{0}} avec @i@, puis, dans chacune, les {{1}} avec @j@. Je garde la plus grande valeur et sa position {{2}}.",
      trous: [
        { choix: ["lignes", "colonnes"], bonne: 0, aide: "@g[i]@ est une **ligne** de la grille." },
        { choix: ["colonnes", "lignes"], bonne: 0, aide: "@g[i][j]@ : @j@ est le numéro de **colonne**." },
        { choix: ["@(i, j)@", "@i + j@", "@g[i][j]@"], bonne: 0, aide: "Une position dans une grille, ce sont **deux** indices : la ligne et la colonne." },
      ],
      expl: "Deux boucles imbriquées par indice, et le maximum avec sa position @(i, j)@." },
  ],
  consigne: R`Écris @plus_peuple(g)@ : elle renvoie le tuple @(ligne, colonne)@ de la case qui a la plus grande valeur. En cas d'égalité, garde la première rencontrée (en lisant ligne par ligne).
Attendu : @plus_peuple(zone)@ renvoie @(2, 1)@.`,
  setup: R`zone = [[0, 2, 1],
        [3, 0, 0],
        [1, 4, 2]]`,
  starter: R`def plus_peuple(g):
    ...


print(plus_peuple(zone))   # (2, 1)
`,
  check: R`
f = fonction("plus_peuple")
tests = [
    (D["zone"], (2, 1)),
    ([[9, 1], [1, 1]], (0, 0)),
    ([[1, 1], [1, 9]], (1, 1)),
    ([[0, 5, 5], [5, 0, 0]], (0, 1)),
    ([[2]], (0, 0)),
    ([[0, 0], [0, 0]], (0, 0)),
]
for g, att in tests:
    r = appel(f, g)
    if r is None:
        echec("Ta fonction ne renvoie rien : il faut @return (ligne, colonne)@.")
    if isinstance(r, int) and not isinstance(r, bool):
        echec("Ta fonction renvoie un seul nombre (%s) : elle doit renvoyer la **position**, un tuple @(ligne, colonne)@." % montre(r))
    if not isinstance(r, (tuple, list)) or len(r) != 2:
        echec("Ta fonction doit renvoyer un tuple @(ligne, colonne)@, pas %s." % montre(r))
    r = tuple(r)
    if r == (att[1], att[0]) and att[0] != att[1]:
        echec("Tu as inversé : on renvoie d'abord la **ligne**, puis la **colonne**.")
    if r != att:
        echec("@plus_peuple(%s)@ renvoie %s au lieu de %s." % (montre(g), montre(r), montre(att)))
`,
  indices: [
    "Commence avec la case (0, 0) comme championne : @maxi = g[0][0]@ et @position = (0, 0)@.",
    "Deux boucles avec les indices : @for i in range(len(g)):@ puis @for j in range(len(g[i])):@. Si @g[i][j] > maxi@, on met à jour @maxi@ et @position = (i, j)@.",
    "Après les deux boucles (sans décalage) : @return position@.",
  ],
  solution: R`def plus_peuple(g):
    maxi = g[0][0]
    position = (0, 0)
    for i in range(len(g)):
        for j in range(len(g[i])):
            if g[i][j] > maxi:
                maxi = g[i][j]
                position = (i, j)
    return position


print(plus_peuple(zone))   # (2, 1)
`,
  retenir: R`Le maximum avec sa position marche aussi dans une grille : deux boucles sur les indices, et on retient la position sous forme de tuple @(i, j)@. Avec @>@, en cas d'égalité, c'est la première case rencontrée qui reste championne.`,
  apres: [{ qui: "luci", texte: "Groupe repéré en (2, 1). Message envoyé à tous les bateaux : zone à contourner." }],
},
// -----------------------------------------------------------------------------
{
  id: "b17", chap: "e3", type: "parsons", competence: "concevoir", xp: 200,
  titre: "Une ligne pleine",
  objectif: "Remets les lignes dans l'ordre : la fonction dit si une ligne de la grille n'a aucun carré vide.",
  recit: [
    { qui: "vex", texte: "Je veux savoir si une ligne de la grille a des baleines dans **tous** ses carrés. J'ai écrit la fonction…" },
    { qui: "huit", expr: "malin", texte: "…♪" },
    { qui: "vex", expr: "colere", type: "cri", texte: "…et ce poulpe l'a mélangée !" },
    { qui: "luci", texte: "Attention au piège classique : on ne peut répondre « oui » qu'après avoir regardé **toutes** les cases." },
  ],
  rappel: {
    titre: "Rechercher : s'arrêter dès qu'on trouve",
    texte: R`@return@ arrête la fonction immédiatement, même au milieu d'une boucle.
~~~
def contient(liste, x):
    for element in liste:
        if element == x:
            return True      # trouvé : on s'arrête
    return False             # APRÈS la boucle : tout vu, rien trouvé
~~~
⚠️ Erreur classique : un @else:@ avec un @return@ **dans** la boucle (la fonction s'arrêterait dès le premier élément).`,
    memo: "algo-recherche",
  },
  setup: R`zone = [[0, 2, 1],
        [3, 1, 2],
        [1, 4, 2]]`,
  parsons: {
    lignes: [
      "def ligne_pleine(g, i):",
      "    for case in g[i]:",
      "        if case == 0:",
      "            return False",
      "    return True",
      "print(ligne_pleine(zone, 0), ligne_pleine(zone, 1))",
    ],
    distracteurs: ["else:", "for case in g:"],
  },
  check: R`
f = fonction("ligne_pleine")
tests = [([[0, 2, 1], [3, 1, 2]], 0, False), ([[0, 2, 1], [3, 1, 2]], 1, True), ([[1, 1, 0]], 0, False),
         ([[5, 0, 5]], 0, False), ([[2, 2, 2]], 0, True), ([[]], 0, True)]
for g, i, att in tests:
    r = appel(f, g, i)
    if r is None:
        echec("La fonction ne renvoie rien dans un des cas : vérifie le décalage de @return True@ (au même niveau que le @for@).")
    if r != att:
        if g == [[1, 1, 0]] and r is True:
            echec("La fonction répond trop tôt : elle ne regarde que la première case. Le @return True@ doit être **après** la boucle (et pas dans un @else@).")
        echec("@ligne_pleine(%s, %d)@ renvoie %s au lieu de %s." % (montre(g), i, montre(r), montre(att)))
if lignes != ["False True"]:
    echec("La dernière ligne (le @print@) doit être tout à gauche, après la fonction : on doit lire @False True@.")
`,
  indices: [
    "La fonction parcourt les cases de la ligne @g[i]@. Si une case vaut 0, on peut répondre @False@ tout de suite.",
    "Les lignes @else:@ et @for case in g:@ sont des pièges : on ne peut dire @True@ qu'après avoir tout regardé, et on parcourt la **ligne** @g[i]@.",
    "Décalages : @def@ (0), @for@ (1), @if@ (2), @return False@ (3), @return True@ (1), @print@ (0).",
  ],
  solution: R`def ligne_pleine(g, i):
    for case in g[i]:
        if case == 0:
            return False
    return True
print(ligne_pleine(zone, 0), ligne_pleine(zone, 1))`,
  retenir: R`Pour vérifier qu'une propriété est vraie **pour tous** les éléments : on cherche un contre-exemple. Dès qu'on en trouve un, @return False@. Si la boucle se termine sans en trouver, @return True@ (**après** la boucle).`,
  apres: [{ qui: "luci", texte: "Expédition terminée. Les navires ont changé de route. Les baleines repartiront vers l'Antarctique à la fin de la saison." }],
},
// ================= EXPÉDITION 4 : LES PLAGES DES TORTUES =====================
{
  id: "b18", chap: "e4", type: "etapes", competence: "reperer", xp: 150,
  titre: "Le carnet des pontes",
  objectif: "Trouve des informations dans le dictionnaire @plages@, dont les valeurs sont des tuples.",
  recit: [
    { qui: "narration", decor: "espece:tortue", texte: "Nuit sans lune. Sur le sable, de larges traces : les tortues sont venues pondre." },
    { qui: "nour", expr: "colere", texte: "Abyssal installe des projecteurs pour filmer « l'expérience tortue ». Mais la lumière perd les bébés tortues : ils partent vers les lampes au lieu de la mer." },
    { qui: "cap", expr: "serieux", texte: "On va repérer les plages où elles pondent le plus, pour qu'elles restent dans le noir." },
    { qui: "luci", texte: "Pour chaque plage, je note un **tuple** : @(nombre de nids, longueur en mètres)@, dans le dictionnaire @plages@." },
  ],
  replique: {
    q: "Que contient chaque valeur du dictionnaire @plages@ ?",
    choix: ["Un tuple : (nombre de nids, longueur en mètres).", "Une liste de noms de tortues."],
    bonne: 0,
    retours: { 1: { qui: "luci", texte: "Négatif. Chaque valeur est un **tuple** de deux nombres : les nids, puis la longueur." } },
  },
  rappel: {
    titre: "Un dictionnaire de tuples",
    texte: R`~~~
plages = {"Plage du Phare": (30, 450), "Petite Crique": (9, 120)}
plages["Petite Crique"]          # (9, 120)
plages["Petite Crique"][0]       # 9 : le nombre de nids
nids, longueur = plages["Petite Crique"]
plages["Petite Crique"] = (10, 120)   # on remplace le tuple entier
~~~`,
    memo: "tuples",
  },
  donnees: { plages: PLAGES_JS },
  setup: PLAGES,
  etapes: [
    { type: "case", donnee: "plages", q: "Clique sur la plage qui a le **plus de nids**.", bonne: "Grande Plage",
      expl: "La Grande Plage a 41 nids : c'est le premier nombre de son tuple.",
      pieges: { "Plage du Phare": "30 nids. Regarde le **premier** nombre de chaque tuple.", "Anse aux Baobabs": "12 nids seulement. Le deuxième nombre est la longueur, pas les nids." },
      aide: "Dans chaque tuple, le premier nombre est le nombre de nids." },
    { type: "choix", q: "Que vaut @plages[\"Plage du Phare\"][0]@ ?",
      choix: ["30", "450", "@(30, 450)@"], bonne: 0,
      expl: "@[0]@ prend le premier élément du tuple : le nombre de nids.",
      pieges: { 1: "450 est à l'indice 1 (la longueur).", 2: "Sans @[0]@, on aurait tout le tuple." } },
    { type: "choix", q: "Que vaut @plages[\"Petite Crique\"][1]@ ?",
      choix: ["120", "9", "Une erreur : un tuple ne se lit pas avec des crochets"], bonne: 0,
      expl: "L'indice 1 est la longueur de la plage : 120 m.",
      pieges: { 2: "On lit un tuple avec des indices, comme une liste. C'est la **modification** qui est interdite." } },
    { type: "trous", q: "Complète pour ranger les nids et la longueur de la Grande Plage dans deux variables.",
      code: "nids, longueur = plages[{{0}}]",
      trous: [{ choix: ["\"Grande Plage\"", "Grande Plage", "3"], bonne: 0, aide: "Une clé texte s'écrit entre guillemets ; un dictionnaire n'a pas d'indice numérique." }],
      expl: "@nids, longueur = plages[\"Grande Plage\"]@ : nids vaut 41 et longueur 900." },
    { type: "choix", q: "Que fait @plages[\"Petite Crique\"][0] = 10@ ?",
      choix: ["Python s'arrête : erreur @TypeError@ (le tuple ne se modifie pas)", "Le nombre de nids devient 10", "Une nouvelle plage est créée"], bonne: 0,
      expl: "On essaie de modifier **un élément** d'un tuple : interdit.",
      pieges: { 1: "Ce serait vrai avec une liste. Ici, la valeur est un tuple." } },
    { type: "choix", q: "Alors, comment enregistrer **10 nids** pour la Petite Crique ?",
      choix: ["@plages[\"Petite Crique\"] = (10, 120)@", "@plages[\"Petite Crique\"].append(10)@", "@plages[\"Petite Crique\"] = 10@"], bonne: 0,
      expl: "On remplace le tuple **entier** par un nouveau tuple.",
      pieges: { 1: "Un tuple n'a pas de méthode @append@.", 2: "La longueur de la plage serait perdue : la valeur doit rester un tuple (nids, longueur)." } },
  ],
  retenir: R`Dans un dictionnaire de tuples, @d[cle][0]@ lit le premier élément du tuple. Pour « modifier » un tuple, on le **remplace** : @d[cle] = (nouveau, ancien)@.`,
  apres: [{ qui: "luci", texte: "Carnet à jour. À Mayotte, les tortues vertes et imbriquées pondent sur environ deux tiers des plages." }],
},
// -----------------------------------------------------------------------------
{
  id: "b19", chap: "e4", type: "code", competence: "ecrire", xp: 200,
  titre: "La plage la plus fréquentée",
  objectif: "Écris la fonction @plus_dense(d)@ qui renvoie la plage qui a le plus de nids par mètre.",
  recit: [
    { qui: "bolt", texte: "La Grande Plage a le plus de nids… mais elle est immense ! Où les tortues sont-elles le plus **serrées** ?" },
    { qui: "luci", texte: "Il faut comparer la **densité** : nombre de nids divisé par la longueur." },
  ],
  rappel: {
    titre: "Parcourir un dictionnaire de tuples",
    texte: R`~~~
for nom, (nids, longueur) in plages.items():
    print(nom, nids / longueur)
~~~
Les parenthèses déballent le tuple directement dans la boucle. On peut aussi écrire @for nom, t in plages.items():@ puis utiliser @t[0]@ et @t[1]@.`,
    memo: "tuples",
  },
  avant: [
    { type: "phrase", q: "Explique ton plan avant d'écrire la fonction.",
      phrase: "Je parcours le dictionnaire avec {{0}} pour avoir le nom et le tuple. Pour chaque plage, je calcule {{1}}, et je garde {{2}}.",
      trous: [
        { choix: ["@d.items()@", "@range(len(d))@"], bonne: 0, aide: "Un dictionnaire n'a pas d'indices : on parcourt ses paires avec @.items()@." },
        { choix: ["les nids divisés par la longueur", "les nids plus la longueur"], bonne: 0, aide: "Une **densité**, c'est une division : nids ÷ longueur." },
        { choix: ["la plus grande densité et le nom de sa plage", "la dernière plage vue"], bonne: 0, aide: "C'est l'algorithme du **maximum** : un champion, et son nom." },
      ],
      expl: "Parcours clé-valeur, un calcul par plage, puis le maximum avec son nom." },
  ],
  consigne: R`Écris @plus_dense(d)@ : elle renvoie le **nom** de la plage dont la densité @nids / longueur@ est la plus grande. En cas d'égalité, garde la première.
Attendu : @plus_dense(plages)@ renvoie @"Petite Crique"@.`,
  setup: PLAGES,
  starter: R`def plus_dense(d):
    ...


print(plus_dense(plages))   # Petite Crique
`,
  check: R`
f = fonction("plus_dense")
tests = [
    (D["plages"], "Petite Crique"),
    ({"A": (10, 100), "B": (10, 50)}, "B"),
    ({"A": (1, 10), "B": (2, 20)}, "A"),
    ({"Seule": (0, 100)}, "Seule"),
    ({"A": (0, 100), "B": (3, 1000)}, "B"),
]
for d, att in tests:
    r = appel(f, d)
    if r is None:
        echec("Ta fonction ne renvoie rien : il faut un @return@ avec le nom de la plage.")
    if d is D["plages"] and r == "Grande Plage":
        echec("La Grande Plage a le plus de nids, mais pas la plus grande **densité** : divise les nids par la longueur.")
    if isinstance(r, (int, float)) and not isinstance(r, bool):
        echec("Ta fonction renvoie un nombre (%s) : elle doit renvoyer le **nom** de la plage." % montre(r))
    if r != att:
        echec("@plus_dense(%s)@ renvoie %s au lieu de %s." % (montre(d), montre(r), montre(att)))
`,
  indices: [
    "C'est l'algorithme du maximum : on garde la meilleure densité et le nom qui va avec. Commence avec @meilleur = None@ et @maxi = -1@.",
    "Dans la boucle @for nom, (nids, longueur) in d.items():@, calcule @densite = nids / longueur@.",
    "Si @densite > maxi@ : @maxi = densite@ et @meilleur = nom@. Après la boucle : @return meilleur@.",
  ],
  solution: R`def plus_dense(d):
    meilleur = None
    maxi = -1
    for nom, (nids, longueur) in d.items():
        densite = nids / longueur
        if densite > maxi:
            maxi = densite
            meilleur = nom
    return meilleur


print(plus_dense(plages))   # Petite Crique
`,
  retenir: R`Le maximum ne porte pas toujours sur une valeur rangée : ici, on compare une valeur **calculée** (la densité). Le déballage @for nom, (a, b) in d.items():@ rend le code plus lisible.`,
  apres: [{ qui: "luci", texte: "La Petite Crique : 9 nids sur 120 m. C'est là qu'il faut le plus de nuit noire." }],
},
// -----------------------------------------------------------------------------
{
  id: "b20", chap: "e4", type: "code", competence: "completer", xp: 180,
  titre: "Enregistrer une ponte",
  objectif: "Complète la fonction qui ajoute un nid à une plage, et celle qui compte tous les nids.",
  recit: [{ qui: "luci", texte: "Chaque nuit, de nouveaux nids. Ma fonction doit ajouter 1 au bon tuple… sans oublier qu'un tuple ne se modifie pas." }],
  rappel: {
    titre: "Remplacer un tuple dans un dictionnaire",
    texte: R`~~~
nids, longueur = plages["Petite Crique"]       # on lit le tuple
plages["Petite Crique"] = (nids + 1, longueur) # on en range un nouveau
~~~`,
    memo: "tuples",
  },
  consigne: R`1. @ajouter_nid(d, plage)@ ajoute 1 nid à la plage (elle modifie le dictionnaire, elle ne renvoie rien). Si la plage n'existe pas, elle la crée avec @(1, 0)@.
2. @total_nids(d)@ renvoie le nombre total de nids.`,
  setup: PLAGES,
  starter: R`def ajouter_nid(d, plage):
    if plage in d:
        nids, longueur = ___
        d[plage] = ___
    else:
        d[plage] = ___


def total_nids(d):
    total = 0
    for nids, longueur in d.___():
        total = total + ___
    return total


ajouter_nid(plages, "Petite Crique")
print(plages["Petite Crique"])   # (10, 120)
print(total_nids(plages))        # 98
`,
  check: R`
a = fonction("ajouter_nid")
t = fonction("total_nids")
d = {"A": (3, 50), "B": (0, 10)}
appel_direct(a, d, "A")
if d["A"] == (3, 50):
    echec("@ajouter_nid@ ne modifie pas le dictionnaire : il faut ranger le nouveau tuple dans @d[plage]@.")
if d["A"] != (4, 50):
    echec("Après @ajouter_nid(d, \"A\")@, @d[\"A\"]@ vaut %s au lieu de (4, 50)." % montre(d["A"]))
appel_direct(a, d, "C")
if d.get("C") != (1, 0):
    echec("Pour une plage qui n'existe pas encore, @d[plage]@ doit valoir @(1, 0)@, pas %s." % montre(d.get("C")))
if len(d) != 3 or d["B"] != (0, 10):
    echec("Les autres plages ne doivent pas changer.")
for dd, att in ((D["plages"], 97), ({"A": (4, 50), "C": (1, 0)}, 5), ({}, 0)):
    r = appel(t, dd)
    if r != att:
        echec("@total_nids(%s)@ renvoie %s au lieu de %s." % (montre(dd), montre(r), att))
`,
  indices: [
    "On lit le tuple de la plage : @d[plage]@. Puis on range un nouveau tuple avec un nid de plus.",
    "Le nouveau tuple : @(nids + 1, longueur)@. Pour le total, on parcourt les valeurs avec @.values()@.",
    "Les trous : @d[plage]@, @(nids + 1, longueur)@, @(1, 0)@, @values@, @nids@.",
  ],
  solution: R`def ajouter_nid(d, plage):
    if plage in d:
        nids, longueur = d[plage]
        d[plage] = (nids + 1, longueur)
    else:
        d[plage] = (1, 0)


def total_nids(d):
    total = 0
    for nids, longueur in d.values():
        total = total + nids
    return total


ajouter_nid(plages, "Petite Crique")
print(plages["Petite Crique"])   # (10, 120)
print(total_nids(plages))        # 98
`,
  retenir: R`Une fonction peut **modifier** un dictionnaire reçu en paramètre (c'est le même objet). Pour « modifier » un tuple : lire, calculer, ranger un **nouveau** tuple.`,
  apres: [{ qui: "bolt", expr: "rire", texte: "98 nids ! Et dans chaque nid, des dizaines d'œufs. Ça fait beaucoup de bébés tortues." }],
},
// -----------------------------------------------------------------------------
{
  id: "b21", chap: "e4", type: "code", competence: "ecrire", xp: 220,
  titre: "Une plage par tortue",
  objectif: "Écris la fonction @regrouper(balises)@ qui range les tortues par plage.",
  recit: [
    { qui: "nour", texte: "Certaines tortues portent une petite balise. Je sais sur quelle plage chacune a pondu : @balises = {\"T-014\": \"Plage du Phare\", ...}@." },
    { qui: "luci", texte: "Je voudrais l'inverse : pour chaque plage, la **liste** des tortues qui y ont pondu." },
  ],
  rappel: {
    titre: "Regrouper dans un dictionnaire de listes",
    texte: R`~~~
couleurs = {"corail": "rouge", "lagon": "bleu", "étoile": "rouge"}
par_couleur = {}
for objet, c in couleurs.items():
    if c not in par_couleur:
        par_couleur[c] = []          # première fois : une liste vide
    par_couleur[c].append(objet)     # on ajoute l'objet à SA liste
print(par_couleur)   # {'rouge': ['corail', 'étoile'], 'bleu': ['lagon']}
~~~`,
    memo: "algo-compter",
  },
  avant: [
    { type: "phrase", q: "Explique ton plan avant d'écrire la fonction.",
      phrase: "Le résultat est un dictionnaire : ses clés sont {{0}} et ses valeurs sont {{1}}. Si une plage n'est pas encore une clé, je {{2}}.",
      trous: [
        { choix: ["les plages", "les tortues"], bonne: 0, aide: "On veut chercher **par plage** : les plages sont les clés." },
        { choix: ["des listes de tortues", "des nombres"], bonne: 0, aide: "Pour chaque plage, on veut **la liste** des tortues." },
        { choix: ["crée la clé avec une liste vide", "ajoute 1 à sa valeur"], bonne: 0, aide: "Avant d'ajouter une tortue à la liste d'une plage, cette liste doit exister." },
      ],
      expl: "Un dictionnaire de listes : une clé par plage, une liste vide à la première rencontre, puis @append@." },
  ],
  consigne: R`Écris @regrouper(balises)@ : elle renvoie un dictionnaire dont les clés sont les plages et les valeurs les **listes** de tortues (dans l'ordre du dictionnaire @balises@).`,
  setup: R`balises = {"T-014": "Plage du Phare", "T-022": "Grande Plage", "T-031": "Plage du Phare",
           "T-047": "Petite Crique", "T-052": "Grande Plage", "T-060": "Plage du Phare"}`,
  starter: R`def regrouper(balises):
    ...


print(regrouper(balises))
`,
  check: R`
f = fonction("regrouper")
att = {"Plage du Phare": ["T-014", "T-031", "T-060"], "Grande Plage": ["T-022", "T-052"], "Petite Crique": ["T-047"]}
r = appel(f, D["balises"])
if r is None:
    echec("Ta fonction ne renvoie rien : il faut @return@ le dictionnaire.")
if not isinstance(r, dict):
    echec("Ta fonction doit renvoyer un dictionnaire, pas %s." % montre(r))
if r and all(isinstance(v, int) for v in r.values()):
    echec("Ton dictionnaire **compte** les tortues. Il faut la **liste** de leurs balises : @[\"T-014\", ...]@.")
if r and any(isinstance(v, str) for v in r.values()):
    echec("Chaque valeur doit être une **liste** de tortues (même s'il n'y en a qu'une) : @[\"T-047\"]@.")
if "T-014" in r:
    echec("Les clés doivent être les **plages**, et les valeurs les listes de tortues.")
if r != att:
    echec("@regrouper(balises)@ renvoie %s au lieu de %s." % (montre(r, 200), montre(att, 200)))
for b, a in (({}, {}), ({"X": "P"}, {"P": ["X"]}), ({"X": "P", "Y": "Q", "Z": "P"}, {"P": ["X", "Z"], "Q": ["Y"]})):
    r = appel(f, b)
    if r != a:
        echec("@regrouper(%s)@ renvoie %s au lieu de %s." % (montre(b), montre(r), montre(a)))
`,
  indices: [
    "Pars d'un dictionnaire vide. Parcours @balises.items()@ : à chaque tour, une tortue et sa plage.",
    "Si la plage n'est pas encore une clé, crée-la avec une liste vide. Ensuite, ajoute la tortue à la liste de cette plage avec @append@.",
    "@resultat = {}@ / @for tortue, plage in balises.items():@ / @if plage not in resultat:@ / @resultat[plage] = []@ / @resultat[plage].append(tortue)@ / @return resultat@.",
  ],
  solution: R`def regrouper(balises):
    resultat = {}
    for tortue, plage in balises.items():
        if plage not in resultat:
            resultat[plage] = []
        resultat[plage].append(tortue)
    return resultat


print(regrouper(balises))
`,
  retenir: R`Regrouper, c'est comme compter… mais au lieu de faire @+ 1@, on fait @.append(...)@ dans une liste. La première fois qu'on voit une clé, on crée sa liste vide.`,
  apres: [{ qui: "luci", texte: "Trois tortues balisées à la Plage du Phare. Les tortues reviennent souvent pondre dans la même région." }],
},
// -----------------------------------------------------------------------------
{
  id: "b22", chap: "e4", type: "trace", competence: "comprendre", xp: 180,
  titre: "La plage la plus calme",
  objectif: "Fais tourner la fonction @plage_calme@ à la main : remplis le tableau, tour par tour.",
  recit: [
    { qui: "luci", texte: "Cette fonction cherche la plage qui a le **moins** de nids. Remplis son tableau d'avancement : une ligne par plage." },
    { qui: "vex", expr: "malin", texte: "Il y a un piège dedans. Je l'ai vu tout de suite. Et toi ?" },
  ],
  rappel: {
    titre: "Le minimum, et un piège",
    texte: R`Pour le minimum, on garde le plus **petit** nombre vu jusqu'ici.
Ici, on démarre avec @mini = 1000@ : un nombre « très grand », pour que la première plage devienne championne.
⚠️ Que se passe-t-il si toutes les plages ont plus de 1000 nids ? Garde la question en tête…`,
    memo: "algo-maximum",
  },
  code: R`def plage_calme(d):
    choix = None
    mini = 1000
    for nom, (nids, longueur) in d.items():
        if nids < mini:
            mini = nids
            choix = nom
    return choix

plages = {"Anse aux Baobabs": (12, 300), "Plage du Phare": (30, 450), "Petite Crique": (9, 120),
          "Grande Plage": (41, 900), "Plage des Galets": (5, 200)}
print(plage_calme(plages))`,
  trace: {
    avant: [
      { q: "Avant la boucle, combien vaut @mini@ ?", rep: ["1000"], aide: "Regarde la ligne 3." },
    ],
    colonnes: [
      { titre: "Tour", type: "texte" },
      { titre: "nom", type: "texte" },
      { titre: "nids", type: "texte", aide: "Le premier nombre du tuple de la plage." },
      { titre: "nids < mini", type: "bool", aide: "Compare avec la valeur de mini AVANT ce tour." },
      { titre: "mini (fin du tour)", type: "texte", aide: "mini change seulement quand nids < mini est True." },
    ],
    lignes: [
      ["1", "Anse aux Baobabs", "12", "True", "12"],
      ["2", "Plage du Phare", "30", "False", "12"],
      ["3", "Petite Crique", "9", "True", "9"],
      ["4", "Grande Plage", "41", "False", "9"],
      ["5", "Plage des Galets", "5", "True", "5"],
    ],
    donnees: [[true, true, false, false, false], [true, true, false, false, false], [true, true, false, false, false], [true, true, false, false, false], [true, true, false, false, false]],
    apres: [
      { q: "Qu'affiche le programme ?", rep: ["Plage des Galets"], aide: "C'est la plage du dernier changement de mini." },
      { q: "Que renverrait @plage_calme({\"Plage X\": (2000, 300)})@ ?", rep: ["None"], aide: "2000 < 1000 est False : choix n'est jamais modifié et reste None." },
    ],
  },
  indices: [
    "Colonne nids : le premier nombre de chaque tuple, dans l'ordre : 12, 30, 9, 41, 5.",
    "Compare chaque nombre de nids avec mini tel qu'il était avant le tour : 12 < 1000, 30 < 12, 9 < 12, 41 < 9, 5 < 9.",
    "mini vaut 12, 12, 9, 9, 5. Le programme affiche Plage des Galets. Avec 2000 nids, la condition n'est jamais vraie : None.",
  ],
  retenir: R`Démarrer avec une valeur « très grande » (@mini = 1000@) est risqué : si toutes les valeurs la dépassent, l'algorithme ne trouve rien. Le plus sûr : partir du **premier élément**, comme pour le maximum.`,
  apres: [
    { qui: "cap", expr: "sourire", texte: "Expédition terminée. Sans public pour leur « expérience », Abyssal a remballé ses projecteurs." },
    { qui: "nour", texte: "Adulte, la tortue verte broute les herbiers que nous avons traversés." },
  ],
},
// =================== EXPÉDITION 5 : RETOUR À LA MANGROVE =====================
{
  id: "b23", chap: "e5", type: "code", competence: "ecrire", xp: 220,
  titre: "Le tri des carapaces",
  objectif: "Écris la fonction @trier(liste)@ qui renvoie une nouvelle liste triée, avec le tri par sélection.",
  recit: [
    { qui: "narration", decor: "espece:mangrove", texte: "Retour au calme, entre les racines des palétuviers. Ici grandissent les jeunes poissons, à l'abri des vagues." },
    { qui: "orsa", expr: "serieux", radio: true, texte: "Vous avez gagné quelques batailles. Mais personne ne lit vos données. Sans rapport, vous n'existez pas." },
    { qui: "cap", expr: "serieux", texte: "Elle a raison sur un point : il nous faut un **rapport** clair. On commence par ranger nos mesures." },
    { qui: "luci", texte: "Trie les tailles de carapaces mesurées cette semaine, de la plus petite à la plus grande. Sans @sorted@ !" },
  ],
  replique: {
    q: "Quel est le défi ?",
    choix: ["Trier une liste moi-même, sans la fonction sorted.", "Utiliser sorted pour aller plus vite."],
    bonne: 0,
    retours: { 1: { qui: "luci", expr: "serieux", texte: "Interdit. Le but est de savoir **comment** on trie." } },
  },
  rappel: {
    titre: "Le tri par sélection",
    texte: R`Pour chaque position @i@ : on cherche le **plus petit** élément à partir de @i@, puis on l'**échange** avec @t[i]@.
~~~
t[i], t[j] = t[j], t[i]     # échange deux éléments en une ligne
~~~
Pour ne pas abîmer la liste reçue, on travaille sur une copie : @t = liste.copy()@.`,
    anim: "selection",
    memo: "algo-tri",
  },
  avant: [
    { type: "phrase", q: "Explique le tri par sélection avant de l'écrire.",
      phrase: "Pour chaque position @i@, je cherche {{0}} parmi les éléments à partir de @i@, puis je l'{{1}} avec @t[i]@.",
      trous: [
        { choix: ["le plus petit élément", "le plus grand élément", "le premier élément"], bonne: 0, aide: "On trie du plus petit au plus grand : on place d'abord le **plus petit**." },
        { choix: ["échange", "additionne", "compare seulement"], bonne: 0, aide: "Le plus petit vient prendre la place @i@ : on **échange** les deux éléments." },
      ],
      expl: "Tri par sélection : à chaque tour, on sélectionne le plus petit élément restant et on l'échange avec la case @i@." },
  ],
  consigne: R`Écris @trier(liste)@ : elle renvoie une **nouvelle** liste triée dans l'ordre croissant, **sans** utiliser @sorted@ ni @.sort()@. La liste reçue ne doit pas être modifiée.`,
  setup: R`carapaces = [92, 85, 101, 78, 96]`,
  starter: R`def trier(liste):
    ...


print(trier(carapaces))   # [78, 85, 92, 96, 101]
print(carapaces)          # [92, 85, 101, 78, 96] : pas modifiée
`,
  check: R`
if utilise(r"\bsorted\s*\(") or utilise(r"\.sort\s*\("):
    echec("Écris le tri toi-même, sans @sorted()@ ni @.sort()@ : c'est le défi !")
f = fonction("trier")
for l in ([92, 85, 101, 78, 96], [3, 1, 2], [], [5], [2, 2, 1], [9, 8, 7, 6, 5, 4]):
    original = list(l)
    copie = list(l)
    r = appel_direct(f, copie)
    if r is None:
        echec("Ta fonction ne renvoie rien : il faut @return@ la liste triée.")
    if copie != original:
        echec("Ta fonction modifie la liste reçue. Travaille sur une copie : @t = liste.copy()@.")
    if r != sorted(original):
        echec("@trier(%s)@ renvoie %s au lieu de %s." % (montre(original), montre(r), montre(sorted(original))))
`,
  indices: [
    "Commence par @t = liste.copy()@, puis une boucle @for i in range(len(t)):@.",
    "Dans cette boucle, cherche l'indice @i_min@ du plus petit élément entre @i@ et la fin (deuxième boucle : @for j in range(i + 1, len(t)):@). Puis échange @t[i]@ et @t[i_min]@.",
    "Regarde la fiche « Trier (tri par sélection) » du mémo : elle contient l'algorithme complet.",
  ],
  solution: R`def trier(liste):
    t = liste.copy()
    for i in range(len(t)):
        i_min = i
        for j in range(i + 1, len(t)):
            if t[j] < t[i_min]:
                i_min = j
        t[i], t[i_min] = t[i_min], t[i]
    return t


print(trier(carapaces))   # [78, 85, 92, 96, 101]
print(carapaces)          # [92, 85, 101, 78, 96] : pas modifiée
`,
  retenir: R`Le tri par sélection fait environ n²/2 comparaisons pour n éléments : pour 1 000 éléments, environ 500 000 ! Python utilise un tri bien plus rapide dans @sorted()@. Mais savoir écrire un tri, c'est comprendre ce que fait l'ordinateur.`,
  apres: [{ qui: "luci", texte: "Carapaces triées. La plus petite mesure 78 cm." }],
},
// -----------------------------------------------------------------------------
{
  id: "b24", chap: "e5", type: "code", competence: "completer", xp: 200,
  titre: "Le palétuvier mystère",
  objectif: "Complète deux fonctions de recherche : la première position d'une valeur, et toutes ses positions.",
  recit: [
    { qui: "bolt", expr: "colere", texte: "Huit a encore caché quelque chose : un coquillage, au pied d'un palétuvier !" },
    { qui: "huit", expr: "malin", texte: "…♪" },
    { qui: "luci", texte: "J'ai noté ce qu'il y a au pied de chaque arbre, dans la liste @racines@. Pour le retrouver, il faut **chercher** dans la liste." },
  ],
  rappel: {
    titre: "Rechercher dans une liste",
    texte: R`~~~
def position(liste, x):
    for i in range(len(liste)):
        if liste[i] == x:
            return i       # trouvé : on s'arrête tout de suite
    return -1              # tout parcouru sans trouver
~~~
Pour **toutes** les positions, on ne s'arrête pas : on les ajoute dans une liste.`,
    memo: "algo-recherche",
  },
  avant: [
    { type: "phrase", q: "Explique comment on cherche dans une liste.",
      phrase: "Pour chercher un élément, je parcours la liste {{0}} et je compare chaque élément avec la valeur cherchée. Pour la **première** position, je peux m'arrêter {{1}}. Si je ne la trouve pas, je renvoie {{2}}.",
      trous: [
        { choix: ["élément par élément", "en sautant un élément sur deux", "seulement au début"], bonne: 0, aide: "La valeur peut être n'importe où : il faut regarder les éléments **un par un**." },
        { choix: ["dès que je la trouve", "jamais avant la fin"], bonne: 0, aide: "Pour la première position, inutile de continuer : @return@ arrête la fonction." },
        { choix: ["@-1@", "@0@"], bonne: 0, aide: "0 est un vrai indice ! On renvoie une valeur impossible : @-1@." },
      ],
      expl: "On parcourt **un par un**, on s'arrête dès qu'on trouve, et on renvoie @-1@ si on n'a rien trouvé." },
  ],
  consigne: R`1. @premiere_position(liste, x)@ renvoie l'indice de la **première** apparition de @x@, ou @-1@ si @x@ n'y est pas (sans utiliser @.index@).
2. @toutes_positions(liste, x)@ renvoie la **liste** de tous les indices où se trouve @x@.`,
  setup: R`racines = ["crabe", "vase", "coquillage", "huître", "crabe", "coquillage"]`,
  starter: R`def premiere_position(liste, x):
    for i in range(len(liste)):
        if ___:
            return ___
    return ___


def toutes_positions(liste, x):
    positions = []
    for i in range(len(liste)):
        if liste[i] == x:
            ___
    return positions


print(premiere_position(racines, "coquillage"))   # 2
print(premiere_position(racines, "perle"))        # -1
print(toutes_positions(racines, "crabe"))         # [0, 4]
`,
  check: R`
if utilise(r"\.index\s*\("):
    echec("Écris la recherche toi-même, sans @.index()@.")
p = fonction("premiere_position")
t = fonction("toutes_positions")
L = D["racines"]
for x, att in (("coquillage", 2), ("crabe", 0), ("perle", -1), ("vase", 1)):
    r = appel(p, L, x)
    if x == "coquillage" and r == 5:
        echec("Ta fonction renvoie la **dernière** position. Il faut s'arrêter dès la première : @return i@ dans la boucle.")
    if x == "perle" and r is None:
        echec("Si la valeur n'est pas trouvée, il faut renvoyer @-1@ (après la boucle).")
    if r != att:
        echec("@premiere_position(racines, %s)@ renvoie %s au lieu de %s." % (montre(x), montre(r), att))
if appel(p, [], "x") != -1:
    echec("Avec une liste vide, @premiere_position@ doit renvoyer -1.")
for x, att in (("crabe", [0, 4]), ("coquillage", [2, 5]), ("perle", []), ("vase", [1])):
    r = appel(t, L, x)
    if r != att:
        echec("@toutes_positions(racines, %s)@ renvoie %s au lieu de %s." % (montre(x), montre(r), montre(att)))
`,
  indices: [
    "On compare chaque élément @liste[i]@ avec @x@. Si c'est égal, on renvoie l'indice @i@ tout de suite.",
    "Le @return -1@ est **après** la boucle : on n'y arrive que si on n'a rien trouvé. Pour toutes les positions, on ajoute @i@ à la liste.",
    "Les trous : @liste[i] == x@, @i@, @-1@, puis @positions.append(i)@.",
  ],
  solution: R`def premiere_position(liste, x):
    for i in range(len(liste)):
        if liste[i] == x:
            return i
    return -1


def toutes_positions(liste, x):
    positions = []
    for i in range(len(liste)):
        if liste[i] == x:
            positions.append(i)
    return positions


print(premiere_position(racines, "coquillage"))   # 2
print(premiere_position(racines, "perle"))        # -1
print(toutes_positions(racines, "crabe"))         # [0, 4]
`,
  retenir: R`Recherche de la première apparition : @return@ **dans** la boucle (on s'arrête dès qu'on trouve) et @return -1@ **après** la boucle. Pour toutes les apparitions : on ne s'arrête pas, on filtre les indices dans une liste.`,
  apres: [{ qui: "bolt", expr: "rire", texte: "Le coquillage était au pied du troisième palétuvier ! (Huit en avait caché un deuxième… évidemment.)" }],
},
// -----------------------------------------------------------------------------
{
  id: "b25", chap: "e5", type: "code", competence: "ecrire", xp: 220,
  titre: "Les crabes de la vase",
  objectif: "Écris deux fonctions : compter les observations de chaque espèce, puis trouver l'espèce la plus vue.",
  recit: [
    { qui: "luci", texte: "À marée basse, la vase grouille de crabes. J'ai noté chaque crabe aperçu dans la liste @vus@." },
    { qui: "nour", texte: "Je veux le nombre de chaque espèce, puis l'espèce la plus vue." },
  ],
  rappel: {
    titre: "Compter, puis chercher le maximum",
    texte: R`~~~
compte = {}
for x in vus:
    compte[x] = compte.get(x, 0) + 1    # 0 si x n'est pas encore une clé
~~~
Ensuite, l'algorithme du maximum sur le dictionnaire : on garde la clé qui a la plus grande valeur.`,
    memo: "algo-compter",
  },
  avant: [
    { type: "phrase", q: "Explique ton plan avant d'écrire les deux fonctions.",
      phrase: "D'abord, je compte avec un {{0}} qui a une clé par espèce. Ensuite, je cherche {{1}} de ce dictionnaire.",
      trous: [
        { choix: ["dictionnaire", "compteur unique"], bonne: 0, aide: "Il faut un nombre **par espèce** : un dictionnaire." },
        { choix: ["la clé qui a la plus grande valeur", "la première clé", "la plus grande clé"], bonne: 0, aide: "L'espèce la plus vue est celle dont la **valeur** (le nombre) est la plus grande." },
      ],
      expl: "Compter avec un dictionnaire, puis l'algorithme du maximum sur ses valeurs." },
  ],
  consigne: R`1. @compter(liste)@ renvoie un dictionnaire : espèce → nombre d'observations.
2. @plus_vue(compte)@ reçoit ce dictionnaire et renvoie l'espèce la plus vue (la première en cas d'égalité).`,
  setup: R`vus = ["violoniste", "crabe de vase", "violoniste", "sesarma", "violoniste", "crabe de vase"]`,
  starter: R`def compter(liste):
    ...


def plus_vue(compte):
    ...


c = compter(vus)
print(c)             # {'violoniste': 3, 'crabe de vase': 2, 'sesarma': 1}
print(plus_vue(c))   # violoniste
`,
  check: R`
c = fonction("compter")
p = fonction("plus_vue")
r = appel(c, D["vus"])
att = {"violoniste": 3, "crabe de vase": 2, "sesarma": 1}
if r is None:
    echec("@compter@ ne renvoie rien : il faut @return@ le dictionnaire.")
if isinstance(r, dict) and r and all(v == 1 for v in r.values()):
    echec("Chaque espèce vaut 1 : quand l'espèce est déjà une clé, il faut **ajouter 1** à sa valeur.")
if r != att:
    echec("@compter(vus)@ renvoie %s au lieu de %s." % (montre(r), montre(att)))
for l, a in (([], {}), (["a"], {"a": 1}), (["a", "b", "a", "a"], {"a": 3, "b": 1})):
    rr = appel(c, l)
    if rr != a:
        echec("@compter(%s)@ renvoie %s au lieu de %s." % (montre(l), montre(rr), montre(a)))
for d, a in ((att, "violoniste"), ({"a": 1, "b": 5, "c": 2}, "b"), ({"a": 2, "b": 2}, "a"), ({"x": 0}, "x")):
    r = appel(p, d)
    if isinstance(r, int) and not isinstance(r, bool):
        echec("@plus_vue@ renvoie un nombre (%s) : elle doit renvoyer l'**espèce** (la clé)." % montre(r))
    if r != a:
        echec("@plus_vue(%s)@ renvoie %s au lieu de %s." % (montre(d), montre(r), montre(a)))
`,
  indices: [
    "@compter@ : un dictionnaire vide, une boucle sur la liste, et pour chaque élément : +1 s'il est déjà une clé, sinon 1 (ou @.get(x, 0) + 1@).",
    "@plus_vue@ : algorithme du maximum sur @compte.items()@. Garde la meilleure clé et sa valeur ; commence avec @meilleur = None@ et @maxi = -1@.",
    "Pour @plus_vue@ : @for espece, n in compte.items():@ / @if n > maxi:@ / @maxi = n@ / @meilleur = espece@ / puis @return meilleur@ après la boucle.",
  ],
  solution: R`def compter(liste):
    compte = {}
    for x in liste:
        compte[x] = compte.get(x, 0) + 1
    return compte


def plus_vue(compte):
    meilleur = None
    maxi = -1
    for espece, n in compte.items():
        if n > maxi:
            maxi = n
            meilleur = espece
    return meilleur


c = compter(vus)
print(c)             # {'violoniste': 3, 'crabe de vase': 2, 'sesarma': 1}
print(plus_vue(c))   # violoniste
`,
  retenir: R`Beaucoup de problèmes se résolvent en **enchaînant** deux algorithmes simples : d'abord compter (dictionnaire), puis chercher le maximum. Découper un problème en petites fonctions, c'est la clé.`,
  apres: [{ qui: "nour", expr: "rire", texte: "Les crabes violonistes mâles ont une pince énorme et une toute petite. Chacun son style !" }],
},
// -----------------------------------------------------------------------------
{
  id: "b26", chap: "e5", type: "etapes", competence: "expliquer", xp: 180,
  titre: "Le bon algorithme",
  objectif: "Explique quel algorithme utiliser selon le problème, et combien de travail il demande.",
  recit: [
    { qui: "vex", expr: "serieux", texte: "Chez Abyssal, on lançait les programmes sans réfléchir. Ça plantait tout le temps." },
    { qui: "luci", texte: "Un bon programmeur ne connaît pas seulement les algorithmes : il sait **lequel choisir**, et ce qu'il coûte." },
  ],
  rappel: {
    titre: "Les algorithmes de base",
    texte: R`- **Compter / additionner** : un accumulateur qui grandit à chaque tour.
- **Maximum / minimum** : un champion, remplacé dès qu'on trouve mieux.
- **Filtrer** : une liste vide + @append@ pour ceux qui conviennent.
- **Rechercher** : on s'arrête (@return@) dès qu'on trouve.
- **Trier** : par exemple le tri par sélection.`,
    memo: "algo-maximum",
  },
  etapes: [
    { type: "associer", q: "Relie chaque problème à l'algorithme qui le résout.",
      gauche: ["Garder seulement les tortues de plus de 100 kg", "Trouver le plus long dauphin", "Savoir si la liste contient « requin »", "Calculer le poids total des prises", "Ranger les tailles de la plus petite à la plus grande"],
      droite: ["filtrer", "maximum", "rechercher", "additionner", "trier"],
      bonnes: [0, 1, 2, 3, 4],
      expl: "Reconnaître l'algorithme, c'est déjà la moitié du travail.",
      aide: "Cherche le mot-clé de chaque problème : « garder seulement », « le plus », « contient », « total », « ranger »." },
    { type: "choix", q: "Pour trouver le maximum d'une liste de 1 000 nombres, combien de comparaisons @if p > maxi@ faut-il environ ?",
      choix: ["Environ 1 000 (une par élément)", "Environ 1 000 000", "Une seule"], bonne: 0,
      expl: "On regarde chaque élément une fois : le travail grandit **comme la taille de la liste**.",
      pieges: { 1: "Ça, c'est l'ordre de grandeur d'un tri par sélection, pas d'un maximum.", 2: "Il faut bien regarder tous les éléments pour être sûr." } },
    { type: "choix", q: "Si la liste est **2 fois plus longue**, le tri par sélection prend environ…",
      choix: ["2 fois plus de temps", "4 fois plus de temps", "le même temps"], bonne: 1,
      expl: "Le tri par sélection fait environ n²/2 comparaisons : doubler n multiplie le travail par 4.",
      pieges: { 0: "Ce serait vrai pour le maximum. Le tri contient **deux** boucles imbriquées." } },
    { type: "ligne", q: "Cette fonction de recherche contient une erreur. Clique sur la ligne fautive.",
      code: R`def contient(liste, x):
    for element in liste:
        if element == x:
            return True
        else:
            return False`,
      bonne: 6,
      expl: "Avec ce @return False@ dans la boucle, la fonction s'arrête dès le premier élément. Le @return False@ doit être **après** la boucle (sans @else@).",
      pieges: { 4: "@return True@ dès qu'on trouve, c'est juste. Le problème vient de la réponse « non ».", 5: "Le @else@ est suspect… mais c'est surtout la ligne en dessous qui pose problème." } },
    { type: "choix", q: "Pourquoi le maximum commence-t-il avec le **premier élément** plutôt qu'avec 0 ?",
      choix: ["Parce que 0 peut être plus grand que tous les éléments (s'ils sont négatifs)", "Parce que c'est plus rapide", "Parce que Python l'exige"], bonne: 0,
      expl: "Avec @[-5, -2, -9]@, partir de 0 donnerait 0, qui n'est même pas dans la liste.",
      pieges: { 1: "La vitesse est la même. Le problème, c'est un résultat faux.", 2: "Python accepte les deux : c'est l'algorithme qui serait faux." } },
  ],
  retenir: R`Choisir un algorithme : repérer le **mot-clé** du problème (le plus, le total, garder, contient, ranger). Estimer son **coût** : une boucle → proportionnel à n ; deux boucles imbriquées → proportionnel à n².`,
  apres: [{ qui: "luci", texte: "Analyse parfaite. Il reste un dernier défi : le rapport de l'expédition." }],
},
// -----------------------------------------------------------------------------
{
  id: "b27", chap: "e5", type: "code", competence: "ecrire", xp: 250,
  titre: "Le rapport de l'expédition",
  objectif: "Écris la fonction @rapport(observations)@ qui résume une liste de fiches dans un dictionnaire.",
  recit: [
    { qui: "luci", texte: "Chaque observation est une petite fiche : un dictionnaire avec l'espèce et la taille. J'ai besoin d'un rapport automatique." },
    { qui: "cap", expr: "serieux", texte: "C'est le dernier défi, Recrue. Découpe le problème en petits morceaux." },
  ],
  rappel: {
    titre: "Une liste de dictionnaires",
    texte: R`~~~
fiches = [{"espece": "mérou", "taille": 1.2}, {"espece": "raie", "taille": 3.1}]
for f in fiches:
    print(f["espece"], f["taille"])
~~~
Un résumé se construit souvent avec **plusieurs** variables mises à jour dans la **même** boucle : un total, un maximum…`,
    memo: "tableaux",
  },
  consigne: R`Écris @rapport(observations)@ qui renvoie un dictionnaire avec 3 clés :
- @"nombre"@ : le nombre d'observations ;
- @"moyenne"@ : la taille moyenne, **arrondie à 2 chiffres** avec @round(..., 2)@ ;
- @"plus_grand"@ : l'espèce de l'observation la plus grande.
On suppose que la liste n'est pas vide.`,
  setup: R`observations = [{"espece": "palétuvier", "taille": 6.5},
                {"espece": "héron", "taille": 0.9},
                {"espece": "crabe", "taille": 0.1},
                {"espece": "mérou juvénile", "taille": 0.3}]`,
  starter: R`def rapport(observations):
    ...


print(rapport(observations))   # {'nombre': 4, 'moyenne': 1.95, 'plus_grand': 'palétuvier'}
`,
  check: R`
f = fonction("rapport")
def att(obs):
    m = obs[0]
    for o in obs:
        if o["taille"] > m["taille"]:
            m = o
    return {"nombre": len(obs), "moyenne": round(sum(o["taille"] for o in obs) / len(obs), 2), "plus_grand": m["espece"]}
tests = [D["observations"], [{"espece": "a", "taille": 2}], [{"espece": "a", "taille": 1}, {"espece": "b", "taille": 4}, {"espece": "c", "taille": 4}],
         [{"espece": "x", "taille": 0.5}, {"espece": "y", "taille": 0.25}, {"espece": "z", "taille": 0.125}]]
for obs in tests:
    r = appel(f, obs)
    a = att(obs)
    if r is None:
        echec("Ta fonction ne renvoie rien : il faut @return@ un dictionnaire.")
    if not isinstance(r, dict):
        echec("Ta fonction doit renvoyer un **dictionnaire**, pas %s." % montre(r))
    manquantes = [k for k in ("nombre", "moyenne", "plus_grand") if k not in r]
    if manquantes:
        echec("Il manque la clé %s dans ton dictionnaire." % montre(manquantes[0]))
    if r["nombre"] != a["nombre"]:
        echec("@\"nombre\"@ vaut %s au lieu de %s pour %s." % (montre(r["nombre"]), a["nombre"], montre(obs, 160)))
    if r["moyenne"] != a["moyenne"]:
        if isinstance(r["moyenne"], float) and abs(r["moyenne"] - a["moyenne"]) < 0.01:
            echec("La moyenne est presque juste : arrondis-la avec @round(moyenne, 2)@.")
        echec("@\"moyenne\"@ vaut %s au lieu de %s pour %s." % (montre(r["moyenne"]), a["moyenne"], montre(obs, 160)))
    if isinstance(r["plus_grand"], dict):
        echec("@\"plus_grand\"@ contient toute la fiche : garde seulement l'**espèce**, @fiche[\"espece\"]@.")
    if r["plus_grand"] != a["plus_grand"]:
        echec("@\"plus_grand\"@ vaut %s au lieu de %s pour %s." % (montre(r["plus_grand"]), montre(a["plus_grand"]), montre(obs, 160)))
`,
  indices: [
    "Découpe : 1) le nombre, c'est @len(observations)@ ; 2) la moyenne, c'est la somme des tailles divisée par le nombre ; 3) le plus grand, c'est l'algorithme du maximum.",
    "Une seule boucle peut tout faire : @total = total + o[\"taille\"]@, et si @o[\"taille\"] > maxi@, on retient @o[\"espece\"]@.",
    "À la fin : @return {\"nombre\": n, \"moyenne\": round(total / n, 2), \"plus_grand\": meilleur}@.",
  ],
  solution: R`def rapport(observations):
    n = len(observations)
    total = 0
    maxi = observations[0]["taille"]
    meilleur = observations[0]["espece"]
    for o in observations:
        total = total + o["taille"]
        if o["taille"] > maxi:
            maxi = o["taille"]
            meilleur = o["espece"]
    return {"nombre": n, "moyenne": round(total / n, 2), "plus_grand": meilleur}


print(rapport(observations))   # {'nombre': 4, 'moyenne': 1.95, 'plus_grand': 'palétuvier'}
`,
  retenir: R`Tu as combiné **tout** ce que tu sais : parcours d'une liste de dictionnaires, accumulateur, maximum, construction d'un dictionnaire résultat. Bravo, expert·e des profondeurs !`,
  apres: [
    { qui: "luci", ecran: true, sortie: true, texte: "Rapport transmis :" },
    { qui: "narration", decor: "luciole", texte: "Le rapport est publié, ouvert à tous. Une semaine plus tard, Abyssal Collection ferme ses aquariums privés." },
    { qui: "vex", expr: "sourire", texte: "Finalement, coder pour protéger, c'est mieux que coder pour capturer." },
    { qui: "cap", expr: "sourire", texte: "Recrue… non. Tu n'es plus une recrue. La Luciole t'attend quand tu veux." },
    { qui: "huit", expr: "rire", texte: "♪♪♪" },
  ],
},
];
})();
