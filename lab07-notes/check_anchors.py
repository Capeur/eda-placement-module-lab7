#!/usr/bin/env python3
"""Check every anchor of LESSON_PLANS.md against transcript.md (lessonlib's own matching).

An anchor is written `word (S8)`, `word#1 (S8)`, `word+1.2 (S8)` (offset ignored) or `two words (S8)`.
Usage: check_anchors.py [--old OLD_TRANSCRIPT]   (with --old: report anchors whose sentence text changed)
"""
import re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
MOD = HERE.parent.parent / "eda-learning-lab7-pl/courses/learn_placement/module02-07-sa-placement"
sys.path.insert(0, str(Path.home() / ".claude/skills/lesson-animator/scripts"))
import lessonlib  # noqa: E402

REPO = MOD.parent.parent.parent
def sents(path):
    return lessonlib.slide_sentences(Path(path), 1, 29, repo=REPO)

plan = (HERE / "LESSON_PLANS.md").read_text()
ALIAS = {"twohundred": "two hundred", "three8": "three"}        # storyboard anchor ids that are not a plain word


def as_word(w):
    w = re.sub(r"[+-]\d+(\.\d+)?$", "", w.strip())  # `accepted+1.2` -> accepted (time offset)
    w = ALIAS.get(w, w)
    m = re.fullmatch(r"([a-z]+)(\d)", w)              # id `returns2` = `returns#2`
    return f"{m.group(1)}#{m.group(2)}" if m else w


anchors = []
# 1) explicit: `word` (S8)
for m in re.finditer(r"`([^`@{}]+?)`\s*\(S(\d+)\)", plan):
    anchors.append((plan.count("\n", 0, m.start()) + 1, as_word(m.group(1)), int(m.group(2))))
# 2) inside a headline bullet "- S11 ..." (and its indented continuation lines): {text@word} and at/from/to `word`
slide = None
for ln, text in enumerate(plan.splitlines(), 1):
    m = re.match(r"- S(\d+) ", text)
    if m:
        slide = int(m.group(1))
    elif not text.startswith("  "):
        slide = None
    if slide is None:
        continue
    text = re.sub(r"`[^`]+`\s*\(S\d+\)", "", text)       # already counted in 1)
    for w in re.findall(r"@([A-Za-z]+\d?)\}", text) + re.findall(r"(?:at|from|to) `([a-z][a-z#0-9 ]*)`", text):
        anchors.append((ln, as_word(w), slide))
new = sents(MOD / "transcript.md")
old = sents(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[1] == "--old" else None
missing = moved = 0
for line, word, slide in anchors:
    a = {"en": word, "slide": slide}
    i = lessonlib.find_anchor_sentence(new, a, "en")
    if i is None:
        missing += 1; print(f"MISSING line {line}: `{word}` (S{slide})"); continue
    if old is not None:
        j = lessonlib.find_anchor_sentence(old, a, "en")
        if j is None or old[j]["text"] != new[i]["text"]:
            moved += 1
            print(f"CHANGED line {line}: `{word}` (S{slide})\n   was: {old[j]['text'] if j is not None else None}\n   now: {new[i]['text']}")
print(f"{len(anchors)} anchors, {missing} missing" + (f", {moved} on a changed sentence" if old else ""))
per = {}
for s in new: per[s["slide"]] = per.get(s["slide"], 0) + 1
print("sentences:", len(new), "per slide:", per)
sys.exit(1 if missing else 0)
