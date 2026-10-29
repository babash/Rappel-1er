// =============================================================================
//  LE MÉMO : les rappels de cours, toujours accessibles (bouton « Mémo »).
//  Chaque bloc de code ~~~ peut être lancé dans le bac à sable.
//  Directives visuelles (une ligne seule) :
//    ::liste nom [json]       → dessin d'une liste avec ses indices
//    ::dico nom {json}        → dessin d'un dictionnaire clé → valeur
//    ::reference              → schéma « copie ou référence »
// =============================================================================
window.BNL = window.BNL || {};
(() => {
const R = String.raw;

BNL.MEMO = [
{
  groupe: "Les mots pour expliquer", icone: "💬",
  fiches: [
    { id: "vocabulaire", titre: "Dire ce que fait un programme",
      texte: R`Pour **expliquer** un programme, on utilise des mots précis.

| Ce que je vois | Ce que je dis |
|---|---|
| @[4, 7, 2]@ | une **liste** : des éléments dans un ordre précis, repérés par leur **indice** (0, 1, 2…) |
| @{"nom": "dugong", "taille": 3}@ | un **dictionnaire** : des **clés** associées à des **valeurs** |
| @("10h12", 3)@ | un **tuple** : comme une liste, mais on ne peut pas le modifier |
| @for x in liste:@ | un **parcours par valeur** : x prend chaque élément |
| @for i in range(len(liste)):@ | un **parcours par indice** : i prend chaque position |
| @for cle in dico:@ | un **parcours des clés** du dictionnaire |
| @for cle, valeur in dico.items():@ | un **parcours clé-valeur** |
| @total = total + x@ | un **accumulateur** : il grandit à chaque tour |
| @nb = nb + 1@ (dans un @if@) | un **compteur** : il compte les éléments qui vérifient une condition |
| @if x > maxi: maxi = x@ | on garde un **champion** : l'algorithme du **maximum** |

Phrases utiles :
- « Pour chercher un élément dans une liste, je dois parcourir les éléments **un par un** et comparer chacun avec la valeur cherchée. »
- « Pour trouver le maximum, je dois regarder **toutes** les valeurs et garder la plus grande vue jusqu'ici. »
- « Pour modifier une liste dans une boucle, il me faut un **parcours par indice**. »
- « Avant la boucle, je prépare ; dans la boucle, je traite chaque élément ; après la boucle, j'affiche le résultat. »`,
    },
  ],
},
{
  groupe: "Les listes", icone: "📋",
  fiches: [
    { id: "listes-indices", titre: "Créer une liste, lire ses éléments",
      texte: R`Une **liste** est une collection **ordonnée** et **modifiable** (on dit *mutable*). Elle s'écrit entre crochets @[ ]@ et peut contenir des éléments de types différents.

::liste outils ["lampe", "sonar", "pince", "filet"]

- Chaque élément a une position : son **indice**. ⚠️ **On commence à 0.**
- Les indices **négatifs** comptent depuis la fin : @-1@ est le dernier.
- @len(liste)@ donne le nombre d'éléments. Le dernier indice vaut @len(liste) - 1@.

~~~
outils = ["lampe", "sonar", "pince", "filet"]
vide = []                  # une liste vide
print(outils[0])           # lampe
print(outils[-1])          # filet
print(len(outils))         # 4
print(outils[4])           # IndexError : l'indice 4 n'existe pas !
~~~` },
    { id: "listes-modifier", titre: "Modifier, ajouter, retirer",
      texte: R`Une liste est modifiable : on peut changer, ajouter et retirer des éléments.

| Instruction | Effet |
|---|---|
| @liste[i] = x@ | remplace l'élément d'indice i |
| @liste.append(x)@ | ajoute x **à la fin** |
| @liste.insert(i, x)@ | insère x à l'indice i (les suivants se décalent) |
| @liste.extend(autre)@ | ajoute **tous** les éléments d'une autre liste à la fin |
| @liste.pop(i)@ | retire l'élément d'indice i **et le renvoie** |
| @liste.pop()@ | retire et renvoie le **dernier** élément |
| @liste.remove(x)@ | retire la première valeur égale à x |
| @x in liste@ | @True@ si x est dans la liste |

~~~
jours = ["lundi", "mardi"]
jours.append("jeudi")          # ['lundi', 'mardi', 'jeudi']
jours.insert(2, "mercredi")    # ['lundi', 'mardi', 'mercredi', 'jeudi']
jours.extend(["vendredi", "samedi"])
retire = jours.pop()           # retire 'samedi'
print(retire, jours)
print("mardi" in jours)        # True
~~~
⚠️ Ces méthodes modifient la liste **directement** et ne renvoient rien (sauf @pop@) : n'écris jamais @jours = jours.append(x)@, cela remplace ta liste par @None@ !` },
    { id: "listes-parcours", titre: "Parcourir une liste (3 façons)",
      texte: R`La boucle @for@ est l'outil principal pour parcourir une liste.

**1. Par élément** : le plus simple, quand on n'a pas besoin de la position.
~~~
balises = ["herbier", "récif"]
for b in balises:
    print(b)
~~~
**2. Par indice** : quand on a besoin de la position (par exemple pour comparer un élément au suivant).
~~~
balises = ["herbier", "récif"]
for i in range(len(balises)):
    print("Balise n°", i, ":", balises[i])
~~~
**3. Les deux à la fois avec @enumerate@** : le plus élégant.
~~~
balises = ["herbier", "récif"]
for i, b in enumerate(balises):
    print("Indice", i, ":", b)
~~~
@range(n)@ donne 0, 1, …, n−1 ; @range(a, b)@ donne a, a+1, …, b−1.` },
    { id: "listes-slicing", titre: "Découper une liste (slicing)",
      texte: R`@liste[debut:fin]@ crée une **nouvelle liste** de l'indice @debut@ jusqu'à @fin@ **exclu**.

::liste animaux ["crabe", "raie", "mérou", "requin"]

~~~
animaux = ["crabe", "raie", "mérou", "requin"]
print(animaux[1:3])    # ['raie', 'mérou']    ← l'indice 3 est exclu
print(animaux[:2])     # ['crabe', 'raie']    ← depuis le début
print(animaux[2:])     # ['mérou', 'requin']  ← jusqu'à la fin
print(animaux[-2:])    # ['mérou', 'requin']  ← les 2 derniers
print(animaux[:])      # une copie complète
~~~` },
    { id: "listes-copie", titre: "Copier une liste : attention aux références !",
      texte: R`⚠️ Avec le signe @=@, on **ne copie pas** une liste : les deux variables désignent le **même objet** en mémoire. On appelle cela une **référence**.

::reference

~~~
liste_a = [1, 2, 3]
liste_b = liste_a          # une référence, PAS une copie
liste_b.append(4)
print(liste_a)             # [1, 2, 3, 4]  ← liste_a a changé aussi !

liste_c = liste_a.copy()   # une vraie copie (ou liste_a[:])
liste_c.append(5)
print(liste_a)             # [1, 2, 3, 4]
print(liste_c)             # [1, 2, 3, 4, 5]
~~~
Même piège avec @[[0] * 3] * 3@ : les trois lignes sont la **même** liste. Écris plutôt @[[0] * 3 for _ in range(3)]@.` },
  ],
},
{
  groupe: "Les dictionnaires", icone: "📖",
  fiches: [
    { id: "dicos-acces", titre: "Créer un dictionnaire, lire une valeur",
      texte: R`Un **dictionnaire** stocke des paires **clé → valeur**, entre accolades @{ }@. Chaque clé est **unique** et sert à retrouver sa valeur. Il n'y a pas d'indices 0, 1, 2…

::dico fiche {"nom": "tortue verte", "age": 25, "plage": "Est"}

~~~
fiche = {"nom": "tortue verte", "age": 25, "plage": "Est"}
vide = {}                           # un dictionnaire vide
print(fiche["nom"])                 # tortue verte
print(len(fiche))                   # 3 (paires)
print(fiche.get("poids", "?"))      # ? (clé absente : valeur par défaut)
print(fiche.get("poids"))           # None
print("age" in fiche)               # True
print(fiche["Nom"])                 # KeyError : majuscule !
~~~
- @dico[cle]@ → erreur @KeyError@ si la clé n'existe pas.
- @dico.get(cle, defaut)@ → ne plante jamais.
- @cle in dico@ / @cle not in dico@ → @True@ ou @False@.
- Les clés sont sensibles aux **majuscules** et aux **accents**.` },
    { id: "dicos-modifier", titre: "Ajouter, modifier, supprimer",
      texte: R`On ajoute **et** on modifie avec la même écriture : @dico[cle] = valeur@. Si la clé existe, sa valeur est remplacée ; sinon, la paire est créée.

~~~
bateau = {"nom": "Luciole", "places": 2}
bateau["moteur"] = "électrique"   # ajout d'une nouvelle paire
bateau["places"] = 3              # modification
print(bateau)

m = bateau.pop("moteur")          # supprime ET renvoie la valeur
del bateau["places"]              # supprime
print(m, bateau)                  # électrique {'nom': 'Luciole'}
~~~
Copier : @copie = dico.copy()@ (avec @=@, c'est une référence, comme pour les listes).
Un dictionnaire n'a **pas** de méthode @append@.` },
    { id: "dicos-parcours", titre: "Parcourir un dictionnaire (3 façons)",
      texte: R`~~~
stock = {"masques": 3, "palmes": 5, "lampes": 2}

for cle in stock:                      # 1. les clés
    print(cle)

for valeur in stock.values():          # 2. les valeurs
    print(valeur)

for cle, valeur in stock.items():      # 3. les paires (le plus pratique)
    print(cle, "→", valeur)
~~~
⚠️ @for cle, valeur in stock:@ (sans @.items()@) provoque une erreur @ValueError@.` },
  ],
},
{
  groupe: "Tuples et tableaux", icone: "🧩",
  fiches: [
    { id: "tuples", titre: "Les tuples",
      texte: R`Un **tuple** est comme une liste, mais entre **parenthèses** et **non modifiable** (immuable).
~~~
joueurs = ("X", "O")
print(joueurs[1])          # O
j1, j2 = joueurs           # déballage : j1 = "X", j2 = "O"
print(len(joueurs))        # 2

def min_max(liste):
    return min(liste), max(liste)     # une fonction peut renvoyer un tuple
petit, grand = min_max([4, 9, 1])
print(petit, grand)
~~~
@joueurs[1] = "Ø"@ → @TypeError@. Pour « modifier » un tuple rangé dans un dictionnaire, on le **remplace** : @plages["Est"] = (20, 31)@.` },
    { id: "tableaux", titre: "Listes de listes, dictionnaires de dictionnaires",
      texte: R`Une **liste de listes** représente un tableau ou une grille : @tab[ligne][colonne]@.
~~~
grille = [["X", "O", " "],
          [" ", "X", " "],
          ["O", " ", "X"]]
print(grille[0])       # la ligne du haut : ['X', 'O', ' ']
print(grille[1][1])    # le centre : X
grille[0][2] = "O"     # modifier une case
for ligne in grille:
    print(ligne)
~~~
Un **dictionnaire de dictionnaires** donne un accès direct par le nom :
~~~
stations = {"Arche": {"poissons": 120, "coraux": 35}, "Herbier": {"poissons": 40, "coraux": 2}}
print(stations["Arche"]["coraux"])    # 35
for nom, s in stations.items():
    print(nom, s["poissons"])
~~~` },
    { id: "choisir", titre: "Liste, dictionnaire ou tuple ?",
      texte: R`| Je veux… | J'utilise |
|---|---|
| des éléments **dans un ordre**, repérés par leur position | une **liste** @[ ]@ |
| retrouver une valeur grâce à un **nom** ou un identifiant | un **dictionnaire** @{ }@ |
| des données **fixes** qui ne doivent pas changer | un **tuple** @( )@ |
| un tableau / une grille | une **liste de listes** |
| des fiches avec plusieurs champs, retrouvées par nom | un **dictionnaire de dictionnaires** |` },
  ],
},
{
  groupe: "Les algorithmes de base", icone: "⚙️",
  fiches: [
    { id: "algo-somme", titre: "Somme, moyenne, compter",
      texte: R`Le modèle de l'**accumulateur** : une variable qui commence à 0 et grossit à chaque tour.
~~~
notes = [12, 15, 8, 17]
total = 0
for n in notes:
    total = total + n
moyenne = total / len(notes)
print(total, moyenne)

nb_bonnes = 0                 # compter les éléments qui vérifient une condition
for n in notes:
    if n >= 10:
        nb_bonnes = nb_bonnes + 1
print(nb_bonnes)
~~~` },
    { id: "algo-maximum", titre: "Maximum et minimum (avec la position)",
      texte: R`On garde un **champion provisoire** et on le remplace dès qu'on trouve mieux.
~~~
temperatures = [28, 31, 27, 33, 30]
maxi = temperatures[0]          # le premier est champion provisoire
position = 0
for i in range(len(temperatures)):
    if temperatures[i] > maxi:  # pour le minimum : <
        maxi = temperatures[i]
        position = i
print(maxi, "à l'indice", position)    # 33 à l'indice 3
~~~
Avec un dictionnaire :
~~~
tailles = {"raie": 4.5, "mérou": 1.2, "dauphin": 2.4}
plus_grand = None
taille_max = 0
for nom, t in tailles.items():
    if plus_grand is None or t > taille_max:
        taille_max = t
        plus_grand = nom
print(plus_grand, taille_max)
~~~
⚠️ Avec @>@, en cas d'égalité, c'est le premier rencontré qui reste champion.` },
    { id: "algo-filtrer", titre: "Filtrer : garder ceux qui conviennent",
      texte: R`Liste vide → boucle → condition → @append@.
~~~
profondeurs = {"herbier": 3, "récif": 12, "passe": 30, "tombant": 80}
peu_profonds = []
for lieu, p in profondeurs.items():
    if p <= 12:
        peu_profonds.append(lieu)
print(peu_profonds)    # ['herbier', 'récif']
~~~` },
    { id: "algo-compter", titre: "Compter les apparitions (avec un dictionnaire)",
      texte: R`~~~
vus = ["raie", "tortue", "raie", "requin", "raie"]
compteur = {}
for v in vus:
    if v in compteur:
        compteur[v] = compteur[v] + 1     # déjà vu : +1
    else:
        compteur[v] = 1                   # première fois
print(compteur)    # {'raie': 3, 'tortue': 1, 'requin': 1}
~~~
Variante en une ligne dans la boucle : @compteur[v] = compteur.get(v, 0) + 1@.` },
    { id: "algo-recherche", titre: "Rechercher : s'arrêter dès qu'on trouve",
      texte: R`@return@ arrête la fonction immédiatement, même au milieu d'une boucle.
~~~
def contient(liste, x):
    for element in liste:
        if element == x:
            return True      # trouvé : on s'arrête
    return False             # APRÈS la boucle : on a tout vu sans trouver

print(contient([3, 8, 1], 8))   # True
print(contient([3, 8, 1], 5))   # False
~~~
⚠️ Erreur classique : mettre @return False@ dans un @else@ à l'intérieur de la boucle (la fonction s'arrêterait dès le premier élément).` },
    { id: "algo-trie", titre: "Vérifier qu'une liste est triée",
      texte: R`On compare chaque élément au **suivant**. La boucle s'arrête un tour avant la fin pour que @tab[i + 1]@ existe.
~~~
def verifie(tab):
    for i in range(len(tab) - 1):
        if tab[i] > tab[i + 1]:
            return False
    return True

print(verifie([0, 5, 8, 8, 9]))   # True
print(verifie([5, 3, 1]))         # False
~~~` },
    { id: "algo-tri", titre: "Trier (tri par sélection)",
      texte: R`Pour chaque position @i@ : chercher le plus petit élément à partir de @i@, puis l'échanger avec @tab[i]@.
~~~
def tri_selection(tab):
    t = tab.copy()
    for i in range(len(t)):
        i_min = i
        for j in range(i + 1, len(t)):
            if t[j] < t[i_min]:
                i_min = j
        t[i], t[i_min] = t[i_min], t[i]
    return t

print(tri_selection([92, 85, 101, 78]))    # [78, 85, 92, 101]
~~~
En pratique, Python trie avec @sorted(liste)@ (nouvelle liste) ou @liste.sort()@ (modifie la liste).` },
  ],
},
{
  groupe: "Syntaxe Python", icone: "🐍",
  fiches: [
    { id: "syntaxe", titre: "Variables, affichage, conditions, boucles, fonctions",
      texte: R`~~~
age = 16                       # une variable reçoit une valeur avec =
nom = "Huit"                   # un texte se met entre guillemets
print("Bonjour", nom)          # print sépare par des espaces
print(f"{nom} a {age} ans")    # f-string : les { } sont remplacées

if age >= 18:                  # == égal, != différent, < <= > >=
    print("majeur")
elif age >= 16:
    print("presque")
else:
    print("mineur")

for i in range(3):             # 0, 1, 2
    print(i)

def carre(x):                  # une fonction
    return x * x
print(carre(5))                # 25
~~~
**L'indentation** (le décalage de 4 espaces) indique ce qui fait partie d'un bloc. Toute ligne qui finit par @:@ est suivie d'un bloc décalé.` },
    { id: "modulo", titre: "Division entière et modulo (%)",
      texte: R`@a // b@ est le **quotient** de la division entière, @a % b@ son **reste**.
~~~
print(17 // 5)    # 3   (17 = 3 × 5 + 2)
print(17 % 5)     # 2
print(10 % 2)     # 0   : 10 est pair
~~~
Le reste @t % n@ est toujours entre 0 et n − 1 : pratique pour **revenir au début** d'une liste.
~~~
sons = ["ououou", "grrr", "boum"]
for t in range(7):
    print(t, sons[t % len(sons)])   # ououou, grrr, boum, ououou…
~~~` },
    { id: "erreurs", titre: "Les erreurs fréquentes",
      texte: R`| Message | Ce que ça veut dire |
|---|---|
| @SyntaxError: expected ':'@ | il manque @:@ après @if@, @for@, @def@, @else@… |
| @IndentationError@ | le décalage des lignes n'est pas bon |
| @NameError: name 'x' is not defined@ | faute de frappe, variable jamais créée, ou guillemets oubliés |
| @IndexError: list index out of range@ | l'indice n'existe pas (rappel : de 0 à @len - 1@) |
| @KeyError: 'cle'@ | la clé n'existe pas (majuscules ? accents ?) → @.get()@ ou @in@ |
| @TypeError: can only concatenate str@ | texte + nombre : utilise @str()@ ou une f-string |
| @TypeError: 'tuple' object does not support item assignment@ | un tuple ne se modifie pas |
| @AttributeError: 'dict' object has no attribute 'append'@ | pour un dictionnaire : @dico[cle] = valeur@ |
| @ValueError: too many values to unpack@ | il manque souvent @.items()@ dans un @for cle, valeur in ...@ |

Un message d'erreur est un **indice** : lis la **dernière ligne** et le **numéro de ligne**.` },
  ],
},
];
})();
