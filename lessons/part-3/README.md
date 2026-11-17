# Part 3 — Hot to cold (transcript slides 13-18)

Animated lesson, `placement` scene of the `lesson-animator` skill (v5.0.1). Plan: `../../lab07-notes/LESSON_PLANS.md`
(Part 3). Written from the committed plan (2026-11-17); see "Deviations" below.

## Inputs
| Input | Value |
|---|---|
| Transcript EN | `../eda-learning-lab7-pl/courses/learn_placement/module02-07-sa-placement/transcript.md` (teacher clone) |
| Transcript FR / ZH | `i18n/fr/module02-07-sa-placement/transcript.md`, `i18n/zh/module02-07-sa-placement/transcript.md` |
| Slides | 13-18 (22 sentences in EN, FR and ZH, same split per slide: 4 5 4 3 5 1) |
| Voices | EN `en-US-AndrewMultilingualNeural`, FR `fr-FR-RemyMultilingualNeural`, `--rate=-4%` (edge-tts, exact word timings) |
| Subtitles | EN page: FR (voiced timing) + ZH (`subs_build.py`, against the EN timing); FR page: EN + ZH |
| Data | the module's `examples/trace_seed42_60.json`, `trace_seed199_60.json`, `trace_seed162_60.json`, `trace_seed42_300.json`, `seeds_1_200.json` (same `--data` for every part) |
| Output | `docs/lessons/part-3/` (EN), `docs/fr/lessons/part-3/` (FR); timings and audio in `build/lessons/part-3/` |

## Scenes (anchor words EN / FR)
| Slide | Picture |
|---|---|
| 13 | side panel already on (`initial side: 1`); the initial move key replays moves 1-12 in the first 2.64 s (see Deviations); move 13 plays in detail from `start+2.7`: D's ghost slides up to the wall, "wires +3.0" at `start+2.8`, the dice bar (chance 12 %, marker 0.09) at *shows / affiche*, verdict "accepted" at *passes / passe*; counter reaches 58.6; tag "the longest of the run" at *longest / long* |
| 14 | headline "From hot to cold", sub `T: 3 → 0.07`; tags "hot = brave" at *brave / audacieux* and "cold = picky" at *picky / difficile*; the dice bar hides at slide:14 |
| 15 | fast replay of moves 14-45 from *watch / regardez* until *forty-five / quarante-cinq*; chart from *watch* (`best: false`, the best line is Part 4's); then moves 46-59 from *forty-nine+0.8 / quarante-neuf+0.8* `over: 2.0` (2.0 s pause after *forty-nine / quarante-neuf*); the new best 49.6 at move 45 lands on *forty-nine* |
| 16 | move 60 in detail from *last / dernier*: A pushed into the wall, "+3" at *three / trois*, chance 0 at *chance*, "rejected" at *rejected / refusé*; dice bar again from *last* to slide:17 |
| 17 | tally "accepted 44 · rejected 16" from *forty-four / quarante-quatre*, kinds "11 better · 9 worse · 24 free" from *eleven / onze*; at *mean / veut* the side panel fades and the floor dims, and the stamp "44 accepted, 11 better" appears over the dimmed stage |
| 18 | headline "Last or best?"; the card asks at the end: are the last wires also the shortest? |

Pauses: 1.2 s after *longest*, 2.0 s after *fortynine* (the replay gap), 1.2 s after *rejected*, 1.0 s after *twentyfour*.
Chapters: start "Colder", slide 14 "Hot to cold", slide 17 "Accepted is not better".

## Claims (4, all checked by the engine)
- move 13 of `seed42_60`: p 0.12, u 0.09, accepted, kind worse, hpwl 58.6 (the peak);
- the run: peak 58.6, Tend 0.07, bestMove 45, best 49.6, accepted 44, rejected 16, better 11, worse 9, free 24;
- move 60: cell A, axis x, dHpwl 3, T 0.08, p 0, rejected, clamped;
- the formula at T 1.43: dHpwl 3 → p 0.12 ("twelve percent").

(The plan's optional move-1 `T: 3` claim stays Part 2's; this part already has 4 claims, so it is not repeated.)

## Question (pause and guess, at the end of slide 18)
"After 60 moves, are the **last** wires also the **shortest**?" — Yes, always (`false`), This time (`true`: the chart ends
on its lowest value), Never (`false`). Every reply points to Part 4 (two seeds where the last move spoils it).

## On-screen words (`strings`)
Copied verbatim from Part 2's storyboard (same as Part 1's): the French narration says "mouvement", "mouvement neutre",
"exécution", "chance de garder", so the built-in "coup", "coup gratuit", "essai", "chance d'accepter" are replaced; EN:
`plChance` = "chance to keep: {p} %".

