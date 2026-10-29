# -*- coding: utf-8 -*-
"""
Moteur d'exécution de « Expédition Gombessa ».

Ce fichier est chargé par le worker Pyodide (dans le navigateur) et peut aussi
être utilisé avec un Python classique pour tester les missions.

Il fait trois choses :
  1. exécuter le code de l'élève (après le « dossier » de la mission) en capturant
     les affichages ;
  2. traduire les erreurs Python en explications simples, en français ;
  3. lancer le vérificateur de la mission, qui dit si c'est réussi et sinon pourquoi.
"""
import builtins
import copy
import difflib
import io
import json
import re
import sys
import time
import tokenize
import types

LIMITE_AFFICHAGE = 20000      # caractères affichés au maximum (boucles infinies avec print)
FICHIER_ELEVE = "<ton code>"
FICHIER_DOSSIER = "<dossier>"
FICHIER_VERIF = "<verif>"


# --------------------------------------------------------------------------
#  Exceptions internes
# --------------------------------------------------------------------------
class Echec(Exception):
    """Levée par un vérificateur quand le résultat n'est pas encore bon."""


class TropAffichage(Exception):
    """Le programme affiche beaucoup trop de texte (souvent une boucle infinie)."""


class TempsDepasse(BaseException):
    """Le programme tourne depuis trop longtemps (boucle infinie ?)."""


class Chrono:
    """Arrête le code de l'élève s'il dépasse la durée limite (utile quand Python tourne dans la page)."""

    def __init__(self, limite_s):
        self.limite = limite_s
        self.compteur = 0
        self.declenche = False

    def _trace(self, frame, evenement, arg):
        if self.declenche:
            return None
        self.compteur += 1
        if self.compteur % 3000 == 0 and time.monotonic() > self.fin:
            self.declenche = True
            raise TempsDepasse()
        return self._trace

    def __enter__(self):
        if self.limite:
            self.fin = time.monotonic() + float(self.limite)
            sys.settrace(self._trace)
        return self

    def __exit__(self, *exc):
        if self.limite:
            sys.settrace(None)
        return False


class ErreurDansFonction(Exception):
    """La fonction de l'élève a planté pendant un test du vérificateur."""

    def __init__(self, info):
        super().__init__(info.get("message", ""))
        self.info = info


class SortieLimitee(io.StringIO):
    def write(self, s):
        if self.tell() + len(s) > LIMITE_AFFICHAGE:
            super().write(s[: max(0, LIMITE_AFFICHAGE - self.tell())])
            raise TropAffichage()
        return super().write(s)


def _input_interdit(*args, **kwargs):
    raise RuntimeError("input() n'est pas utilisé ici : toutes les données sont déjà dans le dossier de la mission.")


def _exit_interdit(*args, **kwargs):
    raise RuntimeError("exit() et quit() ne sont pas utilisés ici : le programme s'arrête tout seul à la fin.")


def _builtins_eleve():
    b = dict(vars(builtins))
    b["input"] = _input_interdit
    b["exit"] = _exit_interdit
    b["quit"] = _exit_interdit
    return b


# --------------------------------------------------------------------------
#  Petits outils
# --------------------------------------------------------------------------
def _sans_commentaires(code):
    """Retire les commentaires (# ...) sans toucher aux textes entre guillemets."""
    try:
        morceaux = []
        toks = tokenize.generate_tokens(io.StringIO(code).readline)
        for tok in toks:
            if tok.type == tokenize.COMMENT:
                continue
            morceaux.append(tok)
        return tokenize.untokenize(morceaux)
    except Exception:
        return re.sub(r"#[^\n]*", "", code)


def _sans_textes(code):
    """Remplace le contenu des chaînes de caractères par du vide (pour chercher des instructions)."""
    try:
        resultat = []
        toks = tokenize.generate_tokens(io.StringIO(code).readline)
        for tok in toks:
            if tok.type == tokenize.COMMENT:
                continue
            if tok.type == tokenize.STRING:
                tok = tok._replace(string='""')
            resultat.append(tok)
        return tokenize.untokenize(resultat)
    except Exception:
        return re.sub(r"(\"[^\"\n]*\"|'[^'\n]*')", '""', re.sub(r"#[^\n]*", "", code))


def montre(v, limite=120):
    """repr() raccourci, pour les messages."""
    try:
        r = repr(v)
    except Exception:
        r = "<valeur>"
    if len(r) > limite:
        r = r[: limite - 3] + "..."
    return r


def _nom_type(v):
    noms = {
        list: "une liste", dict: "un dictionnaire", tuple: "un tuple", str: "un texte (str)",
        int: "un nombre entier (int)", float: "un nombre à virgule (float)", bool: "un booléen (True/False)",
        set: "un ensemble (set)", type(None): "None (rien)",
    }
    if isinstance(v, types.FunctionType):
        return "une fonction"
    return noms.get(type(v), "un objet de type " + type(v).__name__)


NOMS_TYPES_FR = {
    "list": "liste", "dict": "dictionnaire", "tuple": "tuple", "str": "texte (str)", "int": "nombre entier (int)",
    "float": "nombre à virgule (float)", "bool": "booléen", "NoneType": "None", "set": "ensemble",
    "function": "fonction", "builtin_function_or_method": "fonction", "method": "méthode",
}


def _fr(t):
    return NOMS_TYPES_FR.get(t, t)


