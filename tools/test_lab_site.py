#!/usr/bin/env python3
"""Browser test of the BUILT site's lab (simulated annealing placement, Lab 07), in English and French.

It is the course's own platform/tools/sa-placement/tests/test_lab_playwright.py (same learner actions, same cases:
every challenge passes when solved with the real controls, and never on page load, from the Apply SA preset alone,
from the preset with the final view and the study tally, after Reset, from a wrong answer, from the lesson's own run
(seed 42) when seed 162 is asked, or after an edit made on a run's result; the script's numbers 49.6 / 44 / 16, seed 42's
worked-example tally 11 / 9 / 24 and seed 162's hidden tally 16 / 5 / 20; the annealer always starts from the starter;
one fixed colour per cell id) run against docs/ and docs/fr/. The actions use element ids, so they are identical in both
languages; the LANGS table holds only what the page says in each language (the PASS word, the "Check:" line, the progress
word, the words that must NOT be left over from the other language). The French lab keeps the decimal point (49.6).

    python3 ~/.claude/skills/lesson-animator/scripts/serve.py docs 8090      # from this repo's root, in another shell
    python3 tools/test_lab_site.py [--base http://127.0.0.1:8090] [--lang en|fr|both] [--teacher ../eda-learning-lab7-pl] [--headed]

Also per language: html lang, no console error, failed request, HTTP error or request outside the site; the French
lab shows no English snippet of the lab (page, messages, Check lines). Needs: pip install playwright pillow &&
python3 -m playwright install chromium
"""
from __future__ import annotations

import argparse
import io
import re
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://127.0.0.1:8090")
ap.add_argument("--lang", choices=["en", "fr", "both"], default="both")
ap.add_argument("--teacher", default=HERE.parent / "eda-learning-lab7-pl", type=Path)
ap.add_argument("--headed", action="store_true")
args = ap.parse_args()
BASE = args.base.rstrip("/")
sys.path.insert(0, str(args.teacher / "courses/learn_placement/module02-07-sa-placement/examples"))
import sa_place_check as C  # noqa: E402

COLORS = C.COLORS  # A blue, B teal, C amber, D violet, E rose, F slate
GOLDEN = {"A": (2, 2), "B": (4, 2), "C": (2, 4), "D": (4, 4), "E": (3, 3), "F": (1, 3)}

# what the page says in each language
LANGS = {
    "en": {"prefix": "", "html_lang": "en", "check_head": "Check:", "progress": "9 /", "status_pass": "PASS", "leftover": []},
    "fr": {"prefix": "fr/", "html_lang": "fr", "check_head": "Vérification :", "progress": "9 /", "status_pass": "RÉUSSI",
           "leftover": ["Skip to content", "Interactive tool", "Pick a challenge", "Reset workspace", "Show hint", "Next challenge",
                        "Apply SA preset", "Run SA from the starter", "Show the tally", "Count the accepted moves",
                        "Save my count", "Your placement", "Closest cells", "Total wirelength", "No run yet",
                        "Every move of the run", "accepted moves", "rejected moves", "worse than the best", "A lucky dice",
                        "Check:", "Not yet", "Accepted is not", "Challenges", "Load starter example"]},
}


# ---------------- learner actions (element ids only) ----------------
def start(pg, cid):
    pg.select_option("#lab-chal-sel", cid)
    pg.click("#lab-chal-start")


def check(pg):
    pg.click("#lab-chal-check")
    return "pass" in (pg.get_attribute("#lab-status", "class") or "").split()


def run(seed, moves):
    def act(pg):
        pg.fill("#sa-seed", str(seed))
        pg.fill("#sa-moves", str(moves))
        pg.click("#sa-run")
    return act


def preset(pg):
    pg.click("#sa-preset")


def reset(pg):
    pg.click("#sa-reset")


def view_final(pg):
    pg.click("#sa-view-final")


def tally(pg):
    pg.click("#sa-tally-btn")


