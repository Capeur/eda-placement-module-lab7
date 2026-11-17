# UPGRADE_NOTES — Lab 07, simulated annealing placement

Stage 1 (audit) done on 2026-11-12. Later stages: read this file first, do not re-explore the repo.

## 0. Decisions already taken for this lab (later stages follow these)

1. **No classic video on the site.** No slides video, no video parts, no subtitles files, no speed buttons for video.
   The only media are **animated JavaScript lessons, one per part, in one player with all parts**.
   Voices: `en-US-AndrewMultilingualNeural` and `fr-FR-RemyMultilingualNeural`, both with `--rate=-4%`.
2. `transcript.md` stays in the teacher's format and must **lint clean**. Stage 3 writes a **lesson plan per part**
   instead of figures. The module's existing slides, audio and video are **left untouched** and listed for the
   teacher (section 8).
3. English and French, high-school level, script in parts with hooks and "Pause and guess".
4. The player offers **subtitles in another language than the voice (EN, FR, Chinese)**. So EN and FR must keep
   **exactly the same sentences per slide** (same count, same order, one idea each). Chinese is made from the EN
   sentence split. Stage 3 adds a sentence-count check EN = FR per slide; Stage 5 tests it.
5. The lesson engine gets a new **`placement` scene** that replays a move-by-move trace. So the Stage 2 checker must
   have a `--json` output with every move (format in section 6).

## 0b. Corrections from the user at the start of Stage 2 (approved: sections 3, 6, 7 with the recommended answers, except as below)

1. The **`placement` scene is NOT built in a Claude Code conversation.** The user's chat builds it right after Stage 2,
   from the checker's JSON (as for Lab 05). **"Stage 4b" is removed from the plan**; section 7 question 1 is answered
   this way and the "Engine and Stage 5" bullet in section 6 about a separate engine conversation no longer applies.
2. **Stage 5 copies the Lab 05 site repo** (`../eda-floorplanning-module-lab5`), not the Lab 03 one.
3. **`--freeze` states its rule:** the moving cell is picked **among the non-frozen cells only, in order A..F**
   (`floor(r * n_free)` over the free list). That rule gives 51.096 for `--freeze A,D`. It stays
   *exploration, not golden*.
4. The Stage 1 audit scripts are copied to `../tools/lab07-notes/` (section 7 question 8).

## 1. Inputs

| Input | Value |
|---|---|
| Course | `learn_placement` |
| Module dir | `courses/learn_placement/module02-07-sa-placement` |
| Tool dir | `platform/tools/sa-placement` (`index.html`, `sa-placement.js`) |
| Lab number | **Lab 07** (crumb in `platform/courses/learn_placement/labs/sa-placement/index.html`, read by the audit script) |
| Teacher clone | `/home/capeur/Documents/3A/SJTU/VLSI_Mort/test2/eda-learning-lab7-pl` — on `main`, HEAD `003bcd4 update eda.md`, sparse checkout, no branch, **clean** at the end of Stage 1 |
| Site repo | `../eda-placement-module-lab7` — **does not exist yet** (Stage 5) |
| Tools folder | `../tools/lab07-*` — does not exist yet |

The folder was not on disk when Stage 1 started; it was unpacked from `~/Downloads/eda-learning-lab7-pl.zip`
(464 entries, no absolute or `..` paths). Only this notes file was added to the clone.

## 2. What the module holds today (thin teacher content)

- `transcript.md`: 13 slides, 625 words (~4 min), generic boilerplate on slides 10–13 (browser track, implement track,
  pitfalls, "your turn"). Lint: **10 problems** (8 CUT bullets on slides 2, 3, 11, 12, 13; 2 "/" read as "or" on
  slides 7 and 9 — `exp(−Δ/T)`, `accept/reject`).
