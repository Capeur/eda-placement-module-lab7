---
name: lesson-animator
description: Turn one part of an eda-learning lab's narration into an animated, interactive lesson page drawn live in the browser and synced to the voice (word-timed text, zooms, counters, auto-pause "pause and guess", click-to-try, EN and FR from one storyboard), with natural pauses and optional MP4 export. Three scenes - "graph" (partitioning/clustering labs - nodes, splits, cut), "floorplan" (floorplanning labs - a B*-tree next to a floor of blocks that drop onto the skyline, swap/turn/move, bounding box) and "placement" (placement labs - cells and net boxes on a chip floor, a simulated-annealing run replayed move by move with dice, thermometer, tally and chart). Use when asked for a dynamic or animated video/lesson for a lab, or to add one next to the site's video parts.
---

# Lesson animator (version 5.0.1)

5.0 step 1 (Lab 07): the **placement** scene; step 1b: stop a move before the dice, piles, landscape sketch, more claims. Step 2: **one player for all parts** (`scripts/build_player.py`). Step 3: **subtitles in another language than the voice** (`--subs`, `scripts/subs_build.py`), the place is kept when the voice language is switched, `scripts/serve.py`. Step 4: **sounds** made by the browser (no audio file), like in a game, on by default with one "Sounds" button (remembered). While the lesson plays: the scene's cues (`cues()` → `[{ t, type }]`, and `soundTracks: { track: type }` for one sound per key of a track), a whoosh for camera moves, a pop for each new headline, a thud for a stamp, a chime for the question. When the learner touches something: a tick on hover, a click on buttons, grab and drop on a dragged cell with a note whose pitch follows the wirelength, a chime for a right answer (`"correct": true` on a question option; `false` gives a low note). Sound types: good, risk, free, reject, best, dice, wall, slide, whoosh, grow, shrink, move, pop, stamp, ask, hover, click, grab, drop, win, miss, pitch. `"sounds": false` in the mount data starts with sounds off. (Background music was tried and dropped: the student found it did not help.)


4.1: a turned block's size label shows its new size. 4.2: code blocks, comments and images in a slide are never
spoken (a code slide used to be read aloud). Lab 05 used this version for all five parts.

Builds a web page that plays the narration and **draws the lesson live** (not a video file). One storyboard
drives English and French; each animation is anchored to a word in each language, so it lands on that word
whatever the language's pace. Everything on screen is a pure function of the audio time, so seeking, the 1×–2×
speed buttons and frame-by-frame MP4 recording all agree.

**Scenes** (`"scene"` in the storyboard):
| Scene | For | Picture | Worked example |
|---|---|---|---|
| `graph` (default) | partitioning, clustering | nodes, weighted edges, splits, cut counter, balance bars | `examples/lab03-part1/` |
| `floorplan` | floorplanning (Lab 05 B*-tree) | B*-tree + floor: blocks fly out of their node and fall onto the skyline; swap / turn / move; bounding box, wasted squares, fits the outline | `examples/lab05-floorplan-demo/` |
| `placement` | placement (Lab 07 simulated annealing) | chip floor with walls, cells, a box per net, wirelength counter; one move up close (ghost, change in wirelength, dice against the chance, verdict), fast replay of a run, thermometer, accepted/rejected tally, chart of current and best, spread over seeds | `examples/lab07-placement-demo/` |

Read the example's README for the scene you use. Version 4 changed nothing for the graph scene: the Lab 03 example
gives pixel-identical frames and the same check result as version 3.

## Hard rules
1. **Numbers come from the lab's rules.** Every number the narration or a text states goes in `claims`; the engine
   recomputes it (graph: cut, legality, the course's mulberry32 dealer; floorplan: the course's B*-tree packing)
   and the checker fails on any mismatch. Floorplan: build with `--data <checker --json>`, and the engine also
   re-packs every tree of the lab checker and must agree with all of them. Placement: build with
   `--data <trace json> ... <seeds json>`; the engine runs the annealer itself (the course's mulberry32 and draw
   order) and must agree with every move of every trace and with every seed of the seeds file.
