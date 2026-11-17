// Stage 1 audit scratch: instrumented copy of saPlace's loop (placement-core.js, read-only import).
// Verified against the real saPlace for seeds 1..200 before any number is trusted.
import fs from "node:fs";
import {
  CELLS, NETS, STARTER_PLACEMENT, clonePositions, totalHpwl, saPlace, round1,
} from "/home/capeur/Documents/3A/SJTU/VLSI_Mort/test2/eda-learning-lab7-pl/platform/assets/placement-core.js";

const OUT = process.argv[2];

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

// opts.strict: accept only if d<0 (pseudocode wording), always draw otherwise
// opts.cells: cells that may be proposed (default all six)
export function trace(positions, opts = {}) {
  const nets = NETS;
  const moves = opts.moves ?? 60, t0 = opts.t0 ?? 3, cool = opts.cool ?? 0.94;
  const step = opts.step ?? 1.0, seed = opts.seed ?? 42;
  const cells = opts.cells ?? CELLS;
  const rand = mulberry32(seed);
  let pos = clonePositions(positions);
  let cur = totalHpwl(nets, pos), best = cur, bestPos = clonePositions(pos);
  let T = t0, accepted = 0, rejected = 0;
  const history = [{ hpwl: cur, T }];
  const log = [];
  for (let m = 0; m < moves; m++) {
    const id = cells[Math.floor(rand() * cells.length)];
    const trial = clonePositions(pos);
    const axis = rand() < 0.5 ? "x" : "y";
    const delta = (rand() < 0.5 ? -1 : 1) * step * (0.5 + rand());
    trial[id] = { x: pos[id].x, y: pos[id].y };
    const before = pos[id][axis];
    const proposed = before + delta;
    trial[id][axis] = proposed;
    trial[id].x = Math.max(-1, Math.min(9, trial[id].x));
    trial[id].y = Math.max(-1, Math.min(9, trial[id].y));
    const after = trial[id][axis];
    const next = totalHpwl(nets, trial);
    const d = next - cur;
    const Tm = T;
    let u = null, acc;
    if (opts.strict) {
      if (d < 0) acc = true; else { u = rand(); acc = u < Math.exp(-d / Math.max(T, 1e-9)); }
    } else if (d <= 0) acc = true;
    else { u = rand(); acc = u < Math.exp(-d / Math.max(T, 1e-9)); }
    let newBest = false;
    if (acc) {
      pos = trial; cur = next; accepted++;
      if (cur < best) { best = cur; bestPos = clonePositions(pos); newBest = true; }
    } else rejected++;
    T *= cool;
    if (m % 10 === 9) history.push({ hpwl: cur, T });
    log.push({
      move: m + 1, cell: id, axis, delta, before, proposed, after,
      clamped: after !== proposed, dHpwl: d, T: Tm,
      pAccept: d > 0 ? Math.exp(-d / Math.max(Tm, 1e-9)) : 1,
      u, accepted: acc, newBest, hpwl: cur, best,
    });
  }
  return { positions: bestPos, hpwl: best, accepted, rejected, history, finalHpwl: cur, log };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let mismatches = 0;
const results = {};
for (let seed = 1; seed <= 200; seed++) {
  const real = saPlace(STARTER_PLACEMENT, { seed });
  const mine = trace(STARTER_PLACEMENT, { seed });
  const { log, ...rest } = mine;
  if (!same(real, rest)) { mismatches++; console.log("MISMATCH seed", seed); }
  results[seed] = { hpwl: real.hpwl, finalHpwl: real.finalHpwl, accepted: real.accepted, rejected: real.rejected, positions: real.positions, history: real.history };
}
console.log("instrumented copy vs real saPlace, seeds 1..200: mismatches =", mismatches);

const t42 = trace(STARTER_PLACEMENT, { seed: 42 });
fs.writeFileSync(`${OUT}/js_trace_42.json`, JSON.stringify(t42, null, 1));
fs.writeFileSync(`${OUT}/js_results_1_200.json`, JSON.stringify(results));

// ---- numbers asked for ----
const L = t42.log, A = L.filter((r) => r.accepted);
const cnt = (a, f) => a.filter(f).length;
console.log("seed 42, 60 moves: accepted", t42.accepted, "rejected", t42.rejected, "best", t42.hpwl, "final", t42.finalHpwl, "round1", round1(t42.hpwl));
console.log("accepted: improve(d<0)", cnt(A, (r) => r.dHpwl < 0), "worsen(d>0)", cnt(A, (r) => r.dHpwl > 0), "zero(d==0)", cnt(A, (r) => r.dHpwl === 0), "|d|<1e-9 but !=0", cnt(A, (r) => r.dHpwl !== 0 && Math.abs(r.dHpwl) < 1e-9));
console.log("all 60: d<0", cnt(L, (r) => r.dHpwl < 0), "d>0", cnt(L, (r) => r.dHpwl > 0), "d==0", cnt(L, (r) => r.dHpwl === 0));
console.log("rejected are all d>0:", L.filter((r) => !r.accepted).every((r) => r.dHpwl > 0));
console.log("moves hitting -1..9 clamp (proposals):", cnt(L, (r) => r.clamped), " of which accepted:", cnt(A, (r) => r.clamped), " clamped moves:", L.filter((r) => r.clamped).map((r) => `${r.move}:${r.cell}${r.axis}${r.proposed.toFixed(2)}->${r.after}${r.accepted ? "" : "(rej)"}`).join(" "));
console.log("new-best moves:", L.filter((r) => r.newBest).map((r) => `${r.move}:${r.best.toFixed(3)}`).join(" "));
const lastBest = L.filter((r) => r.newBest).at(-1);
console.log("best", t42.hpwl, "reached at move", lastBest.move, "; final == best:", t42.finalHpwl === t42.hpwl, "; moves with hpwl>best after that:", cnt(L.filter((r) => r.move > lastBest.move), (r) => r.hpwl > r.best));
console.log("proposals on A/D:", cnt(L, (r) => r.cell === "A" || r.cell === "D"), " accepted on A/D:", cnt(A, (r) => r.cell === "A" || r.cell === "D"), " per cell proposed:", JSON.stringify(Object.fromEntries(CELLS.map((c) => [c, cnt(L, (r) => r.cell === c)]))), " accepted:", JSON.stringify(Object.fromEntries(CELLS.map((c) => [c, cnt(A, (r) => r.cell === c)]))));
console.log("A,D end positions:", JSON.stringify(t42.positions.A), JSON.stringify(t42.positions.D), "(start (0,0) and (8,8))");
console.log("accepted worsenings:", A.filter((r) => r.dHpwl > 0).map((r) => `m${r.move} d=${r.dHpwl.toFixed(3)} T=${r.T.toFixed(3)} p=${r.pAccept.toFixed(3)} u=${r.u.toFixed(3)}`).join(" | "));
console.log("rejected:", L.filter((r) => !r.accepted).map((r) => `m${r.move} d=${r.dHpwl.toFixed(2)} T=${r.T.toFixed(2)} p=${r.pAccept.toFixed(2)} u=${r.u.toFixed(2)}`).join(" | "));
console.log("random draws consumed: ", 4 * 60 - 0 + L.filter((r) => r.u !== null).length, "(4 per move incl. cell,axis,sign,mag = 4; +1 if d>0)");
console.log("T0=3, T after 60 =", (3 * 0.94 ** 60).toFixed(4), "; history:", JSON.stringify(t42.history.map((h) => [round1(h.hpwl), +h.T.toFixed(3)])));

// ---- variants ----
const v = (name, o) => { const r = trace(STARTER_PLACEMENT, { seed: 42, ...o }); console.log(`variant ${name}: best ${r.hpwl.toFixed(3)} final ${r.finalHpwl.toFixed(3)} acc ${r.accepted} rej ${r.rejected}`); return r; };
v("strict d<0 (always draw when d>=0)", { strict: true });
v("no pads moved (B,C,E,F only)", { cells: ["B", "C", "E", "F"] });
v("300 moves", { moves: 300 });
v("1000 moves", { moves: 1000 });
v("moves 0", { moves: 0 });
const real300 = saPlace(STARTER_PLACEMENT, { seed: 42, moves: 300 });
console.log("real saPlace 300 moves:", real300.hpwl, "acc", real300.accepted, "rej", real300.rejected);
const one = Object.fromEntries(CELLS.map((c) => [c, { x: 4, y: 4 }]));
console.log("all cells on one point: HPWL", totalHpwl(NETS, one));
const OV = { A: { x: 4, y: 4 }, B: { x: 4, y: 4 }, C: { x: 4, y: 4 }, D: { x: 7, y: 1 }, E: { x: 1, y: 7 }, F: { x: 7, y: 7 } };
console.log("OVERLAP_PLACEMENT HPWL", totalHpwl(NETS, OV));

// ---- seeds 1..200 ----
const hs = Object.entries(results).map(([s, r]) => ({ s: +s, h: r.hpwl, f: r.finalHpwl, a: r.accepted }));
const min = hs.reduce((a, b) => (b.h < a.h ? b : a)), max = hs.reduce((a, b) => (b.h > a.h ? b : a));
console.log("seeds 1..200 best HPWL: min", min.h.toFixed(4), "seed", min.s, " max", max.h.toFixed(4), "seed", max.s);
const sorted = hs.map((x) => x.h).sort((a, b) => a - b);
console.log("median", sorted[99].toFixed(2), " seeds with best==52 (never improved):", hs.filter((x) => x.h === 52).length, " seeds < 49.575:", hs.filter((x) => x.h < t42.hpwl).length, " seeds > 49.575:", hs.filter((x) => x.h > t42.hpwl).length, " seeds < 14:", hs.filter((x) => x.h < 14).length);
console.log("seeds where final > best (best!=final):", hs.filter((x) => x.f > x.h + 1e-12).length, " e.g.", hs.filter((x) => x.f > x.h + 1e-12).slice(0, 12).map((x) => `${x.s}(best ${x.h.toFixed(2)},final ${x.f.toFixed(2)})`).join(" "));
console.log("accepted counts: min", Math.min(...hs.map((x) => x.a)), "max", Math.max(...hs.map((x) => x.a)), " seeds with accepted==44 :", hs.filter((x) => x.a === 44).map((x) => x.s).join(","));
console.log("seed 1..10 best:", hs.slice(0, 10).map((x) => `${x.s}:${x.h.toFixed(2)}`).join(" "));
console.log("seeds with round1(best)==49.6:", hs.filter((x) => round1(x.h) === 49.6).map((x) => x.s).join(","));
// second run from SA best (what pressing Apply SA twice does)
const twice = saPlace(saPlace(STARTER_PLACEMENT, { seed: 42 }).positions, { seed: 42 });
console.log("Apply SA twice (2nd run starts from the first best): best", twice.hpwl, "acc", twice.accepted, "rej", twice.rejected);

// ---- alternative seeds for the lesson ----
for (const sd of [199, 162, 134, 7, 6, 102]) {
  const t = trace(STARTER_PLACEMENT, { seed: sd });
  const nb = t.log.filter((r) => r.newBest).at(-1);
  console.log(`seed ${sd}: best ${t.hpwl.toFixed(3)} (move ${nb ? nb.move : "none: never beat start"}), final ${t.finalHpwl.toFixed(3)}, acc ${t.accepted}/rej ${t.rejected}, improve ${cnt(t.log.filter((r) => r.accepted), (r) => r.dHpwl < 0)} worsen ${cnt(t.log.filter((r) => r.accepted), (r) => r.dHpwl > 0)} zero ${cnt(t.log.filter((r) => r.accepted), (r) => r.dHpwl === 0)}, peak ${Math.max(...t.log.map((r) => r.hpwl)).toFixed(2)}, clamped ${cnt(t.log, (r) => r.clamped)}, A/D accepted ${cnt(t.log.filter((r) => r.accepted), (r) => r.cell === "A" || r.cell === "D")}`);
}
console.log("seeds worse than 42:", hs.filter((x) => x.h > t42.hpwl).map((x) => `${x.s}:${x.h.toFixed(2)}`).join(" "));
const top = [...hs].sort((a, b) => a.h - b.h).slice(0, 5).map((x) => `${x.s}:${x.h.toFixed(2)}`).join(" ");
console.log("best 5 seeds:", top);
