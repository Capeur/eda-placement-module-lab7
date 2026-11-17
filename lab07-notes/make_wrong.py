"""Writes examples/wrong/*.py = ok_impl.py with ONE written rule broken. Run from anywhere:
   python3 make_wrong.py <module>/examples/wrong"""
import sys
from pathlib import Path

src = (Path(__file__).parent / "ok_impl.py").read_text()
out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
head = '"""WRONG on purpose: {why}. sa_place_check.py --impl must report FAIL on it."""\n'
body = src.split('"""', 2)[2]  # drop the ok_impl docstring
variants = {
    "strict_less.py": ("accepts only when delta < 0 (the old pseudocode), so delta = 0 draws a number: 35.393 instead of 49.576",
                       [("if delta <= 0 or rand() < math.exp(-delta / T):",
                         "if delta < 0 or rand() < math.exp(-delta / T):")]),
    "no_clamp.py": ("no walls at -1 and 9: 42.413", [("        for k in (\"x\", \"y\"):\n            trial[cell][k] = max(-1.0, min(9.0, trial[cell][k]))\n", "")]),
    "draw_every_move.py": ("draws u on every move, even when delta <= 0: 35.774",
                           [("        if delta <= 0 or rand() < math.exp(-delta / T):",
                             "        u = rand()\n        if delta <= 0 or u < math.exp(-delta / T):")]),
}
for name, (why, edits) in variants.items():
    text = body
    for a, b in edits:
        assert a in text, (name, a)
        text = text.replace(a, b)
    (out / name).write_text(head.format(why=why) + text.lstrip("\n"))
    print("wrote", out / name)