2. **Never edit the teacher's pipeline.** The lesson page sits *next to* the course video. It reads the
   transcript and (optionally) the site's existing part audio; it writes only into the site repo
   (or a folder the user names).
3. **One storyboard per part, both languages in it.** Each anchor has an `en` and an `fr` word; each text has
   `en` and `fr`. A word that occurs twice in a slide is written `"three#1"` (second occurrence).
4. **Run the checker before showing anything** (`scripts/check_lesson.py`, 0 errors, 0 warnings), and look at
   the contact sheet of each language.
5. Long network steps (voice) print one line per sentence; if nothing new appears for a minute, stop, ask the
   user to switch VPN server, and rerun the same command (finished sentences are cached).
6. **Colours follow the lab**: graph = group colours (the group holding the first node name is blue);
   floorplan = one fixed colour per block id (from the checker JSON), left child solid, right child dashed.

## Inputs (ask once, then write them in the part's folder `lessons/part-N/README.md`)
| Input | Example |
|---|---|
| Transcript(s) | `courses/<course>/<module>/transcript.md` (EN), `i18n/fr/<module>/transcript.md` (FR) |
| Part's slide range | transcript slides `1-6` (the site's `PARTS` use PDF pages; code slides make them differ) |
| Voice source | A) new voice: `voice_build.py` (preferred) · B) the site's `docs/parts/part-N.mp4` + `.vtt`: `timing_from_vtt.py` · C) no voice yet: `draft_timing.py` (silent, to write and check the storyboard early) |
| Voices (A) | listen to samples first; e.g. `en-US-AndrewMultilingualNeural`, `fr-FR-VivienneMultilingualNeural`, `--rate=-4%` |
| Voices (Lab 05) | en-US-AndrewMultilingualNeural, fr-FR-RemyMultilingualNeural, `--rate=-4%` (exact word timings) |
| Lab data | graph: the module's `examples/*.json`; floorplan: the checker's `--json` output (`bstar_check.py --json > examples/bstar-check.json` or a build folder); placement: the checker's trace files and seeds file (`examples/trace_seed42_60.json ... seeds_1_200.json`) |
| Output | site repo `docs/lessons/part-N/` and `docs/fr/lessons/part-N/` |

## Steps (one Claude Code conversation per part is plenty)
1. **Read** `reference/storyboard.md` (format; the floorplan scene has its own section) and
   `reference/design-rules.md`. List the part's spoken sentences in each language:
   `python3 scripts/lessonlib.py <transcript.md> 1-6 --repo <teacher clone>`. EN and FR should have the same
   sentences per slide; if not, anchors still work (they search the whole slide), but compare the two lists.
2. **Write `storyboard.json`**, starting from the example of your scene. Keep its rhythm (one idea per sentence,
   one visual change per idea). Floorplan: trees by the checker's names (`golden`, `lift`, ...), `placed` keyed
   on the word naming each block, the lesson plan from the module's notes (which tree, which blocks, when the
   skyline or the bounding box shows).
3. **Draft check (optional, no voice needed)**:
   `python3 scripts/draft_timing.py --transcript T --slides 1-6 --lang en --storyboard SB --repo <clone> --out-audio build/draft-en.m4a --out-timing build/draft-timing-en.json`,
   then steps 5–6 with those files. Fix the storyboard while the voices are not chosen yet.
4. **Voice + timings** for each language:
   - A (new, natural voice, exact word timings):
     `python3 scripts/voice_build.py --transcript T --slides 1-6 --lang en --voice V --rate=-4% --storyboard SB --repo <teacher clone> --workdir .cache/voice --out-audio build/lesson-en.m4a --out-timing build/timing-en.json`
   - B (reuse the existing narration, estimated word timings):
     `python3 scripts/timing_from_vtt.py --transcript T --slides 1-6 --vtt docs/parts/part-1.vtt --audio docs/parts/part-1.mp4 --lang en --storyboard SB --repo <clone> --out-audio ... --out-timing ...`
   All three add the pauses (`reference/voice-and-pacing.md`).
