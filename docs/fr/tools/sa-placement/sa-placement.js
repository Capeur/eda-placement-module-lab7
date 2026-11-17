/**
 * SA placement — learner-driven lab (Lab 07).
 *
 * The learner moves cells by hand (drag, click, arrows, typed x and y) or runs the annealer with a seed
 * and a number of moves. The annealer always starts from the starter placement; a manual edit after a
 * run cancels that run's numbers. Challenges read the learner's state on every Check
 * (sa-placement-lab-model.js); the study tally never counts.
 *
 * Drawing is our own SVG (not drawPlacement): one fixed colour per cell id (the checker's COLORS),
 * y up, walls at -1 and 9. Every word shown is in sa-placement-strings.js.
 */
import { createChallengeLab, el, metricsBlock } from "../../assets/clustering-ui.js";
import * as M from "./sa-placement-lab-model.js";
import { T, fmt } from "./sa-placement-strings.js";

const root = document.getElementById("lab-root");

let state = M.createState();
let lastMsg = null;
let lastCheck = null;
const text = { seed: String(M.DEFAULT_RUN.seed), moves: String(M.DEFAULT_RUN.moves), x: "", y: "", better: "", worse: "", free: "", lucky: "" };
let logFilter = "all";

const INK = "#0f172a";
const WALL = "#94a3b8";
const SVGNS = "http://www.w3.org/2000/svg";

function svg(tag, attrs = {}, txt) {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (txt != null) n.textContent = txt;
  return n;
}

const btn = (id, label, cls, onClick, extra = {}) => el("button", { id, className: `btn ${cls}`, type: "button", text: label, onClick, ...extra });

function apply(ctx, res) {
  state = res.state;
  if (res.msg) lastMsg = res.msg;
  lastCheck = null;
  ctx.rerender();
}

/* ---------------- chip view ---------------- */

const U = 40; // px per square
const PAD = 0.7; // squares of margin outside the walls
const LO = M.WALLS.min - PAD;
const HI = M.WALLS.max + PAD;
const SIZE = (HI - LO) * U;
const sx = (x) => (x - LO) * U;
const sy = (y) => (HI - y) * U;
const wx = (px) => px / U + LO;
const wy = (py) => HI - py / U;

function drawFloor(ctx) {
  const pos = state.positions;
  const out = svg("svg", { viewBox: `0 0 ${SIZE} ${SIZE}`, class: "sa-svg", id: "sa-floor", role: "img", "aria-label": T.floorCaption });
  out.append(svg("rect", { x: 0, y: 0, width: SIZE, height: SIZE, fill: "#ffffff", class: "sa-bg" }));
  const w0 = M.WALLS.min;
  const w1 = M.WALLS.max;
  out.append(svg("rect", { x: sx(w0), y: sy(w1), width: (w1 - w0) * U, height: (w1 - w0) * U, fill: "#f8fafc", class: "sa-bg" }));
  for (let v = w0 + 1; v < w1; v++) {
    out.append(svg("line", { x1: sx(v), y1: sy(w0), x2: sx(v), y2: sy(w1), stroke: "#e2e8f0", class: "sa-bg" }));
    out.append(svg("line", { x1: sx(w0), y1: sy(v), x2: sx(w1), y2: sy(v), stroke: "#e2e8f0", class: "sa-bg" }));
  }
  for (let v = w0; v <= w1; v++) {
    out.append(svg("text", { x: sx(v), y: sy(w0) + 18, class: "sa-tick" }, String(v)));
    out.append(svg("text", { x: sx(w0) - 15, y: sy(v) + 1, class: "sa-tick" }, String(v)));
  }
  // chip outline 0..8 and the walls -1..9
  const c0 = M.CHIP.min;
  const c1 = M.CHIP.max;
  out.append(svg("rect", { x: sx(c0), y: sy(c1), width: (c1 - c0) * U, height: (c1 - c0) * U, fill: "none", stroke: "#334155", "stroke-width": 1.4, "stroke-dasharray": "3 4", class: "sa-chip" }));
  out.append(svg("rect", { x: sx(w0), y: sy(w1), width: (w1 - w0) * U, height: (w1 - w0) * U, fill: "none", stroke: WALL, "stroke-width": 6, class: "sa-walls" }));

  // net boxes (dashed), each drawn a little outside the true box (net i by 3 + 2i px), so two boxes on the
  // same edge both show and a flat box (height 0) is still a thin rectangle
  for (const b of M.netBoxes(pos)) {
    const o = 3 + b.i * 2;
    const c = M.NET_COLORS[b.i];
    if (b.w === 0 && b.h === 0) {
      out.append(svg("circle", { cx: sx(b.x0), cy: sy(b.y0), r: 20 + b.i * 2, fill: "none", stroke: c, "stroke-width": 1.5, "stroke-dasharray": "5 4", class: "sa-net", "data-net": b.i }));
      continue;
    }
    out.append(svg("rect", {
      x: sx(b.x0) - o, y: sy(b.y1) - o, width: b.w * U + 2 * o, height: b.h * U + 2 * o,
      fill: "none", stroke: c, "stroke-width": 2, "stroke-dasharray": "7 5", class: "sa-net", "data-net": b.i,
    }));
  }

  // cells, A first, so F is on top; cells on the same point get a "×n" tag
  for (const id of M.CELLS) {
    const p = pos[id];
    const g = svg("g", { class: "sa-cell", "data-id": id });
    if (state.selected === id) g.append(svg("circle", { cx: sx(p.x), cy: sy(p.y), r: 19, fill: "none", stroke: "#f59e0b", "stroke-width": 4, class: "sa-sel" }));
    g.append(svg("circle", { cx: sx(p.x), cy: sy(p.y), r: 14, fill: M.COLORS[id], stroke: INK, "stroke-width": 1.5, class: "sa-dot" }));
    g.append(svg("text", { x: sx(p.x), y: sy(p.y) + 1, class: "sa-cell-label" }, id));
    g.append(svg("title", {}, `${id} (${p.x}, ${p.y})`));
    out.append(g);
  }
  for (const grp of M.stacks(pos)) {
    const p = pos[grp[0]];
    out.append(svg("text", { x: sx(p.x) + 24, y: sy(p.y) - 16, class: "sa-stack" }, `${grp.join("")} ${T.stackTag(grp.length)}`));
  }
  wireDrag(ctx, out);
  return out;
}

