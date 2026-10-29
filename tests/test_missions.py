# -*- coding: utf-8 -*-
"""
Tests automatiques des missions (Python classique, sans navigateur).

    node tests/export_missions.js /tmp/missions.json
    python3 tests/test_missions.py /tmp/missions.json

Vérifie :
  - que les données de chaque mission se chargent ;
  - missions « code » : la solution est acceptée, le code de départ refusé, des erreurs
    typiques d'élèves donnent le bon message ;
  - missions « parsons » : la solution est acceptée, des mauvais rangements sont refusés ;
  - missions « commande » : chaque commande-solution est acceptée (dans l'ordre) ;
  - missions « etapes » : les bonnes réponses existent, les données dessinées
    correspondent au dossier Python ;
  - missions « trace » : le programme tourne et les réponses du tableau sont justes ;
  - les exemples du mémo tournent ; harness-source.js est à jour.
"""
import json
import os
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ICI, "..", "js", "core"))
import harness  # noqa: E402

# (mission, code de l'élève, morceau attendu dans le message ou l'explication d'erreur)
ERREURS_CODE = [
    ("m04", "total = 0\nfor nb in traces:\n    total = total + 1\nprint(total)", "compté les zones"),
    ("m04", "total = 0\nfor nb in traces:\n    total = nb\nprint(total)", "dernière valeur"),
    ("m04", "total = 0\nfor nb in traces:\ntotal = total + nb\nprint(total)", "décalé"),
    ("m04", "total = 0\nfor nb in traces\n    total = total + nb\nprint(total)", "deux-points"),
    ("m04", "print(21)\ntotal = 21", "toi-même"),
    ("m04", "total = 0\nfor nb in trace:\n    total = total + nb\nprint(total)", "Voulais-tu écrire"),
    ("m08", None, "deux-points"),
    ("m08", "grandes = []\nfor e in envergures:\n    if e < 4:\n        grandes = grandes.append(e)\nprint(grandes)", "None"),
    ("m08", "grandes = []\nfor e in envergures:\n    if e < 4:\n        grandes.append(e)\nprint(grandes)", "petites"),
    ("m08", "grandes = []\nfor e in envergures:\n    if e > 4:\n        grandes.append(e)\nprint(grande)", "Voulais-tu écrire"),
    ("m08", "grandes = []\nfor e in envergures:\n    if e > 4:\n        grandes.append(e)", "afficher"),
    ("m11", "maxi = intensites[0]\nposition = 0\nfor i in range(len(intensites)):\n    if intensites[i] > maxi:\n        maxi = intensites[i]\n        position = intensites[i]", "indice"),
    ("m11", "maxi = intensites[0]\nposition = 0\nfor i in range(len(intensites)):\n    if intensites[i] > maxi:\n        maxi = i\n        position = i", "un indice"),
    ("m11", "maxi = intensites[0]\nposition = 0\nfor i in range(len(intensites)):\n    if intensites[i] > position:\n        maxi = intensites[i]\n        position = i", "19"),
    ("m11", "maxi = max(intensites)\nposition = 4", "max"),
    ("m11", "maxi = intensites[0]\nposition = 0\nfor i in intensites:\n    if intensites[i] > maxi:\n        maxi = intensites[i]\n        position = i", "indice"),
    ("m13", None, "boucle"),
    ("m13", "nb_grands = 0\nfor t in tailles:\n    nb_grands = nb_grands + 1\nplus_grand = tailles[0]\nfor t in tailles:\n    if t > plus_grand:\n        plus_grand = t\nprint(nb_grands)\nprint(plus_grand)", "toutes"),
    ("m13", "nb_grands = 0\nfor t in tailles:\n    if t > 1.5:\n        nb_grands = nb_grands + 1\nplus_grand = tailles[0]\nprint(nb_grands)\nprint(plus_grand)", "encore 1.2"),
    ("m13", "nb_grands = 0\nfor t in tailles:\n    if t > 1.5:\n        nb_grands = nb_grands + 1\nplus_grand = max(tailles)\nprint(nb_grands)\nprint(plus_grand)", "sans la fonction"),
    ("m13", "nb_grands = 0\nfor t in tailles:\n    if t > 1.5:\n        nb_grands = nb_grands + 1\nplus_grand = tailles[0]\nfor t in tailles:\n    plus_grand = t\nprint(nb_grands)\nprint(plus_grand)", "dernière"),
    ("b02", None, "même liste"),
    ("b02", 'echantillons = ["eau", "boue", "roche", "bulles"]\ncopie = ["eau", "boue", "roche", "bulles"]\ncopie.remove("bulles")', "à la main"),
    ("b03", 'plongees.insert(1, "mardi")\nplongees.append(renforts)\ndel sonde["code_secret"]\nsonde["batterie"] = 100', "extend"),
    ("b03", 'plongees.insert("mardi", 1)', "indice vient en premier"),
    ("b03", 'plongees.insert(1, "mardi")\nplongees.extend(renforts)\nsonde["batterie"] = 100', "code_secret"),
    ("b06", None, None),
    ("b06", 'def est_triee(tab, ordre="croissant"):\n    return "True"', "booléen"),
    ("b06", 'def est_triee(tab, ordre="croissant"):\n    for i in range(len(tab) - 1):\n        if tab[i] > tab[i + 1]:\n            return False\n    return True', "au lieu de"),
    ("b08", None, "ne renvoie rien"),
    ("b08", 'def plus_riche(tab):\n    meilleur = None\n    maxi = -1\n    for ligne in tab:\n        total = ligne[1]\n        if total > maxi:\n            meilleur = ligne[0]\n            maxi = total\n    return meilleur, maxi', ""),
    ("b08", 'def plus_riche(tab):\n    meilleur = None\n    maxi = -1\n    for ligne in tab[1:]:\n        total = ligne[1]\n        if total > maxi:\n            meilleur = ligne[0]\n            maxi = total\n    return meilleur, maxi', "que les poissons"),
    ("b08", 'def plus_riche(tab):\n    meilleur = None\n    maxi = -1\n    for ligne in tab[1:]:\n        total = ligne[1] + ligne[2] + ligne[3]\n        if total > maxi:\n            meilleur = ligne[0]\n            maxi = total\n    return meilleur', "deux valeurs"),
    ("b09", 'def vers_dico(tab):\n    resultat = {}\n    for ligne in tab:\n        resultat[ligne[0]] = {"poissons": ligne[1], "coraux": ligne[2], "tortues": ligne[3]}\n    return resultat\nstations = vers_dico(releve)', "en-tête"),
    ("b11", 'def meilleure_station(d, espece):\n    meilleur = None\n    maxi = -1\n    for nom, infos in d.items():\n        if infos[espece] > maxi:\n            meilleur = infos[espece]\n            maxi = infos[espece]\n    return meilleur\ndef total_espece(d, espece):\n    return 0', "nom"),
    ("b11", 'def meilleure_station(d, espece):\n    meilleur = None\n    maxi = -1\n    for nom, infos in d.items():\n        if infos[espece] > maxi:\n            meilleur = nom\n            maxi = infos[espece]\n    return meilleur\ndef total_espece(d, espece):\n    total = 0\n    for infos in d.values():\n        total = infos[espece]\n    return total', "dernière valeur"),
    ("b14", 'def unite(t):\n    return chant[t]\nfor t in range(10):\n    print(t, unite(t))', "indices"),
    ("b14", 'def unite(t):\n    return t % len(chant)\nfor t in range(10):\n    print(t, unite(t))', "son"),
    ("b14", 'def unite(t):\n    return chant[t % 4]\nfor t in range(10):\n    print(t, unite(t))', "len(chant)"),
    ("b15", 'coin = zone[2][0]\ndef total_grille(g):\n    return 0', "gauche"),
    ("b15", 'coin = zone[2][2]\ndef total_grille(g):\n    total = 0\n    for ligne in g:\n        for case in ligne:\n            total = case\n    return total', "dernière case"),
    ("b16", 'def plus_peuple(g):\n    return max(max(l) for l in g)', "position"),
    ("b16", 'def plus_peuple(g):\n    maxi = g[0][0]\n    position = (0, 0)\n    for i in range(len(g)):\n        for j in range(len(g[i])):\n            if g[i][j] > maxi:\n                maxi = g[i][j]\n                position = (j, i)\n    return position', "inversé"),
    ("b19", 'def plus_dense(d):\n    meilleur = None\n    maxi = -1\n    for nom, (nids, longueur) in d.items():\n        if nids > maxi:\n            maxi = nids\n            meilleur = nom\n    return meilleur', "densité"),
    ("b20", 'def ajouter_nid(d, plage):\n    d[plage][0] = d[plage][0] + 1\ndef total_nids(d):\n    return 0', "tuple"),
    ("b20", 'def ajouter_nid(d, plage):\n    nids, longueur = d[plage]\n    d[plage] = (nids + 1, longueur)\ndef total_nids(d):\n    return 0', ""),
    ("b21", 'def regrouper(balises):\n    r = {}\n    for t, p in balises.items():\n        r[p] = r.get(p, 0) + 1\n    return r', "compte"),
    ("b21", 'def regrouper(balises):\n    r = {}\n    for t, p in balises.items():\n        r[p] = t\n    return r', "liste"),
    ("b23", 'def trier(liste):\n    liste.sort()\n    return liste', "sorted"),
    ("b23", 'def trier(liste):\n    t = liste\n    for i in range(len(t)):\n        i_min = i\n        for j in range(i + 1, len(t)):\n            if t[j] < t[i_min]:\n                i_min = j\n        t[i], t[i_min] = t[i_min], t[i]\n    return t', "copie"),
    ("b24", 'def premiere_position(liste, x):\n    pos = None\n    for i in range(len(liste)):\n        if liste[i] == x:\n            pos = i\n    return pos\ndef toutes_positions(liste, x):\n    return []', "dernière"),
    ("b24", 'def premiere_position(liste, x):\n    for i in range(len(liste)):\n        if liste[i] == x:\n            return i\ndef toutes_positions(liste, x):\n    return []', "-1"),
    ("b25", 'def compter(liste):\n    c = {}\n    for x in liste:\n        c[x] = 1\n    return c\ndef plus_vue(c):\n    return None', "ajouter 1"),
    ("b25", 'def compter(liste):\n    c = {}\n    for x in liste:\n        c[x] = c.get(x, 0) + 1\n    return c\ndef plus_vue(c):\n    return max(c.values())', "espèce"),
    ("b27", None, "ne renvoie rien"),
    ("b27", 'def rapport(obs):\n    total = 0\n    m = obs[0]\n    for o in obs:\n        total = total + o["taille"]\n        if o["taille"] > m["taille"]:\n            m = o\n    return {"nombre": len(obs), "moyenne": total / len(obs), "plus_grand": m["espece"]}', "round"),
    ("b27", 'def rapport(obs):\n    total = 0\n    m = obs[0]\n    for o in obs:\n        total = total + o["taille"]\n        if o["taille"] > m["taille"]:\n            m = o\n    return {"nombre": len(obs), "moyenne": round(total / len(obs), 2), "plus_grand": m}', "espece"),
]

