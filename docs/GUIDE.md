# 🧭 Guide de la séance

[← Retour au README](../README.md) · [Données et sécurité](DONNEES.md) · [Installer sa copie](INSTALLER.md) · [Architecture](ARCHITECTURE.md)

L'histoire, le déroulé d'une mission, ce qui aide les élèves, le tableau de bord et des conseils pour la classe. Pour jouer, il n'y a rien à installer : tout se passe sur [le site](https://babash.github.io/Rappel-1er/).

---

## 1. L'expédition en bref

Une plongée en Python à la recherche du **cœlacanthe** (le *gombessa*), pour **réviser en début de Terminale NSI** les notions de 1re sur les **listes**, les **dictionnaires** et les **algorithmes de base**. L'histoire se lit comme un **manga** : cases, bulles, onomatopées, un équipage, un rival.

Un drone d'**Abyssal Collection** (des collectionneurs et collectionneuses qui capturent des espèces rares pour des milliardaires) a saboté le sous-marin *Luciole* : son IA de bord, **LUCI**, ne comprend plus qu'une seule langue, **Python**. L'élève, « la Recrue », devient la voix de l'équipage auprès de LUCI : **sans son code, la Luciole n'avance pas**. Avec la **Capitaine Sel**, **Bolt** le mécano, la biologiste **Dr Nour** et **Huit**, un poulpe clandestin, il faut atteindre les grottes du gombessa, à 250 m, avant **Vex**, le pilote rival du *Léviathan*, et sa patronne **Orsa Kell**.