# --------------------------------------------------------------------------
#  Inspecteur de variables (pour l'affichage visuel)
# --------------------------------------------------------------------------
def _ser(v, chemin, vus, profondeur=0):
    if isinstance(v, (list, dict, tuple, set)):
        ident = id(v)
        if ident in vus and isinstance(v, (list, dict, set)):
            return {"t": type(v).__name__, "alias": vus[ident]}
        vus[ident] = chemin
    if profondeur > 4:
        return {"t": "plus"}
    if v is None:
        return {"t": "none"}
    if isinstance(v, bool):
        return {"t": "bool", "v": v}
    if isinstance(v, int):
        return {"t": "int", "v": v if abs(v) < 2 ** 53 else str(v)}
    if isinstance(v, float):
        return {"t": "float", "v": repr(v)}
    if isinstance(v, str):
        return {"t": "str", "v": v[:300], "n": len(v)}
    if isinstance(v, (list, tuple)):
        elements = [_ser(x, "%s[%d]" % (chemin, i), vus, profondeur + 1) for i, x in enumerate(v[:60])]
        return {"t": type(v).__name__, "v": elements, "n": len(v)}
    if isinstance(v, dict):
        paires = []
        for i, (k, x) in enumerate(v.items()):
            if i >= 60:
                break
            paires.append([_ser(k, chemin, {}, profondeur + 1), _ser(x, "%s[%s]" % (chemin, montre(k, 30)), vus, profondeur + 1)])
        return {"t": "dict", "v": paires, "n": len(v)}
    if isinstance(v, set):
        return {"t": "set", "v": [_ser(x, chemin, {}, profondeur + 1) for x in list(v)[:60]], "n": len(v)}
    if isinstance(v, types.FunctionType):
        try:
            import inspect
            sig = str(inspect.signature(v))
        except Exception:
            sig = "(...)"
        return {"t": "func", "v": v.__name__ + sig}
    return {"t": "autre", "v": montre(v, 80), "type": type(v).__name__}


def variables_visibles(ns, noms_dossier=()):
    vus = {}
    resultat = []
    ordre = [n for n in noms_dossier if n in ns] + [n for n in ns if n not in noms_dossier]
    for nom in ordre:
        if nom.startswith("_") or nom in ("__builtins__",):
            continue
        v = ns[nom]
        if isinstance(v, types.ModuleType) or isinstance(v, type):
            continue
        if isinstance(v, types.BuiltinFunctionType):
            continue
        resultat.append({"nom": nom, "val": _ser(v, nom, vus), "dossier": nom in noms_dossier})
        if len(resultat) >= 40:
            break
    return resultat


# --------------------------------------------------------------------------
#  Traduction des erreurs
# --------------------------------------------------------------------------
TITRES = {
    "SyntaxError": "Erreur de syntaxe",
    "IndentationError": "Erreur d'indentation (décalage)",
    "TabError": "Erreur d'indentation (tabulations)",
    "NameError": "Nom inconnu",
    "UnboundLocalError": "Variable pas encore définie",
    "KeyError": "Clé introuvable",
    "IndexError": "Indice en dehors de la liste",
    "TypeError": "Erreur de type",
    "AttributeError": "Méthode inconnue",
    "ValueError": "Valeur incorrecte",
    "ZeroDivisionError": "Division par zéro",
    "RecursionError": "Trop d'appels de fonction",
    "TropAffichage": "Beaucoup trop d'affichages",
    "RuntimeError": "Instruction non autorisée",
    "SystemExit": "Instruction non autorisée",
    "AssertionError": "Assertion fausse",
    "TempsDepasse": "Programme trop long",
}


def _noms_dans(ligne):
    return re.findall(r"[A-Za-z_À-ÿ][\w]*", ligne or "")


def _proches(mot, candidats, n=1, seuil=0.72):
    candidats = [c for c in candidats if isinstance(c, str)]
    return difflib.get_close_matches(mot, candidats, n=n, cutoff=seuil)


def _env_erreur(exc, ns):
    """Variables visibles au moment de l'erreur (globales + locales de la fonction de l'élève)."""
    env = dict(ns)
    tb = exc.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == FICHIER_ELEVE:
            env.update(tb.tb_frame.f_locals)
        tb = tb.tb_next
    return env


def _ligne_erreur(exc):
    """Numéro de ligne dans le code de l'élève (la plus profonde)."""
    if isinstance(exc, SyntaxError):
        if exc.filename == FICHIER_ELEVE:
            return exc.lineno, exc.offset
        return None, None
    ligne = None
    tb = exc.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == FICHIER_ELEVE:
            ligne = tb.tb_lineno
        tb = tb.tb_next
    return ligne, None


