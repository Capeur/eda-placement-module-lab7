#!/usr/bin/env python3
"""Build the bilingual (English / French) Lab 07 GitHub Pages site (simulated annealing placement) into docs/.

    docs/            English page + English lab
    docs/fr/         French page + French lab (language switch on every page)

This is a lessons-only site: there is no slide video, no video parts, no subtitles file, no slide deck. The media are
the animated lessons of the lesson-animator (docs/lessons/, docs/fr/lessons/, one player with all five parts),
built by that skill, not here. They survive a rebuild, and the page shows the player (an iframe) only when
docs/lessons/index.html exists, so the site builds before the first lesson is made.

Sources
    English: your eda-learning clone (with the Lab 07 upgrade applied)
        courses/learn_placement/module02-07-sa-placement/   transcript, EXAMPLES.md, quiz.json, examples/
        platform/tools/sa-placement/                        interactive browser lab (tests/ is not copied)
    French: this repo
        i18n/fr/module02-07-sa-placement/transcript.md      French narration (same sentences as the English one)
        i18n/fr/EXAMPLES.md, quiz.json                      Track A guide and quiz
        i18n/fr/sa-placement-strings.js                     French copy of the lab's strings module (same keys, checked)
        i18n/fr/lab_strings.py                              French text for the lab page and the shared challenge chrome
    Chinese (subtitles only, to be checked by a native reader): i18n/zh/module02-07-sa-placement/transcript.md
        i18n/strings.py                                     page text in both languages
        site_src/img/lab-en.png, lab-fr.png                 the lab screenshot (tools/capture_lab.py)

The EN, FR and ZH transcripts must have the same number of sentences in every slide: tools/check_sentences.py runs
first and stops the build when they differ.

Usage (from this repo's root):
    python3 build_site.py --repo ../eda-learning-lab7-pl

Needs: python3, node (to check the French strings module), and `pip install markdown pillow`.
"""
from __future__ import annotations

import argparse
import html
import importlib.util
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "site_src"
FR_ROOT = HERE / "i18n/fr"
FR_MODULE = FR_ROOT / "module02-07-sa-placement"
MODULE_REL = Path("courses/learn_placement/module02-07-sa-placement")
TOOL_REL = Path("platform/tools/sa-placement")
TOOL = "sa-placement"
STRINGS_JS = "sa-placement-strings.js"   # every word of the lab; docs/fr/ gets i18n/fr/<same name>
ASSET_REL = Path("platform/assets")

# The five lessons, as (first slide, last slide) of transcript.md (slides = narration sections; no PDF in this lab).
# Titles: i18n/strings.py (part_titles); the lessons themselves are in lessons/part-N/storyboard.json.
PARTS = [(1, 6), (7, 12), (13, 18), (19, 23), (24, 29)]

sys.path.insert(0, str(HERE / "i18n"))
from strings import LANGS  # noqa: E402


FONTS = [  # self-hosted (fonts.googleapis.com is blocked or very slow in some regions)
    ("Source Sans 3", 400, "source-sans-3-latin-400-normal.woff2"),
    ("Source Sans 3", 600, "source-sans-3-latin-600-normal.woff2"),
    ("Source Sans 3", 700, "source-sans-3-latin-700-normal.woff2"),
    ("Fraunces", 500, "fraunces-latin-500-normal.woff2"),
    ("Fraunces", 700, "fraunces-latin-700-normal.woff2"),
    ("IBM Plex Mono", 400, "ibm-plex-mono-latin-400-normal.woff2"),
    ("IBM Plex Mono", 500, "ibm-plex-mono-latin-500-normal.woff2"),
]
GOOGLE_FONTS = re.compile(r'@import url\("https://fonts\.googleapis\.com[^)]*\);\s*')


def fontface_css(prefix: str) -> str:
    """@font-face rules pointing at docs/fonts/ (prefix = path from the CSS file)."""
    return "".join(
        f'@font-face{{font-family:"{fam}";font-style:normal;font-weight:{w};font-display:swap;'
        f'src:url("{prefix}{f}") format("woff2");}}\n'
        for fam, w, f in FONTS
    )


