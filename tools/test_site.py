#!/usr/bin/env python3
"""Playwright test of the built site (docs/), English and French pages. Lessons-only site: no video, no slides.

    python3 ~/.claude/skills/lesson-animator/scripts/serve.py docs 8090     # from this repo's root, in another shell
    python3 tools/test_site.py [--base http://127.0.0.1:8090] [--docs docs] [--teacher ../eda-learning-lab7-pl]

(Serve docs/ with lesson-animator's serve.py, not `python3 -m http.server`: only serve.py answers Range requests,
so the audio can jump.) Per language: no console error, no 404, no request outside the site (0 external requests,
fonts included); every image loads; one transcript section per slide; the quiz scores 8/8 when answered right and
0/8 when answered wrong; the language switch keeps #hash (page and lab); the lab opens in the same language with no
leftover English in the French one; downloads (transcript, quiz, the example files the page lists; examples/wrong is
not offered); the EN, FR and ZH transcripts have the same number of sentences in every slide
(tools/check_sentences.py); the page has no video, subtitles file, slide deck or PDF; the model and strings files
of the lab are there and the lab has no tests/ folder.

The lesson player is shown on the page only when docs/[fr/]lessons/index.html exists, and the page says nothing
about lessons otherwise: both directions are checked. Once the player exists (per language): it lists every built
part with a title and a length; #part-N opens part N; `ended` from a part shows the countdown and then loads part N+1;
the language link carries #part-N; and every built part page has the subtitles menu with the other language and
中文, the "Sounds" button, window.__lesson.errors empty, window.__lesson.placement.dataDiffer = 0 (the lesson's own
replay agrees with the checker's traces), audio that answers 200, no console error, no request outside the site.
Parts not built yet are skipped, and the output says how many of the five exist.
The lab's own challenges are tested by tools/test_lab_site.py.

The test Chromium cannot decode the audio, so `ended` is dispatched on #lesson-audio instead of playing it.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://127.0.0.1:8090")
ap.add_argument("--docs", default=HERE / "docs", type=Path)
ap.add_argument("--teacher", default=HERE.parent / "eda-learning-lab7-pl", type=Path)
args = ap.parse_args()
BASE = args.base.rstrip("/")
DOCS = args.docs.resolve()
MODULE = args.teacher / "courses/learn_placement/module02-07-sa-placement"
FR_MODULE = HERE / "i18n/fr/module02-07-sa-placement"
TOOL = "sa-placement"

sys.path.insert(0, str(HERE))
spec = importlib.util.spec_from_file_location("build_site", HERE / "build_site.py")
build_site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build_site)  # PARTS, LANGS (the same constants the build uses)
N_PARTS = len(build_site.PARTS)

N_SECTIONS = {"en": len(re.findall(r"^## Slide ", (MODULE / "transcript.md").read_text(encoding="utf-8"), flags=re.M)),
              "fr": len(re.findall(r"^## Slide ", (FR_MODULE / "transcript.md").read_text(encoding="utf-8"), flags=re.M))}
QUIZ = {"en": json.loads((MODULE / "quiz.json").read_text(encoding="utf-8")),
        "fr": json.loads((HERE / "i18n/fr/quiz.json").read_text(encoding="utf-8"))}
TXT = {  # words the page shows per language
    "en": {"prefix": "", "pass": "passed", "fail": "try again", "other": "Français", "lab_btn": "Open the lab",
           "other_voice": "Français", "leftover": []},
    "fr": {"prefix": "fr/", "pass": "réussi", "fail": "réessayez", "other": "English", "lab_btn": "Ouvrir le lab",
           "other_voice": "English",
           "leftover": ["Skip to content", "Interactive tool", "Pick a challenge", "Reset workspace", "Show hint", "Next challenge",
                        "Apply SA preset", "Run SA from the starter", "Pick one", "Challenges", "Closest cells", "Your placement",
                        "accepted moves", "Count the accepted moves"]},
}
EXAMPLE_FILES = sorted(Path(f).name for f, _ in build_site.LANGS["en"]["files"])  # examples/wrong/ is not offered

rows: list[tuple[str, str, bool]] = []


def check(lang: str, what: str, ok: bool, detail: str = "") -> None:
    rows.append((lang, what + (f" ({detail})" if detail and not ok else ""), bool(ok)))


def correct_index(item: dict) -> int:
    return (0 if item["answer"] else 1) if item["type"] == "true_false" else item["answer"]


def watch(pg, problems: list[str]) -> None:
    pg.on("console", lambda m: m.type == "error" and problems.append(f"console: {m.text}"))
    pg.on("pageerror", lambda e: problems.append(f"page error: {e}"))
    pg.on("requestfailed", lambda r: problems.append(f"request failed: {r.url} {r.failure}"))
    pg.on("response", lambda r: r.status >= 400 and problems.append(f"HTTP {r.status}: {r.url}"))
    pg.on("request", lambda r: not r.url.startswith((BASE, "data:", "blob:")) and problems.append(f"external: {r.url}"))


def built_parts(docs_lang: Path) -> list[int]:
    return sorted(k for k in range(1, N_PARTS + 1) if (docs_lang / f"lessons/part-{k}/index.html").is_file())


def lesson_frame(pg, k: int):
    """The frame of the player that shows part k (None until it loads)."""
    for f in pg.frames:
        if f.url.split("?")[0].rstrip("/").endswith(f"part-{k}/index.html"):
            return f
    return None


def wait_part(pg, k: int, timeout: float = 15000):
    pg.wait_for_function("k => document.querySelector('.pl-frame').src.includes('part-' + k + '/index.html')", arg=k, timeout=timeout)
    for _ in range(int(timeout / 100)):
        f = lesson_frame(pg, k)
        if f is not None:
            try:
                if f.evaluate("window.__lesson !== undefined"):
                    return f
            except Exception:
                pass
        pg.wait_for_timeout(100)
    raise AssertionError(f"part {k} did not load in the player")


def check_lessons(b, lang: str, t: dict, docs_lang: Path) -> None:
    """The lesson player and every built part page. Nothing to check (and nothing on the page) before the player exists."""
    pre = t["prefix"]
    player_there = (docs_lang / "lessons/index.html").is_file()
    parts = built_parts(docs_lang)
    page = b.new_page(viewport={"width": 1280, "height": 2000})
    problems: list[str] = []
    watch(page, problems)
    page.goto(f"{BASE}/{pre}index.html", wait_until="networkidle")
    frame_el = page.locator("iframe.lesson-player")
    nav = page.locator(".toc a[href='#lessons']")
    check(lang, "the page shows the lesson player (iframe, nav link) only when lessons/index.html exists"
          if player_there else "no lesson player, nav link or section on the page while lessons/index.html is missing",
          (frame_el.count() == 1 and nav.count() == 1 and page.locator("#lessons").count() == 1) if player_there
          else (frame_el.count() == 0 and nav.count() == 0 and page.locator("#lessons").count() == 0 and "lessons/" not in page.content()))
    if not player_there:
        check(lang, f"lessons: no player yet, nothing more to check (0 of {N_PARTS} parts built)", True)
        page.close()
        return
    src = frame_el.get_attribute("src")
    check(lang, "the iframe points at lessons/index.html and allows autoplay", src == "lessons/index.html" and frame_el.get_attribute("allow") == "autoplay")
    page.wait_for_timeout(1500)
    h = page.evaluate("document.querySelector('iframe.lesson-player').getBoundingClientRect().height")
    check(lang, f"the frame is sized by the player (no inner scrollbar): {h:.0f} px high", h > 400)
    check(lang, "the page with the player: no console error, no failed request, 0 external requests", not problems, "; ".join(problems[:3]))
    page.close()

    # ---- the player itself
    pg = b.new_page(viewport={"width": 1280, "height": 1800})
    problems = []
    watch(pg, problems)
    pg.goto(f"{BASE}/{pre}lessons/index.html", wait_until="networkidle")
    btns = pg.locator(".pl-parts button")
    nums = [int(re.sub(r"\D", "", x)) for x in btns.evaluate_all("els => els.map(e => e.querySelector('.n span').textContent)")]
    titles = btns.evaluate_all("els => els.map(e => e.querySelector('.t').textContent.trim())")
    lens = btns.evaluate_all("els => els.map(e => e.querySelector('.d').textContent.replace('✓','').trim())")
    check(lang, f"the player lists every built part ({len(parts)} of {N_PARTS}: {parts}), each with a title and a length",
          nums == parts and all(titles) and all(re.fullmatch(r"\d+:\d\d", x) for x in lens), f"{nums} {titles} {lens}")
    want_titles = build_site.LANGS[lang]["part_titles"]
    check(lang, "the part titles are the ones of the page (i18n/strings.py part_titles)",
          titles == [want_titles[k - 1] for k in parts], str(titles))
    links = pg.locator(".pl-links a[data-lang]").evaluate_all("els => els.map(e => [e.dataset.lang, e.getAttribute('href')])")
    other = "fr" if lang == "en" else "en"
    check(lang, "the player links to the voice in the other language", [l[0] for l in links] == [other], str(links))
    back = pg.locator(".pl-links a[target=_top]")
    check(lang, "a link back to the lab page opens in the top window", back.count() == 1 and back.get_attribute("href").startswith("../index.html"),
          str(back.count()))
    nxt_url = pg.evaluate("window.__player ? true : false")
    check(lang, "the player's script is running (window.__player)", nxt_url)

    first = parts[0]
    f = wait_part(pg, first)
    check(lang, f"the player opens on part {first} and its aria-current is on that button",
          pg.evaluate("window.__player.current()") == 0 and btns.nth(0).get_attribute("aria-current") == "true")

    # #part-N opens part N
    for k in parts[1:]:
        pg.goto(f"{BASE}/{pre}lessons/index.html#part-{k}", wait_until="networkidle")
        pg.reload(wait_until="networkidle")
        wait_part(pg, k)
        i = parts.index(k)
        check(lang, f"#part-{k} opens part {k}", pg.evaluate("window.__player.current()") == i
              and btns.nth(i).get_attribute("aria-current") == "true" and pg.locator(".pl-parts button[aria-current=true]").count() == 1)
        break  # one jump is enough; the loop below walks every part through `ended`

    # the language link carries #part-N
    pg.goto(f"{BASE}/{pre}lessons/index.html#part-{parts[-1]}", wait_until="networkidle")
    pg.reload(wait_until="networkidle")
    wait_part(pg, parts[-1])
    href = pg.locator(".pl-links a[data-lang]").first.get_attribute("href")
    check(lang, f"the language link carries #part-{parts[-1]}", f"#part-{parts[-1]}" in href, href)

    # `ended` shows the countdown, then loads the next part
    if len(parts) > 1:
        pg.goto(f"{BASE}/{pre}lessons/index.html#part-{parts[0]}", wait_until="networkidle")
        pg.reload(wait_until="networkidle")
        f = wait_part(pg, parts[0])
        f.evaluate("document.getElementById('lesson-audio').dispatchEvent(new Event('ended'))")
        pg.wait_for_selector(".pl-next.on", timeout=3000)
        msg = pg.inner_text(".pl-next")
        check(lang, "after `ended` the countdown box names the next part", t_next_title(lang, parts, 1) in msg, msg.replace("\n", " | "))
        check(lang, "the finished part is marked done in the list", "✓" in btns.nth(0).inner_text())
        wait_part(pg, parts[1], timeout=9000)
        check(lang, f"the countdown ends and part {parts[1]} loads by itself", pg.evaluate("window.__player.current()") == 1
              and not pg.locator(".pl-next.on").count())
    pg.evaluate("localStorage.clear()")
    check(lang, "the player: no console error, no failed request, 0 external requests", not problems, "; ".join(problems[:3]))
    pg.close()

    # ---- every built part page, alone
    for k in parts:
        lp = b.new_page(viewport={"width": 1280, "height": 1600})
        probs: list[str] = []
        watch(lp, probs)
        lp.goto(f"{BASE}/{pre}lessons/part-{k}/index.html", wait_until="networkidle")
        lp.wait_for_function("window.__lesson !== undefined", timeout=10000)
        info = lp.evaluate("""() => ({errors: window.__lesson.errors || [],
            plc: window.__lesson.placement ? {checked: window.__lesson.placement.dataChecked, differ: window.__lesson.placement.dataDiffer,
                seedsDiffer: window.__lesson.placement.seedsDiffer} : null,
            subs: [...document.querySelectorAll('.subsel select option')].map(o => o.textContent.trim()),
            sounds: !!document.querySelector('button[data-snd=sfx]'),
            audio: document.getElementById('lesson-audio').getAttribute('src')})""")
        who = f"lesson part {k}"
        check(lang, f"{who}: no console error, no failed request, 0 external requests", not probs, "; ".join(probs[:3]))
        check(lang, f"{who}: window.__lesson.errors is empty", info["errors"] == [], str(info["errors"][:3]))
        check(lang, f"{who}: placement.dataDiffer = 0 and seedsDiffer = 0 (the lesson's replay agrees with the checker; {info['plc'] and info['plc']['checked']} runs checked)",
              bool(info["plc"]) and info["plc"]["differ"] == 0 and not info["plc"]["seedsDiffer"], str(info["plc"]))
        # subtitles: Off, the voice's own language, the other language and Chinese
        other_name = {"en": "Français", "fr": "English"}[lang]
        check(lang, f"{who}: the subtitles menu offers the other language ({other_name}) and 中文", other_name in info["subs"] and "中文" in info["subs"], str(info["subs"]))
        check(lang, f"{who}: the 'Sounds' button is there", info["sounds"])
        got = lp.request.get(f"{BASE}/{pre}lessons/part-{k}/{info['audio']}").status if info["audio"] else None
        check(lang, f"{who}: audio file answers 200", got == 200, str(got))
        lp.close()
    check(lang, f"lessons built: {len(parts)} of {N_PARTS} parts" + ("" if len(parts) == N_PARTS else " (the others are skipped)"), True)


def t_next_title(lang: str, parts: list[int], i: int) -> str:
    return build_site.LANGS[lang]["part_titles"][parts[i] - 1]


with sync_playwright() as p:
    b = p.chromium.launch()
    for lang, t in TXT.items():
        docs_lang = DOCS / t["prefix"]
        pg = b.new_page(viewport={"width": 1280, "height": 2000})
        problems: list[str] = []
        watch(pg, problems)
        url = f"{BASE}/{t['prefix']}index.html"
        pg.goto(url, wait_until="networkidle")
        pg.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; })")
        pg.wait_for_load_state("networkidle")
        pg.wait_for_timeout(300)

        # --- page structure
        check(lang, "html lang attribute", pg.get_attribute("html", "lang") == lang)
        broken = pg.evaluate("[...document.images].filter(i => !i.naturalWidth).map(i => i.src)")
        check(lang, "every image loads (the lab screenshot)", not broken and pg.locator("#lab img").count() == 1, str(broken))
        fonts = pg.evaluate("document.fonts.check('16px \"Source Sans 3\"') && document.fonts.check('700 16px Fraunces')")
        check(lang, "self-hosted fonts load", fonts)
        check(lang, f"{N_SECTIONS[lang]} transcript sections", pg.locator("#transcript h3").count() == N_SECTIONS[lang], str(pg.locator("#transcript h3").count()))
        check(lang, "no video, no slides, no walkthrough, no speed buttons on the page",
              pg.locator("video, .player, .parts, .speed, .slides, .walk, #slides, #walkthrough, #video").count() == 0)
        check(lang, "page title and lead are in the page language",
              ("Simulated annealing" in pg.title()) if lang == "en" else ("recuit simulé" in pg.title()))

        # --- downloads: transcript, quiz, and the example files the page itself lists
        for f in ("transcript.md", "quiz.json"):
            check(lang, f"download {f}", pg.request.get(f"{BASE}/{t['prefix']}{f}").status == 200)
        links = pg.eval_on_selector_all(".files a", "as => as.map(a => a.href)")
        names = sorted(Path(l).name for l in links)
        check(lang, f"{len(EXAMPLE_FILES)} example files listed (no examples/wrong)", names == EXAMPLE_FILES, str(names))
        for l in links:
            check(lang, f"download {Path(l).name} (page link)", pg.request.get(l).status == 200, l)
        check(lang, "the Track A guide is rendered in the page language", pg.locator("#implement .md h2").count() >= 8
              and (("Golden 1" in pg.inner_text("#implement")) if lang == "en" else ("Référence 1" in pg.inner_text("#implement"))))

        # --- quiz: right answers give 8/8, wrong ones 0/8
        quiz = QUIZ[lang]
        n = len(quiz["items"])
        for label, pick in (("right", lambda it: correct_index(it)), ("wrong", lambda it: 1 - correct_index(it) if it["type"] == "true_false" else (correct_index(it) + 1) % len(it["choices"]))):
            pg.locator("#quiz-root button:has-text('Reset'), #quiz-root button:has-text('Recommencer')").first.click()
            for i, item in enumerate(quiz["items"]):
                pg.locator(f"#quiz-root input[name=q{i}]").nth(pick(item)).check()
            pg.locator("#quiz-root button.primary").click()
            score = pg.inner_text("#quiz-root .score")
            want = f"{n} / {n}" if label == "right" else f"0 / {n}"
            word = t["pass"] if label == "right" else t["fail"]
            check(lang, f"quiz {label} answers -> {want}", score.startswith(want) and word in score, score)
        check(lang, "quiz text is in the page language", quiz["items"][0]["prompt"][:30] in pg.inner_text("#quiz-root"))

        # --- language switch keeps the hash (page)
        pg.goto(f"{url}#quiz", wait_until="networkidle")
        pg.locator("a.lang-switch").click()
        pg.wait_for_load_state("networkidle")
        want_url = f"{BASE}/{'' if lang == 'fr' else 'fr/'}index.html#quiz"
        check(lang, "switch keeps #hash on the page", pg.url == want_url, pg.url)
        check(lang, "switch lands on the other language", pg.get_attribute("html", "lang") == ("en" if lang == "fr" else "fr"))

        # --- lab: opens in the same language; its switch goes to the other lab
        pg.goto(url, wait_until="networkidle")
        pg.locator(f"a.btn.primary:has-text('{t['lab_btn']}')").click()
        pg.wait_for_selector("#sa-floor")
        check(lang, "lab opens in the same language", pg.get_attribute("html", "lang") == lang)
        text = pg.inner_text("body")
        left = [w for w in t["leftover"] if w in text]
        check(lang, "no English left in the French lab" if lang == "fr" else "lab shows its English text",
              (not left) if lang == "fr" else "Challenges" in text, str(left))
        n_opts = pg.locator("#lab-chal-sel option").count()
        check(lang, "9 challenges listed", n_opts == 9, str(n_opts))
        lab_url = pg.url
        pg.goto(lab_url + "#top", wait_until="networkidle")
        pg.locator(".site-nav a[hreflang]").click()
        pg.wait_for_selector("#sa-floor")
        check(lang, "lab switch goes to the other lab", pg.get_attribute("html", "lang") == ("en" if lang == "fr" else "fr"))
        pg.locator(".site-nav a", has_text=re.compile("Lab 07 home|Accueil du Lab 07")).first.click()
        pg.wait_for_load_state("networkidle")
        check(lang, "lab header links back to the page", pg.locator("#lab").count() == 1)
        check(lang, "0 console errors, 404s or external requests", not problems, "; ".join(problems[:4]))
        pg.close()
        check_lessons(b, lang, t, docs_lang)
    b.close()

# --- static checks on the built files
docs = DOCS
for name in (f"tools/{TOOL}", f"fr/tools/{TOOL}"):
    d = docs / name
    check("static", f"{name} has no tests/ folder", d.is_dir() and not (d / "tests").exists() and not list(d.glob("test_*")))
    check("static", f"{name} has the model and strings files", (d / "sa-placement-lab-model.js").is_file() and (d / "sa-placement-strings.js").is_file())
en_js = (docs / f"tools/{TOOL}/sa-placement-strings.js").read_text(encoding="utf-8")
fr_js = (docs / f"fr/tools/{TOOL}/sa-placement-strings.js").read_text(encoding="utf-8")
check("static", "the French lab uses the French strings module, the English one the original",
      fr_js == (HERE / "i18n/fr/sa-placement-strings.js").read_text(encoding="utf-8") and "Reset workspace" in en_js
      and "Réinitialiser" in fr_js and "Reset workspace" not in fr_js)
check("static", "examples/wrong/ is not published", not (docs / "examples/wrong").exists())
check("static", "no video, subtitles file, deck or PDF in docs/ (parts/, video.mp4, *.vtt, *.srt, slides*, steps)",
      not [f for f in docs.rglob("*") if f.is_file() and (f.suffix in {".mp4", ".vtt", ".srt", ".pdf", ".pptx"} or f.name.startswith("slides")
           or "parts" in f.relative_to(docs).parts or "steps" in f.relative_to(docs).parts)])
cs = importlib.util.spec_from_file_location("check_sentences", HERE / "tools/check_sentences.py")
cs_mod = importlib.util.module_from_spec(cs)
cs.loader.exec_module(cs_mod)
check("static", "EN, FR and ZH have the same number of sentences in every slide (tools/check_sentences.py)",
      cs_mod.main(["--teacher", str(args.teacher)]) == 0)

ext = []
for f in list(docs.rglob("*.css")) + list(docs.rglob("*.js")) + list(docs.rglob("*.html")):
    s = f.read_text(encoding="utf-8", errors="ignore")
    ext += [f"{f.relative_to(docs)}: {m}" for m in re.findall(r"@import\s+url\(\s*[\"']?https?://[^)]+|<(?:script|link|img)[^>]+(?:src|href)=[\"']https?://[^\"']+|fonts\.(?:googleapis|gstatic)\.com", s)
            if "rel=\"alternate\"" not in m]
check("static", "no external stylesheet, script, image or font reference in docs/", not ext, "; ".join(ext[:3]))

w = max(len(r[1]) for r in rows)
bad = [r for r in rows if not r[2]]
for lang, what, ok in rows:
    print(f"{lang:6} {what.ljust(w)}  {'ok' if ok else 'FAIL'}")
for lang in ("en", "fr", "static"):
    mine = [r for r in rows if r[0] == lang]
    print(f"[{lang}] {len(mine)} checks, {sum(1 for r in mine if not r[2])} failed")
print(f"\n{len(rows)} checks, {len(bad)} failed")
sys.exit(1 if bad else 0)
