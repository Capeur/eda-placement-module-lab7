# Lab 07 notes (SA placement)

Stage 1 audit scratch scripts, copied from the session scratchpad at the start of Stage 2. They hard-code the absolute
path of `eda-learning-lab7-pl` and read files (`js_prng.json`, `js_trace_42.json`, ...) that the scripts themselves wrote to
that old scratchpad, so treat them as a record. The checker that replaces them is
`courses/learn_placement/module02-07-sa-placement/examples/sa_place_check.py`.

- `trace_js.mjs`, `trace_py.py`, `prng_js.mjs`, `variants.mjs`, `misc_py.py`, `probe.mjs`: Stage 1 audit.
- `ok_impl.py`: a correct learner-style `mulberry32` / `total_hpwl` / `sa_place`, independent of the checker (17 PASS).
- `make_wrong.py <module>/examples/wrong`: writes the three wrong programs from `ok_impl.py`.

Stage 3 (2026-11-12):
- `LESSON_PLANS.md`: one lesson plan per part (5) for the lesson-animator `placement` scene, plus "Wishes for the engine".
- `stage3_facts.py [<module dir>]`: checks every number `transcript.md` says against the checker's traces (55 PASS).

Stage 4 (2026-11-13):
- `check_anchors.py [--old OLD_TRANSCRIPT]`: every anchor word of `LESSON_PLANS.md` (explicit `word (S8)`, storyboard ids
  like `returns2` / `four1`, and the `{…@word}` / "at `word`" anchors of the headline bullets) is found in its slide with
  lessonlib's own matching; with `--old` it lists anchors whose sentence text changed. 110 anchors (108 + 2 quoted in the Stage 4 note), 0 missing.