def put(cell, x, y):
    def act(pg):
        pg.click(f"#sa-cell-{cell}")
        pg.fill("#sa-put-x", str(x))
        pg.fill("#sa-put-y", str(y))
        pg.click("#sa-put")
    return act


def count(b, w, f):
    def act(pg):
        pg.fill("#sa-count-better", str(b))
        pg.fill("#sa-count-worse", str(w))
        pg.fill("#sa-count-free", str(f))
        pg.click("#sa-save-count")
    return act


def lucky(m):
    def act(pg):
        pg.fill("#sa-lucky", str(m))
        pg.click("#sa-save-lucky")
    return act


def seq(*acts):
    def act(pg):
        for a in acts:
            a(pg)
    return act


def edit_back(pg):
    """Push A right and back left with the arrows: an edit made on the run's result."""
    pg.click("#sa-cell-A")
    pg.click("#sa-nudge-right")
    pg.click("#sa-nudge-left")


def cell_center(pg, cell):
    """Centre of a cell on screen. The shared chrome redraws the workspace when its size changes (ResizeObserver),
    which replaces the SVG: wait until the same box is read twice in a row."""
    last = None
    for _ in range(40):
        bb = pg.locator(f"#sa-floor g.sa-cell[data-id={cell}] circle.sa-dot").bounding_box()
        if bb and bb == last:
            return bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2
        last = bb
        pg.wait_for_timeout(50)
    raise AssertionError(f"cell {cell} not found on the floor")


def drag(cell, onto):
    """Drag a cell with the mouse onto another cell's place."""
    def act(pg):
        x0, y0 = cell_center(pg, cell)
        x1, y1 = cell_center(pg, onto)
        pg.mouse.move(x0, y0)
        pg.mouse.down()
        for k in range(1, 9):
            pg.mouse.move(x0 + (x1 - x0) * k / 8, y0 + (y1 - y0) * k / 8)
        pg.mouse.up()
    return act


def log_counts(pg):
    """What a learner counts in the log: accepted rows that are better, worse, free."""
    return [pg.locator(f"#sa-log tbody tr.sa-acc.sa-{k}").count() for k in ("better", "worse", "free")]


def count_from_log(pg):
    count(*log_counts(pg))(pg)


def lucky_from_log(pg):
    """Find an accepted worse move with a chance below 20 % by reading the log's columns."""
    rows = pg.eval_on_selector_all("#sa-log tbody tr.sa-acc.sa-worse",
                                   "rs => rs.map(r => [r.dataset.move, r.children[5].textContent])")
    for move, chance in rows:
        if int(re.sub(r"\D", "", chance)) < 20:
            lucky(move)(pg)
            return
    raise AssertionError("no lucky move in the log")


golden_by_hand = seq(*(put(c, x, y) for c, (x, y) in GOLDEN.items()))
pile_all = seq(*(put(c, 4, 4) for c in "ABCDF"))

SOLVE = {
    "by-hand": drag("F", "E"),                                   # F onto E: 48 (the lesson's learner try)
    "below-median": run(1, 60),
    "pile-up": pile_all,
    "count-accepted": seq(run(162, 60), count_from_log),
    "lucky-dice": seq(preset, lucky_from_log),
    "best-vs-final": seq(run(162, 60), view_final),
    "more-moves": run(42, 300),
    "ends-worse": run(199, 60),
    "short-spread": golden_by_hand,
}
WRONG = {
    "by-hand": put("F", 1, 4),                                   # 51
    "below-median": run(4, 60),                                  # 49.9
    "pile-up": seq(*(put(c, 4, 4) for c in "ABCF")),             # D left out
    "count-accepted": seq(run(162, 60), count(41, 0, 0)),         # "accepted = better"
    "lucky-dice": seq(preset, lucky(1)),                         # move 1: 37 %
    "best-vs-final": seq(preset, view_final),                    # seed 42: final = best
    "more-moves": run(42, 172),                                  # one move short of 14
    "ends-worse": run(162, 60),
    "short-spread": seq(golden_by_hand, put("F", 3, 3)),         # F on E: too close
}
AFTER_RUN = {  # the hand challenges: the right placement, but built on an SA result
    "by-hand": seq(preset, put("F", 4, 4)),
    "pile-up": seq(preset, pile_all),
    "short-spread": seq(preset, golden_by_hand),
}