def _expliquer_syntaxe(exc, texte):
    msg = exc.msg or ""
    t = (texte or "").strip()
    if isinstance(exc, IndentationError) or isinstance(exc, TabError):
        if "expected an indented block" in msg:
            m = re.search(r"after '(\w+)' statement on line (\d+)", msg)
            quoi = (" après le `%s` de la ligne %s" % (m.group(1), m.group(2))) if m else ""
            return ("Il manque un bloc décalé%s. Après une ligne qui se termine par `:`, les lignes suivantes "
                    "doivent être décalées vers la droite (4 espaces ou la touche Tab)." % quoi)
        if "unexpected indent" in msg:
            return ("Cette ligne est décalée vers la droite alors qu'elle ne devrait pas l'être. "
                    "Aligne-la avec les lignes du même bloc.")
        if "unindent does not match" in msg:
            return ("Le décalage de cette ligne ne correspond à aucun bloc. Aligne-la exactement sous le `if`, "
                    "le `for` ou le `def` auquel elle appartient (même nombre d'espaces).")
        if "inconsistent use of tabs" in msg or isinstance(exc, TabError):
            return "Tu as mélangé des tabulations et des espaces. Réindente ces lignes avec la touche Tab uniquement."
        return "Le décalage (indentation) des lignes n'est pas cohérent. Vérifie que chaque bloc est bien aligné."
    if "expected ':'" in msg:
        return ("Il manque les deux-points `:` à la fin de la ligne. Après `if`, `elif`, `else`, `for`, `while` "
                "et `def`, la ligne se termine toujours par `:`.")
    if "Maybe you meant '==' or ':=' instead of '='" in msg or "Maybe you meant '==' instead of '='" in msg:
        return ("Pour comparer deux valeurs, on écrit `==` (deux signes égal). Un seul `=` sert à ranger une "
                "valeur dans une variable.")
    if "Missing parentheses in call to 'print'" in msg:
        return "`print` a besoin de parenthèses : on écrit `print(...)`."
    m = re.search(r"'(.)' was never closed", msg)
    if m:
        ferme = {"(": ")", "[": "]", "{": "}"}.get(m.group(1), "?")
        return ("Un `%s` est ouvert mais jamais fermé. Ajoute le `%s` qui manque (sur cette ligne ou à la fin de "
                "l'instruction)." % (m.group(1), ferme))
    m = re.search(r"unmatched '(.)'", msg)
    if m:
        return "Il y a un `%s` en trop, ou bien son partenaire d'ouverture manque." % m.group(1)
    m = re.search(r"closing parenthesis '(.)' does not match opening parenthesis '(.)'", msg)
    if m:
        return ("Tu fermes avec `%s` alors que tu avais ouvert avec `%s`. Les paires vont ensemble : `( )`, `[ ]`, `{ }`."
                % (m.group(1), m.group(2)))
    if "unterminated string literal" in msg or "EOL while scanning" in msg:
        return "Un texte n'est pas refermé : il manque un guillemet à la fin. Un texte s'écrit entre deux guillemets : \"comme ceci\"."
    if "unterminated triple-quoted string" in msg:
        return "Un texte commencé avec trois guillemets `\"\"\"` n'est jamais refermé."
    m = re.search(r"invalid character '(.)'", msg)
    if m:
        c = m.group(1)
        if c in "«»“”’‘":
            return ("Le caractère `%s` est interdit dans le code. Utilise les guillemets droits `\"` ou l'apostrophe "
                    "droite `'` (attention aux copier-coller depuis un document)." % c)
        return "Le caractère `%s` n'est pas autorisé dans le code Python à cet endroit." % c
    if "invalid non-printable character" in msg:
        return "Un caractère invisible s'est glissé dans la ligne (souvent après un copier-coller). Réécris la ligne à la main."
    if "invalid decimal literal" in msg or "invalid digit" in msg:
        return ("Python lit un nombre collé à des lettres. Un nom de variable ne commence jamais par un chiffre, "
                "et un texte comme `22h30` doit être entre guillemets : `\"22h30\"`.")
    if "Perhaps you forgot a comma" in msg:
        return "Il manque sûrement une virgule entre deux éléments (dans une liste, un dictionnaire ou un appel de fonction)."
    if "'return' outside function" in msg:
        return "`return` ne s'utilise qu'à l'intérieur d'une fonction (dans le bloc décalé sous `def`). Vérifie l'indentation."
    if "cannot assign to function call" in msg:
        return "À gauche du `=`, il faut un nom de variable (ou `liste[i]`, `dico[cle]`), pas un appel de fonction."
    if "cannot assign to literal" in msg or "cannot assign to expression" in msg:
        return "À gauche du `=`, il faut un nom de variable. Pour comparer, c'est `==`."
    if "f-string" in msg:
        return "Problème dans une f-string : vérifie les accolades `{ }` et les guillemets."
    if "positional argument follows keyword argument" in msg:
        return "Dans un appel de fonction, les paramètres nommés (`ordre=...`) se mettent après les autres."
    if "expected 'in'" in msg:
        return "Dans une boucle, il faut le mot `in` : `for element in liste:`."
    if re.search(r"\belse\s+if\b", t):
        return "En Python, « sinon si » s'écrit `elif` (et pas `else if`)."
    if re.search(r"=<|=>", t):
        return "Les comparaisons s'écrivent `<=` (inférieur ou égal) et `>=` (supérieur ou égal)."
    if re.match(r"(if|elif|while|for|def)\b", t) and not t.endswith(":"):
        return "Cette ligne doit se terminer par deux-points `:`."
    if re.match(r"else\b", t) and t != "else:":
        return "`else` s'écrit seul, suivi de deux-points : `else:` (pas de condition après `else`)."
    if "___" in t:
        return "Il reste un trou `___` à compléter sur cette ligne."
    return ("Python ne comprend pas cette ligne. Vérifie les deux-points `:`, les parenthèses, les guillemets "
            "et les virgules (l'erreur peut aussi venir de la ligne d'avant).")


def _expliquer_name(exc, env, texte):
    nom = getattr(exc, "name", None)
    if not nom:
        m = re.search(r"name '(\w+)' is not defined", str(exc))
        nom = m.group(1) if m else "?"
    if nom == "___":
        return "Il reste un trou `___` à compléter."
    if nom.lower() in ("true", "false", "none", "vrai", "faux"):
        bon = {"true": "True", "vrai": "True", "false": "False", "faux": "False", "none": "None"}[nom.lower()]
        return "Python ne connaît pas `%s`. En Python, on écrit `%s` (avec une majuscule)." % (nom, bon)
    # Est-ce une clé d'un dictionnaire ou une valeur de liste écrite sans guillemets ?
    for v in env.values():
        if isinstance(v, dict) and nom in [k for k in v.keys() if isinstance(k, str)]:
            return ("Python ne connaît pas de variable `%s`. Si c'est une clé de dictionnaire (un texte), il faut des "
                    "guillemets : `\"%s\"`." % (nom, nom))
        if isinstance(v, (list, tuple)) and nom in [x for x in v if isinstance(x, str)]:
            return ("Python ne connaît pas de variable `%s`. Si c'est un texte, il faut l'écrire entre guillemets : "
                    "`\"%s\"`." % (nom, nom))
    candidats = [n for n in env if not n.startswith("_")] + [n for n in dir(builtins) if not n.startswith("_")]
    proche = _proches(nom, candidats)
    if not proche:
        proche = [c for c in candidats if c.lower() == nom.lower()]
    message = "Python ne connaît pas `%s` : cette variable (ou fonction) n'a jamais été définie." % nom
    if proche:
        message += " Voulais-tu écrire `%s` ? Attention aux fautes de frappe et aux majuscules." % proche[0]
    else:
        message += (" Vérifie l'orthographe. Si c'est un texte, mets-le entre guillemets. Si c'est une variable, "
                    "elle doit recevoir une valeur (avec `=`) avant d'être utilisée.")
    return message