- `EXAMPLES.md`: 130 words, one pseudocode block, 2 GOLDEN lines, placeholder text ("Change one knob", "Scale the
  instance slightly", "Note tying the run").
- `quiz.json`: 4 items, 3 of them generic (q1 "primary algorithm is…", q3 "report coordinates plus HPWL", q4 "Track A
  asks you to implement…"); none uses a number of this lab.
- `CHECKLIST.md`, `README.md`: generic. README points to `./scripts/module.sh 02-07 --check`, which **does not exist**
  (`courses/learn_placement/scripts/` holds only `build_all_media.sh`, `capture_all_walkthroughs.sh`,
  `enrich_transcripts.py`, `scaffold_course.py`).
- `examples/tiny_place.json` (same instance as `common/tiny_place.json` and `placement-core.js`).
- **No golden checker script.**
- Media (teacher-owned, untouched): see section 8.
- Browser lab `sa-placement.js`: 150 lines, 10 challenges (Intro 3, Practice 4, Stretch 3), one extra button **Apply SA**
  (seed 42, 60 moves), no reveal button.

## 3. Golden cross-check table (everything below was run, not computed by hand)

Run with node on `platform/assets/placement-core.js` (`saPlace`, `totalHpwl`, `GOLDENS`), with
`common/solvers.py` (`sa_place`), and with an instrumented copy of the loop that was first proven equal to the real
`saPlace` over **seeds 1–200** (0 mismatches) and equal to `sa_place` (exact equality of best, final, accepted,
rejected, best positions and history, seeds 1–200).

### 3a. Goldens as stated in the repo

| Golden | Stated in | Run result | Verdict |
|---|---|---|---|
| Starter HPWL 52 | transcript, `sa-placement.js`, STEPS.md, `placementutil.STARTER_HPWL`, `GOLDENS.starterHpwl` | `totalHpwl(NETS, STARTER) = 52` | OK |
| Best HPWL ≈ 49.6 (seed 42, 60 moves) | transcript (slides 1, 4, 5, 7, 8, 9), EXAMPLES, STEPS, `GOLDENS.saHpwlAfter`, `SA_HPWL_AFTER` | **49.575497396755964**, `round1` = 49.6 | OK as rounded; true value is 49.575. Challenge `best-49-6` tests `near(round1(best), 49.6, 0.05)` |
| Accepted 44 / rejected 16 | EXAMPLES ("≈44", "≈16"), STEPS, `GOLDENS`, challenges | JS **44 / 16**, Python **44 / 16** | OK, but they are **exact integers**, not "≈" |
| T0 ≈ 3, cool ≈ 0.94 | STEPS.md | T0 = 3 exactly, cool = 0.94 exactly, applied **per move**; T after 60 moves = 0.0732 | OK, remove "≈" |
| 60 = 44 + 16 | challenge `moves-60` | true | OK (redundant with the two count challenges) |
| History every 10 moves | challenge `history` | 7 snapshots (move 0, then after moves 10…60); stores **current** HPWL and T **after** cooling | OK |
| Force-directed 18.7 | `above-force` challenge, STEPS | `forceDirectedPlace` = 18.683 → 18.7 | OK |
| Golden compact placement 14 | `tiny_place.json`, `placementutil.GOLDEN_HPWL` | 14 exactly; it is a hand-made placement, **not** an SA result and **not a floor** (see 4e) | OK, wording needs care |
| `python3 common/test_solvers.py` | README of `common/` | prints `ok goldens … SA~49.6` | passes, but it only checks `round1(best)`; it does not check 44/16 or JS = Python |

### 3b. The seven claims you asked me to confirm or correct

| # | Claim | Result | How the lesson should handle it (no shared file edited) |
|---|---|---|---|
| 1 | Of the 44 accepted moves, 11 improve, 9 worsen, 24 change nothing | **CONFIRMED exactly.** Δ<0: 11, Δ>0: 9, Δ=0: 24 (no tiny non-zero Δ: 0). The 16 rejected are all Δ>0. All 60 proposals: 11 better, 25 worse, 24 equal. | Teach "**accepted is not progress**": 44 accepted, only 11 got better, 24 were free moves (the cell moved but no net bbox changed). Name them "free moves" in the lesson. Challenges/quiz must not treat "44" as "44 improvements". |
| 1b | 10 moves hit the −1..9 limit | **CONFIRMED.** 10 proposals are clamped (5 accepted, 5 rejected): moves 1, 2, 4, 13, 50 (D, B at +9 wall; accepted) and 20, 22, 27, 37, 60 (B, A; rejected). | The clamp is an unwritten rule in EXAMPLES; write it ("cells stay inside −1…9"). In the scene, draw the walls and show a cell stopping at one (move 1: D x 9.17 → 9). Trace has a `clamped` flag. |
| 2 | Best (49.575) is reached at move 45; final equals best; the run does not show "best, not final" | **CONFIRMED.** New best only at move 45 (1-based; zero-based index 44); moves 46–60 never beat it; final = best = 49.575497…; peak current HPWL during the run is 58.58 (history: 52 → 57.3 → 56.6 → 56.9 → 53.4 → 49.6 → 49.6). STEPS.md bullet "Best ≠ last iterate" is **false for seed 42**, and "final temperature" in transcript/slides/STEPS is the wrong word (temperature is not reported; it means final placement). | Do **not** teach best-vs-final with seed 42. Use the checker with another seed: **seed 199** (best 52.000 = start, never improved; final **53.871**, worse than the start; 37 acc / 23 rej) is the dramatic case; **seed 162** (best 27.753 at move 59, final 27.887) is a good run where the last move spoils it. 9 of 200 seeds have final > best. Say plainly: "in the seed-42 run they happen to be the same". |
| 3 | The annealer moves A and D although `tiny_place.json` lists them as fixed pads (17 accepted moves on them) | **CONFIRMED.** 20 proposals on A/D, **17 accepted** (A 4, D 13). A ends at (0, 1.99), D at (5.76, 9), starting from (0,0) and (8,8). Neither `saPlace` nor `sa_place` has a `fixed` argument; "fixed pads" only matters for quadratic/analytical. Without moving A and D the same seed gives **51.096** (45 acc / 15 rej). | Pitfall slide 12 ("ignoring fixed pads A and D") is wrong for this lab: say "in this lab **every cell moves, even the pads**; freezing pads is another lab's rule". Keep the golden as is. Checker may offer `--freeze A,D` as a clearly marked *exploration, not golden* (51.096). |
| 4 | There is no overlap rule: 300 moves give about 2.61, all cells on one point gives 0 | **CONFIRMED.** 300 moves, seed 42: **2.6119** (104 acc / 196 rej); 1000 moves: 2.381; all six cells at (4,4): **HPWL 0**; the course's own `OVERLAP_PLACEMENT` (three cells stacked): 24. SA best of seed 42 has the same 2×2 bin overflow (2) as the starter. | Last part of the lesson: "HPWL alone loves piling cells up". Replay the 300-move trace; it ends far below the "golden 14", which proves 14 is no floor. Hand off to the next module (density bins). Keep 60 moves as the golden. |
| 5 | Over seeds 1–200 the best HPWL goes from 13.73 to 52.00 | **CONFIRMED.** min **13.7292** (seed 134), max **52.0000** (seed 199). Also: median 36.04; **197 of 200 seeds beat seed 42**; only seeds 62 (49.94) and 199 (52.00) are worse; seed 134 beats the "golden" 14; five best: 134 (13.73), 114 (15.06), 75 (15.55), 84 (20.17), 60 (20.69). | **Seed 42 is almost the worst run.** The transcript line "on this instance expect about forty-nine point six" and the STEPS bullet "Modest SA gain on this tiny netlist" teach a wrong lesson. Keep 42 as *the* reproducible story, then show the spread: "one seed = one story, so judge a random method by many runs". Checker golden row: min/max/median over seeds 1–200. |
| 6 | Pseudocode says "ΔHPWL<0" but the code accepts "<= 0" | **CONFIRMED, and it is not cosmetic.** Code: `d <= 0 or rand() < exp(-d/T)`. EXAMPLES/transcript/slides.md say `<0`; STEPS.md says `Δ ≤ 0` (agrees with code). The code draws **no random number when Δ ≤ 0**: 60 moves use 240 + 25 = **265 draws** (4 per move + 1 per worsening). Literal reading "Δ<0 else draw" (Δ=0 draws a number) gives **best 35.393**, 46 acc / 14 rej. Drawing the dice on every move gives **35.774**, 41 / 19. No-clamp gives 42.413 (39 / 21). Integer step 1 gives 39.000 (34 / 26). Cooling before the test gives the same 49.575 here (so that order is not checked by the golden). | Write the exact rule in EXAMPLES (Stage 2): "if Δ ≤ 0 accept **without** drawing; otherwise draw u and accept if u < e^(−Δ/T)". Lesson says "not worse? accept, no dice needed". The checker prints the 265-draw count so a port that drifts is caught. |
| 7 | Python `sa_place` and JS `saPlace` give the same trace move by move | **CONFIRMED.** PRNG: Python `_mulberry32_js` = JS `mulberry32` for 500 draws on 11 seeds (0, 1, 2, 42, 134, 199, 1000, 123456789, 2³²−1, 2³²+7, −5). Results seeds 1–200: exact equality. Trace seed 42: **60 moves × 15 fields, 0 differences** (floats bit-identical, max |ΔΔHPWL| = 0.0); 265 draws on both sides. Edge cases: a non-integer seed (3.7) raises `TypeError` in Python and is truncated in JS; cell **order** matters in Python (reversed cell list → 40.786, 39 / 21) while JS always uses its global `CELLS` A…F; reversed nets or positions give the same 49.575. | `--vs-node` check in the Stage 2 checker; rule "cells in order A…F" written down; seeds are integers; do not use seed 0 or 1 in examples (their 2nd draw is 0.000 / 0.003, so the first axis is always x). **No warm-up draws**: adding them would change the 49.575 golden. |

### 3c. Other goldens/claims found while cross-checking

| Claim | Where | Run result | Handling |
|---|---|---|---|
| "Force still wins pure WL here" | STEPS step 3 | true at 60 moves (18.7 < 49.6), false at 300 moves (2.61 < 18.7) | Say "at 60 moves"; the collapse is the point of part 5 |
| "not a force-style collapse" | transcript slides 1, 9 | at 300 moves SA collapses too (2.61) | Reword in the new script |
| Timing weights "change the objective" | transcript slide 12 | SA minimises **unweighted** HPWL (52, not the timing 116); `net_weights` unused in both languages | Say once: this lab counts every net with weight 1 |
| Challenge `before-52`, `above-force` | `sa-placement.js` | by reading the code: both are true on the untouched starter (52 === 52; 52 > 18.7), so they pass **on page load** (Stage 4 must confirm in Playwright) | Rewrite in Stage 4 |
| Pressing **Apply SA** twice | `sa-placement.js` | 2nd run starts from the first run's best: best **20.324**, 41 / 19. `best-49-6`, `accepted-44`, `rejected-16` then stay on the first run's stats until Reset (they test `lastSa`, not what was built) | Stage 4: SA always starts from the starter, or the challenges check the start |

## 4. Hidden problems (summary)

a. **Seed 42 is an outlier** (3rd worst of 200), yet the whole text says "expect 49.6".
b. **`<0` vs `≤ 0` and the 265-draw rule** are unwritten; a faithful-looking port gives 35.4–42.4.
c. **Unwritten rules**: which cell (uniform over all six, by list order A–F, `floor(r·6)`), which axis (`r < 0.5` → x),
   which direction (`r < 0.5` → −), step size (`1.0 × (0.5 + r)`, so 0.5–1.5, not integer: cells leave the grid),
   clamp −1…9, T0 = 3, cool 0.94 **per move**, best updated only when `cur < best` strictly and only after an accepted
   move, report best positions (not final), HPWL unweighted.
d. **"accepted/rejected ≈ 44/16"** are exact; "keep best… not only the final temperature" is the wrong word;
   "fixed pads A and D" is wrong for this annealer; "best ≠ last iterate" is false for the golden seed.
e. **14 is not a floor**: seed 134 gives 13.73 and 300 moves give 2.61.
f. Generic boilerplate slides (10–13) and generic quiz items; placeholder text in EXAMPLES.
g. Challenge weaknesses (Stage 4): two pass on load, five pass by pressing the preset button, `history` and
   `moves-60` are trivial, `pos-updated` compares 3 coordinates only, `lastSa` survives manual edits.

## 5. What `common/` lacks (do not edit it; work around in the module)

- No **per-move trace** (`sa_place` returns only best, final, counts, 7 history points).
- No `fixed` argument for `sa_place` (force/quadratic have one) and no overlap/legality helper (`density_bins`
  counts overflow only).
- No **checker with accepted/rejected goldens**, no Python = JS comparison, no multi-seed statistics.
- `test_solvers.py` only asserts `round1(best) ≈ 49.6`; constants are rounded (`SA_HPWL_AFTER = 49.6`).
- `sa_place` takes the cell list as a parameter (order changes the run) while the JS has a global; docstring says
  "port" without saying so. `step`, `t0`, `cool` defaults are not documented anywhere else.
- `solvers.py` and `placementutil.py` use **CRLF** line endings (a rewrite would show as a whole-file diff).
- `from placementutil import …` needs `common/` on `sys.path` (the checker must add it itself).

## 6. Plan for Stages 2–5 (and the new engine work)

### Concepts to teach (4, one per part; part 5 is the exit)
1. **Accept the bad sometimes** (Metropolis): not worse → accept, worse → roll the dice with probability e^(−Δ/T).
   Numbers: Δ = 3, T = 3 → p = 0.37.
2. **Temperature = how brave**: T 3 → 0.07 over 60 moves (0.94 per move); the run first climbs to 58.6 then falls.
   Accepted is not progress: 44 = 11 better + 9 worse + 24 free.
3. **Keep the best, and one seed is one story**: best vs final (seed 199, 162), spread over seeds (13.7–52.0, median 36),
   same stream in Python and JS.
4. **What the cost does not know**: no overlap rule → 300 moves reach 2.61, one point reaches 0; pads move here;
   hand-off to density bins.

### Stage 2 (small model): content and goldens
- `examples/sa_place_check.py` with the exact rules of 4c, golden tables (seed 42/60: best 49.5755, final = best,
  44/16, 11/9/24, 10 clamps, best at move 45, 17 on A/D, 265 draws; seed 199: best 52.0, final 53.871, 37/23; seed 162:
  best 27.753 at move 59, final 27.887, 41/19; 300 moves: 2.6119, 104/196; seeds 1–200 min 13.7292 (134), max 52.0
  (199), median 36.04), `--show`, `--impl my.py`, a reversed-cell-order check (documents 40.786, i.e. order is part of
  the spec), `--vs-node` (calls node on `platform/assets/placement-core.js`; helper `.mjs` goes in `examples/`) and a
  deliberately wrong `--impl` that gives FAIL (e.g. strict `<0`, 35.393).
- Own 12-line mulberry32 in the checker (do not import the private `_mulberry32_js`), **no warm-up**.
- `--json` output (consumed by the `placement` scene): header `{seed, moves, t0, cool, step, start, best_positions,
  final_positions, accepted, rejected, draws}` and per move `{move (1-based), cell, axis, from, to, clamped, delta,
  dHpwl, T, p (accept probability, 1 if Δ ≤ 0), u (random draw, **null when none is drawn**), accepted, newBest,
  hpwl (current), best}`. `--seed`, `--moves` select the run. Files `examples/trace_seed42_60.json`,
  `trace_seed199_60.json`, `trace_seed42_300.json` are generated, then re-checked against node.
- `EXAMPLES.md`: pseudocode with `Δ ≤ 0`, clamp, draw rule, cell order, GOLDEN lines with exact numbers; remove
  placeholders. `quiz.json` 6–8 items with numbers (e.g. p = e^(−3/3); "how many of the 44 improved?" 11;
  "Δ = 0, accepted?" yes; "why is 2.61 not a good placement?"; "which run ended worse than the start?" seed 199).
  `CHECKLIST.md`, `README.md` (drop the missing `module.sh`), `assets/_demo.sh`.
- Done when: checker all PASS; wrong `--impl` FAIL; `--vs-node` PASS; `python3 common/test_solvers.py` still passes.

### Stage 3 (strong model): script in 5 parts, lesson plans (no figures)
- 5 parts of 1–2 min, hook + "Pause and guess" answered at the start of the next part, 1,100–1,300 spoken words total:
  P1 "Why not only walk downhill?" (guess: a move makes wires 3 longer — accept?) · P2 "One move, up close" (guess:
  chance at T = 3, Δ = 3?) · P3 "Hot to cold" (guess: will the last placement be the best?) · P4 "Best, not final" with
  seeds 199/162/42 and the spread (guess: is 49.6 typical?) · P5 "What the cost does not know" (300 moves, pads, recap).
- `transcript.md` in the teacher's format, lint clean (no "/" reading as "or", no cut bullets); FR with the same
  sentence count per slide; ZH sentence list for subtitles.
- **Lesson plan per part** (`LESSON_PLANS.md` or in the notes): beats, what the `placement` scene shows, which trace
  file/seed, which move numbers, the pause-and-guess screen, the click-to-try. The new scene replays a trace: 6 cells
  on a −1…9 floor with walls, net boxes, HPWL counter, thermometer for T, dice bar (u against p), stamp
  accepted/rejected/free, current and best curves.
- No slides/audio/video rebuild, no `enrich_transcripts.py`.

### Stage 4 (strong model): browser lab
- Split `sa-placement-lab-model.js` (pure) and `sa-placement.js`; 8–10 challenges that check what the learner **built**
  (not passing on load, not from Apply SA alone), SA always from the starter, edits cancel the SA stats, no shared-file
  edits (`interactive-placement-lab.js` is read-only for us). Tests: model vs checker, Playwright positive/negative.

### Engine and Stage 5
- **`placement` scene for the lesson engine** — NOT a Claude Code stage ("Stage 4b" removed): the user's chat builds it right
  after Stage 2 from the checker's JSON files (as for Lab 05). Stage 4 and Stage 5 only use the finished scene.
- Stage 5: copy the **Lab 05** site repo (`../eda-floorplanning-module-lab5`), not Lab 03, but **remove** the video parts, speed buttons and slides-video; add the one-player
  lesson page with all parts, EN/FR voices, subtitles EN/FR/ZH; keep both site tests, adapt them.

## 7. Open questions (recommended answer first)

1. **Where is the `placement` scene built?** ANSWERED (see 0b): in the user's own chat, right after Stage 2, from the checker's JSON. (Original recommendation: a new "Stage 4b" conversation (strong model) with the
   `lesson-animator` skill, after Stage 4 and before Stage 5, because the site needs the lessons. The alternative
   (Stage 7, after the site) would leave the site empty.)
2. **Which seed shows "best, not final"?** Recommended: keep 42 as the main story and use **199** (dramatic: best =
   start, final worse than start) in part 4, **162** as the mild case. Alternative: only 162 (less scary, more typical).
3. **How hard to say "seed 42 is unlucky"?** Recommended: say it in part 4 with the numbers (197 of 200 seeds do
   better) and keep 42 because the goldens and the browser lab are built on it. Alternative: ignore it (wrong lesson).
4. **Offer `--freeze A,D` in the checker?** Recommended: yes, marked *exploration, not golden* (51.096, 45 / 15).
   Alternative: say nothing about it.
5. **Name for the Δ = 0 moves?** Recommended: "free move" in the lesson; the checker JSON keeps `dHpwl = 0`.
6. **Chinese subtitles**: recommended: Claude writes them from the EN sentence list in Stage 5, same split, and the
   user (or a native reader) checks them. Alternative: leave ZH to the teacher.
7. **Rewrite EXAMPLES.md pseudocode** from `<0` to `≤ 0` + draw rule (it lives in the module, so it is allowed)?
   Recommended: yes, and put the discrepancy on the teacher list because STEPS.md/PNG frames still carry old text.
8. **Keep the audit scripts?** They are in the scratchpad
   (`/tmp/claude-1000/-home-capeur-Documents-3A-SJTU-VLSI-Mort-test2/6a1771e0-4914-4c5f-be89-e55ec173a06c/scratchpad/`:
   `trace_js.mjs`, `trace_py.py`, `prng_js.mjs`, `variants.mjs`, `misc_py.py`) and will vanish. Recommended: copy them
   to `../tools/lab07-notes/` at the start of Stage 2 (rule 8); I did not do it now because you said not to touch
   anything else.
9. **Does Stage 3 count the existing 13-slide structure?** Recommended: no, 5 parts replace slides 1–13; the old
   deck stays as is and goes stale on purpose (section 8).

## 8. Existing media left untouched (list for the teacher)

`slides.pptx` (280 KB), `slides.pdf` (240 KB), `slides.md`, `outline.yaml`, `build.log`, `video.mp4` (3.9 MB),
`audio/` (13 `slide_NNN.mp3`, `full.mp3`, `slide_timings.json` with 14 entries), `frames/` (14 `slide-NN.png`,
`silent.mp4`, `concat.txt`), `assets/steps/01…05 *.png` and `assets/STEPS.md`. After Stage 3 they no longer match
`transcript.md`. The PNG frames and STEPS.md carry: "Best ≠ last iterate", "Modest SA gain", "final temperature",
`<0` in the pseudocode image if any (not viewed), and the 13/14 clip-vs-page count mismatch. The teacher can rebuild
them with `scripts/build_all_media.sh` if wanted.

## 9. Findings for the teacher (shared-file or other-owner problems)

- `EXAMPLES.md`/transcript/`slides.md` say `ΔHPWL<0`; code and STEPS.md say `≤ 0`; behaviour depends on it (35.4 vs 49.6).
- `placement-core.js` comment "Defaults tuned so seed=42 improves the starter instance" hides that seed 42 is
  among the three worst of seeds 1–200; GOLDENS table says "≈49.6 (best)" with no note that final equals best here.
- `saPlace` uses the global `CELLS`; `sa_place` uses the list it is given (order changes the result).
- Neither SA function can freeze the pads that `tiny_place.json` calls fixed; none logs moves.
- `common/test_solvers.py` does not test accepted/rejected or JS = Python; constants are rounded values.
- `solvers.py`, `placementutil.py` use CRLF endings.
- `README.md` points to a missing `./scripts/module.sh`.
- `courses/learn_placement/scripts/enrich_transcripts.py` exists: **not run**.
- Challenges `before-52` and `above-force` pass on page load; `pos-updated` compares 3 coordinates.

## 10. Commands that verify Stage 1

```bash
cd /home/capeur/Documents/3A/SJTU/VLSI_Mort/test2/eda-learning-lab7-pl
python3 ~/.claude/skills/lab-upgrade/scripts/audit_lab.py . learn_placement module02-07-sa-placement sa-placement
python3 ~/.claude/skills/lab-upgrade/scripts/lint_transcript.py courses/learn_placement/module02-07-sa-placement/transcript.md
( cd courses/learn_placement/common && PYTHONDONTWRITEBYTECODE=1 python3 -B test_solvers.py )
SP=/tmp/claude-1000/-home-capeur-Documents-3A-SJTU-VLSI-Mort-test2/6a1771e0-4914-4c5f-be89-e55ec173a06c/scratchpad
node $SP/trace_js.mjs $SP && python3 -B $SP/trace_py.py $SP    # needs js_prng.json from prng_js.mjs, and js_*.json from trace_js.mjs
git status --short                                              # empty (only this file is new, ignored or listed)
```

## 11. Stage 2 (content and goldens) — done 2026-11-12

Approved at the start: sections 3, 6 and 7 with the recommended answers, plus the corrections in section 0b (written first).

### What was done
- Audit scripts copied from the old scratchpad (it still existed) to `../tools/lab07-notes/`: `trace_js.mjs`, `trace_py.py`,
  `prng_js.mjs`, `variants.mjs`, `misc_py.py`, `probe.mjs`. They hard-code the absolute clone path and the old scratchpad
  inputs (`js_prng.json` ...), so they are a record, not a tool. Also there: `ok_impl.py` (a correct learner-style
  implementation, written independently of the checker, used to prove `--impl` passes a right answer) and `make_wrong.py`
  (writes `examples/wrong/*.py` = `ok_impl.py` with one rule broken).
- `examples/sa_place_check.py` (the checker), `examples/sa_node.mjs` (helper of `--vs-node`, read-only import of
  `platform/assets/placement-core.js`; it holds a move-by-move copy of the loop, proven equal to the real `saPlace`
  on 204 runs each time it runs).
- Generated by `--write-examples`: `examples/trace_seed42_60.json`, `trace_seed199_60.json`, `trace_seed162_60.json`,
  `trace_seed42_300.json`, `seeds_1_200.json`. `examples/wrong/{strict_less,draw_every_move,no_clamp}.py`.
- `EXAMPLES.md`, `quiz.json` (8 items), `CHECKLIST.md`, `README.md`, `assets/_demo.sh` rewritten.
- Untouched: slides, outline, audio, video, frames, `assets/steps`, `assets/STEPS.md`, `transcript.md`. Nothing outside the
  module changed.

### The checker (rules, flags, API)
- Rules are in its docstring (also printed by `--show`): own `mulberry32`, **no warm-up**; 4 draws per move (cell
  `floor(r1*n)`, axis `r2<0.5`→x, sign `r3<0.5`→−, size `step*(0.5+r4)`); clamp both coordinates of the cell to −1…9;
  `Δ ≤ 0` accepted with no draw, else `u = 5th draw`, accept if `u < exp(−Δ/T)`; best updated only if `cur < best`
  strictly; cool after the test, every move; result = best positions.
- Flags: `--show`, `--impl FILE` (`mulberry32`, `total_hpwl`, `sa_place`, SKIP when missing), `--vs-node`, `--json`,
  `--seed`, `--moves`, `--freeze A,D` (moving cell picked among the non-frozen cells only, in order A..F:
  `free[floor(r1*n_free)]`; exploration, not golden: 51.0964, 45/15), `--write-examples`.
- Default run: **46 PASS, 0 FAIL, 0 SKIP**. Includes reversed cell order (40.7859, 39/21: order is part of the spec), reversed
  nets and reversed positions dict (same run), equality with `common/solvers.py` `sa_place` on seeds 1–200, and
  "the committed example files are exactly what the checker prints".
- `--vs-node`: **13 PASS**: instrumented copy = real `saPlace` (204 runs), `totalHpwl` and `densityBins` equal, seeds 1–200
  bit-identical (best, positions, move of the best, final, final positions, accepted, rejected, draws), the four traces
  equal move by move (16 fields; `p` within 1e-12 because V8 and libm `exp` can differ in the last bit), and each file on
  disk equals what node prints.
- JSON header (snake_case): `module, seed, moves, t0, cool, step, frozen, cells, nets, walls{min,max}, hpwl_start,
  net_hpwl_start[per net], start, best, best_move (null if never beat the start), final, best_positions, final_positions,
  accepted, rejected, draws, accepted_by_kind, proposed_by_kind, clamped, peak, history`. Per move, in **`moves_list`**
  (the key `moves` is the count): `move, cell, axis, from{x,y}, to{x,y}, proposed, clamped, delta (signed jog), dHpwl, T
  (before cooling), p, u (null when no draw), accepted, newBest, hpwl, best, kind (better|worse|free)`.
  `seeds_1_200.json`: `seeds: [{seed, best, best_move, final, accepted, rejected}]`.

### Wrong implementations (proof that `--impl` fails)
`python3 examples/sa_place_check.py --impl examples/wrong/strict_less.py` -> `FAIL seed 42, 60 moves ... got best 35.3928,
46 accepted, 14 rejected` (11 FAIL, exit 1). `draw_every_move.py` -> 35.7737, 41/19; `no_clamp.py` -> 42.4127, 39/21.
`ok_impl.py` (tools folder) -> 17 PASS, 0 FAIL. A file with only `total_hpwl` -> 1 PASS, 2 SKIP.

### Numbers confirmed (all printed by the checker, none by hand)
Same as section 3: seed 42/60 best 49.575497, move 45, final = best, 44/16, 11/9/24 accepted (11/25/24 proposed), 10 clamps
(5 accepted), 20 pad proposals (17 accepted), 265 draws, peak 58.5768, T_end 0.0732; seed 199: 52.0 (never), final 53.8714,
37/23, 270 draws, peak 60.4621; seed 162: 27.7525 at move 59, final 27.8871, 41/19; 300 moves: 2.6119 (move 278), 104/196,
1405 draws; 1000 moves 2.3814, 107/893; seeds 1–200 min 13.7292 (134), max 52.0 (199), median 36.0428 (true median of the
200 values; the Stage 1 note 36.04 used sorted[99]), 197 beat seed 42, 9 seeds with final > best
(6, 13, 54, 102, 118, 149, 156, 162, 199). New in Stage 2: 2x2 bin overflow (capacity 1): starter 2, SA 42/60 best 2, golden 2,
overlap 3, one point 5, **SA 300-move best 4**; pitfalls: strict 35.3928 (282 draws), draw-early 35.7737 (300 draws),
no clamp 42.4127 (266), integer step 39.0 (208), cool-first = same run (not detected), cells F..A 40.7859.
`python3 common/test_solvers.py` still passes.

### Decisions
- `delta`/`dHpwl` naming in the JSON: `delta` is the signed jog size, `dHpwl` is the cost change Δ (the Stage 1 field names).
- Extra per-move fields beyond section 6: `proposed` (coordinate before the clamp) and `kind`. Extra header fields: `best`,
  `best_move`, `final`, `peak`, `frozen`, `*_by_kind`, `clamped`, `history`.
- The quiz keeps the teacher's keys (`id`, `title`, `items`) and adds `passing_score: 0.67` (the platform default).
- `EXAMPLES.md` replaces `ΔHPWL<0` by `Δ ≤ 0` + the draw rule (teacher list, section 9, already says STEPS.md/frames are stale).
- The old media still say "best ≠ last iterate", "final temperature", "fixed pads A and D" and `<0`: left untouched on purpose.

### Verify Stage 2
```bash
cd /home/capeur/Documents/3A/SJTU/VLSI_Mort/test2/eda-learning-lab7-pl/courses/learn_placement/module02-07-sa-placement
python3 -B examples/sa_place_check.py                 # 46 PASS
python3 -B examples/sa_place_check.py --vs-node       # 13 PASS (needs node)
python3 -B examples/sa_place_check.py --impl examples/wrong/strict_less.py   # FAIL, exit 1
python3 -B examples/sa_place_check.py --impl ../../../../tools/lab07-notes/ok_impl.py   # 17 PASS
bash assets/_demo.sh                                  # the same with --show
( cd ../common && PYTHONDONTWRITEBYTECODE=1 python3 -B test_solvers.py )
```

### Open questions for the next stages
1. The `placement` scene is built in the user's chat from `trace_seed42_60.json` etc.; Stage 3 needs to know when it is
   ready (lesson plans must name only the scene features that exist).
2. Stage 3: the part-4 hook "is 49.6 typical?" can quote the checker table directly (seed 134: 13.7292, seed 199: 52.0).
3. Untracked `__pycache__` folders under `.cursor/skills/module-slides/scripts/` exist since Stage 1; they are not from this
   stage's edits and were left alone (rule: nothing outside the module).

## 12. Status after Stage 2

Stage 2 done. Next: the user's chat builds the `placement` scene from the checker's JSON; then Stage 3 (script in parts and
lesson plans). (The scene now exists: lesson-animator `examples/lab07-placement-demo/`, used by Stage 3.)

## 13. Stage 3 (script in parts and lesson plans) — done 2026-11-12

No figures, step figures, walkthrough frames, outline, slides, PDF, audio or video (section 0). `slides.*`, `outline.yaml`,
`audio/`, `video.mp4`, `frames/`, `assets/steps/`, `assets/STEPS.md` untouched; they are now stale against `transcript.md`
(section 8).

### What was done
- `transcript.md` rewritten: teacher's format (title, module id, lab, tracks, `## Slide N — Title` + prose), **29 slides,
  5 parts, 1,126 spoken words** (lint), **lint: 0 problems**, every sentence ≤ 89 characters, ≤ 6 sentences per slide, no
  slash, no title starting with "Next", numbers in words. Each part opens with a hook that answers the previous card and
  ends with "Pause and guess". One idea per sentence (sentences with two ideas were split; checked with lessonlib below).
- `../tools/lab07-notes/LESSON_PLANS.md`: one plan per part for the lesson-animator `placement` scene (runs, detail moves
  with their delta / dice / verdict words, fast replays, show windows, headlines, claims, cards, learner try), an idea map
  for the repetition rule, **Wishes for the engine** (8), deviations from section 6. Only features from the storyboard
  reference and the lab07 demo are named. 107 anchor words checked against the sentence split (0 missing).
- `../tools/lab07-notes/stage3_facts.py`: checks every number the narration says against the checker's traces and seed
  file: **55 PASS**.
- No new trace was needed: parts use `trace_seed42_60`, `trace_seed199_60`, `trace_seed162_60`, `trace_seed42_300`,
  `seeds_1_200` (all from Stage 2, all proven equal to node).

### Part boundaries (transcript slides = lesson parts; there is no PDF in this lab)

| Part | Title | Slides | Sentences | Words | Card |
|---|---|---|---|---|---|
| 1 | Why not only walk downhill? | 1–6 | 28 | 257 | first move +3: keep it? |
| 2 | One move, up close | 7–12 | 28 | 241 | same +3 at T 1.4: chance bigger, smaller, same? |
| 3 | Hot to cold | 13–18 | 22 | 183 | are the last wires the shortest? |
| 4 | Best, not final | 19–23 | 22 | 187 | is 49.6 typical? |
| 5 | What the cost does not know | 24–29 | 28 | 269 | how could the cost stop piling up? (own answer) |
| | **Total** | 29 | 128 | **1,137** | |

(Counts updated in Stage 4 after the two review fixes on S9 and S11; Stage 3 had Part 2 = 26 sentences / 230 words,
total 126 / 1,126.)

At the demo's pace (about 0.45 s per word with pauses) parts run about 1.4 to 2.0 minutes.

### Numbers said (all from the checker; `stage3_facts.py` checks each)
Start 52 (nets 8, 8, 8, 8, 16, 4); move 1: D, right, wall, +3, T 3, chance 37 %, dice 0.17, accepted; move 2: free (D at the
wall, Δ 0, no dice); chance at T 3: 72 / 37 / 14 % for 1 / 3 / 6 longer; move 13: D, wall, +3, T 1.4, 12 %, dice 0.09,
accepted, HPWL 58.6 = peak; T ends 0.07; best 49.6 at move 45; move 60: A, wall, +3, T < 0.1, chance 0, rejected;
44 / 16 = 11 better + 9 worse + 24 free; seed 42 final = best; seed 199: above 60, never below 52, ends 53.9, returns the
start; seed 162: 27.8 at move 59, last move worse but accepted, ends 27.9; 200 seeds: 13.7 to 52, median 36, 197 beat
seed 42 (3rd worst); 300 moves: first 60 identical to the 60-move run, best 2.6. Learner tries: F onto E → 48; all six on
one point → 0.

### Decisions
- **Section 6 plan kept**, with two changes (both in LESSON_PLANS.md "Deviations"): Part 2's card asks about the colder
  move 13 (T 1.4), because the scene plays delta, dice and verdict of one move together, so move 1 shows its own 37 %;
  the 200-seed spread opens Part 5, because it answers Part 4's card.
- "27.75" is said "twenty-seven point eight": the scene's counters show one decimal (27.75 → 27.8, final 27.9).
- `pads` (dark border) only in Part 5, where pads are explained; `bestpos` never on seed 42 (its best and final
  **positions** differ through free moves 47–59 on A, C, D, although the wirelengths are equal).
- The new transcript has **no `<!-- algorithm-walkthrough -->` block** (no frames for this lab; the old frames stay).
- The script never claims that "only downhill" gets stuck **on this chip**: after move 60 T < 0.07, so the 300-move descent
  to 2.6 is almost pure downhill. S5 states the general idea ("may"). Worth knowing if a learner asks.
- Next lab named on the last card: `module03-01-density-bins` "Density bins and overflow" (`courses/learn_placement/docs/MODULES.md`).

### Lessonlib sentence lists (one idea per sentence)
```bash
cd /home/capeur/Documents/3A/SJTU/VLSI_Mort/test2/eda-learning-lab7-pl/courses/learn_placement/module02-07-sa-placement
for r in 1-6 7-12 13-18 19-23 24-29; do
  PYTHONDONTWRITEBYTECODE=1 python3 -B ~/.claude/skills/lesson-animator/scripts/lessonlib.py transcript.md $r --repo ../../..
done
```
`--repo` must point at the clone root (`../../..` from the module) so lessonlib imports the teacher's own speech cleaner;
`--repo .` from the module silently uses the fallback copy (same output here).

### Verify Stage 3
```bash
cd /home/capeur/Documents/3A/SJTU/VLSI_Mort/test2/eda-learning-lab7-pl/courses/learn_placement/module02-07-sa-placement
PYTHONDONTWRITEBYTECODE=1 python3 -B ~/.claude/skills/lab-upgrade/scripts/lint_transcript.py transcript.md   # 0 problems, 1137 words (was 1126 before Stage 4)
python3 -B ../../../../tools/lab07-notes/stage3_facts.py                    # 55 PASS
python3 -B examples/sa_place_check.py && python3 -B examples/sa_place_check.py --vs-node   # 46 PASS, 13 PASS
```

### For the next stages
- **Stage 4 (browser lab)** must make S29 true: "run seed forty-two with sixty moves → 49.6, 44 accepted, 16 rejected",
  and allow dragging cells. The quiz and challenges should use "free move" and "accepted ≠ better" as the script does.
- **Stage 5**: French sentence for sentence (126 sentences; per slide counts are in the lessonlib lists), Chinese from the
  EN split; the EN = FR sentence-count check per slide (section 0, item 4). Beware French splits: lessonlib splits after
  `. ! ?` followed by a capital, so "Pause et devinez : …" keeps the colon, and a French "?" with a space before stays one
  sentence.
- **Stage 5b**: build each part from LESSON_PLANS.md; Part 1 first. The card replies there are drafts.
- Teacher list (add in Stage 6): `transcript.md` replaced (29 slides), so the deck, audio, video, frames and STEPS.md are
  stale; the walkthrough block was removed; do not run `enrich_transcripts.py` or `capture_all_walkthroughs.sh` on it.

## 14. Status after Stage 3

Stage 3 done. Next: Stage 4 (browser lab).

## 15. Stage 4 (review fixes + browser lab) — done 2026-11-13

No screenshot recapture, no deck, no slides build (lessons-only lab, section 0). Nothing outside the module and
`platform/tools/sa-placement/` changed in the clone; `interactive-placement-lab.js`, `placement-core.js`,
`placement-ui.js` and `clustering-ui.js` are only imported. Outside the clone: `../tools/lab07-notes/` (below).

### 15a. Transcript fixes asked by the Stage 3 review
- S9: "This dice gives a number smaller than one." added just before "The dice shows zero point one seven."
- S11: "The second thing is the temperature, which starts at three." became "The second thing is a number called the
  temperature. It starts at three."
- Lint: **0 problems, 1,137 words** (~7.6 min at 150 wpm). `stage3_facts.py`: **55 PASS** (all PASS).
- Counts now: **29 slides, 128 sentences, 1,137 words**; Part 2 = 28 sentences / 241 words (section 13 table updated).
  S11 now has 7 sentences, the only slide above 6 (fine for the lint; worth knowing for the French split).
- Anchors: new `../tools/lab07-notes/check_anchors.py` (lessonlib's own `find_anchor_sentence`, the old transcript kept in
  the scratchpad for `--old`): **108 anchor uses, 0 missing** (110 after this stage's note in Part 2 quotes two of them again). Only two changed sentence: `temperature` (S11) in the
  `thermo` show and the `eq` headline. Both still start on the sentence that names the temperature (the new first half),
  which is what they meant, so no anchor word had to move. The S9 sentence falls inside the `dice` window that opens at
  `chance` (S9). `LESSON_PLANS.md` updated: header counts (128 / 1,137), Part 2 row (28 / 241), a note under Part 2, the
  re-check command, and a **colour convention** (F, see 15e).

### 15b. The lab: files
`platform/tools/sa-placement/`:
- `sa-placement-lab-model.js` (new, pure, 417 lines): `runSA(seed, moves)` = the checker's rules move by move (same log
  fields as the trace JSON), and on every run a call to `placement-core.js` `saPlace` whose result must be equal
  (`sameAsSaPlace`); `seedTable`, `median`, `netBoxes`, `closestPair`, `stacks`; learner state and actions (`doRun`,
  `doPreset`, `setView`, `moveCell`/`nudge`/`putAt`, `doReset`, `showTally`, `saveCount`, `saveLucky`); `CHALLENGES` and
  `checkChallenge(id, state)`; messages and Check reasons are codes.
- `sa-placement-strings.js` (new): every word the lab shows (`T`), one literal per line, for the French copy in Stage 5.
- `sa-placement.js` (rewritten, UI): the shared `createChallengeLab` chrome (read-only import of `clustering-ui.js`, as in
  Lab 05); the shared canvas is hidden and replaced by our SVG chip (walls −1…9, chip outline 0…8, one dashed box per net,
  cells in the checker's colours, "AB ×2" tag on stacked cells), an SVG chart (current wirelength, best so far, start
  line, best dot) and the move log (#, cell, push with "(wall)", wires Δ, temperature, chance or "no dice", dice, verdict,
  "★ new best"; filter all / accepted / rejected; first 1000 rows). Right panel: cell buttons, arrows (half a square),
  "Put it at x, y", nets table (width + height per net), total, closest pair, where the placement came from, the run's
  numbers, the hidden tally, the count inputs, the lucky-move input, the last message and the Check reason.
- `index.html`: new lead sentence and local `<style>`; one-column panels, two columns inside (chip | chart + log).
- `tests/model_dump.mjs`, `tests/test_model_vs_checker.py`, `tests/test_lab_playwright.py` (new).

Hand moves snap to half squares and stay inside the walls (−1…9); drag, click-then-click, arrows and typed x, y all go
through `moveCell`. The old `interactive-placement-lab.js` is no longer used (its "Reveal golden", 1-square snap and
−0.5…8.5 view would hide the walls).

### 15c. Rules of the lab (what fixes the weak spots of 4g)
| Weak spot (4g / 3c) | Now |
|---|---|
| `before-52`, `above-force` pass on load | gone; every challenge needs a hand edit, a run with other settings, or a saved answer: **0 of 9 pass on load** |
| five pass by pressing Apply SA | the preset is kept (`#sa-preset`, seed 42 / 60 moves) and gives the script's numbers, but **0 of 9 pass from it alone** (nor with the final view and the study tally) |
| `history`, `moves-60` trivial | replaced by the chart, the log and the count challenge |
| `pos-updated` compared 3 coordinates | a run's numbers count only while the workspace shows that run's best or final placement exactly (all 6 cells, x and y) |
| `lastSa` survived manual edits; 2nd Apply SA started from the 1st result (20.32) | **the annealer always starts from the starter**; any hand move sets `run = null` (message "cancelled"), clears a saved count and lucky move; the hand challenges refuse a placement that started from a run (`origin`) until Reset |

### 15d. Challenges (Check recomputes from the learner's state)
| Id | Level | Passes when | Answers (checked against the checker) |
|---|---|---|---|
| `by-hand` | Intro | built by hand from the starter, total < 49.5755 (seed 42's best) | F onto E = 48 (the lesson's learner try) |
| `below-median` | Intro | current run with 60 moves, best < 36 | 99 of seeds 1–200 (true median 36.0428) |
| `pile-up` | Intro | by hand, total = 0 | A–D on one point, E and F on one point |
| `count-accepted` | Practice | **(changed in Stage 5, see 17a)** current run **seed 162 / 60 moves**, saved count 16 / 5 / 20 for this run, saved before any study tally since Start | the log rows (`sa-acc sa-better` …) give exactly 16 / 5 / 20 (41 accepted); seed 42's tally 11 / 9 / 24 is shown as the worked example and does not pass |
| `lucky-dice` | Practice | saved move of the current run is accepted, worse, chance < 20 % | any run; seed 42: moves 13 (12 %) and 23 (18 %); 103 of seeds 1–200 have one |
| `best-vs-final` | Practice | current run with final > best | 9 seeds of 1–200 (6, 13, 54, 102, 118, 149, 156, 162, 199); not 42 |
| `more-moves` | Practice | current run with seed 42, best < 14 | 173 moves or more (172 moves: 17.52; 173: 13.95); 300 moves = 2.6119, B and D 0.105 apart |
| `ends-worse` | Stretch | current run with final > 52 | seed 199 is the only one of 1–200 (60 moves): final 53.8714, returns 52; **hint (Stage 5): "the seed is between 150 and 200"** |
| `short-spread` | Stretch | by hand, total ≤ 16 and every pair ≥ 1 apart | the course's golden placement: 14, closest 1.414 |

The tally of a run stays hidden (a sentence says "accepted is not the same as better") until the learner's own count is right or the
study button "Show the tally (study)" is pressed; a count saved after the study tally never passes until Start. **Since Stage 5
(17a) the tally of seed 42 / 60 moves, the lesson's run, is always visible (the worked example); the run to count is seed 162.**
Lesson ideas covered: dice and chance (log, lucky-dice), free moves (log, count),
accepted ≠ better (count), best vs final (view toggle, best-vs-final, ends-worse), one seed one story (below-median),
more moves and piling up (more-moves, pile-up, short-spread), and slide 29's numbers (preset, typed run, intro note).

### 15e. Decisions
- Cell colours = the checker's `COLORS` (A `#1d4ed8`, B `#0f6b5c`, C `#b45309`, D `#7c3aed`, E `#be123c`, **F `#475569`**).
  The lesson engine's default palette would give F `#0e7490`: Stage 5b storyboards must set
  `"placement": {"colors": {"F": "#475569"}}` (written in `LESSON_PLANS.md` conventions).
- The preset button keeps its old name ("Apply SA preset (seed 42, 60 moves)") and simply fills seed 42 / 60 and runs;
  typing the same numbers gives the same run (tested).
- Thresholds are round numbers taken from the checker's tables: 36 (below the true median 36.0428, so "below the middle"
  is honest), 20 %, 14, 16 with gap 1. `by-hand` uses the exact 49.5755, not 49.6.
- Numbers shown: one decimal like the lesson (49.6), plus "exactly 49.5755" in the run block; net rows two decimals that
  add up as printed.
- `count-accepted` is tied to seed 42 / 60 (the lesson's run); `lucky-dice` accepts any run.

### 15f. Tests
- `test_model_vs_checker.py`: **162 PASS, 0 FAIL** (~3 s). The four trace runs move by move against the files on disk and
  against `run_sa` (16 fields, `p` within 1e-12), headers, tallies, positions, lucky answers; seeds 1–200 = `seeds_1_200.json`
  = `seeds_table`; every model run = `saPlace`; extra runs (42 with 172 / 173 / 1000 moves, 134, 1, 43); `GOLD_RUNS` and
  `GOLD_FACTS`; slide 29 (49.6, 44, 16); 11/9/24; best at 45; median; 99 below 36; the 9 best-vs-final seeds; only 199 ends
  above 52; 173 moves; 2.6119; hand totals 52 / 48 / 14 / 0; **95 model scenarios** (9 positive + 4 common negatives per
  challenge: page load, preset alone, preset + final view + study tally, Reset; then wrong answers, edit after the
  solution, a run of the right seed with the wrong moves, a count saved for another run, a lucky move of another run,
  solution built on a run …) and a forged state (positions of the run kept, run cancelled); every Check, message and
  challenge code has its words.
  Mutation proof (model edited, test run, model restored, `cmp` identical): `<` instead of `<=` → 64 FAIL; edits keep the
  run → 1 FAIL; position guard removed and edits keep the run → 4 FAIL; study tally ignored → 1 FAIL; a run counted as hand
  work → 2 FAIL; a second run ignored → 1 FAIL. Removing only the position guard is not caught: the edit already cancels
  the run (two guards; the edit rule is the one the learner sees).
- `test_lab_playwright.py`: **97 ok, 0 FAIL** (~25 s; run twice): 9 positive (with the real controls: `by-hand` by mouse
  drag of F onto E; `count-accepted` counts the log's rows; `lucky-dice` reads the chance column), **55 negative** (per
  challenge: page load, preset alone, preset + final view + study tally, Reset, a wrong answer, edit after the solution or
  the solution built on a run, and "study tally, then count"); page: 9 challenges, Check disabled before Start, no curve or
  log on load, 9 / 9 cleared; script: preset = 49.6 / 44 / 16 (and 49.5755), 60 log rows with 44 accepted, the log counts
  11 / 9 / 24, tally hidden then shown, chart parts, typed 42/60 = preset, a run after hand edits and a second run both give
  49.6 / 44 / 16 (start from the starter), an edit removes the run's numbers, seed 162 best view 27.8 vs final view 27.9, seed
  199 52.0 / 53.9, 300 moves 2.6119; hand: drag gives F (4, 4) and 48, click-then-click puts B at (5, 4); colours: 6 cells by
  attribute and pixel on the starter and after the preset; shared canvas hidden; no console error, no failed request.
  Also checked once by hand (scratchpad script, not kept): at 390 px wide the page has no sideways scroll.

### Verify Stage 4
```bash
cd /home/capeur/Documents/3A/SJTU/VLSI_Mort/test2/eda-learning-lab7-pl
export PYTHONDONTWRITEBYTECODE=1
M=courses/learn_placement/module02-07-sa-placement
python3 -B ~/.claude/skills/lab-upgrade/scripts/lint_transcript.py $M/transcript.md            # Problems: 0, 1137 words
( cd $M && python3 -B ../../../../tools/lab07-notes/stage3_facts.py )                           # all PASS (55)
python3 -B ../tools/lab07-notes/check_anchors.py                                                # 110 anchors, 0 missing
python3 -B platform/tools/sa-placement/tests/test_model_vs_checker.py                           # 162 PASS, 0 FAIL (needs node)
~/eda-venv/bin/python -B platform/tools/sa-placement/tests/test_lab_playwright.py               # 97 ok, 0 FAIL (serves platform/ itself)
( cd $M && python3 -B examples/sa_place_check.py | tail -1 && python3 -B examples/sa_place_check.py --vs-node | tail -1 )
git status --short                                                                              # only $M and platform/tools/sa-placement
# by hand: python3 -m http.server 8080 --directory platform  ->  http://127.0.0.1:8080/tools/sa-placement/index.html
```

### Module files touched in Stage 4
`transcript.md` (S9, S11), `CHECKLIST.md` (Track B = the 9 real challenges), `README.md` (Track B step 3),
`EXAMPLES.md` (one cell: "the lab's history" → `saPlace` `history`), this file.

### For Stage 5
- `lab_strings.py` for this lab: `LAB = "tools/sa-placement/"`; entries for `index.html` (lang, title, skip link,
  eyebrow, h1, lead), every literal of `sa-placement-strings.js`, and Lab 03/05's shared-chrome block for
  `assets/clustering-ui.js`. Panel headings are overwritten by `T.panelLeft/panelRight`. `T.logCols` and `T.netCols` are
  arrays and `T.why`/`T.msg` hold functions with template literals: translate inside the backticks only. The units `%`
  and the decimal point are in `fmt` (French would want "37 %" already; decimal comma optional).
- Both tests use ids and classes only, so they run on the French copy: `test_lab_playwright.py --url
  http://127.0.0.1:8090/fr/tools/sa-placement/index.html` (one case reads "49.6", "27.8", "52.0", "2.6119" from the text:
  if French uses a decimal comma, adapt those four reads).
- `build_site.py` must copy `sa-placement-lab-model.js` and `sa-placement-strings.js`, without `tests/`.
- The site's `test_lab_site.py` from the Lab 05 template must be rewritten for this lab (its clicks are Lab 05's).

### Teacher list (add in Stage 6)
- `interactive-placement-lab.js` (shared): "Reveal golden" button, 1-square snap and a −0.5…8.5 view that hides the
  annealer's walls; `onAfterChange` is not called by "Reveal golden" or "Hide golden", so a lab cannot cancel its own
  state on those. No longer used by `sa-placement`.
- `createChallengeLab` (shared) names the panels "Graph" / "Reference / metrics" for every lab, and its ResizeObserver
  redraws the workspace when the page height changes, which replaces the SVG (a drag in progress at that moment is lost;
  the test waits for a stable layout).
- The engine's default placement palette (F `#0e7490`) differs from the checker's `COLORS` (F `#475569`).

### Open questions
1. ~~`count-accepted` asks for three numbers that the lesson says aloud (11, 9, 24)~~ **Answered by the user after the Stage 4
   review: count seed 162 (16 / 5 / 20); seed 42's tally stays visible as the worked example. Done in Stage 5 (17a).**
2. ~~`ends-worse` has one answer among seeds 1–200 (199, which the lesson names).~~ **Answered after the review: keep; the hint now
   says the seed is between 150 and 200 (Stage 5, 17a).**

## 16. Status after Stage 4

Stage 4 done (section 15), then reopened in Stage 5 for two small changes (17a).

## 17. Stage 5 (lessons-only site, EN + FR + ZH subtitles) — done 2026-11-13

No media built (lessons-only lab). Nothing committed or pushed anywhere. In the clone, only the module and
`platform/tools/sa-placement/` changed (`git status`); the site is the new repo `../eda-placement-module-lab7`.

### 17a. Two changes to the Stage 4 lab (decided after its review)
- **`count-accepted` ("Accepted is not better")**: the learner counts **seed 162 / 60 moves** (41 accepted = **16 better, 5 worse,
  20 free**), not seed 42, because the lesson says seed 42's numbers aloud. **Seed 42's tally (11 / 9 / 24) is visible as the worked
  example** (`tallyVisible` is true for seed 42 / 60 moves) and never passes this challenge (check code `need-162-60`, was
  `need-42-60`). Seed 162's tally stays hidden until the learner's count is right or the study button is pressed. New exported constant
  `COUNT_RUN = {seed: 162, moves: 60}` in the model. Prompt, check text and hint changed in the strings.
- **`ends-worse` ("Worse than the start")**: hint = "Run seeds with 60 moves. The seed is between 150 and 200." (answer unchanged: 199).
- Files: `sa-placement-lab-model.js`, `sa-placement-strings.js`, `tests/model_dump.mjs`, `tests/test_model_vs_checker.py`,
  `tests/test_lab_playwright.py`, `CHECKLIST.md` (Track B).
- Tests: `test_model_vs_checker.py` **166 PASS, 0 FAIL** (was 162; the count-accepted scenarios are now 13: seed 162 positive x3,
  and negatives for the wrong total, the 41-better "accepted = better", 16/5/19, study tally first, edit, edit + rerun, count on
  another seed, 61 moves, **the lesson's seed 42 with its own numbers 11/9/24**, seed 42 with 16/5/20, no run; plus facts: seed 162
  tally = checker `GOLD_FACTS`, the run to count, the hint's 150..200). Mutation: `COUNT_RUN` seed set to 42 -> 5 FAIL (restored,
  `cmp` identical). `test_lab_playwright.py` **100 ok, 0 FAIL** (was 97): seed 162 solved with the log's rows, 56 negatives (new:
  "the lesson's run (seed 42), its own tally"), seed 42's tally visible with 11 + 9 + 24, seed 162's log counts 16 / 5 / 20 with the tally
  hidden then revealed. Run six times in a row, then eight more, all 100 ok; **one earlier run had 2 FAIL that I did not capture and could not
  reproduce** (see 17h).

