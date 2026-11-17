/**
 * Every word the SA placement lab shows (Lab 07), in one place. Stage 5 (French site) replaces these
 * English snippets one by one, so keep each string literal on one line and unique in this file.
 * Cell names (A-F), challenge ids, codes and numbers stay as they are.
 * Vocabulary (as in the lessons): wirelength, net box, move, accepted, rejected, better, worse,
 * free move, chance, dice, temperature, seed, best, final, starter.
 */
const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
const f4 = (x) => String(Math.round(x * 1e4) / 1e4);
const f2 = (x) => String(Math.round(x * 100) / 100);
const pct = (p) => `${Math.round(p * 100)} %`;
const signed = (d) => (d === 0 ? "0" : `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(2)}`);

export const fmt = { f1, f2, f4, pct, signed };

export const T = {
  // ---------------- page chrome ----------------
  panelLeft: "Chip and run",
  panelRight: "Your placement",
  starterButton: "Reset workspace",
  idlePrompt: "Pick a challenge and click <strong>Start</strong>. Move cells or run the annealer, then <strong>Check</strong>. The study tally never counts.",
  starterHtml: `<p><strong>Your workspace:</strong> six cells on a chip, wired by six nets. Each net is measured by its box:
    width plus height. The total starts at <strong>52</strong>. Drag a cell (or pick it and use the arrows) to change the
    wires yourself, or run the annealer. <strong>The annealer always starts from the starter placement</strong>, whatever
    the workspace shows, and it returns the best placement it saw. Seed 42 with 60 moves gives <strong>49.6</strong>, with
    44 moves accepted and 16 rejected. Moving a cell by hand after a run cancels that run's numbers.</p>`,

  // ---------------- run controls (above the workspace) ----------------
  seedLabel: "Seed",
  movesLabel: "Moves",
  seedAria: "Seed of the run (a whole number)",
  movesAria: "Number of moves (1 to 3000)",
  runBtn: "Run SA from the starter",
  presetBtn: "Apply SA preset (seed 42, 60 moves)",
  resetBtn: "Reset to starter",
  showLabel: "Show:",
  viewBest: "best (returned)",
  viewFinal: "final (last)",
  tallyBtn: "Show the tally (study)",

  // ---------------- chip view ----------------
  floorCaption: "The chip (walls at −1 and 9)",
  floorLegendNets: "dashed box = one net (width + height)",
  floorLegendWalls: "thick grey line = wall: cells cannot go past it",
  floorLegendDrag: "drag a cell, or click a cell then click where it should go",
  totalLabel: (t) => `wirelength ${f1(t)}`,
  stackTag: (n) => `×${n}`,

  // ---------------- chart and log ----------------
  chartCaption: "The run, move by move",
  chartEmpty: "Run the annealer to draw its curve.",
  chartCancelled: "Your edit cancelled this run: run it again to see its curve.",
  chartLegendCur: "current wirelength",
  chartLegendBest: "best so far",
  chartLegendStart: "start (52)",
  chartAxisMoves: "move",
  logCaption: "Every move of the run",
  logFilter: "Show",
  logAll: "all moves",
  logAccepted: "accepted moves",
  logRejected: "rejected moves",
  logCols: ["#", "cell", "push", "wires", "temp.", "chance", "dice", "verdict"],
  logPush: (x) => `${x.axis} ${x.delta > 0 ? "+" : "−"}${Math.abs(x.delta).toFixed(2)}${x.clamped ? " (wall)" : ""}`,
  logNoDice: "no dice",
  logAcceptedWord: "accepted",
  logRejectedWord: "rejected",
  logNewBest: " ★ new best",
  logTooLong: (n) => `Showing the first 1000 of ${n} moves.`,

  // ---------------- right panel ----------------
  selectedLabel: "Cell",
  cellAria: (id) => `Select cell ${id}`,
  nudgeLeft: "←",
  nudgeRight: "→",
  nudgeUp: "↑",
  nudgeDown: "↓",
  nudgeAria: { left: "Move the cell left by half a square", right: "Move the cell right by half a square", up: "Move the cell up by half a square", down: "Move the cell down by half a square" },
  putLabel: "Put it at",
  putBtn: "Put",
  putXAria: "x of the selected cell",
  putYAria: "y of the selected cell",
  netsHead: "Nets",
  netCols: ["net", "cells", "width + height"],
  netRow: (b) => `${f2(b.w)} + ${f2(b.h)} = ${f2(Number(f2(b.w)) + Number(f2(b.h)))}`, // the row adds up as printed
  totalLine: (t) => `Total wirelength: ${f1(t)}`,
  closestLine: (c) => `Closest cells: ${c.a} and ${c.b}, ${c.d === 0 ? "on the same point" : `${f4(c.d)} apart`}`,
  originStarter: (n) => (n ? `Made by hand from the starter (${n} move${n === 1 ? "" : "s"}).` : "The starter placement, untouched."),
  originRun: "Started from an SA run (Reset to starter to place by hand).",

  runHead: "The run",
  runNone: "No run yet. The annealer starts from the starter (52).",
  runCancelled: (c) => `Run seed ${c.seed}, ${c.moves} moves: cancelled by your edit. Run it again to get its numbers back.`,
  runLines: (r, view) => [
    `seed ${r.seed}, ${r.moves} moves, from the starter (${f1(r.start)})`,
    `best: ${f1(r.best)} (exactly ${f4(r.best)})${r.bestMove ? `, reached at move ${r.bestMove}` : ", never below the start"}`,
    `final: ${f1(r.final)} (exactly ${f4(r.final)})${r.final === r.best ? ", same as the best" : r.final > r.best ? ", worse than the best" : ""}`,
    `accepted: ${r.accepted}   rejected: ${r.rejected}`,
    `temperature: ${f1(3)} at the start, ${r.endT.toFixed(2)} at the end`,
    `the workspace shows the ${view === "final" ? "final" : "best"} placement`,
  ],
  tallyHidden: "Accepted is not the same as better. How many accepted moves made the wires shorter? Count them in the log.",
  tallyLine: (t) => `accepted = ${t.better} better + ${t.worse} worse + ${t.free} free (no wire changed)`,

  countHead: "Count the accepted moves",
  countHelp: "Type how many accepted moves made the wires shorter (better), longer (worse), or left them the same (free).",
  countBetter: "better",
  countWorse: "worse",
  countFree: "free",
  countBtn: "Save my count",
  countShown: (c) => `saved count: ${c.better} better, ${c.worse} worse, ${c.free} free${c.blind ? "" : " (saved after the study tally: does not count)"}`,
  luckyHead: "A lucky dice",
  luckyHelp: "Type the number of a move where the dice kept a worse move although its chance was small.",
  luckyAria: "Move number",
  luckyBtn: "Save the move",
  luckyShown: (l) => `saved move: ${l.move}`,

  // ---------------- messages after an action ----------------
  msg: {
    ran: (m) => `Ran seed ${m.seed} with ${m.moves} moves from the starter: best ${f1(m.best)}, ${m.accepted} accepted, ${m.rejected} rejected.`,
    preset: (m) => `Preset: seed ${m.seed}, ${m.moves} moves, from the starter: best ${f1(m.best)}, ${m.accepted} accepted, ${m.rejected} rejected.`,
    "bad-seed": () => "The seed must be a whole number (0, 1, 2, …).",
    "bad-moves": (m) => `The number of moves must be a whole number from 1 to ${m.max}.`,
    "need-run": () => "Run the annealer first.",
    "view-best": () => "Showing the best placement: the one the annealer returns.",
    "view-final": () => "Showing the final placement: where the run stopped.",
    "same-place": (m) => `${m.id} is already there.`,
    moved: (m) => `${m.id} moved to (${m.x}, ${m.y}). Total wirelength: ${f1(m.total)}.`,
    cancelled: (m) => `You moved ${m.id} by hand: the numbers of run seed ${m.seed}, ${m.moves} moves, are cancelled.`,
    "bad-xy": () => "Type two numbers, for example 3 and 4.5.",
    reset: () => "Back to the starter placement (52). Moves you make now are made by hand.",
    "tally-shown": () => "Study tally shown. A count saved from now on does not count: press Start again to try the count yourself.",
    "bad-count": () => "Type three whole numbers.",
    "count-saved": (m) => `Count saved: ${m.better} better, ${m.worse} worse, ${m.free} free.`,
    "bad-move-no": (m) => `Type a move number from 1 to ${m.moves}.`,
    "lucky-saved": (m) => `Move ${m.move} saved.`,
  },

  // ---------------- Check reasons ----------------
  checkHead: "Check:",
  why: {
    "no-run": () => "No run yet: run the annealer first.",
    cancelled: () => "You moved a cell after the run, so its numbers no longer count. Run it again.",
    "from-run": () => "This placement started from an SA run. Press Reset to starter and move the cells yourself.",
    untouched: () => "You have not moved any cell yet.",
    "not-below-sa": (r) => `Your wirelength is ${f1(r.total)}. The annealer's best with seed 42 and 60 moves is 49.6: go below it.`,
    "ok-by-hand": (r) => `Yes: ${f1(r.total)} by hand, below the annealer's 49.6.`,
    "not-zero": (r) => `Your wirelength is ${f1(r.total)}, not 0 yet. Which cells share a net?`,
    "ok-pile-up": () => "Yes: wirelength 0. The cells sit on top of each other, and the cost does not mind: it does not see overlap.",
    "too-long": (r) => `Your wirelength is ${f1(r.total)}: bring it down to 16 or less.`,
    "too-close": (r) => `${r.a} and ${r.b} are ${f4(r.d)} apart: keep every pair at least 1 apart.`,
    "ok-spread": (r) => `Yes: ${f1(r.total)}, and no two cells closer than ${f4(r.d)}. Short and spread: that needs a rule the cost does not have.`,
    "need-60": (r) => `This run has ${r.moves} moves. Compare seeds with 60 moves each.`,
    "not-below-median": (r) => `Seed ${r.seed} gives ${f1(r.best)}, not below 36. Try another seed.`,
    "ok-median": (r) => `Yes: seed ${r.seed} gives ${f1(r.best)}. Seed 42 (49.6) was one unlucky story.`,
    "need-162-60": () => "Count the run of seed 162 with 60 moves. Seed 42 is the worked example: its tally is already on the screen.",
    "no-count": () => "Save your count first (better, worse, free).",
    "count-stale": () => "Your count was saved for another run. Save it again for this run.",
    peeked: () => "The study tally was shown before you saved this count. Press Start again and count yourself.",
    "count-wrong": (r) => `Not this count. Your three numbers add up to ${r.sum}; the run accepted ${r.accepted} moves.`,
    "ok-count": (r) => `Yes: ${r.better} better, ${r.worse} worse, ${r.free} free. Accepted is not progress.`,
    "no-lucky": () => "Save a move number first.",
    "lucky-stale": () => "That move number was saved for another run. Save it again for this run.",
    "lucky-range": (r) => `There is no move ${r.move}: this run has ${r.moves} moves.`,
    "lucky-not-worse": (r) => `Move ${r.move} did not make the wires longer: no dice was rolled.`,
    "lucky-rejected": (r) => `Move ${r.move} was rejected: the dice said no.`,
    "lucky-high": (r) => `Move ${r.move} was kept, but its chance was 20 % or more. Look for a smaller chance.`,
    "ok-lucky": (r) => `Yes: move ${r.move} had a chance of ${pct(r.p)}, and the dice showed ${r.u.toFixed(2)}, below it.`,
    "final-is-best": (r) => `With seed ${r.seed}, the final placement is as good as the best. Try other seeds.`,
    "ok-best-final": (r) => `Yes: seed ${r.seed} ends at ${f1(r.final)}, but its best was ${f1(r.best)}. The annealer returns the best.`,
    "need-42": (r) => `This run uses seed ${r.seed}. Keep seed 42 and change the number of moves.`,
    "not-below-golden": (r) => `With ${r.moves} moves, seed 42 reaches ${f1(r.best)}. Give it more moves.`,
    "ok-more": (r) => `Yes: ${r.moves} moves reach ${f1(r.best)}. Now look at the chip: are the cells piling up?`,
    "not-worse-than-start": (r) => `Seed ${r.seed} ends at ${f1(r.final)}, not above the start (52). Look for a run that ends worse than it began.`,
    "ok-ends-worse": (r) => `Yes: seed ${r.seed} ends at ${f1(r.final)}, worse than the start, yet it returns ${f1(r.best)}. Keeping the best saved it.`,
    unknown: () => "Unknown challenge.",
  },

  // ---------------- challenges ----------------
  challenges: {
    "by-hand": {
      title: "Beat the annealer by hand",
      prompt: "Seed 42 with 60 moves reaches 49.6. From the starter, move the cells yourself until the total wirelength is below 49.6.",
      hint: "Which net is the shortest to fix? E and F share a net: bring F next to E.",
    },
    "below-median": {
      title: "One seed, one story",
      prompt: "Seed 42 gives 49.6, but is that typical? Run other seeds with 60 moves until one has a best below 36, the middle of 200 seeds.",
      hint: "About half of the seeds do it. Change the seed, keep 60 moves, and run again.",
    },
    "pile-up": {
      title: "Wirelength zero",
      prompt: "The cost only measures net boxes. From the starter, move the cells by hand until the total wirelength is 0.",
      hint: "A box of width 0 and height 0 needs all its cells on one point. A, B, C and D share nets; E and F share one.",
    },
    "count-accepted": {
      title: "Accepted is not better",
      prompt: "The lesson counted the accepted moves of seed 42 (its tally is the worked example on the screen). Now run seed 162 with 60 moves: 41 moves are accepted. In the log, count how many of them made the wires shorter, longer, or left them the same, and save your count.",
      hint: "Show only the accepted moves. A minus sign in the wires column is better, a plus sign is worse, 0 is a free move.",
    },
    "lucky-dice": {
      title: "A lucky dice",
      prompt: "In a run's log, find an accepted move that made the wires longer although its chance was below 20 %. Save its move number.",
      hint: "Seed 42 has two such moves after move 10, when the temperature is lower. Read the chance and dice columns.",
    },
    "best-vs-final": {
      title: "Best is not always final",
      prompt: "In seed 42, the final placement is also the best. Find a seed (any number of moves) whose final wirelength is worse than its best.",
      hint: "The lesson showed seed 162. Switch the view between best and final to see what changed.",
    },
    "more-moves": {
      title: "More moves",
      prompt: "Keep seed 42 and give the annealer more moves, until its best goes below 14, the hand-made placement of the course.",
      hint: "60 moves give 49.6. Try 100, 200, 300 … and watch the chip.",
    },
    "ends-worse": {
      title: "Worse than the start",
      prompt: "Find a run whose final wirelength is worse than the start (52). What does the annealer return then?",
      hint: "Run seeds with 60 moves. The seed is between 150 and 200.",
    },
    "short-spread": {
      title: "Short and spread",
      prompt: "By hand, from the starter, reach a total wirelength of 16 or less with every pair of cells at least 1 apart.",
      hint: "Put A, B, C and D on the corners of a small square, then E and F side by side.",
    },
  },
};