def _expliquer_key(exc, env, texte):
    cle = exc.args[0] if exc.args else None
    message = "La clé `%s` n'existe pas dans le dictionnaire." % montre(cle)
    noms = _noms_dans(texte)
    dicos = [(n, env[n]) for n in noms if n in env and isinstance(env[n], dict)]
    if not dicos:
        dicos = [(n, v) for n, v in env.items() if isinstance(v, dict) and not n.startswith("_")]
    for nom, d in dicos:
        cles = list(d.keys())
        if isinstance(cle, int) and cles and all(isinstance(k, str) for k in cles):
            return (message + " Un dictionnaire n'a pas d'indices numériques : on lit une valeur avec sa clé, "
                    "par exemple `%s[%s]`." % (nom, montre(cles[0])))
        if isinstance(cle, str):
            pareil = [k for k in cles if isinstance(k, str) and k.lower() == cle.lower()]
            if pareil:
                return message + " Attention aux majuscules : dans `%s`, la clé s'écrit `%s`." % (nom, montre(pareil[0]))
            sans_accent = lambda s: s.lower().translate(str.maketrans("éèêëàâäîïôöùûüç", "eeeeaaaiioouuuc"))
            pareil = [k for k in cles if isinstance(k, str) and sans_accent(k) == sans_accent(cle)]
            if pareil:
                return message + " Attention aux accents : dans `%s`, la clé s'écrit `%s`." % (nom, montre(pareil[0]))
            proche = _proches(cle, cles, seuil=0.6)
            if proche:
                return message + " Voulais-tu écrire `%s` ?" % montre(proche[0])
    if dicos and len(dicos) == 1:
        nom, d = dicos[0]
        message += " Les clés de `%s` sont : %s." % (nom, ", ".join(montre(k) for k in list(d.keys())[:8]))
    message += (" Pour lire une clé qui n'existe peut-être pas sans planter : `.get(cle, valeur_par_defaut)`, "
                "ou teste d'abord avec `if cle in dico:`.")
    return message


def _expliquer_index(exc, env, texte):
    msg = str(exc)
    if "pop from empty list" in msg:
        return "Tu fais `pop()` sur une liste vide : il n'y a plus rien à retirer."
    if "pop index out of range" in msg:
        return "L'indice donné à `pop()` n'existe pas dans la liste. Les indices vont de 0 à len(liste) - 1."
    message = "Tu demandes un indice qui n'existe pas."
    if "string index" in msg:
        message = "Tu demandes une lettre à une position qui n'existe pas dans ce texte."
    infos = []
    for n in _noms_dans(texte):
        v = env.get(n)
        if isinstance(v, (list, tuple, str)) and n not in [i[0] for i in infos]:
            infos.append((n, len(v)))
    for n, longueur in infos[:2]:
        if longueur == 0:
            message += " `%s` est vide : elle n'a aucun indice valable." % n
        else:
            message += (" `%s` contient %d élément%s : ses indices vont de 0 à %d (ou de -%d à -1)."
                        % (n, longueur, "s" if longueur > 1 else "", longueur - 1, longueur))
    if re.search(r"\+\s*1\s*\]", texte or ""):
        message += (" Attention à `i + 1` : quand `i` est le dernier indice, `i + 1` sort de la liste. "
                    "Arrête la boucle un tour plus tôt : `range(len(liste) - 1)`.")
    elif re.search(r"\[\s*len\(", texte or ""):
        message += " `liste[len(liste)]` sort toujours de la liste : le dernier indice est `len(liste) - 1`."
    else:
        message += " Rappel : le premier élément a l'indice 0, le dernier l'indice -1."
    return message


