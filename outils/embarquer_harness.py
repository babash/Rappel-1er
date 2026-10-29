# -*- coding: utf-8 -*-
"""
Recopie js/core/harness.py dans js/core/harness-source.js (sous forme de texte JavaScript).
À relancer après chaque modification de harness.py :

    python3 outils/embarquer_harness.py

Pourquoi ? Le site peut ainsi démarrer Python même ouvert en double-cliquant (adresse file://),
où le navigateur interdit de lire un fichier .py voisin.
"""
import json
import os

ICI = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(ICI, "..", "js", "core", "harness.py")
CIBLE = os.path.join(ICI, "..", "js", "core", "harness-source.js")

with open(SOURCE, encoding="utf-8") as f:
    code = f.read()
with open(CIBLE, "w", encoding="utf-8") as f:
    f.write("// Fichier généré par outils/embarquer_harness.py à partir de js/core/harness.py : ne pas modifier à la main.\n")
    f.write("window.BNL = window.BNL || {};\nBNL.HARNESS_PY = " + json.dumps(code, ensure_ascii=False) + ";\n")
print("harness-source.js mis à jour (%d caractères)." % len(code))