def negatives(cid):
    out = {
        "load (Start, Check)": lambda pg: None,
        "Apply SA preset alone": preset,
        "preset + final view + study tally": seq(preset, view_final, tally),
        "Reset to starter": reset,
        "wrong answer": WRONG[cid],
        "edit after the solution": seq(SOLVE[cid], edit_back) if cid not in AFTER_RUN else None,
        "solution built on a run": AFTER_RUN.get(cid),
    }
    if cid == "count-accepted":
        out["study tally, then count"] = seq(run(162, 60), tally, count_from_log)
        out["the lesson's run (seed 42), its own tally"] = seq(preset, count(11, 9, 24))
    return {k: v for k, v in out.items() if v}


def pixel_rgb(shot, pg, cell):
    b = pg.locator(f"#sa-floor g.sa-cell[data-id={cell}] circle.sa-dot").bounding_box()
    return shot.getpixel((round(b["x"] + b["width"] * 0.22), round(b["y"] + b["height"] * 0.5)))[:3]


def near(rgb, hexc, tol=6):
    ref = tuple(int(hexc[i:i + 2], 16) for i in (1, 3, 5))
    return all(abs(a - b) <= tol for a, b in zip(rgb, ref))


def run_text(pg):
    """The run's numbers (the block above the tally line)."""
    return pg.inner_text("#sa-run-info pre")


def title_of(pg, cell):
    return pg.text_content(f"#sa-floor g.sa-cell[data-id={cell}] title")

rows = []