/** Drag a cell; or click a cell to pick it, then click the floor to put it there. */
function wireDrag(ctx, out) {
  let drag = null;
  const toSvg = (ev) => {
    const pt = out.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    return pt.matrixTransform(out.getScreenCTM().inverse());
  };
  out.addEventListener("pointerdown", (ev) => {
    const g = ev.target.closest("g.sa-cell");
    const p = toSvg(ev);
    drag = { id: g ? g.dataset.id : null, g, x0: p.x, y0: p.y, moved: false };
    if (g && out.setPointerCapture) out.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });
  out.addEventListener("pointermove", (ev) => {
    if (!drag || !drag.g) return;
    const p = toSvg(ev);
    const dx = p.x - drag.x0;
    const dy = p.y - drag.y0;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    if (drag.moved) drag.g.setAttribute("transform", `translate(${dx} ${dy})`);
  });
  out.addEventListener("pointerup", (ev) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    const p = toSvg(ev);
    if (d.id && d.moved) {
      const q = state.positions[d.id];
      apply(ctx, M.moveCell(state, d.id, q.x + (p.x - d.x0) / U, q.y - (p.y - d.y0) / U));
    } else if (d.id) {
      apply(ctx, M.select(state, d.id));
    } else {
      apply(ctx, M.moveCell(state, state.selected, wx(p.x), wy(p.y)));
    }
  });
}

/* ---------------- chart of the run ---------------- */

