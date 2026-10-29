-- =============================================================================
--  Expédition Gombessa — base de données Supabase
-- =============================================================================
--  À coller en entier dans Supabase › SQL Editor › New query, puis « Run ».
--  Le script peut être relancé sans risque (il ne supprime aucune donnée).
--  Il peut aussi être installé dans une base qui sert déjà à un autre projet :
--  il n'ajoute que des objets « gb_… » et ne touche à rien d'autre.
--
--  ⚠️ AVANT DE LANCER : remplace  CHANGE-MOI  (tout en bas, section 5)
--     par le mot de passe du tableau de bord professeur.
--
--  Fonctionnement :
--   - Chaque élève reçoit un CODE D'EXPÉDITION unique (ex. CORAIL-MANTA-482) à la
--     création de son compte. Avec ce code, il reprend sa partie depuis n'importe
--     quel ordinateur ou téléphone. Le professeur voit les codes et peut en générer
--     un nouveau (code perdu ou divulgué).
--   - Les élèves n'ont accès à AUCUNE table directement : tout passe par des
--     fonctions (RPC) qui vérifient un jeton de session ou le mot de passe du
--     professeur (stocké chiffré avec bcrypt).
--   - Données personnelles minimales : un prénom ou pseudo, rien d'autre.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Cohabitation avec d'autres projets dans la même base
--    Ce script ne crée, ne modifie et ne supprime QUE des objets dont le nom
--    commence par « gb_ » (4 tables, des fonctions). Les tables et fonctions des
--    autres projets ne sont pas touchées. Garde-fou : si une table gb_eleves
--    existe déjà sans venir de ce jeu, le script s'arrête avant toute modification.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'gb_eleves')
     and not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'gb_eleves' and column_name = 'code_affiche') then
    raise exception 'Une table public.gb_eleves existe déjà et ne vient pas d''Expédition Gombessa : arrêt, rien n''a été modifié.';
  end if;
end $$;

-- pgcrypto (chiffrement bcrypt, octets aléatoires) : déjà installé sur Supabase,
-- dans le schéma « extensions » (ou « public » sur certains projets anciens).
create extension if not exists pgcrypto with schema extensions;
set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------
create table if not exists public.gb_reglages (
  id int primary key default 1 check (id = 1),
  prof_hash text not null
);

create table if not exists public.gb_classes (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  ouverte boolean not null default true,
  cree_le timestamptz not null default now()
);

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
alter table public.gb_reglages enable row level security;
alter table public.gb_classes enable row level security;
alter table public.gb_eleves enable row level security;
alter table public.gb_evenements enable row level security;
revoke all on public.gb_reglages, public.gb_classes, public.gb_eleves, public.gb_evenements from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Outils internes
-- -----------------------------------------------------------------------------
create or replace function public.gb_verifier_prof(p_secret text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare h text;
begin
  select prof_hash into h from gb_reglages where id = 1;
  if h is null or p_secret is null or crypt(p_secret, h) <> h then
    perform pg_sleep(0.6);
    raise exception 'Mot de passe professeur incorrect.' using errcode = 'P0001';
  end if;
end $$;

-- « corail-manta 482 », « Coràil Manta 482 »… → CORAILMANTA482
create or replace function public.gb_normaliser_code(p text)
returns text language sql immutable as $$
  select regexp_replace(upper(translate(coalesce(p, ''),
    'àâäáãéèêëíìîïóòôöõúùûüçñÀÂÄÁÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')), '[^A-Z0-9]', '', 'g');
$$;

-- Un code facile à recopier : deux mots de la mer et trois chiffres (environ 1,6 million de codes possibles).
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
    'etat', e.etat);
$$;

revoke execute on function public.gb_verifier_prof(text) from public, anon, authenticated;
revoke execute on function public.gb_nouveau_code() from public, anon, authenticated;
revoke execute on function public.gb_eleve_par_jeton(uuid) from public, anon, authenticated;
revoke execute on function public.gb_fiche_eleve(public.gb_eleves) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Fonctions pour les élèves
-- -----------------------------------------------------------------------------
create or replace function public.gb_classes_ouvertes()
returns table (id uuid, nom text) language sql stable security definer set search_path = public as $$
  select id, nom from gb_classes where ouverte order by nom;
$$;