# (mission, liste de (indice de ligne, décalage) → mauvais rangement, morceau attendu)
ERREURS_PARSONS = [
    ("m07", [(0, 0), (1, 0), (2, 1), (3, 1), (4, 1)], "plusieurs fois"),
    ("m07", [(0, 0), (1, 0), (2, 1), (3, 0), (4, 0)], "dans"),
    ("m07", [(0, 0), (1, 0), (3, 1), (2, 0), (4, 0)], "Une seule espèce"),
    ("m07", [(0, 0), ("for espece, nombre in comptage:", 0), (2, 1), (3, 1), (4, 0)], ".items()"),
    ("m12", [("compte = []", 0), (1, 0), (2, 1), (3, 2), (4, 1), (5, 2), (6, 0)], "dictionnaire"),
    ("m12", [(0, 0), (1, 0), (2, 1), ("compte[animal] = 0", 2), (4, 1), (5, 2), (6, 0)], "0"),
    ("m12", [(0, 0), (1, 0), (2, 1), (3, 2), (4, 1), (5, 2), (6, 1)], "plusieurs fois"),
    ("m12", [(0, 0), (1, 0), (2, 1), (5, 2), (4, 1), (3, 2), (6, 0)], ""),
    ("b04", [("for i in flacons:", 0), (1, 1), (2, 1), (3, 0)], ""),
    ("b04", [(0, 0), ("numero = i", 1), (2, 1), (3, 0)], "commence à 0"),
    ("b04", [(0, 0), (1, 1), (2, 1), (3, 1)], "plusieurs fois"),
    ("b17", [(0, 0), (1, 1), (2, 2), (3, 3), ("else:", 2), (4, 3), (5, 0)], "trop tôt"),
    ("b17", [(0, 0), (1, 1), (2, 2), (3, 3), (4, 2), (5, 0)], ""),
    ("b17", [(0, 0), ("for case in g:", 1), (2, 2), (3, 3), (4, 1), (5, 0)], ""),
]