5. **Build**: `python3 scripts/build_lesson.py --storyboard SB --timing build/timing-en.json --audio build/lesson-en.m4a --lang en --out docs/lessons/part-1 --fonts site_src/fonts --storage-key labNN-lesson-speed [--data examples/bstar-check.json]` (same for `fr` into `docs/fr/lessons/part-1`). `--fonts` self-hosts the fonts (Google Fonts is blocked in mainland China). `--data` is for the floorplan scene.
6. **Check**: `python3 scripts/check_lesson.py docs/lessons/part-1/index.html docs/fr/lessons/part-1/index.html --sheets build/check`. Fix every error and warning in the storyboard (move a text, shorten it, add a pause after a sentence, move a key), rebuild, recheck. Then look at both contact sheets.
7. **Link it from the site** next to the video parts (`reference/site-integration.md`), rebuild the site, run its tests.
5b. **Subtitles in other languages** (optional): add to each `build_lesson.py` call
   `--subs fr=build/lessons/part-1/timing-fr.json` (a voiced language: its timing file) and/or
   `--subs zh=build/lessons/part-1/subs-zh.json` (a language with no voice: first
   `python3 scripts/subs_build.py --transcript i18n/zh/<module>/transcript.md --slides 1-6 --lang zh --against build/lessons/part-1/timing-en.json --out build/lessons/part-1/subs-zh.json`).
   The page then has a "Subtitles" menu: Off, the voice's language (words light up as they are said), or another
   language (the same sentence, shown whole). The choice is remembered for every part. **Every language must have
   the same number of sentences in every slide**; the build stops and names the slides that differ.
7b. **The player with all parts** (once every part of a language is built, and again after any rebuild):
   `python3 scripts/build_player.py --lessons docs/lessons --lang en --heading "<lab title>" --eyebrow "Lab NN · animated lessons" --other fr=../fr/lessons/index.html --back ../index.html --next-url ../tools/<tool>/index.html --next-label "Open the browser lab" --storage-key labNN-lessons`
   (and the same for `docs/fr/lessons` with `--other en=../../lessons/index.html`). It writes `docs/lessons/index.html`:
   part list with lengths and ✓ for finished parts, previous / next, the next part starts by itself after a 4 s
   countdown (can be switched off), a link per part (`index.html#part-3`), and the language link opens the same part.
   Each part page still works alone. Parts built before v5.0 step 2 must be rebuilt first (the script says which).
8. Optional: `python3 scripts/record_mp4.py docs/lessons/part-1/index.html --audio ... --out lesson-part1-en.mp4` (about 3 s of work per second of video at 1280 px).

## Files
- `engine/lesson-engine.js` (core + `graph` and `floorplan` scenes), `engine/lesson.css`, `engine/lesson.html`: the player (no library, no network).
- `scripts/lessonlib.py`: transcript → spoken sentences (the teacher's cleaner when `--repo` is given), anchors, pauses, ffmpeg concat.
- `scripts/voice_build.py`, `scripts/timing_from_vtt.py`, `scripts/draft_timing.py`, `scripts/build_lesson.py`, `scripts/check_lesson.py`, `scripts/record_mp4.py`, `scripts/build_player.py` (+ `engine/player.html`), `scripts/subs_build.py`, `scripts/serve.py` (local preview; `python3 -m http.server` cannot seek audio).
- `reference/storyboard.md`, `reference/design-rules.md`, `reference/voice-and-pacing.md`, `reference/site-integration.md`.
- `examples/lab03-part1/` (graph), `examples/lab05-floorplan-demo/` (floorplan), `examples/lab07-placement-demo/` (placement).

Needs: Python 3.10+, ffmpeg, `pip install playwright pillow edge-tts` (edge-tts 7.1+ for word timings), `python3 -m playwright install chromium`.