## Deviations from the plan
- **Move 13 key and phases.** The literal `initial move: 12` is a move key at t=0, which the engine replays (moves 1-12 in
  2.64 s). The plan's first key `start+0.6` therefore collides with it (checker error: "starts before the previous replay is
  over (2.64s)"), and `delta` must be strictly after its key. Move 13 is keyed at `start+2.7` (right after the catch-up
  replay), `delta` at `start+2.8`, `until` and `verdict` unchanged (`@passes+1.2` / `@passes`).
- **`dice` pinned to `shows` (S13) instead of `twelve`**, as the plan allows: with the key at 2.7 s, `@twelve` (≈1.3 s in EN)
  would fall before the key. `@shows` ("The dice shows…" / "Le dé affiche…") is where the dice bar is explained.
- **Anchor renamed `ends` → `nearzero`** (same words: EN "ends", FR "finit"): the `{piece@ref}` parser reads any ref starting
  with "end" as the `end` keyword, so `{T: 3 → 0.07@ends}` was a "bad time reference".
- **The S17 stamp is shortened and moved.** The plan's text "44 accepted, only 11 better" is 1099 px wide at the engine's
  fixed 6 cqw — wider than the 960-unit stage, so it runs off the stage even wrapped (checker warning). It is one line now:
  "44 accepted, 11 better" / "44 acceptés, 11 mieux", at (3, 38), from `@mean+0.5` to `slide:18:end+0.3` (it ends when the
  card appears). `@mean+0.5` (not `@mean`) so that the fade below has already removed the side-panel nodes when the stamp
  shows.
- **The side fade + floor dim moved from `slide:18` to `@mean`.** A stamp this size has no node-free spot while the side panel
  is on (thermometer, tally, chart, counter all count as nodes). With `side: 0, dim: 0.12` from `@mean`, the tally and chart
  hide during the last sentence of S17 — the stamp carries the summary ("44 accepted, 11 better") instead. S18 and the card
  are unchanged (the card still appears at `slide:18:end+0.3`).