# (mission, numéro de commande (0…), commande fausse, morceau attendu)
ERREURS_COMMANDE = [
    ("m02", 1, "systemes[1]", "indice **0**"),
    ("m02", 1, '"moteur"', "crochets"),
    ("m02", 2, "systemes[4]", "@-1@"),
    ("m02", 3, "5", "len"),
    ("m02", 4, 'systemes.append("Caméra")', None),
    ("m02", 4, 'systemes.add("caméra")', "append"),
    ("m02", 5, 'systemes[2] = "phares"', "indice 1"),
    ("m02", 5, 'systemes.append("phares")', "remplace"),
    ("m06", 1, "fiche[couleur]", "guillemets"),
    ("m06", 1, "fiche.couleur", 'fiche["couleur"]'),
    ("m06", 1, "fiche[1]", "indices numériques"),
    ("m06", 2, 'fiche["taille"] = 5', "nouvelle clé"),
    ("m06", 4, 'fiche["poids"]', "n'existe pas"),
    ("b01", 0, "oxygene[0:2]", "exclue"),
    ("b01", 0, "oxygene[0]", "découpage"),
    ("b01", 1, "oxygene[2:4]", "exclue"),
    ("b01", 2, "oxygene[6:]", "négatif"),
    ("b01", 5, "oxygene[:4]", "ranger"),
    ("b10", 1, 'stations["Tombant bleu"]', "deux paires"),
    ("b10", 2, 'stations["Grand herbier"]["tortues"] = 2', "ajouter"),
    ("b10", 2, 'stations["Grand herbier"]["tortues"] += 2', None),
    ("b10", 3, 'stations["Île au sable"] = {"poisson": 30, "corail": 0, "tortue": 4}', "mêmes clés"),
    ("b10", 3, 'stations["Ile au sable"] = {"poissons": 30, "coraux": 0, "tortues": 4}', None),
]