### 17b. The site repo `../eda-placement-module-lab7` (fresh `git init -b main`, nothing committed)
Made from `../eda-floorplanning-module-lab5` (rsync without `.git`, `docs`, `.cache`, `build`, `lessons`, `i18n/fr/module*`,
`tools/lab05-figures`, `WHAT_CHANGED.md`, `make_fr_media.py`, `walkthrough-steps.json`, `__pycache__`).
- **Removed** (as the template section lists): video parts and `PARTS` page ranges, the part cutting and its cache, `video.mp4`,
  `subs.vtt` / `.srt` / `part-N.vtt`, the speed buttons and `player.js` (key `lab05-speed`), `make_fr_media.py`, slide deck and PDF
  links and downloads, slides section, walkthrough section, figures and frames, the zoom, the frame-vs-deck check, and every video /
  subtitle / deck / frame check of `tools/test_site.py`.
- **Changed**: `build_site.py` (rewritten, 336 lines: constants for course `learn_placement`, module `module02-07-sa-placement`, tool
  `sa-placement`, `STRINGS_JS = sa-placement-strings.js`; `PARTS` = transcript slide ranges `(1,6) (7,12) (13,18) (19,23) (24,29)`;
  runs `tools/check_sentences.py` first; keeps `docs/lessons` and `docs/fr/lessons` across a rebuild), `site_src/index.html.tmpl`,
  `site_src/page.css`, `i18n/strings.py` (Lab 07, "Simulated annealing placement", course "Placement for EDA", lesson text, 8 example
  files, part titles), `i18n/fr/lab_strings.py`, `tools/strings_shape.mjs` (also compares `fmt`), `.gitignore`, `README.md`.
