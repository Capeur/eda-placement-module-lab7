# Lab 07 — lesson plans for the `placement` scene (one per part)

Written in Stage 3 (2026-11-12) for Stage 5b. Source script: `courses/learn_placement/module02-07-sa-placement/transcript.md`
(29 slides, 128 sentences, 1,137 spoken words, lint clean; Stage 4 added one sentence on S9 and split one on S11). Every number below comes from `examples/sa_place_check.py` (its traces and
`seeds_1_200.json`), and `stage3_facts.py` (this folder) checks every number the narration says: **55 PASS**.

Only features listed in `~/.claude/skills/lesson-animator/reference/storyboard.md` ("Placement scene" and the shared
sections) and used in `examples/lab07-placement-demo/` are named here. Anything else is under **Wishes for the engine**
at the end.

## Conventions

- `word (S8)` = anchor on the first word of slide 8 starting with `word`; `word#1` = the second one. Every anchor below
  was checked with `lessonlib.find_anchor_sentence` against the real sentence split (107 anchors, 0 missing).
  Re-check after any transcript edit: `python3 -B check_anchors.py [--old OLD_TRANSCRIPT]` (this folder; 108 anchor
  uses, 0 missing after Stage 4, 110 counting the Part 2 note below; `--old` lists anchors whose sentence text changed).
- Runs (all exist, all already proven equal to node by `--vs-node`): `seed42_60`, `seed199_60`, `seed162_60`, `seed42_300`,
  plus `seeds_1_200.json` for `spread`. **No new trace is needed.** Build each part with only the files it uses:
  `--data examples/trace_seed42_60.json [...]`.
- Floor = `floorBox` default `[36,168,344,344]` (y up; 34.4 stage units per square). Side panel default.
- `pads: ["A","D"]` only in Part 5 (the parts before never mention pads, and a dark border would raise a question
  nobody answers).
- Chart: `"best": false` in Part 3 (the best is taught in Part 4), `true` from Part 4 on.
- **Colours** (added in Stage 4): set `"placement": { "colors": { "F": "#475569" } }` in every storyboard. The engine's
  default gives F `#0e7490` (sorted-index palette), while the checker's `COLORS` and the browser lab give F slate `#475569`;
  A–E already match (`#1d4ed8`, `#0f6b5c`, `#b45309`, `#7c3aed`, `#be123c`).
- Counters show one decimal (f1): the narration says 27.8 (not 27.75) so voice and screen agree.

## Idea map (repetition rule: taught once, recalled once in slide 28)

| Idea | Taught on | Recalled on |
|---|---|---|
| Net box, width + height, HPWL 52 | S3–S4 | — (number reused as the start line) |
| Downhill gets stuck; annealing keeps some worse moves | S5–S6 | S28 (dice) |
| Worse → dice with a chance; not worse → accepted, no dice | S9–S10 | S28 |
| Free move | S10 | S17 (count) |
| Chance depends on how much worse and on temperature | S11 | — |
| Cooling: hot brave, cold picky | S14 | S28 ("cold makes the dice strict") |
| Accepted ≠ better (44 = 11 + 9 + 24) | S17 | S28, S29 (lab numbers) |
| Seed fixes every roll | S19 | S29 (same dice in Python) |
| Keep the best copy, return it | S22 | S28 |
| One seed, one story; judge by many runs | S24 | S28 |
| Cost does not see overlap | S26 | S28 |
| Every cell moves, even pads | S27 | — |

## Part boundaries

| Part | Title | Slides | Sentences | Words | Opens with | Pause and guess |
|---|---|---|---|---|---|---|
| 1 | Why not only walk downhill? | 1–6 | 28 | 257 | hook question | +3 move: keep it? |
| 2 | One move, up close | 7–12 | 28 | 241 | "Sometimes, and a dice roll decides." | same +3, colder (T 1.4): chance bigger, smaller, same? |
| 3 | Hot to cold | 13–18 | 22 | 183 | "Smaller: only twelve percent." | last wires = shortest? |
| 4 | Best, not final | 19–23 | 22 | 187 | "This time, yes." | is 49.6 typical? |
| 5 | What the cost does not know | 24–29 | 28 | 269 | "Not at all: it is one of the worst." | how could the cost stop piling up? (answered on its own card) |

---

## Part 1 — Why not only walk downhill? (slides 1–6)

