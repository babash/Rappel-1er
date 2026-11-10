# 🛠️ Installer sa copie

[← Retour au README](../README.md) · [Guide de la séance](GUIDE.md) · [Données et sécurité](DONNEES.md) · [Architecture](ARCHITECTURE.md)

Pour mettre en ligne ta propre copie du jeu et brancher le suivi de classe. Pour **utiliser** le jeu avec tes classes, il n'y a rien à installer : [le jeu](https://babash.github.io/Rappel-1er/) et le [tableau de bord](https://babash.github.io/Rappel-1er/prof.html) sont déjà en ligne.

---

## 1. Mettre le site en ligne (GitHub Pages)

1. Sur [github.com](https://github.com), crée un **nouveau dépôt public**, par exemple `expedition-gombessa` (ici : `Rappel-1er`).
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

## 2. Brancher le suivi de classe (Supabase)

Supabase est une base de données en ligne dont l'offre gratuite suffit largement pour quelques classes. Tout passe par des **fonctions SQL appelées directement depuis le navigateur** : il n'y a aucun serveur à toi.

### 2.1 Créer le projet

1. Crée un compte sur [supabase.com](https://supabase.com), puis **New project**. Choisis une région européenne.
2. Ouvre **SQL Editor › New query**.
3. Copie **tout** le fichier `supabase/schema.sql`, colle-le dans l'éditeur SQL, puis **Run**. Il n'y a **aucune valeur à modifier** (pas de mot de passe). *Success. No rows returned* : c'est installé. Le script peut être relancé sans risque, par exemple après une mise à jour du site.

> **Un seul projet Supabase pour plusieurs sites ?** C'est possible (l'offre gratuite limite le nombre de projets). Le script n'ajoute que des objets dont le nom commence par `gb_` (4 tables et des fonctions) et ne touche à rien d'autre. Si une table `gb_eleves` ou `gb_classes` existait déjà sans venir de ce jeu, il s'arrête avant toute modification.
>
> **Tu avais installé l'ancienne version (avec mot de passe) ?** Relance simplement le nouveau script : l'ancien mot de passe et les anciennes fonctions sont retirés, les classes et les élèves sont gardés, et le **premier espace enseignant·e créé** récupère les classes existantes.

### 2.2 Récupérer l'adresse et la clé publique

Dans **Project Settings › API Keys** (ou le bouton **Connect**), copie :

- l'**URL du projet** (`https://abcdefgh.supabase.co`) ;
- la **clé publique** : *Publishable key* (`sb_publishable_…`) ou, sur les anciens projets, la clé *anon public*.

⚠️ Ne copie **jamais** la clé *secret* ni *service_role*.

### 2.3 Renseigner `js/config.js`

```js
SUPABASE_URL: "https://abcdefgh.supabase.co",
SUPABASE_KEY: "sb_publishable_xxxxxxxxxxxxxxxx",
```

Sur GitHub : ouvre `js/config.js`, clique sur le crayon ✏️, colle les deux valeurs, puis **Commit changes**.

> La clé publique est faite pour être visible dans un site web : elle ne permet d'appeler que les fonctions prévues par le script (voir [Données et sécurité](DONNEES.md#2-données-personnelles-et-sécurité)).

### 2.4 Les espaces enseignant·e (sans mot de passe)

1. Ouvre `prof.html` (lien « Espace enseignant·e » en bas de l'accueil du jeu), puis **Créer mon espace** avec le nom que verront les élèves (ex. « Mme Ali (NSI) ») et, si tu le souhaites, ton **établissement** (facultatif, modifiable ensuite dans *🔗 Mon lien*).
2. Le site te donne ton **lien personnel** (`…/prof.html#cle=PROF-XXXX-…`) : **enregistre-le** (favori, e-mail à toi-même, ou fichier). C'est lui qui ouvre ton tableau de bord, depuis n'importe quel appareil. Il n'est pas stocké en clair dans la base : sans lui, on ne peut pas retrouver ton espace (voir « [Dépannage](#3-dépannage) »).
3. **Gérer les classes › Créer une classe** : chaque classe est identifiée par son **code d'inscription** (ex. `K7Q-M2P`). Le nom (« TNSI 1 », « groupe B »…) est facultatif et peut être ajouté plus tard (*Renommer*).
4. **📣 Inviter les élèves** : le code de la classe, le lien d'inscription et un **QR code** à projeter (bouton plein écran).

Pour les collègues :

- **Chaque collègue crée son propre espace** depuis la même adresse : ses classes et ses élèves restent séparés des tiens.
- Pour **co-animer** une classe, donne ton lien à ton ou ta collègue : il ou elle voit et gère les mêmes classes que toi.
- Lien partagé par erreur ? **🔗 Mon lien › Remplacer ma clé** : l'ancien lien ne marche plus, rien d'autre ne change.
- Sur ton propre ordinateur, **🔗 Mon lien › Se souvenir de mon espace** évite de rouvrir le lien pendant la journée (rien n'est gardé plus d'un jour).

---

## 3. Dépannage

| Problème | Solution |
|---|---|
| « Python n'a pas pu démarrer » en local | Voir la section 1 : ouvrir le site avec `python -m http.server 8000` plutôt qu'en double-cliquant. |
| « Python n'a pas pu démarrer » en ligne | Navigateur trop ancien, ou réseau qui bloque les fichiers `.wasm` : essayer un autre navigateur, ou demander l'ouverture de `github.io` et `cdn.jsdelivr.net`. Le lien « Pourquoi ? » affiche le détail. |
| « Code de classe inconnu » | Vérifier le code dans `prof.html` › *Gérer les classes* (les lettres I, O et les chiffres 0, 1 n'y apparaissent jamais). |
| « La classe est fermée aux inscriptions » | La rouvrir dans *Gérer les classes*. |
| « La base de données n'est pas installée » | Relancer `supabase/schema.sql` en entier. |
| « Clé Supabase refusée » | Vérifier `SUPABASE_KEY` (clé *publishable* ou *anon*, sans espace). |
| « Code inconnu » | Vérifier chaque lettre ; sinon `prof.html` › onglet *Codes d'expédition* pour le retrouver (inutile d'en créer un nouveau). |
| Un·e élève a déjà vu une scène et veut la relire | Bouton « Revoir la scène » sous l'histoire ; « Revoir le briefing » pour le rappel de cours. |
| Plus rien ne se charge après quelques semaines | Les projets Supabase gratuits sont mis en pause après une longue inactivité : **Restore project** dans Supabase. En attendant, on peut jouer sans compte. |
| Lien enseignant·e perdu ? | Si un·e collègue a le lien (co-animation), il ou elle peut te le redonner. Sinon, la personne qui gère Supabase peut te créer une nouvelle clé : voir les deux requêtes commentées « Lien professeur perdu ? » à la fin de `schema.sql`. |
| « Lien professeur inconnu ou remplacé » | La clé a été remplacée (🔗 Mon lien › Remplacer ma clé) : utiliser le nouveau lien. |
| Connexion coupée pendant la séance | Le jeu continue (cookies) et renvoie la progression au retour de la connexion (pastille ⚠️ en haut). |
