# Part 4 — Best, not final (transcript slides 19-23)

Animated lesson, `placement` scene of the `lesson-animator` skill (v5.0.1). Plan: `../../lab07-notes/LESSON_PLANS.md`
(Part 4). Written from the committed plan (2026-11-17); see "Deviations" below.

## Inputs
| Input | Value |
|---|---|
| Transcript EN | `../eda-learning-lab7-pl/courses/learn_placement/module02-07-sa-placement/transcript.md` (teacher clone) |
| Transcript FR / ZH | `i18n/fr/module02-07-sa-placement/transcript.md`, `i18n/zh/module02-07-sa-placement/transcript.md` |
| Slides | 19-23 (22 sentences in EN, FR and ZH, same split per slide: 6 4 5 5 2) |
| Voices | EN `en-US-AndrewMultilingualNeural`, FR `fr-FR-RemyMultilingualNeural`, `--rate=-4%` (edge-tts, exact word timings) |
| Subtitles | EN page: FR (voiced timing) + ZH (`subs_build.py`, against the EN timing); FR page: EN + ZH |
| Data | the module's `examples/trace_seed42_60.json`, `trace_seed199_60.json`, `trace_seed162_60.json`, `trace_seed42_300.json`, `seeds_1_200.json` (same `--data` for every part; `seeds_1_200.json` feeds the `beat` claim) |
| Output | `docs/lessons/part-4/` (EN), `docs/fr/lessons/part-4/` (FR); timings and audio in `build/lessons/part-4/` |

## Scenes (anchor words EN / FR)
| Slide | Picture |
|---|---|
| 19 | side panel on from the start (`initial side: 1`); the initial move key replays seed42_60's moves 1-60 in the first 9 s (clamped replay, see Deviations); headline "This time, yes" with its sub on *nothing / rien*; the term "Seed" from *seed / graine*; the counter settles at 49.6 |
| 20 | from *story / histoire* seed199_60 replays moves 1-11 until *sixty / soixante* (move 11 = its peak 60.5), then 12-60 from *sixty+0.3* until *fiftythree / cinquante-trois* (`fifty#1`); chart with the `best` line on from the start; 1.4 s pause after *fiftythree* |
| 21 | at `slide:21` seed162_60 replays moves 1-59 until *reaches+0.3 / atteint+0.3* (move 59 = its best 27.8); from *then / puis* move 60 plays in detail (E, y +, Δ +0.13): delta on *longer / allonge*, dice bar on *dice / dé*, verdict "accepted" on *pass / passe*; 1.4 s pause after *pass* |
| 22 | counter switches to `best` with label "returned / rendu" at *returns0 / rend*; `bestpos` (dashed outlines of seed 162's best) and the E ring from *copy / copie*; the two thumbs (seed 162: 27.8, seed 199: 52.0) from *returns2 / rend#2* (`returns#2`) |
| 23 | back to seed42_60: moves 1-60 replay over 2.5 s from `slide:23`; at `slide:23:end` the side panel fades and the floor dims under the card; the card asks: is 49.6 typical? |

Pauses: 1.4 s after *fiftythree*, 1.4 s after *pass*.
Chapters: start "This time, yes", slide 20 "Two other seeds", slide 22 "Keep the best".

## Claims (6, all checked by the engine)
- seed42_60: best 49.6, final 49.6, bestMove 45;
- seed199_60: start 52, best 52, bestMove 0, final 53.9, peak 60.5;
- seed199_60 move 11: hpwl 60.5;
- seed162_60: bestMove 59, best 27.8, final 27.9;
- seed162_60 move 60: cell E, kind worse, accepted, p 0.18, u 0.09;
- seeds: 197 of 200 beat seed 42 (backs the card replies).

## Question (pause and guess, at the end of slide 23)
"Seed 42 returned **49.6**. Is that a typical result?" — Typical (`false`), Better than most (`false`), One of the worst (`true`: 197 seeds out of 200 do better). Every reply points to Part 5.

## On-screen words (`strings`)
Copied verbatim from Part 2's storyboard (same as Parts 1 and 3): the French narration says "mouvement", "mouvement neutre",
"exécution", "chance de garder", so the built-in "coup", "coup gratuit", "essai", "chance d'accepter" are replaced; EN:
`plChance` = "chance to keep: {p} %".

## Deviations from the plan
- **Thumbs position.** The plan gives no overlay position for the S22 thumbs. At (52, 42) the checker warned
  "text 'seed 162: 27.8seed 199: 52.0' covers node chart" (the thumbs box is y 42-71 % of the stage, the chart node
  starts at y 62.9 %). Moved to (52, 30): 0 warnings. The plan's fallback (fade the side panel with `side: 0` under the
  thumbs) was therefore **not** needed — the chart stays on through S22-S23 as the plan's show window wants.
- **Term position.** The plan gives no position for the S19 "Seed" term. The chart is on from the start in this part
  (unlike Part 2), so the term sits at (52, 44), the free band between the counter and the chart. 0 warnings.
- **`dice` anchor needs `dé#1` in French**: in S21 "dernier" also normalizes to a "de…" match, so the word "dé"
  ("Le dé le laisse passer") is the second hit. (Same class of quirk as Part 3's `ends` → `nearzero`: watch the FR
  normalisation when picking words.)
