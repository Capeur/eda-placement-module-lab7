import sys, json
sys.dont_write_bytecode = True
C = "/home/capeur/Documents/3A/SJTU/VLSI_Mort/test2/eda-learning-lab7-pl/courses/learn_placement/common"
sys.path.insert(0, C)
import solvers
from placementutil import load_place, total_hpwl
g = load_place(f"{C}/tiny_place.json")
c, n, s = g["cells"], g["nets"], g["starter"]
r = solvers.sa_place(s, list(reversed(c)), n, seed=42)
print("cells reversed:", round(r["hpwl"], 4), r["accepted"], r["rejected"])
r = solvers.sa_place(s, c, list(reversed(n)), seed=42)
print("nets reversed :", round(r["hpwl"], 4), r["accepted"], r["rejected"])
r = solvers.sa_place(dict(reversed(list(s.items()))), c, n, seed=42)
print("positions dict reversed:", round(r["hpwl"], 4), r["accepted"], r["rejected"])
for sd in (0, 1, 2, 3, 42):
    rr = solvers._mulberry32_js(sd); print("seed", sd, "first 4 draws", [round(rr(), 3) for _ in range(4)])
print("T after k moves:", [(k, round(3 * 0.94 ** k, 3)) for k in (0, 10, 20, 30, 40, 50, 60)])
print("sa_place signature:", solvers.sa_place.__kwdefaults__)
print("solvers.py CRLF:", b"\r\n" in open(f"{C}/solvers.py", "rb").read(), "| placementutil CRLF:", b"\r\n" in open(f"{C}/placementutil.py", "rb").read())
