#!/usr/bin/env python3
"""EN, FR and ZH transcripts must say the same thing, sentence for sentence.

For every slide, the English, French and Chinese transcripts must have the same number of spoken sentences, counted
with lesson-animator's own splitter (lessonlib.slide_sentences, the one the voices and the subtitles use). The
lessons show one language as the voice and another as subtitles, sentence i of one over sentence i of the other,
so one missing or extra sentence shifts every subtitle that follows it.

    python3 tools/check_sentences.py [--teacher ../eda-learning-lab7-pl] [--show]

Also checked: the three files have the same slides (numbers 1..N in order), and no sentence is empty.
build_site.py runs this check first and stops when it fails. Exit code 0 = clean.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
MODULE = "module02-07-sa-placement"
EN_REL = Path("courses/learn_placement") / MODULE / "transcript.md"
FILES = {"fr": HERE / "i18n/fr" / MODULE / "transcript.md", "zh": HERE / "i18n/zh" / MODULE / "transcript.md"}


def find_lessonlib(explicit: str | None) -> Path:
    """lesson-animator's scripts folder: --lessonlib, $LESSON_ANIMATOR, ~/.claude/skills, then the copy in ai-workflow/."""
    cands = [explicit, os.environ.get("LESSON_ANIMATOR"), "~/.claude/skills/lesson-animator/scripts",
             HERE / "ai-workflow/skills/lesson-animator/scripts"]
    for c in cands:
        if c and (Path(c).expanduser() / "lessonlib.py").is_file():
            return Path(c).expanduser()
    raise SystemExit("lessonlib.py not found: pass --lessonlib <lesson-animator/scripts>")


def slide_numbers(path: Path) -> list[int]:
    return [int(n) for n in re.findall(r"^##\s+Slide\s+(\d+)\s*[—–-]", path.read_text(encoding="utf-8"), flags=re.M)]


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--teacher", type=Path, default=HERE.parent / "eda-learning-lab7-pl", help="the eda-learning clone (English transcript, speech cleaner)")
    ap.add_argument("--lessonlib", default=None)
    ap.add_argument("--show", action="store_true", help="print the sentence counts of every slide")
    args = ap.parse_args(argv)
    sys.dont_write_bytecode = True
    sys.path.insert(0, str(find_lessonlib(args.lessonlib)))
    import lessonlib  # noqa: E402

    teacher = args.teacher.expanduser().resolve()
    paths = {"en": teacher / EN_REL, **FILES}
    problems: list[str] = []
    per_lang: dict[str, dict[int, list[str]]] = {}
    for lang, path in paths.items():
        if not path.is_file():
            problems.append(f"[{lang}] missing {path}")
            continue
        nums = slide_numbers(path)
        if nums != list(range(1, len(nums) + 1)):
            problems.append(f"[{lang}] slide numbers are not 1..{len(nums)} in order: {nums}")
        sents = lessonlib.slide_sentences(path, 1, max(nums), teacher)
        slides: dict[int, list[str]] = {n: [] for n in nums}
        for s in sents:
            slides[s["slide"]].append(s["text"])
        for n, lst in slides.items():
            if not lst:
                problems.append(f"[{lang}] slide {n} has no spoken sentence")
        per_lang[lang] = slides
    if len(per_lang) == len(paths):
        en = per_lang["en"]
        for lang in ("fr", "zh"):
            if set(per_lang[lang]) != set(en):
                problems.append(f"[{lang}] slides {sorted(per_lang[lang])} differ from English {sorted(en)}")
        for n in sorted(en):
            counts = {lang: len(per_lang[lang].get(n, [])) for lang in per_lang}
            if len(set(counts.values())) != 1:
                problems.append(f"slide {n}: sentences EN {counts['en']}, FR {counts['fr']}, ZH {counts['zh']}")
                if args.show:
                    for lang in per_lang:
                        for i, t in enumerate(per_lang[lang].get(n, []), 1):
                            problems.append(f"    {lang} {i}: {t}")
        if args.show or not problems:
            totals = {lang: sum(len(v) for v in per_lang[lang].values()) for lang in per_lang}
            print(f"{len(en)} slides; sentences EN {totals['en']}, FR {totals['fr']}, ZH {totals['zh']}")
            if args.show:
                print("per slide:", " ".join(str(len(en[n])) for n in sorted(en)))
    if problems:
        print("Sentence check FAILED:\n  " + "\n  ".join(problems), file=sys.stderr)
        return 1
    print("Sentence check clean: same slides and same number of sentences in every slide (EN, FR, ZH).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
