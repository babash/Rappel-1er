begin;
-- =============================================================================
--  Expédition Gombessa : SQL inverse de la migration 0001 (espaces professeur)
--  Projet Supabase cukahpyqkljiddmimpyi. Nom de migration : gombessa_0001_espaces_inverse
-- =============================================================================
--  **CE QUI NE REVIENT PAS :**
--   - L'ANCIEN MOT DE PASSE. La migration 0001 a supprimé son empreinte
--     (table gb_reglages). Ce fichier recrée la table, mais vide : le tableau de
--     bord de l'ancienne version refuse tout mot de passe tant que l'enseignant·e
--     n'en a pas choisi un nouveau (LISEZMOI.md, « Revenir en arrière »).
--   - LES ESPACES PROFESSEUR (table gb_profs : nom affiché, établissement,
--     empreinte de la clé) : ils sont supprimés, et les liens personnels ne
--     marchent plus.
--   - LES CODES DE CLASSE (colonne gb_classes.code) : ils sont supprimés.
--  Les élèves, leur progression et leur journal sont gardés, y compris ceux et
--  celles qui se sont inscrit·e·s après la migration, et toutes les classes
--  restent, y compris celles créées depuis (l'ancienne version les montre
--  toutes à quiconque a le mot de passe unique).
--
--  À quoi sert ce fichier : revenir exactement à l'état de la base relevé le
--  10/11/2026 (métadonnées : tables, contraintes, index, droits et
--  pg_get_functiondef), si la migration 0001 pose un problème. Attention : la
--  page publiée appelle les fonctions de la version 0001 ; après ce retour, il
--  faut aussi republier l'ancienne page (avant eeb49b5), sinon l'inscription et
--  l'espace enseignant·e sont de nouveau cassés.
--
--  Ne touche que des objets gb_ :
--   - SUPPRIME la table gb_profs, les colonnes gb_classes.code et
--     gb_classes.prof_id, les index gb_classes_code et gb_classes_prof, et les
--     25 fonctions propres à la version 0001 (dont les 10 gb_prof_* à clé) ;
--   - RECRÉE la table gb_reglages (vide), la contrainte gb_classes_nom_key, et
--     les 15 anciennes fonctions supprimées par 0001 ;
--   - REMET les définitions d'avant dans gb_fiche_eleve et gb_normaliser_code
--     (sans search_path fixé, comme aujourd'hui), et réécrit à l'identique les
--     8 autres fonctions que 0001 avait réécrites ;
--   - REMET les droits d'avant : 21 fonctions appelables par anon et
--     authenticated, 4 fonctions internes fermées.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Garde-fous : rien n'est modifié si l'un d'eux s'arrête.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'gb_profs') then
    raise exception 'La table public.gb_profs n''existe pas : la migration 0001 n''a pas été appliquée. Arrêt, rien n''a été modifié.';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'gb_reglages') then
    raise exception 'La table public.gb_reglages existe déjà : la base n''est pas dans l''état laissé par 0001. Arrêt, rien n''a été modifié.';
  end if;
  -- L'ancienne version veut des noms de classe tous différents (contrainte gb_classes_nom_key).
  if exists (select 1 from public.gb_classes group by nom having count(*) > 1) then
    raise exception 'Deux classes portent le même nom. Renomme l''une d''elles dans prof.html, puis relance ce fichier. Arrêt, rien n''a été modifié.';
  end if;
end $$;

set local search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. Les fonctions de la version 0001
-- -----------------------------------------------------------------------------
drop function if exists public.gb_classe_par_code(text);
drop function if exists public.gb_inscription(text, text, text);
drop function if exists public.gb_prof_creer_espace(text, text);
drop function if exists public.gb_prof_ouvrir(text);
drop function if exists public.gb_prof_modifier_espace(text, text, text);
drop function if exists public.gb_prof_nouvelle_cle(text);
drop function if exists public.gb_prof_classes(text);
drop function if exists public.gb_prof_creer_classe(text, text);
drop function if exists public.gb_prof_modifier_classe(text, uuid, text, boolean);
drop function if exists public.gb_prof_nouveau_code_classe(text, uuid);
drop function if exists public.gb_prof_supprimer_classe(text, uuid);
drop function if exists public.gb_prof_eleves(text, uuid);
drop function if exists public.gb_prof_evenements(text, uuid, int);
drop function if exists public.gb_prof_flux(text, uuid, timestamptz);
drop function if exists public.gb_prof_nouveau_code(text, uuid);
drop function if exists public.gb_prof_renommer_eleve(text, uuid, text);
drop function if exists public.gb_prof_supprimer_eleve(text, uuid);
drop function if exists public.gb_prof_supprimer_espace(text);
drop function if exists public.gb_prof_par_cle(text);
drop function if exists public.gb_prof_verifier_classe(uuid, uuid);
drop function if exists public.gb_prof_verifier_eleve(uuid, uuid);
drop function if exists public.gb_verifier_identite(text, text);
drop function if exists public.gb_empreinte_cle(text);
drop function if exists public.gb_nouveau_code_classe();
drop function if exists public.gb_alea(int);