PERSONNAGES = {"cap", "bolt", "nour", "luci", "huit", "vex", "orsa", "gombessa", "narration", "toi"}
EXPRESSIONS = {"neutre", "sourire", "rire", "serieux", "colere", "choc", "sueur", "triste", "malin"}


def charger(chemin):
    with open(chemin, encoding="utf-8") as f:
        return json.load(f)


def assembler(m, rangement):
    """rangement : [(indice dans lignes OU texte, décalage)]"""
    lignes = [l.strip() for l in m["parsons"]["lignes"]]
    out = []
    for quoi, niveau in rangement:
        texte = lignes[quoi] if isinstance(quoi, int) else quoi
        out.append("    " * niveau + texte)
    return "\n".join(out) + "\n"


def tester_etapes(m, ns, problemes, liste=None, nom_liste="étape"):
    donnees = m.get("donnees") or {}
    for nom, valeur in donnees.items():
        if nom in ns and json.loads(json.dumps(ns[nom], ensure_ascii=False)) != valeur:
            problemes.append("%s : donnees[%s] différent du dossier Python" % (m["id"], nom))
    for k, e in enumerate(liste if liste is not None else m["etapes"]):
        ou = "%s %s %d" % (m["id"], nom_liste, k + 1)
        t = e.get("type", "choix")
        if not e.get("q"):
            problemes.append(ou + " : pas de question")
        if t == "choix":
            if "bonnes" in e:
                if not all(0 <= b < len(e["choix"]) for b in e["bonnes"]):
                    problemes.append(ou + " : bonnes hors limites")
            elif not (0 <= e["bonne"] < len(e["choix"])):
                problemes.append(ou + " : bonne hors limites")
        elif t == "case":
            v = e.get("valeur", donnees.get(e.get("donnee")))
            if v is None:
                problemes.append(ou + " : donnée introuvable")
                continue
            bonnes = e["bonnes"] if "bonnes" in e else [e["bonne"]]
            for b in bonnes:
                if isinstance(v, dict):
                    ok = b in v
                elif isinstance(b, list):
                    ok = 0 <= b[0] < len(v) and 0 <= b[1] < len(v[b[0]])
                else:
                    ok = 0 <= b < len(v)
                if not ok:
                    problemes.append(ou + " : case %r inexistante" % (b,))
        elif t == "ligne":
            n = len(e["code"].split("\n"))
            bonnes = e["bonnes"] if "bonnes" in e else [e["bonne"]]
            if not all(1 <= b <= n for b in bonnes):
                problemes.append(ou + " : ligne hors limites")
        elif t == "saisie":
            if not e.get("rep"):
                problemes.append(ou + " : pas de réponse")
        elif t == "associer":
            if sorted(e["bonnes"]) != list(range(len(e["droite"]))) or len(e["gauche"]) != len(e["droite"]):
                problemes.append(ou + " : associations incohérentes")
        elif t in ("trous", "phrase"):
            texte = e["code"] if t == "trous" else e["phrase"]
            nb = texte.count("{{")
            if nb != len(e["trous"]):
                problemes.append(ou + " : %d trous dans le texte, %d définis" % (nb, len(e["trous"])))
            for tr in e["trous"]:
                if not (0 <= tr["bonne"] < len(tr["choix"])):
                    problemes.append(ou + " : bonne hors limites")
                if len(set(tr["choix"])) != len(tr["choix"]):
                    problemes.append(ou + " : étiquette en double")
        elif t == "annoter":
            n = len(e["code"].split("\n"))
            for note in e["notes"]:
                if not (1 <= note["ligne"] <= n):
                    problemes.append(ou + " : note sur une ligne inexistante")
                if not (0 <= note["bonne"] < len(e["etiquettes"])):
                    problemes.append(ou + " : étiquette hors limites")
        elif t == "emplacement":
            if not (0 <= e["bonne"] <= len(e["liste"])):
                problemes.append(ou + " : emplacement hors limites")
            if "resultat" in e:
                attendu = list(e["liste"]); attendu.insert(e["bonne"], e["valeur"])
                if attendu != e["resultat"]:
                    problemes.append(ou + " : résultat %r au lieu de %r" % (e["resultat"], attendu))
        else:
            problemes.append(ou + " : type inconnu " + t)
        # Vérification par Python quand la question porte sur un programme : on l'exécute
        if e.get("verif"):
            r = harness.executer(m.get("setup") or "", e["verif"]["code"], "")
            if r["erreur"] or r["sortie"].strip() != e["verif"]["sortie"]:
                problemes.append(ou + " : le programme ne donne pas %r mais %r %s" % (e["verif"]["sortie"], r["sortie"], r["erreur"]))


