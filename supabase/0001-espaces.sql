-- =============================================================================
--  Expédition Gombessa : migration 0001, les espaces professeur
--  Projet Supabase cukahpyqkljiddmimpyi. Nom de migration : gombessa_0001_espaces
-- =============================================================================
--  Pourquoi : la page publiée (depuis eeb49b5, le 04/11) appelle les fonctions
--  des espaces professeur, mais la base est restée à l'ancienne version (un mot
--  de passe unique). Cette migration amène la base au niveau de schema.sql.
--
--  Le texte qui suit cet en-tête est celui de supabase/schema.sql (b655eb3),
--  recopié tel quel, avec une seule différence : « set local search_path »
--  au lieu de « set search_path », pour que le réglage s'arrête avec la
--  migration.
--
--  Pas de begin ni de commit : apply_migration exécute le fichier en une seule
--  transaction. Si une instruction échoue, rien n'est appliqué.
--
--  Ne touche que des objets gb_ :
--   - SUPPRIME la table gb_reglages (1 ligne : l'empreinte de l'ancien mot de
--     passe unique) et 5 fonctions : gb_prof_test, gb_verifier_prof,
--     gb_prof_changer_mot_de_passe, gb_classes_ouvertes, gb_inscription(uuid, …) ;
--   - REMPLACE 10 fonctions de l'enseignant·e, qui prennent maintenant la clé
--     d'un espace (p_cle) au lieu du mot de passe (p_secret) : gb_prof_classes
--     (qui donne aussi le code de la classe), gb_prof_creer_classe,
--     gb_prof_modifier_classe, gb_prof_supprimer_classe, gb_prof_eleves,
--     gb_prof_evenements, gb_prof_flux, gb_prof_nouveau_code,
--     gb_prof_renommer_eleve, gb_prof_supprimer_eleve ;
--   - CRÉE la table gb_profs (les espaces ; vide), les colonnes gb_classes.code
--     et gb_classes.prof_id (vide), les index gb_classes_code et gb_classes_prof,
--     8 fonctions d'entrée (gb_classe_par_code, gb_inscription(text, …),
--     gb_prof_creer_espace, gb_prof_ouvrir, gb_prof_modifier_espace,
--     gb_prof_nouvelle_cle, gb_prof_nouveau_code_classe, gb_prof_supprimer_espace)
--     et 7 fonctions internes (gb_alea, gb_empreinte_cle, gb_nouveau_code_classe,
--     gb_prof_par_cle, gb_verifier_identite, gb_prof_verifier_classe,
--     gb_prof_verifier_eleve) ;
--   - MODIFIE gb_classes : retire la contrainte gb_classes_nom_key (deux
--     collègues peuvent avoir une « TNSI 1 ») et donne un code d'inscription à
--     chaque classe existante ; gb_fiche_eleve renvoie aussi l'établissement ;
--     gb_normaliser_code reçoit un search_path fixé ; 8 autres fonctions sont
--     réécrites à l'identique (gb_connexion, gb_reprise, gb_sauvegarde,
--     gb_presence, gb_journal, gb_equipage, gb_eleve_par_jeton, gb_nouveau_code).
--  Aucune ligne de gb_classes, gb_eleves ni gb_evenements n'est supprimée.
--
--  Juste après : l'enseignant·e ouvre prof.html et clique sur « Créer mon
--  espace ». Le premier espace créé récupère les classes existantes.
--  Retour en arrière : 0001-espaces-inverse.sql (l'ancien mot de passe est perdu).
--  Mode d'emploi complet : LISEZMOI.md.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Cohabitation avec d'autres projets dans la même base
--    Garde-fou : si une table gb_eleves ou gb_classes existe déjà sans venir de
--    ce jeu, le script s'arrête avant toute modification.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'gb_eleves')
     and not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'gb_eleves' and column_name = 'code_affiche') then
    raise exception 'Une table public.gb_eleves existe déjà et ne vient pas d''Expédition Gombessa : arrêt, rien n''a été modifié.';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'gb_classes')
     and not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'gb_classes' and column_name = 'ouverte') then
    raise exception 'Une table public.gb_classes existe déjà et ne vient pas d''Expédition Gombessa : arrêt, rien n''a été modifié.';
  end if;
end $$;

