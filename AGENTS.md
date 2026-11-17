# AGENTS.md — how to work in this repo (Lab 07, Stage 5b and Stage 6)

You are the coding agent for `eda-placement-module-lab7`: a bilingual (EN/FR) lessons-only
GitHub Pages site for Lab 07 (simulated annealing placement) of the eda-learning course.
The site is built; the remaining work is **Stage 5b** (five animated lessons) and
**Stage 6** (hand-off). A remote orchestrator (Mistral Vibe chat) reviews every step:
report outputs verbatim, never skip a check.

## Where everything is (all inside this repo)

| What | Path |
|---|---|
| Lesson plans, one section per part | `lab07-notes/LESSON_PLANS.md` (authoritative for storyboards) |
| Stage record, commands, expected numbers | `ai-workflow/notes/UPGRADE_NOTES.md` |
| Lesson engine skill (scripts + format reference + examples) | `eda-skills-v3.2b/lesson-animator/` |
| Storyboard format (read before writing any storyboard) | `eda-skills-v3.2b/lesson-animator/reference/storyboard.md` |
| Validated example storyboards | `lessons/part-1/`, `lessons/part-2/` |
| Transcripts | EN: teacher clone `../eda-learning-lab7-pl/courses/learn_placement/module02-07-sa-placement/transcript.md`; FR: `i18n/fr/module02-07-sa-placement/transcript.md`; ZH (subtitles only): `i18n/zh/module02-07-sa-placement/transcript.md` |
| Trace data (do not regenerate) | teacher clone `.../examples/trace_seed42_60.json`, `trace_seed199_60.json`, `trace_seed162_60.json`, `trace_seed42_300.json`, `seeds_1_200.json` |
| Build / tests | `build_site.py`, `tools/test_site.py`, `tools/test_lab_site.py`, `tools/check_sentences.py` |

Environment: use `~/eda-venv/bin/python` (call it `P`), `export PYTHONDONTWRITEBYTECODE=1`,
`SK` = this repo's `eda-skills-v3.2b/lesson-animator` (identical to `~/.claude/skills/lesson-animator`).

## Hard rules

1. **Never modify the teacher's clone** (`../eda-learning-lab7-pl`). Read from it only.
2. **Never edit or re-run the trace files or the checker**; every number in a storyboard
   comes from the plan (which got them from the checker) or from the checker's `--json`.
3. **One storyboard per part, both languages in it** (each anchor has `en` and `fr`;
   `word#1` = second occurrence). Anchors are searched only inside their slide.
4. **Follow `LESSON_PLANS.md` exactly** for timeline, show windows, headlines, claims,
   pauses, chapters and the card. If you must deviate, write it in the part's README
   under "Deviations from the plan", like parts 1 and 2 do.
5. **Copy verbatim from `lessons/part-1/storyboard.json`**: the `strings` block (all the
   French replacements and `plChance`), the `note` block, and the `pausing` values.
6. **Conventions**: `"placement": { "colors": { "F": "#475569" } }` in every storyboard;
   `pads` only in Part 5; chart `"best": false` in Part 3, `true` from Part 4; counters
   one decimal; the plan's `word (S8)` means the first word of slide 8 starting with `word`.
7. **Draft timing first** (`draft_timing.py`, silent, no VPN): 0 errors, 0 warnings before
   anything else. Voices (`voice_build.py`) need edge-tts over the VPN; if a network step
   stalls for a minute, stop, ask for a VPN switch, rerun (finished sentences are cached).
8. **Run the checker before showing anything** (`check_lesson.py`, 0 errors, 0 warnings)
   and look at the contact sheets of both languages.
9. Commit `lessons/*/storyboard.json` + `README.md` + `docs/lessons` + `docs/fr/lessons`;
   `build/` and `.cache/` stay ignored. Small commits, one per step.

## Per-part workflow (Stage 5b)

For each part N (3, 4, 5; parts 1-2 exist):

1. Read `LESSON_PLANS.md` → "Part N" section, the storyboard reference, and
   `lessons/part-1/` + `lessons/part-2/` as format examples.
2. Write `lessons/part-N/storyboard.json` and `lessons/part-N/README.md`
   (same structure as part-2's README: inputs, scenes, claims, card, strings, deviations,
   commands, check results). Slide ranges: part 3 = 13-18, part 4 = 19-23, part 5 = 24-29.
3. Draft timing, both languages, from the site repo:
   `$P $SK/scripts/draft_timing.py --transcript <EN or FR transcript> --slides A-B --lang en|fr \
   --storyboard lessons/part-N/storyboard.json --repo ../eda-learning-lab7-pl --out build/lessons/part-N/timing-en-draft.json`
   Fix everything the checker reports (missing anchors, rushed moves, text over nodes),
   rerun until 0 errors, 0 warnings. Write the result into the README.
4. Commit ("Part N storyboard"), push, and report the draft output to the orchestrator.
5. Voices (VPN up, user launches): `voice_build.py` EN + FR with the voices/rate from the
   README; then `subs_build.py` ZH against the EN timing; then `build_lesson.py` EN + FR
   (same flags as parts 1-2: `--storage-key lab07-lesson-speed --fonts site_src/fonts
   --data <all five example files> --subs ...`); then `check_lesson.py` on both pages.
6. Commit the built `docs/lessons/part-N/` + `docs/fr/lessons/part-N/`.

## After the last part (Stage 6)

1. Build both players (EN + FR): `build_player.py` with `--back ../index.html#lessons`,
   `--next-url ../tools/sa-placement/index.html`, `--storage-key lab07-lessons`,
   `--titles` = the `part_titles` of `i18n/strings.py`. From the skill's SKILL.md step 7b.
2. `build_site.py --repo ../eda-learning-lab7-pl`, restart `serve.py docs 8090`,
   run `tools/test_site.py` (now includes the player checks) and `tools/test_lab_site.py`.
3. Write `WHAT_CHANGED.md` (root) like Lab 05's, complete `ai-workflow/README.md`
   (timeline, problems, results), and replace `ai-workflow/skills/` with
   `eda-skills-v3.2b/` (lab-upgrade v3.2 + lesson-animator v5.0.1), updating its HOWTO.
4. Commit, push, check the GitHub Pages deploy.

## Known open items (do not silently change)

- The ZH transcript is machine translation; a native reader must check it before publishing.
- Part 2's S11 tags/equation positions (46,9) and (46,23) were chosen without the plan;
  the checker confirms them.
- If the checker calls Part 3's move 13 rushed, pin `dice` to `shows` (S13) instead of
  `twelve` (noted in the plan).
- Part 4: never show `bestpos` on seed 42 in S19; Part 5: the camera shot at `look` must
  cover both cell heaps, widen it if a cell is cut on the contact sheet.
