"""Stage 1 audit scratch: Python sa_place vs JS saPlace, move by move."""
import json, math, sys
sys.dont_write_bytecode = True
COMMON = "/home/capeur/Documents/3A/SJTU/VLSI_Mort/test2/eda-learning-lab7-pl/courses/learn_placement/common"
sys.path.insert(0, COMMON)
import solvers
from placementutil import load_place, total_hpwl, clone_positions
SP = sys.argv[1]
g = load_place(f"{COMMON}/tiny_place.json")
cells, nets, starter = g["cells"], g["nets"], g["starter"]

# 1. PRNG bit-for-bit
js_prng = json.load(open(f"{SP}/js_prng.json"))
for s, draws in js_prng.items():
    try:
        seed = int(float(s)) if float(s).is_integer() else float(s)
        r = solvers._mulberry32_js(seed)
        mine = [r() for _ in range(500)]
        print(f"prng seed {s}: python == js for 500 draws: {mine == draws}")
    except Exception as e:
        print(f"prng seed {s}: python raises {type(e).__name__}: {e}")

# 2. real sa_place, with a draw log (monkey-patch inside this scratch process only)
orig = solvers._mulberry32_js
log = []
def wrapped(seed):
    r = orig(seed)
    def rr():
        v = r(); log.append(v); return v
    return rr
solvers._mulberry32_js = wrapped
real = solvers.sa_place(starter, cells, nets, seed=42)
solvers._mulberry32_js = orig
print("python sa_place seed 42:", {k: real[k] for k in ("hpwl", "accepted", "rejected", "final_hpwl")}, "draws consumed:", len(log))

# 3. python results vs JS results, seeds 1..200
js = json.load(open(f"{SP}/js_results_1_200.json"))
bad = []
for seed in range(1, 201):
    p = solvers.sa_place(starter, cells, nets, seed=seed)
    j = js[str(seed)]
    ok = (p["hpwl"] == j["hpwl"] and p["final_hpwl"] == j["finalHpwl"] and p["accepted"] == j["accepted"]
          and p["rejected"] == j["rejected"] and p["positions"] == j["positions"]
          and [(h["hpwl"], h["T"]) for h in p["history"]] == [(h["hpwl"], h["T"]) for h in j["history"]])
    if not ok:
        bad.append(seed)
print("python sa_place vs JS saPlace, seeds 1..200, exact equality (hpwl, final, acc, rej, positions, history):", "ALL EQUAL" if not bad else f"DIFFER at {bad}")

# 4. python instrumented trace (own loop using solvers' PRNG), compare to JS trace move by move
def trace(seed=42, moves=60, t0=3.0, cool=0.94, step=1.0):
    rand = solvers._mulberry32_js(seed)
    pos = clone_positions(starter); cur = total_hpwl(nets, pos); best = cur; T = t0; out = []
    for m in range(moves):
        cid = cells[int(rand() * len(cells)) % len(cells)]
        trial = clone_positions(pos)
        axis = "x" if rand() < 0.5 else "y"
        delta = (-1 if rand() < 0.5 else 1) * step * (0.5 + rand())
        before = pos[cid][axis]; proposed = before + delta
        trial[cid][axis] = proposed
        trial[cid]["x"] = max(-1.0, min(9.0, trial[cid]["x"])); trial[cid]["y"] = max(-1.0, min(9.0, trial[cid]["y"]))
        nxt = total_hpwl(nets, trial); d = nxt - cur; Tm = T; u = None
        if d <= 0: acc = True
        else:
            u = rand(); acc = u < math.exp(-d / max(T, 1e-9))
        nb = False
        if acc:
            pos = trial; cur = nxt
            if cur < best: best = cur; nb = True
        T *= cool
        out.append(dict(move=m + 1, cell=cid, axis=axis, delta=delta, before=before, proposed=proposed, after=trial[cid][axis],
                        clamped=trial[cid][axis] != proposed, dHpwl=d, T=Tm, u=u, accepted=acc, newBest=nb, hpwl=cur, best=best))
    return out
py = trace()
jt = json.load(open(f"{SP}/js_trace_42.json"))["log"]
diff = []
for a, b in zip(py, jt):
    for k in a:
        if a[k] != b[k]:
            diff.append((a["move"], k, a[k], b[k]))
print("python trace vs js trace, 60 moves x", len(py[0]), "fields: differing fields =", len(diff))
for x in diff[:10]: print("  ", x)
print("max |dHpwl| difference:", max(abs(a["dHpwl"] - b["dHpwl"]) for a, b in zip(py, jt)))
print("python draws from real sa_place == draws consumed by my python trace:", len(log) == 4 * 60 + sum(1 for r in py if r["u"] is not None))
# 5. Python-side facts
print("python sa_place respects fixed pads? signature has 'fixed' param:", "fixed" in solvers.sa_place.__code__.co_varnames[:solvers.sa_place.__code__.co_argcount + solvers.sa_place.__code__.co_kwonlyargcount])
print("python sa_place uses net_weights? ", "weights" in solvers.sa_place.__code__.co_names or "net_weights" in solvers.sa_place.__code__.co_varnames)
