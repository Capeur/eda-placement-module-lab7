#!/usr/bin/env python3
"""Golden self-check for module02-07 simulated-annealing placement (Track A).

    python3 examples/sa_place_check.py                      # check the reference (all tables)
    python3 examples/sa_place_check.py --show               # also print the rules, the run and every move
    python3 examples/sa_place_check.py --impl my_sa.py      # check YOUR functions
    python3 examples/sa_place_check.py --vs-node            # compare with saPlace in the browser lab's JS
    python3 examples/sa_place_check.py --show --seed 199 --moves 60            # pick another run
    python3 examples/sa_place_check.py --show --freeze A,D                     # exploration, NOT golden
    python3 examples/sa_place_check.py --json --seed 42 --moves 60 > trace.json  # every move: figures, lessons
    python3 examples/sa_place_check.py --write-examples     # rewrite examples/trace_*.json and seeds_1_200.json

Your file may define any of (the same signatures as common/solvers.py, so you can compare):
    mulberry32(seed)                                -> rand(): the next float in [0, 1)
    total_hpwl(nets, positions)                     -> sum over nets of (max x - min x) + (max y - min y)
    sa_place(positions, cells, nets, *, moves=60, t0=3.0, cool=0.94, step=1.0, seed=42)
                                                    -> {"positions": BEST positions, "hpwl": BEST hpwl,
                                                        "accepted", "rejected", "final_hpwl"}
`positions` is {cell: {"x", "y"}}, `nets` a list of lists of cell names, `cells` the cell names in order.
Functions you have not written yet are reported as SKIP. Never change the positions, cells or nets you are given.

THE RULES (written exactly, because the course code never wrote them down)
    Cost: HPWL, every net counted once with weight 1 (the timing weights of tiny_place.json are NOT used).
    PRNG: mulberry32(seed), the 12-line generator of placement-core.js, with NO warm-up draw: the first call
          returns the first float. The seed is an integer (do not use seed 0 or 1 in examples: their second
          draw is 0.000 and 0.003, so the first axis is always x).
    State: T = t0 (3.0). cur = HPWL of the start. best = cur, best positions = the start, best move = none.
    One move, in this order, 4 draws (r1..r4):
      1. cell  = cells[floor(r1 * n)]           uniform over the n cells, by list order A, B, C, D, E, F
      2. axis  = x if r2 < 0.5 else y
      3. sign  = -1 if r3 < 0.5 else +1
      4. size  = step * (0.5 + r4)              so 0.5 to 1.5: cells leave the integer grid
      new coordinate = old + sign * size, then BOTH coordinates of that cell are clamped to [-1, 9] (the walls)
    Test: delta = HPWL(after) - cur.
      if delta <= 0: accept, and draw NO random number (strictly "not worse", so delta = 0 is accepted)
      else: draw one more number u (the 5th draw) and accept when u < exp(-delta / T)
    If accepted: the move stays, cur = HPWL(after); if cur < best (strictly) then best = cur, best positions =
      the current ones, best move = this move number. If rejected: nothing changes.
    Then T = T * cool (0.94) after EVERY move, accepted or not (cooling comes after the test).
    Result: the BEST positions and BEST hpwl (not the final ones), the final HPWL, accepted and rejected counts.
    60 moves draw 4 x 60 + 25 (one per worsening proposal) = 265 numbers on seed 42.
    "Free move" = delta = 0: accepted, the cell moved, no net box changed.
    The order of the cells list is part of the spec: the same seed on A..F and on F..A gives different runs.
Pads: tiny_place.json lists A and D as fixed pads, but this annealer moves EVERY cell, pads too (freezing is another
lab's rule). --freeze X,Y is an exploration: the moving cell is picked among the non-frozen cells only, in order
A..F (cell = free[floor(r1 * n_free)]). Its numbers are NOT golden.
Standard library only; runs with `python3` from the module folder. --vs-node needs `node` and the clone's platform/.
"""
from __future__ import annotations

import argparse
import importlib.util
import inspect
import json
import math
import statistics
import subprocess
import sys
from pathlib import Path

sys.dont_write_bytecode = True  # do not leave __pycache__ in common/
HERE = Path(__file__).resolve().parent
COMMON = HERE.parents[1] / "common"
CORE_JS = HERE.parents[3] / "platform" / "assets" / "placement-core.js"
NODE_HELPER = HERE / "sa_node.mjs"

WALL_MIN, WALL_MAX = -1.0, 9.0
T0, COOL, STEP = 3.0, 0.94, 1.0

TRACE_FILES = [  # name, seed, moves
    ("trace_seed42_60.json", 42, 60),
    ("trace_seed199_60.json", 199, 60),
    ("trace_seed162_60.json", 162, 60),
    ("trace_seed42_300.json", 42, 300),
]
SEEDS_FILE = "seeds_1_200.json"

# One colour per cell, everywhere (same palette as the other labs' figures).
COLORS = {"A": "#1d4ed8", "B": "#0f6b5c", "C": "#b45309", "D": "#7c3aed", "E": "#be123c", "F": "#475569"}


# ---------------- the instance ----------------
def load_instance():
    data = json.loads((HERE / "tiny_place.json").read_text(encoding="utf-8"))
    return {
        "cells": list(data["cells"]),
        "nets": [list(n) for n in data["nets"]],
        "starter": {k: {"x": float(v["x"]), "y": float(v["y"])} for k, v in data["starter"].items()},
        "golden": {k: {"x": float(v["x"]), "y": float(v["y"])} for k, v in data["golden"].items()},
        "overlap": {k: {"x": float(v["x"]), "y": float(v["y"])} for k, v in data["overlap"].items()},
        "fixed_pads": list(data.get("fixed_pads", [])),
    }


def clone(pos):
    return {k: {"x": v["x"], "y": v["y"]} for k, v in pos.items()}