-- -----------------------------------------------------------------------------
-- 2. Les tables : gb_classes comme avant, gb_profs supprimée, gb_reglages vide
-- -----------------------------------------------------------------------------
drop index if exists public.gb_classes_code;
drop index if exists public.gb_classes_prof;
alter table public.gb_classes drop column if exists prof_id;   -- retire aussi la clé étrangère vers gb_profs
alter table public.gb_classes drop column if exists code;
alter table public.gb_classes add constraint gb_classes_nom_key unique (nom);
drop table public.gb_profs;

create table public.gb_reglages (
  id integer primary key default 1 check (id = 1),
  prof_hash text not null
);
alter table public.gb_reglages enable row level security;
revoke all on public.gb_reglages from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Les fonctions d'avant, telles que pg_get_functiondef les donnait le 10/11
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gb_verifier_prof(p_secret text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare h text;
begin
  select prof_hash into h from gb_reglages where id = 1;
  if h is null or p_secret is null or crypt(p_secret, h) <> h then
    perform pg_sleep(0.6);
    raise exception 'Mot de passe professeur incorrect.' using errcode = 'P0001';
  end if;
end $function$;

CREATE OR REPLACE FUNCTION public.gb_normaliser_code(p text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select regexp_replace(upper(translate(coalesce(p, ''),
    'àâäáãéèêëíìîïóòôöõúùûüçñÀÂÄÁÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')), '[^A-Z0-9]', '', 'g');
$function$;

CREATE OR REPLACE FUNCTION public.gb_nouveau_code(OUT canon text, OUT affiche text)
 RETURNS record
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.gb_eleve_par_jeton(p_jeton uuid)
 RETURNS gb_eleves
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare e gb_eleves;
begin
  select * into e from gb_eleves where jeton = p_jeton;
  if e.id is null then
    raise exception 'Session inconnue : reconnecte-toi avec ton code d''expédition.' using errcode = 'P0001';
  end if;
  return e;
end $function$;

CREATE OR REPLACE FUNCTION public.gb_fiche_eleve(e gb_eleves)
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select json_build_object(
    'eleve_id', e.id, 'jeton', e.jeton, 'pseudo', e.pseudo, 'avatar', e.avatar, 'code', e.code_affiche,
    'classe_id', e.classe_id, 'classe_nom', (select nom from gb_classes where id = e.classe_id),
    'etat', e.etat);
$function$;

CREATE OR REPLACE FUNCTION public.gb_classes_ouvertes()
 RETURNS TABLE(id uuid, nom text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select id, nom from gb_classes where ouverte order by nom;
$function$;

CREATE OR REPLACE FUNCTION public.gb_inscription(p_classe uuid, p_pseudo text, p_avatar text DEFAULT '🦀'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.gb_connexion(p_code text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.gb_reprise(p_jeton uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare e gb_eleves;
begin
  e := public.gb_eleve_par_jeton(p_jeton);
  update gb_eleves set vu_le = now() where id = e.id;
  return public.gb_fiche_eleve(e);
end $function$;

CREATE OR REPLACE FUNCTION public.gb_sauvegarde(p_jeton uuid, p_etat jsonb, p_xp integer, p_principal integer, p_bonus integer, p_etoiles integer, p_badges integer, p_mission text, p_avatar text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.gb_presence(p_jeton uuid, p_mission text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare e gb_eleves;
begin
  e := public.gb_eleve_par_jeton(p_jeton);
  update gb_eleves set vu_le = now(), mission_courante = coalesce(left(p_mission, 16), mission_courante) where id = e.id;
end $function$;

CREATE OR REPLACE FUNCTION public.gb_journal(p_jeton uuid, p_evenements jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.gb_equipage(p_jeton uuid)
 RETURNS TABLE(pseudo text, avatar text, xp integer, faites_principal integer, faites_bonus integer, etoiles integer, badges integer, mission_courante text, vu_le timestamp with time zone, moi boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare e gb_eleves;
begin
  e := public.gb_eleve_par_jeton(p_jeton);
  return query
    select b.pseudo, b.avatar, b.xp, b.faites_principal, b.faites_bonus, b.etoiles, b.badges,
           b.mission_courante, b.vu_le, b.id = e.id
    from gb_eleves b where b.classe_id = e.classe_id
    order by b.faites_principal + b.faites_bonus desc, b.xp desc, b.pseudo;
end $function$;

CREATE OR REPLACE FUNCTION public.gb_prof_test(p_secret text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.gb_verifier_prof(p_secret);
  return true;
end $function$;

CREATE OR REPLACE FUNCTION public.gb_prof_classes(p_secret text)
 RETURNS TABLE(id uuid, nom text, ouverte boolean, cree_le timestamp with time zone, nb_eleves bigint, nb_en_ligne bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.gb_verifier_prof(p_secret);
  return query
    select c.id, c.nom, c.ouverte, c.cree_le,
           (select count(*) from gb_eleves e where e.classe_id = c.id),
           (select count(*) from gb_eleves e where e.classe_id = c.id and e.vu_le > now() - interval '2 minutes')
    from gb_classes c order by c.cree_le desc;
end $function$;

CREATE OR REPLACE FUNCTION public.gb_prof_creer_classe(p_secret text, p_nom text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.gb_prof_modifier_classe(p_secret text, p_classe uuid, p_nom text, p_ouverte boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.gb_verifier_prof(p_secret);
  update gb_classes set nom = coalesce(nullif(btrim(p_nom), ''), nom), ouverte = coalesce(p_ouverte, ouverte)
  where id = p_classe;
end $function$;

CREATE OR REPLACE FUNCTION public.gb_prof_supprimer_classe(p_secret text, p_classe uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.gb_verifier_prof(p_secret);
  delete from gb_classes where id = p_classe;
end $function$;

CREATE OR REPLACE FUNCTION public.gb_prof_eleves(p_secret text, p_classe uuid)
 RETURNS TABLE(id uuid, pseudo text, code text, avatar text, xp integer, faites_principal integer, faites_bonus integer, etoiles integer, badges integer, mission_courante text, vu_le timestamp with time zone, cree_le timestamp with time zone, etat jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.gb_verifier_prof(p_secret);
  return query
    select e.id, e.pseudo, e.code_affiche, e.avatar, e.xp, e.faites_principal, e.faites_bonus, e.etoiles, e.badges,
           e.mission_courante, e.vu_le, e.cree_le, e.etat
    from gb_eleves e where e.classe_id = p_classe order by lower(e.pseudo);
end $function$;

CREATE OR REPLACE FUNCTION public.gb_prof_evenements(p_secret text, p_eleve uuid, p_limite integer DEFAULT 300)
 RETURNS TABLE(id bigint, mission text, type text, ok boolean, detail text, code text, cree_le timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.gb_verifier_prof(p_secret);
  return query
    select v.id, v.mission, v.type, v.ok, v.detail, v.code, v.cree_le from gb_evenements v
    where v.eleve_id = p_eleve order by v.cree_le desc limit least(coalesce(p_limite, 300), 2000);
end $function$;

CREATE OR REPLACE FUNCTION public.gb_prof_flux(p_secret text, p_classe uuid, p_depuis timestamp with time zone)
 RETURNS TABLE(id bigint, pseudo text, mission text, type text, ok boolean, detail text, cree_le timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.gb_verifier_prof(p_secret);
  return query
    select v.id, e.pseudo, v.mission, v.type, v.ok, v.detail, v.cree_le
    from gb_evenements v join gb_eleves e on e.id = v.eleve_id
    where v.classe_id = p_classe and v.cree_le > coalesce(p_depuis, now() - interval '3 hours')
    order by v.cree_le desc limit 300;
end $function$;

CREATE OR REPLACE FUNCTION public.gb_prof_nouveau_code(p_secret text, p_eleve uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare c record;
begin
  perform public.gb_verifier_prof(p_secret);
  select * into c from public.gb_nouveau_code();
  update gb_eleves set code = c.canon, code_affiche = c.affiche, jeton = gen_random_uuid() where id = p_eleve;
  if not found then
    raise exception 'Élève introuvable.' using errcode = 'P0001';
  end if;
  return c.affiche;
end $function$;

CREATE OR REPLACE FUNCTION public.gb_prof_renommer_eleve(p_secret text, p_eleve uuid, p_pseudo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v text := btrim(coalesce(p_pseudo, ''));
begin
  perform public.gb_verifier_prof(p_secret);
  if char_length(v) < 2 or char_length(v) > 24 then
    raise exception 'Le pseudo doit faire entre 2 et 24 caractères.' using errcode = 'P0001';
  end if;
  update gb_eleves set pseudo = v where id = p_eleve;
end $function$;

CREATE OR REPLACE FUNCTION public.gb_prof_supprimer_eleve(p_secret text, p_eleve uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.gb_verifier_prof(p_secret);
  delete from gb_eleves where id = p_eleve;
end $function$;

CREATE OR REPLACE FUNCTION public.gb_prof_changer_mot_de_passe(p_secret text, p_nouveau text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  perform public.gb_verifier_prof(p_secret);
  if char_length(coalesce(p_nouveau, '')) < 8 then
    raise exception 'Le nouveau mot de passe doit faire au moins 8 caractères.' using errcode = 'P0001';
  end if;
  update gb_reglages set prof_hash = crypt(p_nouveau, gen_salt('bf')) where id = 1;
end $function$;

-- -----------------------------------------------------------------------------
-- 4. Les droits d'avant
-- -----------------------------------------------------------------------------
revoke execute on function public.gb_verifier_prof(text) from public, anon, authenticated;
revoke execute on function public.gb_nouveau_code() from public, anon, authenticated;
revoke execute on function public.gb_eleve_par_jeton(uuid) from public, anon, authenticated;
revoke execute on function public.gb_fiche_eleve(public.gb_eleves) from public, anon, authenticated;

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

-- Demande à l'API de recharger la liste des fonctions.
notify pgrst, 'reload schema';

commit;
