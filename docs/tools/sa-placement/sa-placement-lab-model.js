/**
 * SA placement lab (Lab 07): the pure model. No DOM, so Node can test it against the module's checker
 * (courses/learn_placement/module02-07-sa-placement/examples/sa_place_check.py).
 *
 * Rules of the run (the checker's written rules; placement-core.js saPlace is the reference and is
 * called on every run to prove that the move-by-move copy below gives the same result):
 *   - mulberry32(seed), no warm-up; 4 draws per move: cell = CELLS[floor(r*6)] (order A..F),
 *     axis x if r < 0.5, sign - if r < 0.5, size = step * (0.5 + r); clamp both coordinates to -1..9;
 *   - d = change of the total HPWL; d <= 0: accepted with no dice; else u = 5th draw, accepted if
 *     u < exp(-d / T); best kept only when strictly lower, after an accepted move; T *= 0.94 after
 *     every move; the result is the BEST placement.
 *   - The annealer ALWAYS starts from the starter placement (52), whatever the workspace shows.
 *
 * Learner state (what the challenges read on every Check):
 *   positions  what the workspace shows
 *   origin     "starter" (built by hand from the starter) or "run" (an SA result was loaded since the
 *              last Start or Reset; manual edits keep "run")
 *   edits      manual moves since the last Start, Reset or run
 *   run        the current run, or null. A manual edit sets it to null (its statistics are cancelled)
 *   cancelled  {seed, moves} of the run an edit cancelled (for the message only)
 *   view       "best" or "final": which placement of the run is shown (not an edit)
 *   tallyShown the study reveal of the better/worse/free tally was used since Start
 *   count      {better, worse, free, sig, blind}: the learner's saved count of the accepted moves
 *   lucky      {move, sig}: the move number the learner saved for the lucky-dice challenge
 * Every action returns {state, msg}; msg and Check reasons are codes (the words are in sa-placement-strings.js).
 */
import { CELLS, NETS, STARTER_PLACEMENT, clonePositions, hpwl, saPlace, totalHpwl } from "../../assets/placement-core.js";

export { CELLS, NETS };

/** One colour per cell, the checker's COLORS (also the lessons'). Never by index. */
export const COLORS = { A: "#1d4ed8", B: "#0f6b5c", C: "#b45309", D: "#7c3aed", E: "#be123c", F: "#475569" };
export const NET_COLORS = ["#0369a1", "#a16207", "#15803d", "#9d174d", "#b91c1c", "#6d28d9"];
export const WALLS = { min: -1, max: 9 };
export const CHIP = { min: 0, max: 8 };
export const SNAP = 0.5;
export const T0 = 3;
export const COOL = 0.94;
export const STEP = 1;
export const DEFAULT_RUN = { seed: 42, moves: 60 };
/** The run to count in "Accepted is not better": the lesson says seed 42's numbers aloud, so seed 162 is counted. */
export const COUNT_RUN = { seed: 162, moves: 60 };
export const MAX_MOVES = 3000;
export const MAX_SEED = 4294967295;
export const START = Object.freeze(clonePositions(STARTER_PLACEMENT));
export const START_HPWL = totalHpwl(NETS, START); // 52

/** Challenge thresholds (every one is tested against the checker's numbers). */
export const TARGET = {
  median: 36, //        "below the middle of 200 seeds" (true median 36.0428, seeds 1-200, 60 moves)
  luckyChance: 0.2, //  an accepted worse move with a chance below 20 %
  golden: 14, //        "below the hand-made 14" with more moves
  spreadHpwl: 16, //    short and spread: total at most 16 ...
  spreadGap: 1, //      ... with every pair of cells at least 1 apart
};

/* ---------------- the annealer, move by move ---------------- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const kindOf = (d) => (d < 0 ? "better" : d > 0 ? "worse" : "free");

/**
 * One SA run from the starter. The log has one row per move with the checker's fields.
 * `sameAsSaPlace` is true when placement-core.js saPlace gives the same best, final, counts and positions.
 */