def _expliquer_type(exc, env, texte):
    msg = str(exc)
    m = re.search(r'can only concatenate str \(not "(\w+)"\) to str', msg)
    if m:
        return ("Tu colles un texte et un %s avec `+`. On ne peut coller que des textes ensemble : convertis avec "
                "`str(...)`, ou utilise une virgule dans `print`, ou une f-string `f\"... {valeur}\"`." % _fr(m.group(1)))
    m = re.search(r"unsupported operand type\(s\) for ([^:]+): '(\w+)' and '(\w+)'", msg)
    if m:
        op, a, b = m.groups()
        if "NoneType" in (a, b):
            return ("Une des valeurs vaut `None` (rien). Souvent, c'est une fonction qui a oublié son `return`, "
                    "ou une variable remplie avec le résultat de `.append()` (qui renvoie `None`).")
        return "On ne peut pas faire `%s` entre un %s et un %s." % (op.strip(), _fr(a), _fr(b))
    m = re.search(r"'(\w+)' object is not subscriptable", msg)
    if m:
        t = m.group(1)
        if t in ("builtin_function_or_method", "function", "method"):
            return ("Tu as mis des crochets `[ ]` après une fonction ou une méthode. Pour l'appeler, il faut des "
                    "parenthèses : `len(liste)`, `dico.items()`, etc.")
        if t == "NoneType":
            return ("Tu utilises `[ ]` sur `None`. Souvent, une fonction a oublié son `return`, ou une variable "
                    "a reçu le résultat de `.append()` (qui renvoie `None`).")
        return "Un %s ne se lit pas avec des crochets `[ ]` : ce n'est ni une liste, ni un dictionnaire, ni un texte." % _fr(t)
    m = re.search(r"(list|tuple) indices must be integers or slices, not (\w+)", msg)
    if m:
        if m.group(2) == "str":
            return ("Les indices d'une %s sont des nombres (0, 1, 2…), pas des textes. Si tu veux chercher par un nom, "
                    "c'est le rôle d'un dictionnaire. Dans une boucle `for x in liste:`, `x` est déjà l'élément : "
                    "pas besoin de `liste[x]`." % _fr(m.group(1)))
        return "Les indices d'une %s doivent être des nombres entiers, pas un %s." % (_fr(m.group(1)), _fr(m.group(2)))
    m = re.search(r"'(\w+)' object does not support item assignment", msg)
    if m:
        if m.group(1) == "tuple":
            return ("Un tuple ne peut pas être modifié (il est immuable). Pour changer une valeur, il faut "
                    "construire un nouveau tuple et le ranger à la place : `t = (a, b)`.")
        if m.group(1) == "str":
            return "Un texte (str) ne peut pas être modifié lettre par lettre : il faut construire un nouveau texte."
        return "On ne peut pas modifier un élément d'un %s avec `[ ] =`." % _fr(m.group(1))
    m = re.search(r"unhashable type: '(\w+)'", msg)
    if m:
        return ("Une clé de dictionnaire ne peut pas être une %s (c'est modifiable). Utilise un texte, un nombre "
                "ou un tuple comme clé." % _fr(m.group(1)))
    m = re.search(r"'(\w+)' object is not callable", msg)
    if m:
        t = m.group(1)
        if t in ("dict", "list", "tuple", "str"):
            return ("Tu as mis des parenthèses `( )` après un %s, comme si c'était une fonction. Pour lire un élément, "
                    "on utilise des crochets : `variable[...]`." % _fr(t))
        return ("Tu appelles avec `( )` quelque chose qui n'est pas une fonction (un %s). Vérifie que tu n'as pas "
                "donné à une variable le même nom qu'une fonction (`len`, `max`, `list`…)." % _fr(t))
    m = re.search(r"object of type '(\w+)' has no len\(\)", msg)
    if m:
        return "`len()` compte les éléments d'une liste, d'un dictionnaire ou d'un texte, pas d'un %s." % _fr(m.group(1))
    m = re.search(r"(\w+)\(\) missing (\d+) required positional argument", msg)
    if m:
        return ("La fonction `%s` attend plus de paramètres que ceux que tu lui donnes. Regarde sa ligne `def` "
                "pour savoir combien il en faut." % m.group(1))
    m = re.search(r"(\w+)\(\) takes (\d+) positional arguments? but (\d+) (?:were|was) given", msg)
    if m:
        return ("La fonction `%s` attend %s paramètre(s), mais tu lui en donnes %s." % m.groups())
    m = re.search(r"'([<>]=?)' not supported between instances of '(\w+)' and '(\w+)'", msg)
    if m:
        op, a, b = m.groups()
        if "NoneType" in (a, b):
            return "Tu compares avec `None` (rien). Vérifie qu'une fonction n'a pas oublié son `return`."
        message = "Python ne sait pas comparer un %s et un %s avec `%s`." % (_fr(a), _fr(b), op)
        if "str" in (a, b) and ("int" in (a, b) or "float" in (a, b)):
            message += (" Peut-être compares-tu une ligne de titres (des textes) avec des nombres : pense à ne pas "
                        "prendre l'en-tête du tableau.")
        return message
    if "cannot unpack non-iterable" in msg:
        return ("Tu essaies de découper une seule valeur en plusieurs variables (`a, b = ...`). Il faut que la "
                "valeur à droite contienne plusieurs éléments (un tuple ou une liste).")
    m = re.search(r"(list|dict)\.(\w+)\(\) takes (?:exactly|no|at most) ", msg)
    if m:
        return "La méthode `.%s()` ne prend pas ce nombre de paramètres. Regarde le mémo pour son utilisation." % m.group(2)
    if "cannot be interpreted as an integer" in msg:
        return ("Un indice (ou le nombre de tours de `range`) doit être un nombre entier. Avec `insert`, l'indice "
                "vient en premier : `liste.insert(indice, element)`.")
    if "argument of type" in msg and "is not iterable" in msg:
        return "`in` ne marche qu'avec une liste, un dictionnaire, un tuple ou un texte."
    m = re.search(r"'(\w+)' object is not iterable", msg)
    if m:
        t = m.group(1)
        if t == "int":
            return ("On ne peut pas parcourir un nombre avec `for`. Pour répéter n fois, écris `for i in range(n):`, "
                    "et pour parcourir une liste : `for element in liste:`.")
        return "On ne peut pas parcourir un %s avec `for`." % _fr(t)
    return "Les valeurs utilisées n'ont pas le bon type pour cette opération."


METHODES_LISTE = ["append", "insert", "extend", "pop", "remove", "index", "count", "copy", "sort", "reverse", "clear"]
METHODES_DICO = ["get", "keys", "values", "items", "pop", "copy", "update", "clear"]


def _expliquer_attribut(exc, env, texte):
    msg = str(exc)
    m = re.search(r"'(\w+)' object has no attribute '(\w+)'", msg)
    if not m:
        return "Cette méthode n'existe pas pour ce type de valeur."
    t, attr = m.groups()
    if t == "list":
        if attr in ("add", "push", "ajouter", "ajoute"):
            return "Les listes n'ont pas de méthode `%s`. Pour ajouter un élément à la fin : `liste.append(element)`." % attr
        if attr in ("get", "items", "keys", "values"):
            return "`.%s()` est une méthode de dictionnaire, mais ta variable est une liste." % attr
        if attr in ("len", "length", "size"):
            return "Pour connaître le nombre d'éléments d'une liste, on écrit `len(liste)`."
        proche = _proches(attr, METHODES_LISTE, seuil=0.6)
        return "Les listes n'ont pas de méthode `%s`.%s Méthodes utiles : %s." % (
            attr, (" Voulais-tu dire `%s` ?" % proche[0]) if proche else "", ", ".join("`." + x + "()`" for x in METHODES_LISTE[:6]))
    if t == "dict":
        if attr in ("append", "add", "push", "insert"):
            return ("Un dictionnaire n'a pas de méthode `%s`. Pour ajouter une paire, on écrit simplement : "
                    "`dico[cle] = valeur`." % attr)
        for nom, v in env.items():
            if isinstance(v, dict) and attr in v:
                return ("Pour lire la valeur de la clé `\"%s\"`, on écrit `%s[\"%s\"]` (crochets et guillemets), "
                        "pas `%s.%s`." % (attr, nom, attr, nom, attr))
        if attr in ("len", "length", "size"):
            return "Pour connaître le nombre de paires d'un dictionnaire, on écrit `len(dico)`."
        proche = _proches(attr, METHODES_DICO, seuil=0.6)
        return "Les dictionnaires n'ont pas de méthode `%s`.%s Méthodes utiles : %s." % (
            attr, (" Voulais-tu dire `%s` ?" % proche[0]) if proche else "", ", ".join("`." + x + "()`" for x in METHODES_DICO[:5]))
    if t == "NoneType":
        return ("Ta variable vaut `None`. Piège classique : `liste = liste.append(x)` remplace la liste par `None`, "
                "car `append` modifie la liste directement et ne renvoie rien. Écris juste `liste.append(x)`.")
    if t == "tuple":
        return "Un tuple ne peut pas être modifié : il n'a pas de méthode `%s`. Si tu dois le modifier, utilise une liste." % attr
    if t == "str":
        if attr in ("append", "pop", "insert", "extend"):
            return "Ta variable contient un texte, pas une liste : `.%s()` n'existe pas pour les textes." % attr
        return "Les textes (str) n'ont pas de méthode `%s`." % attr
    if t == "int" or t == "float":
        return "Ta variable contient un nombre : il n'a pas de méthode `%s`." % attr
    return "Le type %s n'a pas de méthode ou d'attribut `%s`." % (_fr(t), attr)


