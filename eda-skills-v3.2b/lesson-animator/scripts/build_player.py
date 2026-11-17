#!/usr/bin/env python3
"""One player page for all the parts of a lab's animated lessons.

It lists the built lesson pages of one language (<lessons>/part-N/index.html, made by build_lesson.py), plays the one
you pick in a frame, moves on to the next part when one ends (a short countdown, can be switched off), remembers the
finished parts, takes a link per part (index.html#part-3) and links to the same part in the other languages.

  python3 build_player.py --lessons docs/lessons --lang en --heading "Simulated annealing placement" \\
      --eyebrow "Lab 07 · animated lessons" --other fr=../fr/lessons/index.html --back ../index.html \\
      --next-url ../tools/sa-placement/index.html --next-label "Open the browser lab" --storage-key lab07-lessons
  python3 build_player.py --lessons docs/fr/lessons --lang fr --heading "..." --other en=../../lessons/index.html ...

The page has no library and makes no outside request (fonts come from part-1/fonts when that folder exists).
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

ENGINE = Path(__file__).resolve().parent.parent / "engine"
T = {
    "en": {"part": "Part {n}", "parts": "Parts of the lesson", "links": "Other pages", "lesson": "Animated lesson", "prev": "Previous part", "next": "Next part",
           "auto": "Play the next part by itself", "nextUp": "Next:", "inSec": "starts in {s} s", "playNow": "Play it now", "stay": "Stay here",
           "end": "You have finished every part.", "back": "Back to the lab page", "voice": "Voice"},
    "fr": {"part": "Partie {n}", "parts": "Parties de la leçon", "links": "Autres pages", "lesson": "Leçon animée", "prev": "Partie précédente", "next": "Partie suivante",
           "auto": "Enchaîner la partie suivante", "nextUp": "Ensuite :", "inSec": "démarre dans {s} s", "playNow": "La lancer", "stay": "Rester ici",
           "end": "Vous avez terminé toutes les parties.", "back": "Retour à la page du lab", "voice": "Voix"},
    "zh": {"part": "第 {n} 部分", "parts": "课程各部分", "links": "其他页面", "lesson": "动画课程", "prev": "上一部分", "next": "下一部分",
           "auto": "自动播放下一部分", "nextUp": "接下来：", "inSec": "{s} 秒后开始", "playNow": "立即播放", "stay": "留在此处",
           "end": "你已看完所有部分。", "back": "返回实验页面", "voice": "配音"},
}
LANG_NAMES = {"en": "English", "fr": "Français", "zh": "中文"}
FONTS = [("Fraunces", 700, "fraunces-latin-700-normal.woff2"), ("Source Sans 3", 400, "source-sans-3-latin-400-normal.woff2"),
         ("Source Sans 3", 600, "source-sans-3-latin-600-normal.woff2"), ("IBM Plex Mono", 400, "ibm-plex-mono-latin-400-normal.woff2")]


def meta(page: str, name: str) -> str | None:
    m = re.search(rf'<meta name="lesson:{name}" content="([^"]*)"', page)
    return html.unescape(m.group(1)) if m else None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lessons", type=Path, required=True, help="folder that holds part-1/, part-2/, ... (built lesson pages)")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--heading", required=True, help="the big title of the player")
    ap.add_argument("--eyebrow", default="", help="small line above the title, e.g. 'Lab 07 · animated lessons'")
    ap.add_argument("--other", action="append", default=[], metavar="LANG=URL", help="the player of another language (repeat)")
    ap.add_argument("--back", help="link back to the lab page")
    ap.add_argument("--back-label")
    ap.add_argument("--next-url", help="where the button shown after the last part goes (e.g. the browser lab)")
    ap.add_argument("--next-label")
    ap.add_argument("--titles", type=Path, help='JSON list of part titles for this language, to replace the lesson pages\' own titles')
    ap.add_argument("--storage-key", default="lessons", help="localStorage prefix (finished parts, auto-continue)")
    a = ap.parse_args()

    t = T.get(a.lang, T["en"])
    dirs = sorted((d for d in a.lessons.glob("part-*") if (d / "index.html").is_file()), key=lambda d: int(re.sub(r"\D", "", d.name) or 0))
    if not dirs:
        print(f"no part-N/index.html under {a.lessons}", file=sys.stderr)
        return 1
    titles = json.loads(a.titles.read_text(encoding="utf-8")) if a.titles else None
    parts, old = [], []
    for i, d in enumerate(dirs):
        page = (d / "index.html").read_text(encoding="utf-8")
        n = int(re.sub(r"\D", "", d.name))
        title, dur = meta(page, "title"), meta(page, "duration")
        if title is None or dur is None:
            old.append(d.name)
            title, dur = title or d.name, dur or "0"
        if "lessonCmd" not in page:
            old.append(d.name)
        parts.append({"n": n, "src": f"{d.name}/index.html", "title": titles[i] if titles else title, "dur": float(dur)})
    if old:
        print(f"rebuild these parts with this version of build_lesson.py first (no player hooks in them): {sorted(set(old))}", file=sys.stderr)
        return 1

    links = []
    if a.back:
        links.append(f'<a href="{html.escape(a.back)}" target="_top">← {html.escape(a.back_label or t["back"])}</a>')
    if a.other:
        links.append(f'<span class="lab">{html.escape(t["voice"])}</span>')
    links.append(f'<a aria-current="true">{html.escape(LANG_NAMES.get(a.lang, a.lang))}</a>')
    for o in a.other:
        code, _, url = o.partition("=")
        if not url:
            print(f"--other needs LANG=URL, not {o}", file=sys.stderr)
            return 1
        links.append(f'<a data-lang="{html.escape(code)}" data-base="{html.escape(url)}" href="{html.escape(url)}" lang="{html.escape(code)}">{html.escape(LANG_NAMES.get(code, code))}</a>')
    fdir = dirs[0] / "fonts"
    faces = "".join(f"@font-face{{font-family:'{fam}';font-weight:{wt};font-style:normal;font-display:swap;src:url({dirs[0].name}/fonts/{fn}) format('woff2')}}"
                    for fam, wt, fn in FONTS if (fdir / fn).is_file())
    cfg = {"parts": parts, "t": t, "key": a.storage_key, "nextUrl": a.next_url, "nextLabel": a.next_label}
    page = (ENGINE / "player.html").read_text(encoding="utf-8")
    for k, v in {"__LANG__": a.lang, "__TITLE__": html.escape(a.heading), "__FONTS__": faces, "__EYEBROW__": html.escape(a.eyebrow),
                 "__HEADING__": html.escape(a.heading), "__LINKS__": "".join(links), "__T_LINKS__": t["links"], "__T_PARTS__": t["parts"],
                 "__T_LESSON__": t["lesson"], "__T_AUTO__": t["auto"], "__T_PREV__": t["prev"], "__T_NEXT__": t["next"],
                 "__CONFIG__": json.dumps(cfg, ensure_ascii=False).replace("</", "<\\/")}.items():
        page = page.replace(k, v)
    out = a.lessons / "index.html"
    out.write_text(page, encoding="utf-8")
    total = sum(p["dur"] for p in parts)
    print(f"{out}: {len(parts)} part(s), {total / 60:.1f} min in all, languages: {a.lang}" + "".join(f", {o.split('=')[0]}" for o in a.other))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