create or replace function public.gb_inscription(p_classe uuid, p_pseudo text, p_avatar text default '🦀')
returns json language plpgsql security definer set search_path = public, extensions as $$
declare e gb_eleves; v_pseudo text := btrim(coalesce(p_pseudo, '')); c record;
begin
  if not exists (select 1 from gb_classes where id = p_classe and ouverte) then
    raise exception 'Cette classe n''existe pas ou est fermée.' using errcode = 'P0001';
  end if;
  if char_length(v_pseudo) < 2 or char_length(v_pseudo) > 24 then
    raise exception 'Le prénom ou pseudo doit faire entre 2 et 24 caractères.' using errcode = 'P0001';
  end if;
  if exists (select 1 from gb_eleves where classe_id = p_classe and lower(pseudo) = lower(v_pseudo)) then
    raise exception 'Ce prénom est déjà pris dans cette classe. Si c''est toi, utilise ton code (« J''ai déjà un code »). Sinon, ajoute une initiale.' using errcode = 'P0001';
  end if;
  if (select count(*) from gb_eleves where classe_id = p_classe) >= 200 then
    raise exception 'Cette classe est complète (200 élèves).' using errcode = 'P0001';
  end if;
  select * into c from public.gb_nouveau_code();
  insert into gb_eleves (classe_id, pseudo, code, code_affiche, avatar)
  values (p_classe, v_pseudo, c.canon, c.affiche, left(coalesce(p_avatar, '🦀'), 16))
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
-- 4. Fonctions pour le professeur (protégées par mot de passe)
-- -----------------------------------------------------------------------------
create or replace function public.gb_prof_test(p_secret text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  perform public.gb_verifier_prof(p_secret);
  return true;
end $$;

create or replace function public.gb_prof_classes(p_secret text)
returns table (id uuid, nom text, ouverte boolean, cree_le timestamptz, nb_eleves bigint, nb_en_ligne bigint)
language plpgsql security definer set search_path = public as $$
begin
  perform public.gb_verifier_prof(p_secret);
  return query
    select c.id, c.nom, c.ouverte, c.cree_le,
           (select count(*) from gb_eleves e where e.classe_id = c.id),
           (select count(*) from gb_eleves e where e.classe_id = c.id and e.vu_le > now() - interval '2 minutes')
    from gb_classes c order by c.cree_le desc;
end $$;

create or replace function public.gb_prof_creer_classe(p_secret text, p_nom text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_nom text := btrim(coalesce(p_nom, ''));
begin
  perform public.gb_verifier_prof(p_secret);
  if char_length(v_nom) < 2 or char_length(v_nom) > 40 then
    raise exception 'Le nom de la classe doit faire entre 2 et 40 caractères.' using errcode = 'P0001';
  end if;
  if exists (select 1 from gb_classes where lower(nom) = lower(v_nom)) then
    raise exception 'Une classe porte déjà ce nom.' using errcode = 'P0001';
  end if;
  insert into gb_classes (nom) values (v_nom) returning id into v_id;
  return v_id;
end $$;

create or replace function public.gb_prof_modifier_classe(p_secret text, p_classe uuid, p_nom text, p_ouverte boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.gb_verifier_prof(p_secret);
  update gb_classes set nom = coalesce(nullif(btrim(p_nom), ''), nom), ouverte = coalesce(p_ouverte, ouverte)
  where id = p_classe;
end $$;

create or replace function public.gb_prof_supprimer_classe(p_secret text, p_classe uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.gb_verifier_prof(p_secret);
  delete from gb_classes where id = p_classe;
end $$;

create or replace function public.gb_prof_eleves(p_secret text, p_classe uuid)
returns table (id uuid, pseudo text, code text, avatar text, xp int, faites_principal int, faites_bonus int, etoiles int,
               badges int, mission_courante text, vu_le timestamptz, cree_le timestamptz, etat jsonb)
language plpgsql security definer set search_path = public as $$
begin
  perform public.gb_verifier_prof(p_secret);
  return query
    select e.id, e.pseudo, e.code_affiche, e.avatar, e.xp, e.faites_principal, e.faites_bonus, e.etoiles, e.badges,
           e.mission_courante, e.vu_le, e.cree_le, e.etat
    from gb_eleves e where e.classe_id = p_classe order by lower(e.pseudo);
end $$;

create or replace function public.gb_prof_evenements(p_secret text, p_eleve uuid, p_limite int default 300)
returns table (id bigint, mission text, type text, ok boolean, detail text, code text, cree_le timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform public.gb_verifier_prof(p_secret);
  return query
    select v.id, v.mission, v.type, v.ok, v.detail, v.code, v.cree_le from gb_evenements v
    where v.eleve_id = p_eleve order by v.cree_le desc limit least(coalesce(p_limite, 300), 2000);
end $$;

create or replace function public.gb_prof_flux(p_secret text, p_classe uuid, p_depuis timestamptz)
returns table (id bigint, pseudo text, mission text, type text, ok boolean, detail text, cree_le timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform public.gb_verifier_prof(p_secret);
  return query
    select v.id, e.pseudo, v.mission, v.type, v.ok, v.detail, v.cree_le
    from gb_evenements v join gb_eleves e on e.id = v.eleve_id
    where v.classe_id = p_classe and v.cree_le > coalesce(p_depuis, now() - interval '3 hours')
    order by v.cree_le desc limit 300;
end $$;

-- Nouveau code pour un élève (code perdu ou divulgué). Les sessions ouvertes avec l'ancien code sont fermées.
create or replace function public.gb_prof_nouveau_code(p_secret text, p_eleve uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare c record;
begin
  perform public.gb_verifier_prof(p_secret);
  select * into c from public.gb_nouveau_code();
  update gb_eleves set code = c.canon, code_affiche = c.affiche, jeton = gen_random_uuid() where id = p_eleve;
  if not found then
    raise exception 'Élève introuvable.' using errcode = 'P0001';
  end if;
  return c.affiche;
end $$;

create or replace function public.gb_prof_renommer_eleve(p_secret text, p_eleve uuid, p_pseudo text)
returns void language plpgsql security definer set search_path = public as $$
declare v text := btrim(coalesce(p_pseudo, ''));
begin
  perform public.gb_verifier_prof(p_secret);
  if char_length(v) < 2 or char_length(v) > 24 then
    raise exception 'Le pseudo doit faire entre 2 et 24 caractères.' using errcode = 'P0001';
  end if;
  update gb_eleves set pseudo = v where id = p_eleve;
end $$;

create or replace function public.gb_prof_supprimer_eleve(p_secret text, p_eleve uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.gb_verifier_prof(p_secret);
  delete from gb_eleves where id = p_eleve;
end $$;

create or replace function public.gb_prof_changer_mot_de_passe(p_secret text, p_nouveau text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.gb_verifier_prof(p_secret);
  if char_length(coalesce(p_nouveau, '')) < 8 then
    raise exception 'Le nouveau mot de passe doit faire au moins 8 caractères.' using errcode = 'P0001';
  end if;
  update gb_reglages set prof_hash = crypt(p_nouveau, gen_salt('bf')) where id = 1;
end $$;

-- Droits : seules ces fonctions sont appelables depuis le site.
do $$
declare f text;
begin
  foreach f in array array[
    'gb_normaliser_code(text)',
    'gb_classes_ouvertes()',
    'gb_inscription(uuid, text, text)',
    'gb_connexion(text)',
    'gb_reprise(uuid)',
    'gb_sauvegarde(uuid, jsonb, int, int, int, int, int, text, text)',
    'gb_presence(uuid, text)',
    'gb_journal(uuid, jsonb)',
    'gb_equipage(uuid)',
    'gb_prof_test(text)',
    'gb_prof_classes(text)',
    'gb_prof_creer_classe(text, text)',
    'gb_prof_modifier_classe(text, uuid, text, boolean)',
    'gb_prof_supprimer_classe(text, uuid)',
    'gb_prof_eleves(text, uuid)',
    'gb_prof_evenements(text, uuid, int)',
    'gb_prof_flux(text, uuid, timestamptz)',
    'gb_prof_nouveau_code(text, uuid)',
    'gb_prof_renommer_eleve(text, uuid, text)',
    'gb_prof_supprimer_eleve(text, uuid)',
    'gb_prof_changer_mot_de_passe(text, text)'
  ] loop
    execute format('revoke execute on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 5. Mot de passe du tableau de bord professeur
--    Remplace CHANGE-MOI ci-dessous AVANT de lancer le script.
--    (Si le script a déjà été lancé, la ligne ne change rien : utilise alors
--     le bouton « Changer le mot de passe » du tableau de bord.)
-- -----------------------------------------------------------------------------
insert into public.gb_reglages (id, prof_hash)
values (1, crypt('CHANGE-MOI', gen_salt('bf')))
on conflict (id) do nothing;

-- Mot de passe oublié ? Lance seulement cette ligne en remplaçant NOUVEAU-MOT-DE-PASSE :
-- set search_path = public, extensions; update public.gb_reglages set prof_hash = crypt('NOUVEAU-MOT-DE-PASSE', gen_salt('bf')) where id = 1;

-- Demande à l'API de recharger la liste des fonctions.
notify pgrst, 'reload schema';