function drawChart() {
  const W = SIZE;
  const H = 210;
  const ml = 34;
  const mr = 12;
  const mt = 12;
  const mb = 26;
  const out = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "sa-svg", id: "sa-chart", role: "img", "aria-label": T.chartCaption });
  out.append(svg("rect", { x: 0, y: 0, width: W, height: H, fill: "#ffffff" }));
  const r = state.run;
  if (!r) {
    out.append(svg("text", { x: W / 2, y: H / 2, class: "sa-note" }, state.cancelled ? T.chartCancelled : T.chartEmpty));
    return out;
  }
  const top = Math.max(r.start, ...r.log.map((x) => x.hpwl)) * 1.08;
  const X = (m) => ml + (m / r.moves) * (W - ml - mr);
  const Y = (v) => mt + (1 - v / top) * (H - mt - mb);
  for (let v = 0; v <= top; v += 20) {
    out.append(svg("line", { x1: ml, y1: Y(v), x2: W - mr, y2: Y(v), stroke: "#eef2f7" }));
    out.append(svg("text", { x: ml - 14, y: Y(v) + 1, class: "sa-tick" }, String(v)));
  }
  out.append(svg("text", { x: X(0), y: H - 8, class: "sa-tick" }, "0"));
  out.append(svg("text", { x: X(r.moves) - 8, y: H - 8, class: "sa-tick" }, String(r.moves)));
  out.append(svg("text", { x: (ml + W - mr) / 2, y: H - 8, class: "sa-tick" }, T.chartAxisMoves));
  out.append(svg("line", { x1: ml, y1: Y(r.start), x2: W - mr, y2: Y(r.start), stroke: "#64748b", "stroke-dasharray": "4 4", class: "sa-start-line" }));
  const cur = [[0, r.start], ...r.log.map((x) => [x.move, x.hpwl])];
  const best = [[0, r.start], ...r.log.map((x) => [x.move, x.best])];
  const line = (pts) => pts.map(([m, v]) => `${X(m).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  out.append(svg("polyline", { points: line(cur), fill: "none", stroke: "#1d4ed8", "stroke-width": 1.8, class: "sa-cur" }));
  out.append(svg("polyline", { points: line(best), fill: "none", stroke: "#15803d", "stroke-width": 2.4, "stroke-dasharray": "6 3", class: "sa-best" }));
  if (r.bestMove) out.append(svg("circle", { cx: X(r.bestMove), cy: Y(r.best), r: 5, fill: "#15803d", class: "sa-best-dot" }));
  out.append(svg("circle", { cx: X(r.moves), cy: Y(r.final), r: 4, fill: "#1d4ed8", stroke: "#ffffff", class: "sa-final-dot" }));
  return out;
}

function select(id, aria, options, value, onChange) {
  const s = el("select", { id, "aria-label": aria, className: "sa-select", onChange: (e) => onChange(e.target.value) });
  for (const [v, label] of options) {
    const o = el("option", { value: v, text: label });
    if (v === value) o.selected = true;
    s.append(o);
  }
  return s;
}

function logBlock() {
  const r = state.run;
  if (!r) return null;
  const rows = r.log.filter((x) => (logFilter === "accepted" ? x.accepted : logFilter === "rejected" ? !x.accepted : true));
  const shown = rows.slice(0, 1000);
  const body = shown.map((x) =>
    el("tr", { className: `sa-${x.kind} ${x.accepted ? "sa-acc" : "sa-rej"}`, "data-move": x.move }, [
      el("td", { text: String(x.move) }),
      el("td", {}, [el("span", { className: "sa-swatch", style: `background:${M.COLORS[x.cell]}` }), x.cell]),
      el("td", { text: T.logPush(x) }),
      el("td", { className: "sa-num", text: fmt.signed(x.dHpwl) }),
      el("td", { className: "sa-num", text: x.T.toFixed(2) }),
      el("td", { className: "sa-num", text: x.dHpwl > 0 ? fmt.pct(x.p) : T.logNoDice }),
      el("td", { className: "sa-num", text: x.u == null ? "—" : x.u.toFixed(2) }),
      el("td", { text: (x.accepted ? T.logAcceptedWord : T.logRejectedWord) + (x.newBest ? T.logNewBest : "") }),
    ]));
  return el("div", { className: "sa-view sa-log" }, [
    el("h3", { className: "sa-h3", text: T.logCaption }),
    el("div", { className: "tool-actions sa-row" }, [
      el("label", { className: "sa-label", text: T.logFilter, for: "sa-log-filter" }),
      select("sa-log-filter", T.logFilter, [["all", T.logAll], ["accepted", T.logAccepted], ["rejected", T.logRejected]], logFilter, (v) => {
        logFilter = v;
        renderLeft();
      }),
    ]),
    el("div", { className: "sa-log-wrap" }, [
      el("table", { className: "sa-table sa-log-table", id: "sa-log" }, [
        el("thead", {}, [el("tr", {}, T.logCols.map((c) => el("th", { text: c })))]),
        el("tbody", {}, body),
      ]),
    ]),
    rows.length > shown.length ? el("p", { className: "sa-muted", text: T.logTooLong(rows.length) }) : null,
  ]);
}

let leftCtx = null;
function renderLeft() {
  const ctx = leftCtx;
  const body = ctx.canvas.parentElement;
  ctx.canvas.style.display = "none";
  body.querySelector(".sa-left")?.remove();
  body.append(el("div", { className: "sa-left" }, [
    el("div", { className: "sa-views" }, [
      el("figure", { className: "sa-view" }, [
        el("figcaption", {}, [T.floorCaption, " · ", el("span", { id: "sa-floor-total", className: "sa-total", text: T.totalLabel(M.total(state.positions)) })]),
        drawFloor(ctx),
        el("p", { className: "sa-legend" }, [T.floorLegendNets, el("br"), T.floorLegendWalls, el("br"), T.floorLegendDrag]),
      ]),
      el("figure", { className: "sa-view" }, [
        el("figcaption", { text: T.chartCaption }),
        drawChart(),
        el("p", { className: "sa-legend" }, [
          el("span", { className: "sa-key sa-key-cur" }), T.chartLegendCur, el("br"),
          el("span", { className: "sa-key sa-key-best" }), T.chartLegendBest, el("br"),
          el("span", { className: "sa-key sa-key-start" }), T.chartLegendStart,
        ]),
        logBlock(),
      ]),
    ]),
  ]));
}

/* ---------------- right panel ---------------- */

function input(id, key, aria, cls, onEnter) {
  return el("input", {
    id, type: "text", className: `sa-input ${cls || ""}`, "aria-label": aria, value: text[key],
    onInput: (e) => {
      text[key] = e.target.value;
    },
    onKeydown: (e) => {
      if (e.key === "Enter" && onEnter) onEnter();
    },
  });
}

function renderRight(ctx) {
  const pos = state.positions;
  const row = (items) => el("div", { className: "tool-actions sa-row" }, items);
  const cells = M.CELLS.map((id) =>
    btn(`sa-cell-${id}`, id, state.selected === id ? "btn-primary" : "btn-secondary", () => apply(ctx, M.select(state, id)), {
      "aria-label": T.cellAria(id), style: `border-left: 6px solid ${M.COLORS[id]}`,
    }));
  const nud = (dir, label, dx, dy) => btn(`sa-nudge-${dir}`, label, "btn-ghost", () => apply(ctx, M.nudge(state, dx, dy)), { "aria-label": T.nudgeAria[dir] });
  const put = () => apply(ctx, M.putAt(state, text.x, text.y));
  const saveCount = () => apply(ctx, M.saveCount(state, text.better, text.worse, text.free));
  const saveLucky = () => apply(ctx, M.saveLucky(state, text.lucky));

  const nets = el("table", { className: "sa-table", id: "sa-nets" }, [
    el("thead", {}, [el("tr", {}, T.netCols.map((c) => el("th", { text: c })))]),
    el("tbody", {}, M.netBoxes(pos).map((b) => el("tr", {}, [
      el("td", {}, [el("span", { className: "sa-swatch sa-swatch-net", style: `border-color:${M.NET_COLORS[b.i]}` }), `n${b.i}`]),
      el("td", { text: b.net.join(" ") }),
      el("td", { className: "sa-num", text: T.netRow(b) }),
    ]))),
  ]);

  const r = state.run;
  const runBox = el("div", { id: "sa-run-info" }, [
    metricsBlock(r ? T.runLines(r, state.view) : [state.cancelled ? T.runCancelled(state.cancelled) : T.runNone]),
  ]);
  if (r) {
    runBox.append(M.tallyVisible(state)
      ? el("p", { className: "sa-tally", id: "sa-tally", text: T.tallyLine(r.tally) })
      : el("p", { className: "sa-muted", id: "sa-tally-hidden", text: T.tallyHidden }));
  }

  const parts = [];
  if (lastCheck && lastCheck.id === ctx.state.challengeId && ctx.state.challengeOn) {
    parts.push(el("p", { className: `sa-why ${lastCheck.ok ? "ok" : "no"}`, id: "sa-why" }, [
      el("strong", { text: `${T.checkHead} ` }), T.why[lastCheck.why](lastCheck),
    ]));
  }
  if (lastMsg) parts.push(el("p", { className: "sa-msg", id: "sa-msg", text: T.msg[lastMsg.code](lastMsg) }));
  parts.push(
    row([el("span", { className: "sa-label", text: T.selectedLabel }), ...cells]),
    row([nud("left", T.nudgeLeft, -1, 0), nud("right", T.nudgeRight, 1, 0), nud("up", T.nudgeUp, 0, 1), nud("down", T.nudgeDown, 0, -1)]),
    row([el("span", { className: "sa-label", text: T.putLabel }), input("sa-put-x", "x", T.putXAria, "sa-small", put),
      input("sa-put-y", "y", T.putYAria, "sa-small", put), btn("sa-put", T.putBtn, "btn-secondary", put)]),
    el("h3", { className: "sa-h3", text: T.netsHead }),
    nets,
    metricsBlock([T.totalLine(M.total(pos)), T.closestLine(M.closestPair(pos)), state.origin === "starter" ? T.originStarter(state.edits) : T.originRun]),
    el("h3", { className: "sa-h3", text: T.runHead }),
    runBox,
    el("h3", { className: "sa-h3", text: T.countHead }),
    el("p", { className: "sa-muted", text: T.countHelp }),
    row([
      el("span", { className: "sa-label", text: T.countBetter }), input("sa-count-better", "better", T.countBetter, "sa-small", saveCount),
      el("span", { className: "sa-label", text: T.countWorse }), input("sa-count-worse", "worse", T.countWorse, "sa-small", saveCount),
      el("span", { className: "sa-label", text: T.countFree }), input("sa-count-free", "free", T.countFree, "sa-small", saveCount),
    ]),
    row([btn("sa-save-count", T.countBtn, "btn-secondary", saveCount)]),
    state.count ? el("p", { className: "sa-muted", id: "sa-count-shown", text: T.countShown(state.count) }) : null,
    el("h3", { className: "sa-h3", text: T.luckyHead }),
    el("p", { className: "sa-muted", text: T.luckyHelp }),
    row([input("sa-lucky", "lucky", T.luckyAria, "sa-small", saveLucky), btn("sa-save-lucky", T.luckyBtn, "btn-secondary", saveLucky)]),
    state.lucky ? el("p", { className: "sa-muted", id: "sa-lucky-shown", text: T.luckyShown(state.lucky) }) : null,
  );
  ctx.metrics.innerHTML = "";
  ctx.metrics.append(el("div", { className: "sa-right" }, parts.filter(Boolean)));
}

function renderWorkspace(ctx) {
  const heads = root.querySelectorAll(".tool-layout .panel-head h2");
  if (heads[0]) heads[0].textContent = T.panelLeft;
  if (heads[1]) heads[1].textContent = T.panelRight;
  leftCtx = ctx;
  renderLeft();
  renderRight(ctx);
}

/* ---------------- run controls above the workspace ---------------- */

function extraActions(ctx) {
  const run = () => apply(ctx, M.doRun(state, text.seed, text.moves));
  const view = (v) => btn(`sa-view-${v}`, v === "best" ? T.viewBest : T.viewFinal, state.run && state.view === v ? "btn-primary" : "btn-ghost",
    () => apply(ctx, M.setView(state, v)), { disabled: !state.run });
  return [
    el("label", { className: "sa-label", text: T.seedLabel, for: "sa-seed" }), input("sa-seed", "seed", T.seedAria, "sa-small", run),
    el("label", { className: "sa-label", text: T.movesLabel, for: "sa-moves" }), input("sa-moves", "moves", T.movesAria, "sa-small", run),
    btn("sa-run", T.runBtn, "btn-primary", run),
    btn("sa-preset", T.presetBtn, "btn-secondary", () => {
      text.seed = String(M.DEFAULT_RUN.seed);
      text.moves = String(M.DEFAULT_RUN.moves);
      apply(ctx, M.doPreset(state));
    }),
    btn("sa-reset", T.resetBtn, "btn-ghost", () => apply(ctx, M.doReset(state))),
    el("span", { className: "sa-label", text: T.showLabel }), view("best"), view("final"),
    btn("sa-tally-btn", T.tallyBtn, "btn-ghost", () => apply(ctx, M.showTally(state)), { disabled: !state.run }),
  ];
}

/* ---------------- challenges (all read the learner's state) ---------------- */

function fresh() {
  state = M.createState();
  lastMsg = null;
  lastCheck = null;
  for (const k of ["x", "y", "better", "worse", "free", "lucky"]) text[k] = "";
}

const challenges = M.CHALLENGES.map((c) => ({
  id: c.id,
  level: c.level,
  ...T.challenges[c.id],
  setup: () => fresh(),
  check: () => {
    const r = M.checkChallenge(c.id, state);
    lastCheck = { id: c.id, ...r };
    return r.ok;
  },
}));

createChallengeLab(root, {
  starterButtonLabel: T.starterButton,
  idlePromptHtml: T.idlePrompt,
  starterHtml: T.starterHtml,
  challenges,
  loadStarter: () => fresh(),
  extraActions,
  renderWorkspace,
});
