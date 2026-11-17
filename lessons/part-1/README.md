# Part 1 — Why not only walk downhill? (transcript slides 1-6)

Animated lesson, `placement` scene of the `lesson-animator` skill (v5.0.1). Plan: `../tools/lab07-notes/LESSON_PLANS.md`
(Part 1), with the changes listed under "Deviations" below.

## Inputs
| Input | Value |
|---|---|
| Transcript EN | `../eda-learning-lab7-pl/courses/learn_placement/module02-07-sa-placement/transcript.md` (teacher clone) |
| Transcript FR / ZH | `i18n/fr/module02-07-sa-placement/transcript.md`, `i18n/zh/module02-07-sa-placement/transcript.md` |
| Slides | 1-6 (28 sentences in EN, FR and ZH, same split per slide) |
| Voices | EN `en-US-AndrewMultilingualNeural`, FR `fr-FR-RemyMultilingualNeural`, `--rate=-4%` (edge-tts, exact word timings) |
| Subtitles | EN page: FR (voiced timing) + ZH (`subs_build.py`, against the EN timing); FR page: EN + ZH |
| Data | the module's `examples/trace_seed42_60.json`, `trace_seed199_60.json`, `trace_seed162_60.json`, `trace_seed42_300.json`, `seeds_1_200.json` (same `--data` for every part) |
| Output | `docs/lessons/part-1/` (EN), `docs/fr/lessons/part-1/` (FR); timings and audio in `build/lessons/part-1/` |

## Scenes (anchor words EN / FR)
| Slide | Picture |
|---|---|
| 1 | start placement of `seed42_60` (move 0); nets appear on *joined / reliées*; tag "Goal: shorter wires" on *shorter / raccourcir* |
| 2 | ring on every cell from *block / bloc*; term "Net" on *nets / réseaux* |
| 3 | only the A-B-C-D net (net 4) from *smallest / petite*; its wirelength 16.0 on *height / hauteur*; term "HPWL" on *half / demi* |
| 4 | every net and every net's wirelength on *eight / huit*; equation 4 × 8 + 16 + 4 = 52 built on *sixteen / seize*, *four#1 / quatre#1*, *fifty / cinquante*; nets 0-3, then 4, then 5 stand out in turn; counter 52.0 from *fifty* |
| 5 | tags "keep only shorter wires" (*simple*) and "stuck in the first dip" (*dip / creux*); landscape sketch from *downhill / descendre*; the ball rolls into the first dip on *stop / arrêtez* |
| 6 | the ball climbs the hill on *worse / aggrave*; term "Simulated annealing" on *smith / forgeron*; landscape off on *pause*; side panel on *first / premier*: move 1 (cell D) plays its ghost against the right wall and "wires +3.0" on *three / trois*, then **stops before the dice** (`stop: "delta"`); the side panel fades under the question card, the ghost of D stays visible next to it |

Pauses: 1.2 s after *fifty*, 1.0 s after *dip*. Chapters: start "Why a worse move?", slide 3 "Boxes", slide 5 "Downhill".
The first timeline key (the ball rolling, *stop*) is far past 0.6 s into the audio; move 1 is keyed on *first* (slide 6).

## Claims (10, all checked by the engine)
- start placement: wirelength 52; nets 0-3 = 8 each, net 4 (A-B-C-D) = 16, net 5 (E-F) = 4;
- `seed42_60` starts at 52; move 1: cell D, axis x, +3, pushed against the wall (`clamped`);
- try-it: F dragged onto E (4, 4) gives 48.
"Six cells" and "six nets" have no claim key: the per-net claims for nets 0..5 and the data's six cells A-F back them.

## Question (pause and guess, at the end of slide 6)
"The first move makes the wires 3 longer. Keep it?" — Keep it (`correct: false`), Reject it (`false`), It depends
(`true`). The replies only point to Part 2: none says "dice" or "chance" (Part 2 opens with "Sometimes, and a dice roll decides.").

