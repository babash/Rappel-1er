# 🧱 Architecture

[← Retour au README](../README.md) · [Guide de la séance](GUIDE.md) · [Données et sécurité](DONNEES.md) · [Installer sa copie](INSTALLER.md)

Pour qui veut modifier les missions, relire le code ou le faire évoluer : le format des missions, le vérificateur, les tests, les fichiers du dépôt et les sources du carnet de bord.

---

## 1. Modifier ou ajouter des missions

Tout le contenu est dans `js/data/` :

- `missions-principales.js` et `missions-bonus.js` : les missions (le format complet est décrit en tête de `missions-principales.js`) ;
- `memo.js` : les fiches du mémo ;
- `univers.js` : personnages, compétences, chapitres, espèces du carnet, rangs, emblèmes, thèmes, badges, prologue et épilogue ;
- `js/ui/persos.js` (dessins des personnages et de leurs expressions) et `js/ui/manga.js` (les planches et leurs décors).

Chaque mission a un `type` :

| Type | Ce que fait l'élève | Champs principaux |
|---|---|---|
| `etapes` | une suite de petites étapes | `etapes: [{ type, q, … }]` (types ci-dessous) |
| `commande` | tape des commandes dans une console | `commandes: [{ consigne, check, solution, indice, reponse }]` |
| `parsons` | remet des lignes dans l'ordre et les décale | `parsons: { lignes, distracteurs }`, `check` |
| `trace` | remplit un tableau d'avancement | `code`, `trace: { avant, colonnes, lignes, donnees, apres }` |
| `code` | complète, corrige ou écrit un programme | `consigne`, `starter`, `check`, `solution`, `indices` |

Les types d'étapes (dans `etapes`, et dans `avant` pour le plan d'une mission) :

| Type | L'élève… | Champs |
|---|---|---|
| `phrase` | complète une phrase avec des étiquettes | `phrase: "… {{0}} … {{1}}"`, `trous: [{ choix, bonne, aide }]` |
| `annoter` | dit ce que fait chaque ligne marquée | `code`, `etiquettes: [...]`, `notes: [{ ligne, bonne }]` |
| `case` | touche une case d'une liste, d'un dictionnaire ou d'une grille | `donnee` ou `valeur` (+ `nom`), `bonne` ou `bonnes`, `resultat` (liste affichée après) |
| `emplacement` | touche l'endroit où un élément arrive | `liste`, `valeur`, `bonne` (numéro de l'emplacement), `resultat` |
| `ligne` | touche une ligne de code | `code`, `bonne` ou `bonnes` |
| `associer` | relie par des traits | `gauche`, `droite`, `bonnes` |
| `trous` | complète du code avec des étiquettes | `code: "… {{0}} …"`, `trous` |
| `choix`, `saisie` | QCM, réponse courte | `choix`, `bonne` / `rep` |

Chaque étape peut avoir `expl` (après la bonne réponse), `aide` et `pieges` (message selon la mauvaise réponse choisie).