export function runSA(seed, moves) {
  const rand = mulberry32(seed);
  let draws = 0;
  const draw = () => {
    draws++;
    return rand();
  };
  let pos = clonePositions(START);
  let cur = START_HPWL;
  let best = cur;
  let bestPos = clonePositions(pos);
  let bestMove = null;
  let T = T0;
  let accepted = 0;
  let rejected = 0;
  const log = [];
  for (let m = 1; m <= moves; m++) {
    const cell = CELLS[Math.floor(draw() * CELLS.length)];
    const axis = draw() < 0.5 ? "x" : "y";
    const delta = (draw() < 0.5 ? -1 : 1) * STEP * (0.5 + draw());
    const from = { x: pos[cell].x, y: pos[cell].y };
    const trial = clonePositions(pos);
    const proposed = from[axis] + delta;
    trial[cell][axis] = proposed;
    trial[cell].x = Math.max(WALLS.min, Math.min(WALLS.max, trial[cell].x));
    trial[cell].y = Math.max(WALLS.min, Math.min(WALLS.max, trial[cell].y));
    const next = totalHpwl(NETS, trial);
    const d = next - cur;
    const Tm = T;
    let u = null;
    let ok;
    if (d <= 0) ok = true;
    else {
      u = draw();
      ok = u < Math.exp(-d / Math.max(T, 1e-9));
    }
    let newBest = false;
    if (ok) {
      pos = trial;
      cur = next;
      accepted++;
      if (cur < best) {
        best = cur;
        bestPos = clonePositions(pos);
        bestMove = m;
        newBest = true;
      }
    } else rejected++;
    T *= COOL;
    log.push({
      move: m, cell, axis, from, to: { x: trial[cell].x, y: trial[cell].y }, proposed,
      clamped: trial[cell][axis] !== proposed, delta, dHpwl: d, T: Tm,
      p: d > 0 ? Math.exp(-d / Math.max(Tm, 1e-9)) : 1, u, accepted: ok, newBest, hpwl: cur, best, kind: kindOf(d),
    });
  }
  const tally = { better: 0, worse: 0, free: 0 };
  for (const x of log) if (x.accepted) tally[x.kind]++;
  const real = saPlace(START, { seed, moves, t0: T0, cool: COOL, step: STEP });
  const sameAsSaPlace =
    real.hpwl === best && real.finalHpwl === cur && real.accepted === accepted && real.rejected === rejected &&
    samePositions(real.positions, bestPos);
  return {
    seed, moves, sig: `${seed}/${moves}`, start: START_HPWL, best, final: cur, bestMove, accepted, rejected, draws,
    tally, bestPositions: bestPos, finalPositions: pos, endT: T, log, sameAsSaPlace,
  };
}

/** Best of a 60-move run for each seed (the "one seed, one story" spread). */
export function seedTable(from = 1, to = 200, moves = 60) {
  const rows = [];
  for (let s = from; s <= to; s++) {
    const r = runSA(s, moves);
    rows.push({ seed: s, best: r.best, bestMove: r.bestMove, final: r.final, accepted: r.accepted, rejected: r.rejected });
  }
  return rows;
}

export function median(values) {
  const v = [...values].sort((a, b) => a - b);
  const n = v.length;
  return n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
}

/* ---------------- measuring a placement ---------------- */

export function samePositions(a, b) {
  return CELLS.every((id) => a[id] && b[id] && a[id].x === b[id].x && a[id].y === b[id].y);
}

export const total = (pos) => totalHpwl(NETS, pos);

/** Width, height and HPWL of every net. */
export function netBoxes(pos) {
  return NETS.map((net, i) => {
    const xs = net.map((c) => pos[c].x);
    const ys = net.map((c) => pos[c].y);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    return { i, net, x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, hpwl: hpwl(net, pos) };
  });
}

