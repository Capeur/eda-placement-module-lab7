#!/usr/bin/env python3
"""Build one animated lesson page from a storyboard, a timing file and its audio.

  python3 build_lesson.py --storyboard storyboard.json --timing timing-en.json --audio lesson-en.m4a \
      --lang en --out docs/lessons/part-1/            # writes index.html + lesson-en.m4a next to it
  ... --fonts site_src/fonts                          # self-host the three fonts (needed in mainland China)
  ... --inline-audio --artifact                       # one self-contained file to preview as a claude.ai artifact
  ... --data bstar-check.json                         # floorplan scene: the lab checker's --json (named trees + packs)
  ... --data trace_seed42_60.json seeds_1_200.json    # placement scene: the checker's traces (+ the seeds file)

The page is static: engine + CSS + data in one HTML file, the audio beside it (or inlined).
"""
from __future__ import annotations

import argparse
import base64
import json
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ENGINE = HERE.parent / "engine"
GOOGLE = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
          '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700'
          '&family=IBM+Plex+Mono:wght@400;500&family=Source+Sans+3:wght@400;600;700&display=swap">')
FONT_FILES = {  # @fontsource woff2 names used by the course sites (site_src/fonts)
    ("Fraunces", 500): "fraunces-latin-500-normal.woff2", ("Fraunces", 700): "fraunces-latin-700-normal.woff2",
    ("IBM Plex Mono", 400): "ibm-plex-mono-latin-400-normal.woff2", ("IBM Plex Mono", 500): "ibm-plex-mono-latin-500-normal.woff2",
    ("Source Sans 3", 400): "source-sans-3-latin-400-normal.woff2", ("Source Sans 3", 600): "source-sans-3-latin-600-normal.woff2",
    ("Source Sans 3", 700): "source-sans-3-latin-700-normal.woff2",
}
REQUIRED = {"graph": ["graph", "poses", "timeline", "overlays"], "floorplan": ["floorplan", "timeline", "overlays"],
            "placement": ["placement", "timeline", "overlays"]}


def data_from_checker(d: dict) -> dict:
    """The Lab 05 checker's --json (bstar_check.py): outline, modules, colours, and every scene as a named tree with
    the pack the checker computed (the engine recomputes each one and reports any disagreement as an error)."""
    out = {"outline": d.get("outline"), "modules": d.get("modules"), "colors": d.get("colors", {}), "trees": {}, "expect": {}}
    for sc in d.get("scenes", []):
        out["trees"][sc["id"]] = {"tree": sc["tree"], "rotated": sc.get("rotated", [])}
        out["expect"][sc["id"]] = sc["pack"]
    return out


def add_placement_data(sb: dict, d: dict) -> str:
    """Placement scene: one --json trace of the lab checker (sa_place_check.py --json: header + moves_list) becomes a
    named run "seed<seed>_<moves>"; the seeds file (seeds_1_200.json) becomes the spread. Only what the engine needs to
    re-run and compare is kept (per move: cell, axis, accepted, wirelength, dice draw)."""
    data = sb.setdefault("placement", {}).setdefault("data", {"runs": {}, "seeds": None})
    if "moves_list" in d:
        name = f"seed{d['seed']}_{d['moves']}" + ("_freeze" + "".join(d["frozen"]) if d.get("frozen") else "")
        data["runs"][name] = {k: d[k] for k in ("seed", "moves", "t0", "cool", "step", "cells", "nets", "walls", "start", "best", "accepted") if k in d}
        data["runs"][name]["frozen"] = d.get("frozen", [])
        data["runs"][name]["m"] = [[m["cell"], m["axis"], 1 if m["accepted"] else 0, m["hpwl"], m["u"]] for m in d["moves_list"]]
        return f"run {name}"
    if "seeds" in d:
        data["seeds"] = {"moves": d.get("moves", 60), "seeds": [{k: x[k] for k in ("seed", "best", "final", "accepted", "rejected")} for x in d["seeds"]]}
        return f"{len(d['seeds'])} seeds"
    raise SystemExit("--data: not a trace (moves_list) or a seeds file (seeds) of the placement checker")


