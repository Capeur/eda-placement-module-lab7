# Part 5 — What the cost does not know (transcript slides 24-29)

Animated lesson, `placement` scene of the `lesson-animator` skill (v5.0.1). Plan: `../../lab07-notes/LESSON_PLANS.md`
(Part 5). Written from the committed plan (2026-11-17); see "Deviations" below.

## Inputs
| Input | Value |
|---|---|
| Transcript EN | `../eda-learning-lab7-pl/courses/learn_placement/module02-07-sa-placement/transcript.md` (teacher clone) |
| Transcript FR / ZH | `i18n/fr/module02-07-sa-placement/transcript.md`, `i18n/zh/module02-07-sa-placement/transcript.md` |
| Slides | 24-29 (28 sentences in EN, FR and ZH, same split per slide: 6 3 5 3 6 5) |
| Voices | EN `en-US-AndrewMultilingualNeural`, FR `fr-FR-RemyMultilingualNeural`, `--rate=-4%` (edge-tts, exact word timings) |
| Subtitles | EN page: FR (voiced timing) + ZH (`subs_build.py`, against the EN timing); FR page: EN + ZH |
| Data | the module's `examples/trace_seed42_60.json`, `trace_seed199_60.json`, `trace_seed162_60.json`, `trace_seed42_300.json`, `seeds_1_200.json` (same `--data` for every part; `seeds_1_200.json` feeds the `spread` and the seeds claim, `trace_seed42_300.json` the 300-move run) |
| Output | `docs/lessons/part-5/` (EN), `docs/fr/lessons/part-5/` (FR); timings and audio in `build/lessons/part-5/` |

## Scenes (anchor words EN / FR)
| Slide | Picture |
|---|---|
| 24 | side panel on from the start (`initial side: 1`); the initial move key replays seed42_60's moves 1-60 in the first 9 s (clamped replay, see Deviations); from *two hundred / deux cents* the **spread** of the 200 seeds (seeds 42, 199, 134, 162 marked, median line); at *ninety-seven / quatre-vingt-dix-sept* the stage dims and the stamp "197 beat seed 42" lands |
| 25 | from *instead / lieu* seed42_300 replays all 300 moves until *point / virgule* ("two point six"); counter/chart/thermo from `slide:25` (chart `best: true`, ends 2.6, best 2.6 at move 278); 1.6 s pause after *point* |
| 26 | at *look / regardez* the camera zooms to `[200, 335, 420]` — both heaps of the 300-move result are inside the frame (checked on the contact sheet, no widening needed); from *top / sur* the stamp "overlap!" and the two thumbs (seed42_60 best 49.6 vs seed42_300 best 2.6, captions computed) |
| 27 | camera back to `full` at `slide:27`; thermo back at `slide:27+1.5`; from *pads / plots* the A and D rings; tag "pads move too, in this lab" from *even / même* |
| 28 | at `slide:28` side panel off + floor dimmed; headline "Remember" and the six-item vocab appearing at *allows / permet*, *strict*, *mean / veut*, *keep / gardez*, *story / histoire*, *knows / connaît* |
| 29 | at `slide:29` side back on, dim back, run switches to seed42_60 and replays moves 1-60 over 3.0 s; tally from *accepted / acceptés*; at `slide:29:end` side off + dim under the card; the card asks how the cost could stop cells from piling up |

Pauses: 1.6 s after *point*, 1.2 s after *perfect*, 1.2 s after *knows*.
Chapters: start "Two hundred seeds", slide 25 "Three hundred moves", slide 28 "Remember", slide 29 "Your turn".