/** Smallest distance between two cells, and that pair. */
export function closestPair(pos) {
  let best = { d: Infinity, a: null, b: null };
  for (let i = 0; i < CELLS.length; i++) {
    for (let j = i + 1; j < CELLS.length; j++) {
      const a = pos[CELLS[i]];
      const b = pos[CELLS[j]];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < best.d) best = { d, a: CELLS[i], b: CELLS[j] };
    }
  }
  return best;
}

/** Cells sharing exact points (groups of 2 or more). */
export function stacks(pos) {
  const at = new Map();
  for (const id of CELLS) {
    const k = `${pos[id].x},${pos[id].y}`;
    if (!at.has(k)) at.set(k, []);
    at.get(k).push(id);
  }
  return [...at.values()].filter((g) => g.length > 1);
}

export const snap = (v) => Math.max(WALLS.min, Math.min(WALLS.max, Math.round(v / SNAP) * SNAP));

/* ---------------- learner state and actions ---------------- */

export function createState() {
  return {
    positions: clonePositions(START), origin: "starter", edits: 0, run: null, cancelled: null, view: "best",
    tallyShown: false, count: null, lucky: null, selected: "A",
  };
}

const done = (state, msg) => ({ state, msg });

/** Parse a whole number typed by the learner ("42", " 60 "); null if it is not one in [lo, hi]. */
export function parseWhole(text, lo, hi) {
  const t = String(text ?? "").trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= lo && n <= hi ? n : null;
}

/** Run SA from the STARTER (never from the workspace) and show its best placement. */
export function doRun(state, seedText, movesText, opts = {}) {
  const seed = parseWhole(seedText, 0, MAX_SEED);
  if (seed === null) return done(state, { code: "bad-seed", max: MAX_SEED });
  const moves = parseWhole(movesText, 1, MAX_MOVES);
  if (moves === null) return done(state, { code: "bad-moves", max: MAX_MOVES });
  const run = runSA(seed, moves);
  return done(
    { ...state, positions: clonePositions(run.bestPositions), origin: "run", edits: 0, run, cancelled: null, view: "best" },
    { code: opts.preset ? "preset" : "ran", seed, moves, best: run.best, accepted: run.accepted, rejected: run.rejected },
  );
}

/** The old "Apply SA" button: the same run as typing seed 42 and 60 moves. */
export const doPreset = (state) => doRun(state, String(DEFAULT_RUN.seed), String(DEFAULT_RUN.moves), { preset: true });

/** Show the run's best (what the annealer returns) or its final placement. Not an edit. */
export function setView(state, view) {
  if (!state.run) return done(state, { code: "need-run" });
  const positions = clonePositions(view === "final" ? state.run.finalPositions : state.run.bestPositions);
  return done({ ...state, view, positions }, { code: view === "final" ? "view-final" : "view-best" });
}

export const select = (state, id) => done({ ...state, selected: id }, null);

/** A manual move (drag, click, arrows, typed x and y): snapped to 0.5, kept inside the walls. Cancels the run. */
export function moveCell(state, id, x, y) {
  if (!CELLS.includes(id)) return done(state, null);
  const p = { x: snap(x), y: snap(y) };
  const q = state.positions[id];
  if (p.x === q.x && p.y === q.y) return done({ ...state, selected: id }, { code: "same-place", id });
  const positions = { ...clonePositions(state.positions), [id]: p };
  const cancelled = state.run ? { seed: state.run.seed, moves: state.run.moves } : state.cancelled;
  return done(
    { ...state, positions, selected: id, edits: state.edits + 1, run: null, cancelled, count: state.run ? null : state.count, lucky: state.run ? null : state.lucky },
    state.run ? { code: "cancelled", id, ...cancelled } : { code: "moved", id, x: p.x, y: p.y, total: total(positions) },
  );
}