def _expliquer_valeur(exc, env, texte):
    msg = str(exc)
    if "too many values to unpack" in msg or "not enough values to unpack" in msg:
        if re.search(r"\bfor\b.*,.*\bin\b", texte or "") and ".items()" not in (texte or ""):
            noms = _noms_dans(texte.split(" in ", 1)[-1]) if " in " in (texte or "") else []
            if any(isinstance(env.get(n), dict) for n in noms):
                return ("Pour récupérer à la fois la clé et la valeur d'un dictionnaire dans une boucle, il faut "
                        "`.items()` : `for cle, valeur in dico.items():`.")
        m = re.search(r"expected (\d+)", msg)
        return ("Le nombre de variables à gauche ne correspond pas au nombre de valeurs à droite%s."
                % ((" (il en faut %s)" % m.group(1)) if m else ""))
    if "list.remove(x): x not in list" in msg:
        return "`remove(x)` ne trouve pas `x` dans la liste. Vérifie l'orthographe exacte de l'élément."
    if "is not in list" in msg:
        return "`.index(x)` ne trouve pas `x` dans la liste."
    if "invalid literal for int()" in msg:
        return "`int()` ne peut convertir en nombre qu'un texte qui ne contient que des chiffres."
    if "max() iterable argument is empty" in msg or "min() iterable argument is empty" in msg or "arg is an empty sequence" in msg:
        return "On ne peut pas chercher le maximum ou le minimum d'une liste vide."
    return "Une valeur ne convient pas à cette opération."


def traduire_erreur(exc, ns, lignes_code):
    nom_type = type(exc).__name__
    ligne, col = _ligne_erreur(exc)
    texte = ""
    if ligne and 1 <= ligne <= len(lignes_code):
        texte = lignes_code[ligne - 1]
    elif isinstance(exc, SyntaxError) and exc.text:
        texte = exc.text.rstrip("\n")
    env = _env_erreur(exc, ns) if not isinstance(exc, SyntaxError) else dict(ns)
    try:
        if isinstance(exc, SyntaxError):
            explication = _expliquer_syntaxe(exc, texte)
            brut = "%s: %s" % (nom_type, exc.msg)
        else:
            brut = "%s: %s" % (nom_type, str(exc)) if str(exc) else nom_type
            if isinstance(exc, TempsDepasse):
                explication = ("Ton programme ne s'arrête pas. As-tu écrit une boucle qui ne finit jamais (un `while` "
                               "dont la condition reste vraie, ou une liste qui grandit pendant qu'on la parcourt) ?")
                brut = "Programme arrêté : il tournait depuis trop longtemps"
            elif isinstance(exc, TropAffichage):
                explication = ("Ton programme affiche énormément de texte : as-tu fait une boucle qui ne s'arrête "
                               "jamais, ou un `print` dans une boucle de trop ?")
                brut = "Affichage interrompu"
            elif isinstance(exc, UnboundLocalError):
                explication = ("Dans ta fonction, une variable est utilisée avant d'avoir reçu une valeur. "
                               "Donne-lui une valeur de départ au début de la fonction.")
            elif isinstance(exc, NameError):
                explication = _expliquer_name(exc, env, texte)
            elif isinstance(exc, KeyError):
                explication = _expliquer_key(exc, env, texte)
            elif isinstance(exc, IndexError):
                explication = _expliquer_index(exc, env, texte)
            elif isinstance(exc, TypeError):
                explication = _expliquer_type(exc, env, texte)
            elif isinstance(exc, AttributeError):
                explication = _expliquer_attribut(exc, env, texte)
            elif isinstance(exc, ValueError):
                explication = _expliquer_valeur(exc, env, texte)
            elif isinstance(exc, ZeroDivisionError):
                explication = "Tu divises par zéro : c'est impossible. Vérifie que le diviseur n'est pas nul (une liste vide ?)."
            elif isinstance(exc, RecursionError):
                explication = "Ta fonction s'appelle elle-même sans fin."
            elif isinstance(exc, (RuntimeError, SystemExit)):
                explication = str(exc) or "Cette instruction n'est pas autorisée ici."
            elif isinstance(exc, AssertionError):
                explication = "Un `assert` a trouvé une condition fausse."
            else:
                explication = "Python s'est arrêté sur une erreur."
    except Exception as e2:  # la traduction ne doit jamais faire planter le moteur
        explication = "Python s'est arrêté sur une erreur."
        brut = "%s: %s" % (nom_type, exc)
    return {
        "type": nom_type,
        "titre": TITRES.get(nom_type, nom_type),
        "explication": explication,
        "ligne": ligne,
        "colonne": col,
        "texte_ligne": texte.strip() if texte else "",
        "brut": brut,
    }