def run_lang(b, lang: str, T: dict) -> None:
    url = f"{BASE}/{T['prefix']}tools/sa-placement/index.html"
    pg = b.new_page(viewport={"width": 1400, "height": 3000})
    errors = []
    problems = []
    pg.on("console", lambda m: m.type == "error" and errors.append(m.text))
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("requestfailed", lambda r: errors.append(f"request failed {r.url}"))
    pg.on("response", lambda r: r.status >= 400 and errors.append(f"HTTP {r.status}: {r.url}"))
    pg.on("request", lambda r: not r.url.startswith((BASE, "data:", "blob:")) and errors.append(f"external: {r.url}"))
    pg.goto(url, wait_until="networkidle")
    pg.add_style_tag(content="html{scroll-behavior:auto!important}")
    pg.wait_for_selector("#sa-floor")

    rows.append((lang, "page", "html lang attribute", pg.get_attribute("html", "lang") == T["html_lang"]))
    cids = pg.eval_on_selector_all("#lab-chal-sel option", "os => os.map(o => o.value)")
    rows.append((lang, "page", "9 challenges in the menu", len(cids) == 9 and set(cids) == set(SOLVE)))
    rows.append((lang, "page", "Check is off until Start (page load)", pg.is_disabled("#lab-chal-check")))
    rows.append((lang, "page", "no run on load: no curve, no log", pg.locator("#sa-chart .sa-cur").count() == 0 and pg.locator("#sa-log").count() == 0))

    for cid in cids:
        start(pg, cid)
        SOLVE[cid](pg)
        rows.append((lang, cid, "positive", check(pg)))
        if cid == "by-hand":  # the words of the page in this language: status, Check line
            rows.append((lang, cid, f"status says {T['status_pass']}, Check line starts with {T['check_head']}",
                         T["status_pass"] in pg.inner_text("#lab-status") and pg.inner_text("#sa-why").startswith(T["check_head"])))
        for name, act in negatives(cid).items():
            start(pg, cid)
            act(pg)
            rows.append((lang, cid, f"negative: {name}", not check(pg)))
    prog = pg.inner_text(".chal-progress")
    rows.append((lang, "page", f"progress shows 9 cleared ({prog.strip()})", prog.strip().startswith(T["progress"])))

    # ---------------- what the script promises ----------------
    pg.click("#lab-starter")
    preset(pg)
    t = run_text(pg)
    rows.append((lang, "script", "slide 29: preset = seed 42, 60 moves: 49.6, 44 accepted, 16 rejected",
                 "49.6" in t and re.search(r"\b44\b", t) and re.search(r"\b16\b", t) and "49.5755" in t))
    n_rows = pg.locator("#sa-log tbody tr").count()
    acc_rows = pg.locator("#sa-log tbody tr.sa-acc").count()
    rows.append((lang, "script", f"log has 60 moves, {acc_rows} accepted", n_rows == 60 and acc_rows == 44))
    rows.append((lang, "script", f"accepted is not progress: the log counts {log_counts(pg)} = 11 better, 9 worse, 24 free",
                 log_counts(pg) == [11, 9, 24]))
    rows.append((lang, "script", "seed 42 shows its tally as the worked example: 11 + 9 + 24",
                 pg.locator("#sa-tally-hidden").count() == 0 and bool(re.search(r"\b11\b.*\b9\b.*\b24\b", pg.inner_text("#sa-tally")))))
    # the run to count is seed 162: 41 accepted = 16 better + 5 worse + 20 free, tally hidden until counted or revealed
    run(162, 60)(pg)
    n162 = pg.locator("#sa-log tbody tr.sa-acc").count()
    rows.append((lang, "script", f"seed 162: the log counts {log_counts(pg)} = 16 better, 5 worse, 20 free ({n162} accepted)",
                 log_counts(pg) == [16, 5, 20] and n162 == 41))
    rows.append((lang, "script", "seed 162: the tally is hidden until counted or revealed", pg.locator("#sa-tally").count() == 0
                 and pg.locator("#sa-tally-hidden").count() == 1))
    tally(pg)
    rows.append((lang, "script", "seed 162: study tally shows 16 + 5 + 20", bool(re.search(r"\b16\b.*\b5\b.*\b20\b", pg.inner_text("#sa-tally")))))
    preset(pg)
    best_dot = pg.locator("#sa-chart .sa-best-dot").count()
    rows.append((lang, "script", "chart: current curve, best curve, best dot", pg.locator("#sa-chart .sa-cur").count() == 1
                 and pg.locator("#sa-chart .sa-best").count() == 1 and best_dot == 1))
    # typed seed 42 / 60 = the preset
    reset(pg)
    run(42, 60)(pg)
    rows.append((lang, "script", "typing seed 42 and 60 moves gives the same run", run_text(pg) == t))
    # the annealer starts from the starter, whatever the workspace shows
    reset(pg)
    seq(put("F", 4, 4), put("A", 3, 3))(pg)
    run(42, 60)(pg)
    rows.append((lang, "script", "run after hand edits starts from the starter (same 49.6, 44, 16)", run_text(pg) == t))
    run(42, 60)(pg)
    rows.append((lang, "script", "a second run starts from the starter too (not 20.3)", run_text(pg) == t))
    # an edit cancels the run's numbers
    edit_back(pg)
    t2 = run_text(pg)
    rows.append((lang, "script", "an edit after a run cancels its numbers (no curve, no log, no 44)",
                 pg.locator("#sa-chart .sa-cur").count() == 0 and pg.locator("#sa-log").count() == 0 and "44" not in t2))
    # best versus final with another seed
    run(162, 60)(pg)
    best_total = pg.inner_text("#sa-floor-total")
    view_final(pg)
    final_total = pg.inner_text("#sa-floor-total")
    rows.append((lang, "script", f"seed 162: best view {best_total.strip()} vs final view {final_total.strip()}",
                 "27.8" in best_total and "27.9" in final_total))
    run(199, 60)(pg)
    t3 = run_text(pg)
    rows.append((lang, "script", "seed 199: best 52.0 (never below the start), final 53.9", "52.0" in t3 and "53.9" in t3))
    # more moves: 300 moves reach 2.6 and pile cells up
    run(42, 300)(pg)
    rows.append((lang, "script", "seed 42, 300 moves: best 2.6 (2.6119)", "2.6119" in run_text(pg)))
    # the shared files are not used for the drawing: the shared canvas is hidden
    rows.append((lang, "colour", "the shared canvas is hidden", not pg.is_visible("#lab-root canvas")))

    # ---------------- hand moves: drag and click ----------------
    reset(pg)
    drag("F", "E")(pg)
    rows.append((lang, "hand", f"drag F onto E -> {title_of(pg, 'F')}, total 48", title_of(pg, "F") == "F (4, 4)" and "48.0" in pg.inner_text("#sa-floor-total")))
    reset(pg)
    pg.click("#sa-cell-B")
    bx, by = cell_center(pg, "E")
    pg.mouse.click(bx + 40, by)   # one square right of E (40 px per square in the SVG, scaled)
    t_b = title_of(pg, "B")
    rows.append((lang, "hand", f"click B, then click the floor right of E -> {t_b}", t_b.startswith("B (5") and t_b.endswith(", 4)")))

    # ---------------- colours ----------------
    for label, setup in (("starter", lambda pg: pg.click("#lab-starter")), ("after the preset", preset)):
        setup(pg)
        pg.click("#sa-cell-F")  # the amber ring goes around F, outside the sampled point
        shot = Image.open(io.BytesIO(pg.screenshot())).convert("RGB")
        for c in "ABCDEF":
            fill = pg.get_attribute(f"#sa-floor g.sa-cell[data-id={c}] circle.sa-dot", "fill")
            rgb = pixel_rgb(shot, pg, c)
            rows.append((lang, "colour", f"{label}: cell {c} is {COLORS[c]} (attribute and pixel {rgb})", fill == COLORS[c] and near(rgb, COLORS[c])))

    page_text = ""  # every word the lab shows, in its states: starter, a run, the Check line, the log
    start(pg, "count-accepted")
    run(162, 60)(pg)
    count(1, 2, 3)(pg)
    check(pg)
    page_text += pg.inner_text("body")
    pg.select_option("#sa-log-filter", "rejected") if pg.locator("#sa-log-filter").count() else None
    page_text += pg.inner_text("body")
    left = [w for w in T["leftover"] if w in page_text]
    rows.append((lang, "page", ("no English left in the French lab" if lang == "fr" else "the English lab shows its English text")
                 + (f" (left: {left})" if left else ""),
                 (not left) if lang == "fr" else ("Challenges" in page_text and "Check:" in page_text)))
    rows.append((lang, "page", "no console error, no failed request, no HTTP error, 0 external requests", not errors))
    pg.close()


with sync_playwright() as p:
    b = p.chromium.launch(headless=not args.headed)
    for lang in (["en", "fr"] if args.lang == "both" else [args.lang]):
        run_lang(b, lang, LANGS[lang])
    b.close()

fails = 0
pos = sum(1 for _, _, n, _ in rows if n == "positive")
neg = sum(1 for _, _, n, _ in rows if n.startswith("negative"))
for lang, cid, name, good in rows:
    print(f"{lang:3} {'ok  ' if good else 'FAIL'}  {cid:<15} {name}")
    fails += not good
for lang in sorted({r[0] for r in rows}):
    mine = [r for r in rows if r[0] == lang]
    bad = sum(1 for r in mine if not r[3])
    print(f"\n[{lang}] {len(mine) - bad} ok, {bad} FAIL  ({sum(1 for r in mine if r[2] == 'positive')} positive, "
          f"{sum(1 for r in mine if r[2].startswith('negative'))} negative, the rest page, script, hand and colour)")
print(f"\n{len(rows) - fails} ok, {fails} FAIL in all")
sys.exit(1 if fails else 0)