def webp(src: Path, dest: Path, width: int, quality: int = 82) -> None:
    """Resized WebP copy for fast page loads (the full PNG stays available)."""
    from PIL import Image

    im = Image.open(src).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=quality, method=6)


def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(1)


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ---------------------------------------------------------------- lessons (built by the lesson-animator)

def lessons_ready(out: Path) -> bool:
    """The player of the lessons (docs/lessons/index.html, docs/fr/lessons/index.html) was built."""
    return (out / "lessons" / "index.html").is_file()


def lessons_html(t: dict, out: Path) -> tuple[str, str]:
    """(nav link, section) for the lesson player: both empty until the player exists."""
    if not lessons_ready(out):
        return "", ""
    nav = f'<a href="#lessons">{t["nav_lessons"]}</a>'
    section = (
        '<section id="lessons">\n'
        f'      <h2>{t["lessons_h2"]}</h2>\n      <p>{t["lessons_intro"]}</p>\n'
        '      <div class="card lessons-card">\n'
        f'        <iframe class="lesson-player" src="lessons/index.html" title="{esc(t["lessons_title"])}" allow="autoplay" '
        'style="width:100%;border:0;min-height:700px"></iframe>\n'
        '      </div>\n'
        '      <script>\n'
        'addEventListener("message", (e) => { const f = document.querySelector(".lesson-player");\n'
        '  if (f && e.source === f.contentWindow && e.data && e.data.lessonPlayer && e.data.ev === "height") f.style.height = e.data.h + 16 + "px"; });\n'
        '      </script>\n    </section>')
    return nav, section


# ---------------------------------------------------------------- browser lab

def copy_lab(repo: Path, out: Path, t: dict, other_lab: str) -> None:
    tool, assets = repo / TOOL_REL, repo / ASSET_REL
    dest_tool, dest_assets = out / "tools" / TOOL, out / "assets"
    dest_tool.mkdir(parents=True, exist_ok=True)
    dest_assets.mkdir(parents=True, exist_ok=True)
    for f in tool.iterdir():  # files only: tests/ (Playwright + model checks) stays in the course repo
        if f.is_file():
            shutil.copy2(f, dest_tool / f.name)
    assert not (dest_tool / "tests").exists()

    # Shared course assets the lab imports (follow the import graph).
    needed, todo = {"site.css", "tools-shared.css", "clustering-lab.css"}, []
    for f in tool.glob("*.js"):
        todo += re.findall(r'from\s+"\.\./\.\./assets/([^"]+)"', f.read_text(encoding="utf-8"))
    while todo:
        name = todo.pop()
        if name in needed:
            continue
        needed.add(name)
        todo += re.findall(r'from\s+"\./([^"]+)"', (assets / name).read_text(encoding="utf-8"))
    for name in sorted(needed):
        shutil.copy2(assets / name, dest_assets / name)
        if name.endswith(".css"):
            css = (dest_assets / name).read_text(encoding="utf-8")
            if GOOGLE_FONTS.search(css):
                fonts_prefix = "../fonts/" if out.name != "fr" else "../../fonts/"
                css = fontface_css(fonts_prefix) + GOOGLE_FONTS.sub("", css)
                (dest_assets / name).write_text(css, encoding="utf-8")

    # Standalone header with the language switch (platform nav/search are not deployed here).
    page = (dest_tool / "index.html").read_text(encoding="utf-8")
    page = re.sub(r'\s*<script src="\.\./\.\./assets/site\.js"></script>', "", page)
    page = re.sub(
        r'<header class="site-header">.*?</header>',
        '<header class="site-header">\n    <div class="site-header-inner">\n'
        f'      <p class="brand"><a href="../../index.html">{t["lab_brand"]}</a></p>\n'
        '      <nav class="site-nav" aria-label="Site">\n'
        f'        <a href="../../index.html">{t["lab_nav_home"]}</a>\n'
        f'        <a href="../../index.html#lessons">{t["lab_nav_lessons"]}</a>\n'
        f'        <a href="{other_lab}" hreflang="{t["switch_lang"]}" lang="{t["switch_lang"]}">{t["switch_text"]}</a>\n'
        '      </nav>\n    </div>\n  </header>',
        page,
        flags=re.S,
    )
    page = re.sub(r'<footer class="site-footer">.*?</footer>',
                  f'<footer class="site-footer">{t["lab_footer"]}</footer>', page, flags=re.S)
    (dest_tool / "index.html").write_text(page, encoding="utf-8")


