#!/usr/bin/env python3
"""Subtitles in a language that has no voice (e.g. Chinese): the sentences of a translated transcript, one per
spoken sentence, for build_lesson.py --subs.

  python3 subs_build.py --transcript i18n/zh/<module>/transcript.md --slides 1-6 --lang zh \\
      --against build/lessons/part-1/timing-en.json --out build/lessons/part-1/subs-zh.json

The translated transcript keeps the "## Slide N — title" headings and has **the same number of sentences in every
slide** as the voiced language (--against checks it and lists the slides that differ). A language that has a voice
needs no subs file: give build_lesson.py its timing file (--subs fr=build/.../timing-fr.json).
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lessonlib import load_json, parse_range, slide_sentences  # noqa: E402


def compare(mine: list[dict], ref: list[dict], lang: str, ref_name: str) -> list[str]:
    a, b = Counter(s["slide"] for s in mine), Counter(s["slide"] for s in ref)
    out = []
    for n in sorted(set(a) | set(b)):
        if a[n] != b[n]:
            out.append(f"slide {n}: {a[n]} sentence(s) in {lang}, {b[n]} in {ref_name}")
            out += [f"    {lang}: {s['text']}" for s in mine if s["slide"] == n]
            out += [f"    {ref_name}: {s['text']}" for s in ref if s["slide"] == n]
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--transcript", type=Path, required=True)
    ap.add_argument("--slides", required=True, help="the part's transcript slides, e.g. 1-6")
    ap.add_argument("--lang", required=True)
    ap.add_argument("--against", type=Path, help="timing file of the voiced language: same sentences per slide?")
    ap.add_argument("--out", type=Path, required=True)
    a = ap.parse_args()
    first, last = parse_range(a.slides)
    sents = slide_sentences(a.transcript, first, last, None)
    if a.against:
        ref = load_json(a.against)
        probs = compare(sents, ref["sentences"], a.lang, ref.get("lang", "the voice"))
        if probs:
            print("the sentences do not line up:\n  " + "\n  ".join(probs), file=sys.stderr)
            return 1
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps({"lang": a.lang, "sentences": sents}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{a.out}: {len(sents)} sentence(s) in {a.lang}" + (", lined up with the voice" if a.against else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