- **Added**: the lesson player section (`id="lessons"`, nav link, an `<iframe class="lesson-player" src="lessons/index.html"
  allow="autoplay">` sized by the player's `height` messages, from the skill's snippet), **built only when `docs/lessons/index.html`
  exists** (per language); `i18n/fr/` files; `i18n/zh/module02-07-sa-placement/transcript.md`; `tools/check_sentences.py`;
  `tools/capture_lab.py` + `site_src/img/lab-en.png`, `lab-fr.png` (the lab's preset run; the page needs a screenshot and the old one
  was not recaptured); `lessons/README.md`; `ai-workflow/` refreshed (the two skills as they are now, notes copy, short README and
  HOWTO; the Lab 05 timeline and notes were removed because they described another lab).
- **Storage keys `lab07-*`**: no key is left in the page (no video speed). They are set in Stage 5b: `--storage-key lab07-lesson-speed`
  (parts) and `lab07-lessons` (players), written in `README.md` and `lessons/README.md`.
- Page sections: lessons (when built), lab (with the screenshot), implement (Track A: example files + EXAMPLES), quiz, transcript.
  The lab's own header links "Lab 07 home" / "Animated lessons" (`../../index.html#lessons`) / language switch.

### 17c. French, Chinese, and the sentence check
- `i18n/fr/module02-07-sa-placement/transcript.md`: **29 slides, 128 sentences, the same count as English in every slide**, numbers in
  words ("zéro virgule dix-sept", "cent quatre-vingt-dix-neuf"), titles translated. Vocabulary: placement, recuit simulé, cellule,
  réseau, longueur de fil par demi-périmètre, mouvement accepté / refusé, **mouvement neutre** (free move), chance, dé, température,
  graine, mur, plots, "exécution" for "run". Every "Pause and guess" is "Faites une pause et devinez :" (one sentence with the
  question, like Lab 05). 1,258 words (French is longer; ~8.4 min at 150 wpm).