# ---------------- PRNG and cost ----------------
def mulberry32(seed):
    """The generator of placement-core.js. 32-bit arithmetic; no warm-up draw."""
    a = int(seed) & 0xFFFFFFFF

    def rand():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((a ^ (a >> 15)) * (1 | a)) & 0xFFFFFFFF
        t = ((t + (((t ^ (t >> 7)) * (61 | t)) & 0xFFFFFFFF)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0

    return rand


def net_hpwl(net, pos):
    xs = [pos[c]["x"] for c in net]
    ys = [pos[c]["y"] for c in net]
    return (max(xs) - min(xs)) + (max(ys) - min(ys))


def total_hpwl(nets, positions):
    return sum(net_hpwl(n, positions) for n in nets)


def density_overflow(pos, nx=2, ny=2, lo=0.0, hi=8.0, capacity=1):
    """2x2 bins over [0,8]^2 (the lab's densityBins): cells outside are pushed into the border bins."""
    bw, bh = (hi - lo) / nx, (hi - lo) / ny
    counts = [[0] * nx for _ in range(ny)]
    for p in pos.values():
        bx = min(max(math.floor((p["x"] - lo) / bw), 0), nx - 1)
        by = min(max(math.floor((p["y"] - lo) / bh), 0), ny - 1)
        counts[by][bx] += 1
    return counts, sum(max(0, c - capacity) for row in counts for c in row)


# ---------------- the reference annealer, with a log of every move ----------------
def run_sa(start, cells, nets, *, moves=60, t0=T0, cool=COOL, step=STEP, seed=42, freeze=(), flaws=()):
    """The written rules above. `flaws` (a set of names) switches ONE rule to the wrong version, only to build the
    'faithful-looking port' table: strict, draw_early, no_clamp, int_step, cool_first."""
    rand = mulberry32(seed)
    draws = 0

    def draw():
        nonlocal draws
        draws += 1
        return rand()

    free = [c for c in cells if c not in freeze]
    pos = clone(start)
    cur = total_hpwl(nets, pos)
    best, best_pos, best_move = cur, clone(pos), None
    T = t0
    accepted = rejected = 0
    history = [{"hpwl": cur, "T": T}]
    log = []
    for m in range(1, moves + 1):
        cell = free[int(draw() * len(free))]
        axis = "x" if draw() < 0.5 else "y"
        sign = -1 if draw() < 0.5 else 1
        size = step if "int_step" in flaws else step * (0.5 + draw())
        before = dict(pos[cell])
        trial = clone(pos)
        proposed = before[axis] + sign * size
        trial[cell][axis] = proposed
        if "no_clamp" not in flaws:
            trial[cell]["x"] = max(WALL_MIN, min(WALL_MAX, trial[cell]["x"]))
            trial[cell]["y"] = max(WALL_MIN, min(WALL_MAX, trial[cell]["y"]))
        nxt = total_hpwl(nets, trial)
        d = nxt - cur
        Tm = T
        if "cool_first" in flaws:
            T *= cool
        u = draw() if "draw_early" in flaws else None
        if (d < 0) if "strict" in flaws else (d <= 0):
            ok = True  # not worse: accepted without the dice
        else:
            if u is None:
                u = draw()
            ok = u < math.exp(-d / max(T, 1e-9))
        new_best = False
        if ok:
            pos, cur = trial, nxt
            accepted += 1
            if cur < best:
                best, best_pos, best_move, new_best = cur, clone(pos), m, True
        else:
            rejected += 1
        if "cool_first" not in flaws:
            T *= cool
        if m % 10 == 0:
            history.append({"hpwl": cur, "T": T})
        log.append({
            "move": m, "cell": cell, "axis": axis, "from": before, "to": dict(trial[cell]), "proposed": proposed,
            "clamped": trial[cell][axis] != proposed, "delta": sign * size, "dHpwl": d, "T": Tm,
            "p": 1 if d <= 0 else math.exp(-d / max(Tm, 1e-9)), "u": u, "accepted": ok, "newBest": new_best,
            "hpwl": cur, "best": best, "kind": "better" if d < 0 else "worse" if d > 0 else "free",
        })
    return {"best": best, "final": cur, "accepted": accepted, "rejected": rejected, "positions": best_pos,
            "final_positions": clone(pos), "best_move": best_move, "draws": draws, "history": history, "log": log,
            "start": clone(start)}


# ---------------- reference API (same names and signatures as the learner's file) ----------------
def sa_place(positions, cells, nets, *, moves=60, t0=T0, cool=COOL, step=STEP, seed=42):
    r = run_sa(positions, cells, nets, moves=moves, t0=t0, cool=cool, step=step, seed=seed)
    return {"positions": r["positions"], "hpwl": r["best"], "accepted": r["accepted"], "rejected": r["rejected"],
            "final_hpwl": r["final"], "history": r["history"]}


def accept_prob(delta, T):
    """Metropolis: 1 when not worse, else e^(-delta / T)."""
    return 1.0 if delta <= 0 else math.exp(-delta / max(T, 1e-9))


# ---------------- facts about a run (all of them are printed by --show and used by the tables) ----------------
def facts(r):
    log = r["log"]
    acc = [x for x in log if x["accepted"]]
    kinds = lambda rows: {k: sum(x["kind"] == k for x in rows) for k in ("better", "worse", "free")}
    return {
        "best": r["best"], "final": r["final"], "best_move": r["best_move"], "accepted": r["accepted"],
        "rejected": r["rejected"], "draws": r["draws"], "proposed_kinds": kinds(log), "accepted_kinds": kinds(acc),
        "clamped": sum(x["clamped"] for x in log), "clamped_accepted": sum(x["clamped"] for x in acc),
        "clamped_moves": [x["move"] for x in log if x["clamped"]],
        "pads_proposed": sum(x["cell"] in ("A", "D") for x in log), "pads_accepted": sum(x["cell"] in ("A", "D") for x in acc),
        "peak": max(x["hpwl"] for x in log) if log else None,
        "T_end": log[-1]["T"] * COOL if log else None,
    }


# ---------------- JSON: header + every move ----------------
def build_trace(inst, seed, moves, freeze=()):
    r = run_sa(inst["starter"], inst["cells"], inst["nets"], moves=moves, seed=seed, freeze=freeze)
    f = facts(r)
    head = {
        "module": "module02-07-sa-placement", "seed": seed, "moves": moves, "t0": T0, "cool": COOL, "step": STEP,
        "frozen": list(freeze), "cells": inst["cells"], "nets": inst["nets"],
        "walls": {"min": WALL_MIN, "max": WALL_MAX},
        "hpwl_start": total_hpwl(inst["nets"], inst["starter"]),
        "net_hpwl_start": [net_hpwl(n, inst["starter"]) for n in inst["nets"]],
        "start": r["start"], "best": r["best"], "best_move": r["best_move"], "final": r["final"],
        "best_positions": r["positions"], "final_positions": r["final_positions"],
        "accepted": r["accepted"], "rejected": r["rejected"], "draws": r["draws"],
        "accepted_by_kind": f["accepted_kinds"], "proposed_by_kind": f["proposed_kinds"],
        "clamped": f["clamped"], "peak": f["peak"], "history": r["history"],
    }
    return head, r["log"]


def dump_trace(head, log):
    """Header pretty-printed, one line per move (a 300-move file stays readable and small)."""
    lines = ["{"]
    for k, v in head.items():
        lines.append(f" {json.dumps(k)}: {json.dumps(v)},")
    lines.append(' "moves_list": [')
    lines.append(",\n".join("  " + json.dumps(x) for x in log))
    lines.append(" ]\n}")
    return "\n".join(lines) + "\n"


def seeds_table(inst, seeds=range(1, 201), moves=60):
    rows = []
    for s in seeds:
        r = run_sa(inst["starter"], inst["cells"], inst["nets"], moves=moves, seed=s)
        rows.append({"seed": s, "best": r["best"], "best_move": r["best_move"], "final": r["final"],
                     "accepted": r["accepted"], "rejected": r["rejected"]})
    return rows


def seeds_json(inst):
    rows = seeds_table(inst)
    head = {"module": "module02-07-sa-placement", "moves": 60, "t0": T0, "cool": COOL, "step": STEP,
            "note": "best_move is the 1-based move of the best, null when the run never beat the start"}
    lines = ["{"] + [f" {json.dumps(k)}: {json.dumps(v)}," for k, v in head.items()] + [' "seeds": [']
    lines.append(",\n".join("  " + json.dumps(x) for x in rows))
    lines.append(" ]\n}")
    return "\n".join(lines) + "\n"


# ---------------- golden tables (every number here was printed by --show; see EXAMPLES.md) ----------------
# round(value, 4) must equal the table value; integers are exact.
GOLD_RUNS = {
    (42, 60): {"best": 49.5755, "final": 49.5755, "accepted": 44, "rejected": 16},
    (199, 60): {"best": 52.0, "final": 53.8714, "accepted": 37, "rejected": 23},
    (162, 60): {"best": 27.7525, "final": 27.8871, "accepted": 41, "rejected": 19},
    (42, 300): {"best": 2.6119, "final": 2.6119, "accepted": 104, "rejected": 196},
}
GOLD_FACTS = {  # reference-only: needs the move log
    (42, 60): {"best_move": 45, "draws": 265, "proposed_kinds": {"better": 11, "worse": 25, "free": 24},
               "accepted_kinds": {"better": 11, "worse": 9, "free": 24}, "clamped": 10, "clamped_accepted": 5,
               "clamped_moves": [1, 2, 4, 13, 20, 22, 27, 37, 50, 60], "pads_proposed": 20, "pads_accepted": 17,
               "peak": 58.5768, "T_end": 0.0732},
    (199, 60): {"best_move": None, "draws": 270, "accepted_kinds": {"better": 8, "worse": 7, "free": 22},
                "peak": 60.4621, "clamped": 17},
    (162, 60): {"best_move": 59, "draws": 264, "accepted_kinds": {"better": 16, "worse": 5, "free": 20},
                "peak": 55.1857, "clamped": 3},
    (42, 300): {"best_move": 278, "draws": 1405},
}
GOLD_POSITIONS_42_60 = {  # best positions, seed 42, 60 moves
    "A": (0.0, 1.9895), "B": (7.2157, 0.4666), "C": (2.7113, 6.0676),
    "D": (5.7591, 9.0), "E": (4.0, 4.9394), "F": (1.9499, 5.2174),
}
GOLD_HISTORY_42 = [(52.0, 3.0), (57.3457, 1.6158), (56.5864, 0.8703), (56.8698, 0.4688),
                   (53.3553, 0.2525), (49.5755, 0.136), (49.5755, 0.0732)]
GOLD_PRNG = {42: [0.6011, 0.4483, 0.8525, 0.6697, 0.1748], 1: [0.6271, 0.0027, 0.5274]}
GOLD_COST = {"starter": 52.0, "golden": 14.0, "overlap": 24.0, "one point": 0.0}
GOLD_OVERFLOW = {"starter": 2, "sa seed 42 best": 2, "sa 300 moves best": 4, "golden": 2, "overlap": 3, "one point": 5}
GOLD_SEEDS = {"min": (13.7292, 134), "max": (52.0, 199), "median": 36.0428, "better_than_42": 197,
              "worse_than_42": [62, 199], "never_improved": [199], "final_above_best": [6, 13, 54, 102, 118, 149, 156, 162, 199],
              "top5": [(134, 13.7292), (114, 15.0626), (75, 15.5504), (84, 20.1749), (60, 20.692)]}
# a faithful-looking port that breaks ONE written rule: (best, accepted, rejected, draws)
GOLD_FLAWS = {
    "strict": ("accept only when delta < 0, else draw (the old pseudocode wording)", (35.3928, 46, 14, 282)),
    "draw_early": ("draw u on every move, even when delta <= 0", (35.7737, 41, 19, 300)),
    "no_clamp": ("no walls at -1..9", (42.4127, 39, 21, 266)),
    "int_step": ("integer step 1 instead of 0.5..1.5", (39.0, 34, 26, 208)),
    "cool_first": ("cool T before the test (NOT detected by the golden: same run)", (49.5755, 44, 16, 265)),
}
GOLD_REVERSED_CELLS = (40.7859, 39, 21)
GOLD_FREEZE_AD = (51.0964, 45, 15)  # exploration, not golden


# ---------------- report ----------------
class Report:
    def __init__(self):
        self.ok = self.fail = self.skip = 0

    def add(self, ok, label, detail=""):
        if ok is None:
            self.skip += 1
            print(f"SKIP  {label}   {detail}".rstrip())
        elif ok:
            self.ok += 1
            print(f"PASS  {label}")
        else:
            self.fail += 1
            print(f"FAIL  {label}   {detail}".rstrip())

    def close(self):
        print(f"\n{self.ok} PASS, {self.fail} FAIL, {self.skip} SKIP")
        return 1 if self.fail else 0


def r4(x):
    return None if x is None else round(x, 4)


def load_impl(path):
    spec = importlib.util.spec_from_file_location("learner_sa", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return {"prng": getattr(mod, "mulberry32", None), "hpwl": getattr(mod, "total_hpwl", None),
            "sa": getattr(mod, "sa_place", None)}


def safe(rep, label, fn, *args, **kw):
    try:
        return fn(*args, **kw)
    except Exception as exc:  # a learner's bug must be a FAIL line, not a traceback
        rep.add(False, label, f"raised {type(exc).__name__}: {exc}")
        return None


# ---------------- checks that work on any implementation (reference or --impl) ----------------
def impl_checks(rep, fns, inst, show=False):
    S, C, N = inst["starter"], inst["cells"], inst["nets"]
    call = lambda cells=C, nets=N, start=S, **kw: fns["sa"](clone(start), list(cells), [list(n) for n in nets], **kw)

    # mulberry32
    if fns["prng"] is None:
        rep.add(None, "mulberry32(seed): first draws of seeds 42 and 1", "(function not defined yet)")
    else:
        for seed, want in GOLD_PRNG.items():
            g = safe(rep, f"mulberry32({seed})", fns["prng"], seed)
            if g is None:
                continue
            got = [r4(g()) for _ in want]
            rep.add(got == want, f"mulberry32({seed}) first {len(want)} draws {want} (no warm-up)", f"got {got}")

    # HPWL
    if fns["hpwl"] is None:
        rep.add(None, "total_hpwl: starter 52, golden 14, overlap 24, one point 0", "(function not defined yet)")
    else:
        one = {c: {"x": 4.0, "y": 4.0} for c in C}
        cases = {"starter": S, "golden": inst["golden"], "overlap": inst["overlap"], "one point": one}
        got = {k: safe(rep, f"total_hpwl {k}", fns["hpwl"], N, v) for k, v in cases.items()}
        rep.add(all(got[k] is not None and abs(got[k] - GOLD_COST[k]) < 1e-9 for k in cases),
                "total_hpwl: " + ", ".join(f"{k} {GOLD_COST[k]:g}" for k in cases), f"got {got}")

    if fns["sa"] is None:
        rep.add(None, "sa_place: the golden runs, 200 seeds, cell order", "(function not defined yet)")
        return

    # golden runs
    for (seed, moves), want in GOLD_RUNS.items():
        r = safe(rep, f"sa_place seed {seed}, {moves} moves", call, seed=seed, moves=moves)
        if r is None:
            continue
        got = {"best": r4(r["hpwl"]), "accepted": r["accepted"], "rejected": r["rejected"],
               "final": r4(r.get("final_hpwl"))}
        if "final_hpwl" not in r:
            want = {k: v for k, v in want.items() if k != "final"}
            got.pop("final")
        rep.add(got == want, f"seed {seed}, {moves} moves: best {want['best']}, {want['accepted']} accepted / "
                f"{want['rejected']} rejected" + (f", final {want['final']}" if "final" in want else ""), f"got {got}")
        if (seed, moves) == (42, 60):
            pos = {k: (r4(v["x"]), r4(v["y"])) for k, v in r["positions"].items()}
            rep.add(pos == GOLD_POSITIONS_42_60, "seed 42: the BEST positions are returned (not the final ones)",
                    f"got {pos}")
            if r["positions"] and fns["hpwl"]:
                h = safe(rep, "hpwl of best positions", fns["hpwl"], N, r["positions"])
                rep.add(h is not None and abs(h - r["hpwl"]) < 1e-9, "seed 42: hpwl equals total_hpwl of the returned positions")

    # input untouched, 0 moves
    s2, c2, n2 = clone(S), list(C), [list(n) for n in N]
    r = safe(rep, "sa_place does not change its inputs", fns["sa"], s2, c2, n2, seed=42)
    rep.add(s2 == S and c2 == C and n2 == N, "sa_place does not change the positions, cells or nets you pass")
    r0 = safe(rep, "moves=0", call, seed=42, moves=0)
    if r0 is not None:
        rep.add(r0["hpwl"] == 52 and r0["accepted"] == 0 and r0["rejected"] == 0 and r0["positions"] == S,
                "moves=0 returns the start: best 52, 0 accepted, 0 rejected")

    # the order of the inputs
    r = safe(rep, "reversed cell order", call, cells=list(reversed(C)), seed=42)
    if r is not None:
        got = (r4(r["hpwl"]), r["accepted"], r["rejected"])
        rep.add(got == GOLD_REVERSED_CELLS,
                f"cells in order F..A: a DIFFERENT run {GOLD_REVERSED_CELLS} (the order of the cell list is part of the spec)",
                f"got {got}")
    r = safe(rep, "reversed nets", call, nets=list(reversed(N)), seed=42)
    if r is not None:
        rep.add((r4(r["hpwl"]), r["accepted"], r["rejected"]) == (49.5755, 44, 16),
                "nets in reverse order: same run (49.5755, 44 / 16)", f"got {(r4(r['hpwl']), r['accepted'], r['rejected'])}")
    r = safe(rep, "reversed positions dict", call, start=dict(reversed(list(S.items()))), seed=42)
    if r is not None:
        rep.add((r4(r["hpwl"]), r["accepted"], r["rejected"]) == (49.5755, 44, 16),
                "positions dict in reverse key order: same run (49.5755, 44 / 16)",
                f"got {(r4(r['hpwl']), r['accepted'], r['rejected'])}")

    # 200 seeds
    res = {}
    for s in range(1, 201):
        r = safe(rep, f"seed {s}", call, seed=s)
        if r is None:
            return
        res[s] = (r["hpwl"], r.get("final_hpwl"))
    bests = sorted((v[0], s) for s, v in res.items())
    mn, mx = bests[0], bests[-1]
    med = statistics.median(v for v, _ in bests)
    got = {"min": (r4(mn[0]), mn[1]), "max": (r4(mx[0]), mx[1]), "median": r4(med)}
    want = {k: GOLD_SEEDS[k] for k in ("min", "max", "median")}
    rep.add(got == want, f"seeds 1..200: min {want['min'][0]} (seed {want['min'][1]}), max {want['max'][0]} "
            f"(seed {want['max'][1]}), median {want['median']}", f"got {got}")
    b42 = res[42][0]
    better = sum(v[0] < b42 for v in res.values())
    rep.add(better == GOLD_SEEDS["better_than_42"] and sorted(s for s, v in res.items() if v[0] > b42) == GOLD_SEEDS["worse_than_42"],
            f"seeds 1..200: {GOLD_SEEDS['better_than_42']} seeds beat seed 42; only seeds 62 and 199 are worse", f"got {better}")
    if all(v[1] is not None for v in res.values()):
        above = [s for s, v in res.items() if v[1] > v[0] + 1e-12]
        rep.add(above == GOLD_SEEDS["final_above_best"],
                f"seeds 1..200: final is worse than best on 9 seeds: {GOLD_SEEDS['final_above_best']}", f"got {above}")


# ---------------- checks that need the move log (reference only) ----------------
def ref_checks(rep, inst, show=False):
    S, C, N = inst["starter"], inst["cells"], inst["nets"]
    runs = {k: run_sa(S, C, N, seed=k[0], moves=k[1]) for k in GOLD_RUNS}

    for key, want in GOLD_FACTS.items():
        f = facts(runs[key])
        got = {k: (r4(f[k]) if isinstance(f[k], float) else f[k]) for k in want}
        rep.add(got == want, f"seed {key[0]}, {key[1]} moves: " + ", ".join(f"{k} {want[k]}" for k in want if k != "clamped_moves"),
                f"got {got}")
    f = facts(runs[(42, 60)])
    rep.add(f["accepted_kinds"]["better"] + f["accepted_kinds"]["worse"] + f["accepted_kinds"]["free"] == 44,
            "seed 42: 44 accepted = 11 better + 9 worse + 24 free (accepted is not progress)")
    log = runs[(42, 60)]["log"]
    rep.add(all(x["kind"] == "worse" for x in log if not x["accepted"]), "seed 42: every rejected move was a worsening one")
    rep.add(all(x["u"] is None for x in log if x["dHpwl"] <= 0) and all(x["u"] is not None for x in log if x["dHpwl"] > 0),
            "seed 42: a number u is drawn only when delta > 0 (265 = 4 x 60 + 25)")
    rep.add(sum(x["newBest"] for x in log) >= 1 and log[44]["newBest"] and not any(x["newBest"] for x in log[45:]),
            "seed 42: the best is reached at move 45 and never beaten after it")
    h = [(r4(x["hpwl"]), r4(x["T"])) for x in runs[(42, 60)]["history"]]
    rep.add(h == GOLD_HISTORY_42, "seed 42: history (HPWL, T) at moves 0, 10, ..., 60", f"got {h}")
    f1 = log[0]
    rep.add((f1["cell"], f1["axis"], r4(f1["proposed"]), f1["to"]["x"], f1["clamped"], f1["accepted"]) == ("D", "x", 9.1697, 9.0, True, True),
            "seed 42, move 1: D goes right to x = 9.1697 and stops at the wall x = 9")
    r199 = runs[(199, 60)]
    rep.add(r199["best_move"] is None and r199["positions"] == S, "seed 199: never beats the start; the best positions ARE the start")
    rep.add(runs[(199, 60)]["final"] > 52 and runs[(162, 60)]["final"] > runs[(162, 60)]["best"],
            "seeds 199 and 162: the final placement is worse than the best one")

    # pitfalls: one broken rule at a time
    for name, (why, want) in GOLD_FLAWS.items():
        r = run_sa(S, C, N, flaws={name})
        got = (r4(r["best"]), r["accepted"], r["rejected"], r["draws"])
        rep.add(got == want, f"pitfall {name}: {why} -> {want[0]} ({want[1]} / {want[2]}, {want[3]} draws)", f"got {got}")
    rep.add(r4(run_sa(S, C, N, flaws={'strict'})["best"]) != 49.5755, "pitfall strict: the old wording '<0' does NOT reproduce 49.6")

    # freeze: exploration only
    r = run_sa(S, C, N, freeze=("A", "D"))
    got = (r4(r["best"]), r["accepted"], r["rejected"])
    rep.add(got == GOLD_FREEZE_AD, f"--freeze A,D (exploration, not golden): {GOLD_FREEZE_AD[0]} ({GOLD_FREEZE_AD[1]} / {GOLD_FREEZE_AD[2]})",
            f"got {got}")
    rep.add(all(x["cell"] not in ("A", "D") for x in r["log"]) and r["positions"]["A"] == S["A"] and r["positions"]["D"] == S["D"],
            "--freeze A,D: the pads never move; the moving cell is picked among B, C, E, F in order")

    # cost and bins
    one = {c: {"x": 4.0, "y": 4.0} for c in C}
    cost = {"starter": S, "golden": inst["golden"], "overlap": inst["overlap"], "one point": one}
    rep.add({k: total_hpwl(N, v) for k, v in cost.items()} == GOLD_COST,
            "cost: starter 52, golden 14, overlap 24, all six cells on one point 0")
    over = {"starter": S, "sa seed 42 best": runs[(42, 60)]["positions"], "sa 300 moves best": runs[(42, 300)]["positions"],
            "golden": inst["golden"], "overlap": inst["overlap"], "one point": one}
    got = {k: density_overflow(v)[1] for k, v in over.items()}
    rep.add(got == GOLD_OVERFLOW, "bins (2x2, capacity 1): overflow " + ", ".join(f"{k} {v}" for k, v in GOLD_OVERFLOW.items()),
            f"got {got}")
    rep.add(runs[(42, 300)]["best"] < total_hpwl(N, inst["golden"]), "300 moves reach 2.61: below the 'golden 14', which is no floor")

    # PRNG facts
    try:
        sys.path.insert(0, str(COMMON))
        import solvers  # noqa: E402
        import placementutil  # noqa: E402
        g = placementutil.load_place(COMMON / "tiny_place.json")
        bad = []
        for s in range(1, 201):
            a = solvers.sa_place(g["starter"], g["cells"], g["nets"], seed=s)
            b = sa_place(S, C, N, seed=s)
            if not (a["hpwl"] == b["hpwl"] and a["final_hpwl"] == b["final_hpwl"] and a["accepted"] == b["accepted"]
                    and a["rejected"] == b["rejected"] and a["positions"] == b["positions"]):
                bad.append(s)
        rep.add(not bad, "reference equals sa_place of common/solvers.py on seeds 1..200 (best, final, counts, positions)",
                f"differs at {bad[:10]}")
    except ImportError:
        rep.add(None, "reference vs common/solvers.py", "(common/ not found)")
    except Exception as exc:
        rep.add(False, "reference vs common/solvers.py", f"{type(exc).__name__}: {exc}")

    # the committed example files are the output of this checker
    for name, seed, moves in TRACE_FILES:
        p = HERE / name
        if not p.exists():
            rep.add(None, f"examples/{name}", "(file not written yet: --write-examples)")
            continue
        head, lg = build_trace(inst, seed, moves)
        rep.add(p.read_text() == dump_trace(head, lg), f"examples/{name} is exactly what --json --seed {seed} --moves {moves} prints")
    p = HERE / SEEDS_FILE
    if p.exists():
        rep.add(p.read_text() == seeds_json(inst), f"examples/{SEEDS_FILE} is exactly what the checker computes (200 seeds)")
    else:
        rep.add(None, f"examples/{SEEDS_FILE}", "(file not written yet: --write-examples)")


# ---------------- --vs-node ----------------
def node_answer(request):
    res = subprocess.run(["node", str(NODE_HELPER), CORE_JS.as_uri()], input=json.dumps(request),
                         capture_output=True, text=True, check=True)
    return json.loads(res.stdout)


def close(a, b):  # exp() of V8 and of libm may differ in the last bit: only `p` gets this tolerance
    return a == b or (a is not None and b is not None and abs(a - b) <= 1e-12 * max(1.0, abs(a)))


def vs_node(inst):
    rep = Report()
    if not CORE_JS.exists() or not NODE_HELPER.exists():
        print("SKIP  --vs-node: platform/assets/placement-core.js or examples/sa_node.mjs not found")
        return 0
    S, C, N = inst["starter"], inst["cells"], inst["nets"]
    one = {c: {"x": 4.0, "y": 4.0} for c in C}
    shapes = [S, inst["golden"], inst["overlap"], one]
    runs = [{"seed": s, "moves": 60} for s in range(1, 201)]
    traces = [(n, s, m) for n, s, m in TRACE_FILES]
    runs += [{"seed": s, "moves": m, "log": True} for _, s, m in traces]
    try:
        ans = node_answer({"runs": runs, "hpwl": shapes, "density": shapes})
    except (OSError, subprocess.CalledProcessError) as exc:
        print(f"SKIP  --vs-node: node failed ({exc})")
        return 0
    rep.add(all(r["sameAsSaPlace"] for r in ans["runs"]),
            "the helper's move-by-move copy of the loop equals the real saPlace (204 runs: best, final, counts, positions)")
    rep.add(ans["hpwl"] == [total_hpwl(N, p) for p in shapes], "totalHpwl: starter, golden, overlap, one point are equal in JS and Python")
    rep.add([d["overflow"] for d in ans["density"]] == [density_overflow(p)[1] for p in shapes], "densityBins overflow equals the checker's (4 placements)")

    bad = []
    for r in ans["runs"][:200]:
        m = run_sa(S, C, N, seed=r["seed"], moves=60)
        if not (m["best"] == r["best"] and m["final"] == r["final"] and m["accepted"] == r["accepted"] and
                m["rejected"] == r["rejected"] and m["positions"] == r["positions"] and m["best_move"] == r["bestMove"] and
                m["draws"] == r["draws"] and m["final_positions"] == r["finalPositions"]):
            bad.append(r["seed"])
    rep.add(not bad, "seeds 1..200: best, best positions, move of the best, final, final positions, accepted, rejected and the number of draws are bit-identical in JS and Python",
            f"differs at {bad[:10]}")

    for (name, seed, moves), r in zip(traces, ans["runs"][200:]):
        m = run_sa(S, C, N, seed=seed, moves=moves)
        diff = []
        for a, b in zip(m["log"], r["log"]):
            for k, v in b.items():
                if k == "p":
                    ok = close(a[k], v)
                else:
                    ok = a[k] == v
                if not ok:
                    diff.append((a["move"], k))
        rep.add(not diff and len(m["log"]) == len(r["log"]),
                f"{name}: {moves} moves x {len(r["log"][0])} fields equal in JS and Python (p within 1e-12)", f"differs at {diff[:5]}")
        p = HERE / name
        if p.exists():
            disk = json.loads(p.read_text())["moves_list"]
            same = len(disk) == len(r["log"]) and all(
                all((close(x[k], v) if k == "p" else x[k] == v) for k, v in y.items()) for x, y in zip(disk, r["log"]))
            rep.add(same, f"examples/{name} on disk equals what node prints for the same run")
        else:
            rep.add(None, f"examples/{name}", "(file not written yet)")
    p = HERE / SEEDS_FILE
    if p.exists():
        disk = json.loads(p.read_text())["seeds"]
        same = len(disk) == 200 and all(
            d["seed"] == r["seed"] and d["best"] == r["best"] and d["best_move"] == r["bestMove"] and d["final"] == r["final"]
            and d["accepted"] == r["accepted"] and d["rejected"] == r["rejected"] for d, r in zip(disk, ans["runs"][:200]))
        rep.add(same, f"examples/{SEEDS_FILE} on disk equals node: per seed best, move of the best, final, accepted, rejected")
    else:
        rep.add(None, f"examples/{SEEDS_FILE}", "(file not written yet)")
    return rep.close()


# ---------------- --show ----------------
def show_rules():
    doc = __doc__
    a = doc.index("THE RULES")
    b = doc.index("Standard library only")
    print(doc[a:b].rstrip())
    print()


def fnum(x, w=7, d=3):
    return "      -" if x is None else f"{x:{w}.{d}f}"


def show_run(inst, seed, moves, freeze):
    r = run_sa(inst["starter"], inst["cells"], inst["nets"], seed=seed, moves=moves, freeze=freeze)
    f = facts(r)
    title = f"seed {seed}, {moves} moves" + (f", FROZEN {','.join(freeze)} (exploration, not golden)" if freeze else "")
    print(f"=== {title} ===")
    print(f"start HPWL {total_hpwl(inst['nets'], inst['starter']):g}; nets at the start: "
          + ", ".join(f"{''.join(n)} {net_hpwl(n, inst['starter']):g}" for n in inst["nets"]))
    print(" move cell ax    from ->     to   cl  dHPWL      T      p      u  verdict           HPWL    best")
    for x in r["log"]:
        verdict = ("ACCEPT better" if x["kind"] == "better" else "ACCEPT free  " if x["kind"] == "free"
                   else "ACCEPT worse " if x["accepted"] else "reject       ")
        nb = " NEW BEST" if x["newBest"] else ""
        print(f" {x['move']:4d}  {x['cell']}   {x['axis']}  {x['from'][x['axis']]:7.3f} -> {x['to'][x['axis']]:7.3f}  "
              f"{'*' if x['clamped'] else ' '} {x['dHpwl']:7.3f} {x['T']:6.3f} {x['p']:6.3f} {fnum(x['u'], 6)}  {verdict}  "
              f"{x['hpwl']:7.3f} {x['best']:7.3f}{nb}")
    print(f"  (* = the walls at {WALL_MIN:g} and {WALL_MAX:g} stopped the cell)")
    print(f"best HPWL {r['best']:.4f} at move {r['best_move'] if r['best_move'] else 'none (never beat the start)'}; "
          f"final HPWL {r['final']:.4f}; accepted {r['accepted']}, rejected {r['rejected']}; {r['draws']} random numbers drawn")
    print(f"proposals: {f['proposed_kinds']}; accepted: {f['accepted_kinds']}")
    print(f"clamped {f['clamped']} (accepted {f['clamped_accepted']}), at moves {f['clamped_moves']}")
    print(f"pads A and D: {f['pads_proposed']} proposed, {f['pads_accepted']} accepted; peak HPWL {f['peak']:.4f}; T after the last move {f['T_end']:.4f}")
    print("history (HPWL, T) every 10 moves: " + ", ".join(f"({h['hpwl']:.2f}, {h['T']:.3f})" for h in r["history"]))
    print("best positions: " + ", ".join(f"{k} ({v['x']:.3f}, {v['y']:.3f})" for k, v in r["positions"].items()))
    print("final positions: " + ", ".join(f"{k} ({v['x']:.3f}, {v['y']:.3f})" for k, v in r["final_positions"].items()))
    print()


def show_tables(inst):
    S, C, N = inst["starter"], inst["cells"], inst["nets"]
    print("=== random numbers (mulberry32, no warm-up) ===")
    for seed in (42, 1, 199, 162):
        g = mulberry32(seed)
        print(f"seed {seed}: " + ", ".join(f"{g():.4f}" for _ in range(5)))
    g = mulberry32(42)
    r1, r2, r3, r4_ = g(), g(), g(), g()
    print(f"seed 42, move 1: r1 {r1:.4f} -> cell {C[int(r1 * 6)]}; r2 {r2:.4f} -> axis {'x' if r2 < 0.5 else 'y'}; "
          f"r3 {r3:.4f} -> sign {'-' if r3 < 0.5 else '+'}; r4 {r4_:.4f} -> size {0.5 + r4_:.4f}")
    print()
    print("=== accept probability e^(-delta / T) ===")
    Ts = [3.0, 3 * 0.94 ** 10, 3 * 0.94 ** 30, 3 * 0.94 ** 60]
    print("delta \\ T  " + "  ".join(f"{t:7.4f}" for t in Ts))
    for d in (0.0, 0.5, 1.0, 3.0, 6.0):
        print(f"{d:7.1f}    " + "  ".join(f"{accept_prob(d, t):7.4f}" for t in Ts))
    print()
    print("=== golden runs (seeds, moves) ===")
    for (seed, moves) in GOLD_RUNS:
        r = run_sa(S, C, N, seed=seed, moves=moves)
        print(f"seed {seed:3d} x {moves:3d}: best {r['best']:.4f} (move {r['best_move']}), final {r['final']:.4f}, "
              f"accepted {r['accepted']}, rejected {r['rejected']}, draws {r['draws']}")
    print()
    print("=== 200 seeds, 60 moves ===")
    rows = seeds_table(inst)
    b = sorted((x["best"], x["seed"]) for x in rows)
    print(f"min {b[0][0]:.4f} (seed {b[0][1]}), max {b[-1][0]:.4f} (seed {b[-1][1]}), median {statistics.median(v for v, _ in b):.4f}")
    print("five best: " + ", ".join(f"seed {s}: {v:.4f}" for v, s in b[:5]))
    b42 = rows[41]["best"]
    print(f"beat seed 42 ({b42:.4f}): {sum(x['best'] < b42 for x in rows)}; worse than seed 42: "
          + ", ".join(f"seed {x['seed']}: {x['best']:.4f}" for x in rows if x["best"] > b42))
    print(f"never beat the start: seeds {[x['seed'] for x in rows if x['best_move'] is None]}")
    above = [x for x in rows if x["final"] > x["best"] + 1e-12]
    print(f"final worse than best on {len(above)} seeds: " + ", ".join(f"{x['seed']} ({x['best']:.2f} -> {x['final']:.2f})" for x in above))
    print()
    print("=== a faithful-looking port that breaks ONE rule (seed 42, 60 moves) ===")
    for name, (why, _) in GOLD_FLAWS.items():
        r = run_sa(S, C, N, flaws={name})
        print(f"{name:11s} best {r['best']:.4f}, final {r['final']:.4f}, {r['accepted']} / {r['rejected']}, {r['draws']} draws   <- {why}")
    r = run_sa(S, list(reversed(C)), N)
    print(f"cells F..A  best {r['best']:.4f}, {r['accepted']} / {r['rejected']}   <- the order of the cell list is part of the spec")
    print()
    print("=== cost and bins ===")
    one = {c: {"x": 4.0, "y": 4.0} for c in C}
    r300 = run_sa(S, C, N, moves=300)
    r42 = run_sa(S, C, N)
    for name, pos in (("starter", S), ("golden", inst["golden"]), ("overlap", inst["overlap"]), ("one point (4,4)", one),
                      ("SA seed 42 best", r42["positions"]), ("SA 300 moves best", r300["positions"])):
        counts, over = density_overflow(pos)
        print(f"{name:18s} HPWL {total_hpwl(N, pos):8.4f}   2x2 bins {counts}   overflow {over}")
    r1000 = run_sa(S, C, N, moves=1000)
    print(f"1000 moves: best {r1000['best']:.4f}, {r1000['accepted']} / {r1000['rejected']}")
    fz = run_sa(S, C, N, freeze=("A", "D"))
    print(f"--freeze A,D (exploration, not golden): best {fz['best']:.4f}, {fz['accepted']} / {fz['rejected']}")
    print()


# ---------------- main ----------------
def main() -> int:
    ap = argparse.ArgumentParser(description="Golden self-check for SA placement (see the module docstring).")
    ap.add_argument("--show", action="store_true", help="print the rules, the chosen run move by move, and every table")
    ap.add_argument("--impl", metavar="FILE", help="check the functions in FILE (mulberry32, total_hpwl, sa_place)")
    ap.add_argument("--vs-node", action="store_true", help="compare with saPlace in platform/assets/placement-core.js")
    ap.add_argument("--json", action="store_true", help="print the run (header + every move) as JSON")
    ap.add_argument("--write-examples", action="store_true", help="write examples/trace_*.json and seeds_1_200.json")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--moves", type=int, default=60)
    ap.add_argument("--freeze", default="", help="cells that never move, e.g. A,D (exploration, not golden)")
    args = ap.parse_args()
    inst = load_instance()
    freeze = tuple(c for c in args.freeze.split(",") if c)
    for c in freeze:
        if c not in inst["cells"]:
            ap.error(f"--freeze: unknown cell {c}")
    if args.vs_node:
        return vs_node(inst)
    if args.json:
        head, log = build_trace(inst, args.seed, args.moves, freeze)
        sys.stdout.write(dump_trace(head, log))
        return 0
    if args.write_examples:
        for name, seed, moves in TRACE_FILES:
            head, log = build_trace(inst, seed, moves)
            (HERE / name).write_text(dump_trace(head, log))
            print(f"wrote examples/{name}")
        (HERE / SEEDS_FILE).write_text(seeds_json(inst))
        print(f"wrote examples/{SEEDS_FILE}")
        return 0

    if args.show:
        show_rules()
        show_run(inst, args.seed, args.moves, freeze)
        show_tables(inst)

    if args.impl:
        fns = load_impl(args.impl)
        name = args.impl
    else:
        fns = {"prng": mulberry32, "hpwl": total_hpwl, "sa": sa_place}
        name = "reference"
    print(f"checking {name}")
    rep = Report()
    impl_checks(rep, fns, inst, args.show)
    if not args.impl:
        ref_checks(rep, inst, args.show)
    return rep.close()


if __name__ == "__main__":
    sys.exit(main())
