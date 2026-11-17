# eda skills: lab-upgrade v3.2 + lesson-animator v5.0.1 (2026-11-13, Lab 07)

## Install (replaces both; safe: nothing is removed if the unzip fails)
```bash
Z=$(ls -t ~/Downloads/eda-skills-v3.2b*.zip | head -1); echo "zip: $Z"
cd ~/Downloads && rm -rf eda50 && mkdir eda50 && unzip -q "$Z" -d eda50 \
  && rm -rf ~/.claude/skills/lab-upgrade ~/.claude/skills/lesson-animator \
  && cp -r eda50/lab-upgrade eda50/lesson-animator ~/.claude/skills/ \
  && grep -m1 "version" ~/.claude/skills/lab-upgrade/SKILL.md ~/.claude/skills/lesson-animator/SKILL.md
```
Expected: "version 3.2" and "version 5.0.1". Start new Claude Code conversations afterwards.

## What changed
- **lesson-animator v5.0 step 1**: new `placement` scene (Lab 07): chip floor, cells, net boxes, one move up close
  (ghost, change in wirelength, dice, verdict), fast replay, thermometer, tally, chart, spread over seeds, try-it
  panel (drag a cell, one move, a whole run, another seed). `build_lesson.py --data` takes several files (the
  checker's traces and the seeds file). Format in `reference/storyboard.md`, example in
  `examples/lab07-placement-demo/`. Scenes `graph` and `floorplan` are unchanged.
- **step 1b** (asked by the Stage 3 lesson plans): `"stop": "delta"` on a move, `piles`, `landscape` + `walker`,
  per-net / seed rank / same-moves claims, thumbnails of any placement, `decimals` on the counter.
- **lab-upgrade v3.2**: section 2b of SKILL.md and the second half of prompts.md describe a lessons-only lab (no
  classic video): Stage 3 writes lesson plans instead of figures, Stage 5 builds a site whose media is the lesson
  player and adds a Chinese transcript for subtitles, Stage 5b builds subtitles and the player; site-template.md
  lists what to remove from the Lab 05 site; PLAYBOOK.md has the Lab 07 story so far.
- **step 2**: `scripts/build_player.py` makes one player page for all parts (part list, next part by itself, a link
  per part, same part in the other language). How the site uses it: `reference/site-integration.md`, last section.
- **step 3**: subtitles menu (Off / voice language / other languages, Chinese included) with `build_lesson.py --subs`
  and `subs_build.py`; the language switch keeps the part and the sentence; `scripts/serve.py` for local previews.
- **step 4**: sounds made by the browser, like in a game (picture cues + hover, click, grab, drop, right answer);
  one "Sounds" button next to the subtitles menu. No music (tried, dropped).