-- pgcrypto (empreintes, octets aléatoires) : déjà installé sur Supabase,
-- dans le schéma « extensions » (ou « public » sur certains projets anciens).
create extension if not exists pgcrypto with schema extensions;
set local search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. Mise à jour depuis l'ancienne version (mot de passe unique) : on retire
--    l'ancien mot de passe et les anciennes fonctions. Les classes et les élèves
--    sont conservés (le premier espace professeur créé récupère les classes).
-- -----------------------------------------------------------------------------
drop function if exists public.gb_prof_test(text);
drop function if exists public.gb_prof_classes(text);
drop function if exists public.gb_prof_creer_classe(text, text);
drop function if exists public.gb_prof_modifier_classe(text, uuid, text, boolean);
drop function if exists public.gb_prof_supprimer_classe(text, uuid);
drop function if exists public.gb_prof_eleves(text, uuid);
drop function if exists public.gb_prof_evenements(text, uuid, int);
drop function if exists public.gb_prof_flux(text, uuid, timestamptz);
drop function if exists public.gb_prof_nouveau_code(text, uuid);
drop function if exists public.gb_prof_renommer_eleve(text, uuid, text);
drop function if exists public.gb_prof_supprimer_eleve(text, uuid);
drop function if exists public.gb_prof_changer_mot_de_passe(text, text);
drop function if exists public.gb_classes_ouvertes();
drop function if exists public.gb_inscription(uuid, text, text);
drop function if exists public.gb_verifier_prof(text);
drop table if exists public.gb_reglages;
-- Signatures remplacées par la version « établissement »
drop function if exists public.gb_prof_creer_espace(text);
drop function if exists public.gb_prof_renommer(text, text);

-- -----------------------------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------------------------
create table if not exists public.gb_profs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  etablissement text,                 -- facultatif (ex. : Lycée de Chirongui)
  cle_hash text not null unique,      -- empreinte SHA-256 de la clé (jamais la clé elle-même)
  cree_le timestamptz not null default now(),
  vu_le timestamptz not null default now()
);
alter table public.gb_profs add column if not exists etablissement text;

create table if not exists public.gb_classes (
  id uuid primary key default gen_random_uuid(),
  prof_id uuid references public.gb_profs(id) on delete cascade,
  nom text not null,
  code text,                          -- code d'inscription, forme canonique (K7QM2P)
  ouverte boolean not null default true,
  cree_le timestamptz not null default now()
);
alter table public.gb_classes add column if not exists prof_id uuid references public.gb_profs(id) on delete cascade;
alter table public.gb_classes add column if not exists code text;
alter table public.gb_classes drop constraint if exists gb_classes_nom_key;   -- deux collègues peuvent avoir une « TNSI 1 »
create unique index if not exists gb_classes_code on public.gb_classes (code);
create index if not exists gb_classes_prof on public.gb_classes (prof_id);

create table if not exists public.gb_eleves (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid not null references public.gb_classes(id) on delete cascade,
  pseudo text not null,
  code text not null,                -- forme canonique : lettres et chiffres, sans tiret (CORAILMANTA482)
  code_affiche text not null,        -- forme lisible : CORAIL-MANTA-482
  jeton uuid not null default gen_random_uuid(),
  avatar text not null default '🦀',
  xp int not null default 0,
  faites_principal int not null default 0,
  faites_bonus int not null default 0,
  etoiles int not null default 0,
  badges int not null default 0,
  mission_courante text,
  etat jsonb not null default '{}'::jsonb,
  cree_le timestamptz not null default now(),
  vu_le timestamptz not null default now()
);
create unique index if not exists gb_eleves_code on public.gb_eleves (code);
create unique index if not exists gb_eleves_jeton on public.gb_eleves (jeton);
create unique index if not exists gb_eleves_pseudo on public.gb_eleves (classe_id, lower(pseudo));

create table if not exists public.gb_evenements (
  id bigint generated always as identity primary key,
  eleve_id uuid not null references public.gb_eleves(id) on delete cascade,
  classe_id uuid not null references public.gb_classes(id) on delete cascade,
  mission text,
  type text not null,
  ok boolean,
  detail text,
  code text,
  cree_le timestamptz not null default now()
);
create index if not exists gb_evenements_eleve on public.gb_evenements (eleve_id, cree_le desc);
create index if not exists gb_evenements_classe on public.gb_evenements (classe_id, cree_le desc);

