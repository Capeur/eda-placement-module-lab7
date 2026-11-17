# Example: placement scene, Lab 07 (simulated annealing), engine demo, EN + FR

**This is a demo of the engine, not a lesson of the lab.** Its five short slides (`transcript-en.md`,
`transcript-fr.md`) are demo narration written to use every feature of the placement scene once. The real lessons
follow the module's five-part script (Stage 3) and its lesson plans.

Data (`data/`): the Lab 07 checker's traces (`sa_place_check.py --json`, Stage 2): `trace_seed42_60.json`,
`trace_seed199_60.json`, `trace_seed42_300.json`, and `seeds_1_200.json`. Six cells A–F, six nets, walls at −1 and 9.

## Scenes (anchor words EN / FR)
| Slide | Scene | Main changes |
|---|---|---|
| 1 | Cells and wires | `landscape` sketch, the ball rolls into the first dip; floor only (`side: 0`); net boxes; each net's wirelength on *box / boîte*; counter 52.0 on *fifty / cinquante* |
| 2 | One move | move 1 from *nudges / pousse*, stopped before the dice (`stop: delta`): ghost of D hits the wall, "wires +3.0" on *three / trois*; then resumed: dice bar 37 % on *chance*; verdict on *accepted / accepté* |
| 3 | Hot to cold | fast replay of moves 2–60 from *watch / regardez*; thermometer; tally 44 / 16 (11 better, 9 worse, 24 free); chart; outlines of the best placement |
| 4 | One seed, one story | run `seed199_60` replayed (never beats 52); spread of seeds 1–200 with 42, 199, 134 marked |
| 5 | Your turn | run `seed42_300`: the cells pile up, 2.6; `piles` badges ×2 and ×4; side panel faded; question card |

## Commands (from a site repo; the skill in ~/.claude/skills/lesson-animator)
```bash
SK=~/.claude/skills/lesson-animator; EX=$SK/examples/lab07-placement-demo
for L in en fr; do
  python3 $SK/scripts/draft_timing.py --transcript $EX/transcript-$L.md --slides 1-5 --lang $L --storyboard $EX/storyboard.json \
      --out-audio build/demo/draft-$L.m4a --out-timing build/demo/timing-$L.json
  python3 $SK/scripts/build_lesson.py --storyboard $EX/storyboard.json --timing build/demo/timing-$L.json \
      --audio build/demo/draft-$L.m4a --lang $L --out build/demo/$L --fonts site_src/fonts \
      --storage-key lab07-lesson-speed --data $EX/data/trace_seed42_60.json $EX/data/trace_seed199_60.json \
      $EX/data/trace_seed42_300.json $EX/data/seeds_1_200.json
done
python3 $SK/scripts/check_lesson.py build/demo/en/index.html build/demo/fr/index.html --sheets build/demo/check
```
The audio is silent (draft timing). For a voice, replace `draft_timing.py` with `voice_build.py --voice ... --rate=-4%`.

## Results (2026-11-12, cloud, draft timing)
- Claims 9/9; 3 runs, 420 moves of the lab checker replayed by the engine: all equal; 200 seeds compared: 0 differ.
- 0 errors, 0 warnings, EN and FR. Length with pauses: EN about 68 s, FR about 80 s (17 sentences each).
- Script per frame on a CPU slowed 6×: median about 1 ms.
- Try-it panel tested in Chromium: "One move" twice (move 1 accepted with dice 0.17, move 2 a free move), "Run to the
  end" (best 49.6 at move 45, 44 accepted = 11 + 9 + 24, 16 rejected), seed 199 (best 52.0, final 53.9), drag and
  arrow keys, "Back to the lesson".
- Regression: the Lab 05 floorplan demo rebuilt with this engine: 5/5 claims, 11 trees equal, 0 errors, 0 warnings.

## Subtitles (v5.0 step 3)
`transcript-zh.md` is the same demo narration in Chinese (17 sentences, same split). Add to the build commands:
`--subs fr=build/demo/timing-fr.json --subs zh=build/demo/subs-zh.json` (after
`subs_build.py --transcript $EX/transcript-zh.md --slides 1-5 --lang zh --against build/demo/timing-en.json --out build/demo/subs-zh.json`).
The Chinese text is a machine translation for the demo: have a native reader check any Chinese before publishing.