export function nudge(state, dx, dy) {
  const id = state.selected;
  const q = state.positions[id];
  return moveCell(state, id, q.x + dx * SNAP, q.y + dy * SNAP);
}

export function putAt(state, xText, yText) {
  const x = Number(String(xText).trim().replace(",", "."));
  const y = Number(String(yText).trim().replace(",", "."));
  if (String(xText).trim() === "" || String(yText).trim() === "" || !Number.isFinite(x) || !Number.isFinite(y)) {
    return done(state, { code: "bad-xy" });
  }
  return moveCell(state, state.selected, x, y);
}

/** Back to the starter, by hand from now on (keeps the study flag: only Start clears it). */
export function doReset(state) {
  return done({ ...createState(), selected: state.selected, tallyShown: state.tallyShown }, { code: "reset" });
}

/** Study: show the better / worse / free tally of the run. A count saved after this does not count. */
export function showTally(state) {
  if (!state.run) return done(state, { code: "need-run" });
  return done({ ...state, tallyShown: true }, { code: "tally-shown" });
}

export function saveCount(state, b, w, f) {
  if (!state.run) return done(state, { code: "need-run" });
  const v = [b, w, f].map((t) => parseWhole(t, 0, MAX_MOVES));
  if (v.some((x) => x === null)) return done(state, { code: "bad-count" });
  const count = { better: v[0], worse: v[1], free: v[2], sig: state.run.sig, blind: !state.tallyShown };
  return done({ ...state, count }, { code: "count-saved", ...count });
}

export function saveLucky(state, text) {
  if (!state.run) return done(state, { code: "need-run" });
  const move = parseWhole(text, 1, MAX_MOVES);
  if (move === null) return done(state, { code: "bad-move-no", moves: state.run.moves });
  return done({ ...state, lucky: { move, sig: state.run.sig } }, { code: "lucky-saved", move });
}

/** The tally the learner may see: always for seed 42 with 60 moves (the lesson's worked example), else after the
 *  study reveal, or once their own count is right. */
export function tallyVisible(state) {
  const r = state.run;
  if (!r) return false;
  if (r.seed === DEFAULT_RUN.seed && r.moves === DEFAULT_RUN.moves) return true;
  if (state.tallyShown) return true;
  const c = state.count;
  return !!c && c.sig === r.sig && c.better === r.tally.better && c.worse === r.tally.worse && c.free === r.tally.free;
}

/* ---------------- challenges (every Check recomputes from the learner's state) ---------------- */

export const CHALLENGES = [
  { id: "by-hand", level: "Intro", kind: "hand" },
  { id: "below-median", level: "Intro", kind: "run" },
  { id: "pile-up", level: "Intro", kind: "hand" },
  { id: "count-accepted", level: "Practice", kind: "run" },
  { id: "lucky-dice", level: "Practice", kind: "run" },
  { id: "best-vs-final", level: "Practice", kind: "run" },
  { id: "more-moves", level: "Practice", kind: "run" },
  { id: "ends-worse", level: "Stretch", kind: "run" },
  { id: "short-spread", level: "Stretch", kind: "hand" },
];

let saBest42 = null;
/** Seed 42, 60 moves: the run the lesson tells (49.575..., 44 accepted, 16 rejected). */
export function goldenRun() {
  if (!saBest42) saBest42 = runSA(DEFAULT_RUN.seed, DEFAULT_RUN.moves);
  return saBest42;
}

function handGate(state) {
  if (state.origin !== "starter") return { ok: false, why: "from-run" };
  if (state.edits === 0) return { ok: false, why: "untouched" };
  return null;
}

function runGate(state) {
  if (state.run) {
    // the workspace must show this run's best or final placement, untouched
    const shown = state.view === "final" ? state.run.finalPositions : state.run.bestPositions;
    if (!samePositions(state.positions, shown)) return { ok: false, why: "cancelled" };
    return null;
  }
  return { ok: false, why: state.cancelled ? "cancelled" : "no-run" };
}

