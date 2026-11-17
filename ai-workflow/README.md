# How this lab was built with AI

Lab 07 (simulated annealing placement, placement course) was upgraded stage by stage with Claude Code (VS Code extension),
using the `lab-upgrade` skill, and the lessons are made with the `lesson-animator` skill. Every change was reviewed and run
by the student; nothing was pushed to the teacher's repository.

- `notes/UPGRADE_NOTES.md`: the stage-by-stage record (decisions, numbers, commands). Copied at the end of each stage.
- `skills/`: the two skills as they were when the site was built (see `skills/HOWTO.md`).
- What the site is: **lessons only** (no slide video): five animated lessons, EN / FR voices, EN / FR / ZH subtitles, the browser lab,
  Track A, a quiz. See `../README.md`.

Stage 6 (hand-off, 2026-11-17) completed this page. What was built: a **lessons-only** bilingual site — five
animated lessons with EN/FR voices and EN/FR/ZH subtitles (one player, all parts), the 9-challenge browser lab,
Track A (the checker and the example files), an 8-item quiz, the full transcript — plus this record.

Timeline:

- Stages 1–5 done 2026-11-12/13 under Claude Code, recorded in `notes/UPGRADE_NOTES.md` (sections 11–18).
- Stage 5b, 2026-11-17/18 under Mistral Vibe Code: storyboards one session per part (`6634a4b` part 1, `0981d6c`
  part 2 + setup, `48a798b` part 3, `d7077be` part 4, `dbf4ed8` part 5), each reviewed remotely against
  `lab07-notes/LESSON_PLANS.md` before the next part started; voices built by the student with the VPN up, one
  commit per part (`e1de176`, `25d0929`, `3278095`, `ce4a100`, `1f47b2b`).
- Stage 6 (2026-11-17): players both languages, site rebuilt, both test suites green (`5c93abe`), this hand-off,
  `ai-workflow/skills/` refreshed with `eda-skills-v3.2b/` (lab-upgrade v3.2 + lesson-animator v5.0.1).

The problems met (account ban mid-project, read-only GitHub connector, edge-tts stalls over the VPN,
`LD_LIBRARY_PATH` breaking `ffprobe`, Part 2's S11 overlay collisions, the README command blocks) and their fixes
are in `../WHAT_CHANGED.md`. Result: all tests green — `tools/check_sentences.py` clean (EN/FR/ZH 128 sentences),
`tools/test_site.py` 161 checks 0 failed, `tools/test_lab_site.py` 206 ok 0 FAIL, `check_lesson.py` 0 errors /
0 warnings on both pages of all five parts — and the Pages site is live
(`https://capeur.github.io/eda-placement-module-lab7/`, `/fr/`).