def translate_lab(out: Path) -> None:
    """Apply i18n/fr/lab_strings.py to the French copy; fail if the lab drifted."""
    table = load_module(FR_ROOT / "lab_strings.py", "lab_strings").STRINGS
    missing = []
    files: dict[str, str] = {}
    for rel, en, fr in table:
        path = out / rel
        text = files.get(rel) or path.read_text(encoding="utf-8")
        if en not in text:
            missing.append(f"{rel}: {en[:70]}")
            continue
        files[rel] = text.replace(en, fr)
    if missing:
        die("French lab strings not found (the lab changed in eda-learning?). Update "
            "i18n/fr/lab_strings.py:\n  " + "\n  ".join(missing))
    for rel, text in files.items():
        (out / rel).write_text(text, encoding="utf-8")
    # The strings module: the French copy replaces the English file, after a same-shape check (keys, functions).
    en_js, fr_js = out / "tools" / TOOL / STRINGS_JS, FR_ROOT / STRINGS_JS
    if not shutil.which("node"):
        die("node is needed to check the French strings module")
    check = subprocess.run(["node", str(HERE / "tools/strings_shape.mjs"), str(en_js), str(fr_js)], capture_output=True, text=True)
    if check.returncode:
        die(f"i18n/fr/{STRINGS_JS} does not match the lab's {STRINGS_JS} (the lab changed in eda-learning?):\n{check.stdout}{check.stderr}")
    shutil.copy2(fr_js, en_js)


# ---------------------------------------------------------------- page

def render_markdown(path: Path) -> str:
    import markdown

    return markdown.markdown(path.read_text(encoding="utf-8"), extensions=["tables", "fenced_code"])


