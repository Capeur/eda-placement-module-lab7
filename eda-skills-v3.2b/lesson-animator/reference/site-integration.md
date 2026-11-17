# Putting lessons next to the video parts (site repo built from eda-partitioning-module-lab3)

Decision (2026-10-27): the animated lesson **sits next to** the video parts; the course video stays as it is.

## Where things go
```
<site repo>/
  lessons/part-N/storyboard.json        # source (committed)
  lessons/part-N/README.md              # inputs, voices, commands, check result
  .cache/voice/                         # voice_build cache (already ignored: .cache/ is in .gitignore)
  build/lessons/                        # timing + audio made by voice_build or timing_from_vtt (add build/ to .gitignore)
  docs/lessons/part-N/index.html        # built English page + lesson-en.m4a + fonts/
  docs/fr/lessons/part-N/index.html     # built French page + lesson-fr.m4a + fonts/
```
Keep the built pages out of `build_site.py`'s cleanup (it may empty `docs/`): either build the lessons from
`build_site.py` (preferred, below) or rebuild them after every site build.

## build_site.py changes (lab-specific places stay the same)
1. After `build_parts(...)`, for each part N that has `lessons/part-N/storyboard.json` and its timing + audio in
   `build/lessons/`, call `build_lesson.py` (import its `main` or run it with `subprocess`) with
   `--out <out>/lessons/part-N --fonts site_src/fonts --storage-key labNN-lesson-speed`.
2. In `player_html`, give each part item a second link when its lesson exists:
   `<a class="lesson-link" href="lessons/part-N/">{t["lesson_link"]}</a>` (outside the `<button>`, so the button
   still loads the video).
3. `i18n/strings.py`: add `lesson_link` ("Interactive lesson" / "Leçon interactive") and a sentence in
   `parts_note` saying each part also exists as an interactive lesson.
4. The lesson page needs a way back: add to the storyboard `"lede"` a link to `../../index.html#video`
   (lede accepts HTML), in both languages.

## Tests to add (tools/test_site.py)
- each part with a storyboard has `lessons/part-N/index.html` and its audio, in EN and FR;
- the lesson link is in the part list and opens the page; the page has no external request (fonts self-hosted);
- `window.__lesson.errors` is empty on every lesson page; and run `check_lesson.py` on all of them (0 errors, 0 warnings).

## Pushing
Lesson audio is small (about 1.2 MB per part per language with pauses), much less than a video part.
Commit `lessons/*/storyboard.json`, `docs/lessons`, `docs/fr/lessons`; not `.cache/` or `build/`.

## Floorplan labs (Lab 05 and later)
- Keep the checker's JSON next to the lessons: `build/lessons/bstar-check.json` (made by
  `python3 <clone>/courses/<course>/<module>/examples/bstar_check.py --json`), and pass it to every
  `build_lesson.py` call with `--data`. When `build_site.py` builds the lessons, it runs the checker first.
- Test to add to `tools/test_site.py`: on each lesson page, `window.__lesson.floorplan.dataChecked` equals the number
  of checker scenes, and `window.__lesson.errors` is empty.
- Before the voices are chosen, `draft_timing.py` lets you build and check every part's lesson with silent audio;
  rebuild with `voice_build.py` once the voices are picked (the storyboards do not change).


## A site with lessons only (Lab 07 and later: no classic video)
The lessons are the media. After the parts are built, `scripts/build_player.py` writes `docs/lessons/index.html` and
`docs/fr/lessons/index.html` (see SKILL.md step 7b). The site page shows that player where the video used to be:
```html
<iframe class="lesson-player" src="lessons/index.html" title="Animated lesson" allow="autoplay" style="width:100%;border:0;min-height:700px"></iframe>
<script>
addEventListener("message", (e) => { const f = document.querySelector(".lesson-player");
  if (e.source === f.contentWindow && e.data && e.data.lessonPlayer && e.data.ev === "height") f.style.height = e.data.h + 16 + "px"; });
</script>
```
- The player tells the page its height, so there is no inner scrollbar. `--back` and `--next-url` links open in the
  top window. A link to one part: `lessons/index.html#part-3`.
- How it works: the player frames one part page at a time; the part page reports `ready`, `play`, `pause`, `ended` and
  its height to the player, and takes `play`, `pause`, `seek` from it (and from no other window).
- "Next part starts by itself" needs a first click on the page (browsers block sound before that); if a browser still
  refuses, the part is loaded and the learner presses play.
- Tests to add to `tools/test_site.py`, per language: the player lists every part with its length; `#part-N` opens
  part N; sending `ended` from the part shows the countdown and then loads part N+1; the language link carries
  `#part-N`; no console error, no outside request. (The test Chromium cannot decode the audio: dispatch `ended` on
  `#lesson-audio` inside the frame instead of playing.)
- **Voice** = the language links of the player (they open the same part at the same sentence). **Subtitles** = the
  menu under the stage of each part (`--subs`, SKILL.md step 5b). Chinese subtitles use the fonts of the device.
- Look at the built site with `python3 ~/.claude/skills/lesson-animator/scripts/serve.py docs 8090`, not with
  `python3 -m http.server`: the latter cannot jump inside the audio, so chapters, the bar and the language switch
  snap back to the start. (GitHub Pages is fine.)