def main():
    donnees = charger(sys.argv[1])
    missions = {m["id"]: m for m in donnees["missions"]}
    problemes = []
    compte = {}
    ids = set()
    for m in donnees["missions"]:
        if m["id"] in ids:
            problemes.append("identifiant en double : " + m["id"])
        ids.add(m["id"])
        compte[m["type"]] = compte.get(m["type"], 0) + 1
        for champ in ("titre", "objectif", "competence", "chap", "xp"):
            if not m.get(champ):
                problemes.append("%s : champ « %s » manquant" % (m["id"], champ))
        if m.get("objectif") and len(m["objectif"]) > 140:
            problemes.append("%s : objectif trop long (%d caractères)" % (m["id"], len(m["objectif"])))
        setup = m.get("setup") or ""
        ns = {}
        d = harness.variables_du_dossier(setup)
        if not d["ok"]:
            problemes.append("%s : dossier en erreur %s" % (m["id"], d.get("interne")))
        else:
            exec(setup, ns)
        t = m["type"]
        # La scène et la réplique du joueur
        if not m.get("recit"):
            problemes.append("%s : pas de scène (recit)" % m["id"])
        for c in (m.get("recit") or []) + (m.get("apres") or []):
            if c.get("qui") and c["qui"] not in PERSONNAGES:
                problemes.append("%s : personnage inconnu %r" % (m["id"], c["qui"]))
            if c.get("expr") and c["expr"] not in EXPRESSIONS:
                problemes.append("%s : expression inconnue %r" % (m["id"], c["expr"]))
        r = m.get("replique")
        if r and not (0 <= r["bonne"] < len(r["choix"])):
            problemes.append("%s : réplique, bonne hors limites" % m["id"])
        if m.get("avant"):
            if t == "etapes":
                problemes.append("%s : un plan « avant » est inutile pour une mission à étapes" % m["id"])
            tester_etapes(m, ns, problemes, m["avant"], "plan")
        if t == "etapes":
            tester_etapes(m, ns, problemes)
        elif t == "code":
            r = harness.executer(setup, m["solution"], m["check"])
            if not r["reussi"]:
                problemes.append("%s : la SOLUTION échoue → %s %s %s" % (m["id"], r["phase"], r.get("message"), r.get("erreur") or r.get("interne")))
            r = harness.executer(setup, m["starter"], m["check"])
            if r["reussi"]:
                problemes.append("%s : le code de départ est accepté !" % m["id"])
            if r["phase"] == "interne":
                problemes.append("%s : erreur interne avec le code de départ : %s" % (m["id"], r.get("interne")))
        elif t == "parsons":
            sol = "\n".join(m["parsons"]["lignes"]) + "\n"
            if sol.strip() != m["solution"].strip():
                problemes.append("%s : la solution affichée ne correspond pas aux lignes du parsons" % m["id"])
            r = harness.executer(setup, sol, m["check"])
            if not r["reussi"]:
                problemes.append("%s : la SOLUTION (parsons) échoue → %s %s %s" % (m["id"], r["phase"], r.get("message"), r.get("erreur")))
            for dist in m["parsons"].get("distracteurs", []):
                if dist.strip() in [l.strip() for l in m["parsons"]["lignes"]]:
                    problemes.append("%s : le distracteur %r est aussi une bonne ligne" % (m["id"], dist))
        elif t == "commande":
            hist = []
            for k, c in enumerate(m["commandes"]):
                r = harness.executer_commande(setup, hist, c["solution"], c["check"])
                if not r["reussi"]:
                    problemes.append("%s commande %d : la solution %r échoue → %s %s %s" % (m["id"], k + 1, c["solution"], r["phase"], r.get("message"), r.get("erreur") or r.get("interne")))
                hist.append(c["solution"])
        elif t == "trace":
            r = harness.executer("", m["code"], "")
            if r["erreur"]:
                problemes.append("%s : le programme du tableau plante : %s" % (m["id"], r["erreur"]))
            reps = m["trace"].get("apres") or []
            if reps and r["sortie"].strip().split("\n")[-1] != reps[0]["rep"][0]:
                problemes.append("%s : le programme affiche %r, le tableau attend %r" % (m["id"], r["sortie"], reps[0]["rep"][0]))
    for mid, code, attendu in ERREURS_CODE:
        m = missions.get(mid)
        if not m:
            continue
        if code is None:
            code = m["starter"]
        r = harness.executer(m.get("setup") or "", code, m["check"])
        verifier_variante(problemes, mid, code, r, attendu)
    for mid, rangement, attendu in ERREURS_PARSONS:
        m = missions.get(mid)
        if not m:
            continue
        code = assembler(m, rangement)
        r = harness.executer(m.get("setup") or "", code, m["check"])
        verifier_variante(problemes, mid, code, r, attendu)
    for mid, k, cmd, attendu in ERREURS_COMMANDE:
        m = missions.get(mid)
        if not m:
            continue
        hist = [c["solution"] for c in m["commandes"][:k]]
        r = harness.executer_commande(m.get("setup") or "", hist, cmd, m["commandes"][k]["check"])
        if attendu is None:
            if not r["reussi"]:
                problemes.append("%s commande %d : variante juste REFUSÉE %r → %s" % (mid, k + 1, cmd, r.get("message")))
            continue
        verifier_variante(problemes, mid, cmd, r, attendu)
    for ex in donnees["memo"]:
        r = harness.executer("", ex["code"], "")
        if r["erreur"] and r["erreur"]["type"] not in ("IndexError", "KeyError", "ValueError", "TypeError"):
            problemes.append("mémo %s : %s" % (ex["fiche"], r["erreur"]))
        if r["erreur"] and "#" not in r["erreur"].get("texte_ligne", "#"):
            problemes.append("mémo %s : erreur non annoncée %s" % (ex["fiche"], r["erreur"]))
    # harness-source.js doit être à jour
    with open(os.path.join(ICI, "..", "js", "core", "harness.py"), encoding="utf-8") as f:
        source = f.read()
    with open(os.path.join(ICI, "..", "js", "core", "harness-source.js"), encoding="utf-8") as f:
        js = f.read()
    if json.dumps(source, ensure_ascii=False) not in js:
        problemes.append("harness-source.js n'est pas à jour : lance python3 outils/embarquer_harness.py")
    print("Missions : %s. Variantes d'erreurs : %d. Exemples du mémo : %d." % (
        ", ".join("%d %s" % (n, t) for t, n in sorted(compte.items())),
        len(ERREURS_CODE) + len(ERREURS_PARSONS) + len(ERREURS_COMMANDE), len(donnees["memo"])))
    if problemes:
        print("\n".join("✗ " + p for p in problemes))
        sys.exit(1)
    print("✓ Tout est correct.")


def verifier_variante(problemes, mid, code, r, attendu):
    err = r.get("erreur") or {}
    texte = (r.get("message") or "") + " " + err.get("explication", "") + " " + err.get("brut", "")
    if r["reussi"]:
        problemes.append("%s : variante fausse ACCEPTÉE :\n%s" % (mid, code))
    elif r["phase"] == "interne":
        problemes.append("%s : erreur interne %s pour :\n%s" % (mid, r.get("interne"), code))
    elif attendu and attendu not in texte:
        problemes.append("%s : message inattendu pour\n%s\n  → %s" % (mid, code, texte[:400]))


if __name__ == "__main__":
    main()
