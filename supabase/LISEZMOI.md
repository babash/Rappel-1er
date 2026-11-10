# La base Supabase d'Expédition Gombessa

## Les fichiers

| Fichier | À quoi il sert |
|---|---|
| `schema.sql` | Installer une base neuve, ou mettre à jour sa propre copie : on le colle en entier dans l'éditeur SQL, puis **Run** ([Installer sa copie](../docs/INSTALLER.md)). Il contient déjà la migration 0001. |
| `0001-espaces.sql` | La migration 0001, pour la base du site publié : les espaces professeur, sans mot de passe. |
| `0001-espaces-inverse.sql` | Le SQL inverse de 0001 : revenir à l'état d'avant. |

Les migrations sont écrites pour `apply_migration`, qui exécute chaque fichier en une seule transaction : elles n'ont ni `begin` ni `commit`. Si une instruction échoue, rien n'est appliqué.

## Où en est la base du site publié (11/11/2026)

- **Le projet :** `cukahpyqkljiddmimpyi`, partagé avec SNT 1er jour et Alien Python. Gombessa n'y touche qu'aux objets `gb_`.
- **Avant :** depuis le 04/11 (commit `eeb49b5`), la page publiée appelait les fonctions des espaces enseignant·e, alors que la base était restée à l'ancienne version (un mot de passe unique dans `gb_reglages`, pas de table `gb_profs`). L'inscription de nouvel·le·s élèves et l'espace enseignant·e étaient cassés en ligne.
- **La migration :** `gombessa_0001_espaces`, appliquée le 10/11/2026 à 19 h 19 (heure de Mayotte), version `20261110161938`. Le texte appliqué est celui de `0001-espaces.sql`, au mot près : empreinte vérifiée, commentaires et espaces mis à part.
- **Après l'application (métadonnées seulement) :**
  - 4 tables `gb_` ;
  - plus de `gb_reglages` ni d'anciennes fonctions ;
  - 25 fonctions appelables par `anon`, et aucun droit direct sur les tables ;
  - 1 classe, 25 élèves et 2 840 événements gardés.
- **L'espace :** l'enseignant a créé son espace le 10/11 au soir ; 1 espace, 0 classe sans enseignant·e.
- **Ce qui reste :**
  - constater en ligne que l'inscription et l'espace enseignant·e sont de nouveau en état de marche (vérification g du § 4) ;
  - le droit d'`authenticated` sur ces 25 fonctions sera retiré au n° 2 de la base unique (`base_unique_0002`, règle P4).

## La migration 0001, dans l'ordre

### 1. Avant

1. **L'enseignant lit le SQL exact** de `0001-espaces.sql` et donne son accord.
2. **L'enseignant exporte les trois tables d'élèves** : dans le tableau de bord Supabase, *Table Editor*, puis `gb_classes`, `gb_eleves` et `gb_evenements`, et *Export to CSV* pour chacune.
   - L'offre gratuite ne fait aucune sauvegarde, et la migration modifie `gb_classes` (elle donne un code à la classe).
   - Les exports contiennent les codes des élèves : il faut les garder hors du dépôt, en lieu sûr.
3. **Choisir un moment où aucune classe ne joue.**
   - La migration bloque les tables de Gombessa pendant moins d'une seconde : un·e élève qui sauvegarde à ce moment attend, puis continue.
   - Surtout, l'enseignant doit être disponible juste après (étape 3).

### 2. Appliquer

Le chef d'orchestre applique le fichier avec `apply_migration` :
- projet `cukahpyqkljiddmimpyi` ;
- nom de migration `gombessa_0001_espaces` ;
- le contenu exact de `0001-espaces.sql`.

### 3. Juste après : l'enseignant crée son espace

**Le premier espace créé récupère toutes les classes existantes**, avec leurs élèves et leurs codes. L'enseignant doit donc créer le sien **dans les minutes qui suivent**, avant que quelqu'un d'autre ne le fasse.