-- Personne n'accède directement aux tables : uniquement via les fonctions ci-dessous.
alter table public.gb_profs enable row level security;
alter table public.gb_classes enable row level security;
alter table public.gb_eleves enable row level security;
alter table public.gb_evenements enable row level security;
revoke all on public.gb_profs, public.gb_classes, public.gb_eleves, public.gb_evenements from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Outils internes
-- -----------------------------------------------------------------------------
-- n caractères tirés au hasard, sans I, O, 0 ni 1 (faciles à confondre)
create or replace function public.gb_alea(n int)
returns text language plpgsql volatile security definer set search_path = public, extensions as $$
declare a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea := gen_random_bytes(n); s text := '';
begin
  for i in 0 .. n - 1 loop
    s := s || substr(a, 1 + (get_byte(b, i) % 32), 1);
  end loop;
  return s;
end $$;

-- « corail-manta 482 », « Coràil Manta 482 »… → CORAILMANTA482
create or replace function public.gb_normaliser_code(p text)
returns text language sql immutable set search_path = public as $$
  select regexp_replace(upper(translate(coalesce(p, ''),
    'àâäáãéèêëíìîïóòôöõúùûüçñÀÂÄÁÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')), '[^A-Z0-9]', '', 'g');
$$;

-- Empreinte de la clé d'un professeur (« PROF-ABCD-… » ou « abcd… » → même empreinte)
create or replace function public.gb_empreinte_cle(p text)
returns text language sql immutable set search_path = public, extensions as $$
  select encode(digest(regexp_replace(public.gb_normaliser_code(p), '^PROF', ''), 'sha256'), 'hex');
$$;

-- Un code d'élève facile à recopier : deux mots de la mer et trois chiffres (environ 1,6 million de codes).
create or replace function public.gb_nouveau_code(out canon text, out affiche text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  mots text[] := array['CORAIL','MANTA','DUGONG','LAGON','RECIF','ALGUE','NACRE','PERLE','TORTUE','DAUPHIN',
                       'BALEINE','MEROU','POULPE','CRABE','OURSIN','ETOILE','EPONGE','RAIE','CALMAR','ECUME',
                       'MAREE','VAGUE','HOULE','SABLE','GALET','ILOT','PASSE','BOUEE','ANCRE','VOILE',
                       'PIROGUE','HERBIER','MANGROVE','COQUILLE','PHARE','CORDAGE','LUCIOLE','HUBLOT','SONAR','BOUSSOLE'];
  n int := array_length(mots, 1);
  b bytea;
  essai int := 0;
begin
  loop
    b := gen_random_bytes(4);
    affiche := mots[1 + get_byte(b, 0) % n] || '-' || mots[1 + get_byte(b, 1) % n] || '-' ||
               lpad(((get_byte(b, 2) * 256 + get_byte(b, 3)) % 1000)::text, 3, '0');
    canon := public.gb_normaliser_code(affiche);
    exit when not exists (select 1 from gb_eleves where code = canon);
    essai := essai + 1;
    if essai > 50 then
      raise exception 'Impossible de créer un code unique, réessaie.' using errcode = 'P0001';
    end if;
  end loop;
end $$;

-- Un code de classe : 6 caractères (environ 1 milliard de codes), affiché K7Q-M2P
create or replace function public.gb_nouveau_code_classe()
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  loop
    c := public.gb_alea(6);
    exit when not exists (select 1 from gb_classes where code = c);
  end loop;
  return c;
end $$;

create or replace function public.gb_prof_par_cle(p_cle text)
returns public.gb_profs language plpgsql security definer set search_path = public as $$
declare p gb_profs;
begin
  select * into p from gb_profs where cle_hash = public.gb_empreinte_cle(p_cle);
  if p.id is null then
    perform pg_sleep(1);
    raise exception 'Lien professeur inconnu ou remplacé. Vérifie le lien (ou la clé PROF-…) que tu as enregistré.' using errcode = 'P0001';
  end if;
  return p;
end $$;

-- Nom affiché (obligatoire) et établissement (facultatif) d'un espace
create or replace function public.gb_verifier_identite(p_nom text, p_etablissement text)
returns void language plpgsql immutable set search_path = public as $$
begin
  if char_length(btrim(coalesce(p_nom, ''))) < 2 or char_length(btrim(coalesce(p_nom, ''))) > 40 then
    raise exception 'Le nom affiché doit faire entre 2 et 40 caractères (ex. : Mme Ali, NSI).' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_etablissement, ''))) > 80 then
    raise exception 'Le nom de l''établissement doit faire 80 caractères au plus.' using errcode = 'P0001';
  end if;
end $$;

-- Vérifie qu'une classe appartient bien à ce professeur
create or replace function public.gb_prof_verifier_classe(p_prof uuid, p_classe uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from gb_classes where id = p_classe and prof_id = p_prof) then
    raise exception 'Cette classe n''appartient pas à ton espace.' using errcode = 'P0001';
  end if;