**Runs and moves:** `seed42_60`, move 0 only (the start placement). No move plays. `initial: { run: seed42_60, move: 0, side: 0 }`;
the side panel stays at 0 for the whole part (the floor is the picture).

**Detail moves:** none. **Fast replays:** none.

**Timeline:** `slide:6:end` → `dim: 0.12` (under the card).

**Show windows**

| show | from | to | fields |
|---|---|---|---|
| `nets` | `joined` (S1) | `smallest` (S3) | all nets |
| `nets` | `smallest` (S3) | `eight` (S4) | `ids: [4], only: true` (the A-B-C-D net, an 8 × 8 box) |
| `nets` | `eight` (S4) | end | all nets |
| `netlabels` | `height` (S3) | `slide:4` | `ids: [4]` (16) |
| `netlabels` | `eight` (S4) | end | all (8, 8, 8, 8, 16, 4) |
| `counter` | `fifty` (S4) | end | `metric: hpwl` (52.0) |
| `highlight` | `three` (S6) | end | `ids: ["D"]` |

**Headlines (one per slide, `x: 3, y: 4`)**
- S1 "Why keep a **worse** move?" — sub `{six cells, six nets@joined}`
- S2 "Cells and **nets**" — `term` "Net" / "a group of cells joined by wires" from `nets` (S2)
- S3 "Measure a net with a **box**" — sub `{width + height@height}`; `term` "HPWL" / "half-perimeter wirelength" from `half` (S3)
- S4 "**52** to start" — `eq` `{8 + 8 + 8 + 8@eight} {+ 16@sixteen} {+ 4@four1} {= 52@fifty}` (anchor `four1` = `four#1` (S4))
- S5 "Walking **downhill** in fog" — `tags`: "keep only shorter wires" at `simple` (S5), "stuck in the first dip" at `dip` (S5)
- S6 "Sometimes, go **uphill**" — `term` "Simulated annealing" / "cool slowly, like a smith's metal" from `smith` (S6);
  `tag` "D: wires +3" next to D from `three` (S6)

**Pauses:** after `fifty` 1.2 s; after `dip` 1.0 s.

**Chapters:** start "Why a worse move?" · `slide:3` "Boxes" · `slide:5` "Downhill".

**Claims**
```json
{ "positions": "start", "hpwl": 52 }
{ "run": "seed42_60", "move": 1, "dHpwl": 3 }
```
(Numbers said: six, six, eight ×4, sixteen, four, fifty-two, three. The per-net 8/16/4 have no claim key: see Wishes 1;
`stage3_facts.py` checks them.)

**Pause-and-guess card** (`question.at: slide:6:end+0.3`, overlay `question` at `x: 50, y: 44`)
- Text: "The first move makes the wires **3** longer. Keep it?" Hint: "A careful walker never goes uphill."
- "Keep it" → "Sometimes it is kept. Part 2 shows who decides."
- "Reject it" → "A careful walker would. The annealer sometimes keeps it: Part 2 shows how."
- "It depends" → "Right: a dice roll decides. Part 2 shows it."