const no = (why, extra = {}) => ({ ok: false, why, ...extra });
const yes = (why, extra = {}) => ({ ok: true, why, ...extra });

export function checkChallenge(id, state) {
  const def = CHALLENGES.find((c) => c.id === id);
  if (!def) return no("unknown");
  const gate = def.kind === "hand" ? handGate(state) : runGate(state);
  if (gate) return gate;
  const r = state.run;
  const t = total(state.positions);
  switch (id) {
    case "by-hand": {
      const target = goldenRun().best;
      return t < target ? yes("ok-by-hand", { total: t }) : no("not-below-sa", { total: t });
    }
    case "pile-up":
      return t === 0 ? yes("ok-pile-up", { stacks: stacks(state.positions) }) : no("not-zero", { total: t });
    case "short-spread": {
      const c = closestPair(state.positions);
      if (t > TARGET.spreadHpwl) return no("too-long", { total: t });
      if (c.d < TARGET.spreadGap) return no("too-close", { a: c.a, b: c.b, d: c.d });
      return yes("ok-spread", { total: t, d: c.d });
    }
    case "below-median":
      if (r.moves !== DEFAULT_RUN.moves) return no("need-60", { moves: r.moves });
      return r.best < TARGET.median ? yes("ok-median", { seed: r.seed, best: r.best }) : no("not-below-median", { seed: r.seed, best: r.best });
    case "count-accepted": {
      if (r.seed !== COUNT_RUN.seed || r.moves !== COUNT_RUN.moves) return no("need-162-60", { seed: r.seed, moves: r.moves });
      const c = state.count;
      if (!c) return no("no-count");
      if (c.sig !== r.sig) return no("count-stale");
      if (!c.blind) return no("peeked");
      const right = c.better === r.tally.better && c.worse === r.tally.worse && c.free === r.tally.free;
      if (!right) return no("count-wrong", { sum: c.better + c.worse + c.free, accepted: r.accepted });
      return yes("ok-count", { ...r.tally });
    }
    case "lucky-dice": {
      const l = state.lucky;
      if (!l) return no("no-lucky");
      if (l.sig !== r.sig) return no("lucky-stale");
      const x = r.log[l.move - 1];
      if (!x) return no("lucky-range", { move: l.move, moves: r.moves });
      if (x.kind !== "worse") return no("lucky-not-worse", { move: l.move });
      if (!x.accepted) return no("lucky-rejected", { move: l.move });
      if (!(x.p < TARGET.luckyChance)) return no("lucky-high", { move: l.move });
      return yes("ok-lucky", { move: l.move, p: x.p, u: x.u });
    }
    case "best-vs-final":
      return r.final > r.best ? yes("ok-best-final", { seed: r.seed, best: r.best, final: r.final }) : no("final-is-best", { seed: r.seed });
    case "more-moves":
      if (r.seed !== DEFAULT_RUN.seed) return no("need-42", { seed: r.seed });
      return r.best < TARGET.golden ? yes("ok-more", { moves: r.moves, best: r.best }) : no("not-below-golden", { moves: r.moves, best: r.best });
    case "ends-worse":
      return r.final > r.start ? yes("ok-ends-worse", { seed: r.seed, best: r.best, final: r.final }) : no("not-worse-than-start", { seed: r.seed, final: r.final });
    default:
      return no("unknown");
  }
}

/** Moves of a run that answer lucky-dice (accepted, worse, chance below 20 %). */
export const luckyMoves = (run) => run.log.filter((x) => x.accepted && x.kind === "worse" && x.p < TARGET.luckyChance).map((x) => x.move);

/** Smallest move count for which seed 42's best drops below 14 (searched, not assumed). */
export function movesBelowGolden(seed = DEFAULT_RUN.seed, limit = MAX_MOVES) {
  const r = runSA(seed, limit);
  const hit = r.log.find((x) => x.best < TARGET.golden);
  return hit ? hit.move : null;
}
