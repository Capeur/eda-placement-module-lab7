# Lab 07 — Simulated annealing placement · Placement for EDA

A standalone, **bilingual (English / French)** GitHub Pages site for **Lab 07 (simulated annealing placement)** of the
[Placement for EDA course](https://github.com/yongfu-li/eda-learning) — a review build of the upgraded lab, not yet
merged into the course repository.

- English: `https://capeur.github.io/eda-placement-module-lab7/`
- Français : `https://capeur.github.io/eda-placement-module-lab7/fr/`

**Lessons only.** There is no slide video, no video parts, no subtitles file and no slide deck on this site. The media are
**five short animated lessons** (drawn live in the browser, told by a voice, one player with all parts), with subtitles in
English, French and Chinese. Each language page also has the **interactive browser lab** (9 challenges that check what you
built or counted), the Track A material, a quiz and the full transcript. A switch in every header (page and lab) jumps to the
other language at the same place.

Built from the Lab 05 site (`eda-floorplanning-module-lab5`) with a fresh history, and the classic video removed.

## Layout

| Path | What |
|------|------|
| `build_site.py` | builds `docs/` (English) and `docs/fr/` (French); runs `tools/check_sentences.py` first; shows the lesson player only when `docs/lessons/index.html` exists; keeps `docs/lessons` and `docs/fr/lessons` across a rebuild |
| `site_src/` | page template, CSS, quiz script, self-hosted fonts, the lab screenshots (`img/lab-en.png`, `img/lab-fr.png`) |
| `i18n/strings.py` | all page text, English and French (part titles, example files list) |
| `i18n/fr/module02-07-sa-placement/transcript.md` | French narration: **exactly the sentences of the English transcript, slide by slide** (numbers in words) |
| `i18n/zh/module02-07-sa-placement/transcript.md` | Chinese narration **for subtitles only**, to be checked by a native reader; same sentences again |
| `i18n/fr/EXAMPLES.md`, `i18n/fr/quiz.json` | French Track A guide and quiz |
| `i18n/fr/sa-placement-strings.js` | French copy of the lab's strings module; the build checks it has exactly the same keys and functions (`tools/strings_shape.mjs`) |
| `i18n/fr/lab_strings.py` | French text of the lab page and of the shared challenge chrome (exact replacements; the build fails if they changed) |
| `lessons/part-N/` | the lesson sources (storyboards), one folder per part, filled in Stage 5b (see `lessons/README.md`) |
| `tools/check_sentences.py` | EN, FR and ZH have the same number of sentences in every slide (lesson-animator's `lessonlib.slide_sentences`) |
| `tools/capture_lab.py` | the lab screenshots of the page |
| `tools/test_site.py`, `tools/test_lab_site.py` | Playwright tests of the built site and of the lab's 9 challenges, in both languages |
| `docs/` | the built site served by GitHub Pages (main branch, `/docs`) |
| `ai-workflow/` | how the lab was built with AI, and the two skills (`lab-upgrade`, `lesson-animator`) |

English content comes from your `eda-learning` clone (Lab 07 upgrade applied); nothing in it is modified. The lab is copied
file by file (`platform/tools/sa-placement/`, **without** its `tests/` folder) plus the shared `platform/assets/` files it
imports. `examples/wrong/` (three deliberately wrong annealers) stays in the course repository: the page offers the checker,
the instance and the run files, not the wrong programs.

The French lab keeps the decimal point (`49.6`, not `49,6`), like the lessons' numbers on screen and the checker's output.

## Rebuild

```bash
cd ~/path/to/eda-placement-module-lab7
~/eda-venv/bin/python build_site.py --repo ../eda-learning-lab7-pl      # stops if the EN / FR / ZH sentences differ
python3 ~/.claude/skills/lesson-animator/scripts/serve.py docs 8090      # restart it after every build (docs/ is recreated)
```

Preview: `http://127.0.0.1:8090/` and `/fr/`. Use `serve.py`, not `python3 -m http.server`: only `serve.py` answers Range
requests, so the lesson audio can jump (chapters, the bar, the language switch).

## Tests

```bash
~/eda-venv/bin/python tools/check_sentences.py     # same sentences per slide in EN, FR, ZH
~/eda-venv/bin/python tools/test_site.py           # page, quiz, downloads, switch, lab, lessons (player checks once lessons exist)
~/eda-venv/bin/python tools/test_lab_site.py       # the 9 challenges + script numbers + colours: positive and negative cases, EN and FR
```

Read **both** language lines of each test. `tools/test_site.py` shows the lesson player checks only when `docs/lessons/index.html`
exists: the player lists every built part, `#part-N` opens part N, `ended` shows the countdown and loads the next part, the
language link carries `#part-N`, and each part page has its subtitles menu (other language and 中文), the "Sounds" button,
`window.__lesson.errors` empty, `placement.dataDiffer` = 0, working audio, no console error and no outside request.

## Animated lessons (Stage 5b)

One conversation per part, with the `lesson-animator` skill (voices `en-US-AndrewMultilingualNeural` and
`fr-FR-RemyMultilingualNeural`, both `--rate=-4%`). Storage keys: `lab07-lesson-speed` (the lesson page) and `lab07-lessons`
(the player). The back link of both players is `--back ../index.html#lessons`; the button after the last part goes to
`../tools/sa-placement/index.html`. Commit `lessons/*/storyboard.json`, `docs/lessons` and `docs/fr/lessons`; `build/` and
`.cache/` stay ignored.

**Terminology (French):** *placement*, *recuit simulé*, *cellule*, *réseau* (net), *longueur de fil* (wirelength), *boîte de réseau*,
*mouvement*, *accepté / refusé*, *meilleur / pire / neutre* (better / worse / free), *chance*, *dé* (dice), *température*, *graine*
(seed), *mur* (wall), *départ* (starter), *plots* (pads). Code, commands and program output stay in English.

## Credits

Course content, browser lab framework and lesson engine: the [EDA Algorithms Platform](https://github.com/yongfu-li/eda-learning)
(CC BY 4.0). Lab 07 upgrade and French translation built for the course assignment. The Chinese subtitles are a machine
translation that a native reader must check.