def transcript_html(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    parts = []
    for title, body in re.findall(r"^## Slide \d+ — (.+?)\n(.*?)(?=^## Slide |\Z)", text, flags=re.S | re.M):
        body = re.sub(r"```.*?```", "", body, flags=re.S)
        body = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", body)
        body = re.sub(r"<!--.*?-->", "", body, flags=re.S)
        paras = [p.strip() for p in body.split("\n\n") if p.strip()]
        parts.append(f"<h3>{esc(title)}</h3>" + "".join(f"<p>{esc(p)}</p>" for p in paras))
    return "\n".join(parts)


def check_sentences(repo: Path) -> None:
    """EN, FR and ZH have the same number of sentences in every slide (the subtitles of one language sit over the
    voice of another, sentence by sentence). Stops the build when they differ."""
    cs = load_module(HERE / "tools/check_sentences.py", "check_sentences")
    if cs.main(["--teacher", str(repo)]):
        die("the EN, FR and ZH transcripts do not have the same sentences per slide (see above)")


def build_language(repo: Path, out: Path, lang: str, base: str) -> dict:
    """Build one language into `out`. `base` is the path from `out` to the shared docs/ root."""
    t = LANGS[lang]
    en_module = repo / MODULE_REL
    transcript = en_module / "transcript.md" if lang == "en" else FR_MODULE / "transcript.md"
    examples_md = en_module / "EXAMPLES.md" if lang == "en" else FR_ROOT / "EXAMPLES.md"
    quiz_path = en_module / "quiz.json" if lang == "en" else FR_ROOT / "quiz.json"

    out.mkdir(parents=True, exist_ok=True)
    shutil.copy2(transcript, out / "transcript.md")
    shutil.copy2(quiz_path, out / "quiz.json")

    # Lab screenshot (tools/capture_lab.py makes site_src/img/lab-<lang>.png from the built lab).
    lab_img = ""
    shot = SRC / "img" / f"lab-{lang}.png"
    if shot.is_file():
        (out / "img").mkdir(exist_ok=True)
        shutil.copy2(shot, out / "img" / "lab-starter.png")
        webp(shot, out / "img" / "lab-starter.webp", 1100)
        lab_img = (f'<a href="tools/{TOOL}/index.html"><img src="img/lab-starter.webp" loading="lazy" '
                   f'alt="{esc(t["lab_img_alt"])}"></a>')

    # Browser lab (French copy is translated).
    other_lab = (f"../../fr/tools/{TOOL}/index.html" if lang == "en" else f"../../../tools/{TOOL}/index.html")
    copy_lab(repo, out, t, other_lab)
    if lang == "fr":
        translate_lab(out)

    quiz = json.loads(quiz_path.read_text(encoding="utf-8"))
    nav_lessons, lessons = lessons_html(t, out)
    files = "\n".join(f'<a href="{base}{f}" download><code>{Path(f).name}</code><small>{esc(d)}</small></a>'
                      for f, d in t["files"])
    fill = {k: v for k, v in t.items() if isinstance(v, str)}
    fill.update({
        "base": base,
        "quiz_intro": t["quiz_intro"].format(n=len(quiz["items"])),
        "NAV_LESSONS": nav_lessons, "LESSONS": lessons, "LAB_IMG": lab_img,
        "LAB_ITEMS": "\n".join(f"<li>{esc(x)}</li>" for x in t["lab_items"]),
        "QUIZ_JSON": json.dumps(quiz, ensure_ascii=False).replace("</", "<\\/"),
        "EXAMPLES_HTML": render_markdown(examples_md),
        "EXAMPLE_FILES": files,
        "TRANSCRIPT": transcript_html(transcript),
    })
    page = (SRC / "index.html.tmpl").read_text(encoding="utf-8")
    page = re.sub(r"\{\{(\w+)\}\}", lambda m: fill[m.group(1)] if m.group(1) in fill else die(f"no text for {{{{{m.group(1)}}}}}"), page)
    (out / "index.html").write_text(page, encoding="utf-8")
    return {"lessons": lessons_ready(out), "image": bool(lab_img)}


# ---------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--repo", required=True, type=Path, help="path to your eda-learning clone")
    ap.add_argument("--out", default=HERE / "docs", type=Path, help="output folder (default: docs/)")
    args = ap.parse_args()
    repo = args.repo.expanduser().resolve()
    if not (repo / MODULE_REL / "transcript.md").is_file() or not (repo / TOOL_REL / "index.html").is_file():
        die(f"{repo} does not look like eda-learning with the Lab 07 upgrade applied")
    check_sentences(repo)

    out = args.out.resolve()
    # Built lessons (docs/lessons, docs/fr/lessons) are not made by this script: keep them across the rebuild.
    keep = HERE / ".cache/lessons-keep"   # (a crashed run leaves them here: the next run puts them back)
    for rel in ("lessons", "fr/lessons"):
        if (out / rel).is_dir():
            shutil.rmtree(keep / rel, ignore_errors=True)
            (keep / rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(out / rel), str(keep / rel))
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    (out / ".nojekyll").write_text("", encoding="utf-8")
    shutil.copytree(SRC / "fonts", out / "fonts")
    (out / "page.css").write_text(fontface_css("fonts/") + (SRC / "page.css").read_text(encoding="utf-8"), encoding="utf-8")
    shutil.copy2(SRC / "quiz.js", out / "quiz.js")
    (out / "examples").mkdir()
    for f, _ in LANGS["en"]["files"]:  # code files are shared by both languages
        shutil.copy2(repo / MODULE_REL / f, out / f)

    for rel in ("lessons", "fr/lessons"):  # back before the pages are built: they look for the lesson folders
        if (keep / rel).is_dir():
            (out / rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(keep / rel), str(out / rel))
    report = {"en": build_language(repo, out, "en", ""), "fr": build_language(repo, out / "fr", "fr", "../")}
    size = sum(p.stat().st_size for p in out.rglob("*") if p.is_file()) / 1e6
    for lang, r in report.items():
        print(f"[{lang}] lesson player: {'yes' if r['lessons'] else 'not built yet (section hidden)'}, lab screenshot: {'yes' if r['image'] else 'no'}")
    print(f"Built {out} ({size:.1f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