**Learner try (bench):** drag F onto E (or E onto F): the E–F box closes and the counter drops from 52 to **48**
(checked with the checker's `total_hpwl`). Then "Start again".

---

## Part 2 — One move, up close (slides 7–12)

**Opens by answering Part 1:** "Sometimes, and a dice roll decides."

*Stage 4 transcript fixes (anchors re-checked, none moved to another idea):* S9 gained "This dice gives a number smaller
than one." just before "The dice shows zero point one seven." It falls inside the `dice` window that opens at `chance`
(S9), so the dice bar is already on screen. S11 "The second thing is the temperature, which starts at three." became two
sentences: "The second thing is a number called the temperature. It starts at three." The `thermo` show and the `eq`
still start at `temperature` (S11), now the first of the two; the thermometer reads 3.0 as the next sentence says it.
S11 now has 7 sentences (the only slide above 6).

**Runs and moves:** `seed42_60`, moves 1–12. `initial: { run: seed42_60, move: 0, side: 0 }`.

**Detail moves**

| Move | Key at | until | delta | dice | verdict | What is said |
|---|---|---|---|---|---|---|
| 1 (D, x +, wall, Δ +3, T 3, p 0.37, u 0.17, accepted) | `picks` (S8) | `accepted+1.2` (S9) | `three` (S8) "three longer" | `chance` (S9) | `accepted` (S9) | the ghost hits the right wall on "wall" (S8) |
| 2 (D, x, wall again, Δ 0, free) | `second` (S10) | `free+1.0` (S10) | `changes` (S10) "no wire changes" | `no dice` (S10) | `free` (S10) | dice bar says "not worse: accepted, no dice" |

**Fast replay:** moves 3 → 12 from `later` (S12) until `point+0.3` (S12, "one point four"): 10 moves, about 2.5 s.

**Timeline**
```json
{ "at": "@watch", "side": 1 },
{ "at": "@picks", "move": { "to": 1, "until": "@accepted+1.2", "phases": { "delta": "@three8", "dice": "@chance", "verdict": "@accepted" } } },
{ "at": "@second", "move": { "to": 2, "until": "@free+1.0", "phases": { "delta": "@changes", "dice": "@nodice", "verdict": "@free" } } },
{ "at": "@later", "move": { "to": 12, "until": "@point+0.3" } },
{ "at": "slide:12:end", "side": 0, "dim": 0.12 }
```

**Show windows**

| show | from | to | fields |
|---|---|---|---|
| `nets` | start | end | |
| `counter` | start | end | `metric: hpwl` (52 → 55 on move 1) |
| `move` | `picks` (S8) | `slide:12:end` | |
| `dice` | `chance` (S9) | `slide:11` | |
| `thermo` | `temperature` (S11) | end | (3.0, then 1.43 after the replay) |
| `highlight` | `pushed` (S12) | end | `ids: ["D"]` |

**Headlines**
- S7 "One move, **up close**"
- S8 "Pick, push, **measure**" — sub `{wires +3@three8}`
- S9 "Worse? **Roll the dice**" — sub `{0.17 < 0.37: accepted@accepted}`
- S10 "A **free** move" — `term` "Free move" / "the cell moves, no wire changes" from `free` (S10)
- S11 "What sets the **chance**" — `tags`: "1 longer: 72 %" at `seventy`, "3 longer: 37 %" at `thirty`, "6 longer: 14 %" at
  `fourteen`; `eq` "chance = e^(−Δ ÷ T)" from `temperature` (S11) (written with ÷ on screen; never spoken)
- S12 "Same move, **colder**" — sub `{T = 1.4@point}`

**Pauses:** after `accepted` 1.6 s (the verdict settles); after `fourteen` 0.9 s.

**Chapters:** start "One move" · `slide:10` "Free move" · `slide:11` "The chance".

**Claims**
```json
{ "run": "seed42_60", "move": 1, "cell": "D", "axis": "x", "dHpwl": 3, "T": 3, "p": 0.37, "u": 0.17, "accepted": true, "clamped": true, "kind": "worse" }
{ "run": "seed42_60", "move": 2, "cell": "D", "dHpwl": 0, "accepted": true, "clamped": true, "kind": "free" }
{ "formula": "p", "dHpwl": 1, "T": 3, "p": 0.72 }
{ "formula": "p", "dHpwl": 3, "T": 3, "p": 0.37 }
{ "formula": "p", "dHpwl": 6, "T": 3, "p": 0.14 }
{ "run": "seed42_60", "move": 13, "cell": "D", "T": 1.4, "dHpwl": 3, "clamped": true }
```
("Thirty-seven percent" = p 0.37; "zero point three seven" is the same claim.)

**Pause-and-guess card** (`slide:12:end+0.3`)
- Text: "Same **+3** move, but colder: **T = 1.4**. The chance is…" Hint: "At T = 3 it was 37 %."
- "Bigger" → "No: colder makes the dice stricter. Part 3 gives the number."
- "Smaller" → "Right: colder makes the dice stricter. Part 3 gives the number."
- "The same" → "No: the temperature changes the chance too. Part 3 gives the number."

**Learner try:** "Start again", then **One move** twice: move 1 (accepted with dice 0.17), move 2 (free move, no dice).

---

## Part 3 — Hot to cold (slides 13–18)

**Opens by answering Part 2:** "Smaller: only twelve percent."

**Runs and moves:** `seed42_60`, moves 13–60. `initial: { run: seed42_60, move: 12, side: 1 }`.

**Detail moves**

| Move | Key at | until | delta | dice | verdict |
|---|---|---|---|---|---|
| 13 (D, y +, wall, Δ +3, T 1.43, p 0.12, u 0.09, accepted, HPWL 58.6 = peak) | `start+0.6` | `passes+1.2` (S13) | `start+0.6` | `twelve` (S13) | `passes` (S13) |
| 60 (A, x −, wall, Δ +3, T 0.08, p 0, u 0.56, rejected) | `last` (S16) | `rejected+1.2` (S16) | `three` (S16) | `chance` (S16) | `rejected` (S16) |

If the checker calls move 13 rushed ("twelve" comes about 1 s into the audio), pin `dice` to `shows` (S13) instead.

**Fast replays**
- moves 14 → 45 from `watch` (S15) until `fortyfive` (S15, "forty-five"): 32 moves, about 7 s; move 45 makes the new best 49.6.
- moves 46 → 59 from `fortynine+0.8` (S15) `over: 2.0`, with a 2.0 s pause after `fortynine` so it ends before `last` (S16).

**Timeline**
```json
{ "at": "start+0.6", "move": { "to": 13, "until": "@passes+1.2", "phases": { "delta": "start+0.6", "dice": "@twelve", "verdict": "@passes" } } },
{ "at": "@watch", "move": { "to": 45, "until": "@fortyfive" } },
{ "at": "@fortynine+0.8", "move": { "to": 59, "over": 2.0 } },
{ "at": "@last", "move": { "to": 60, "until": "@rejected+1.2", "phases": { "delta": "@three", "dice": "@chance", "verdict": "@rejected" } } },
{ "at": "slide:18", "side": 0, "dim": 0.12 }
```

**Show windows**

| show | from | to | fields |
|---|---|---|---|
| `nets` | start | end | |
| `counter` | start | end | `metric: hpwl` (58.6 after move 13; 49.6 at move 45) |
| `move` | start | `slide:17` | |
| `dice` | start | `slide:14` | |
| `dice` | `last` (S16) | `slide:17` | |
| `thermo` | start | end | 1.43 → 0.07 |
| `chart` | `watch` (S15) | end | `best: false` |
| `tally` | `fortyfour` (S17) | `eleven` (S17) | 44 · 16 |
| `tally` | `eleven` (S17) | end | `kinds: true` (11 better · 9 worse · 24 free) |

**Headlines**
- S13 "Colder: **12 %**" — sub `{dice 0.09 < 0.12: passes@passes}`; `tag` "the longest of the run" from `longest` (S13)
- S14 "From **hot** to **cold**" — sub `{T: 3 → 0.07@ends}`; `tags`: "hot = brave" at `brave`, "cold = picky" at `picky`
- S15 "**Sixty** moves" — sub `{shortest so far: 49.6, move 45@fortynine}`
- S16 "The **last** move" — sub `{T < 0.1: chance 0@chance}`
- S17 "Accepted **≠** better" — `stamp` "44 accepted, only 11 better" from `mean` (S17)
- S18 "Last or **best**?"

**Pauses:** after `longest` 1.2 s; after `fortynine` 2.0 s (see the replay); after `rejected` 1.2 s; after `twentyfour` 1.0 s.

**Chapters:** start "Colder" · `slide:14` "Hot to cold" · `slide:17` "Accepted is not better".

**Claims**
```json
{ "run": "seed42_60", "move": 13, "p": 0.12, "u": 0.09, "accepted": true, "kind": "worse", "hpwl": 58.6 }
{ "run": "seed42_60", "peak": 58.6, "Tend": 0.07, "bestMove": 45, "best": 49.6, "accepted": 44, "rejected": 16, "better": 11, "worse": 9, "free": 24 }
{ "run": "seed42_60", "move": 60, "cell": "A", "axis": "x", "dHpwl": 3, "T": 0.08, "p": 0, "accepted": false, "clamped": true }
{ "formula": "p", "dHpwl": 3, "T": 1.43, "p": 0.12 }
```
("Starts at three" is the move-1 claim of Part 2; repeat it here if a claim per part is required:
`{ "run": "seed42_60", "move": 1, "T": 3 }`.)

**Pause-and-guess card** (`slide:18:end+0.3`)
- Text: "After 60 moves, are the **last** wires also the **shortest**?" Hint: "Look at the chart."
- "Yes, always" → "Not always. Part 4 shows two seeds where the last move spoils it."
- "This time" → "Good eye: the chart ends on its lowest value. Part 4 explains why that is luck."
- "Never" → "Too strong: look where the chart ends."

**Learner try:** **Run to the end** from move 12: the tally reaches 44 · 16 (11 + 9 + 24) and the summary gives the best
49.6 at move 45.

---

## Part 4 — Best, not final (slides 19–23)

**Opens by answering Part 3:** "This time, yes."

**Runs and moves:** `seed42_60` at move 60, then `seed199_60` (1 → 60), `seed162_60` (1 → 60), back to `seed42_60`.
`initial: { run: seed42_60, move: 60, side: 1 }`.

**Detail move**

| Move | Key at | until | delta | dice | verdict |
|---|---|---|---|---|---|
| seed 162, move 60 (E, y +, Δ +0.13, T 0.08, p 0.18, u 0.09, accepted, worse) | `then` (S21) | `pass+1.2` (S21) | `longer` (S21) | `dice` (S21) | `pass` (S21) |

**Fast replays**
- `seed199_60` moves 1 → 11 from `story` (S20) until `sixty` (S20) (move 11 is its peak, 60.5), then 12 → 60 from `sixty+0.3`
  until `fiftythree` (S20, `fifty#1`, "fifty-three").
- `seed162_60` moves 1 → 59 from `slide:21` until `reaches+0.3` (S21) (move 59 = its best, 27.8).
- `seed42_60` moves 1 → 60 from `slide:23` `over: 2.5`.

**Timeline**
```json
{ "at": "@story", "run": "seed199_60", "move": { "to": 11, "until": "@sixty" } },
{ "at": "@sixty+0.3", "move": { "to": 60, "until": "@fiftythree" } },
{ "at": "slide:21", "run": "seed162_60", "move": { "to": 59, "until": "@reaches+0.3" } },
{ "at": "@then", "move": { "to": 60, "until": "@pass+1.2", "phases": { "delta": "@longer", "dice": "@dice", "verdict": "@pass" } } },
{ "at": "slide:23", "run": "seed42_60", "move": { "to": 60, "over": 2.5 } },
{ "at": "slide:23:end", "side": 0, "dim": 0.12 }
```

**Show windows**

| show | from | to | fields |
|---|---|---|---|
| `nets` | start | end | |
| `counter` | start | `returns0` (S22) | `metric: hpwl` |
| `counter` | `returns0` (S22) | `slide:23` | `metric: best`, `label` "returned" |
| `counter` | `slide:23` | end | `metric: hpwl` |
| `chart` | start | end | `best: true` (follows the run switches) |
| `thermo` | start | end | |
| `move` | `then` (S21) | `slide:22` | |
| `dice` | `dice` (S21) | `slide:22` | |
| `bestpos` | `copy` (S22) | `slide:23` | dashed outlines of seed 162's best (only E differs) |
| `highlight` | `copy` (S22) | `slide:23` | `ids: ["E"]` |

Do **not** show `bestpos` on seed 42 in S19: its best and final *positions* differ (free moves 47–59 moved A, C, D) while
the wirelengths are equal, which the narration does not explain.

**Headlines**
- S19 "This time, **yes**" — sub `{49.6 at move 45, still 49.6 at move 60@nothing}`; `term` "Seed" / "the number that
  fixes every dice roll" from `seed` (S19)
- S20 "Seed **199**" — sub `{never beats 52@never}`
- S21 "Seed **162**" — sub `{27.8, then 27.9@nine}`
- S22 "Keep the **best**" — sub `{return the best copy, not the last@copy}`; `thumbs` from `returns2` (S22) to `slide:23`:
  `[{ run: seed162_60, move: "best", label: "seed 162: 27.8" }, { run: seed199_60, move: "best", label: "seed 199: 52.0" }]`
  (side panel faded with `side: 0` under them if `check_lesson.py` reports an overlap)
- S23 "Is **42** typical?"

**Pauses:** after `fiftythree` 1.4 s; after `pass` 1.4 s.

**Chapters:** start "This time, yes" · `slide:20` "Two other seeds" · `slide:22` "Keep the best".

**Claims**
```json
{ "run": "seed42_60", "best": 49.6, "final": 49.6, "bestMove": 45 }
{ "run": "seed199_60", "start": 52, "best": 52, "bestMove": 0, "final": 53.9, "peak": 60.5 }
{ "run": "seed199_60", "move": 11, "hpwl": 60.5 }
{ "run": "seed162_60", "bestMove": 59, "best": 27.8, "final": 27.9 }
{ "run": "seed162_60", "move": 60, "cell": "E", "kind": "worse", "accepted": true, "p": 0.18, "u": 0.09 }
{ "seeds": true, "beat": { "seed": 42, "count": 197 } }
```
(The last one backs the card replies.)

**Pause-and-guess card** (`slide:23:end+0.3`)
- Text: "Seed 42 returned **49.6**. Is that a typical result?" Hint: "Seed 162 reached 27.8."
- "Typical" → "Not quite. Part 5 runs two hundred seeds."
- "Better than most" → "No: 197 seeds out of 200 do better. Part 5 shows them."
- "One of the worst" → "Right: 197 seeds out of 200 do better. Part 5 shows them."

**Learner try:** type seed **199** in the Seed box and **Run to the end** (best 52.0, final 53.9); then seed **162**.

---

## Part 5 — What the cost does not know (slides 24–29)

**Opens by answering Part 4:** "Not at all: it is one of the worst."

**Runs and moves:** `seeds_1_200` (spread), `seed42_300` (0 → 300), `seed42_60` (0 → 60). `initial: { run: seed42_60, move: 60, side: 1 }`,
`pads: ["A","D"]`.

**Detail moves:** none (the move rule is done; this part is about results).

**Fast replays**
- `seed42_300` moves 1 → 300 from `instead` (S25) until `point` (S25, "two point six"): about 8 s; the first 60 moves are
  the Part 3 run (same seed, same dice), then the cells collapse to 2.6 (best at move 278).
- `seed42_60` moves 1 → 60 from `browser` (S29) `over: 3.0`.

**Timeline**
```json
{ "at": "@instead", "run": "seed42_300", "move": { "to": "all", "until": "@point" } },
{ "at": "@look", "camera": [200, 335, 420] },
{ "at": "slide:27", "camera": "full" },
{ "at": "slide:28", "side": 0, "dim": 0.12 },
{ "at": "slide:29", "side": 1, "dim": 1, "run": "seed42_60", "move": { "to": 60, "over": 3.0 } },
{ "at": "slide:29:end", "side": 0, "dim": 0.12 }
```
The camera shot covers both heaps of the 300-move result (A, B, C, D around (4.4, 3.2); E, F around (2.8, 5.3)); check
it on the contact sheet and widen it if a cell is cut.

**Show windows**

| show | from | to | fields |
|---|---|---|---|
| `nets` | start | `slide:28` | |
| `nets` | `slide:29` | end | |
| `spread` | `twohundred` (S24) | `slide:25` | `seeds: [42, 199, 134, 162]`, `median: true`, `stagger` small (0.01) |
| `counter` | `slide:25` | `slide:28` | `metric: hpwl` (→ 2.6) |
| `counter` | `slide:29` | end | `metric: hpwl` |
| `chart` | `slide:25` | `slide:28` | `best: true` |
| `thermo` | `slide:25` | `slide:28` | |
| `highlight` | `pads` (S27) | `slide:28` | `ids: ["A","D"]` |
| `tally` | `accepted` (S29) | end | (44 · 16) |

**Headlines**
- S24 "One seed, **one story**" — sub `{200 seeds: 13.7 to 52, middle 36@middle}`; `stamp` "197 beat seed 42" from
  `ninetyseven` (S24)
- S25 "**300** moves" — sub `{the same first 60 moves@same}`
- S26 "What the cost **does not know**" — `stamp` "overlap!" from `top` (S26); `thumbs` from `perfect` (S26) to `slide:27`:
  `[{ run: seed42_60, move: "best" }, { run: seed42_300, move: "best" }]` (captions computed: 49.6 and 2.6)
- S27 "Every cell **moves**" — `tag` "pads move too, in this lab" from `even` (S27)
- S28 "Remember" — `vocab`: { k "Dice", "worse passes only by chance" at `allows` }, { k "Cold", "the dice gets strict" at
  `strict` }, { k "Accepted", "not the same as better" at `mean` }, { k "Best", "keep a copy, return it" at `keep` },
  { k "Seed", "one seed, one story" at `story` }, { k "Cost", "only knows the wires" at `knows` }
- S29 "Your **turn**" — sub `{49.6 · 44 accepted · 16 rejected@fortynine}` (anchor `forty#1` (S29); `forty#0` is
  "forty-two")

**Pauses:** after `point` (S25) 1.6 s (let the pile be seen); after `perfect` 1.2 s; after `knows` 1.2 s.

**Chapters:** start "Two hundred seeds" · `slide:25` "Three hundred moves" · `slide:28` "Remember" · `slide:29` "Your turn".

**Claims**
```json
{ "seeds": true, "min": 13.7, "max": 52, "median": 36, "minSeed": 134, "maxSeed": 199, "beat": { "seed": 42, "count": 197 } }
{ "run": "seed42_300", "best": 2.6, "bestMove": 278 }
{ "run": "seed42_300", "move": 60, "hpwl": 49.6, "bestSoFar": 49.6 }
{ "run": "seed42_60", "best": 49.6, "accepted": 44, "rejected": 16 }
{ "positions": { "A": {"x":4,"y":4}, "B": {"x":4,"y":4}, "C": {"x":4,"y":4}, "D": {"x":4,"y":4}, "E": {"x":4,"y":4}, "F": {"x":4,"y":4} }, "hpwl": 0 }
```
(The last one backs the learner try. Numbers said without a claim key: "two hundred" seeds, "one of the worst" (3rd worst),
"the first sixty moves are the same": see Wishes 6–7; `stage3_facts.py` checks them.)

**Pause-and-guess card** (`slide:29:end+0.3`; the last part's card answers its own question)
- Text: "How could the cost stop cells from **piling up**?" Hint: "The cost only counts wires."
- "Count the cells in each area" → "Yes: split the chip into squares and punish crowded ones. That is the next lab,
  density bins and overflow."
- "Run more moves" → "No: with 300 moves the cells piled up even more. More moves only chase shorter wires."
- "Freeze the pads" → "That holds A and D only. The other cells can still pile up: the cost needs a crowding term,
  the next lab."

**Learner try:** drag all six cells onto one point: the readout says **0.0**, the "best" placement nobody can build. Then
type seed **134** in the Seed box and **Run to the end**: 13.7, the best of the 200 seeds.

---

## Wishes for the engine (things the plans need that the scene cannot do; nothing above uses them)

1. **Per-net claim**, e.g. `{ "positions": "start", "net": 4, "hpwl": 16 }`. Part 1 says 8, 8, 8, 8, 16, 4; `netlabels` draws
   them (computed), but a narration typo would not be caught. Meanwhile `stage3_facts.py` checks them.
2. **A landscape sketch** (a hill-and-dip curve with a walker that stops in the first dip) for "walking downhill in fog"
   (S5–S6). Part 1 uses a headline and two `tags` instead.
3. **A "proposal only" detail move**: play the ghost and the Δ, then stop before the dice, so a card can ask "what is the
   chance?" before the bar shows it. Because the detail move always plays delta → dice → verdict, the Part 2 card asks
   about the **colder** move 13 (T 1.4) rather than move 1 (section 6 planned "chance at T = 3, Δ = 3?"; move 1 now
   answers that on screen).
4. **An overlap / density view**: count of cells sharing a spot, or the checker's 2 × 2 bin overflow (starter 2, 60-move
   best 2, 300-move best 4, all on one point 5), with a claim key. Part 5 S26 says "the cells sit on top of each other"
   with only the zoom and a `stamp`.
5. **Thumbs of an arbitrary placement** (`{ positions: {...} }`), e.g. all six cells on one point (HPWL 0). Today `thumbs`
   take `{ run, move }` only; the learner try covers it by dragging.
6. **Seed claims `count` and `rank`** (200 seeds; seed 42 is the 3rd worst). Today only `beat.count` (197) backs "one of
   the worst".
7. **A claim that two runs share their first k moves** (`seed42_300` = `seed42_60` for moves 1–60). The move-60 claim on
   `seed42_300` (hpwl 49.6) is a partial check.
8. **A counter with two decimals** (or `decimals` on `counter`). Not needed now: the narration was changed to 27.8 and 27.9.

## Deviations from the plan in UPGRADE_NOTES §6

- Part 2's card: "chance at T = 1.4" instead of "chance at T = 3" (Wish 3). The plan's question is still asked in spirit
  (the chance of a +3 move); move 1 shows 37 % with its dice.
- Part 4's "spread" moved to the start of Part 5, because it **is** the answer to Part 4's card ("is 49.6 typical?").
  Part 4 keeps seeds 199, 162 and 42.
- No walkthrough block (`<!-- algorithm-walkthrough -->`) in the new transcript: no frames are made for this lab, and the
  old `assets/steps/*.png` (left untouched) carry stale text ("Best ≠ last iterate"). The teacher list says so.
