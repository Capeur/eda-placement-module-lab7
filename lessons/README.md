# Lesson sources

One folder per part, `part-1/` to `part-5/`, each with `storyboard.json` (and a short `README.md`: inputs, voices, commands, check result).
They are written in Stage 5b from `../tools/lab07-notes/LESSON_PLANS.md` (one conversation per part) and built with the
`lesson-animator` skill into `docs/lessons/part-N` (English) and `docs/fr/lessons/part-N` (French). The five parts and their
slides: 1 = slides 1-6, 2 = 7-12, 3 = 13-18, 4 = 19-23, 5 = 24-29 of the transcript.

Storage keys: `--storage-key lab07-lesson-speed` for the parts, `lab07-lessons` for the players. Voice caches go to `.cache/voice`
and timings to `build/lessons/` (both ignored by git). Build the player of each language after the last part:
`build_player.py ... --back ../index.html#lessons --next-url ../tools/sa-placement/index.html` (see the skill's SKILL.md, step 7b).