# --------------------------------------------------------------------------
#  Outils mis à disposition des vérificateurs de missions
# --------------------------------------------------------------------------
def _outils_verif(ns, dossier_frais, sortie, code, lignes_code):
    code_sc = _sans_commentaires(code)
    code_ss = _sans_textes(code)
    lignes = [l.strip() for l in sortie.splitlines() if l.strip()]
    etat = {"message": None}

    def echec(message):
        raise Echec(message)

    def verifie(condition, message):
        if not condition:
            raise Echec(message)

    def succes(message):
        etat["message"] = message

    def var(nom, type_attendu=None):
        if nom not in ns:
            proche = _proches(nom, [n for n in ns if not n.startswith("_")])
            raise Echec("La variable `%s` n'existe pas.%s" % (
                nom, (" Tu as écrit `%s` : vérifie l'orthographe." % proche[0]) if proche else
                " Crée-la avec `%s = ...`." % nom))
        v = ns[nom]
        if type_attendu is not None and not isinstance(v, type_attendu):
            if isinstance(type_attendu, tuple):
                attendu = " ou ".join(_nom_type(t()) for t in type_attendu)
            else:
                attendu = _nom_type(type_attendu())
            raise Echec("`%s` devrait être %s, mais c'est %s : %s." % (nom, attendu, _nom_type(v), montre(v)))
        return v

    def fonction(nom):
        if nom not in ns:
            proche = _proches(nom, [n for n in ns if not n.startswith("_")])
            raise Echec("La fonction `%s` n'existe pas.%s" % (
                nom, (" Tu as défini `%s` : vérifie le nom exact." % proche[0]) if proche else
                " Elle se définit avec `def %s(...):`." % nom))
        f = ns[nom]
        if not callable(f):
            raise Echec("`%s` devrait être une fonction (définie avec `def`), mais c'est %s." % (nom, _nom_type(f)))
        return f

    def appel(f, *args, **kwargs):
        """Appelle la fonction de l'élève sur une copie des paramètres ; renvoie le résultat."""
        if isinstance(f, str):
            f = fonction(f)
        args_copie = copy.deepcopy(args)
        kwargs_copie = copy.deepcopy(kwargs)
        return appel_direct(f, *args_copie, **kwargs_copie)

    def appel_direct(f, *args, **kwargs):
        """Comme appel(), mais sans copier les paramètres (pour tester les modifications en place)."""
        if isinstance(f, str):
            f = fonction(f)
        ancien = sys.stdout
        sys.stdout = SortieLimitee()
        try:
            return f(*args, **kwargs)
        except Echec:
            raise
        except Exception as e:
            texte_appel = "%s(%s)" % (getattr(f, "__name__", "fonction"), ", ".join(
                [montre(a, 60) for a in args] + ["%s=%s" % (k, montre(v, 40)) for k, v in kwargs.items()]))
            info = traduire_erreur(e, ns, lignes_code)
            info["appel"] = texte_appel
            raise ErreurDansFonction(info)
        finally:
            sys.stdout = ancien

    def utilise(motif):
        """True si le code (sans commentaires ni textes) contient le motif (expression régulière)."""
        return re.search(motif, code_ss) is not None

    def norm(texte):
        return re.sub(r"\s+", " ", str(texte)).strip()

    def compact(texte):
        return re.sub(r"\s+", "", str(texte)).lower()

    return {
        "echec": echec, "verifie": verifie, "succes": succes, "var": var, "fonction": fonction,
        "appel": appel, "appel_direct": appel_direct, "utilise": utilise, "norm": norm, "compact": compact,
        "montre": montre, "nom_type": _nom_type,
        "D": dossier_frais, "ns": ns, "sortie": sortie, "lignes": lignes, "code": code,
        "code_sc": code_sc, "code_ss": code_ss, "re": re, "copy": copy, "Echec": Echec,
    }, etat


# --------------------------------------------------------------------------
#  Exécution principale
# --------------------------------------------------------------------------
def _executer_dossier(setup):
    ns = {"__name__": "__main__", "__builtins__": _builtins_eleve()}
    if setup:
        exec(compile(setup, FICHIER_DOSSIER, "exec"), ns)
    return ns


def executer(setup="", code="", check="", avec_variables=True):
    resultat = {"phase": "ok", "sortie": "", "erreur": None, "reussi": None, "message": None,
                "variables": [], "interne": None}
    lignes_code = code.split("\n")

    # 0) Il reste des trous ___ à compléter ?
    trous = [i + 1 for i, l in enumerate(_sans_commentaires(code).split("\n"))
             if re.search(r"(?<![A-Za-z0-9_])___(?![A-Za-z0-9_])", l)]
    if trous:
        resultat["phase"] = "trous"
        resultat["reussi"] = False
        resultat["message"] = "Il reste des trous @___@ à compléter (ligne%s %s)." % (
            "s" if len(trous) > 1 else "", ", ".join(str(t) for t in trous))
        resultat["lignes_trous"] = trous
        return resultat

    # 1) Le dossier (données de la mission)
    try:
        ns = _executer_dossier(setup)
    except Exception as e:
        resultat["phase"] = "interne"
        resultat["interne"] = "Erreur dans le dossier de la mission : %s: %s" % (type(e).__name__, e)
        return resultat
    noms_dossier = [n for n in ns if not n.startswith("_")]

    # 2) Le code de l'élève
    sortie = SortieLimitee()
    ancien = sys.stdout
    sys.stdout = sortie
    erreur = None
    try:
        objet = compile(code, FICHIER_ELEVE, "exec")
        exec(objet, ns)
    except SyntaxError as e:
        erreur = e
        resultat["phase"] = "syntaxe"
    except BaseException as e:   # y compris SystemExit et KeyboardInterrupt
        erreur = e
        resultat["phase"] = "execution"
    finally:
        sys.stdout = ancien
    resultat["sortie"] = sortie.getvalue()
    if erreur is not None:
        resultat["erreur"] = traduire_erreur(erreur, ns, lignes_code)
        resultat["reussi"] = False
    if avec_variables:
        try:
            resultat["variables"] = variables_visibles(ns, noms_dossier)
        except Exception:
            resultat["variables"] = []
    if erreur is not None or not check:
        return resultat

    # 3) Le vérificateur
    try:
        frais = _executer_dossier(setup)
    except Exception:
        frais = {}
    outils, etat = _outils_verif(ns, frais, resultat["sortie"], code, lignes_code)
    cns = dict(outils)
    cns["__builtins__"] = builtins
    ancien = sys.stdout
    sys.stdout = io.StringIO()
    try:
        exec(compile(check, FICHIER_VERIF, "exec"), cns)
        resultat["reussi"] = True
        resultat["message"] = etat["message"]
    except Echec as e:
        resultat["reussi"] = False
        resultat["phase"] = "verification"
        resultat["message"] = str(e)
    except ErreurDansFonction as e:
        resultat["reussi"] = False
        resultat["phase"] = "fonction"
        resultat["erreur"] = e.info
        resultat["message"] = "Ta fonction a planté pendant le test `%s`." % e.info.get("appel", "")
    except TropAffichage:
        resultat["reussi"] = False
        resultat["phase"] = "verification"
        resultat["message"] = "Ta fonction affiche beaucoup trop de texte pendant les tests (boucle infinie ?)."
    except TempsDepasse:
        resultat["reussi"] = False
        resultat["phase"] = "verification"
        resultat["message"] = "Ta fonction ne s'arrête pas pendant les tests : y a-t-il une boucle qui ne finit jamais ?"
    except Exception as e:
        resultat["reussi"] = False
        resultat["phase"] = "interne"
        resultat["interne"] = "%s: %s" % (type(e).__name__, e)
        resultat["message"] = ("Le vérificateur n'a pas pu tester ton code (une valeur a un format inattendu). "
                               "Relis la consigne : nom des variables, type des valeurs renvoyées…")
    finally:
        sys.stdout = ancien
    return resultat