end $$;

create or replace function public.gb_prof_verifier_eleve(p_prof uuid, p_eleve uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from gb_eleves e join gb_classes c on c.id = e.classe_id where e.id = p_eleve and c.prof_id = p_prof) then
    raise exception 'Cet élève n''est pas dans une de tes classes.' using errcode = 'P0001';
  end if;
end $$;

create or replace function public.gb_eleve_par_jeton(p_jeton uuid)
returns public.gb_eleves language plpgsql security definer set search_path = public as $$
declare e gb_eleves;
begin
  select * into e from gb_eleves where jeton = p_jeton;
  if e.id is null then
    raise exception 'Session inconnue : reconnecte-toi avec ton code d''expédition.' using errcode = 'P0001';
  end if;
  return e;
end $$;

create or replace function public.gb_fiche_eleve(e public.gb_eleves)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'eleve_id', e.id, 'jeton', e.jeton, 'pseudo', e.pseudo, 'avatar', e.avatar, 'code', e.code_affiche,
    'classe_id', e.classe_id, 'classe_nom', (select nom from gb_classes where id = e.classe_id),
    'etablissement', (select p.etablissement from gb_classes c join gb_profs p on p.id = c.prof_id where c.id = e.classe_id),
    'etat', e.etat);
$$;

-- Les classes d'avant les espaces professeur reçoivent un code
update public.gb_classes set code = public.gb_nouveau_code_classe() where code is null;

