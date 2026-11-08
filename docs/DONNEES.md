# 🔒 Données et sécurité

[← Retour au README](../README.md) · [Guide de la séance](GUIDE.md) · [Installer sa copie](INSTALLER.md) · [Architecture](ARCHITECTURE.md)

Ce qui est enregistré, où, combien de temps, et qui y accède. Le résumé est dans le [README](../README.md#données-des-élèves).

---

## 1. Le code élève et la sauvegarde (cookies d'un jour)

### Avec Supabase : un code unique, qui ne change jamais

À la première connexion, l'élève entre le **code de sa classe** (ou scanne le QR code / ouvre le lien donné par l'enseignant·e), son prénom (ou un pseudo) et un emblème. Le site lui donne alors **son code d'expédition**, par exemple `CORAIL-MANTA-482` :

- l'élève doit cocher « J'ai écrit mon code » avant de commencer (bouton 🔊 pour l'écouter) ;
- **ce code ne change jamais**, et il reste **toujours visible** : en haut de l'écran sur ordinateur, bouton **🔑 Mon code** dans la barre du bas sur téléphone ;
- avec ce code (« J'ai déjà un code »), l'élève reprend **depuis n'importe quel ordinateur ou téléphone**. Les tirets, majuscules et accents ne comptent pas ;
- tu vois tous les codes, tu peux **imprimer des étiquettes** et, seulement si besoin (code perdu ou divulgué), donner **un nouveau code** à un·e élève.

### Ce qui est gardé dans le navigateur

- **Des cookies d'un jour** (`gb_e0`, `gb_e1`… : durée de vie de 24 h, renouvelée à chaque action) contiennent la progression compacte : missions, étoiles, scènes et briefings déjà vus, badges, réglages et jeton de session. Environ 0,5 à 1,6 Ko, `SameSite=Lax`, `Secure` sur HTTPS, limités au dossier du site.
- **Les brouillons** (code tapé, lignes rangées, réponses du tableau) restent dans l'onglet (`sessionStorage`) et sur Supabase.
- **Aucune donnée n'est gardée plus d'un jour sur l'appareil** : pratique sur les ordinateurs partagés du lycée. Le lendemain, l'élève tape son code et retrouve tout depuis Supabase.
- Ces cookies servent uniquement au fonctionnement du jeu (ni publicité ni mesure d'audience) : ils sont strictement nécessaires.

### Sans Supabase

Sans serveur, il n'y a **pas de code élève** : la progression ne peut être rangée nulle part ailleurs que sur l'appareil, pendant **1 jour**. Pour un·e élève qui veut continuer un autre jour sans compte, le profil propose « **Sauvegarder pour un autre jour** » : un code de sauvegarde `GB-…` qui contient les missions réussies (il change donc quand on progresse ; à saisir dans *Jouer sans compte › J'ai une sauvegarde*). **Pour un code unique et fixe, il faut brancher Supabase** ([Installer sa copie](INSTALLER.md#2-brancher-le-suivi-de-classe-supabase)).

Si le site est ouvert directement depuis un fichier (`file://`), les cookies sont impossibles : le jeu utilise alors le stockage du navigateur, avec la même durée de vie d'un jour.

---

## 2. Données personnelles et sécurité

- Données enregistrées : la classe, un **prénom ou pseudo**, le code d'expédition, la progression et les essais. Pas d'e-mail, pas de nom de famille. Conseiller un prénom ou un surnom.
- Les élèves n'ont **aucun accès direct** aux tables : tout passe par des fonctions SQL qui vérifient le jeton de session de l'élève. Un·e élève ne voit de ses camarades que le pseudo, l'emblème et l'avancement, **jamais leur code**.
- Une tentative avec un code faux est volontairement ralentie (1 seconde), et il existe environ 1,6 million de codes possibles. Ces codes protègent une progression de jeu, pas des données sensibles.
- Pas de mot de passe : chaque espace professeur est ouvert par une **clé aléatoire de 120 bits** (dans le lien `#cle=…`). La base n'en garde que l'**empreinte SHA-256**. Une clé fausse est ralentie (1 seconde). Chaque enseignant·e ne voit que **ses** classes et **ses** élèves.
- Dans le navigateur, la clé est retirée de la barre d'adresse dès l'ouverture, gardée dans l'onglet (`sessionStorage`) et, seulement si on le demande, sur l'appareil jusqu'au lendemain. **Jamais dans un cookie.**
- Le code d'une classe permet seulement de **s'y inscrire** (il ne donne accès à aucune donnée) ; il peut être changé à tout moment.
- Côté élève, les cookies d'un jour ne servent qu'au fonctionnement du jeu.
- Tu peux supprimer un·e élève, une classe ou tout ton espace à tout moment (suppression définitive).