## Claims (5, all checked by the engine)
- seeds (200): min 13.7, max 52, median 36, minSeed 134, maxSeed 199, 197 beat seed 42;
- seed42_300: best 2.6 at move 278;
- seed42_300 move 60: hpwl 49.6, bestSoFar 49.6 (the first 60 moves are Part 3's run);
- seed42_60: best 49.6, accepted 44, rejected 16;
- all six cells on one point (4, 4): hpwl 0 (backs the learner try).

## Question (pause and guess, at the end of slide 29 — the last part's card answers its own question)
"How could the cost stop cells from **piling up**?" — Count the cells in each area (`true`: density bins and overflow, the next lab), Run more moves (`false`: 300 moves piled up even more), Freeze the pads (`false`: that holds A and D only; the cost needs a crowding term).

## On-screen words (`strings`)
Copied verbatim from Part 2's storyboard (same as Parts 1, 3, 4): the French narration says "mouvement", "mouvement neutre",
"exécution", "chance de garder", so the built-in "coup", "coup gratuit", "essai", "chance d'accepter" are replaced; EN:
`plChance` = "chance to keep: {p} %".

## Deviations from the plan
- **S24 stamp over a dimmed stage.** A stamp box is huge (rotated 6 cqw box: "197 beat seed 42" measures 66 × 37 % of the
  stage) — Part 3's stamp-width quirk. While the spread shows there is no free spot that big, so the timeline gained
  `dim: 0.12` at `@ninetyseven` and `dim: 1` at `slide:25`, the stamp sits at (3, 60) and starts at `@ninetyseven+0.7`
  (after the 0.6 s fade, so no cell/spread node is under it — Part 3's `@mean+0.5` pattern). With dim 0.12 neither the
  cells nor the side panel count as nodes. The FR text is shortened to "197 battent 42": "197 graines battent 42" runs
  off the stage at 6 cqw (same quirk).
- **S26 stamp position and FR text.** The plan gives no position; at (59, 60) it sits in the free band right of the
  zoomed A-D heap. FR "chevauchement !" is 73 % wide and runs off the stage, so the FR stamp is "tas !" ("un tas de
  cellules" is the transcript's own word). The window ends at `slide:26:end` instead of `slide:27` so the stamp is gone
  before the camera's 1.3 s flight back sweeps the cells across the stage.
- **S26 thumbs window.** The plan says from `perfect` to `slide:27`; that window is only 1.73 s (checker: text on screen
  < 2.0 s). The thumbs now run from `@top` (same sentence as the camera key) to `slide:26:end`, at (2, 42) — the free
  left band of the zoomed view (the heaps project to x 36-57 %, y 26-72 % of the stage).
- **Thermo split around the camera zoom.** The plan has `thermo` from `slide:25` to `slide:28`; it is now
  `slide:25 → @look` and `slide:27+1.5 → slide:28`. The camera transforms the whole scene SVG, so during the zoom the
  thermometer node lands at the right edge under the counter (FR counter is taller: "counter covers node thermometer"
  warning). The thermometer is zoomed off-screen during S26 anyway and comes back once the camera is full again.
- **S27 tag at (46, 20) instead of (46, 9)**: the FR headline "Toutes les cellules bougent" is 56 % wide and overlapped
  the tag at y 9 (text-over-text).
- **Camera shot kept as planned** `[200, 335, 420]`: on both contact sheets both heaps (F upper, A/B/C/D lower-right)
  are fully inside the frame — no widening needed.
- **Initial replay, checked**: `initial move: 60` replays moves 1-60 in the first 9 s (0.22 s per move, clamped to the
  9 s max); the plan's first key `@instead` (S25, ≈ 23 s EN, ≈ 29 s FR) starts well after it — no collision (Part 3's
  initial-replay quirk). No time reference starts with "end" (Part 3's parser quirk avoided).
- Everything else follows LESSON_PLANS.md Part 5 exactly: `pads: ["A","D"]` (the only part with pads), the spread
  (`seeds: [42, 199, 134, 162]`, `median: true`, `stagger: 0.01`), the 300-move replay `to: "all" until @point`,
  the seed42_60 replay `over: 3.0` at `slide:29`, all show windows (chart `best: true`), the five claims, the three
  pauses, the chapters, the self-answering card and its replies, `colors.F`, `strings`/`note`/`pausing` verbatim
  from Part 2.

## Commands (from the site repo; P=~/eda-venv/bin/python, SK=~/.claude/skills/lesson-animator)
```bash
export PYTHONDONTWRITEBYTECODE=1
P=$HOME/eda-venv/bin/python
SK=$HOME/.claude/skills/lesson-animator
T=../eda-learning-lab7-pl; M=module02-07-sa-placement; EX=$T/courses/learn_placement/$M/examples
DATA="$EX/trace_seed42_60.json $EX/trace_seed199_60.json $EX/trace_seed162_60.json $EX/trace_seed42_300.json $EX/seeds_1_200.json"
B=build/lessons/part-5; SB=lessons/part-5/storyboard.json
# draft (silent) check first, no VPN needed:
$P $SK/scripts/draft_timing.py --transcript $T/courses/learn_placement/$M/transcript.md --slides 24-29 --lang en \
   --storyboard $SB --repo $T --out-audio $B/draft-en.m4a --out-timing $B/timing-en-draft.json
$P $SK/scripts/draft_timing.py --transcript i18n/fr/$M/transcript.md --slides 24-29 --lang fr \
   --storyboard $SB --repo $T --out-audio $B/draft-fr.m4a --out-timing $B/timing-fr-draft.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-en-draft.json --audio $B/draft-en.m4a --lang en \
   --out $B/draft-en --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-fr-draft.json --audio $B/draft-fr.m4a --lang fr \
   --out $B/draft-fr --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA
$P $SK/scripts/check_lesson.py $B/draft-en/index.html $B/draft-fr/index.html --sheets $B/check-draft
# voices (VPN up, later)
$P $SK/scripts/voice_build.py --transcript $T/courses/learn_placement/$M/transcript.md --slides 24-29 --lang en \
   --voice en-US-AndrewMultilingualNeural --rate=-4% --storyboard $SB --repo $T --workdir .cache/voice \
   --out-audio $B/lesson-en.m4a --out-timing $B/timing-en.json
$P $SK/scripts/voice_build.py --transcript i18n/fr/$M/transcript.md --slides 24-29 --lang fr \
   --voice fr-FR-RemyMultilingualNeural --rate=-4% --storyboard $SB --repo $T --workdir .cache/voice \
   --out-audio $B/lesson-fr.m4a --out-timing $B/timing-fr.json
# Chinese subtitles, then the pages
$P $SK/scripts/subs_build.py --transcript i18n/zh/$M/transcript.md --slides 24-29 --lang zh --against $B/timing-en.json --out $B/subs-zh.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-en.json --audio $B/lesson-en.m4a --lang en \
   --out docs/lessons/part-5 --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA \
   --subs fr=$B/timing-fr.json --subs zh=$B/subs-zh.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-fr.json --audio $B/lesson-fr.m4a --lang fr \
   --out docs/fr/lessons/part-5 --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA \
   --subs en=$B/timing-en.json --subs zh=$B/subs-zh.json
$P $SK/scripts/check_lesson.py docs/lessons/part-5/index.html docs/fr/lessons/part-5/index.html --sheets $B/check
```

## Check results
- Draft timing (2026-11-17, silent): EN 28 sentences, about 109.7 s with 21.8 s of pauses; FR 28 sentences, about 134.8 s
  with 21.8 s of pauses.
- `check_lesson.py` on the two silent draft pages (`build/lessons/part-5/draft-{en,fr}`), 2026-11-17:
  - EN: claims 5/5; placement 4 run(s), 480 move(s) replayed by the engine, all equal; 200 seed(s) compared with the
    checker, 0 differ; 109.7 s, 28 sentences, 12 texts, question at 107.2 s; speed (CPU 6x) median 0.90 ms, 95 % under
    2.20 ms — **no problems**;
  - FR: claims 5/5; placement 4 run(s), 480 move(s), all equal; 200 seed(s), 0 differ; 134.8 s, 28 sentences, 12 texts,
    question at 132.3 s; speed median 0.80 ms, 95 % under 2.20 ms — **no problems**;
  - **0 errors, 0 warnings** on both pages (earlier runs reported 19 warnings — stamp boxes running off the stage /
    covering nodes, thumbs under the zoomed cells, FR counter over the zoomed thermometer, FR headline over the S27
    tag, thumbs on screen < 2 s — all fixed as listed under Deviations). Contact sheets:
    `build/lessons/part-5/check-draft/sheet-en.png`, `sheet-fr.png` (looked at both: the spread with the dimmed-stage
    stamp, the 300-move chart ending at 2.6, the camera zoom with both heaps inside the frame, the "overlap!"/"tas !"
    stamp with the two thumbs, the A/D rings with the pads tag, the "Remember" vocab over the dimmed stage, the
    seed-42 replay and the final card).
- Voices not built yet (no VPN in this session).
