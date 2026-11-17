# What changed: Lab 07, simulated annealing placement

Module `courses/learn_placement/module02-07-sa-placement` and tool `platform/tools/sa-placement` of
[yongfu-li/eda-learning](https://github.com/yongfu-li/eda-learning), upgraded in the teacher clone
`eda-learning-lab7-pl` (uncommitted, on `main`) and published by this site repo in English and French.
Lab number: **Lab 07** (the module number 02-07 is also the lab number here). The site is **lessons only**:
no slide video and no deck — five animated lessons, the browser lab, Track A, the quiz and the transcript.
Every number below was printed by running code on 2026-11-12…2026-11-17 (checker, node, Playwright, the site
tests, the lesson checker).

## Before and after

| | Before | After |
|---|---|---|
| Transcript | 13 slides, 625 words (~4 min), lint 10 problems (8 CUT bullets, 2 "/" read as "or"), generic boilerplate on slides 10–13 | 29 slides, 1,137 words (~7.6 min at 150 wpm), lint 0 problems; 128 sentences in EN = FR = ZH in every slide; five parts, each opens with a hook and ends with a "Pause and guess" card |
| EXAMPLES.md | 130 words, one pseudocode block, 3 placeholder lines ("Change one knob"…) | 232 lines with the exact written rules: Δ ≤ 0 accepts **without drawing** (265 draws in the 60-move run), cell/axis/direction/step all drawn (step 0.5–1.5, not integer), clamp −1…9, T0 = 3, cool 0.94 **per move**, best updated only on a strict improvement, unweighted HPWL |
| Quiz | 4 items, 3 of them generic, none uses a number of this lab | 8 items, every answer recomputed with the checker |
| Golden checker | none (`common/test_solvers.py` only checks `round1(best) ≈ 49.6`) | `examples/sa_place_check.py` (778 lines): 46 PASS, 0 FAIL; `--vs-node` 13 PASS (Python = JS, seeds 1–200); the three `examples/wrong/` annealers FAIL with exit 1 |
| Run data | only `tiny_place.json` | + `sa_node.mjs`, four per-move traces (`trace_seed42_60`, `trace_seed199_60`, `trace_seed162_60`, `trace_seed42_300`), `seeds_1_200.json`, and `examples/wrong/` (`strict_less`, `draw_every_move`, `no_clamp`) |
| Browser lab | 150 lines, 10 challenges, 2 passed on page load, 5 passed by pressing the preset button, an extra "Apply SA" button, no reveal, a 2nd run started from the 1st result | rewritten: model 421 lines + strings 226 + UI 398 lines, 9 challenges, **0 pass on load**; the annealer always starts from the starter, any hand move cancels the run's numbers; best/final toggle, curve, move log, study tally |
| Site | none | EN + FR GitHub Pages site, lessons only: 5 animated lessons (EN/FR voices, EN/FR/ZH subtitles, one player), the browser lab, Track A (checker + 8 example files), the quiz, the full transcript |

## Concepts taught

1. **Accept the bad sometimes** (Metropolis). Not worse (Δ ≤ 0) → accept, no dice drawn; worse → roll the dice,
   accept with probability e^(−Δ/T). Numbers: Δ = 3, T = 3 → p = 0.37.
2. **Temperature = how brave.** T goes 3 → 0.07 over 60 moves (×0.94 per move); the run first climbs to 58.6 then
   falls. **Accepted is not progress**: 44 accepted = 11 better + 9 worse + 24 free moves (the cell moved, no net
   bbox changed).
3. **Keep the best — and one seed is one story.** Best ≠ final (seed 199: best 52.0 = start, final 53.871, worse
   than the start; seed 162: best 27.753 at move 59, final 27.887); over seeds 1–200 the best HPWL spans
   13.73–52.00, median 36.04, and 197 of 200 seeds beat seed 42; Python and JS replay the identical random stream.
4. **What the cost does not know.** No overlap rule: 300 moves reach 2.61, all six cells on one point give 0, so
   the "golden 14" is no floor. In this lab every cell moves, even the pads A and D. Hand-off to the density-bins
   module.

## Files changed

### Teacher clone (only the two allowed folders; the changes are uncommitted on `main`, `git status` shows nothing else)

`courses/learn_placement/module02-07-sa-placement/`
- Rewritten: `transcript.md` (121 lines, 29 slides), `EXAMPLES.md` (232 lines), `quiz.json` (8 items),
  `CHECKLIST.md`, `README.md`.
- New: `UPGRADE_NOTES.md`, `assets/_demo.sh`, `examples/sa_place_check.py` (778 lines), `examples/sa_node.mjs`,
  `examples/trace_seed42_60.json`, `trace_seed199_60.json`, `trace_seed162_60.json`, `trace_seed42_300.json`,
  `examples/seeds_1_200.json`, `examples/wrong/{strict_less,draw_every_move,no_clamp}.py`.
- Media left untouched (teacher-owned): `slides.md`, `slides.pptx`, `slides.pdf`, `outline.yaml`, `video.mp4`,
  `audio/`, `frames/`, `build.log`; `examples/tiny_place.json` unchanged.

`platform/tools/sa-placement/`
- Rewritten: `index.html`, `sa-placement.js` (398 lines, UI).
- New: `sa-placement-lab-model.js` (421 lines, pure, no DOM), `sa-placement-strings.js` (226 lines, every UI word),
  `tests/{test_model_vs_checker.py, model_dump.mjs, test_lab_playwright.py}`.

Not touched: `common/`, `platform/assets/*`, other modules, `.cursor/skills/*`.

### This site repo

`build_site.py`, `site_src/` (page template, CSS, quiz script, self-hosted fonts, the lab screenshots
`img/lab-en.png` / `lab-fr.png`), `i18n/strings.py`, `i18n/fr/` (French transcript, EXAMPLES.md, quiz.json,
`sa-placement-strings.js`, `lab_strings.py`), `i18n/zh/module02-07-sa-placement/transcript.md` (subtitles only),
`tools/{test_site.py, test_lab_site.py, check_sentences.py, strings_shape.mjs, capture_lab.py}`,
`lessons/part-1..5/` (one `storyboard.json` + `README.md` per part), `docs/` (the built site, EN + `docs/fr/`),
`ai-workflow/` (this record: `notes/UPGRADE_NOTES.md`, `README.md`, `skills/`), `eda-skills-v3.2b/` (the two skills
as used: `lab-upgrade` v3.2 + `lesson-animator` v5.0.1). Outside every repo: `../tools/lab07-notes/` (stage scripts,
`LESSON_PLANS.md`).

## The five animated lessons

One interactive page per part (`docs/lessons/part-N/`, `docs/fr/lessons/part-N/`) plus one player listing all five
(`docs/lessons/index.html`, `docs/fr/lessons/index.html`), built with the `lesson-animator` skill v5.0.1 `placement`
scene: the chip with six cells and their net boxes, the HPWL curve, the move log, word-timed text, zooms, counters,
a "Pause and guess" card at the end of each part. English and French come from one storyboard per part
(`lessons/part-N/storyboard.json`); every run is replayed by the engine and compared with the checker's data files.

- Voices: **`en-US-AndrewMultilingualNeural`** (EN) and **`fr-FR-RemyMultilingualNeural`** (FR), `--rate=-4%`
  (edge-tts, exact word timings). ZH subtitles built against the EN timing (`subs_build.py`).
- Same `--data` for every part: the module's five example files (four traces + `seeds_1_200.json`).
- Storage keys `lab07-lesson-speed` (lesson pages) and `lab07-lessons` (player); the players' back link is
  `../index.html#lessons`, the button after the last part goes to `../tools/sa-placement/index.html`.

## Challenges and how they were solved

- The project started under Claude Code; the account was banned mid-project (VPN-related ToS issue). The work
  continued with Mistral Vibe as orchestrator (reviewing every commit against the plans) and the Mistral Vibe Code
  VS Code extension as the in-repo agent. Nothing was lost: all stages are reproducible from the notes and scripts.
- The GitHub connector used by the orchestrator is read-only by design; every push was made from the laptop
  (agent and user).
- edge-tts over the VPN stalls (no output line for ~1 min); fix: switch VPN server, rerun the same command,
  cached sentences are skipped. Recorded in the part READMEs.
- The Vibe wrapper sets `LD_LIBRARY_PATH` to the extension's `_internal` dir, which breaks the system `ffprobe` at
  the end of a voice run; fix: run with `LD_LIBRARY_PATH` unset (the sentence cache makes the rerun cheap).
  Recorded in the part-3 README.
- Part 2's S11 overlays (chance tags and equation) had no positions in the plan; the first voiced check reported
  12 collision warnings; fixed by moving three x/y values, verified 0 warnings (commit `25d0929`).
- The part README command blocks did not define `P` and `SK` (fixed in Stage 6-A).

## Tests (run 2026-11-17; the site served with `serve.py docs 8090`)

| Test | Command | Result |
|---|---|---|
| Module checker | `python3 -B examples/sa_place_check.py` (in the clone) | 46 PASS, 0 FAIL, 0 SKIP |
| Checker vs the JS | `... --vs-node` | 13 PASS, 0 FAIL (seeds 1–200, exact equality) |
| Wrong annealers caught | `--impl examples/wrong/strict_less.py` (also `draw_every_move.py`, `no_clamp.py`) | FAIL, exit 1 (strict_less: 11 FAIL, best 35.3928 instead of 49.575) |
| Independent implementation | `--impl ../../../../tools/lab07-notes/ok_impl.py` | 17 PASS, 0 FAIL |
| Script facts | `tools/lab07-notes/stage3_facts.py` | 55 PASS |
| Lab model vs checker | `python3 platform/tools/sa-placement/tests/test_model_vs_checker.py` | 166 PASS, 0 FAIL |
| Lab in Playwright (clone) | `~/eda-venv/bin/python -B platform/tools/sa-placement/tests/test_lab_playwright.py` | 100 ok, 0 FAIL (9 positive, 56 negative, the rest page/script/hand/colour) |
| Sentences EN / FR / ZH | `tools/check_sentences.py` | 29 slides; EN 128, FR 128, ZH 128; clean |
| Site | `tools/test_site.py` | **161 checks, 0 failed** (en 76, fr 76, static 9) — includes the player (5 of 5 parts) and, per lesson page x language: no console error, `errors` empty, `dataDiffer` = 0, `seedsDiffer` = 0, subtitles menu, Sounds button, audio 200 |
| Lab on the built site | `tools/test_lab_site.py` | **206 ok, 0 FAIL** (en 103, fr 103: 9 positive, 56 negative each) |
| Lesson checker | `check_lesson.py` on both pages of each part | **0 errors, 0 warnings** on all 10 pages; every part replays 4 runs / 480 moves, all equal to the checker; parts 4–5 also compare 200 seeds, 0 differ |

**Still to do by the user:** play a part in Firefox/Chrome, switch voice and subtitles mid-part, and let the next
part start by itself.

## Part lengths (voice-build runs, 2026-11-17/18)

| Part | Sentences | EN | FR | Claims | Slides |
|---|---|---|---|---|---|
| 1 Why not only walk downhill? | 28 | 117.4 s | 118.6 s | 10 | 1-6 |
| 2 One move, up close | 28 | 110.5 s | 113.3 s | 6 | 7-12 |
| 3 Hot to cold | 22 | 96.5 s | 97.6 s | 4 | 13-18 |
| 4 Best, not final | 22 | 94.1 s | 91.0 s | 6 | 19-23 |
| 5 What the cost does not know | 28 | 121.9 s | 125.0 s | 5 | 24-29 |

## Findings for the teacher

1. The ZH transcript is machine translation; a native reader must review it before publishing.
2. Part 3: the tally window (`kinds: true`) effectively ends at the `@mean` stamp deviation, so "9 worse · 24 free"
   is on screen for about one sentence.
3. The French lab shows decimal points (49.6), not commas; noted in UPGRADE_NOTES 17h.
4. Every number in the lessons comes from the plan (which got them from the checker) or the checker's `--json`;
   the traces were never edited or regenerated.

## Rebuild and publish

```bash
# from this repo
~/eda-venv/bin/python build_site.py --repo ../eda-learning-lab7-pl     # stops if the EN / FR / ZH sentences differ
python3 ~/.claude/skills/lesson-animator/scripts/serve.py docs 8090    # restart after each build; serve.py, not http.server (Range requests)
~/eda-venv/bin/python tools/test_site.py && ~/eda-venv/bin/python tools/test_lab_site.py
```
GitHub Pages: branch `main`, folder `/docs`. Live: `https://capeur.github.io/eda-placement-module-lab7/` (EN) and
`.../fr/` (FR).