def check_placement(sb: dict) -> list[str]:
    probs = []
    pl = sb.get("placement", {})
    if not (pl.get("data", {}).get("runs") or pl.get("base")):
        probs.append("placement: no run (build with --data <trace json> ..., or give placement.base)")
    for k in ("floorBox", "sideBox"):
        b = pl.get(k)
        if b and not (b[0] >= 0 and b[1] >= 0 and b[0] + b[2] <= 960 and b[1] + b[3] <= 540):
            probs.append(f"placement.{k} {b} is outside the 960x540 stage")
    for i, item in enumerate(sb.get("timeline", [])):
        unknown = set(item) - {"at", "run", "move", "camera", "side", "dim", "walker"}
        if unknown:
            probs.append(f"timeline #{i}: keys {sorted(unknown)} do not exist in the placement scene")
    return probs


def check_floorplan(sb: dict) -> list[str]:
    probs = []
    fp = sb.get("floorplan", {})
    data = fp.get("data", {})
    if not (fp.get("modules") or data.get("modules")):
        probs.append("floorplan: no modules (give floorplan.modules, or build with --data <checker json>)")
    for k in ("treeBox", "gridBox"):
        b = fp.get(k)
        if b and not (b[0] >= 0 and b[1] >= 0 and b[0] + b[2] <= 960 and b[1] + b[3] <= 540):
            probs.append(f"floorplan.{k} {b} is outside the 960x540 stage")
    for i, item in enumerate(sb.get("timeline", [])):
        unknown = set(item) - {"at", "tree", "placed", "camera", "panel", "dim"}
        if unknown:
            probs.append(f"timeline #{i}: keys {sorted(unknown)} do not exist in the floorplan scene")
    return probs


