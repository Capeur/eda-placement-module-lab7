// Helper of sa_place_check.py --vs-node (read-only import of platform/assets/placement-core.js).
//   node sa_node.mjs <file:// URL of placement-core.js>   < request.json   > answer.json
// request: { runs: [{seed, moves, t0?, cool?, step?}], hpwl: [positions], density: [positions] }
// For every run it returns the REAL saPlace result and a move-by-move log from a copy of the same loop.
// The copy is proven equal to saPlace on the spot (field "sameAsSaPlace"); the log is what the checker compares.
import fs from "node:fs";

const core = await import(process.argv[2]);
const { CELLS, NETS, STARTER_PLACEMENT, clonePositions, totalHpwl, saPlace, densityBins } = core;

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

function traceRun(o) {
  const moves = o.moves ?? 60, t0 = o.t0 ?? 3, cool = o.cool ?? 0.94, step = o.step ?? 1.0;
  const rand = mulberry32(o.seed);
  let draws = 0;
  const draw = () => { draws++; return rand(); };
  let pos = clonePositions(STARTER_PLACEMENT);
  let cur = totalHpwl(NETS, pos), best = cur, bestPos = clonePositions(pos), bestMove = null;
  let T = t0, accepted = 0, rejected = 0;
  const log = [];
  for (let m = 1; m <= moves; m++) {
    const id = CELLS[Math.floor(draw() * CELLS.length)];
    const axis = draw() < 0.5 ? "x" : "y";
    const delta = (draw() < 0.5 ? -1 : 1) * step * (0.5 + draw());
    const from = { x: pos[id].x, y: pos[id].y };
    const trial = clonePositions(pos);
    const proposed = from[axis] + delta;
    trial[id][axis] = proposed;
    trial[id].x = Math.max(-1, Math.min(9, trial[id].x));
    trial[id].y = Math.max(-1, Math.min(9, trial[id].y));
    const to = { x: trial[id].x, y: trial[id].y };
    const next = totalHpwl(NETS, trial);
    const d = next - cur;
    const Tm = T;
    let u = null, acc;
    if (d <= 0) acc = true;
    else { u = draw(); acc = u < Math.exp(-d / Math.max(T, 1e-9)); }
    let newBest = false;
    if (acc) {
      pos = trial; cur = next; accepted++;
      if (cur < best) { best = cur; bestPos = clonePositions(pos); newBest = true; bestMove = m; }
    } else rejected++;
    T *= cool;
    log.push({
      move: m, cell: id, axis, from, to, proposed, clamped: to[axis] !== proposed, delta, dHpwl: d, T: Tm,
      p: d > 0 ? Math.exp(-d / Math.max(Tm, 1e-9)) : 1, u, accepted: acc, newBest, hpwl: cur, best,
    });
  }
  return { best, final: cur, accepted, rejected, positions: bestPos, finalPositions: pos, bestMove, draws, log };
}

const req = JSON.parse(fs.readFileSync(0, "utf8"));
const out = { runs: [], hpwl: [], density: [] };
for (const o of req.runs || []) {
  const real = saPlace(STARTER_PLACEMENT, o);
  const mine = traceRun(o);
  const sameAsSaPlace = real.hpwl === mine.best && real.finalHpwl === mine.final && real.accepted === mine.accepted &&
    real.rejected === mine.rejected && JSON.stringify(real.positions) === JSON.stringify(mine.positions);
  out.runs.push({
    seed: o.seed, moves: o.moves ?? 60, sameAsSaPlace,
    best: real.hpwl, final: real.finalHpwl, accepted: real.accepted, rejected: real.rejected, positions: real.positions,
    bestMove: mine.bestMove, draws: mine.draws, finalPositions: mine.finalPositions,
    log: o.log ? mine.log : undefined,
  });
}
for (const p of req.hpwl || []) out.hpwl.push(totalHpwl(NETS, p));
for (const p of req.density || []) { const d = densityBins(p); out.density.push({ counts: d.counts, overflow: d.overflow }); }
process.stdout.write(JSON.stringify(out));