- Overlay positions the plan does not give: S13 tag and S14 tags at (46, 9) (like Part 2's S11 tags, left of the side panel),
  stamp at (3, 38). All confirmed by `check_lesson.py` (0 warnings) and the contact sheets.
- Everything else follows LESSON_PLANS.md Part 3 exactly: runs/moves, both fast replays, the move-60 detail, show windows
  (chart `best: false`), the four claims, the four pauses, the chapters, the card and its replies, `colors.F`, no `pads`.

## Commands (from the site repo; P=~/eda-venv/bin/python, SK=~/.claude/skills/lesson-animator)
```bash
export PYTHONDONTWRITEBYTECODE=1
P=$HOME/eda-venv/bin/python
SK=$HOME/.claude/skills/lesson-animator
T=../eda-learning-lab7-pl; M=module02-07-sa-placement; EX=$T/courses/learn_placement/$M/examples
DATA="$EX/trace_seed42_60.json $EX/trace_seed199_60.json $EX/trace_seed162_60.json $EX/trace_seed42_300.json $EX/seeds_1_200.json"
B=build/lessons/part-3; SB=lessons/part-3/storyboard.json
# draft (silent) check first, no VPN needed:
$P $SK/scripts/draft_timing.py --transcript $T/courses/learn_placement/$M/transcript.md --slides 13-18 --lang en \
   --storyboard $SB --repo $T --out-audio $B/draft-en.m4a --out-timing $B/timing-en-draft.json
$P $SK/scripts/draft_timing.py --transcript i18n/fr/$M/transcript.md --slides 13-18 --lang fr \
   --storyboard $SB --repo $T --out-audio $B/draft-fr.m4a --out-timing $B/timing-fr-draft.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-en-draft.json --audio $B/draft-en.m4a --lang en \
   --out $B/draft-en --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-fr-draft.json --audio $B/draft-fr.m4a --lang fr \
   --out $B/draft-fr --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA
$P $SK/scripts/check_lesson.py $B/draft-en/index.html $B/draft-fr/index.html --sheets $B/check-draft
# voices (VPN up, later)
$P $SK/scripts/voice_build.py --transcript $T/courses/learn_placement/$M/transcript.md --slides 13-18 --lang en \
   --voice en-US-AndrewMultilingualNeural --rate=-4% --storyboard $SB --repo $T --workdir .cache/voice \
   --out-audio $B/lesson-en.m4a --out-timing $B/timing-en.json
$P $SK/scripts/voice_build.py --transcript i18n/fr/$M/transcript.md --slides 13-18 --lang fr \
   --voice fr-FR-RemyMultilingualNeural --rate=-4% --storyboard $SB --repo $T --workdir .cache/voice \
   --out-audio $B/lesson-fr.m4a --out-timing $B/timing-fr.json
# Chinese subtitles, then the pages
$P $SK/scripts/subs_build.py --transcript i18n/zh/$M/transcript.md --slides 13-18 --lang zh --against $B/timing-en.json --out $B/subs-zh.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-en.json --audio $B/lesson-en.m4a --lang en \
   --out docs/lessons/part-3 --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA \
   --subs fr=$B/timing-fr.json --subs zh=$B/subs-zh.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-fr.json --audio $B/lesson-fr.m4a --lang fr \
   --out docs/fr/lessons/part-3 --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA \
   --subs en=$B/timing-en.json --subs zh=$B/subs-zh.json
$P $SK/scripts/check_lesson.py docs/lessons/part-3/index.html docs/fr/lessons/part-3/index.html --sheets $B/check
```

## Check results
- Draft timing (2026-11-17, silent): EN 22 sentences, about 83.0 s with 19.4 s of pauses; FR 22 sentences, about 103.3 s
  with 19.4 s of pauses.
- `check_lesson.py` on the two silent draft pages (`build/lessons/part-3/draft-{en,fr}`), 2026-11-17:
  - EN: claims 4/4; placement 4 run(s), 480 move(s) replayed by the engine, all equal; 83.0 s, 22 sentences, 10 texts,
    question at 80.5 s; speed (CPU 6x) median 1.10 ms, 95 % under 2.30 ms — **no problems**;
  - FR: claims 4/4; placement 4 run(s), 480 move(s), all equal; 103.3 s, 22 sentences, 10 texts, question at 100.8 s;
    speed median 0.90 ms, 95 % under 2.00 ms — **no problems**;
  - **0 errors, 0 warnings** on both pages. Contact sheets: `build/lessons/part-3/check-draft/sheet-en.png`,
    `sheet-fr.png` (looked at both: move 13 detail with the 12 % dice and the 58.6 peak, the two fast replays with the
    chart, move 60 rejected at T 0.08, the stamp over the dimmed stage, the final card).
- Voices + pages (2026-11-17, VPN up; note: `LD_LIBRARY_PATH` must be unset for `ffprobe`, the Vibe wrapper's
  libstdc++ breaks the system ffmpeg): EN 22 sentences, 96.5 s (19.4 s of pauses), `lesson-en.m4a` + `timing-en.json`;
  FR 22 sentences, 97.6 s (19.4 s of pauses), `lesson-fr.m4a` + `timing-fr.json`; ZH subs 22 sentences against the EN
  timing; `build_lesson.py` wrote `docs/lessons/part-3/index.html` (0.25 MB, words exact) and
  `docs/fr/lessons/part-3/index.html` (0.25 MB, words exact).
- `check_lesson.py` on the two built pages, 2026-11-17:
  - EN: claims 4/4; placement 4 run(s), 480 move(s) replayed by the engine, all equal; 96.5 s, 22 sentences, 10 texts,
    question at 93.6 s; speed (CPU 6x) median 0.60 ms, 95 % under 1.50 ms, worst 2.60 ms — **no problems**;
  - FR: claims 4/4; placement 4 run(s), 480 move(s), all equal; 97.6 s, 22 sentences, 10 texts, question at 94.8 s;
    speed median 0.70 ms, 95 % under 1.50 ms, worst 2.40 ms — **no problems**;
  - **0 errors, 0 warnings** on both pages. Contact sheets: `build/lessons/part-3/check/sheet-en.png`,
    `sheet-fr.png` (looked at both: move 13 detail with the 12 % dice and the 58.6 peak, the two fast replays with the
    chart, move 60 rejected at T 0.08, the stamp over the dimmed stage, the final card).