1. Ouvrir [prof.html](https://babash.github.io/Rappel-1er/prof.html), puis **« Créer mon espace »** : le nom affiché aux élèves, et l'établissement si on le souhaite.
2. Vérifier le message : *« 1 classe(s) déjà créée(s) avec l'ancienne version ont été rattachées à ton espace. »*
3. **Noter son lien personnel** : « Copier le lien », « M'envoyer par e-mail » ou « Télécharger un fichier ».
   - Il n'est montré qu'une fois : la base n'en garde que l'empreinte.
   - Il ouvre la classe et les codes des 25 élèves : ne pas le projeter ni le partager.
4. Cocher « J'ai enregistré mon lien », puis ouvrir le tableau de bord. On y retrouve la classe et ses 25 élèves.
5. La classe a maintenant **un code d'inscription** (par exemple `K7Q-M2P`), avec un lien et un QR code : c'est ce qu'on donne aux élèves qui arrivent. Les élèves déjà inscrit·e·s gardent leur code d'expédition.

**Attention :** « Supprimer mon espace » supprime aussi ses classes, leurs élèves et leur journal, définitivement.

**Si le message n'apparaît pas**, la classe est allée dans un autre espace. Ne rien supprimer, et prévenir le chef d'orchestre. La correction se fait par l'enseignant, dans l'éditeur SQL de Supabase :

```sql
-- 1. Voir les espaces : le tien, et celui qui a été créé avant
select id, nom, etablissement, cree_le from public.gb_profs order by cree_le;
-- 2. Rattacher à ton espace les classes de l'autre (remplace les deux identifiants)
update public.gb_classes set prof_id = 'IDENTIFIANT-DE-TON-ESPACE' where prof_id = 'IDENTIFIANT-DE-L-AUTRE-ESPACE';
```

L'autre espace, désormais vide, peut rester. Ne jamais le supprimer **avant** l'étape 2 : sa suppression emporterait la classe et ses élèves.

### 4. Vérifier, par les métadonnées seulement

Ces requêtes ne lisent aucune donnée d'élève : elles comptent des lignes ou lisent la liste des fonctions et des droits. Le Gardien les lance, puis inscrit le résultat au journal.

**a. La migration est enregistrée :** `list_migrations` contient `gombessa_0001_espaces`.

**b. Les fonctions qu'`anon` peut appeler :** exactement les 25 fonctions d'entrée de la liste plus bas.

```sql
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like 'gb\_%' and has_function_privilege('anon', p.oid, 'execute')
order by 1, 2;
-- attendu : 25 lignes

select (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname like 'gb\_%') as fonctions_gb,  -- 35
       (select count(*) from pg_proc where pronamespace = 'public'::regnamespace
          and proname in ('gb_prof_test', 'gb_verifier_prof', 'gb_prof_changer_mot_de_passe', 'gb_classes_ouvertes')) as anciennes,  -- 0
       to_regprocedure('public.gb_inscription(uuid, text, text)') as ancienne_inscription,  -- vide
       to_regclass('public.gb_reglages') as ancien_mot_de_passe;  -- vide
```

**c. Les deux comptages, après la création de l'espace :**

```sql
select (select count(*) from public.gb_profs) as espaces,                                     -- 1
       (select count(*) from public.gb_classes where prof_id is null) as classes_sans_enseignant;  -- 0
```

**d. Rien n'est perdu :**

```sql
select (select count(*) from public.gb_classes) as classes,       -- 1
       (select count(*) from public.gb_eleves) as eleves,         -- 25
       (select count(*) from public.gb_evenements) as evenements; -- au moins 2 840
```

**e. Les tables restent fermées :** les requêtes a, b, c et e du § 6 des règles Supabase (`architecture/regles-supabase.md` du projet).
- Aucune table `gb_` sans RLS, aucune règle (policy) sur une table `gb_`.
- Aucun droit d'`anon` ni d'`authenticated` sur `gb_profs`, `gb_classes`, `gb_eleves` et `gb_evenements`.
- Aucune fonction `gb_` `security definer` sans `search_path`.

**f. Les conseillers** (`get_advisors`, sécurité) :
- l'avertissement 0011 sur `gb_normaliser_code` a disparu ;
- les avertissements 0028 et 0029 des fonctions `gb_` portent exactement sur les 25 fonctions d'entrée : ce sont les portes d'entrée voulues.

**g. La page publiée :**
- un·e élève s'inscrit avec le code de la classe ;
- un·e élève déjà inscrit·e entre avec son code ;
- l'enseignant ouvre son espace avec son lien.

L'enseignant essaie lui-même, ou Playwright dans `verifier.yml`. On n'essaie pas au hasard une fonction qui vérifie un code sur la base réelle.

### Les 25 fonctions d'entrée attendues

| Pour qui | Fonctions |
|---|---|
| Élèves, avant l'inscription | `gb_normaliser_code(text)`, `gb_classe_par_code(text)`, `gb_inscription(text, text, text)`, `gb_connexion(text)` |
| Élèves, avec leur jeton de session | `gb_reprise(uuid)`, `gb_sauvegarde(uuid, jsonb, int, int, int, int, int, text, text)`, `gb_presence(uuid, text)`, `gb_journal(uuid, jsonb)`, `gb_equipage(uuid)` |
| Enseignant·e·s : l'espace | `gb_prof_creer_espace(text, text)`, `gb_prof_ouvrir(text)`, `gb_prof_modifier_espace(text, text, text)`, `gb_prof_nouvelle_cle(text)`, `gb_prof_supprimer_espace(text)` |
| Enseignant·e·s : les classes | `gb_prof_classes(text)`, `gb_prof_creer_classe(text, text)`, `gb_prof_modifier_classe(text, uuid, text, boolean)`, `gb_prof_nouveau_code_classe(text, uuid)`, `gb_prof_supprimer_classe(text, uuid)` |
| Enseignant·e·s : les élèves | `gb_prof_eleves(text, uuid)`, `gb_prof_evenements(text, uuid, int)`, `gb_prof_flux(text, uuid, timestamptz)`, `gb_prof_nouveau_code(text, uuid)`, `gb_prof_renommer_eleve(text, uuid, text)`, `gb_prof_supprimer_eleve(text, uuid)` |

Les 10 fonctions internes restent fermées à `anon` :
- `gb_alea`, `gb_empreinte_cle`, `gb_nouveau_code`, `gb_nouveau_code_classe` ;
- `gb_prof_par_cle`, `gb_prof_verifier_classe`, `gb_prof_verifier_eleve`, `gb_verifier_identite` ;
- `gb_eleve_par_jeton`, `gb_fiche_eleve`.

## Revenir en arrière

**À savoir avant :** la page publiée a besoin de la migration 0001. Après le retour en arrière, l'inscription et l'espace enseignant·e sont de nouveau cassés, sauf si l'on republie aussi l'ancienne page (avant `eeb49b5`). Le retour ne sert donc qu'en cas de vrai problème avec 0001.

### Ce qui ne revient pas

- **L'ancien mot de passe.** La migration 0001 a supprimé son empreinte (`gb_reglages`). Le SQL inverse recrée la table vide : l'ancien tableau de bord refuse tout mot de passe tant que l'enseignant n'en a pas choisi un nouveau (étape 4 ci-dessous).
- **Les espaces professeur** (`gb_profs`) : les liens personnels ne marchent plus.
- **Les codes de classe.**

Les élèves, leur progression et leur journal sont tous gardés, y compris ceux et celles qui se sont inscrit·e·s après la migration. Les classes créées depuis sont gardées aussi. Mais l'ancienne version les montre toutes : à quiconque a le mot de passe, et leur liste (identifiant et nom) à tout le monde, par `gb_classes_ouvertes()`.

### Dans l'ordre

1. **L'enseignant exporte les trois tables**, comme avant la migration.
2. **Si deux classes portent le même nom** (deux « TNSI 1 » dans deux espaces), il en renomme une dans `prof.html`. Sinon, le SQL inverse s'arrête sans rien modifier : l'ancienne version veut des noms tous différents.
3. **Le chef d'orchestre applique `0001-espaces-inverse.sql`** avec `apply_migration`, sous le nom `gombessa_0001_espaces_inverse`. Le fichier s'arrête sans rien modifier si la migration 0001 n'a pas été appliquée.
4. **L'enseignant choisit un nouveau mot de passe**, dans l'éditeur SQL de Supabase. Il remplace le texte entre apostrophes, et n'enregistre pas la requête :

   ```sql
   insert into public.gb_reglages (id, prof_hash)
   values (1, extensions.crypt('MON-NOUVEAU-MOT-DE-PASSE', extensions.gen_salt('bf')));
   ```

   Ce mot de passe ne s'écrit jamais dans le dépôt, dans une page ni dans un message.
5. **On republie l'ancienne page**, sur décision de l'enseignant (le Gardien).
6. **On vérifie :**
   - 21 fonctions `gb_` appelables par `anon` (requête b), 25 fonctions `gb_` en tout ;
   - `gb_profs` absente ;
   - les nombres de la requête d.

## L'essai du 10/11/2026

Avant d'être proposées, les deux migrations ont été essayées sur un PostgreSQL 17.11 local, la version du projet. Les scripts d'essai sont restés hors du dépôt.

**La base locale :**
- elle reproduisait l'état en ligne, relevé dans les métadonnées : rôles, droits par défaut, tables, contraintes, index, droits, et le code des 25 fonctions (`pg_get_functiondef`) ;
- elle contenait des données inventées : 1 classe, 6 élèves, 246 lignes de journal ;
- une empreinte des métadonnées, calculée de la même façon sur les deux bases, était identique.

**Ce qui a été vérifié (86 contrôles, tous réussis) :**
- les élèves et leur journal sont identiques avant et après, ligne à ligne ;
- une session ouverte avant la migration continue, et un·e élève entre avec son code ;
- le premier espace récupère la classe, et le second ne récupère rien et ne la voit pas ;
- une inscription par code de classe marche ;
- `anon` n'a aucun droit direct sur les tables, et peut appeler exactement les 25 fonctions ;
- relancer 0001 ne change rien ;
- le SQL inverse s'arrête si deux classes ont le même nom ;
- après le SQL inverse, l'empreinte est de nouveau celle de la base en ligne, et les élèves sont intacts ;
- l'ancien mot de passe ne revient pas, et un nouveau, choisi comme à l'étape 4, ouvre l'ancien tableau de bord ;
- 0001 s'applique de nouveau après l'inverse.