- `i18n/zh/module02-07-sa-placement/transcript.md`: first line = a blockquote saying (EN + ZH) that it is subtitles only and **must be
  checked by a native reader**; 128 sentences, same split; numbers in digits (it is read, not voiced); terms 模拟退火, 单元, 线网, 半周长线长,
  骰子, 温度, 种子, 空移动 (free move), 焊盘 (pads). Machine translation, not reviewed by a native reader.
- `tools/check_sentences.py`: EN (from the clone), FR, ZH: same slide numbers 1..29 and the same sentences per slide with
  `lessonlib.slide_sentences` (teacher's speech cleaner passed as `--repo`); finds lessonlib via `--lessonlib`, `$LESSON_ANIMATOR`,
  `~/.claude/skills/...`, then `ai-workflow/`. **Clean: EN 128, FR 128, ZH 128; per slide 4 5 5 4 5 5 2 5 6 4 7 4 4 5 4 3 5 1 6 4 5 5 2 6 3 5 3 6 5.**
  Proved to fail on a removed sentence and on a renumbered slide (scratch copies). `build_site.py` and `tools/test_site.py` run it.
- Per part (draft timing, no voice): 28 / 28 / 22 / 22 / 28 sentences EN = FR = ZH; `subs_build.py` lines the ZH file up with the EN
  timing in all five parts. Draft lengths (silent, estimated): EN 79 to 107 s, FR 90 to 132 s per part.
- `../tools/lab07-notes/stage5_numbers.py <clone> <site>`: all 63 numbers of the ZH file (digits) are found in words in the EN and FR
  slide, and neither has a digit: **0 problems**.
- French lint (`lint_transcript.py --scripts ...`): 6 "CUT" notes, all about sentences over ~90 characters that a slide bullet would cut.
  There is no deck in this lab, so they do not matter; no slash, no "Next" title.
- French lab: `i18n/fr/sa-placement-strings.js` (full copy, same keys and arities, also `fmt`; shape check "same shape"),
  `i18n/fr/lab_strings.py` (page + shared chrome). **The French lab keeps the decimal point** (49.6, 0.17), like the lessons' numbers on
  screen and the checker; the four number reads of the browser test therefore run unchanged on `/fr/`.
- `i18n/fr/EXAMPLES.md` (same 232 lines; code blocks byte-identical; every number identical, checked with a script), `i18n/fr/quiz.json`
  (8 items; every number, answer index and choice count identical).

### 17d. Tests of the site (served with `serve.py docs 8090`; restart it after each build, `docs/` is recreated)
- `tools/test_site.py` (rewritten): **71 checks, 0 failed** without lessons (en 31, fr 31, static 9): page, images, fonts, 29 transcript
  sections, no video/slides/walkthrough elements, downloads (transcript, quiz, 8 example files, no `examples/wrong`), the Track A guide in
  the page language, quiz right 8/8 and wrong 0/8, switch keeps `#hash`, lab opens in the same language with no English left, 9
  challenges, lab switch and header link, **the lesson section is absent (nav, iframe, `lessons/`) while `lessons/index.html` is missing**,
  static: no `tests/`, model + strings files, French strings = `i18n/fr` file, no video / `.vtt` / `.srt` / PDF / PPTX / `parts` / `steps`
  in docs, the sentence check, no external reference.
- **Player and lesson-page checks** (only once `docs/[fr/]lessons/index.html` exists; parts not built are skipped and counted): the iframe,
  nav link and section appear; the frame is sized by the player; the player lists the built parts with titles (= `part_titles`) and lengths;
  link to the other voice; back link in the top window; `#part-N` opens part N; the language link carries `#part-N`; `ended` on `#lesson-audio`
  shows the countdown naming the next part, marks the part done and loads the next; per part page: no console error / outside request,
  `window.__lesson.errors` empty, `placement.dataDiffer` = 0 and `seedsDiffer` = 0, the subtitles menu offers the other language and 中文,
  the "Sounds" button, audio answers 200. **Validated on a scratch site** (two demo parts built from the skill's placement demo with draft
  timing, `--subs fr` and `--subs zh`, players built with `--titles`): 58 checks per language, all ok except one that was my demo's own wrong
  `--back` for French (the test is right). The scratch site is outside the repo.
- `tools/test_lab_site.py` (rewritten from the clone's `test_lab_playwright.py`, EN/FR `LANGS` table): **206 ok, 0 FAIL = 103 per language**
  (9 positive, 56 negative, the rest page / script / hand / colour, plus per language: html lang, PASS word and "Check:" line, progress,
  no English left in the French lab, no console error / failed request / HTTP error / outside request).

### Verify Stage 5
```bash
cd /home/capeur/Documents/3A/SJTU/VLSI_Mort/test2/eda-learning-lab7-pl && export PYTHONDONTWRITEBYTECODE=1
python3 -B platform/tools/sa-placement/tests/test_model_vs_checker.py | tail -1                  # 166 PASS, 0 FAIL
~/eda-venv/bin/python -B platform/tools/sa-placement/tests/test_lab_playwright.py | tail -1      # 100 ok, 0 FAIL
cd ../eda-placement-module-lab7
~/eda-venv/bin/python -B tools/check_sentences.py                                                # clean (128 / 128 / 128)
python3 -B ../tools/lab07-notes/stage5_numbers.py ../eda-learning-lab7-pl .                      # 0 problems
~/eda-venv/bin/python -B build_site.py --repo ../eda-learning-lab7-pl
python3 ~/.claude/skills/lesson-animator/scripts/serve.py docs 8090 &                            # kill it by pid afterwards
~/eda-venv/bin/python -B tools/test_site.py                                                      # 71 checks, 0 failed (no lessons yet)
~/eda-venv/bin/python -B tools/test_lab_site.py                                                  # [en] 103 ok  [fr] 103 ok
```

### For Stage 5b (one conversation per part)
- Sources go to `lessons/part-N/` of the site repo; slide ranges in `PARTS` (`build_site.py`): 1 = 1-6, 2 = 7-12, 3 = 13-18, 4 = 19-23, 5 = 24-29.
- Build commands per part (EN, FR, then both voices before the final build so each language gets the other as subtitles, plus ZH):
  `--storage-key lab07-lesson-speed`, `--fonts site_src/fonts`, `--subs fr=...` / `--subs en=...`, `--subs zh=build/lessons/part-N/subs-zh.json`
  (made with `subs_build.py --transcript i18n/zh/module02-07-sa-placement/transcript.md --slides A-B --lang zh --against build/lessons/part-N/timing-en.json`),
  `--data` = the trace files of the module's `examples/` that the part replays, storyboard `"placement": {"colors": {"F": "#475569"}}`.
- Players after the last part, **both with `--back ../index.html#lessons`** (the French player is in `docs/fr/lessons/`, so its page is also `../index.html`),
  `--next-url ../tools/sa-placement/index.html`, `--storage-key lab07-lessons`, `--titles` = the `part_titles` of `i18n/strings.py` (the test compares them).
- Then `build_site.py` (it puts the player on the page), restart `serve.py`, run both tests.
- The `placement` scene's `dataChecked` depends on the `--data` files a part gets: the test only requires `dataDiffer` = 0.

### 17h. Open questions and caveats
1. The Chinese transcript is unreviewed machine translation (first line says so). A native reader should check it before the subtitles are published.
2. French words chosen by me: *mouvement neutre* (free move), *exécution* (run), *plots* (pads), *chance* (chance). Say if the course prefers others.
3. The French lab shows decimal points (49.6). Switching to commas would need replacements in `sa-placement.js` (`toFixed` in the log) as well as the strings file.
4. One run of `test_lab_playwright.py` gave 98 ok / 2 FAIL and I did not save its output; sixteen later runs (six, then eight more) were all 100 ok.
   Stage 4 notes already mention the shared chrome's ResizeObserver redraw (a drag in progress is lost): the two failing rows may have been
   drag-related, but this is a guess.
5. The lab-page header link "Animated lessons" points to `../../index.html#lessons`, which does not exist on the page until the lessons are built.

## 18. Status

Stage 5 done. Next: Stage 5b (lesson Part 1 first), then Stage 6.
