# Per-part prompts for the coding agent (paste one per session)

Start the agent in the repo root (`~/Documents/3A/SJTU/VLSI_Mort/test2/eda-placement-module-lab7`).
It reads `AGENTS.md` automatically. Then paste the prompt for the current part.

---

## Session prompt — Part 3 (slides 13-18)

Read AGENTS.md, then do Stage 5b for Part 3 ("Hot to cold", transcript slides 13-18,
22 sentences per language): write `lessons/part-3/storyboard.json` and `lessons/part-3/README.md`
from the "Part 3" section of `lab07-notes/LESSON_PLANS.md`, following `lessons/part-2/` as the
format example (copy its `strings`, `note` and `pausing` blocks verbatim). Initial state
`{ run: seed42_60, move: 12, side: 1 }`. Then run the draft timing check for EN and FR
(silent, no VPN) and fix everything it reports until 0 errors, 0 warnings. If the checker
calls move 13 rushed, pin `dice` to `shows` (S13) as the plan allows. Commit the storyboard
with a message like "Part 3 storyboard: Hot to cold (from LESSON_PLANS.md)". Do not build
voices yet. Report the draft output and the claim count.

## Session prompt — Part 4 (slides 19-23)

Read AGENTS.md, then do Stage 5b for Part 4 ("Best, not final", transcript slides 19-23,
22 sentences per language): write `lessons/part-4/storyboard.json` and `lessons/part-4/README.md`
from the "Part 4" section of `lab07-notes/LESSON_PLANS.md` (runs seed42_60, seed199_60,
seed162_60; chart `"best": true`; the detail move is seed 162's move 60; never show
`bestpos` on seed 42 in S19). Follow `lessons/part-2/` as the format example. Run the draft
timing check for EN and FR, fix until 0 errors, 0 warnings, commit
("Part 4 storyboard: Best, not final"). Do not build voices yet. Report the draft output.

## Session prompt — Part 5 (slides 24-29)

Read AGENTS.md, then do Stage 5b for Part 5 ("What the cost does not know", transcript
slides 24-29, 28 sentences per language): write `lessons/part-5/storyboard.json` and
`lessons/part-5/README.md` from the "Part 5" section of `lab07-notes/LESSON_PLANS.md`
(the only part with `pads: ["A","D"]`; uses `spread` from the seeds file, the 300-move
run, a camera shot at `look` and a self-answering final card). Follow `lessons/part-2/`
as the format example. Run the draft timing check for EN and FR, fix until 0 errors,
0 warnings, commit ("Part 5 storyboard: What the cost does not know"). Do not build
voices yet. Report the draft output.

---

## After all five storyboards pass the draft check (voices need the VPN)

Paste this when the user's VPN is up and they want the media built, one part at a time
(start with Part 1, then 2, 3, 4, 5):

Read AGENTS.md, then build Part 1's media: run the voice commands from
`lessons/part-1/README.md` (EN then FR), the ZH subtitles, the two lesson pages and
`check_lesson.py` exactly as written there. Use the repo's skill scripts
(`SK=eda-skills-v3.2b/lesson-animator`). Report every command's output; stop and ask
if a network step stalls for a minute. On success commit
`docs/lessons/part-1` and `docs/fr/lessons/part-1`. Then continue with the next part
the same way.

(Then Stage 6: players, site rebuild, both test suites, WHAT_CHANGED.md,
ai-workflow README, skill sync, as described in AGENTS.md. Paste the Stage 6 prompt
when the orchestrator confirms all five parts are built and checked.)