revoke execute on function public.gb_alea(int) from public, anon, authenticated;
revoke execute on function public.gb_nouveau_code() from public, anon, authenticated;
revoke execute on function public.gb_nouveau_code_classe() from public, anon, authenticated;
revoke execute on function public.gb_prof_par_cle(text) from public, anon, authenticated;
revoke execute on function public.gb_prof_verifier_classe(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.gb_prof_verifier_eleve(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.gb_eleve_par_jeton(uuid) from public, anon, authenticated;
revoke execute on function public.gb_fiche_eleve(public.gb_eleves) from public, anon, authenticated;
revoke execute on function public.gb_empreinte_cle(text) from public, anon, authenticated;
revoke execute on function public.gb_verifier_identite(text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Fonctions pour les élèves
-- -----------------------------------------------------------------------------
-- Avant de s'inscrire : la classe correspondant au code donné par le professeur
create or replace function public.gb_classe_par_code(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select cl.nom, cl.ouverte, coalesce(p.nom, '') as prof, coalesce(p.etablissement, '') as etablissement into c
  from gb_classes cl left join gb_profs p on p.id = cl.prof_id
  where cl.code = public.gb_normaliser_code(p_code);
  if not found then
    perform pg_sleep(0.6);
    raise exception 'Code de classe inconnu. Vérifie-le auprès de ton professeur.' using errcode = 'P0001';
  end if;
  return json_build_object('nom', c.nom, 'prof', c.prof, 'etablissement', c.etablissement, 'ouverte', c.ouverte);
end $$;

create or replace function public.gb_inscription(p_code_classe text, p_pseudo text, p_avatar text default '🦀')
returns json language plpgsql security definer set search_path = public, extensions as $$
declare e gb_eleves; v_pseudo text := btrim(coalesce(p_pseudo, '')); c record; v_classe uuid;
begin
  select id into v_classe from gb_classes where code = public.gb_normaliser_code(p_code_classe) and ouverte;
  if v_classe is null then
    perform pg_sleep(0.6);
    raise exception 'Ce code de classe n''existe pas, ou la classe est fermée aux inscriptions.' using errcode = 'P0001';
  end if;
  if char_length(v_pseudo) < 2 or char_length(v_pseudo) > 24 then
    raise exception 'Le prénom ou pseudo doit faire entre 2 et 24 caractères.' using errcode = 'P0001';
  end if;
  if exists (select 1 from gb_eleves where classe_id = v_classe and lower(pseudo) = lower(v_pseudo)) then
    raise exception 'Ce prénom est déjà pris dans cette classe. Si c''est toi, utilise ton code (« J''ai déjà un code »). Sinon, ajoute une initiale.' using errcode = 'P0001';
  end if;
  if (select count(*) from gb_eleves where classe_id = v_classe) >= 200 then
    raise exception 'Cette classe est complète (200 élèves).' using errcode = 'P0001';
  end if;
  select * into c from public.gb_nouveau_code();
  insert into gb_eleves (classe_id, pseudo, code, code_affiche, avatar)
  values (v_classe, v_pseudo, c.canon, c.affiche, left(coalesce(p_avatar, '🦀'), 16))
  returning * into e;
  insert into gb_evenements (eleve_id, classe_id, type) values (e.id, e.classe_id, 'inscription');
  return public.gb_fiche_eleve(e);
end $$;

create or replace function public.gb_connexion(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare e gb_eleves;
begin
  select * into e from gb_eleves where code = public.gb_normaliser_code(p_code);
  if e.id is null then
    perform pg_sleep(1);
    raise exception 'Code inconnu. Vérifie chaque lettre et chaque chiffre. Code perdu ? Ton professeur peut le retrouver.' using errcode = 'P0001';
  end if;
  update gb_eleves set vu_le = now() where id = e.id;
  insert into gb_evenements (eleve_id, classe_id, type) values (e.id, e.classe_id, 'connexion');
  return public.gb_fiche_eleve(e);
end $$;

create or replace function public.gb_reprise(p_jeton uuid)
returns json language plpgsql security definer set search_path = public as $$
declare e gb_eleves;
begin
  e := public.gb_eleve_par_jeton(p_jeton);
  update gb_eleves set vu_le = now() where id = e.id;
  return public.gb_fiche_eleve(e);
end $$;

create or replace function public.gb_sauvegarde(
  p_jeton uuid, p_etat jsonb, p_xp int, p_principal int, p_bonus int, p_etoiles int,
  p_badges int, p_mission text, p_avatar text)
returns void language plpgsql security definer set search_path = public as $$
declare e gb_eleves;
begin
  e := public.gb_eleve_par_jeton(p_jeton);
  if pg_column_size(p_etat) > 600000 then
    raise exception 'Sauvegarde trop volumineuse.' using errcode = 'P0001';
  end if;
  update gb_eleves set
    etat = coalesce(p_etat, etat), xp = coalesce(p_xp, xp),
    faites_principal = coalesce(p_principal, faites_principal), faites_bonus = coalesce(p_bonus, faites_bonus),
    etoiles = coalesce(p_etoiles, etoiles), badges = coalesce(p_badges, badges),
    mission_courante = coalesce(left(p_mission, 16), mission_courante), avatar = coalesce(left(p_avatar, 16), avatar),
    vu_le = now()
  where id = e.id;
end $$;

create or replace function public.gb_presence(p_jeton uuid, p_mission text)
returns void language plpgsql security definer set search_path = public as $$
declare e gb_eleves;
begin
  e := public.gb_eleve_par_jeton(p_jeton);
  update gb_eleves set vu_le = now(), mission_courante = coalesce(left(p_mission, 16), mission_courante) where id = e.id;
end $$;

create or replace function public.gb_journal(p_jeton uuid, p_evenements jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare e gb_eleves; n int;
begin
  e := public.gb_eleve_par_jeton(p_jeton);
  if jsonb_typeof(p_evenements) <> 'array' then return 0; end if;
  insert into gb_evenements (eleve_id, classe_id, mission, type, ok, detail, code, cree_le)
  select e.id, e.classe_id, left(x->>'mission', 16), left(coalesce(x->>'type', '?'), 24),
         (x->>'ok')::boolean, left(x->>'detail', 600), left(x->>'code', 6000),
         coalesce(least((x->>'quand')::timestamptz, now()), now())
  from (select value as x from jsonb_array_elements(p_evenements) limit 200) t;
  get diagnostics n = row_count;
  update gb_eleves set vu_le = now() where id = e.id;
  return n;
end $$;

-- L'équipage : ce que chaque élève voit de ses camarades (jamais leur code !)
create or replace function public.gb_equipage(p_jeton uuid)
returns table (pseudo text, avatar text, xp int, faites_principal int, faites_bonus int, etoiles int,
               badges int, mission_courante text, vu_le timestamptz, moi boolean)
language plpgsql security definer set search_path = public as $$
declare e gb_eleves;
begin
  e := public.gb_eleve_par_jeton(p_jeton);
  return query
    select b.pseudo, b.avatar, b.xp, b.faites_principal, b.faites_bonus, b.etoiles, b.badges,
           b.mission_courante, b.vu_le, b.id = e.id
    from gb_eleves b where b.classe_id = e.classe_id
    order by b.faites_principal + b.faites_bonus desc, b.xp desc, b.pseudo;
end $$;

-- -----------------------------------------------------------------------------
-- 5. Fonctions pour les professeurs (protégées par la clé de leur espace)
-- -----------------------------------------------------------------------------
-- Créer un espace : renvoie la clé, montrée une seule fois (elle n'est pas stockée en clair).
create or replace function public.gb_prof_creer_espace(p_nom text, p_etablissement text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_nom text := btrim(coalesce(p_nom, '')); v_etab text := nullif(btrim(coalesce(p_etablissement, '')), '');
        v_cle text; v_id uuid; v_recup int;
begin
  perform public.gb_verifier_identite(v_nom, v_etab);
  if (select count(*) from gb_profs where cree_le > now() - interval '10 minutes') >= 30 then
    raise exception 'Trop d''espaces créés en peu de temps : réessaie dans quelques minutes.' using errcode = 'P0001';
  end if;
  v_cle := public.gb_alea(24);
  insert into gb_profs (nom, etablissement, cle_hash) values (v_nom, v_etab, public.gb_empreinte_cle(v_cle)) returning id into v_id;
  -- Mise à jour depuis l'ancienne version : le premier espace récupère les classes sans professeur.
  update gb_classes set prof_id = v_id where prof_id is null;
  get diagnostics v_recup = row_count;
  return json_build_object('id', v_id, 'nom', v_nom, 'etablissement', v_etab, 'classes_recuperees', v_recup,
    'cle', 'PROF-' || substr(v_cle, 1, 4) || '-' || substr(v_cle, 5, 4) || '-' || substr(v_cle, 9, 4) || '-' ||
           substr(v_cle, 13, 4) || '-' || substr(v_cle, 17, 4) || '-' || substr(v_cle, 21, 4));
end $$;

create or replace function public.gb_prof_ouvrir(p_cle text)
returns json language plpgsql security definer set search_path = public as $$
declare p gb_profs;
begin
  p := public.gb_prof_par_cle(p_cle);
  update gb_profs set vu_le = now() where id = p.id;
  return json_build_object('id', p.id, 'nom', p.nom, 'etablissement', p.etablissement, 'cree_le', p.cree_le);
end $$;

-- Changer le nom affiché et l'établissement (vide = pas d'établissement)
create or replace function public.gb_prof_modifier_espace(p_cle text, p_nom text, p_etablissement text)
returns void language plpgsql security definer set search_path = public as $$
declare p gb_profs;
begin
  p := public.gb_prof_par_cle(p_cle);
  perform public.gb_verifier_identite(p_nom, p_etablissement);
  update gb_profs set nom = btrim(p_nom), etablissement = nullif(btrim(coalesce(p_etablissement, '')), '')
  where id = p.id;
end $$;

-- Nouvelle clé (lien partagé par erreur, collègue qui part…) : l'ancien lien ne marche plus.
create or replace function public.gb_prof_nouvelle_cle(p_cle text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare p gb_profs; v_cle text;
begin
  p := public.gb_prof_par_cle(p_cle);
  v_cle := public.gb_alea(24);
  update gb_profs set cle_hash = public.gb_empreinte_cle(v_cle) where id = p.id;
  return 'PROF-' || substr(v_cle, 1, 4) || '-' || substr(v_cle, 5, 4) || '-' || substr(v_cle, 9, 4) || '-' ||
         substr(v_cle, 13, 4) || '-' || substr(v_cle, 17, 4) || '-' || substr(v_cle, 21, 4);
end $$;

create or replace function public.gb_prof_classes(p_cle text)
returns table (id uuid, nom text, code text, ouverte boolean, cree_le timestamptz, nb_eleves bigint, nb_en_ligne bigint)
language plpgsql security definer set search_path = public as $$
declare p gb_profs;
begin
  p := public.gb_prof_par_cle(p_cle);
  return query
    select c.id, c.nom, substr(c.code, 1, 3) || '-' || substr(c.code, 4, 3), c.ouverte, c.cree_le,
           (select count(*) from gb_eleves e where e.classe_id = c.id),
           (select count(*) from gb_eleves e where e.classe_id = c.id and e.vu_le > now() - interval '2 minutes')
    from gb_classes c where c.prof_id = p.id order by c.cree_le desc;
end $$;

-- Une classe est identifiée par son code ; le nom (TNSI 2, groupe B…) est facultatif.
create or replace function public.gb_prof_creer_classe(p_cle text, p_nom text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare p gb_profs; v_id uuid; v_nom text := btrim(coalesce(p_nom, '')); v_code text;
begin
  p := public.gb_prof_par_cle(p_cle);
  if char_length(v_nom) > 40 then
    raise exception 'Le nom de la classe doit faire 40 caractères au plus.' using errcode = 'P0001';
  end if;
  if v_nom <> '' and exists (select 1 from gb_classes where prof_id = p.id and lower(nom) = lower(v_nom)) then
    raise exception 'Tu as déjà une classe avec ce nom.' using errcode = 'P0001';
  end if;
  if (select count(*) from gb_classes where prof_id = p.id) >= 30 then
    raise exception 'Maximum 30 classes par espace.' using errcode = 'P0001';
  end if;
  v_code := public.gb_nouveau_code_classe();
  if v_nom = '' then
    v_nom := 'Classe ' || substr(v_code, 1, 3) || '-' || substr(v_code, 4, 3);
  end if;
  insert into gb_classes (prof_id, nom, code) values (p.id, v_nom, v_code) returning id into v_id;
  return v_id;
end $$;

create or replace function public.gb_prof_modifier_classe(p_cle text, p_classe uuid, p_nom text, p_ouverte boolean)
returns void language plpgsql security definer set search_path = public as $$
declare p gb_profs;
begin
  p := public.gb_prof_par_cle(p_cle);
  perform public.gb_prof_verifier_classe(p.id, p_classe);
  update gb_classes set nom = coalesce(nullif(btrim(p_nom), ''), nom), ouverte = coalesce(p_ouverte, ouverte)
  where id = p_classe;
end $$;

-- Nouveau code d'inscription pour une classe (l'ancien ne marche plus ; les élèves inscrits ne sont pas touchés)
create or replace function public.gb_prof_nouveau_code_classe(p_cle text, p_classe uuid)
returns text language plpgsql security definer set search_path = public as $$
declare p gb_profs; c text;
begin
  p := public.gb_prof_par_cle(p_cle);
  perform public.gb_prof_verifier_classe(p.id, p_classe);
  c := public.gb_nouveau_code_classe();
  update gb_classes set code = c where id = p_classe;
  return substr(c, 1, 3) || '-' || substr(c, 4, 3);
end $$;

create or replace function public.gb_prof_supprimer_classe(p_cle text, p_classe uuid)
returns void language plpgsql security definer set search_path = public as $$
declare p gb_profs;
begin
  p := public.gb_prof_par_cle(p_cle);
  perform public.gb_prof_verifier_classe(p.id, p_classe);
  delete from gb_classes where id = p_classe;
end $$;

create or replace function public.gb_prof_eleves(p_cle text, p_classe uuid)
returns table (id uuid, pseudo text, code text, avatar text, xp int, faites_principal int, faites_bonus int, etoiles int,
               badges int, mission_courante text, vu_le timestamptz, cree_le timestamptz, etat jsonb)
language plpgsql security definer set search_path = public as $$
declare p gb_profs;
begin
  p := public.gb_prof_par_cle(p_cle);
  perform public.gb_prof_verifier_classe(p.id, p_classe);
  return query
    select e.id, e.pseudo, e.code_affiche, e.avatar, e.xp, e.faites_principal, e.faites_bonus, e.etoiles, e.badges,
           e.mission_courante, e.vu_le, e.cree_le, e.etat
    from gb_eleves e where e.classe_id = p_classe order by lower(e.pseudo);
end $$;

create or replace function public.gb_prof_evenements(p_cle text, p_eleve uuid, p_limite int default 300)
returns table (id bigint, mission text, type text, ok boolean, detail text, code text, cree_le timestamptz)
language plpgsql security definer set search_path = public as $$
declare p gb_profs;
begin
  p := public.gb_prof_par_cle(p_cle);
  perform public.gb_prof_verifier_eleve(p.id, p_eleve);
  return query
    select v.id, v.mission, v.type, v.ok, v.detail, v.code, v.cree_le from gb_evenements v
    where v.eleve_id = p_eleve order by v.cree_le desc limit least(coalesce(p_limite, 300), 2000);
end $$;

create or replace function public.gb_prof_flux(p_cle text, p_classe uuid, p_depuis timestamptz)
returns table (id bigint, pseudo text, mission text, type text, ok boolean, detail text, cree_le timestamptz)
language plpgsql security definer set search_path = public as $$
declare p gb_profs;
begin
  p := public.gb_prof_par_cle(p_cle);
  perform public.gb_prof_verifier_classe(p.id, p_classe);
  return query
    select v.id, e.pseudo, v.mission, v.type, v.ok, v.detail, v.cree_le
    from gb_evenements v join gb_eleves e on e.id = v.eleve_id
    where v.classe_id = p_classe and v.cree_le > coalesce(p_depuis, now() - interval '3 hours')
    order by v.cree_le desc limit 300;
end $$;

-- Nouveau code pour un élève (code perdu ou divulgué). Les sessions ouvertes avec l'ancien code sont fermées.
create or replace function public.gb_prof_nouveau_code(p_cle text, p_eleve uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare p gb_profs; c record;
begin
  p := public.gb_prof_par_cle(p_cle);
  perform public.gb_prof_verifier_eleve(p.id, p_eleve);
  select * into c from public.gb_nouveau_code();
  update gb_eleves set code = c.canon, code_affiche = c.affiche, jeton = gen_random_uuid() where id = p_eleve;
  return c.affiche;
end $$;

create or replace function public.gb_prof_renommer_eleve(p_cle text, p_eleve uuid, p_pseudo text)
returns void language plpgsql security definer set search_path = public as $$
declare p gb_profs; v text := btrim(coalesce(p_pseudo, ''));
begin
  p := public.gb_prof_par_cle(p_cle);
  perform public.gb_prof_verifier_eleve(p.id, p_eleve);
  if char_length(v) < 2 or char_length(v) > 24 then
    raise exception 'Le pseudo doit faire entre 2 et 24 caractères.' using errcode = 'P0001';
  end if;
  update gb_eleves set pseudo = v where id = p_eleve;
end $$;

create or replace function public.gb_prof_supprimer_eleve(p_cle text, p_eleve uuid)
returns void language plpgsql security definer set search_path = public as $$
declare p gb_profs;
begin
  p := public.gb_prof_par_cle(p_cle);
  perform public.gb_prof_verifier_eleve(p.id, p_eleve);
  delete from gb_eleves where id = p_eleve;
end $$;

-- Supprimer son espace, ses classes et leurs élèves (définitif)
create or replace function public.gb_prof_supprimer_espace(p_cle text)
returns void language plpgsql security definer set search_path = public as $$
declare p gb_profs;
begin
  p := public.gb_prof_par_cle(p_cle);
  delete from gb_profs where id = p.id;
end $$;

-- Droits : seules ces fonctions sont appelables depuis le site.
do $$
declare f text;
begin
  foreach f in array array[
    'gb_normaliser_code(text)',
    'gb_classe_par_code(text)',
    'gb_inscription(text, text, text)',
    'gb_connexion(text)',
    'gb_reprise(uuid)',
    'gb_sauvegarde(uuid, jsonb, int, int, int, int, int, text, text)',
    'gb_presence(uuid, text)',
    'gb_journal(uuid, jsonb)',
    'gb_equipage(uuid)',
    'gb_prof_creer_espace(text, text)',
    'gb_prof_ouvrir(text)',
    'gb_prof_modifier_espace(text, text, text)',
    'gb_prof_nouvelle_cle(text)',
    'gb_prof_classes(text)',
    'gb_prof_creer_classe(text, text)',
    'gb_prof_modifier_classe(text, uuid, text, boolean)',
    'gb_prof_nouveau_code_classe(text, uuid)',
    'gb_prof_supprimer_classe(text, uuid)',
    'gb_prof_eleves(text, uuid)',
    'gb_prof_evenements(text, uuid, int)',
    'gb_prof_flux(text, uuid, timestamptz)',
    'gb_prof_nouveau_code(text, uuid)',
    'gb_prof_renommer_eleve(text, uuid, text)',
    'gb_prof_supprimer_eleve(text, uuid)',
    'gb_prof_supprimer_espace(text)'
  ] loop
    execute format('revoke execute on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Lien professeur perdu ? (à lancer à la main par la personne qui gère Supabase)
--   1. Retrouver l'espace :   select id, nom, etablissement, cree_le, vu_le from public.gb_profs order by vu_le desc;
--   2. Lui donner une nouvelle clé (remplace l'id et choisis une clé d'au moins 20 caractères) :
--      set search_path = public, extensions;
--      update public.gb_profs set cle_hash = public.gb_empreinte_cle('NOUVELLE-CLE-TRES-LONGUE-123') where id = '...';
--      Le lien devient alors : https://…/prof.html#cle=NOUVELLE-CLE-TRES-LONGUE-123
-- -----------------------------------------------------------------------------

-- Demande à l'API de recharger la liste des fonctions.
notify pgrst, 'reload schema';