def _executer_silencieux(code, ns):
    """Rejoue une commande déjà validée (console) sans afficher ni signaler d'erreur."""
    ancien = sys.stdout
    sys.stdout = SortieLimitee()
    try:
        try:
            exec(compile(code, "<historique>", "eval"), ns)
        except SyntaxError:
            exec(compile(code, "<historique>", "exec"), ns)
    except BaseException:
        pass
    finally:
        sys.stdout = ancien


def executer_commande(setup="", historique=(), commande="", check=""):
    """
    Console de commandes (une seule ligne, comme l'invite >>> de Python).
    Si la commande est une expression, sa valeur est renvoyée (et affichée comme dans la console).
    """
    resultat = {"phase": "ok", "sortie": "", "erreur": None, "reussi": None, "message": None,
                "expression": False, "repr": None, "valeur": None, "interne": None}
    try:
        ns = _executer_dossier(setup)
    except Exception as e:
        resultat["phase"] = "interne"
        resultat["interne"] = "Erreur dans le dossier : %s" % e
        return resultat
    for h in historique or []:
        _executer_silencieux(h, ns)
    texte = (commande or "").strip()
    if not texte:
        resultat["phase"] = "vide"
        resultat["reussi"] = False
        resultat["message"] = "Tape une commande Python, puis appuie sur Entrée."
        return resultat
    if re.search(r"(?<![A-Za-z0-9_])___(?![A-Za-z0-9_])", texte):
        resultat["phase"] = "trous"
        resultat["reussi"] = False
        resultat["message"] = "Remplace les @___@ par du code avant de valider."
        return resultat
    est_expression = True
    try:
        objet = compile(texte, FICHIER_ELEVE, "eval")
    except SyntaxError:
        est_expression = False
        try:
            objet = compile(texte, FICHIER_ELEVE, "exec")
        except SyntaxError as e:
            resultat["phase"] = "syntaxe"
            resultat["reussi"] = False
            resultat["erreur"] = traduire_erreur(e, ns, [texte])
            return resultat
    resultat["expression"] = est_expression
    sortie = SortieLimitee()
    ancien = sys.stdout
    sys.stdout = sortie
    valeur = None
    try:
        if est_expression:
            valeur = eval(objet, ns)
        else:
            exec(objet, ns)
    except BaseException as e:
        sys.stdout = ancien
        resultat["sortie"] = sortie.getvalue()
        resultat["phase"] = "execution"
        resultat["reussi"] = False
        resultat["erreur"] = traduire_erreur(e, ns, [texte])
        return resultat
    finally:
        sys.stdout = ancien
    resultat["sortie"] = sortie.getvalue()
    if est_expression:
        resultat["repr"] = montre(valeur, 400)
        try:
            resultat["valeur"] = _ser(valeur, "resultat", {})
        except Exception:
            resultat["valeur"] = None
    if not check:
        resultat["reussi"] = True
        return resultat
    try:
        frais = _executer_dossier(setup)
    except Exception:
        frais = {}
    outils, etat = _outils_verif(ns, frais, resultat["sortie"], texte, [texte])
    cns = dict(outils)
    cns.update({"__builtins__": builtins, "resultat": valeur, "commande": texte,
                "est_expression": est_expression})
    ancien = sys.stdout
    sys.stdout = io.StringIO()
    try:
        exec(compile(check, FICHIER_VERIF, "exec"), cns)
        resultat["reussi"] = True
        resultat["message"] = etat["message"]
    except Echec as e:
        resultat["reussi"] = False
        resultat["phase"] = "verification"
        resultat["message"] = str(e)
    except Exception as e:
        resultat["reussi"] = False
        resultat["phase"] = "interne"
        resultat["interne"] = "%s: %s" % (type(e).__name__, e)
        resultat["message"] = "La commande a fonctionné, mais ce n'est pas celle demandée. Relis l'objectif."
    finally:
        sys.stdout = ancien
    return resultat


def variables_du_dossier(setup):
    try:
        ns = _executer_dossier(setup)
        noms = [n for n in ns if not n.startswith("_")]
        types_ = {}
        for n in noms:
            v = ns[n]
            types_[n] = type(v).__name__
        cles = {}
        for n in noms:
            if isinstance(ns[n], dict):
                cles[n] = [k for k in ns[n].keys() if isinstance(k, str)][:50]
        return {"ok": True, "variables": variables_visibles(ns, noms), "types": types_, "cles": cles}
    except Exception as e:
        return {"ok": False, "interne": "%s: %s" % (type(e).__name__, e)}


def executer_json(requete_json):
    """Point d'entrée appelé depuis JavaScript."""
    requete = json.loads(requete_json)
    action = requete.get("action")
    try:
        with Chrono(requete.get("limite_s")):
            if action == "dossier":
                reponse = variables_du_dossier(requete.get("setup", ""))
            elif action == "commande":
                reponse = executer_commande(requete.get("setup", ""), requete.get("historique", []),
                                            requete.get("commande", ""), requete.get("check", ""))
            else:
                reponse = executer(requete.get("setup", ""), requete.get("code", ""), requete.get("check", ""),
                                   requete.get("variables", True))
    except TempsDepasse:
        reponse = {"phase": "temps", "reussi": False, "sortie": "", "variables": [],
                   "erreur": {"type": "TempsDepasse", "titre": TITRES["TempsDepasse"], "ligne": None, "texte_ligne": "",
                              "explication": "Ton programme ne s'arrête pas. As-tu écrit une boucle qui ne finit jamais ?",
                              "brut": "Programme arrêté : il tournait depuis trop longtemps"}}
    return json.dumps(reponse, ensure_ascii=False)
