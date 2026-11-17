# Part 2 — One move, up close (transcript slides 7-12)

Animated lesson, `placement` scene of the `lesson-animator` skill (v5.0.1). Plan: `../../lab07-notes/LESSON_PLANS.md`
(Part 2). Written from the committed plan (2026-11-17); see "Deviations" below.

## Inputs
| Input | Value |
|---|---|
| Transcript EN | `../eda-learning-lab7-pl/courses/learn_placement/module02-07-sa-placement/transcript.md` (teacher clone) |
| Transcript FR / ZH | `i18n/fr/module02-07-sa-placement/transcript.md`, `i18n/zh/module02-07-sa-placement/transcript.md` |
| Slides | 7-12 (28 sentences in EN, FR and ZH, same split per slide) |
| Voices | EN `en-US-AndrewMultilingualNeural`, FR `fr-FR-RemyMultilingualNeural`, `--rate=-4%` (edge-tts, exact word timings) |
| Subtitles | EN page: FR (voiced timing) + ZH (`subs_build.py`, against the EN timing); FR page: EN + ZH |
| Data | the module's `examples/trace_seed42_60.json`, `trace_seed199_60.json`, `trace_seed162_60.json`, `trace_seed42_300.json`, `seeds_1_200.json` (same `--data` for every part) |
| Output | `docs/lessons/part-2/` (EN), `docs/fr/lessons/part-2/` (FR); timings and audio in `build/lessons/part-2/` |

## Scenes (anchor words EN / FR)
| Slide | Picture |
|---|---|
| 7 | side panel on *watch / regardons*; the floor shows the start placement (52.0) |
| 8 | move 1 starts on *picks / choisit*: D's ghost slides right and the wall stops it (the red wall hit lands on *wall / mur* by itself); "wires +3.0" on *three / trois* |
| 9 | dice bar on *chance / chance*: the marker runs to 0.17 under the 37 % chance; verdict on *accepted / accepté* |
| 10 | move 2 on *second / deuxième*: D pushed at the wall again; "no wire changes" on *changes / change*; the dice bar says "not worse: accepted, no dice" on *no dice / aucun dé*; verdict "free move" on *free / neutre* |
| 11 | chance tags one by one: 72 % at *seventy / soixante*, 37 % at *thirty / trente*, 14 % at *fourteen / quatorze*; the equation "chance = e^(−Δ ÷ T)" and the thermometer (3.0) on *temperature / température* |
| 12 | fast replay of moves 3-12 from *later / plus tard* until *point / virgule* ("one point four"); D ringed from *pushed / poussé*; the card asks: bigger, smaller, or the same? |

Pauses: 1.6 s after *accepted* (the verdict settles), 0.9 s after *fourteen*.
Chapters: start "One move", slide 10 "Free move", slide 11 "The chance".

## Claims (6, all checked by the engine)
- move 1 of `seed42_60`: cell D, axis x, +3, T 3, chance 0.37, dice 0.17, accepted, clamped (kind: worse);
- move 2: cell D, Δ 0, accepted, clamped (kind: free);
- the formula at T 3: +1 → 72 %, +3 → 37 %, +6 → 14 %;
- move 13: cell D, T 1.4, +3, clamped (backs the card: the same +3 move, colder).

## Question (pause and guess, at the end of slide 12)
"Same +3 move, but colder: T = 1.4. The chance is..." — Bigger (false), Smaller (true: colder makes the dice stricter),
The same (false). Every reply points to Part 3 for the number (12 %).

## On-screen words (`strings`)
Same replacements as Part 1 (copied verbatim from its storyboard): the French narration says "mouvement",
"mouvement neutre", "exécution", "chance de garder", so the built-in "coup", "coup gratuit", "essai",
"chance d'accepter" are replaced; EN: `plChance` = "chance to keep: {p} %".

## Deviations from the plan
- None in the timeline, show windows, claims, pauses, chapters or the card: the storyboard follows LESSON_PLANS.md
  Part 2 exactly, including the Stage 4 sentence fixes (the extra dice sentence on S9, the split temperature sentence
  on S11; both already in the transcripts).
- The plan gives no overlay positions for the S11 chance tags and equation; they sit at (46, 9) and (46, 23),
  to be confirmed by `check_lesson.py` (the side panel is on from *watch*; these stay in the top band, left of it).
- The plan's note "the ghost hits the right wall on *wall*" is natural timing (the ghost starts at *picks*, the delta
  phase is pinned to *three*); no timeline key exists or is needed for it.

## Commands (from the site repo; P=~/eda-venv/bin/python, SK=~/.claude/skills/lesson-animator)
```bash
export PYTHONDONTWRITEBYTECODE=1
T=../eda-learning-lab7-pl; M=module02-07-sa-placement; EX=$T/courses/learn_placement/$M/examples
DATA="$EX/trace_seed42_60.json $EX/trace_seed199_60.json $EX/trace_seed162_60.json $EX/trace_seed42_300.json $EX/seeds_1_200.json"
B=build/lessons/part-2; SB=lessons/part-2/storyboard.json
# draft (silent) check first, no VPN needed:
#   $P $SK/scripts/draft_timing.py --transcript $T/courses/learn_placement/$M/transcript.md --slides 7-12 --lang en \
#      --storyboard $SB --repo $T --out $B/timing-en-draft.json   (same for --lang fr with the FR transcript)
# voices
$P $SK/scripts/voice_build.py --transcript $T/courses/learn_placement/$M/transcript.md --slides 7-12 --lang en \
   --voice en-US-AndrewMultilingualNeural --rate=-4% --storyboard $SB --repo $T --workdir .cache/voice \
   --out-audio $B/lesson-en.m4a --out-timing $B/timing-en.json
$P $SK/scripts/voice_build.py --transcript i18n/fr/$M/transcript.md --slides 7-12 --lang fr \
   --voice fr-FR-RemyMultilingualNeural --rate=-4% --storyboard $SB --repo $T --workdir .cache/voice \
   --out-audio $B/lesson-fr.m4a --out-timing $B/timing-fr.json
# Chinese subtitles, then the pages
$P $SK/scripts/subs_build.py --transcript i18n/zh/$M/transcript.md --slides 7-12 --lang zh --against $B/timing-en.json --out $B/subs-zh.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-en.json --audio $B/lesson-en.m4a --lang en \
   --out docs/lessons/part-2 --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA \
   --subs fr=$B/timing-fr.json --subs zh=$B/subs-zh.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-fr.json --audio $B/lesson-fr.m4a --lang fr \
   --out docs/fr/lessons/part-2 --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA \
   --subs en=$B/timing-en.json --subs zh=$B/subs-zh.json
$P $SK/scripts/check_lesson.py docs/lessons/part-2/index.html docs/fr/lessons/part-2/index.html --sheets $B/check
```

## Check results
- Draft timing: not run yet. Run the draft command first (silent, no VPN needed); then the voices.
