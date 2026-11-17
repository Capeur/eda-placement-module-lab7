#!/usr/bin/env python3
"""Stage 3 (Lab 07): check every number the transcript says against the checker's own output.

    python3 -B stage3_facts.py [<module dir>]

Reads examples/trace_*.json and seeds_1_200.json (written by sa_place_check.py --write-examples, proven equal to
node by --vs-node) and the accept-probability formula. A number "said" with k decimals is compared after rounding
to k decimals, the same rule as the lesson engine's claims. Exit 1 on any FAIL.
"""
import json
import math
import sys
from pathlib import Path

MOD = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2] / \
    "eda-learning-lab7-pl/courses/learn_placement/module02-07-sa-placement"
EX = MOD / "examples"
fails = 0


def load(name):
    return json.loads((EX / name).read_text())


def said(slide, text, got, want, nd=None):
    global fails
    if isinstance(want, (bool, str, list, tuple)) or want is None:
        ok = got == want
    else:
        nd = nd if nd is not None else (len(str(want).split(".")[1]) if "." in str(want) else 0)
        ok = round(got, nd) == round(want, nd)
    fails += not ok
    print(f"{'PASS' if ok else 'FAIL'}  slide {slide:>2}  {text:<62} got {got!r}")


def hpwl(pos, nets):
    t = 0.0
    for n in nets:
        xs = [pos[c]["x"] for c in n]
        ys = [pos[c]["y"] for c in n]
        t += max(xs) - min(xs) + max(ys) - min(ys)
    return t


r42, r199, r162, r300 = (load(f) for f in ("trace_seed42_60.json", "trace_seed199_60.json",
                                           "trace_seed162_60.json", "trace_seed42_300.json"))
seeds = load("seeds_1_200.json")["seeds"]
M = lambda r, k: r["moves_list"][k - 1]  # noqa: E731
nets = r42["nets"]
nl = [hpwl(r42["start"], [n]) for n in nets]
assert nl == list(r42["net_hpwl_start"].values() if isinstance(r42["net_hpwl_start"], dict) else r42["net_hpwl_start"]), nl

# Part 1
said(1, "six cells", len(r42["cells"]), 6)
said(2, "six nets", len(nets), 6)
said(4, "four nets measure eight each", sorted(nl)[1:5], [8.0, 8.0, 8.0, 8.0])
said(4, "net A,B,C,D measures sixteen", nl[[sorted(n) for n in nets].index(["A", "B", "C", "D"])], 16)
said(4, "net E,F measures four", nl[[sorted(n) for n in nets].index(["E", "F"])], 4)
said(4, "wirelength fifty-two", r42["hpwl_start"], 52)
said(6, "first move: wires three longer", M(r42, 1)["dHpwl"], 3)
# Part 2
m1 = M(r42, 1)
said(8, "move 1 picks D", m1["cell"], "D")
said(8, "move 1 goes right (x, +)", (m1["axis"], m1["to"]["x"] > m1["from"]["x"]), ("x", True))
said(8, "move 1: the wall stops it", m1["clamped"], True)
said(8, "move 1: three longer", m1["dHpwl"], 3)
said(9, "move 1: chance thirty-seven percent", 100 * m1["p"], 37)
said(9, "move 1: dice zero point one seven", m1["u"], 0.17)
said(9, "move 1: accepted", m1["accepted"], True)
m2 = M(r42, 2)
said(10, "move 2: D against the wall again", (m2["cell"], m2["clamped"]), ("D", True))
said(10, "move 2: no wire changes (free)", (m2["dHpwl"], m2["kind"]), (0.0, "free"))
said(10, "move 2: accepted, no dice", (m2["accepted"], m2["u"]), (True, None))
for d, pc in ((1, 72), (3, 37), (6, 14)):
    said(11, f"T=3: {d} longer gets {pc} percent", 100 * math.exp(-d / r42["t0"]), pc)
said(11, "temperature starts at three", r42["t0"], 3)
m13 = M(r42, 13)
said(12, "later: temperature one point four (move 13)", m13["T"], 1.4)
said(12, "move 13: D into a wall, three longer", (m13["cell"], m13["clamped"], m13["dHpwl"]), ("D", True, 3.0))
# Part 3
said(13, "move 13: chance twelve percent", 100 * m13["p"], 12)
said(13, "move 13: dice zero point zero nine", m13["u"], 0.09)
said(13, "move 13: passes", m13["accepted"], True)
said(13, "wires reach fifty-eight point six", m13["hpwl"], 58.6)
said(13, "the longest of the run (peak)", r42["peak"], m13["hpwl"], 9)
said(14, "ends near zero point zero seven", r42["moves_list"][-1]["T"] * r42["cool"], 0.07)
said(15, "sixty moves", r42["moves"], 60)
said(15, "move forty-five reaches forty-nine point six", (r42["best_move"], round(r42["best"], 1)), (45, 49.6))
m60 = M(r42, 60)
said(16, "last move: A into a wall, three longer", (m60["cell"], m60["clamped"], m60["dHpwl"]), ("A", True, 3.0))
said(16, "below zero point one", m60["T"] < 0.1, True)
said(16, "chance zero, rejected", (round(m60["p"], 2), m60["accepted"]), (0.0, False))
said(17, "accepted forty-four, rejected sixteen", (r42["accepted"], r42["rejected"]), (44, 16))
k = r42["accepted_by_kind"]
said(17, "eleven shorter, nine longer, twenty-four free", (k["better"], k["worse"], k["free"]), (11, 9, 24))
# Part 4
said(19, "seed 42: last wires = shortest", r42["final"] == r42["best"], True)
said(20, "seed 199 climbs above sixty", r199["peak"] > 60, True)
said(20, "seed 199 never beats fifty-two", (r199["best"], r199["best_move"]), (52.0, None))
said(20, "seed 199 ends at fifty-three point nine", r199["final"], 53.9)
said(21, "seed 162 best at move fifty-nine", r162["best_move"], 59)
said(21, "seed 162 best twenty-seven point eight", r162["best"], 27.8)
m = M(r162, 60)
said(21, "seed 162 last move longer, dice lets it pass", (m["kind"], m["accepted"], m["u"] is not None), ("worse", True, True))
said(21, "seed 162 ends at twenty-seven point nine", r162["final"], 27.9)
said(22, "seed 199 returns the start", r199["best_positions"] == r199["start"], True)
# Part 5
b = sorted(s["best"] for s in seeds)
said(24, "two hundred seeds, sixty moves", (len(seeds), r42["moves"]), (200, 60))
said(24, "seed 42 one of the worst (3rd worst)", sorted(b, reverse=True).index(r42["best"]) + 1, 3)
said(24, "from thirteen point seven", b[0], 13.7)
said(24, "to fifty-two", b[-1], 52)
said(24, "middle result about thirty-six", (b[99] + b[100]) / 2, 36)
said(24, "one hundred ninety-seven beat seed 42", sum(x < r42["best"] for x in b), 197)
said(25, "three hundred moves", r300["moves"], 300)
said(25, "first sixty moves the same", r300["moves_list"][:60] == r42["moves_list"], True)
said(25, "down to two point six", r300["best"], 2.6)
said(29, "browser lab: 49.6, 44 accepted, 16 rejected", (round(r42["best"], 1), r42["accepted"], r42["rejected"]),
     (49.6, 44, 16))
print(f"\n{'all PASS' if not fails else f'{fails} FAIL'}")
sys.exit(1 if fails else 0)
