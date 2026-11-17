#!/usr/bin/env python3
"""Screenshot of the built lab (the preset run: seed 42, 60 moves) for the landing page: site_src/img/lab-<lang>.png.

    python3 ~/.claude/skills/lesson-animator/scripts/serve.py docs 8090      # in another shell
    python3 tools/capture_lab.py [--base http://127.0.0.1:8090]              # then rebuild the site

Shows the chip with its six cells and net boxes, the curve of the run and the move log (the whole chip-and-chart block).
"""
import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser()
ap.add_argument("--base", default="http://127.0.0.1:8090")
args = ap.parse_args()

with sync_playwright() as p:
    b = p.chromium.launch()
    for lang, prefix in (("en", ""), ("fr", "fr/")):
        pg = b.new_page(viewport={"width": 1280, "height": 1100}, device_scale_factor=1)
        pg.goto(f"{args.base.rstrip('/')}/{prefix}tools/sa-placement/index.html", wait_until="networkidle")
        pg.add_style_tag(content="html{scroll-behavior:auto!important}")
        pg.wait_for_selector("#sa-floor")
        pg.click("#sa-preset")
        pg.wait_for_selector("#sa-log tbody tr")
        pg.wait_for_timeout(500)
        pg.wait_for_timeout(800)   # the shared chrome redraws the workspace when its size settles
        out = HERE / "site_src/img" / f"lab-{lang}.png"
        pg.locator(".sa-views").screenshot(path=str(out))
        print("wrote", out)
        pg.close()
    b.close()