- **Parcours principal : 13 missions, environ 1 h 15** pour un·e élève en difficulté (scènes et briefings compris).
- **5 expéditions bonus : 27 missions** de plus en plus exigeantes : lac Dziani, recensement du récif, chant des baleines, plages des tortues, mangrove. Vex rejoint l'équipage, Abyssal n'a pas dit son dernier mot.
- **L'histoire fait avancer le jeu.** Chaque mission commence par une **scène** (lecture obligatoire la première fois) qui se termine par une **réplique à choisir** : l'élève répond à l'équipage, et la bonne réponse est dans la scène. Après la réussite, la suite de l'histoire **utilise le résultat de son programme** (affiché sur l'écran de LUCI).
- **Un briefing de cours à lire avant chaque mission**, à fermer pour commencer.
- **Des activités variées**, souvent sans coder : cases et lignes à toucher, emplacements dans une liste, **liens à tracer**, **phrases à compléter avec des étiquettes**, **code à annoter**, code à trous, **console Python**, **lignes à remettre dans l'ordre**, tableau d'avancement, correction de bugs, écriture de programmes.
- **Les élèves expliquent ce qu'ils et elles font** : « `fiche` est un dictionnaire », « c'est un parcours par indice », « pour chercher un élément, je parcours les éléments un par un »… Avant de coder, ils et elles **expliquent leur plan** (étapes « Avant de coder »).
- **7 compétences** travaillées et suivies : repérer, comprendre, expliquer, compléter, corriger, concevoir, écrire.
- **Un code élève unique**, donné au début, **qui ne change jamais**, toujours visible (🔑).
- **Pas de mot de passe pour les enseignant·e·s** : chaque collègue crée son **espace** et reçoit un **lien personnel** ; chaque classe a un **code d'inscription**, un lien et un **QR code** à projeter.
- Python tourne **dans le navigateur** (Pyodide) : rien à installer. **Tout est statique** : GitHub Pages, plus Supabase (en option) pour le suivi de classe.
- **Pensé pour le téléphone** : planches verticales façon webtoon, une colonne, gros boutons, barre d'outils en bas.

---

## 2. Les missions

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

Les fiches de cours et le devoir maison fournis ont servi de base : leurs exemples et leurs pièges (`liste_b = liste_a`, `range(len(tab) - 1)`, tableaux avec en-tête, fonction `verifie`…) sont repris dans cet univers. Les **données des exercices sont inventées** ; les faits du carnet de bord sont vérifiés (voir [Architecture](ARCHITECTURE.md#2-fichiers-sources-et-crédits)). Il n'y a ni police ni autorité dans l'histoire : les « méchant·e·s » sont une entreprise de collectionneurs et collectionneuses venue de l'extérieur, et l'équipage gagne en **publiant ses données**.

---

## 3. Ce qui aide les élèves

- **L'objectif toujours en haut**, en une phrase, avec la compétence visée et la lecture à voix haute.
- **Le briefing avant chaque mission**, puis le même rappel toujours accessible dans la mission, avec les données dessinées (cases numérotées pour les listes, tableau clé → valeur pour les dictionnaires).
- **Des étapes au toucher plutôt que des QCM** : toucher la case `casiers[-1]`, l'endroit où `insert` place un élément, la valeur qui sort avec `pop()`, les valeurs qui deviennent « champion » ; tracer des liens entre une instruction et son effet ; compléter une phrase avec des étiquettes.
- **Le mémo**, toujours accessible, qui commence par **« Les mots pour expliquer »** (liste, dictionnaire, parcours par valeur / par indice / clé-valeur, accumulateur, compteur, champion…) puis : listes, dictionnaires, tuples et tableaux, algorithmes, modulo, syntaxe, erreurs fréquentes. Chaque exemple peut être lancé dans le **bac à sable**.
- **Des aides graduées, jusqu'à la correction :**
  - *Étapes et plan* : après une erreur, une explication ciblée sur la réponse choisie ; après deux erreurs, « Montre-moi la réponse ».
  - *Console* : après une erreur, un bouton « Indice » ; après deux, « Montre-moi la commande » (placée dans la console : l'élève la lit puis la valide).
  - *Programmes, lignes à ordonner, tableaux* : trois indices progressifs, puis la correction. Ils s'ouvrent après des essais ou après un délai (1 min 30, 3 min, 5 min, réglable dans `js/config.js`).
  - LUCI intervient quand un·e élève enchaîne les erreurs, répète la même faute ou n'ose pas lancer son code.
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

## 4. En classe

### Côté élèves

1. Scanner le **QR code** projeté par l'enseignant·e, ou ouvrir l'adresse du site et choisir **« Je commence l'expédition »** puis taper le **code de la classe**. Au premier lancement, Python est téléchargé (environ 13 Mo, puis mis en cache) pendant la lecture du prologue.
2. Prénom, emblème, puis **noter son code d'expédition** (cahier, agenda ou photo). Il reste ensuite visible sur le bouton 🔑.
3. Les fois suivantes, ou sur un autre appareil : **« J'ai déjà un code »**, toujours le même.
4. Sur un ordinateur partagé, l'accueil propose « Ce n'est pas moi : changer d'élève » (cela efface les cookies de l'appareil).

### Côté enseignant·e (`prof.html`)

- **En haut** : la classe affichée, **📣 Inviter les élèves** (code, lien, QR code), **Gérer les classes** (créer, renommer, fermer, nouveau code d'inscription, supprimer), **🔗 Mon lien** ; puis élèves inscrit·e·s, élèves en plongée, avancement moyen, nombre d'élèves **à aider**.
- **« À aider maintenant »** : élèves en ligne qui bloquent (au moins 4 erreurs, plus de 8 minutes sur la mission, réponse demandée…), avec leur erreur la plus fréquente et un bouton **Voir son travail**.
- **Élèves** : une case par mission (✓ vert = sans aide, ✓ clair = avec indices ou erreurs, **C** = réponse ou correction vue, bleu = en cours, cercle rouge = mission actuelle) et l'avancement dans chaque expédition. Un clic ouvre la fiche : code d'expédition, compétences, dernier code tapé, lignes rangées, commandes réussies, historique complet (y compris « scène comprise / mauvaise réponse », « briefing lu », « plan expliqué »).
- **Compétences** : pour chaque élève, missions réussies par compétence, et moyenne de la classe.
- **Missions** : taux de réussite, erreurs moyennes, part d'indices et de réponses demandées, temps médian, **erreurs les plus fréquentes**. Les missions où la classe peine sont surlignées.
- **Codes d'expédition** : la liste des codes, **impression d'étiquettes** à découper, **nouveau code** pour un·e élève.
- **Activité en direct** et **export CSV** (avec les codes et les compétences).

### Conseils de déroulement

- Laisser 5 minutes au prologue et à la visite guidée. Les scènes sont courtes, mais **la lecture compte** : la réplique de fin de scène vérifie que l'élève a compris la demande.
- Pour les lecteur·rice·s en difficulté : bouton **🔊 Lecture auto** dans les scènes (chaque case est lue à voix haute), et 🔊 sur l'objectif, les étapes et le briefing. Des écouteurs aident beaucoup.
- Dire que **les erreurs font partie du jeu** : on apprend en se trompant, et les aides sont faites pour être utilisées.
- Faire noter le code tout de suite (ou distribuer les étiquettes imprimées à la séance suivante).
- Au bout de 30 minutes, regarder l'onglet *Missions* pour repérer la notion à reprendre au tableau (souvent le maximum ou le comptage).
- Les élèves rapides passent aux expéditions bonus, ou aident un·e camarade.
