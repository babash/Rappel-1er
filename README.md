# 🐟 Expédition Gombessa

Une plongée en Python à la recherche du **cœlacanthe** (le *gombessa*), pour **réviser en début de Terminale NSI** les notions de 1re sur les **listes**, les **dictionnaires** et les **algorithmes de base**. L'histoire se lit comme un **manga** : cases, bulles, onomatopées, un équipage, un rival.

Un drone d'**Abyssal Collection** (des collectionneurs qui capturent des espèces rares pour des milliardaires) a saboté le sous-marin *Luciole* : son IA de bord, **LUCI**, ne comprend plus qu'une seule langue, **Python**. L'élève, « la Recrue », devient la voix de l'équipage auprès de LUCI : **sans son code, la Luciole n'avance pas**. Avec la **Capitaine Sel**, **Bolt** le mécano, la biologiste **Dr Nour** et **Huit**, un poulpe clandestin, il faut atteindre les grottes du gombessa, à 250 m, avant **Vex**, le pilote rival du *Léviathan*, et sa patronne **Orsa Kell**.

- **Parcours principal : 13 missions, environ 1 h 15** pour un élève en difficulté (scènes et briefings compris).
- **5 expéditions bonus : 27 missions** de plus en plus exigeantes : lac Dziani, recensement du récif, chant des baleines, plages des tortues, mangrove. Vex rejoint l'équipage, Abyssal n'a pas dit son dernier mot.
- **L'histoire fait avancer le jeu.** Chaque mission commence par une **scène** (lecture obligatoire la première fois) qui se termine par une **réplique à choisir** : l'élève répond à l'équipage, et la bonne réponse est dans la scène. Après la réussite, la suite de l'histoire **utilise le résultat de son programme** (affiché sur l'écran de LUCI).
- **Un briefing de cours à lire avant chaque mission**, à fermer pour commencer.
- **Des activités variées**, souvent sans coder : cases et lignes à toucher, emplacements dans une liste, **liens à tracer**, **phrases à compléter avec des étiquettes**, **code à annoter**, code à trous, **console Python**, **lignes à remettre dans l'ordre**, tableau d'avancement, correction de bugs, écriture de programmes.
- **L'élève explicite ce qu'il fait** : « `fiche` est un dictionnaire », « c'est un parcours par indice », « pour chercher un élément, je parcours les éléments un par un »… Avant de coder, il **explique son plan** (étapes « Avant de coder »).
- **7 compétences** travaillées et suivies : repérer, comprendre, expliquer, compléter, corriger, concevoir, écrire.
- **Un code élève unique**, donné au début, **qui ne change jamais**, toujours visible (🔑).
- Python tourne **dans le navigateur** (Pyodide) : rien à installer. **Tout est statique** : GitHub Pages, plus Supabase (en option) pour le suivi de classe.
- **Pensé pour le téléphone** : planches verticales façon webtoon, une colonne, gros boutons, barre d'outils en bas.

**En ligne** : <https://babash.github.io/Rappel-1er/> · tableau de bord du professeur : <https://babash.github.io/Rappel-1er/prof.html>

---

## Sommaire

1. [Les missions](#1-les-missions)
2. [Ce qui aide les élèves](#2-ce-qui-aide-les-élèves)
3. [Le code élève et la sauvegarde (cookies d'un jour)](#3-le-code-élève-et-la-sauvegarde-cookies-dun-jour)
4. [Mettre le site en ligne (GitHub Pages)](#4-mettre-le-site-en-ligne-github-pages)
5. [Brancher le suivi de classe (Supabase)](#5-brancher-le-suivi-de-classe-supabase)
6. [En classe](#6-en-classe)
7. [Modifier ou ajouter des missions](#7-modifier-ou-ajouter-des-missions)
8. [Dépannage](#8-dépannage)
9. [Données personnelles et sécurité](#9-données-personnelles-et-sécurité)
10. [Fichiers, sources et crédits](#10-fichiers-sources-et-crédits)

---

## 1. Les missions

Déroulé d'une mission, la première fois :

1. **La scène** (planche de manga, case par case). Elle donne la raison de la mission et les informations utiles. Elle se termine par une **réplique** à choisir : une mauvaise réponse est corrigée par un personnage, sans pénalité, et l'élève rechoisit.
2. **Le briefing de LUCI** : le rappel de cours (avec dessins et, pour le maximum et le tri, une animation pas à pas). L'élève le ferme avec « C'est noté ».
3. **L'objectif** dans le cadre bleu, une seule phrase explicite, puis l'activité. Pour les programmes, une étape **« Avant de coder : explique ton plan »** vient d'abord ; une fois validé, le plan reste affiché au-dessus de l'éditeur.
4. **La réussite** : étoiles, la suite de l'histoire (avec la sortie du programme de l'élève), « À retenir ».

La scène et le briefing restent accessibles (« Revoir la scène », « Revoir le briefing »). Chaque case peut être **lue à voix haute** (🔊), ou toutes automatiquement (bouton « Lecture auto »).

### Parcours principal (environ 1 h 15)

| # | Chapitre | Mission | Activité | Compétence | Notions |
|---|---|---|---|---|---|
| 1 | Le hangar | Les casiers du hangar | Phrase à compléter, cases à toucher | 🔍 Repérer | liste, indices, `-1`, `len`, `IndexError` |
| 2 | Le hangar | Réveiller LUCI | Console | ✍️ Écrire | lire, `len`, `append`, `liste[i] = x` |
| 3 | Le hangar | Le chargement de la soute | Emplacements et cases à toucher, liens | 💡 Comprendre | `append`, `insert`, `pop`, `remove`, `liste[i] = x` |
| 4 | L'herbier | Les traces du dugong | Plan + code à trous | 🧩 Compléter | parcours `for`, accumulateur |
| 5 | L'herbier | Bolt contre LUCI | Code à annoter, liens, phrase | 💬 Expliquer | parcours **par valeur** / **par indice** |
| 6 | Le récif | La fiche du nudibranche | Plan + console | ✍️ Écrire | dictionnaire : clé, valeur, lire, modifier, ajouter, `in`, `len` |
| 7 | Le récif | Le recensement du récif | Plan + lignes à ordonner | 📐 Concevoir | `.items()`, avant / dans / après la boucle |
| 8 | La passe | Le scanner saboté | Code à annoter + programme à corriger | 🔧 Corriger | filtre ; `:` oublié, `liste = liste.append()`, `<` / `>` |
| 9 | La passe | Compter les géantes | Plan + tableau d'avancement | 💡 Comprendre | compteur |
| 10 | Le tombant | Le point le plus profond | Phrase, cases et lignes à toucher, liens | 💬 Expliquer | algorithme du maximum (animation) |
| 11 | Zone crépusculaire | La lumière la plus forte | Plan + code à trous | 🧩 Compléter | maximum **et sa position** (parcours par indice) |
| 12 | Grottes du Gombessa | Le registre des grottes | Plan + lignes à ordonner | 📐 Concevoir | compter avec un dictionnaire (2 niveaux de décalage) |
| 13 | Grottes du Gombessa | La rencontre | Plan + programme à écrire | ✍️ Écrire | compter + maximum, sans `max` |

### Expéditions bonus (ouvertes après la rencontre, dans l'ordre qu'on veut)

| Expédition | Missions | Notions |
|---|---|---|
| 🧫 Le lac Dziani | 6 | découpage (console), **copie / référence** (correction), `insert` / `extend` / `del`, `enumerate` (lignes à ordonner), tableau d'avancement de `est_triee`, paramètre par défaut |
| 📊 Le grand recensement | 6 | liste de listes avec en-tête (cases à toucher), maximum dans un tableau (avec plan), conversion en dictionnaire de dictionnaires, requêtes en console, clé variable, choix de structure |
| 🎶 Le chant des baleines | 5 | tuples (immuables, déballage), **modulo** (avec plan), grille et boucles imbriquées, maximum avec position `(i, j)`, recherche « pour tous » |
| 🐢 Les plages des tortues | 5 | dictionnaire de tuples, densité maximale, remplacer un tuple, regrouper en listes, tableau d'avancement d'un minimum (et son piège) |
| 🌿 Retour à la mangrove | 5 | tri par sélection, **rechercher un élément** (avec plan), compter puis maximum, choisir un algorithme et estimer son coût, rapport final sur une liste de dictionnaires |

Les fiches de cours et le devoir maison fournis ont servi de base : leurs exemples et leurs pièges (`liste_b = liste_a`, `range(len(tab) - 1)`, tableaux avec en-tête, fonction `verifie`…) sont repris dans cet univers. Les **données des exercices sont inventées** ; les faits du carnet de bord sont vérifiés (voir la section 10). Il n'y a ni police ni autorité dans l'histoire : les « méchants » sont une entreprise de collectionneurs venue de l'extérieur, et l'équipage gagne en **publiant ses données**.

---

## 2. Ce qui aide les élèves

- **L'objectif toujours en haut**, en une phrase, avec la compétence visée et la lecture à voix haute.
- **Le briefing avant chaque mission**, puis le même rappel toujours accessible dans la mission, avec les données dessinées (cases numérotées pour les listes, tableau clé → valeur pour les dictionnaires).
- **Des étapes au toucher plutôt que des QCM** : toucher la case `casiers[-1]`, l'endroit où `insert` place un élément, la valeur qui sort avec `pop()`, les valeurs qui deviennent « champion » ; tracer des liens entre une instruction et son effet ; compléter une phrase avec des étiquettes.
- **Le mémo**, toujours accessible, qui commence par **« Les mots pour expliquer »** (liste, dictionnaire, parcours par valeur / par indice / clé-valeur, accumulateur, compteur, champion…) puis : listes, dictionnaires, tuples et tableaux, algorithmes, modulo, syntaxe, erreurs fréquentes. Chaque exemple peut être lancé dans le **bac à sable**.
- **Des aides graduées, jusqu'à la correction :**
  - *Étapes et plan* : après une erreur, une explication ciblée sur la réponse choisie ; après deux erreurs, « Montre-moi la réponse ».
  - *Console* : après une erreur, un bouton « Indice » ; après deux, « Montre-moi la commande » (placée dans la console : l'élève la lit puis la valide).
  - *Programmes, lignes à ordonner, tableaux* : trois indices progressifs, puis la correction. Ils s'ouvrent après des essais ou après un délai (1 min 30, 3 min, 5 min, réglable dans `js/config.js`).
  - LUCI intervient quand un élève enchaîne les erreurs, répète la même faute ou n'ose pas lancer son code.
- **Les erreurs Python traduites** en français simple, avec la ligne fautive et une piste précise. Le message d'origine reste affiché pour apprendre à le lire.
- **Un vérificateur par mission** qui reconnaît les erreurs classiques et dit quoi corriger.
- **Un éditeur adapté** : coloration, **indentation en bandes de couleur**, **autocomplétion en français** (méthodes selon le type de la variable, clés du dictionnaire après `fiche["`), trous `___` repérés avant l'exécution. Dans la console, Entrée exécute, ↑ ↓ rappellent les commandes précédentes.
- **Police Lexend** (pensée pour la facilité de lecture), taille du code réglable, lecture à voix haute partout.

### Motivation

- **L'histoire** : un équipage, un rival, des enjeux ; chaque mission a une raison d'être dans le récit.
- **La plongée** : une coupe du lagon jusqu'à 250 m, avec les 7 balises, ton sous-marin et les emblèmes de tes camarades.
- **Le carnet de bord** : 12 pages illustrées (poulpe de jour, dugong, nudibranche, raie manta, dauphins, bioluminescence, cœlacanthe, lac Dziani, double barrière, baleine à bosse, tortue verte, mangrove).
- XP et **rangs d'équipage** (Recrue, Vigie, Pilote, Cartographe, Second du bord…), **22 badges**, **emblèmes** et **6 thèmes** à débloquer.
- **L'équipage** : chaque élève voit ses camarades avancer (sans classement de vitesse).

---

## 3. Le code élève et la sauvegarde (cookies d'un jour)

### Avec Supabase : un code unique, qui ne change jamais

À la première connexion, l'élève choisit sa classe, son prénom (ou un pseudo) et un emblème. Le site lui donne alors **son code d'expédition**, par exemple `CORAIL-MANTA-482` :

- il doit cocher « J'ai écrit mon code » avant de commencer (bouton 🔊 pour l'écouter) ;
- **ce code ne change jamais**, et il reste **toujours visible** : en haut de l'écran sur ordinateur, bouton **🔑 Mon code** dans la barre du bas sur téléphone ;
- avec ce code (« J'ai déjà un code »), l'élève reprend **depuis n'importe quel ordinateur ou téléphone**. Les tirets, majuscules et accents ne comptent pas ;
- le professeur voit tous les codes, peut **imprimer des étiquettes** et, seulement si besoin (code perdu ou divulgué), donner **un nouveau code** à un élève.

### Ce qui est gardé dans le navigateur

- **Des cookies d'un jour** (`gb_e0`, `gb_e1`… : durée de vie de 24 h, renouvelée à chaque action) contiennent la progression compacte : missions, étoiles, scènes et briefings déjà vus, badges, réglages et jeton de session. Environ 0,5 à 1,6 Ko, `SameSite=Lax`, `Secure` sur HTTPS, limités au dossier du site.
- **Les brouillons** (code tapé, lignes rangées, réponses du tableau) restent dans l'onglet (`sessionStorage`) et sur Supabase.
- **Aucune donnée n'est gardée plus d'un jour sur l'appareil** : pratique sur les ordinateurs partagés du lycée. Le lendemain, l'élève tape son code et retrouve tout depuis Supabase.
- Ces cookies servent uniquement au fonctionnement du jeu (ni publicité ni mesure d'audience) : ils sont strictement nécessaires.

### Sans Supabase

Sans serveur, il n'y a **pas de code élève** : la progression ne peut être rangée nulle part ailleurs que sur l'appareil, pendant **1 jour**. Pour un élève qui veut continuer un autre jour sans compte, le profil propose « **Sauvegarder pour un autre jour** » : un code de sauvegarde `GB-…` qui contient les missions réussies (il change donc quand on progresse ; à saisir dans *Jouer sans compte › J'ai une sauvegarde*). **Pour un code unique et fixe, il faut brancher Supabase** (section 5).

Si le site est ouvert directement depuis un fichier (`file://`), les cookies sont impossibles : le jeu utilise alors le stockage du navigateur, avec la même durée de vie d'un jour.

---

## 4. Mettre le site en ligne (GitHub Pages)

1. Sur [github.com](https://github.com), crée un **nouveau dépôt public**, par exemple `expedition-gombessa`.
2. **Add file › Upload files**, puis glisse **tout le contenu** du dossier (y compris `vendor/` et le fichier caché `.nojekyll`). Valide avec **Commit changes**.
   - Si `.nojekyll` n'apparaît pas, crée-le avec *Add file › Create new file* (nom : `.nojekyll`, contenu vide).
3. **Settings › Pages** : *Source* = **Deploy from a branch**, *Branch* = `main`, dossier `/ (root)`, puis **Save**.
4. Une à deux minutes plus tard, le site est en ligne :
   - jeu élève : `https://TON-PSEUDO.github.io/expedition-gombessa/`
   - tableau de bord : `https://TON-PSEUDO.github.io/expedition-gombessa/prof.html`

Le jeu fonctionne déjà **sans compte** (cookies d'un jour).

**Essayer toutes les missions soi-même** : ajoute `?toutouvert` à la fin de l'adresse (le prologue devient alors facultatif).

### Tester sur son ordinateur

Le plus fiable est de lancer un petit serveur dans le dossier du site :

```bash
python -m http.server 8000
```

puis d'ouvrir <http://localhost:8000>.

> **« Python n'a pas pu démarrer » quand j'ouvre `index.html` en double-cliquant : est-ce normal ?**
> Oui. Avec une adresse `file://`, le navigateur interdit les *workers* et le chargement des fichiers `.wasm` du site. Le jeu essaie alors de télécharger Python depuis Internet (jsDelivr), dans la page. Sans connexion, ou si le réseau bloque `cdn.jsdelivr.net`, Python ne démarre pas : un lien « Pourquoi ? » l'explique. Les questions, les lignes à cliquer et les tableaux d'avancement marchent quand même ; seules la console et les programmes ont besoin de Python. Supabase n'y est pour rien.

---

## 5. Brancher le suivi de classe (Supabase)

Supabase est une base de données en ligne dont l'offre gratuite suffit largement pour quelques classes. Tout passe par des **fonctions SQL appelées directement depuis le navigateur** : il n'y a aucun serveur à toi.

### 5.1 Créer le projet

1. Crée un compte sur [supabase.com](https://supabase.com), puis **New project**. Choisis une région européenne.
2. Ouvre **SQL Editor › New query**.
3. Ouvre `supabase/schema.sql`, **remplace `CHANGE-MOI`** (tout en bas) par le mot de passe du tableau de bord (au moins 8 caractères), copie tout, colle dans l'éditeur SQL, puis **Run**. *Success. No rows returned* : c'est installé. Le script peut être relancé sans risque.

> **Un seul projet Supabase pour plusieurs sites ?** C'est possible (l'offre gratuite limite le nombre de projets). Le script n'ajoute que des objets dont le nom commence par `gb_` (4 tables et des fonctions) et ne modifie ni ne supprime rien d'autre. Si une table `gb_eleves` existait déjà sans venir de ce jeu, il s'arrête avant toute modification.

### 5.2 Récupérer l'adresse et la clé publique

Dans **Project Settings › API Keys** (ou le bouton **Connect**), copie :

- l'**URL du projet** (`https://abcdefgh.supabase.co`) ;
- la **clé publique** : *Publishable key* (`sb_publishable_…`) ou, sur les anciens projets, la clé *anon public*.

⚠️ Ne copie **jamais** la clé *secret* ni *service_role*.

### 5.3 Renseigner `js/config.js`

```js
SUPABASE_URL: "https://abcdefgh.supabase.co",
SUPABASE_KEY: "sb_publishable_xxxxxxxxxxxxxxxx",
```

Sur GitHub : ouvre `js/config.js`, clique sur le crayon ✏️, colle les deux valeurs, puis **Commit changes**.

> La clé publique est faite pour être visible dans un site web : elle ne permet d'appeler que les fonctions prévues par le script (voir la section 9).

### 5.4 Créer les classes

Ouvre `prof.html`, entre ton mot de passe, puis **Créer une classe** (par exemple « TNSI 1 »). Dans **Gérer les classes**, tu peux **fermer** une classe (plus de nouvelles inscriptions, les codes existants marchent toujours), la supprimer, ou changer le mot de passe du tableau de bord.

---

## 6. En classe

### Côté élèves

1. Ouvrir l'adresse du site sur un ordinateur ou un téléphone (navigateur récent). Au premier lancement, Python est téléchargé (environ 13 Mo, puis mis en cache) pendant la lecture du prologue.
2. **« Je commence l'expédition »** : classe, prénom, emblème, puis **noter son code** (cahier, agenda ou photo). Il reste ensuite visible sur le bouton 🔑.
3. Les fois suivantes, ou sur un autre appareil : **« J'ai déjà un code »**, toujours le même.
4. Sur un ordinateur partagé, l'accueil propose « Ce n'est pas moi : changer de joueur » (cela efface les cookies de l'appareil).

### Côté professeur (`prof.html`)

- **En haut** : inscrits, élèves en plongée, avancement moyen, nombre d'élèves **à aider**.
- **« À aider maintenant »** : élèves en ligne qui bloquent (au moins 4 erreurs, plus de 8 minutes sur la mission, réponse demandée…), avec leur erreur la plus fréquente et un bouton **Voir son travail**.
- **Élèves** : une case par mission (✓ vert = sans aide, ✓ clair = avec indices ou erreurs, **C** = réponse ou correction vue, bleu = en cours, cercle rouge = mission actuelle) et l'avancement dans chaque expédition. Un clic ouvre la fiche : code d'expédition, compétences, dernier code tapé, lignes rangées, commandes réussies, historique complet (y compris « scène comprise / mauvaise réponse », « briefing lu », « plan expliqué »).
- **Compétences** : pour chaque élève, missions réussies par compétence, et moyenne de la classe.
- **Missions** : taux de réussite, erreurs moyennes, part d'indices et de réponses demandées, temps médian, **erreurs les plus fréquentes**. Les missions où la classe peine sont surlignées.
- **Codes d'expédition** : la liste des codes, **impression d'étiquettes** à découper, **nouveau code** pour un élève.
- **Activité en direct** et **export CSV** (avec les codes et les compétences).

### Conseils de déroulement

- Laisser 5 minutes au prologue et à la visite guidée. Les scènes sont courtes, mais **la lecture compte** : la réplique de fin de scène vérifie que l'élève a compris la demande.
- Pour les faibles lecteurs : bouton **🔊 Lecture auto** dans les scènes (chaque case est lue à voix haute), et 🔊 sur l'objectif, les étapes et le briefing. Des écouteurs aident beaucoup.
- Dire que **les erreurs font partie du jeu** : on apprend en se trompant, et les aides sont faites pour être utilisées.
- Faire noter le code tout de suite (ou distribuer les étiquettes imprimées à la séance suivante).
- Au bout de 30 minutes, regarder l'onglet *Missions* pour repérer la notion à reprendre au tableau (souvent le maximum ou le comptage).
- Les élèves rapides passent aux expéditions bonus, ou aident un camarade.

---

## 7. Modifier ou ajouter des missions

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

**L'histoire d'une mission** : `recit` (la scène), `replique` (la réponse du joueur) et `apres` (la suite) sont des listes de cases :

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

## 8. Dépannage

| Problème | Solution |
|---|---|
| « Python n'a pas pu démarrer » en local | Voir la section 4 : ouvrir le site avec `python -m http.server 8000` plutôt qu'en double-cliquant. |
| « Python n'a pas pu démarrer » en ligne | Navigateur trop ancien, ou réseau qui bloque les fichiers `.wasm` : essayer un autre navigateur, ou demander l'ouverture de `github.io` et `cdn.jsdelivr.net`. Le lien « Pourquoi ? » affiche le détail. |
| « Aucune classe ouverte » | Créer une classe dans `prof.html` (ou la rouvrir dans *Gérer les classes*). |
| « La base de données n'est pas installée » | Relancer `supabase/schema.sql` en entier. |
| « Clé Supabase refusée » | Vérifier `SUPABASE_KEY` (clé *publishable* ou *anon*, sans espace). |
| « Code inconnu » | Vérifier chaque lettre ; sinon `prof.html` › onglet *Codes d'expédition* pour le retrouver (inutile d'en créer un nouveau). |
| Un élève a déjà vu une scène et veut la relire | Bouton « Revoir la scène » sous l'histoire ; « Revoir le briefing » pour le rappel de cours. |
| Plus rien ne se charge après quelques semaines | Les projets Supabase gratuits sont mis en pause après une longue inactivité : **Restore project** dans Supabase. En attendant, on peut jouer sans compte. |
| Mot de passe du tableau de bord oublié | Dans Supabase › SQL Editor, lancer la ligne commentée « Mot de passe oublié ? » à la fin de `schema.sql`. |
| Connexion coupée pendant la séance | Le jeu continue (cookies) et renvoie la progression au retour de la connexion (pastille ⚠️ en haut). |

---

## 9. Données personnelles et sécurité

- Données enregistrées : la classe, un **prénom ou pseudo**, le code d'expédition, la progression et les essais. Pas d'e-mail, pas de nom de famille. Conseiller un prénom ou un surnom.
- Les élèves n'ont **aucun accès direct** aux tables : tout passe par des fonctions SQL qui vérifient le jeton de session de l'élève. Un élève ne voit de ses camarades que le pseudo, l'emblème et l'avancement, **jamais leur code**.
- Une tentative avec un code faux est volontairement ralentie (1 seconde), et il existe environ 1,6 million de codes possibles. Ces codes protègent une progression de jeu, pas des données sensibles.
- Le tableau de bord est protégé par un mot de passe chiffré (bcrypt). Le mot de passe reste en mémoire dans l'onglet seulement (`sessionStorage`), **jamais dans un cookie**.
- Côté élève, les cookies d'un jour ne servent qu'au fonctionnement du jeu.
- Le professeur peut supprimer un élève ou une classe à tout moment (suppression définitive).

---

## 10. Fichiers, sources et crédits

```
index.html              le jeu (élèves)
prof.html               le tableau de bord (professeur)
css/                    styles (style.css, manga.css, prof.css)
js/config.js            ← le seul fichier à remplir (Supabase, délais)
js/data/                le contenu : missions, mémo, univers
js/core/                moteur : Python (Pyodide), éditeur, sauvegarde (cookies + Supabase), harness.py
js/ui/                  interface : activités, missions, planches de manga, personnages, plongée, illustrations, outils
supabase/schema.sql     base de données à installer dans Supabase
tests/                  tests automatiques des missions, serveur de test local
outils/                 script qui embarque harness.py dans le site
vendor/                 bibliothèques embarquées (Pyodide 314.0.7, Ace 1.45.2)
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
- Polices Lexend, Bricolage Grotesque, Bangers et JetBrains Mono (licence SIL OFL, via Google Fonts).