## On-screen words (`strings`)
FR: the narration says "mouvement", "mouvement neutre", "exécution", "graine", "acceptés / refusés", "la chance de garder":
the built-in "coup", "coup gratuit", "essai", "nouveau record", "chance d'accepter" are replaced (`plMoveLine`, `plVFree`,
`plFree`, `plYours`, `plStep`, `plMoveN`, `plMoves`, `plStepMsg`, `plRunMsg`, `plAtMove`, `plDone`, `plPaused`, `plHint`,
`plVBest`, `plChance`, `plWorse` = "pires"). EN: the built-in words match the transcript ("move", "free move", "seed",
"accepted / rejected", "best", "dice"), except `plChance` = "chance to keep: {p} %" ("The chance to keep this move...").

## Deviations from the plan
- `pads: ["A", "D"]` and `colors.F = #475569` in this part too (asked for every part).
- Landscape sketch on slides 5-6 and move 1 stopped before the dice under the card (addendum to the plan; the addendum
  file itself was not found in `../tools/lab07-notes/`). The plan's "D: wires +3" tag is replaced by the move card
  ("wires +3.0"), and the floor is not dimmed under the card, so the ghost of D stays readable.
- The equation reads "4 × 8 + 16 + 4 = 52" (as said: "four nets measure eight each") instead of "8 + 8 + 8 + 8 + ...",
  which ran off the stage.
- The replies of the card do not give the answer (the plan's "a dice roll decides" is left to Part 2).

## Commands (from the site repo; P=~/eda-venv/bin/python, SK=~/.claude/skills/lesson-animator)
```bash
export PYTHONDONTWRITEBYTECODE=1
P=$HOME/eda-venv/bin/python
SK=$HOME/.claude/skills/lesson-animator
T=../eda-learning-lab7-pl; M=module02-07-sa-placement; EX=$T/courses/learn_placement/$M/examples
DATA="$EX/trace_seed42_60.json $EX/trace_seed199_60.json $EX/trace_seed162_60.json $EX/trace_seed42_300.json $EX/seeds_1_200.json"
B=build/lessons/part-1; SB=lessons/part-1/storyboard.json
# draft (silent) check: draft_timing.py --transcript ... --slides 1-6 --lang en|fr --storyboard $SB --repo $T ...
# voices
$P $SK/scripts/voice_build.py --transcript $T/courses/learn_placement/$M/transcript.md --slides 1-6 --lang en \
   --voice en-US-AndrewMultilingualNeural --rate=-4% --storyboard $SB --repo $T --workdir .cache/voice \
   --out-audio $B/lesson-en.m4a --out-timing $B/timing-en.json
$P $SK/scripts/voice_build.py --transcript i18n/fr/$M/transcript.md --slides 1-6 --lang fr \
   --voice fr-FR-RemyMultilingualNeural --rate=-4% --storyboard $SB --repo $T --workdir .cache/voice \
   --out-audio $B/lesson-fr.m4a --out-timing $B/timing-fr.json
# Chinese subtitles, then the pages
$P $SK/scripts/subs_build.py --transcript i18n/zh/$M/transcript.md --slides 1-6 --lang zh --against $B/timing-en.json --out $B/subs-zh.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-en.json --audio $B/lesson-en.m4a --lang en \
   --out docs/lessons/part-1 --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA \
   --subs fr=$B/timing-fr.json --subs zh=$B/subs-zh.json
$P $SK/scripts/build_lesson.py --storyboard $SB --timing $B/timing-fr.json --audio $B/lesson-fr.m4a --lang fr \
   --out docs/fr/lessons/part-1 --fonts site_src/fonts --storage-key lab07-lesson-speed --data $DATA \
   --subs en=$B/timing-en.json --subs zh=$B/subs-zh.json
$P $SK/scripts/check_lesson.py docs/lessons/part-1/index.html docs/fr/lessons/part-1/index.html --sheets $B/check
```

## Check results
- Draft timing (2026-11-13): claims 10/10; 4 runs, 480 moves of the checker replayed, all equal; EN about 104 s,
  FR about 124 s; 0 errors, 0 warnings.