**L'histoire d'une mission** : `recit` (la scène), `replique` (la réponse de l'élève) et `apres` (la suite) sont des listes de cases :

```js
{ qui: "cap", expr: "colere", texte: "Trouve **où** il est.", type: "cri", fx: "BOUM !" }
{ qui: "narration", decor: "espece:dugong", texte: "−3 m. L'herbier." }
{ qui: "vex", radio: true, texte: "…" }               // le personnage parle depuis un écran
{ qui: "luci", ecran: true, sortie: true, texte: "Résultat :" }  // affiche la sortie du programme de l'élève
replique: { q: "Que veut Nour ?", choix: ["…", "…"], bonne: 0, retours: { 1: { qui: "nour", texte: "…" } } }
```

Personnages : `cap`, `bolt`, `nour`, `luci`, `huit`, `vex`, `orsa`, `gombessa`, `narration`. Expressions : `neutre`, `sourire`, `rire`, `serieux`, `colere`, `choc`, `sueur`, `triste`, `malin`. Décors : `hangar`, `luciole`, `leviathan`, `duo`, `drone`, `grotte`, `gombessa`, `lumieres`, `espece:<id du carnet>`.

Dans les textes : `**gras**`, `@code@` pour du code en ligne, blocs de code entre deux lignes `~~~`.

Le **vérificateur** (`check`) est du Python exécuté après le code de l'élève (`js/core/harness.py`). Il dispose de :

| Outil | Rôle |
|---|---|
| `echec("message")`, `verifie(condition, "message")` | refuse la réponse avec ce message |
| `var("nom", list)` | variable de l'élève (message clair si elle manque ou n'a pas le bon type) |
| `fonction("nom")`, `appel(f, *args)` | récupère et teste une fonction (paramètres copiés, erreurs traduites) |
| `appel_direct(f, *args)` | idem, sans copie (pour une fonction qui modifie ses paramètres) |
| `lignes`, `sortie` | ce que le programme a affiché |
| `code_sc`, `utilise(r"motif")` | le code sans commentaires / recherche d'une instruction hors des textes |
| `D["variable"]` | les données de la mission, intactes |
| `resultat`, `commande`, `est_expression` | (console) la valeur de la commande, son texte, et si c'est une expression |

**Vérifier ses modifications** (Python 3 et Node.js) :

```bash
node tests/export_missions.js /tmp/missions.json
python3 tests/test_missions.py /tmp/missions.json
```

Le script vérifie que chaque solution est acceptée (code, lignes à ordonner, chaque commande de la console), que chaque code de départ est refusé, que les réponses des étapes, des plans et des répliques existent, que les personnages et expressions des scènes sont connus, que les tableaux d'avancement sont justes, et qu'une centaine d'erreurs d'élèves typiques produisent le bon message.

Après une modification de `js/core/harness.py`, lancer `python3 outils/embarquer_harness.py` (il recopie le moteur dans `harness-source.js`).

---

## 2. Fichiers, sources et crédits

```
index.html              le jeu (élèves)
prof.html               le tableau de bord (enseignant·e)
css/                    styles (style.css, manga.css, prof.css)
js/config.js            ← le seul fichier à remplir (Supabase, délais)
js/data/                le contenu : missions, mémo, univers
js/core/                moteur : Python (Pyodide), éditeur, sauvegarde (cookies + Supabase), harness.py
js/ui/                  interface : activités, missions, planches de manga, personnages, plongée, illustrations, outils
supabase/schema.sql     base de données à installer dans Supabase
tests/                  tests automatiques des missions, serveur de test local
outils/                 script qui embarque harness.py dans le site
docs/                   les guides (séance, données, installation, architecture) et les images du README
vendor/                 bibliothèques embarquées (Pyodide 314.0.7, Ace 1.45.2, qrcode-generator 1.4.4)
```

**Faits du carnet de bord**, vérifiés auprès de :
[Parc naturel marin de Mayotte (OFB)](https://www.parc-marin-mayotte.fr),
[Futura-Sciences](https://www.futura-sciences.com),
[Mayotte Hebdo](https://www.mayottehebdo.com),
[projet ANR « DZIANI » (ANR-13-BS06-0001)](https://anr.fr/Projet-ANR-13-BS06-0001),
[Sci.News, âge des cœlacanthes](https://www.sci.news),
[site de l'expédition Gombessa](https://sites.google.com/view/gombessa).

- Les illustrations (personnages et leurs expressions, sous-marins, espèces, décors, coupe de la plongée) sont des dessins vectoriels originaux faits pour ce jeu. Personnages, histoire et données des exercices sont fictifs.
- [Pyodide](https://pyodide.org) (licence MPL-2.0) : Python dans le navigateur.
- [Ace](https://ace.c9.io) (licence BSD) : éditeur de code.
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) de Kazuhiko Arase (licence MIT) : QR codes d'inscription. « QR Code » est une marque déposée de DENSO WAVE.
- Polices Lexend, Bricolage Grotesque, Bangers et JetBrains Mono (licence SIL OFL, via Google Fonts).

Les licences du code et des documents sont dans la section [Licence](../README.md#licence) du README.
