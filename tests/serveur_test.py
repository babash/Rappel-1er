# -*- coding: utf-8 -*-
"""
Serveur de test local : sert le site ET imite l'API RPC de Supabase (PostgREST)
au-dessus d'un vrai PostgreSQL où supabase/schema.sql a été chargé.

    python3 tests/serveur_test.py 8765 "host=/var/tmp/bnlpg port=54329 user=postgres dbname=postgres"

Chaque appel est exécuté avec le rôle « anon », comme sur Supabase : cela vérifie
aussi que les droits (GRANT) du schéma sont corrects.
"""
import http.server
import json
import os
import sys
import threading

import psycopg
from psycopg.types.json import Jsonb

RACINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
DSN = sys.argv[2] if len(sys.argv) > 2 else "host=/var/tmp/bnlpg port=54329 user=postgres dbname=postgres"
VERROU = threading.Lock()
CONN = psycopg.connect(DSN, autocommit=True)


def types_retour(fn):
    with CONN.cursor() as cur:
        cur.execute("select proretset, pg_get_function_result(oid) from pg_proc where proname = %s and pronamespace = 'public'::regnamespace", (fn,))
        r = cur.fetchone()
    return r


class Gestion(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=RACINE, **k)

    def log_message(self, fmt, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_POST(self):
        if not self.path.startswith("/rest/v1/rpc/"):
            self.send_error(404)
            return
        if not self.headers.get("apikey"):
            return self.repondre(401, {"message": "No API key found in request"})
        fn = self.path.split("/rest/v1/rpc/")[1].split("?")[0]
        longueur = int(self.headers.get("Content-Length") or 0)
        args = json.loads(self.rfile.read(longueur) or b"{}")
        morceaux, valeurs = [], []
        for cle, val in args.items():
            if isinstance(val, (dict, list)):
                morceaux.append("%s => %%s" % cle)
                valeurs.append(Jsonb(val))
            else:
                morceaux.append("%s => %%s" % cle)
                valeurs.append(val)
        with VERROU:
            info = types_retour(fn)
            if not info:
                return self.repondre(404, {"message": "Could not find the function public.%s" % fn})
            ensemble, resultat = info
            try:
                with CONN.cursor() as cur:
                    cur.execute("set role anon")
                    try:
                        if ensemble:
                            cur.execute("select row_to_json(t) from public.%s(%s) t" % (fn, ", ".join(morceaux)), valeurs)
                            donnees = [r[0] for r in cur.fetchall()]
                        else:
                            cur.execute("select to_json(public.%s(%s))" % (fn, ", ".join(morceaux)), valeurs)
                            donnees = cur.fetchone()[0]
                    finally:
                        cur.execute("reset role")
            except psycopg.Error as e:
                diag = e.diag
                return self.repondre(400, {"code": diag.sqlstate, "message": diag.message_primary or str(e)})
        if resultat == "void":
            return self.repondre(200, None)
        return self.repondre(200, donnees)

    def repondre(self, code, donnees):
        corps = b"" if donnees is None else json.dumps(donnees, default=str).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)


http.server.ThreadingHTTPServer.allow_reuse_address = True
serveur = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Gestion)
print("Serveur de test sur http://127.0.0.1:%d" % PORT, flush=True)
serveur.serve_forever()