- **Initial replay, checked**: `initial move: 60` is a move key at t=0; the engine replays moves 1-60 in the first
  9 s (0.22 s per move, clamped to the 9 s max). The plan's first key `@story` (S20, ≈ 20 s in EN, ≈ 23 s in FR)
  starts well after it, so no "starts before the previous replay is over" error — unlike Part 3, nothing had to move.
- No time reference starts with "end" (Part 3's parser quirk avoided), and this part has no stamp (Part 3's
  stamp-width quirk does not apply).
- `bestpos` is never shown on seed 42 in S19: its window starts at `@copy` (S22), when the current run is seed162_60,
  so the dashed outlines are seed 162's best (only E differs), exactly as the plan requires.
- Everything else follows LESSON_PLANS.md Part 4 exactly: runs/moves, the three fast replays, the seed-162 move-60
  detail with its phase pins, all show windows (chart `best: true`), the counter switches, the six claims, the two
  pauses, the chapters, the card and its replies, `colors.F`, no `pads`, `strings`/`note`/`pausing` verbatim from
  Part 2.

## Commands (from the site repo; P=~/eda-venv/bin/python, SK=~/.claude/skills/lesson-animator)
```bash
export PYTHONDONTWRITEBYTECODE=1
T=../eda-learning-lab7-pl; M=module02-07-sa-placement; EX=$T/courses/learn_placement/$M/examples
DATA="$EX/trace_seed42_60.json $EX/trace_seed199_60.json $EX/trace_seed162_60.json $EX/trace_seed42_300.json $EX/seeds_1_200.json"
B=build/lessons/part-4; SB=lessons/part-4/storyboard.json
# draft (silent) check first, no VPN needed:
$P $SK/scripts/draft_timing.py --transcript $T/courses/learn_placement/$M/transcript.md --slides 19-23 --lang en \
   --storyboard $SB --repo $T --out-audio $B/draft-en.m4a --out-timing $B/timing-en-draft.json
$P $SK/scripts/draft_timing.py --transcript i18n/fr/$M/transcript.md --slides 19-23 --lang fr \
   --storyboard $SB --repo $T --out-audio $B/draft-fr.m4a --out-timing $B/timing-fr-draft.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-en-draft.json --audio $B/draft-en.m4a --lang en \
   --out $B/draft-en --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-fr-draft.json --audio $B/draft-fr.m4a --lang fr \
   --out $B/draft-fr --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA
$P $SK/scripts/check_lesson.py $B/draft-en/index.html $B/draft-fr/index.html --sheets $B/check-draft
# voices (VPN up, later)
$P $SK/scripts/voice_build.py --transcript $T/courses/learn_placement/$M/transcript.md --slides 19-23 --lang en \
   --voice en-US-AndrewMultilingualNeural --rate=-4% --storyboard $SB --repo $T --workdir .cache/voice \
   --out-audio $B/lesson-en.m4a --out-timing $B/timing-en.json
$P $SK/scripts/voice_build.py --transcript i18n/fr/$M/transcript.md --slides 19-23 --lang fr \
   --voice fr-FR-RemyMultilingualNeural --rate=-4% --storyboard $SB --repo $T --workdir .cache/voice \
   --out-audio $B/lesson-fr.m4a --out-timing $B/timing-fr.json
# Chinese subtitles, then the pages
$P $SK/scripts/subs_build.py --transcript i18n/zh/$M/transcript.md --slides 19-23 --lang zh --against $B/timing-en.json --out $B/subs-zh.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-en.json --audio $B/lesson-en.m4a --lang en \
   --out docs/lessons/part-4 --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA \
   --subs fr=$B/timing-fr.json --subs zh=$B/subs-zh.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-fr.json --audio $B/lesson-fr.m4a --lang fr \
   --out docs/fr/lessons/part-4 --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA \
   --subs en=$B/timing-en.json --subs zh=$B/subs-zh.json
$P $SK/scripts/check_lesson.py docs/lessons/part-4/index.html docs/fr/lessons/part-4/index.html --sheets $B/check
```

## Check results
- Draft timing (2026-11-17, silent): EN 22 sentences, about 82.3 s with 18.8 s of pauses; FR 22 sentences, about 93.8 s
  with 18.8 s of pauses.
- `check_lesson.py` on the two silent draft pages (`build/lessons/part-4/draft-{en,fr}`), 2026-11-17:
  - EN: claims 6/6; placement 4 run(s), 480 move(s) replayed by the engine, all equal; 200 seed(s) compared with the
    checker, 0 differ; 82.3 s, 22 sentences, 8 texts, question at 79.8 s; speed (CPU 6x) median 0.80 ms, 95 % under
    1.60 ms, worst 3.00 ms — **no problems**;
  - FR: claims 6/6; placement 4 run(s), 480 move(s), all equal; 200 seed(s), 0 differ; 93.8 s, 22 sentences, 8 texts,
    question at 91.3 s; speed median 0.80 ms, 95 % under 1.50 ms, worst 3.20 ms — **no problems**;
  - **0 errors, 0 warnings** on both pages (a first run reported 2 warnings — the thumbs over the chart — fixed by
    moving the thumbs to (52, 30), see Deviations). Contact sheets:
    `build/lessons/part-4/check-draft/sheet-en.png`, `sheet-fr.png` (looked at both: the initial 9 s replay ending at
    49.6, the Seed term card, both other seeds' replays with the best line, the move-60 detail on seed 162, the
    "returned 27.8" counter switch with bestpos + E ring + the two thumbs, the seed-42 replay, and the final card over
    the dimmed stage).
- Voices not built yet (no VPN in this session).