def check_storyboard(sb: dict) -> list[str]:
    scene = sb.get("scene", "graph")
    if scene not in REQUIRED:
        return [f"unknown scene '{scene}' (graph, floorplan or placement)"]
    probs = [f"storyboard has no '{k}'" for k in REQUIRED[scene] if k not in sb]
    if scene in ("floorplan", "placement"):
        for i, o in enumerate(sb.get("overlays", [])):
            for k in ("from", "type"):
                if k not in o:
                    probs.append(f"overlay #{i} has no '{k}'")
        return probs + (check_floorplan(sb) if scene == "floorplan" else check_placement(sb))
    g = sb.get("graph", {})
    nodes = set(g.get("nodes", []))
    for e in g.get("edges", []):
        u, v = (e[0], e[1]) if isinstance(e, list) else (e.get("u"), e.get("v"))
        if u not in nodes or v not in nodes:
            probs.append(f"edge {e} uses a node that is not in graph.nodes")
    for name, pose in sb.get("poses", {}).items():
        for n in nodes:
            p = pose.get(n)
            if not p:
                probs.append(f"pose {name}: no position for {n}")
            elif not (30 <= p[0] <= 930 and 30 <= p[1] <= 510):
                probs.append(f"pose {name}: {n} at {p} is outside the 960x540 stage (keep 30 px clear)")
    for i, o in enumerate(sb.get("overlays", [])):
        for k in ("from", "type"):
            if k not in o:
                probs.append(f"overlay #{i} has no '{k}'")
    return probs


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--storyboard", required=True, type=Path)
    ap.add_argument("--timing", required=True, type=Path)
    ap.add_argument("--audio", required=True, type=Path)
    ap.add_argument("--lang", required=True)
    ap.add_argument("--out", required=True, type=Path, help="output folder (index.html is written there)")
    ap.add_argument("--fonts", type=Path, help="folder with the woff2 files to self-host (else Google Fonts)")
    ap.add_argument("--inline-audio", action="store_true", help="embed the audio as base64 (single file)")
    ap.add_argument("--artifact", action="store_true", help="omit doctype/html/head/body (claude.ai artifact preview)")
    ap.add_argument("--storage-key", default=None, help="localStorage key for the speed (default lesson-speed)")
    ap.add_argument("--ui", type=Path, help="JSON of UI string overrides for this language")
    ap.add_argument("--data", type=Path, nargs="+", help="the lab checker's --json output. floorplan: one file (outline, modules, colours, named trees and their packs). placement: one or more trace files and the seeds file")
    ap.add_argument("--subs", action="append", default=[], metavar="LANG=FILE", help="subtitles in another language than the voice: that language's timing file, or a subs file from subs_build.py (repeat). Same sentences per slide as the voice, or the build stops")
    a = ap.parse_args()

    sb = json.loads(a.storyboard.read_text(encoding="utf-8"))
    timing = json.loads(a.timing.read_text(encoding="utf-8"))
    for f in a.data or []:
        d = json.loads(f.read_text(encoding="utf-8"))
        if sb.get("scene") == "placement":
            print(f"data: {f.name} -> {add_placement_data(sb, d)}")
        else:
            sb.setdefault("floorplan", {})["data"] = data_from_checker(d)
    probs = check_storyboard(sb)
    if probs:
        print("storyboard problems:\n  " + "\n  ".join(probs), file=sys.stderr)
        return 1
    if timing.get("lang") and timing["lang"] != a.lang:
        print(f"timing file is for {timing['lang']}, not {a.lang}", file=sys.stderr)
        return 1

    a.out.mkdir(parents=True, exist_ok=True)
    if a.inline_audio:
        audio_src = "data:audio/mp4;base64," + base64.b64encode(a.audio.read_bytes()).decode()
    else:
        dest = a.out / f"lesson-{a.lang}{a.audio.suffix}"
        if a.audio.resolve() != dest.resolve():
            shutil.copyfile(a.audio, dest)
        audio_src = dest.name

    head = GOOGLE
    if a.fonts:
        fdir = a.out / "fonts"
        fdir.mkdir(exist_ok=True)
        faces = []
        for (fam, wt), fn in FONT_FILES.items():
            src = a.fonts / fn
            if not src.is_file():
                print(f"missing font file {src}", file=sys.stderr)
                return 1
            shutil.copyfile(src, fdir / fn)
            faces.append(f"@font-face{{font-family:'{fam}';font-weight:{wt};font-style:normal;font-display:swap;src:url(fonts/{fn}) format('woff2')}}")
        head = "<style>" + "".join(faces) + "</style>"

    data = {"sb": sb, "timing": timing, "lang": a.lang}
    subs = {}
    for item in a.subs:
        code, _, f = item.partition("=")
        if not f:
            print(f"--subs needs LANG=FILE, not {item}", file=sys.stderr)
            return 1
        other = json.loads(Path(f).read_text(encoding="utf-8"))["sentences"]
        mine = timing["sentences"]
        bad = [n for n in sorted({s["slide"] for s in mine} | {s["slide"] for s in other})
               if sum(s["slide"] == n for s in mine) != sum(s["slide"] == n for s in other)]
        if bad:
            print(f"subtitles {code}: not the same number of sentences as the voice in slide(s) {bad} "
                  f"(run subs_build.py --against, or compare the two transcripts)", file=sys.stderr)
            return 1
        subs[code] = [s["text"] for s in other]
    if subs:
        data["subs"] = subs
    if a.storage_key:
        data["storageKey"] = a.storage_key
    if a.ui:
        data["ui"] = json.loads(a.ui.read_text(encoding="utf-8"))
    title = sb.get("pageTitle", sb.get("title", "Lesson"))
    title = title.get(a.lang, title.get("en", "Lesson")) if isinstance(title, dict) else title
    # read by build_player.py to list the parts
    esc_attr = lambda v: str(v).replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")
    lt = sb.get("title", title)
    lt = lt.get(a.lang, lt.get("en", "")) if isinstance(lt, dict) else lt
    head += f'\n<meta name="lesson:title" content="{esc_attr(lt)}">\n<meta name="lesson:duration" content="{timing["duration"]:.1f}">'
    html = (ENGINE / "lesson.html").read_text(encoding="utf-8")
    html = (html.replace("__LANG__", a.lang).replace("__TITLE__", title).replace("__HEAD_EXTRA__", head)
            .replace("__CSS__", (ENGINE / "lesson.css").read_text(encoding="utf-8"))
            .replace("__ENGINE__", (ENGINE / "lesson-engine.js").read_text(encoding="utf-8"))
            .replace("__AUDIO_SRC__", audio_src)
            .replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/")))
    if a.artifact:
        import re
        html = re.sub(r"<!doctype html>\s*<html[^>]*>\s*<head>\s*<meta charset=\"utf-8\">\s*<meta name=\"viewport\"[^>]*>\s*", "", html, flags=re.I)
        html = html.replace("</head>\n<body>\n", "").replace("</body>\n</html>\n", "")
    out = a.out / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"{out} ({out.stat().st_size / 1e6:.2f} MB), {timing['duration']:.1f} s, {len(timing['sentences'])} sentences, words {timing.get('words', '?')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
