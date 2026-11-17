/* lesson-engine.js (v5) — animated, narrated lesson player for eda-learning labs.
 *
 * LessonEngine.mount({ sb, timing, lang, audioId?, rootId?, ui?, storageKey? })
 *   sb      storyboard (see reference/storyboard.md). sb.scene picks what is drawn on the stage:
 *             "graph"     (default) nodes, weighted edges, splits, cut counter, balance bars   (partitioning labs)
 *             "floorplan" a B*-tree next to a floor of rectangles: blocks drop in walk order onto the skyline,
 *                         swap / turn / move, bounding box, wasted squares, fits-the-outline     (floorplanning labs)
 *             "placement" cells on a chip floor with their nets, and a simulated-annealing run replayed move by
 *                         move: proposed move, change in wirelength, dice, thermometer, tally, chart (placement labs)
 *   timing  { lang, duration, sentences: [{ slide, text, start, end, words: [{ w, t }] }] }
 *           made by scripts/voice_build.py (edge-tts word timings) or scripts/timing_from_vtt.py
 *   lang    "en" | "fr": picks the anchor word and the text of every overlay
 *
 * Everything on screen is a pure function of the audio time t, so seeking, speed changes and frame-by-frame
 * recording all show the same picture. A new key in a track starts from wherever the previous move had got to
 * (no jumps). window.__lesson exposes the internals the checker uses.
 *
 * Layout of this file: helpers · mount() = the core (timing, anchors, tracks, show windows, overlays, captions,
 * transport, question, diagnostics) · SCENES.graph · SCENES.floorplan · SCENES.placement. A scene gets a context object `cx` from the
 * core and returns hooks (see "scene contract" in mount).
 */
(function () {
  "use strict";

  const I18N = {
    en: {
      play: "Play", pause: "Pause", position: "Position in the lesson", speed: "Playback speed", captions: "CC",
      chapters: "Chapters", yourSplit: "Your split", back: "Back to the lesson", subtitles: "Subtitles", subsOff: "Off", sfx: "Sounds",
      paused: "Paused. You are building your own split.", turn: "Pause and guess",
      deal: "Deal a random split with seed", dealBtn: "Deal",
      clickHint: "Or click the nodes on the stage to move them from one side to the other.",
      noSplit: "No split yet. Deal a seed or click a node.", noSplitNoDeal: "No split yet. Click a node to start.",
      backMsg: "Back in the lesson. Click a node to try again.",
      cut: "cut", sides: "sides", legal: "legal", notLegal: "not legal: at most {cap} per side",
      toPlace: "still to place: {list}", cutsize: "cutsize", perSide: "cells per side", max: "max {cap}",
      think: "Take a moment to think, then pick one.", seed: "Seed {s}: ", yours: "Your split: ",
      cell: "Cell {n}: click to move it to the other side", lesson: "Animated lesson", graph: "Graph",
      verdictYes: "legal", verdictNo: "not legal",
      // floorplan scene
      fpStage: "B*-tree and floorplan", yourTree: "Your tree", fpPaused: "Paused. You are changing the tree.",
      fpHint: "Pick a move, then click the blocks (on the floor or in the tree).",
      fpStart: "Click a block to start. The lesson pauses while you try.",
      fpBack: "Back in the lesson. Click a block to try again.",
      opSwap: "Swap two", opTurn: "Turn one", opMove: "Move a leaf", opReset: "Start again",
      pickSecond: "{a} picked. Click the block to swap it with.", swapped: "Swapped {a} and {b}. ",
      turned: "Turned {a}. ", pickLeaf: "{a} has children: pick a leaf (a block with no child).",
      pickTarget: "{a} picked. Click the block it should hang from.", moved: "Moved {a} under {b} ({side}). ",
      noSlot: "{b} has no free slot. Pick another block.", sameBlock: "That is the same block.",
      tree: "tree", box: "bounding box", wasted: "wasted", fits: "fits the {w} × {h} outline",
      sticks: "sticks out of the {w} × {h} outline", sideLeft: "next door", sideRight: "upstairs",
      nextDoor: "next door", upstairs: "upstairs", blockAria: "Block {n}: click to use it in your move",
      mArea: "bounding box", mWidth: "width", mHeight: "height", mWasted: "wasted squares", mX: "{n}.x", mY: "{n}.y",
    },
    fr: {
      play: "Lecture", pause: "Pause", position: "Position dans la leçon", speed: "Vitesse de lecture", captions: "ST",
      chapters: "Chapitres", yourSplit: "Votre partition", back: "Revenir à la leçon", subtitles: "Sous-titres", subsOff: "Aucun", sfx: "Sons",
      paused: "En pause. Vous construisez votre propre partition.", turn: "Faites une pause et devinez",
      deal: "Distribuer une partition au hasard avec la graine", dealBtn: "Distribuer",
      clickHint: "Ou cliquez sur les nœuds de la scène pour les changer de côté.",
      noSplit: "Pas encore de partition. Distribuez une graine ou cliquez sur un nœud.",
      noSplitNoDeal: "Pas encore de partition. Cliquez sur un nœud pour commencer.",
      backMsg: "De retour dans la leçon. Cliquez sur un nœud pour réessayer.",
      cut: "coupe", sides: "côtés", legal: "valide", notLegal: "non valide : {cap} au plus par côté",
      toPlace: "reste à placer : {list}", cutsize: "taille de coupe", perSide: "cellules par côté", max: "max {cap}",
      think: "Prenez un moment pour réfléchir, puis choisissez.", seed: "Graine {s} : ", yours: "Votre partition : ",
      cell: "Cellule {n} : cliquez pour la changer de côté", lesson: "Leçon animée", graph: "Graphe",
      verdictYes: "valide", verdictNo: "non valide",
      fpStage: "Arbre B* et plan de masse", yourTree: "Votre arbre", fpPaused: "En pause. Vous modifiez l'arbre.",
      fpHint: "Choisissez un geste, puis cliquez sur les blocs (au sol ou dans l'arbre).",
      fpStart: "Cliquez sur un bloc pour commencer. La leçon se met en pause pendant l'essai.",
      fpBack: "De retour dans la leçon. Cliquez sur un bloc pour réessayer.",
      opSwap: "Échanger deux", opTurn: "Tourner un bloc", opMove: "Déplacer une feuille", opReset: "Recommencer",
      pickSecond: "{a} choisi. Cliquez sur le bloc à échanger avec lui.", swapped: "{a} et {b} échangés. ",
      turned: "{a} tourné. ", pickLeaf: "{a} a des enfants : choisissez une feuille (un bloc sans enfant).",
      pickTarget: "{a} choisi. Cliquez sur le bloc auquel l'accrocher.", moved: "{a} accroché sous {b} ({side}). ",
      noSlot: "{b} n'a plus de place libre. Choisissez un autre bloc.", sameBlock: "C'est le même bloc.",
      tree: "arbre", box: "boîte englobante", wasted: "perdu", fits: "tient dans le contour {w} × {h}",
      sticks: "dépasse du contour {w} × {h}", sideLeft: "à côté", sideRight: "à l'étage",
      nextDoor: "à côté", upstairs: "à l'étage", blockAria: "Bloc {n} : cliquez pour l'utiliser dans votre geste",
      mArea: "boîte englobante", mWidth: "largeur", mHeight: "hauteur", mWasted: "cases perdues", mX: "{n}.x", mY: "{n}.y",
    },
  };

  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = (p) => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (w) => w.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  /** Keys a spoken word can be matched by: the whole word, and the part after an apostrophe (l'arête → arete). */
  const wordKeys = (w) => { const k = [norm(w)]; const m = w.split(/['’]/); if (m.length > 1) k.push(norm(m[m.length - 1])); return k; };
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (m, k) => (o[k] !== undefined ? o[k] : m));

  const FULL = [0, 0, 960, 540];
  const DUR_CAM = 1.3, DUR_DIM = 0.6;
  const SCENES = {};

  function mount(cfg) {
    const sb = cfg.sb, TM = cfg.timing, lang = cfg.lang || "en";
    const T = Object.assign({}, I18N[lang] || I18N.en, cfg.ui || {});
    const L = (v) => (v == null ? "" : typeof v === "string" ? v : v[lang] != null ? v[lang] : v.en != null ? v.en : "");
    const errors = [];
    const err = (m) => { errors.push(m); console.error("[lesson] " + m); };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const D = reduce ? 0.001 : 1;
    const sceneName = sb.scene || "graph";

    /* ---------------- timing ---------------- */
    const SENT = TM.sentences.map((s) => {
      const words = s.words.map((w) => ({ w: w.w, t: w.t, keys: wordKeys(w.w) }));
      words.forEach((w, i) => { w.e = i + 1 < words.length ? words[i + 1].t : s.end; });
      return Object.assign({}, s, { words });
    });
    const DUR = TM.duration;
    const slideSents = (n) => SENT.filter((s) => s.slide === n);

    function findWords(obj, label) {
      const needle = obj[lang] != null ? obj[lang] : null;
      if (needle == null) { err(`anchor ${label}: no "${lang}" word given`); return null; }
      const [phrase, nthTxt] = String(needle).split("#");
      const nth = nthTxt != null ? parseInt(nthTxt, 10) : obj.nth || 0;
      const toks = phrase.split(/\s+/).map(norm).filter(Boolean);
      const pool = obj.slide != null ? slideSents(obj.slide) : SENT;
      if (!pool.length) { err(`anchor ${label}: slide ${obj.slide} has no narration in this part`); return null; }
      const ws = pool.flatMap((s) => s.words);
      let hit = 0;
      for (let i = 0; i + toks.length <= ws.length; i++) {
        if (toks.every((tk, j) => ws[i + j].keys.some((k) => k.startsWith(tk)))) {
          if (hit++ === nth) return { first: ws[i], last: ws[i + toks.length - 1] };
        }
      }
      err(`anchor ${label}: "${needle}" not found in slide ${obj.slide} (${lang}). Words: ${ws.map((w) => w.w).join(" ")}`);
      return null;
    }
    const anchorCache = new Map();
    function resolve(ref, label = "") {
      if (ref == null) return 0;
      if (typeof ref === "number") return ref;
      const key = typeof ref === "string" ? ref : JSON.stringify(ref);
      if (anchorCache.has(key)) return anchorCache.get(key);
      let t = 0;
      if (typeof ref === "string") {
        const m = ref.trim().match(/^(@[\w-]+|slide:\d+(?::end)?|end|start)\s*(?:([+-])\s*([\d.]+))?$/);
        if (!m) { err(`bad time reference "${ref}" ${label}`); return 0; }
        const shift = m[2] ? (m[2] === "-" ? -1 : 1) * parseFloat(m[3]) : 0;
        const base = m[1];
        if (base[0] === "@") {
          const a = sb.anchors && sb.anchors[base.slice(1)];
          if (!a) { err(`unknown anchor ${base} ${label}`); t = 0; } else t = resolveObj(a, base);
        } else if (base === "end") t = DUR;
        else if (base === "start") t = 0;
        else {
          const [, n, e] = base.split(":");
          const ss = slideSents(+n);
          if (!ss.length) err(`slide ${n} has no narration in this part ${label}`);
          else t = e ? ss[ss.length - 1].end : ss[0].start;
        }
        t += shift;
      } else t = resolveObj(ref, label);
      anchorCache.set(key, t);
      return t;
    }
    function resolveObj(o, label) {
      const hit = findWords(o, label);
      if (!hit) { const ss = o.slide != null ? slideSents(o.slide) : []; return (ss[0] ? ss[0].start : 0) + (o.shift || 0); }
      return (o.edge === "end" ? hit.last.e : hit.first.t) + (o.shift || 0);
    }

    /* ---------------- text markup: {piece@ref} appears at its own time, **x** accent, !!x!! red, ##x## number --- */
    function md(s) {
      let h = esc(s);
      h = h.replace(/\{([^{}@]+)@([^{}]+)\}/g, (m, piece, ref) => {
        ref = ref.trim();
        if (!/^(slide:|start|end|@)/.test(ref)) ref = "@" + ref; // {piece@name} means the anchor @name
        return `<span data-a="${resolve(ref, `(text "${piece}")`).toFixed(3)}">${piece}</span>`;
      });
      h = h.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/!!(.+?)!!/g, '<span class="red">$1</span>').replace(/##(.+?)##/g, '<span class="num">$1</span>');
      return h;
    }

    /* ---------------- scene contract ----------------
     * SCENES[name](cx) returns {
     *   tracks: { name: { init, conv(v)->value, dur, mix(a,b,p)|null (null = step track) } }   (in key order)
     *   claims: [{ claim, got, ok }]
     *   ready()                          after tracks and show windows exist (cx.track, cx.seg, cx.win are usable)
     *   svgLabel, bannerText, pausedText
     *   benchHtml()                      HTML of the "your turn" box below the question (must hold .readout)
     *   buildSvg()                       draw the scene's SVG under the overlays
     *   buildWidgets()                   counters etc. on top of the overlays (cx.widget)
     *   render(t, free)                  draw the scene at time t (free = the scene's own try-it state or null)
     *   bindBench()                      wire the bench buttons and stage clicks
     *   thumb(item)                      HTML for one "thumbs" overlay item
     *   boxes(stageRect, sx, sy, cam)    [{ kind: "node", label, x, y, w, h }] of what text must not cover
     *   freeCamera                       camera used while the learner tries (default FULL)
     *   leaveFree()                      called when the lesson resumes
     * } */
    const cx = { sb, lang, T, L, err, resolve, md, esc, fill, D, reduce, lerp, ease, clamp, FULL, FREE: null };
    if (!SCENES[sceneName]) { err(`unknown scene "${sceneName}"`); }
    const scene = (SCENES[sceneName] || SCENES.graph)(cx);
    const claims = scene.claims || [];

    /* ---------------- tracks ---------------- */
    const cam = (v) => {
      if (v == null || v === "full") return FULL;
      const c = sb.cameras && sb.cameras[v] != null ? sb.cameras[v] : v;
      if (!Array.isArray(c) || c.length !== 3) { err(`bad camera ${JSON.stringify(v)}`); return FULL; }
      const [cxx, cy, w0] = c, w = Math.min(w0, 960), h = (w * 9) / 16;
      return [clamp(cxx - w / 2, 0, 960 - w), clamp(cy - h / 2, 0, 540 - h), w, h]; // a shot never shows past the scene
    };
    const mixArr = (a, b, p) => a.map((v, i) => lerp(v, b[i], p));
    cx.mixArr = mixArr;
    const SPEC = Object.assign({}, scene.tracks);
    // camera and dim are common to every scene; keep the scene's order (it decides the checker's report order)
    if (!SPEC.camera) SPEC.camera = { init: "full", conv: cam, dur: DUR_CAM, mix: mixArr };
    if (!SPEC.dim) SPEC.dim = { init: 1, conv: (v) => +v, dur: DUR_DIM, mix: lerp };
    for (const k of Object.keys(SPEC)) if (SPEC[k].conv === "camera") SPEC[k].conv = cam;
    const init = {};
    for (const k of Object.keys(SPEC)) init[k] = SPEC[k].init;
    Object.assign(init, sb.initial || {});
    const tracks = {};
    for (const k of Object.keys(SPEC)) tracks[k] = [[0, SPEC[k].conv(init[k]), "initial"]];
    (sb.timeline || []).forEach((item, i) => {
      const t = resolve(item.at, `(timeline #${i})`);
      let used = false;
      for (const k of Object.keys(SPEC)) if (k in item) { tracks[k].push([t, SPEC[k].conv(item[k]), item.at]); used = true; }
      for (const k of Object.keys(item)) if (k !== "at" && !(k in SPEC)) err(`timeline #${i}: unknown key "${k}" for the ${sceneName} scene`);
      if (!used) err(`timeline #${i}: nothing to change`);
    });
    for (const k of Object.keys(tracks)) tracks[k].sort((a, b) => a[0] - b[0]);

    const memo = new Map();
    function sampler(name, dur, mix) {
      if (memo.has(name)) return memo.get(name);
      const list = tracks[name], startVal = [];
      const valAt = (t) => {
        let i = -1;
        for (let k = 0; k < list.length; k++) { if (list[k][0] <= t) i = k; else break; }
        if (i <= 0) return list[0][1];
        if (startVal[i] === undefined) startVal[i] = valAt(list[i][0] - 1e-6);
        return mix(startVal[i], list[i][1], ease((t - list[i][0]) / (dur * D)));
      };
      memo.set(name, valAt);
      return valAt;
    }
    /** A track's value at t (interpolated), or for step tracks the segment { cur, prev, t0, i }. */
    cx.track = (name) => sampler(name, SPEC[name].dur, SPEC[name].mix);
    cx.seg = (name, t) => {
      const list = tracks[name]; let i = 0;
      for (let k = 0; k < list.length; k++) if (list[k][0] <= t) i = k;
      return { cur: list[i][1], prev: i > 0 ? list[i - 1][1] : list[i][1], t0: list[i][0], i };
    };
    cx.keys = (name) => tracks[name];
    const camAt = cx.track("camera");

    /* ---------------- show windows ---------------- */
    const WIN = {};
    (sb.show || []).forEach((w, i) => {
      const a = resolve(w.from, `(show ${w.show} #${i})`), b = w.to == null ? 1e9 : resolve(w.to, `(show ${w.show} #${i})`);
      if (b <= a) err(`show ${w.show} #${i}: ends (${b.toFixed(2)}s) before it starts (${a.toFixed(2)}s)`);
      (WIN[w.show] = WIN[w.show] || []).push(Object.assign({}, w, { a, b, edges: (w.edges || []).map((e) => e.replace(/\s/g, "")), stagger: w.stagger || 0 }));
    });
    cx.WIN = WIN;
    cx.win = (name, t) => (WIN[name] || []).find((w) => t >= w.a && t < w.b);
    cx.wins = (name, t) => (WIN[name] || []).filter((w) => t >= w.a && t < w.b);
    if (scene.ready) scene.ready();

    /* ---------------- DOM ---------------- */
    const root = document.getElementById(cfg.rootId || "lesson-root");
    const qa = sb.question;
    root.innerHTML = `
<div class="wrap">
  <header>
    <div class="eyebrow">${esc(L(sb.eyebrow))}</div>
    <h1>${esc(L(sb.title))}</h1>
    ${sb.lede ? `<p class="lede">${L(sb.lede)}</p>` : ""}
  </header>
  <section class="player" aria-label="${esc(T.lesson)}">
    <div class="stage scene-${esc(sceneName)}">
      <svg class="scene" viewBox="0 0 960 540" role="img" aria-label="${esc(scene.svgLabel || T.graph)}"></svg>
      <div class="layer"></div>
      <div class="banner"><b>${esc(scene.bannerText || T.yourSplit)}</b><button class="btn" type="button" data-act="back">${esc(T.back)}</button></div>
    </div>
    <div class="captions" aria-live="off"></div>
    <div class="transport">
      <button class="play" type="button" aria-label="${esc(T.play)}">▶</button>
      <div class="scrub"><input type="range" min="0" max="${DUR}" step="0.01" value="0" aria-label="${esc(T.position)}"><div class="time">0:00 / ${fmt(DUR)}</div></div>
      <div class="opts"><div class="seg" role="group" aria-label="${esc(T.speed)}"></div>${cfg.subs ? `<label class="subsel"><span>${esc(T.subtitles)}</span><select></select></label>` : `<button class="tbtn" type="button" aria-pressed="true">${esc(T.captions)}</button>`}<button class="sbtn" type="button" data-snd="sfx" aria-pressed="true">${esc(T.sfx)}</button></div>
    </div>
  </section>
  <div class="cols">
    <section aria-label="${esc(T.chapters)}"><h2>${esc(T.chapters)}</h2><ul class="chapters"></ul></section>
    <section class="bench" aria-label="${esc(T.turn)}">
      <h2>${esc(T.turn)}</h2>
      ${qa ? `<p>${md(L(qa.text))}</p><div class="row bench-opts"></div><p class="feedback"></p>` : ""}
      ${scene.benchHtml()}
    </section>
  </div>
  ${sb.note ? `<p class="note">${L(sb.note)}</p>` : ""}
</div>`;
    const $ = (sel) => root.querySelector(sel);
    const stage = $(".stage"), svg = $("svg.scene"), layer = $(".layer");
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs = {}, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
    Object.assign(cx, { root, $, stage, svg, layer, mk, NS });
    scene.buildSvg();

    const BUILD = {
      headline: (o) => `<div class="hl"${o.size ? ` style="font-size:${+o.size}cqw"` : ""}>${md(L(o.text))}</div>${o.sub ? `<div class="sub">${md(L(o.sub))}</div>` : ""}`,
      term: (o) => `<div class="term"><span class="t">${md(L(o.text))}</span><span class="d">${md(L(o.sub))}</span></div>`,
      chip: (o) => `<span class="chip">${md(L(o.text))}</span>`,
      tag: (o) => `<div class="tag">${md(L(o.text))}</div>`,
      tags: (o) => `<div class="tags">${o.items.map((it) => `<div class="tag"${it.at ? ` data-a="${resolve(it.at, "(tags)").toFixed(3)}"` : ""}>${md(L(it.text))}</div>`).join("")}</div>`,
      label: (o) => `<span class="label c${o.color || 0}">${md(L(o.text))}</span>`,
      vocab: (o) => `<div class="vocab">${o.items.map((it) => `<div${it.at ? ` data-a="${resolve(it.at, "(vocab)").toFixed(3)}"` : ""}><b>${esc(L(it.k))}</b>${md(L(it.text))}</div>`).join("")}</div>`,
      eq: (o) => `<div class="eq">${md(L(o.text))}</div>`,
      stamp: (o) => `<div class="stamp">${md(L(o.text))}</div>`,
      bigq: (o) => `<div class="bigq"><div class="q">?</div><div class="hl">${md(L(o.text))}</div></div>`,
      compare: (o) => `<div class="cmp">${o.rows.map((r) => `<div class="row ${r.tone || ""}"><span>${md(L(r.label))}</span><span class="k">${md(L(r.value))}</span><span>${md(L(r.note))}</span></div>`).join("")}</div>`,
      thumbs: (o) => `<div class="thumbs">${o.items.map((it) => scene.thumb(it)).join("")}</div>`,
      question: () => `<div class="qcard"><span class="e">${esc(T.turn)}</span><span class="q">${md(L(qa && qa.text))}</span><span class="h qh">${esc(L(qa && qa.hint) || T.think)}</span><span class="qbtns">${(qa ? qa.options : []).map((op, i) => `<button class="btn" type="button" data-q="${i}">${esc(L(op.label))}</button>`).join("")}</span><span class="h qans"></span></div>`,
      html: (o) => L(o.html),
    };
    const OV = (sb.overlays || []).map((o, i) => {
      const lab = `(overlay #${i} ${o.type})`;
      const a = resolve(o.from, lab), b = o.to == null ? 1e9 : resolve(o.to, lab);
      if (b <= a) err(`overlay #${i} (${o.type}) ends (${b.toFixed(2)}s) before it starts (${a.toFixed(2)}s)`);
      const d = document.createElement("div");
      d.className = "ov ov-" + o.type; d.style.left = (o.x || 0) + "%"; d.style.top = (o.y || 0) + "%";
      if (o.width) d.style.width = o.width + "cqw";
      if (!BUILD[o.type]) err(`overlay #${i}: unknown type ${o.type}`);
      d.innerHTML = BUILD[o.type] ? BUILD[o.type](o) : "";
      layer.appendChild(d);
      const label = (d.textContent || "").trim().replace(/\s+/g, " ").slice(0, 48);
      return { a, b, d, label, type: o.type, parts: [...d.querySelectorAll("[data-a]")].map((e) => ({ e, t: +e.dataset.a })) };
    });
    cx.widget = (cls, pos, html) => {
      const d = document.createElement("div"); d.className = "ov " + cls; d.style.left = pos.x + "%"; d.style.top = pos.y + "%";
      d.innerHTML = html; layer.appendChild(d); return d;
    };
    const widgetEls = scene.buildWidgets() || [];

    /* ---------------- render ---------------- */
    let lastCam = FULL;
    const setOp = (el, v) => { el.style.opacity = v; };
    const fadeIn = reduce ? 0.01 : 0.35, fadeOut = reduce ? 0.01 : 0.25;
    function ovStyle(el, t, a, b) {
      const on = t >= a && t < b, o = on ? Math.min(clamp((t - a) / fadeIn), clamp((b - t) / fadeOut)) : 0;
      el.style.opacity = o;
      el.style.transform = on && !reduce ? `translateY(${((1 - ease((t - a) / 0.5)) * 0.8).toFixed(3)}cqw)` : "none";
      return on;
    }
    Object.assign(cx, { setOp, ovStyle });
    function render(t) {
      const F = cx.FREE;
      const C = F ? (scene.freeCamera || FULL) : camAt(t);
      lastCam = C;
      svg.setAttribute("viewBox", C.map((v) => v.toFixed(1)).join(" "));
      scene.render(t, F, "scene");
      for (const o of OV) {
        const on = !F && ovStyle(o.d, t, o.a, o.b);
        if (F) { o.d.style.opacity = 0; }
        for (const p of o.parts) {
          const po = on && t >= p.t ? clamp((t - p.t) / (reduce ? 0.01 : 0.3)) : 0;
          p.e.style.opacity = po;
          p.e.style.transform = po > 0 && po < 1 && !reduce ? `translateY(${((1 - po) * 0.6).toFixed(3)}cqw)` : "none";
        }
      }
      scene.render(t, F, "widgets");
      renderCaptions(t);
      renderTransport(t);
    }
    cx.render = (t) => render(t == null ? au.currentTime : t);

    /* ---------------- captions ---------------- */
    const capEl = $(".captions");
    let capIdx = -2;
    // subtitles: the voice's own words (lit one by one), or the same sentence in another language (cfg.subs)
    const SUBS = cfg.subs || null, LANGNAME = { en: "English", fr: "Français", zh: "中文", es: "Español", de: "Deutsch" };
    let subLang = lang;
    function renderCaptions(t) {
      if (cx.FREE) { if (capIdx !== -3) { capEl.textContent = scene.pausedText || T.paused; capEl.lang = lang; capIdx = -3; } return; }
      let i = -1;
      for (let k = 0; k < SENT.length; k++) if (SENT[k].start <= t) i = k;
      if (i < 0) i = 0;
      if (i !== capIdx) {
        capEl.innerHTML = ""; capEl.lang = subLang;
        if (subLang !== lang && SUBS && SUBS[subLang]) { const s = document.createElement("span"); s.className = "said"; s.textContent = SUBS[subLang][i] || ""; capEl.appendChild(s); }
        else SENT[i].words.forEach((w) => { const s = document.createElement("span"); s.textContent = w.w + " "; capEl.appendChild(s); });
        capIdx = i;
        if (window.parent !== window) window.parent.postMessage({ lesson: 1, ev: "at", s: i }, "*");   // the player keeps the place for a language switch
      }
      if (subLang === lang) [...capEl.children].forEach((s, k) => s.classList.toggle("said", t >= SENT[i].words[k].t));
    }
    /* ---------------- transport ---------------- */
    const au = document.getElementById(cfg.audioId || "lesson-audio");
    cx.au = au;
    const playBtn = $(".play"), scrub = $(".scrub input"), timeEl = $(".time");
    const CHAP = (sb.chapters || []).map((c, i) => ({ t0: resolve(c.at, `(chapter #${i})`), title: L(c.title) }));
    const chapBtns = CHAP.map((c) => {
      const li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.innerHTML = `<span class="ts">${fmt(c.t0)}</span><span>${esc(c.title)}</span>`;
      b.addEventListener("click", () => { seek(c.t0 + 0.01); play(); });
      li.appendChild(b); $(".chapters").appendChild(li); return { t0: c.t0, b };
    });
    function renderTransport(t) {
      if (document.activeElement !== scrub) scrub.value = t;
      timeEl.textContent = `${fmt(t)} / ${fmt(DUR)}`;
      let cur = 0; chapBtns.forEach((c, i) => { if (t >= c.t0) cur = i; });
      chapBtns.forEach((c, i) => c.b.setAttribute("aria-current", String(i === cur && !cx.FREE)));
    }
    const QT = qa ? resolve(qa.at || "end", "(question)") : null;
    let asked = false, raf = 0;

    /* ---------------- sounds (made by the browser: no audio file, nothing to download) ----------------
     * Two kinds, like in a game. (1) Cues tied to what the picture does while the lesson plays: scene.cues() gives
     * [{ t, type }], the core adds a whoosh for camera moves, a pop for a new headline or stamp and a chime for the
     * question. (2) Feedback when the learner touches something: a tiny tick on hover, a click on buttons, grab and
     * drop, a chime for a right answer. On by default, one "Sounds" button, remembered for every part. Nothing
     * sounds before the learner's first click (browsers forbid it). */
    const SND = (function () {
      const SKEY = (cfg.storageKey || "lesson-speed").replace(/-speed$/, "");
      const load = (k, d) => { try { const v = localStorage.getItem(SKEY + k); return v == null ? d : v === "1"; } catch (e) { return d; } };
      const save = (k, v) => { try { localStorage.setItem(SKEY + k, v ? "1" : "0"); } catch (e) { /* storage blocked */ } };
      const st = { sfx: load("-sfx", cfg.sounds !== false) };
      let ac = null, out = null, lastT = -1, lastPlay = 0, K = 1;
      const log = [];
      function ctx() {
        if (ac) return ac;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ac = new AC(); out = ac.createGain(); out.gain.value = 0.5; out.connect(ac.destination);
        return ac;
      }
      function tone(type, f0, f1, dur, vol, when = 0) {
        const t0 = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol * K, t0 + Math.min(0.012, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dur + 0.03);
      }
      /** A burst of filtered noise; with f1 the filter sweeps from f0 to f1 (a swipe). */
      function noise(dur, vol, f0, when = 0, f1 = null) {
        const t0 = ac.currentTime + when, n = Math.max(1, Math.floor(ac.sampleRate * dur)), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (f1 ? Math.sin((Math.PI * i) / n) : 1 - i / n);
        const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
        src.buffer = buf; f.type = "bandpass"; f.frequency.setValueAtTime(f0, t0); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
        f.Q.value = f1 ? 2.2 : 1.2; g.gain.value = vol * K;
        src.connect(f); f.connect(g); g.connect(out); src.start(t0);
      }
      const VOICES = {
        // what the picture does
        good: () => tone("sine", 620, 880, 0.11, 0.16),                                  // accepted, better
        risk: () => { tone("sine", 520, 440, 0.1, 0.13); tone("sine", 660, 660, 0.09, 0.09, 0.08); },   // accepted although worse
        free: () => tone("triangle", 500, 500, 0.05, 0.06),                              // accepted, nothing changed
        reject: () => { tone("sine", 150, 85, 0.14, 0.22); noise(0.05, 0.05, 300); },    // rejected
        best: () => { tone("sine", 880, 880, 0.38, 0.13); tone("sine", 1320, 1320, 0.45, 0.09, 0.07); },   // new best
        dice: () => { for (let i = 0; i < 4; i++) noise(0.03, 0.09, 2400 + 500 * i, i * 0.055); },
        wall: () => noise(0.07, 0.16, 380),
        slide: () => noise(0.2, 0.1, 500, 0, 1500),                                      // something slides
        whoosh: () => noise(0.34, 0.12, 300, 0, 2600),                                   // the camera or a panel moves
        grow: () => tone("sine", 300, 540, 0.2, 0.1),                                    // something gets bigger or longer
        shrink: () => tone("sine", 540, 300, 0.2, 0.1),                                  // something gets smaller or shorter
        move: () => tone("triangle", 330, 392, 0.07, 0.08),                              // a step of another kind
        pop: () => tone("sine", 900, 640, 0.06, 0.07),                                   // a text appears
        stamp: () => { tone("sine", 190, 110, 0.1, 0.18); noise(0.04, 0.07, 900); },
        ask: () => { tone("sine", 660, 660, 0.3, 0.1); tone("sine", 990, 990, 0.4, 0.08, 0.14); },
        // what the learner does
        hover: () => tone("sine", 1250, 1250, 0.03, 0.035),
        click: () => { tone("triangle", 720, 480, 0.05, 0.11); noise(0.015, 0.04, 3000); },
        grab: () => tone("triangle", 300, 400, 0.07, 0.11),
        drop: () => tone("sine", 280, 170, 0.1, 0.13),
        win: () => [660, 880, 1320].forEach((f, i) => tone("sine", f, f, 0.26, 0.12, i * 0.09)),
        miss: () => tone("sine", 300, 220, 0.18, 0.1),
        /** a note whose pitch says how good a value is (v = 0 worst .. 1 best): dragging a cell */
        pitch: (v) => tone("sine", 260 + 620 * v, 260 + 620 * v, 0.06, 0.07),
      };
      const LOUD = new Set(["best", "ask", "win", "miss", "click", "grab", "drop", "stamp"]);
      /** Play one sound now. Unforced sounds are dropped or softened when they come too fast (a fast replay, hovering). */
      function fire(type, force, arg) {
        if (!st.sfx || !VOICES[type]) return;
        const a = ctx(); if (!a || a.state !== "running") return;
        const now = performance.now(), must = force || LOUD.has(type), gap = must ? 0 : type === "free" || type === "hover" ? 110 : 70;
        if (now - lastPlay < gap) return;
        K = must ? 1 : clamp((now - lastPlay) / 280, 0.35, 1);
        lastPlay = now; log.push(type); if (log.length > 400) log.shift();
        VOICES[type](arg);
      }
      // cues of the lesson: the scene's own, plus the core's (camera, headlines and stamps, the question)
      const CUES = scene.cues ? scene.cues() : [];
      const trackKeys = (name) => { try { return cx.keys(name).filter((k) => k[0] > 0.05); } catch (e) { return []; } };
      for (const k of trackKeys("camera")) CUES.push({ t: k[0], type: "whoosh" });
      const GEN = scene.soundTracks || {};       // e.g. { tree: "move", panel: "whoosh" }: one sound per key of that track
      for (const [name, type] of Object.entries(GEN)) for (const k of trackKeys(name)) CUES.push({ t: k[0], type });
      for (const o of sb.overlays || []) {
        const t = resolve(o.from, "(sound)");
        if (t > 0.3 && (o.type === "headline" || o.type === "stamp")) CUES.push({ t, type: o.type === "stamp" ? "stamp" : "pop" });
      }
      if (QT != null) CUES.push({ t: QT, type: "ask" });
      CUES.sort((a, b) => a.t - b.t);
      /** Called every frame while the lesson plays: fire the cues passed since the last frame (not after a jump). */
      function tick(t) {
        if (lastT >= 0 && t > lastT && t - lastT < 0.6) for (const c of CUES) { if (c.t > lastT && c.t <= t) fire(c.type); else if (c.t > t) break; }
        lastT = t;
      }
      function unlock() { const a = ctx(); if (a && a.state === "suspended") a.resume(); }
      au.addEventListener("play", () => { unlock(); lastT = -1; });
      au.addEventListener("seeked", () => { lastT = -1; });
      function bind() {
        root.querySelectorAll(".sbtn").forEach((b) => {
          b.setAttribute("aria-pressed", String(st.sfx));
          b.addEventListener("click", () => { st.sfx = !st.sfx; save("-sfx", st.sfx); b.setAttribute("aria-pressed", String(st.sfx)); unlock(); if (st.sfx) fire("good", true); });
        });
        // game-like feedback on everything the learner can touch
        const HOT = "button, select, input[type=range], .node, .fpk, .plk, summary, a";
        let over = null;
        root.addEventListener("pointerover", (e) => { const el = e.target.closest && e.target.closest(HOT); if (el && el !== over && e.pointerType !== "touch") fire("hover"); over = el; });
        root.addEventListener("pointerdown", (e) => { unlock(); const el = e.target.closest && e.target.closest(".plk, .node, .fpk"); if (el) fire(el.classList.contains("plk") ? "grab" : "click"); }, true);
        root.addEventListener("click", (e) => { const el = e.target.closest && e.target.closest("button"); if (el && !el.classList.contains("sbtn") && !el.dataset.quiet) fire("click"); }, true);
        root.addEventListener("change", (e) => { if (e.target.matches && e.target.matches("select")) fire("click"); });
      }
      return { tick, fire, bind, unlock, state: st, cues: CUES, log };
    })();
    SND.bind();
    cx.sfx = (type, force = true, arg) => { SND.unlock(); SND.fire(type, force, arg); };
    function loop() {
      if (QT != null && !asked && !au.paused && au.currentTime >= QT) { asked = true; au.pause(); au.currentTime = QT; stage.classList.add("asking"); }
      render(au.currentTime);
      SND.tick(au.currentTime);
      if (!au.paused) raf = requestAnimationFrame(loop);
    }
    function resetAsk(t) { if (QT != null && t < QT - 0.05) { asked = false; stage.classList.remove("asking"); const a = layer.querySelector(".qans"); if (a) a.textContent = ""; } }
    function play() {
      if (cx.FREE) cx.leaveFree();
      if (au.ended || au.currentTime >= DUR - 0.05) { au.currentTime = 0; resetAsk(0); }
      const p = au.play(); if (p && p.catch) p.catch(() => {});
    }
    let pendT = null;
    const clock = () => (au.readyState < 1 && pendT != null ? pendT : au.currentTime);
    function seek(t) {
      if (cx.FREE) cx.leaveFree();
      const tt = clamp(t, 0, DUR);
      au.currentTime = tt;
      // before the audio's metadata is there, the browser may not take the new time yet: set it again when it can
      if (au.readyState < 1) { pendT = tt; au.addEventListener("loadedmetadata", () => { au.currentTime = tt; pendT = null; }, { once: true }); }
      resetAsk(tt); render(tt);
    }
    playBtn.addEventListener("click", () => (au.paused ? play() : au.pause()));
    au.addEventListener("play", () => { playBtn.textContent = "❚❚"; playBtn.setAttribute("aria-label", T.pause); cancelAnimationFrame(raf); loop(); });
    au.addEventListener("pause", () => { playBtn.textContent = "▶"; playBtn.setAttribute("aria-label", T.play); render(clock()); });
    au.addEventListener("seeked", () => render(clock()));
    au.addEventListener("ended", () => { const b = $(".bench"); b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse"); });
    scrub.addEventListener("input", () => { if (cx.FREE) cx.leaveFree(); au.currentTime = +scrub.value; resetAsk(+scrub.value); render(+scrub.value); });
    document.addEventListener("keydown", (e) => {
      const a = document.activeElement;
      if (e.code === "Space" && !/INPUT|BUTTON|TEXTAREA|SELECT/.test(a.tagName) && !(a.closest && a.closest(".node, .fpk, .plk"))) { e.preventDefault(); au.paused ? play() : au.pause(); }
    });
    const SPEEDS = [1, 1.25, 1.5, 1.75, 2], KEY = cfg.storageKey || "lesson-speed";
    let rate = 1;
    try { const r = parseFloat(localStorage.getItem(KEY)); if (SPEEDS.includes(r)) rate = r; } catch (e) { /* storage blocked */ }
    const speedBtns = SPEEDS.map((r) => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = r + "×";
      b.addEventListener("click", () => setRate(r)); $(".seg").appendChild(b); return { r, b };
    });
    function setRate(r) {
      rate = r; au.playbackRate = r; au.preservesPitch = true;
      speedBtns.forEach((x) => x.b.setAttribute("aria-pressed", String(x.r === r)));
      try { localStorage.setItem(KEY, String(r)); } catch (e) { /* storage blocked */ }
    }
    setRate(rate);
    au.addEventListener("loadedmetadata", () => setRate(rate));
    const ccBtn = $(".tbtn"), playerEl = $(".player"), subSel = $(".subsel select");
    if (ccBtn) ccBtn.addEventListener("click", () => { const on = ccBtn.getAttribute("aria-pressed") !== "true"; ccBtn.setAttribute("aria-pressed", String(on)); playerEl.classList.toggle("nocc", !on); });
    if (subSel) {
      // one choice for every part and both voices: "off", or a language (the voice's language = word-by-word)
      const SKEY = KEY.replace(/-speed$/, "") + "-subs";
      const opts = [["off", T.subsOff], [lang, LANGNAME[lang] || lang], ...Object.keys(SUBS).map((c) => [c, LANGNAME[c] || c])];
      for (const [v, label] of opts) { const o = document.createElement("option"); o.value = v; o.textContent = label; subSel.appendChild(o); }
      const apply = (v) => {
        if (!opts.some((o) => o[0] === v)) v = lang;
        subSel.value = v; playerEl.classList.toggle("nocc", v === "off");
        if (v !== "off") subLang = v;
        capIdx = -2; render(au.currentTime);
      };
      let saved = null; try { saved = localStorage.getItem(SKEY); } catch (e) { /* storage blocked */ }
      apply(saved || lang);
      subSel.addEventListener("change", () => { apply(subSel.value); try { localStorage.setItem(SKEY, subSel.value); } catch (e) { /* storage blocked */ } });
    }

    /* ---------------- your turn ---------------- */
    cx.readout = $(".readout");
    cx.enterFree = (state) => { au.pause(); cx.FREE = state; stage.classList.add("free"); render(au.currentTime); };
    cx.leaveFree = () => { cx.FREE = null; stage.classList.remove("free"); if (scene.leaveFree) scene.leaveFree(); render(au.currentTime); };
    root.querySelector('[data-act="back"]').addEventListener("click", () => cx.leaveFree());
    scene.bindBench();
    if (qa) {
      const fb = $(".feedback"), opts = $(".bench-opts");
      qa.options.forEach((op) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "btn"; b.textContent = L(op.label);
        b.addEventListener("click", () => { fb.innerHTML = md(L(op.reply)); }); opts.appendChild(b);
      });
      layer.querySelectorAll(".qbtns button").forEach((b) => b.addEventListener("click", () => {
        const op = qa.options[+b.dataset.q];
        layer.querySelector(".qans").innerHTML = md(L(op.reply));
        if (op.correct === true) cx.sfx("win"); else if (op.correct === false) cx.sfx("miss");
        stage.classList.remove("asking");
        const p = au.play(); if (p && p.catch) p.catch(() => {});
      }));
    }

    /* ---------------- diagnostics for scripts/check_lesson.py ---------------- */
    function stageRect(el) {
      const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
    }
    window.__lesson = {
      render, duration: DUR, errors, claims, lang, scene: sceneName,
      tracks: Object.fromEntries(Object.entries(tracks).map(([k, v]) => [k, v.map((x) => [x[0], typeof x[2] === "string" ? x[2] : JSON.stringify(x[2])])])),
      moveSeconds: Object.fromEntries(Object.keys(SPEC).map((k) => [k, SPEC[k].checkDur != null ? SPEC[k].checkDur : SPEC[k].dur])),
      overlays: OV.map((o) => ({ a: o.a, b: o.b, label: o.label, type: o.type })),
      sentences: SENT.map((s) => ({ slide: s.slide, start: s.start, end: s.end, text: s.text })),
      question: QT,
      boxes() {
        const s = stage.getBoundingClientRect(), out = [];
        const sx = s.width / lastCam[2], sy = s.height / lastCam[3];
        for (const b of scene.boxes(s, sx, sy, lastCam)) {
          if (b.x + b.w < 0 || b.y + b.h < 0 || b.x > s.width || b.y > s.height) continue;
          out.push(b);
        }
        [...OV.map((o) => ({ d: o.d, label: o.label })), ...widgetEls].forEach((o) => {
          // fully shown text only, not mid-fade
          if (+o.d.style.opacity > 0.9) { const r = stageRect(o.d.firstElementChild || o.d); out.push({ kind: "overlay", label: o.label, x: r.x, y: r.y, w: r.w, h: r.h }); }
        });
        return { stage: { w: s.width, h: s.height }, boxes: out };
      },
      setRecording(on) { root.classList.toggle("norec", !!on); },
    };
    if (scene.expose) Object.assign(window.__lesson, scene.expose());
    if (errors.length) console.error(`[lesson] ${errors.length} problem(s); see window.__lesson.errors`);
    render(0);

    /* ---------------- inside the all-parts player (scripts/build_player.py) ----------------
     * The lesson page tells the page that frames it what happens (ready, play, pause, ended, its height) and takes
     * play / pause / seek orders from it, and from nobody else. Alone, the page behaves as before. */
    const embedded = window.parent !== window;
    const post = (ev, extra) => { if (embedded) window.parent.postMessage(Object.assign({ lesson: 1, ev }, extra || {}), "*"); };
    if (embedded) {
      document.documentElement.classList.add("embedded");
      for (const ev of ["play", "pause", "ended"]) au.addEventListener(ev, () => post(ev, { t: au.currentTime }));
      window.addEventListener("message", (e) => {
        if (e.source !== window.parent || !e.data || !e.data.lessonCmd) return;
        if (e.data.lessonCmd === "play") play(); else if (e.data.lessonCmd === "pause") au.pause(); else if (e.data.lessonCmd === "seek") seek(+e.data.t || 0);
      });
      const tell = () => post("height", { h: Math.ceil(document.documentElement.getBoundingClientRect().height) });
      if (window.ResizeObserver) new ResizeObserver(tell).observe(document.documentElement);
      window.addEventListener("load", tell);
      post("ready", { duration: DUR, title: L(sb.title) }); tell();
    }
    window.__lesson.play = play; window.__lesson.seek = seek;
    window.__lesson.sound = { cues: SND.cues, state: SND.state, log: SND.log, tick: SND.tick };
    const sm = /[?&]s=(\d+)/.exec(location.search);     // open at sentence s (a language switch in the player)
    if (sm && SENT[+sm[1]]) seek(SENT[+sm[1]].start + 0.01);
    if (/[?&]autoplay=1/.test(location.search)) play();   // asked by the player when it moves on to this part
  }

  /* =====================================================================================================
   * Scene "graph": weighted graph, splits, cut counter, balance bars (partitioning labs). Unchanged from v3.
   * ===================================================================================================== */
  SCENES.graph = function (cx) {
    const { sb, T, L, err, resolve, esc, fill, D, lerp, ease, clamp, FULL } = cx;
    const DUR_POSE = 1.1, DUR_SHAPE = 0.9, DUR_WIRES = 1.0, DUR_COUNT = 1.2;
    if (!sb.graph) { err('the graph scene needs "graph" in the storyboard'); sb.graph = { nodes: [], edges: [] }; }
    if (!sb.poses) { err('the graph scene needs "poses" in the storyboard'); sb.poses = { base: {} }; }
    const NODES = sb.graph.nodes.slice();
    const EDGES = sb.graph.edges.map((e) => (Array.isArray(e) ? e : [e.u, e.v, e.w]));
    const K = sb.graph.groups || 2;
    const CAP = sb.graph.cap != null ? sb.graph.cap : Math.ceil(NODES.length / K);
    const names = (g) => (g.includes(",") ? g.split(",").map((x) => x.trim()) : g.trim().split(""));
    function parseSplit(v) {
      if (v == null || v === "none" || v === "") return null;
      const s = sb.splits && sb.splits[v] != null ? sb.splits[v] : v;
      const asn = Object.fromEntries(NODES.map((n) => [n, null]));
      s.split("|").forEach((g, gi) => names(g).filter(Boolean).forEach((n) => {
        if (!(n in asn)) err(`split "${s}": unknown node ${n}`); else asn[n] = gi;
      }));
      return asn;
    }
    /** Colour rank of each group: the group holding the first node name is 0 (blue), and so on. */
    function colourOf(asn) {
      const firsts = new Map();
      for (const n of [...NODES].sort()) if (asn[n] != null && !firsts.has(asn[n])) firsts.set(asn[n], firsts.size);
      return firsts;
    }
    function cutOf(asn) {
      if (!asn) return null;
      let c = 0;
      for (const [u, v, w] of EDGES) if (asn[u] != null && asn[v] != null && asn[u] !== asn[v]) c += w;
      return c;
    }
    function sizes(asn) {
      const out = Array(K).fill(0); if (!asn) return out;
      const col = colourOf(asn);
      for (const n of NODES) if (asn[n] != null) { const c = col.get(asn[n]); if (c < K) out[c]++; }
      return out;
    }
    function legal(asn) {
      if (!asn || NODES.some((n) => asn[n] == null)) return false;
      const s = sizes(asn);
      return s.every((x) => x > 0 && x <= CAP);
    }
    function partsStr(asn) {
      const col = colourOf(asn), groups = [];
      for (const n of [...NODES].sort()) if (asn[n] != null) { const c = col.get(asn[n]); (groups[c] = groups[c] || []).push(n); }
      return groups.map((g) => g.join("")).join(" | ");
    }
    /* The course's random dealer (Lab 03): mulberry32, two warm-up draws, Fisher–Yates over sorted names. */
    function mulberry32(seed) {
      let t = seed >>> 0;
      return function next() {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    }
    function randomSplit(seed) {
      const order = [...NODES].sort();
      const rng = mulberry32(seed); rng(); rng();
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      const left = new Set(order.slice(0, Math.floor(order.length / 2)));
      return Object.fromEntries(NODES.map((n) => [n, left.has(n) ? 0 : 1]));
    }

    /* claims: every number the narration or the text states, checked against the rules above */
    const claims = [];
    for (const c of sb.claims || []) {
      const asn = c.deal != null ? randomSplit(c.deal) : parseSplit(c.split);
      const got = { split: asn ? partsStr(asn) : null, cut: cutOf(asn), legal: legal(asn) };
      const want = parseSplit(c.split);
      const okSplit = c.split == null || (c.deal == null) || (want && partsStr(want) === got.split);
      const okCut = c.cut == null || c.cut === got.cut;
      const okLegal = c.legal == null || c.legal === got.legal;
      const ok = okSplit && okCut && okLegal;
      claims.push({ claim: c, got, ok });
      if (!ok) err(`claim failed: ${JSON.stringify(c)} -> ${JSON.stringify(got)}`);
    }

    const POSES = sb.poses;
    for (const [pn, p] of Object.entries(POSES)) for (const n of NODES) if (!p[n]) err(`pose ${pn} has no position for ${n}`);
    const firstPose = Object.keys(POSES)[0];
    const mixPose = (a, b, p) => { const o = {}; for (const n of NODES) o[n] = cx.mixArr(a[n], b[n], p); return o; };
    const tracks = {
      pose: { init: firstPose, conv: (v) => { if (!POSES[v]) { err(`unknown pose ${v}`); return POSES[firstPose]; } return POSES[v]; }, dur: DUR_POSE, mix: mixPose },
      split: { init: null, conv: (v) => v, dur: DUR_COUNT, mix: null },
      camera: { init: "full", conv: "camera", dur: 1.3, mix: (a, b, p) => cx.mixArr(a, b, p) },
      shape: { init: "node", conv: (v) => (v === "cell" ? 0 : 1), dur: DUR_SHAPE, mix: lerp },
      wires: { init: false, conv: (v) => (v ? 1 : 0), dur: DUR_WIRES, mix: lerp },
      dim: { init: 1, conv: (v) => +v, dur: 0.6, mix: lerp },
    };
    let posAt, shapeAt, wiresAt, dimAt;
    const win = (name, t) => cx.win(name, t);
    const edgeIn = (w, u, v) => w && (w.edges.length === 0 || w.edges.includes(`${u}-${v}`) || w.edges.includes(`${v}-${u}`));
    /** Edge styles (heavy, pulse, flash): several windows can be open at once, each for its own edges. */
    const edgeOn = (name, t, u, v) => (cx.WIN[name] || []).some((w) => t >= w.a && t < w.b && edgeIn(w, u, v));
    function splitSeg(t) { return cx.seg("split", t); }
    function shownCut(t) {
      const s = splitSeg(t), c1 = cutOf(parseSplit(s.cur)), c0 = cutOf(parseSplit(s.prev));
      if (c1 == null) return null;
      if (c0 == null) return c1;
      return Math.round(lerp(c0, c1, ease((t - s.t0) / (DUR_COUNT * D))));
    }

    let halves, divider, chip, graph, edgeEls, nodeEls, counter, cv, cbox, balance, bars, capLine, verdict, lastP = null;
    const S = {
      tracks, claims,
      svgLabel: T.graph, bannerText: T.yourSplit, pausedText: T.paused,
      soundTracks: { split: "move", pose: "slide", shape: "pop", wires: "pop" },
      ready() { posAt = cx.track("pose"); shapeAt = cx.track("shape"); wiresAt = cx.track("wires"); dimAt = cx.track("dim"); },
      benchHtml() {
        return `${sb.bench && sb.bench.deal ? `<div class="row"><label for="lesson-seed">${esc(T.deal)}</label><input class="seedbox" id="lesson-seed" type="number" min="0" max="999" value="${sb.bench.seed != null ? sb.bench.seed : 3}"><button class="btn primary" type="button" data-act="deal">${esc(T.dealBtn)}</button></div>` : ""}
      <p>${esc(T.clickHint)}</p>
      <div class="readout">${esc(sb.bench && sb.bench.deal ? T.noSplit : T.noSplitNoDeal)}</div>`;
      },
      buildSvg() {
        const { mk } = cx;
        const divX = (sb.divider && sb.divider.x) || 570;
        halves = mk("g");
        mk("rect", { class: "tint0", x: 0, y: 0, width: divX, height: 540 }, halves);
        mk("rect", { class: "tint1", x: divX, y: 0, width: 960 - divX, height: 540 }, halves);
        divider = mk("line", { class: "divider", x1: divX, y1: 110, x2: divX, y2: 525 });
        const chipBox = sb.chip || { x: 175, y: 120, w: 610, h: 395 };
        chip = mk("g");
        mk("rect", { class: "chipbody", x: chipBox.x, y: chipBox.y, width: chipBox.w, height: chipBox.h, rx: 18 }, chip);
        const pins = Math.max(4, Math.floor((chipBox.w - 40) / 48));
        for (let i = 0; i < pins; i++) {
          mk("rect", { class: "pin", x: chipBox.x + 30 + i * 48, y: chipBox.y - 14, width: 14, height: 14, rx: 2 }, chip);
          mk("rect", { class: "pin", x: chipBox.x + 30 + i * 48, y: chipBox.y + chipBox.h, width: 14, height: 14, rx: 2 }, chip);
        }
        graph = mk("g");
        edgeEls = EDGES.map(([u, v, w]) => {
          const g = mk("g", { class: "edge" }, graph);
          const wires = Array.from({ length: Math.min(w, 9) }, () => mk("line", { class: "wire" }, g));
          const main = mk("line", { class: "main" }, g);
          const wl = mk("g", { class: "wl" }, g);
          mk("rect", { x: -14, y: -12, width: 28, height: 24, rx: 6 }, wl);
          mk("text", { x: 0, y: 1 }, wl).textContent = String(w);
          return { u, v, w, g, wires, main, wl };
        });
        nodeEls = NODES.map((n) => {
          const g = mk("g", { class: "node nu", tabindex: 0, role: "button", "aria-label": fill(T.cell, { n }) }, graph);
          const r = mk("rect", {}, g);
          const t = mk("text", { x: 0, y: 1 }, g); t.textContent = n;
          g.addEventListener("click", () => clickNode(n));
          g.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); clickNode(n); } });
          return { n, g, r, t };
        });
      },
      buildWidgets() {
        const W = sb.widgets || {};
        counter = cx.widget("ov-counter", W.counter || { x: 81, y: 68 }, `<div class="counter"><span class="l">${esc(T.cutsize)}</span><span class="v">0</span></div>`);
        cv = counter.querySelector(".v"); cbox = counter.querySelector(".counter");
        balance = cx.widget("ov-balance", W.balance || { x: 77, y: 26 }, `<div class="balance"><span class="l">${esc(T.perSide)}</span><div class="bars">${Array.from({ length: K }, (_, i) => `<div class="bar c${i}"></div>`).join("")}<div class="cap"><span>${esc(fill(T.max, { cap: CAP }))}</span></div></div><span class="verdict"></span></div>`);
        bars = balance.querySelectorAll(".bar"); capLine = balance.querySelector(".cap"); verdict = balance.querySelector(".verdict");
        capLine.style.bottom = (CAP / NODES.length) * 100 + "%";
        return [{ d: counter, label: "counter" }, { d: balance, label: "balance" }];
      },
      render(t, F, layer) {
        const setOp = cx.setOp;
        const asn = F ? F.asn : parseSplit(splitSeg(t).cur);
        if (layer === "widgets") {
          const cw = win("counter", t);
          const showCounter = F ? !!asn && NODES.some((n) => asn[n] != null) : !!cw;
          if (F) counter.style.opacity = showCounter ? 1 : 0; else if (cw) cx.ovStyle(counter, t, cw.a, cw.b); else counter.style.opacity = 0;
          if (showCounter) {
            const c = F ? cutOf(asn) : shownCut(t);
            cv.textContent = c == null ? "–" : c;
            cbox.classList.toggle("bad", c != null && sb.badCut != null && c >= sb.badCut);
            cbox.classList.toggle("good", c != null && sb.goodCut != null && c === sb.goodCut && legal(asn));
          }
          const bw = win("balance", t);
          const showBal = F ? !!asn : !!bw;
          if (F) balance.style.opacity = showBal ? 1 : 0; else if (bw) cx.ovStyle(balance, t, bw.a, bw.b); else balance.style.opacity = 0;
          if (showBal) {
            const s = sizes(asn);
            bars.forEach((b, i) => { b.style.height = (s[i] / NODES.length) * 100 + "%"; b.textContent = s[i] || ""; });
            const capOn = F || !!win("cap", t);
            capLine.style.opacity = capOn ? 1 : 0;
            const ok = legal(asn);
            verdict.textContent = capOn ? (ok ? T.verdictYes : T.verdictNo) : "";
            verdict.className = "verdict " + (ok ? "yes" : "no");
          }
          return;
        }
        const P = F ? POSES[sb.freePose || firstPose] : posAt(t);
        const shape = F ? 1 : shapeAt(t), spread = F ? 0 : wiresAt(t);
        lastP = P;
        const chipOn = !F && !!win("chip", t), cellMode = chipOn && shape < 0.5;
        setOp(chip, chipOn ? 1 : 0);
        const div = !F && !!win("divider", t);
        setOp(divider, div ? 0.55 : 0); setOp(halves, div ? 1 : 0);
        setOp(graph, F ? 1 : dimAt(t));
        const showCut = F || !!win("cut", t), weights = F || !!win("weights", t);
        const col = asn ? colourOf(asn) : null;
        for (const e of edgeEls) {
          const [x1, y1] = P[e.u], [x2, y2] = P[e.v];
          const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
          e.wires.forEach((ln, i) => {
            const o = (i - (e.wires.length - 1) / 2) * 9 * spread;
            ln.setAttribute("x1", x1 + nx * o); ln.setAttribute("y1", y1 + ny * o);
            ln.setAttribute("x2", x2 + nx * o); ln.setAttribute("y2", y2 + ny * o);
            ln.style.opacity = clamp(spread * 1.6);
          });
          e.main.setAttribute("x1", x1); e.main.setAttribute("y1", y1); e.main.setAttribute("x2", x2); e.main.setAttribute("y2", y2);
          e.main.style.opacity = clamp(1 - spread * 1.4);
          const isCut = showCut && asn && asn[e.u] != null && asn[e.v] != null && asn[e.u] !== asn[e.v];
          const isHeavy = !F && edgeOn("heavy", t, e.u, e.v);
          e.main.setAttribute("stroke-width", isHeavy ? 9 : 2.5 + Math.min(e.w, 8) * 0.9);
          e.g.classList.toggle("cut", !!isCut);
          e.g.classList.toggle("heavy", isHeavy);
          e.g.classList.toggle("pulse", !F && edgeOn("pulse", t, e.u, e.v));
          e.g.classList.toggle("flash", !F && edgeOn("flash", t, e.u, e.v));
          const mx = (x1 + x2) / 2 + nx * 18, my = (y1 + y2) / 2 + ny * 18;
          e.wl.setAttribute("transform", `translate(${mx.toFixed(1)} ${my.toFixed(1)})`);
          setOp(e.wl, weights ? 1 : 0);
        }
        const labW = cx.WIN.labels;
        nodeEls.forEach((N, i) => {
          const [x, y] = P[N.n];
          N.g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
          const R = 25, w = lerp(68, 2 * R, shape), h = lerp(46, 2 * R, shape), rx = lerp(7, R, shape);
          N.r.setAttribute("x", -w / 2); N.r.setAttribute("y", -h / 2); N.r.setAttribute("width", w); N.r.setAttribute("height", h); N.r.setAttribute("rx", rx);
          const side = !asn || asn[N.n] == null ? "nu" : "g" + Math.min(col.get(asn[N.n]), 3);
          N.g.setAttribute("class", "node " + (cellMode ? "ncell" : side));
          let lab = true;
          if (!F && labW) { const w0 = labW.find((w) => t >= w.a && t < w.b); lab = !!w0 && t >= w0.a + w0.stagger * i; }
          N.t.style.opacity = lab ? 1 : 0;
        });
      },
      thumb(item) {
        const asn = parseSplit(item.split), P = POSES[item.pose || sb.thumbPose || firstPose], col = colourOf(asn);
        const xs = NODES.map((n) => P[n][0]), ys = NODES.map((n) => P[n][1]);
        const x0 = Math.min(...xs) - 60, y0 = Math.min(...ys) - 50, w = Math.max(...xs) - x0 + 60, h = Math.max(...ys) - y0 + 50;
        let s = `<svg viewBox="${x0} ${y0} ${w} ${h}" aria-hidden="true">`;
        for (const [u, v] of EDGES) {
          const c = asn[u] !== asn[v];
          s += `<line x1="${P[u][0]}" y1="${P[u][1]}" x2="${P[v][0]}" y2="${P[v][1]}" stroke="${c ? "var(--cut)" : "var(--edge)"}" stroke-width="${c ? 7 : 5}" ${c ? 'stroke-dasharray="14 9"' : ""}/>`;
        }
        for (const n of NODES) s += `<circle cx="${P[n][0]}" cy="${P[n][1]}" r="30" fill="var(--g${col.get(asn[n]) || 0})"/><text x="${P[n][0]}" y="${P[n][1] + 1}" fill="#fff" font-size="30" font-weight="700" text-anchor="middle" dominant-baseline="central" font-family="Source Sans 3, sans-serif">${esc(n)}</text>`;
        s += "</svg>";
        const best = item.best ? `<span class="ok" data-a="${resolve(item.best, "(thumb best)").toFixed(3)}">${esc(L(item.bestLabel) || "best")}</span>` : "";
        return `<div class="thumb${item.best ? " best" : ""}">${s}<span class="c">${esc(partsStr(asn))} · ${esc(T.cut)} ${cutOf(asn)}</span>${best}</div>`;
      },
      boxes(s, sx, sy, cam) {
        const out = [];
        if (+(graph.style.opacity || 1) < 0.6) return out; // a dimmed graph sits behind the text on purpose
        nodeEls.forEach((N) => {
          const [x, y] = lastP[N.n], cxx = (x - cam[0]) * sx, cy = (y - cam[1]) * sy, r = 26 * sx;
          out.push({ kind: "node", label: N.n, x: cxx - r, y: cy - r, w: 2 * r, h: 2 * r });
        });
        return out;
      },
      bindBench() {
        const { root } = cx;
        const dealBtn = root.querySelector('[data-act="deal"]');
        if (dealBtn) dealBtn.addEventListener("click", () => {
          const inp = root.querySelector("#lesson-seed");
          const s = Math.max(0, Math.min(999, parseInt(inp.value, 10) || 0)); inp.value = s;
          const asn = randomSplit(s); cx.enterFree({ asn }); cx.readout.innerHTML = describe(asn, fill(T.seed, { s }));
        });
      },
      leaveFree() { cx.readout.textContent = T.backMsg; },
    };
    function describe(asn, prefix) {
      const placed = NODES.filter((n) => asn[n] != null), all = placed.length === NODES.length;
      const s = sizes(asn);
      return `${esc(prefix)}${esc(partsStr(asn))} &nbsp; ${esc(T.cut)} ${cutOf(asn)} &nbsp; ${esc(T.sides)} ${s.join(" | ")} &nbsp; ` +
        (all ? (legal(asn) ? `<span class="ok">${esc(T.legal)}</span>` : `<span class="no">${esc(fill(T.notLegal, { cap: CAP }))}</span>`)
          : esc(fill(T.toPlace, { list: NODES.filter((n) => asn[n] == null).join(", ") })));
    }
    function clickNode(n) {
      if (!cx.FREE) cx.enterFree({ asn: Object.assign({}, parseSplit(splitSeg(cx.au.currentTime).cur) || Object.fromEntries(NODES.map((k) => [k, null]))) });
      const a = cx.FREE.asn;
      a[n] = a[n] == null ? 0 : (a[n] + 1) % K;
      cx.readout.innerHTML = describe(a, T.yours);
      cx.render();
    }
    return S;
  };

  /* =====================================================================================================
   * Scene "floorplan": a B*-tree (left panel) and the floor it packs (right panel).
   *   Rule (the course's packBstar, written down in Lab 05): walk the tree in preorder, node, then its whole left
   *   subtree, then its right child. The root sits at (0, 0). A left child goes NEXT DOOR: x = parent.x + parent.w.
   *   A right child goes UPSTAIRS: x = parent.x. Each block falls until it touches the skyline (the highest top under
   *   its width), and the skyline rises to the block's top.
   * ===================================================================================================== */
  const PAPER = ["#1d4ed8", "#0f6b5c", "#b45309", "#7c3aed", "#be123c", "#0e7490", "#a16207", "#4d7c0f"];

  /** "A(B(C(E,-),-),D)" → { id, left, right }. A name is letters/digits/_; "-" is an empty slot. */
  function parseTree(str) {
    let i = 0;
    const s = String(str).replace(/\s+/g, "");
    function node() {
      const m = /^[A-Za-z0-9_]+/.exec(s.slice(i));
      if (!m) throw new Error(`tree "${str}": a name was expected at position ${i}`);
      i += m[0].length;
      const n = { id: m[0], left: null, right: null };
      if (s[i] === "(") {
        i++;
        n.left = slot();
        if (s[i] !== ",") throw new Error(`tree "${str}": "," expected at position ${i}`);
        i++;
        n.right = slot();
        if (s[i] !== ")") throw new Error(`tree "${str}": ")" expected at position ${i}`);
        i++;
      }
      return n;
    }
    function slot() { if (s[i] === "-") { i++; return null; } return node(); }
    const t = node();
    if (i !== s.length) throw new Error(`tree "${str}": unexpected "${s.slice(i)}"`);
    return t;
  }
  function treeStr(n) {
    if (!n) return "-";
    if (!n.left && !n.right) return n.id;
    return `${n.id}(${treeStr(n.left)},${treeStr(n.right)})`;
  }
  const cloneTree = (n) => (n ? { id: n.id, left: cloneTree(n.left), right: cloneTree(n.right) } : null);
  function walkOf(n, out = []) { if (n) { out.push(n.id); walkOf(n.left, out); walkOf(n.right, out); } return out; }
  /** Pack a B*-tree exactly like the course (packBstar in floorplanning-core.js, pack_bstar in common/pack.py). */
  function packTree(tree, dims) {
    const pack = {}, contour = [], steps = [];
    const contourY = (x1, x2) => { let y = 0; for (const g of contour) if (!(g.x2 <= x1 || g.x1 >= x2)) y = Math.max(y, g.h); return y; };
    function setContour(x1, x2, h) {
      const next = [];
      for (const g of contour) {
        if (g.x2 <= x1 || g.x1 >= x2) next.push(g);
        else {
          if (g.x1 < x1) next.push({ x1: g.x1, x2: x1, h: g.h });
          if (g.x2 > x2) next.push({ x1: x2, x2: g.x2, h: g.h });
        }
      }
      next.push({ x1, x2, h });
      next.sort((a, b) => a.x1 - b.x1);
      contour.length = 0; contour.push(...next);
    }
    function place(n, x) {
      if (!n) return;
      const m = dims[n.id];
      const y = contourY(x, x + m.w);
      pack[n.id] = { x, y, w: m.w, h: m.h };
      setContour(x, x + m.w, y + m.h);
      steps.push({ id: n.id, contour: contour.map((g) => [g.x1, g.x2, g.h]) });
      place(n.left, x + m.w);
      place(n.right, x);
    }
    place(tree, 0);
    return { pack, steps };
  }

  SCENES.floorplan = function (cx) {
    const { sb, T, L, err, resolve, esc, fill, D, lerp, ease, clamp } = cx;
    const DUR_TREE = 1.2, DUR_PLACE = 1.0, STAGGER = 0.55, DUR_PANEL = 0.6, DUR_FREE = 750;
    const FP = sb.floorplan || {};
    if (!sb.floorplan) err('the floorplan scene needs "floorplan" in the storyboard');
    const DATA = FP.data || {};
    const outline = FP.outline || DATA.outline || { w: 10, h: 8 };
    const OW = outline.w != null ? outline.w : outline.W, OH = outline.h != null ? outline.h : outline.H;
    const MODS = (FP.modules || DATA.modules || []).map((m) => ({ id: m.id, w: m.w, h: m.h }));
    if (!MODS.length) err("floorplan: no modules (give floorplan.modules or build with --data)");
    const IDS = MODS.map((m) => m.id);
    const BASE = Object.fromEntries(MODS.map((m) => [m.id, m]));
    const COLORS = Object.assign({}, Object.fromEntries([...IDS].sort().map((id, i) => [id, PAPER[i % PAPER.length]])), DATA.colors || {}, FP.colors || {});
    const LABELS = FP.labels || {};
    const lab = (k) => (LABELS[k] ? L(LABELS[k]) : T[k]);

    /* ---- named trees: storyboard trees + the checker's scenes (build_lesson.py --data) ---- */
    const NAMED = {};
    for (const [k, v] of Object.entries(DATA.trees || {})) NAMED[k] = v;
    for (const [k, v] of Object.entries(FP.trees || {})) NAMED[k] = v;
    const cache = new Map();
    function treeSpec(v) {
      if (v == null) return null;
      if (typeof v === "string" && NAMED[v] != null) return treeSpec(NAMED[v]);
      if (typeof v === "string") return { tree: v, rotated: [] };
      if (v.tree != null) {
        const base = treeSpec(v.tree);
        return { tree: base ? base.tree : v.tree, rotated: v.rotated != null ? v.rotated : base ? base.rotated : [] };
      }
      return null;
    }
    /** Everything about one tree: structure, walk, pack, layout of the tree drawing, bounding box, legality. */
    function state(v, label = "") {
      const spec = treeSpec(v);
      if (!spec) { err(`floorplan: unknown tree ${JSON.stringify(v)} ${label}`); return null; }
      const key = spec.tree + "|" + [...spec.rotated].sort().join(",");
      if (cache.has(key)) return cache.get(key);
      let root;
      try { root = parseTree(spec.tree); } catch (e) { err(`floorplan: ${e.message} ${label}`); cache.set(key, null); return null; }
      return makeState(root, new Set(spec.rotated), key, label);
    }
    function makeState(root, rot, key, label = "") {
      const walk = walkOf(root);
      const seen = new Set(walk);
      if (walk.length !== seen.size) err(`floorplan: tree ${treeStr(root)} uses a block twice ${label}`);
      for (const id of walk) if (!BASE[id]) err(`floorplan: tree ${treeStr(root)} has unknown block ${id} ${label}`);
      const missing = IDS.filter((id) => !seen.has(id));
      if (missing.length) err(`floorplan: tree ${treeStr(root)} misses ${missing.join(", ")} ${label}`);
      for (const r of rot) if (!BASE[r]) err(`floorplan: rotated block ${r} is unknown ${label}`);
      const dims = {};
      for (const m of MODS) dims[m.id] = rot.has(m.id) ? { w: m.h, h: m.w } : { w: m.w, h: m.h };
      const { pack, steps } = packTree(root, dims);
      const parent = {};
      (function rec(n) { if (!n) return; if (n.left) { parent[n.left.id] = [n.id, "left"]; rec(n.left); } if (n.right) { parent[n.right.id] = [n.id, "right"]; rec(n.right); } })(root);
      const rects = Object.values(pack);
      const bw = rects.length ? Math.max(...rects.map((r) => r.x + r.w)) : 0, bh = rects.length ? Math.max(...rects.map((r) => r.y + r.h)) : 0;
      const area = bw * bh, used = rects.reduce((s, r) => s + r.w * r.h, 0);
      const st = {
        key, root, rot, walk, pack, steps, parent, dims, str: treeStr(root),
        bbox: [bw, bh], area, wasted: area - used, legal: bw <= OW && bh <= OH,
        layout: layoutTree(root),
      };
      if (key) cache.set(key, st);
      return st;
    }

    /* ---- geometry of the two panels ---- */
    const TB = FP.treeBox || [20, 150, 370, 360];       // x, y, w, h of the tree drawing (stage units)
    const GB = FP.gridBox || [430, 150, 506, 356];      // x, y, w, h of the floor drawing (the top band is for text)
    const NR = FP.nodeRadius || 21;
    function layoutTree(root) {
      const order = [], depth = {};
      (function rec(n, d) { if (!n) return; rec(n.left, d + 1); order.push(n.id); depth[n.id] = d; rec(n.right, d + 1); })(root, 0);
      const maxD = Math.max(0, ...Object.values(depth));
      const dx = TB[2] / Math.max(order.length, 1), dy = Math.min(78, (TB[3] - 2 * NR - 10) / Math.max(maxD, 1));
      const pos = {};
      order.forEach((id, i) => { pos[id] = [TB[0] + (i + 0.5) * dx, TB[1] + NR + 6 + depth[id] * dy]; });
      return pos;
    }
    // units → stage: the floor spans the outline and every tree the lesson shows (so a too-wide row still fits)
    let EXW = OW, EXH = OH;
    if (FP.extent) { EXW = Math.max(EXW, FP.extent[0]); EXH = Math.max(EXH, FP.extent[1]); }
    function grow(st) { if (st) { EXW = Math.max(EXW, st.bbox[0]); EXH = Math.max(EXH, st.bbox[1]); } }
    let U = 1, OX = 0, OY = 0;
    function fixScale() {
      const padW = 0.25, padH = 0.25;
      U = Math.min(GB[2] / (EXW + padW), GB[3] / (EXH + padH));
      OX = GB[0] + 4; OY = GB[1] + GB[3] - 4;
    }
    const sx = (x) => OX + x * U, sy = (y) => OY - y * U;

    /* ---- claims and the checker's own numbers ---- */
    const claims = [];
    const near = (a, b) => Math.abs(a - b) < 1e-9;
    for (const c of FP.claims || sb.claims || []) {
      const st = state(c.rotated ? { tree: c.tree, rotated: c.rotated } : c.tree, "(claim)");
      if (!st) { claims.push({ claim: c, got: null, ok: false }); continue; }
      const got = { tree: st.str, walk: st.walk.join(""), bbox: st.bbox, area: st.area, wasted: st.wasted, legal: st.legal };
      let ok = true;
      if (c.walk != null && c.walk.replace(/[^A-Za-z0-9_]/g, "") !== got.walk) ok = false;
      if (c.bbox && !(near(c.bbox[0], st.bbox[0]) && near(c.bbox[1], st.bbox[1]))) ok = false;
      for (const k of ["area", "wasted", "legal"]) if (c[k] != null && c[k] !== got[k]) ok = false;
      for (const [id, p] of Object.entries(c.pos || {})) {
        const r = st.pack[id];
        got["pos" + id] = r ? [r.x, r.y] : null;
        if (!r || !near(r.x, p[0]) || !near(r.y, p[1])) ok = false;
      }
      for (const [k, want] of Object.entries(c)) {
        const m = /^(x|y|w|h)([A-Za-z0-9_]+)$/.exec(k);
        if (m && st.pack[m[2]]) { got[k] = st.pack[m[2]][m[1]]; if (!near(got[k], want)) ok = false; }
      }
      claims.push({ claim: c, got, ok });
      if (!ok) err(`claim failed: ${JSON.stringify(c)} -> ${JSON.stringify(got)}`);
    }
    // the checker JSON (build_lesson.py --data) carries every scene's pack: the engine must agree with it
    let dataChecked = 0, dataDiffer = 0;
    for (const [name, want] of Object.entries(DATA.expect || {})) {
      const st = state(name, "(data)");
      if (!st) continue;
      dataChecked++;
      for (const [id, r] of Object.entries(want)) {
        const g = st.pack[id];
        if (!g || !near(g.x, r.x) || !near(g.y, r.y) || !near(g.w, r.w) || !near(g.h, r.h)) {
          dataDiffer++;
          err(`engine and checker disagree on ${name}: ${id} engine ${JSON.stringify(g)} checker ${JSON.stringify(r)}`);
          break;
        }
      }
    }

    /* ---- tracks ---- */
    const PANELS = { both: [1, 1], tree: [1, 0.22], grid: [0.22, 1], none: [0, 0] };
    const tracks = {
      tree: { init: FP.start || Object.keys(NAMED)[0], conv: (v) => v, dur: DUR_TREE, mix: null },
      placed: { init: "all", conv: (v) => v, dur: DUR_PLACE, mix: null, checkDur: STAGGER },
      camera: { init: "full", conv: "camera", dur: 1.3, mix: (a, b, p) => cx.mixArr(a, b, p) },
      panel: { init: "both", conv: (v) => { if (!PANELS[v]) { err(`floorplan: panel must be both, tree, grid or none, not ${v}`); return PANELS.both; } return PANELS[v]; }, dur: DUR_PANEL, mix: (a, b, p) => cx.mixArr(a, b, p) },
      dim: { init: 1, conv: (v) => +v, dur: 0.6, mix: lerp },
    };
    let panelAt, dimAt, TREE_KEYS, PLACE_KEYS;
    function ready() {
      panelAt = cx.track("panel"); dimAt = cx.track("dim");
      TREE_KEYS = cx.keys("tree").map(([t, v, ref]) => ({ t, st: state(v, `(tree key ${ref})`) }));
      for (const k of TREE_KEYS) grow(k.st);
      for (const o of sb.overlays || []) if (o.type === "thumbs") for (const it of o.items || []) state(it.tree, "(thumbs)");
      fixScale();
      PLACE_KEYS = cx.keys("placed").map(([t, v, ref]) => {
        let n = v;
        if (v === "all") n = IDS.length; else if (v === "none") n = 0;
        else if (typeof v === "string" && /^@?[A-Za-z0-9_]+$/.test(v) && !/^\d+$/.test(v)) n = { upTo: v.replace(/^@/, "") };
        else n = +v;
        if (typeof n === "number" && !(n >= 0 && n <= IDS.length)) err(`floorplan: placed must be 0..${IDS.length}, "all", "none" or a block name (key ${ref})`);
        return { t, n, ref };
      });
    }
    function treeSeg(t) {
      let i = 0;
      for (let k = 0; k < TREE_KEYS.length; k++) if (TREE_KEYS[k].t <= t) i = k;
      return { cur: TREE_KEYS[i].st, prev: i > 0 ? TREE_KEYS[i - 1].st : TREE_KEYS[i].st, t0: TREE_KEYS[i].t, i };
    }
    /** When does each block land? Keys of "placed" count blocks in the walk order of the tree shown at that key.
     *  A jump of several blocks drops them one after the other, STAGGER seconds apart. */
    function placeTimes(t) {
      const at = {}; // id → time it starts falling (or undefined = not placed)
      let count = 0;
      for (const k of PLACE_KEYS) {
        if (k.t > t) break;
        const st = treeSeg(k.t).cur;
        if (!st) continue;
        let n = k.n;
        if (typeof n === "object") { const j = st.walk.indexOf(n.upTo); n = j < 0 ? count : j + 1; }
        if (k.t === 0 && k.ref === "initial") { st.walk.slice(0, n).forEach((id) => { at[id] = -1e9; }); count = n; continue; }
        if (n > count) st.walk.slice(count, n).forEach((id, j) => { at[id] = k.t + j * STAGGER * D; });
        else if (n < count) st.walk.slice(n).forEach((id) => { delete at[id]; });
        count = n;
      }
      return at;
    }

    /* ---- geometry at time t (units for blocks, stage px for tree nodes) ---- */
    function geomAt(t, F) {
      let A, B, q;
      if (F) { A = F.prev; B = F.cur; q = ease(clamp((performance.now() - F.t0) / (reduce() ? 1 : DUR_FREE))); }
      else { const s = treeSeg(t); A = s.prev; B = s.cur; q = ease((t - s.t0) / (DUR_TREE * D)); }
      if (!B) return null;
      if (!A) A = B;
      const at = F ? Object.fromEntries(IDS.map((id) => [id, -1e9])) : placeTimes(t);
      const nodes = {}, rects = {}, nodeFill = {};
      for (const id of IDS) {
        const pa = A.layout[id] || B.layout[id], pb = B.layout[id] || pa;
        nodes[id] = [lerp(pa[0], pb[0], q), lerp(pa[1], pb[1], q)];
        const ra = A.pack[id] || B.pack[id], rb = B.pack[id] || ra;
        const turning = A.rot.has(id) !== B.rot.has(id);
        let r;
        if (turning) {
          // a turn: the block keeps A's shape and rotates 90° about its moving centre (so it ends as B's shape)
          const ca = [ra.x + ra.w / 2, ra.y + ra.h / 2], cb = [rb.x + rb.w / 2, rb.y + rb.h / 2];
          const c = [lerp(ca[0], cb[0], q), lerp(ca[1], cb[1], q)], ang = 90 * q;
          const rad = (ang * Math.PI) / 180, ew = Math.abs(ra.w * Math.cos(rad)) + Math.abs(ra.h * Math.sin(rad)), eh = Math.abs(ra.w * Math.sin(rad)) + Math.abs(ra.h * Math.cos(rad));
          r = { x: c[0] - ew / 2, y: c[1] - eh / 2, w: ew, h: eh, cx: c[0], cy: c[1], bw: ra.w, bh: ra.h, ang };
        } else {
          r = { x: lerp(ra.x, rb.x, q), y: lerp(ra.y, rb.y, q), w: lerp(ra.w, rb.w, q), h: lerp(ra.h, rb.h, q), ang: 0 };
          r.cx = r.x + r.w / 2; r.cy = r.y + r.h / 2; r.bw = r.w; r.bh = r.h;
        }
        // placement: fly from the tree node to above the slot, then fall onto the skyline
        const t0 = at[id];
        let p = t0 == null ? -1 : clamp((t - t0) / (DUR_PLACE * D), 0, 1);
        if (t0 != null && t0 < -1e8) p = 1;
        r.p = p; r.landed = p >= 1;
        rects[id] = r;
        nodeFill[id] = p < 0 ? 0 : clamp(p * 3);
      }
      const moving = q < 0.999 || Object.values(rects).some((r) => r.p >= 0 && r.p < 1);
      return { A, B, q, nodes, rects, nodeFill, cur: B, moving };
    }
    const reduce = () => cx.reduce;
    /** Skyline of the landed blocks: the highest top over each stretch of x, from 0 to the right end. */
    function skyline(rects) {
      const rs = Object.values(rects).filter((r) => r.landed);
      const xs = new Set([0]);
      for (const r of rs) { xs.add(r.x); xs.add(r.x + r.w); }
      const pts = [...xs].sort((a, b) => a - b);
      const segs = [];
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1], mid = (a + b) / 2;
        let h = 0;
        for (const r of rs) if (r.x <= mid && mid <= r.x + r.w) h = Math.max(h, r.y + r.h);
        segs.push([a, b, h]);
      }
      return segs;
    }
    function bboxOf(rects) {
      const rs = Object.values(rects).filter((r) => r.landed);
      if (!rs.length) return null;
      return [Math.max(...rs.map((r) => r.x + r.w)), Math.max(...rs.map((r) => r.y + r.h)), rs];
    }
    const round1 = (v) => Math.round(v * 10) / 10;
    const num = (v) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : round1(v).toFixed(1));

    /* ---- SVG ---- */
    let gTree, gGrid, gEdges, gNodes, gBadges, gLinks, gBlocks, gFloor, gWaste, gSky, gBox, gBoxLab, gOver, gCoords;
    let nodeEls = {}, blockEls = {}, edgeEls = new Map(), badgeEls = {}, linkEls = new Map(), coordEls = {};
    let lastG = null;
    function buildSvg() {
      const { mk } = cx;
      const defs = mk("defs");
      const pat = mk("pattern", { id: "fp-hatch", width: 8, height: 8, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
      mk("rect", { width: 8, height: 8, class: "fp-hatch-bg" }, pat);
      mk("line", { x1: 0, y1: 0, x2: 0, y2: 8, class: "fp-hatch-line" }, pat);
      const pat2 = mk("pattern", { id: "fp-over", width: 9, height: 9, patternUnits: "userSpaceOnUse", patternTransform: "rotate(-45)" }, defs);
      mk("line", { x1: 0, y1: 0, x2: 0, y2: 9, class: "fp-over-line" }, pat2);
      gGrid = mk("g", { class: "fp-grid" });
      gFloor = mk("g", {}, gGrid);
      // unit grid inside the outline, the outline itself, the floor line, axis numbers
      const gl = mk("g", { class: "fp-gridlines" }, gFloor);
      for (let x = 1; x < OW; x++) mk("line", { x1: sx(x), y1: sy(0), x2: sx(x), y2: sy(OH) }, gl);
      for (let y = 1; y < OH; y++) mk("line", { x1: sx(0), y1: sy(y), x2: sx(OW), y2: sy(y) }, gl);
      gOver = mk("rect", { class: "fp-overzone", x: sx(OW), y: sy(EXH + 0.2), width: Math.max(0, sx(EXW + 0.2) - sx(OW)), height: sy(0) - sy(EXH + 0.2) }, gFloor);
      const gOverT = mk("rect", { class: "fp-overzone", x: sx(0), y: sy(EXH + 0.2), width: sx(OW) - sx(0), height: Math.max(0, sy(OH) - sy(EXH + 0.2)) }, gFloor);
      gOver = [gOver, gOverT];
      mk("rect", { class: "fp-outline", x: sx(0), y: sy(OH), width: OW * U, height: OH * U }, gFloor);
      mk("line", { class: "fp-floorline", x1: sx(0) - 8, y1: sy(0), x2: sx(EXW) + 8, y2: sy(0) }, gFloor);
      const ax = mk("g", { class: "fp-axis" }, gFloor);
      for (let x = 0; x <= Math.ceil(EXW); x += 1) if (x % 2 === 0 || x === OW) mk("text", { x: sx(x), y: sy(0) + 17 }, ax).textContent = String(x);
      for (let y = 2; y <= OH; y += 2) mk("text", { x: sx(0) - 12, y: sy(y) + 1, class: "fp-axis-y" }, ax).textContent = String(y);
      mk("text", { class: "fp-outline-lab", x: sx(OW) - 6, y: sy(OH) + 18 }, gFloor).textContent = `${OW} × ${OH}`;
      gWaste = mk("rect", { class: "fp-waste" }, gGrid);
      gBlocks = mk("g", {}, gGrid);
      for (const id of IDS) {
        const g = mk("g", { class: "fpk fpb", tabindex: 0, role: "button", "aria-label": fill(T.blockAria, { n: id }) }, gBlocks);
        const r = mk("rect", { rx: 3, fill: COLORS[id], stroke: COLORS[id] }, g);
        const tx = mk("text", { class: "fp-bid" }, g); tx.textContent = id;
        const dm = mk("text", { class: "fp-dim" }, g);
        g.addEventListener("click", () => clickBlock(id));
        g.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); clickBlock(id); } });
        blockEls[id] = { g, r, tx, dm };
      }
      gSky = mk("polyline", { class: "fp-sky" }, gGrid);
      gBox = mk("rect", { class: "fp-bbox" }, gGrid);
      gBoxLab = mk("g", { class: "fp-bboxlab" }, gGrid);
      mk("rect", { rx: 6, height: 26 }, gBoxLab); mk("text", { y: 13 }, gBoxLab);
      gCoords = mk("g", { class: "fp-coords" }, gGrid);
      for (const id of IDS) { const g = mk("g", {}, gCoords); mk("circle", { r: 4.5 }, g); mk("text", { x: 7, y: -8 }, g); coordEls[id] = g; }

      gTree = mk("g", { class: "fp-tree" });
      gEdges = mk("g", {}, gTree);
      gLinks = mk("g", { class: "fp-links" }, gTree);
      gNodes = mk("g", {}, gTree);
      gBadges = mk("g", { class: "fp-badges" }, gTree);
      for (const id of IDS) {
        const g = mk("g", { class: "fpk fpn", tabindex: 0, role: "button", "aria-label": fill(T.blockAria, { n: id }) }, gNodes);
        const ring = mk("circle", { r: NR + 6, class: "fp-ring" }, g);
        const c = mk("circle", { r: NR, stroke: COLORS[id] }, g);
        const tx = mk("text", { y: 1 }, g); tx.textContent = id;
        g.addEventListener("click", () => clickBlock(id));
        g.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); clickBlock(id); } });
        nodeEls[id] = { g, c, tx, ring };
        const b = mk("g", {}, gBadges); mk("circle", { r: 10.5 }, b); mk("text", { y: 1 }, b); badgeEls[id] = b;
      }
    }
    function edgeEl(key, side) {
      if (edgeEls.has(key)) return edgeEls.get(key);
      const ln = cx.mk("line", { class: "fp-edge " + side }, gEdges);
      edgeEls.set(key, ln); return ln;
    }
    function linkEl(key, side) {
      if (linkEls.has(key)) return linkEls.get(key);
      const g = cx.mk("g", { class: "fp-link " + side }, gLinks);
      cx.mk("rect", { rx: 5, height: 22 }, g); cx.mk("text", { y: 11 }, g).textContent = side === "left" ? lab("nextDoor") : lab("upstairs");
      const w = side === "left" ? lab("nextDoor").length : lab("upstairs").length;
      g.firstChild.setAttribute("width", w * 7.4 + 14); g.firstChild.setAttribute("x", -(w * 7.4 + 14) / 2);
      linkEls.set(key, g); return g;
    }

    /* ---- widgets ---- */
    let counter, cl, cv, cbox, legalW, lv;
    function buildWidgets() {
      const W = sb.widgets || {};
      counter = cx.widget("ov-counter", W.counter || { x: 80, y: 3 }, `<div class="counter fp-counter"><span class="l"></span><span class="v">0</span></div>`);
      cl = counter.querySelector(".l"); cv = counter.querySelector(".v"); cbox = counter.querySelector(".counter");
      legalW = cx.widget("ov-legal", W.legal || { x: 46, y: 21.5 }, `<div class="fp-legal"><span class="v"></span></div>`);
      lv = legalW.querySelector(".v");
      return [{ d: counter, label: "counter" }, { d: legalW, label: "legal badge" }];
    }
    function metricOf(name, G) {
      const bb = bboxOf(G.rects);
      if (/^[xy]:/.test(name)) {
        const [axis, id] = name.split(":"); const r = G.rects[id];
        return r && r.landed ? r[axis] : null;
      }
      if (!bb) return name === "placed" ? 0 : null;
      const [w, h, rs] = bb;
      if (name === "area") return w * h;
      if (name === "width") return w;
      if (name === "height") return h;
      if (name === "wasted") return w * h - rs.reduce((s, r) => s + r.bw * r.bh, 0);
      if (name === "placed") return rs.length;
      err(`floorplan: unknown counter metric ${name}`); return null;
    }
    const metricLabel = (w) => {
      if (w.label) return L(w.label);
      const m = w.metric || "area";
      if (m.startsWith("x:")) return fill(T.mX, { n: m.slice(2) });
      if (m.startsWith("y:")) return fill(T.mY, { n: m.slice(2) });
      return { area: T.mArea, width: T.mWidth, height: T.mHeight, wasted: T.mWasted, placed: "placed" }[m] || m;
    };

    /* ---- render ---- */
    function render(t, F, layer) {
      const G = layer === "widgets" ? lastG : geomAt(t, F);
      if (!G) return;
      if (layer === "widgets") return renderWidgets(t, F, G);
      lastG = G;
      const setOp = cx.setOp;
      const [pTree, pGrid] = F ? [1, 1] : panelAt(t);
      const dim = F ? 1 : dimAt(t);
      setOp(gTree, pTree * dim); setOp(gGrid, pGrid * dim);
      const on = (name) => !!F || !!cx.win(name, t);
      const hl = new Set(F ? (F.sel ? [F.sel] : []) : cx.wins("highlight", t).flatMap((w) => w.ids || []));

      // tree edges: the union of the two trees' links, fading in and out during a change
      const want = new Map();
      const addEdges = (st, op) => { for (const [c, [p, side]] of Object.entries(st.parent)) { const k = `${p}>${c}>${side}`; want.set(k, Math.max(want.get(k) || 0, op)); } };
      addEdges(G.A, 1 - G.q); addEdges(G.B, G.q);
      for (const [k, el] of edgeEls) if (!want.has(k)) setOp(el, 0);
      const showLinks = cx.win("links", t);
      const linkIds = showLinks && showLinks.ids ? new Set(showLinks.ids) : null;
      for (const [k, el] of linkEls) if (!want.has(k) || !showLinks) setOp(el, 0);
      for (const [k, op] of want) {
        const [p, c, side] = k.split(">");
        const el = edgeEl(k, side);
        const [x1, y1] = G.nodes[p], [x2, y2] = G.nodes[c];
        const len = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / len, uy = (y2 - y1) / len;
        el.setAttribute("x1", (x1 + ux * NR).toFixed(1)); el.setAttribute("y1", (y1 + uy * NR).toFixed(1));
        el.setAttribute("x2", (x2 - ux * NR).toFixed(1)); el.setAttribute("y2", (y2 - uy * NR).toFixed(1));
        setOp(el, op);
        if (showLinks && !F && (!linkIds || linkIds.has(c))) {
          const g = linkEl(k, side);
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, off = side === "left" ? -1 : 1;
          g.setAttribute("transform", `translate(${(mx + off * 34).toFixed(1)} ${(my - 4).toFixed(1)})`);
          setOp(g, op * clamp((t - showLinks.a) / 0.4));
        }
      }
      // tree nodes: hollow until their block is picked up, then filled with the block's colour
      const walkW = !F && cx.win("walk", t);
      IDS.forEach((id) => {
        const N = nodeEls[id], [x, y] = G.nodes[id], f = G.nodeFill[id];
        N.g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        N.c.setAttribute("fill", f >= 0.5 ? COLORS[id] : "var(--surface)");
        N.c.style.fillOpacity = f >= 0.5 ? 1 : 1;
        N.tx.setAttribute("fill", f >= 0.5 ? "#fff" : COLORS[id]);
        N.g.classList.toggle("hl", hl.has(id));
        const bi = G.B.walk.indexOf(id), b = badgeEls[id];
        b.setAttribute("transform", `translate(${(x + NR * 0.86).toFixed(1)} ${(y - NR * 0.86).toFixed(1)})`);
        b.lastChild.textContent = String(bi + 1);
        setOp(b, walkW ? clamp((t - (walkW.a + walkW.stagger * bi)) / 0.3) : 0);
      });

      // blocks
      const dimsOn = cx.win("dims", t), coordsW = cx.win("coords", t);
      const coordIds = coordsW && coordsW.ids ? new Set(coordsW.ids) : null;
      IDS.forEach((id) => {
        const E = blockEls[id], r = G.rects[id];
        if (r.p < 0) { setOp(E.g, 0); setOp(coordEls[id], 0); E.g.setAttribute("aria-hidden", "true"); return; }
        E.g.removeAttribute("aria-hidden");
        let x = sx(r.cx - r.bw / 2), w = r.bw * U, h = r.bh * U, yTop = sy(r.cy + r.bh / 2), op = 1, ang = r.ang;
        if (r.p < 1) {
          // fly (0..0.42): from the node, growing, to 2.4 units above the slot; fall (0.42..1): ease-in onto the skyline
          const [nx, ny] = G.nodes[id];
          const hoverTop = Math.max(GB[1] - 30, yTop - 2.4 * U);
          if (r.p < 0.42) {
            const k = ease(r.p / 0.42);
            const w0 = 2 * NR, h0 = 2 * NR;
            x = lerp(nx - w0 / 2, x, k); const top = lerp(ny - h0 / 2, hoverTop, k);
            w = lerp(w0, w, k); h = lerp(h0, h, k); yTop = top; op = clamp(0.35 + k);
          } else {
            const k = (r.p - 0.42) / 0.58;
            yTop = lerp(hoverTop, yTop, k * k);
          }
        }
        E.r.setAttribute("x", (-w / 2).toFixed(1)); E.r.setAttribute("y", (-h / 2).toFixed(1));
        E.r.setAttribute("width", Math.max(0, w - 2).toFixed(1)); E.r.setAttribute("height", Math.max(0, h - 2).toFixed(1));
        E.r.setAttribute("transform", "translate(1 1)");
        const ccx = x + w / 2, ccy = yTop + h / 2;
        E.g.setAttribute("transform", `translate(${ccx.toFixed(1)} ${ccy.toFixed(1)}) rotate(${(-ang).toFixed(1)})`);
        E.tx.setAttribute("x", 0); E.tx.setAttribute("y", dimsOn ? -7 : 1);
        E.tx.setAttribute("transform", `rotate(${ang.toFixed(1)})`);
        // a block turned past 45° reads with its new size (w and h swap)
        E.dm.textContent = ang >= 45 ? `${num(r.bh)}×${num(r.bw)}` : `${num(r.bw)}×${num(r.bh)}`; E.dm.setAttribute("y", 14); E.dm.setAttribute("transform", `rotate(${ang.toFixed(1)})`);
        setOp(E.dm, dimsOn ? 1 : 0);
        setOp(E.g, op);
        E.g.classList.toggle("hl", hl.has(id));
        const out = r.x + r.w > OW + 1e-6 || r.y + r.h > OH + 1e-6;
        E.g.classList.toggle("out", r.landed && out);
        const cg = coordEls[id];
        if (coordsW && r.landed && (!coordIds || coordIds.has(id))) {
          cg.setAttribute("transform", `translate(${sx(r.x).toFixed(1)} ${sy(r.y).toFixed(1)})`);
          // on the floor the label sits inside the block's lower-left corner; higher up, just under the corner
          // (inside whatever holds the block up), so it never covers the block's own letter
          cg.lastChild.setAttribute("y", r.y > 0.01 ? 16 : -8);
          cg.lastChild.textContent = `(${num(r.x)}, ${num(r.y)})`;
          setOp(cg, clamp((t - coordsW.a) / 0.4));
        } else setOp(cg, 0);
      });

      // skyline, bounding box, wasted squares, the zone outside the outline
      const sky = skyline(G.rects), bb = bboxOf(G.rects);
      const skyW = cx.win("skyline", t);
      if (skyW || F) {
        const pts = [];
        const right = Math.max(EXW, bb ? bb[0] : 0);
        for (const [a, b2, h] of sky) { pts.push(`${sx(a).toFixed(1)},${sy(h).toFixed(1)}`, `${sx(b2).toFixed(1)},${sy(h).toFixed(1)}`); }
        const lastX = sky.length ? sky[sky.length - 1][1] : 0;
        if (lastX < right) pts.push(`${sx(lastX).toFixed(1)},${sy(0).toFixed(1)}`, `${sx(right).toFixed(1)},${sy(0).toFixed(1)}`);
        gSky.setAttribute("points", pts.join(" "));
        setOp(gSky, F ? 1 : clamp((t - skyW.a) / 0.4));
      } else setOp(gSky, 0);
      const boxW = cx.win("bbox", t), wasteW = cx.win("wasted", t);
      if (bb && (boxW || F)) {
        const [w, h] = bb;
        for (const [k, v] of Object.entries({ x: sx(0), y: sy(h), width: w * U, height: h * U })) gBox.setAttribute(k, v.toFixed(1));
        setOp(gBox, F ? 1 : clamp((t - boxW.a) / 0.4));
        const txt = `${num(w)} × ${num(h)} = ${num(w * h)}`;
        gBoxLab.lastChild.textContent = txt;
        const lw = txt.length * 8.6 + 16;
        gBoxLab.firstChild.setAttribute("width", lw); gBoxLab.firstChild.setAttribute("x", -lw / 2);
        gBoxLab.lastChild.setAttribute("x", 0);
        gBoxLab.setAttribute("transform", `translate(${(sx(w) - lw / 2 - 2).toFixed(1)} ${(sy(h) - 32).toFixed(1)})`);
        setOp(gBoxLab, G.moving ? 0 : F ? 1 : clamp((t - boxW.a) / 0.4));
      } else { setOp(gBox, 0); setOp(gBoxLab, 0); }
      if (bb && wasteW && !F) {
        const [w, h] = bb;
        for (const [k, v] of Object.entries({ x: sx(0), y: sy(h), width: w * U, height: h * U })) gWaste.setAttribute(k, v.toFixed(1));
        setOp(gWaste, clamp((t - wasteW.a) / 0.4));
      } else setOp(gWaste, 0);
      const sticking = bb && (bb[0] > OW + 1e-6 || bb[1] > OH + 1e-6);
      gOver.forEach((g) => setOp(g, sticking ? 1 : 0));
    }
    function renderWidgets(t, F, G) {
      const cw = F ? { metric: "area", a: -1, b: 1e9 } : cx.win("counter", t);
      if (cw) {
        if (F) counter.style.opacity = 1; else cx.ovStyle(counter, t, cw.a, cw.b);
        cl.textContent = metricLabel(cw);
        const v = metricOf(cw.metric || "area", G);
        // while blocks move the counter counts in whole numbers; at rest it shows the exact value
        cv.textContent = v == null ? "–" : G.moving ? String(Math.round(v)) : num(v);
        cbox.classList.toggle("bad", v != null && cw.bad != null && Math.round(v) >= cw.bad);
        cbox.classList.toggle("good", v != null && cw.good != null && Math.round(v) <= cw.good && Math.abs(v - Math.round(v)) < 0.05);
      } else counter.style.opacity = 0;
      const lw = F ? { a: -1, b: 1e9 } : cx.win("legal", t);
      const bb = bboxOf(G.rects);
      if (lw && bb) {
        if (F) legalW.style.opacity = 1; else cx.ovStyle(legalW, t, lw.a, lw.b);
        const ok = bb[0] <= OW + 1e-6 && bb[1] <= OH + 1e-6;
        lv.textContent = (ok ? "✓ " : "✗ ") + fill(ok ? T.fits : T.sticks, { w: OW, h: OH });
        legalW.firstChild.className = "fp-legal " + (ok ? "yes" : "no");
      } else legalW.style.opacity = 0;
    }

    /* ---- thumbnails (overlay "thumbs": items { tree, rotated?, label?, best?, bestLabel? }) ---- */
    function thumb(item) {
      const st = state(item.rotated ? { tree: item.tree, rotated: item.rotated } : item.tree, "(thumbs)");
      if (!st) return "";
      // show the packed blocks with a little room around them, the floor line, and the outline's edge if it is close
      const W = Math.max(st.bbox[0], Math.min(OW, st.bbox[0] + 1)) + 0.4, H = st.bbox[1] + 1.2, u = 20;
      let s = `<svg viewBox="-6 -6 ${W * u + 12} ${H * u + 12}" aria-hidden="true">`;
      s += `<line x1="-4" y1="${H * u}" x2="${W * u + 4}" y2="${H * u}" stroke="var(--ink)" stroke-width="3"/>`;
      if (OW <= W) s += `<line x1="${OW * u}" y1="0" x2="${OW * u}" y2="${H * u}" stroke="var(--line)" stroke-width="2" stroke-dasharray="6 5"/>`;
      for (const [id, r] of Object.entries(st.pack)) {
        const x = r.x * u, y = (H - r.y - r.h) * u;
        s += `<rect x="${x + 1}" y="${y + 1}" width="${r.w * u - 2}" height="${r.h * u - 2}" rx="2" fill="${COLORS[id]}"/><text x="${x + (r.w * u) / 2}" y="${y + (r.h * u) / 2 + 1}" fill="#fff" font-size="15" font-weight="700" text-anchor="middle" dominant-baseline="central" font-family="Source Sans 3, sans-serif">${esc(id)}</text>`;
      }
      s += `<rect x="0" y="${(H - st.bbox[1]) * u}" width="${st.bbox[0] * u}" height="${st.bbox[1] * u}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="7 5"/></svg>`;
      const best = item.best ? `<span class="ok" data-a="${resolve(item.best, "(thumb best)").toFixed(3)}">${esc(L(item.bestLabel) || "best")}</span>` : "";
      const cap = item.label ? L(item.label) : `${st.bbox[0]} × ${st.bbox[1]} = ${st.area}`;
      return `<div class="thumb fp-thumb${item.best ? " best" : ""}">${s}<span class="c">${cx.md(cap)}</span>${best}</div>`;
    }

    /* ---- try it yourself: swap two, turn one, move a leaf ---- */
    const OPS = (sb.bench && sb.bench.ops) || ["swap", "turn", "move"];
    let mode = OPS[0];
    function benchHtml() {
      const names = { swap: T.opSwap, turn: T.opTurn, move: T.opMove };
      return `<div class="row fp-ops" role="group">${OPS.map((o) => `<button class="btn" type="button" data-op="${o}" aria-pressed="${o === mode}">${esc(names[o] || o)}</button>`).join("")}<button class="btn" type="button" data-act="fp-reset">${esc(T.opReset)}</button></div>
      <p>${esc(T.fpHint)}</p>
      <div class="readout">${esc(T.fpStart)}</div>`;
    }
    function describe(st, prefix) {
      return `${esc(prefix)}${esc(T.tree)} <b>${esc(st.str)}</b>${st.rot.size ? ` (${[...st.rot].join(", ")} ↻)` : ""}<br>${esc(T.box)} ${st.bbox[0]} × ${st.bbox[1]} = <b>${st.area}</b> · ${esc(T.wasted)} ${st.wasted} · ` +
        (st.legal ? `<span class="ok">${esc(fill(T.fits, { w: OW, h: OH }))}</span>` : `<span class="no">${esc(fill(T.sticks, { w: OW, h: OH }))}</span>`);
    }
    function lessonState() { return treeSeg(cx.au.currentTime).cur; }
    function freeStart() {
      const st = lessonState();
      cx.enterFree({ cur: st, prev: st, t0: performance.now() - DUR_FREE, sel: null, start: st });
      cx.readout.innerHTML = describe(st, "");
    }
    let freeRaf = 0;
    function animateFree() {
      cancelAnimationFrame(freeRaf);
      const step = () => { if (!cx.FREE) return; cx.render(); if (performance.now() - cx.FREE.t0 < DUR_FREE + 30) freeRaf = requestAnimationFrame(step); };
      freeRaf = requestAnimationFrame(step);
    }
    function apply(next, msg) {
      const F = cx.FREE;
      grow(next);
      F.prev = F.cur; F.cur = next; F.t0 = performance.now(); F.sel = null;
      cx.readout.innerHTML = describe(next, msg);
      animateFree();
    }
    function findNode(root, id) { if (!root) return null; if (root.id === id) return root; return findNode(root.left, id) || findNode(root.right, id); }
    function clickBlock(id) {
      if (!cx.FREE) freeStart();
      const F = cx.FREE, st = F.cur;
      if (mode === "turn") {
        const rot = new Set(st.rot); rot.has(id) ? rot.delete(id) : rot.add(id);
        return apply(makeState(cloneTree(st.root), rot, null), fill(T.turned, { a: id }));
      }
      if (!F.sel) {
        if (mode === "move") {
          const n = findNode(st.root, id);
          if (n.left || n.right) { cx.readout.textContent = fill(T.pickLeaf, { a: id }); return; }
          F.sel = id; cx.readout.textContent = fill(T.pickTarget, { a: id }); return cx.render();
        }
        F.sel = id; cx.readout.textContent = fill(T.pickSecond, { a: id }); return cx.render();
      }
      const a = F.sel;
      if (a === id) { F.sel = null; cx.readout.textContent = T.sameBlock; return cx.render(); }
      if (mode === "swap") {
        const root = cloneTree(st.root);
        (function rec(n) { if (!n) return; if (n.id === a) n.id = id; else if (n.id === id) n.id = a; rec(n.left); rec(n.right); })(root);
        // the shapes travel with the names (a turned block stays turned)
        return apply(makeState(root, new Set(st.rot), null), fill(T.swapped, { a, b: id }));
      }
      // move: cut leaf a, hang it under id (left slot first, else right)
      const root = cloneTree(st.root);
      const tgt = findNode(root, id);
      if (tgt.left && tgt.right) { cx.readout.textContent = fill(T.noSlot, { b: id }); F.sel = null; return cx.render(); }
      (function cut(n) { if (!n) return; if (n.left && n.left.id === a) n.left = null; else if (n.right && n.right.id === a) n.right = null; else { cut(n.left); cut(n.right); } })(root);
      const t2 = findNode(root, id), side = !t2.left ? "left" : "right";
      t2[side] = { id: a, left: null, right: null };
      return apply(makeState(root, new Set(st.rot), null), fill(T.moved, { a, b: id, side: side === "left" ? T.sideLeft : T.sideRight }));
    }
    function bindBench() {
      const btns = [...cx.root.querySelectorAll(".fp-ops [data-op]")];
      btns.forEach((b) => b.addEventListener("click", () => {
        mode = b.dataset.op; btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        if (cx.FREE) { cx.FREE.sel = null; cx.render(); }
      }));
      const rs = cx.root.querySelector('[data-act="fp-reset"]');
      if (rs) rs.addEventListener("click", () => { if (!cx.FREE) freeStart(); else apply(cx.FREE.start, ""); });
    }

    function boxes(s, kx, ky, cam) {
      const out = [];
      if (!lastG) return out;
      const op = (el) => +(el.style.opacity === "" ? 1 : el.style.opacity);
      if (op(gTree) >= 0.6) IDS.forEach((id) => {
        const [x, y] = lastG.nodes[id], X = (x - cam[0]) * kx, Y = (y - cam[1]) * ky, r = NR * kx;
        out.push({ kind: "node", label: id, x: X - r, y: Y - r, w: 2 * r, h: 2 * r });
      });
      if (op(gGrid) >= 0.6) IDS.forEach((id) => {
        const r = lastG.rects[id];
        if (r.p < 0 || op(blockEls[id].g) < 0.6) return;
        const bb = blockEls[id].g.getBoundingClientRect();
        // a block is big: only its centre matters for legibility, so give the checker a box around its letter
        const X = bb.left - s.left + bb.width / 2, Y = bb.top - s.top + bb.height / 2, h = Math.min(bb.height, 34 * ky), w = Math.min(bb.width, 34 * kx);
        out.push({ kind: "node", label: `block ${id}`, x: X - w / 2, y: Y - h / 2, w, h });
      });
      return out;
    }

    return {
      tracks, claims, ready, benchHtml, buildSvg, buildWidgets, render, thumb, boxes, bindBench,
      soundTracks: { tree: "move", panel: "whoosh" },
      svgLabel: T.fpStage, bannerText: T.yourTree, pausedText: T.fpPaused,
      leaveFree() { cx.readout.textContent = T.fpBack; },
      expose() {
        return {
          floorplan: {
            dataChecked, dataDiffer, outline: [OW, OH], unit: U,
            pack(name) { const st = state(name); return st && { tree: st.str, walk: st.walk, pack: st.pack, bbox: st.bbox, area: st.area, wasted: st.wasted, legal: st.legal }; },
            at(t) { const G = geomAt(t, null); return G && { tree: G.cur.str, rects: G.rects, skyline: skyline(G.rects) }; },
          },
        };
      },
    };
  };

  /* =====================================================================================================
   * Scene "placement" (v5): cells on a chip floor, nets as bounding boxes, and a simulated-annealing run replayed
   * move by move (placement labs, Lab 07). The engine runs the course's saPlace itself (same mulberry32, same
   * draw order, Δ ≤ 0 accepted without a draw) and must agree with the lab checker's --json traces move by move.
   * ===================================================================================================== */
  Object.assign(I18N.en, {
    plStage: "Chip floor with cells and wires", plYours: "Your run", plPaused: "Paused. You are trying your own moves.",
    plHint: "Drag a cell to see the wirelength change, or let the annealer play: one move at a time, or a whole run.",
    plStart: "Drag a cell or press a button to start. The lesson pauses while you try.",
    plBack: "Back in the lesson. Drag a cell to try again.",
    plSeed: "Seed", plStep: "One move", plRun: "Run to the end", plReset: "Start again",
    plWire: "wirelength", plBest: "best so far", plTemp: "temperature", plMoveN: "move", plAcc: "accepted", plRej: "rejected",
    plFinal: "final", plBetter: "better", plWorse: "worse", plFree: "free", plChance: "chance to accept: {p} %",
    plNoDice: "not worse: accepted, no dice", plVAcc: "accepted", plVRej: "rejected", plVFree: "free move", plVBest: "new best",
    plCell: "Cell {n}: drag it, or use the arrow keys", plStartLine: "start {v}", plBestLine: "best {v}",
    plMoveLine: "Move {k}: cell {c}, {axis} {d}", plDelta: "wires {d}", plMoves: "moves",
    plDrag: "Your placement: wirelength <b>{h}</b> (in the lesson's picture: {l}).",
    plStepMsg: "Move {k}: cell {c}, {axis} {d}. Wires {dh}. T = {T}. {how}: <b>{v}</b>. Wirelength {h}, best {b}.",
    plHowFree: "Not worse, no dice", plHowDice: "Chance {p} %, dice {u}",
    plRunMsg: "Seed {s}, {n} moves: best <b>{b}</b> ({bm}), final {f}. Accepted {a} ({be} better, {w} worse, {fr} free), rejected {r}.",
    plAtMove: "at move {k}", plNoBest: "it never beat the start", plDone: "The run is over. Press \"Start again\" or change the seed.",
    plSpread: "best wirelength, one dot per seed", plMedian: "median {v}", plSeedN: "seed {s}: {v}",
  });
  Object.assign(I18N.fr, {
    plStage: "Plan de la puce avec cellules et fils", plYours: "Votre essai", plPaused: "En pause. Vous essayez vos propres coups.",
    plHint: "Faites glisser une cellule pour voir la longueur de fil changer, ou laissez jouer le recuit : un coup à la fois, ou tout un essai.",
    plStart: "Faites glisser une cellule ou appuyez sur un bouton pour commencer. La leçon se met en pause pendant l'essai.",
    plBack: "De retour dans la leçon. Faites glisser une cellule pour réessayer.",
    plSeed: "Graine", plStep: "Un coup", plRun: "Jouer jusqu'au bout", plReset: "Recommencer",
    plWire: "longueur de fil", plBest: "meilleur jusqu'ici", plTemp: "température", plMoveN: "coup", plAcc: "acceptés", plRej: "refusés",
    plFinal: "final", plBetter: "mieux", plWorse: "pire", plFree: "gratuits", plChance: "chance d'accepter : {p} %",
    plNoDice: "pas pire : accepté, sans dé", plVAcc: "accepté", plVRej: "refusé", plVFree: "coup gratuit", plVBest: "nouveau record",
    plCell: "Cellule {n} : faites-la glisser, ou utilisez les flèches", plStartLine: "départ {v}", plBestLine: "meilleur {v}",
    plMoveLine: "Coup {k} : cellule {c}, {axis} {d}", plDelta: "fils {d}", plMoves: "coups",
    plDrag: "Votre placement : longueur de fil <b>{h}</b> (dans l'image de la leçon : {l}).",
    plStepMsg: "Coup {k} : cellule {c}, {axis} {d}. Fils {dh}. T = {T}. {how} : <b>{v}</b>. Longueur de fil {h}, meilleur {b}.",
    plHowFree: "Pas pire, sans dé", plHowDice: "Chance {p} %, dé {u}",
    plRunMsg: "Graine {s}, {n} coups : meilleur <b>{b}</b> ({bm}), final {f}. Acceptés {a} ({be} mieux, {w} pires, {fr} gratuits), refusés {r}.",
    plAtMove: "au coup {k}", plNoBest: "jamais mieux que le départ", plDone: "L'essai est fini. Appuyez sur « Recommencer » ou changez la graine.",
    plSpread: "meilleure longueur de fil, un point par graine", plMedian: "médiane {v}", plSeedN: "graine {s} : {v}",
  });

  /** The course's PRNG (platform/assets/placement-core.js), bit for bit. */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function netBox(net, pos) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const id of net) { const p = pos[id]; if (!p) continue; if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
    return x0 === Infinity ? null : [x0, y0, x1, y1];
  }
  /** Total half-perimeter wirelength: per net (width + height) of its bounding box, summed in net order. */
  function totalHpwl(nets, pos) {
    let s = 0;
    for (const n of nets) { const b = netBox(n, pos); if (b) s += (b[2] - b[0]) + (b[3] - b[1]); }
    return s;
  }
  const clonePos = (pos) => { const o = {}; for (const k in pos) o[k] = { x: pos[k].x, y: pos[k].y }; return o; };
  /** One annealing run with the lab's exact rules. P: { cells, nets, start, seed, moves, t0, cool, step, walls, frozen }.
   *  Per move: 4 draws (cell, axis, direction, size), then 1 more only when the move is worse. T cools after the test. */
  function saRun(P) {
    const rand = mulberry32(P.seed), lo = P.walls.min, hi = P.walls.max;
    const pick = P.frozen && P.frozen.length ? P.cells.filter((c) => !P.frozen.includes(c)) : P.cells;
    let pos = clonePos(P.start), cur = totalHpwl(P.nets, pos), best = cur, bestMove = 0, T = P.t0, draws = 0, clamped = 0, peak = cur;
    let bestPos = clonePos(pos);
    const tl = { acc: 0, rej: 0, better: 0, worse: 0, free: 0 };
    const R = { P, n: P.moves, mv: [null], pos: [pos], hp: [cur], best: [best], T: [T], tally: [Object.assign({}, tl)] };
    for (let k = 1; k <= P.moves; k++) {
      const cell = pick[Math.floor(rand() * pick.length)];
      const axis = rand() < 0.5 ? "x" : "y";
      const delta = (rand() < 0.5 ? -1 : 1) * P.step * (0.5 + rand());
      draws += 4;
      const fv = pos[cell][axis], proposed = fv + delta, tv = Math.max(lo, Math.min(hi, proposed));
      const trial = clonePos(pos); trial[cell][axis] = tv;
      const next = totalHpwl(P.nets, trial), d = next - cur;
      let u = null, p = 1, ok = true;
      if (d > 0) { u = rand(); draws++; p = Math.exp(-d / Math.max(T, 1e-9)); ok = u < p; }
      const kind = d < 0 ? "better" : d > 0 ? "worse" : "free";
      let newBest = false;
      if (ok) { pos = trial; cur = next; tl.acc++; tl[kind]++; if (cur < best) { best = cur; bestMove = k; bestPos = clonePos(pos); newBest = true; } } else tl.rej++;
      if (tv !== proposed) clamped++;
      if (cur > peak) peak = cur;
      R.mv.push({ k, cell, axis, fv, tv, delta, clamped: tv !== proposed, d, T, p, u, ok, kind, newBest, hpwl: cur, best });
      T *= P.cool;
      R.pos.push(pos); R.hp.push(cur); R.best.push(best); R.T.push(T); R.tally.push(Object.assign({}, tl));
    }
    return Object.assign(R, { bestVal: best, bestMove, bestPos, final: cur, draws, clamped, peak });
  }

  SCENES.placement = function (cx) {
    const { sb, T, L, err, resolve, esc, fill, lerp, ease, clamp } = cx;
    const PL = sb.placement || {};
    if (!sb.placement) err('the placement scene needs "placement" in the storyboard');
    const DATA = PL.data || { runs: {}, seeds: null };
    const DUR_STEP = 2.8, V_AT = 0.72, DUR_PANEL = 0.6;
    const DS = cx.lang === "fr" ? "," : ".";                 // decimal sign of the page's language
    const nf = (v, d) => v.toFixed(d).replace(".", DS);
    const f1 = (v) => nf(Math.round(v * 10) / 10, 1);
    const sg1 = (v) => (Math.abs(v) < 0.05 ? "0.0" : (v > 0 ? "+" : "−") + f1(Math.abs(v)));
    const dec = (v) => { const s = String(v); const i = s.indexOf("."); return i < 0 ? 0 : s.length - i - 1; };
    const same = (want, got) => typeof want !== "number" ? want === got : got != null && Math.abs(want - got) <= 0.5 * Math.pow(10, -dec(want)) + 1e-12;

    /* ---- runs: the checker's traces (build_lesson.py --data) and runs the storyboard asks for ---- */
    const first = Object.values(DATA.runs || {})[0];
    const BASE = Object.assign({ t0: 3, cool: 0.94, step: 1, moves: 60, seed: 42, walls: { min: -1, max: 9 }, frozen: [] },
      first ? { cells: first.cells, nets: first.nets, start: first.start, walls: first.walls, t0: first.t0, cool: first.cool, step: first.step } : {},
      PL.base || {});
    if (!BASE.cells || !BASE.nets || !BASE.start) err("placement: no cells, nets and start (build with --data <trace json>, or give placement.base)");
    const CELLS = BASE.cells || [], NETS = BASE.nets || [];
    const WMIN = BASE.walls.min, WMAX = BASE.walls.max;
    const COLORS = Object.assign({}, Object.fromEntries([...CELLS].sort().map((id, i) => [id, PAPER[i % PAPER.length]])), PL.colors || {});
    const PADS = new Set(PL.pads || []);
    const cache = new Map();
    function runOf(P) {
      const key = JSON.stringify([P.seed, P.moves, P.t0, P.cool, P.step, P.frozen || [], P.start]);
      if (!cache.has(key)) cache.set(key, saRun(P));
      return cache.get(key);
    }
    const NAMED = {};
    let dataChecked = 0, dataDiffer = 0, dataMoves = 0;
    for (const [name, d] of Object.entries(DATA.runs || {})) {
      const R = runOf(Object.assign({}, BASE, { cells: d.cells, nets: d.nets, start: d.start, walls: d.walls, seed: d.seed, moves: d.moves, t0: d.t0, cool: d.cool, step: d.step, frozen: d.frozen || [] }));
      NAMED[name] = R; dataChecked++;
      // the engine and the lab checker must tell the same story, move by move
      let bad = null;
      (d.m || []).forEach((w, i) => {
        const g = R.mv[i + 1];
        if (bad || !g) { bad = bad || `move ${i + 1} missing`; return; }
        dataMoves++;
        if (g.cell !== w[0] || g.axis !== w[1] || g.ok !== !!w[2] || Math.abs(g.hpwl - w[3]) > 1e-9 || (w[4] == null) !== (g.u == null) || (w[4] != null && Math.abs(g.u - w[4]) > 1e-12))
          bad = `move ${i + 1}: engine ${JSON.stringify([g.cell, g.axis, g.ok, g.hpwl, g.u])} checker ${JSON.stringify(w)}`;
      });
      if (!bad && d.best != null && Math.abs(d.best - R.bestVal) > 1e-9) bad = `best: engine ${R.bestVal} checker ${d.best}`;
      if (!bad && d.accepted != null && d.accepted !== R.tally[R.n].acc) bad = `accepted: engine ${R.tally[R.n].acc} checker ${d.accepted}`;
      if (bad) { dataDiffer++; err(`engine and checker disagree on run ${name}: ${bad}`); }
    }
    for (const [name, v] of Object.entries(PL.runs || {})) NAMED[name] = runOf(Object.assign({}, BASE, v));
    function run(v, label = "") {
      if (v && typeof v === "object") return runOf(Object.assign({}, BASE, v));
      if (NAMED[v]) return NAMED[v];
      err(`placement: unknown run ${JSON.stringify(v)} ${label}. Known: ${Object.keys(NAMED).join(", ") || "none"}`);
      return Object.values(NAMED)[0] || runOf(BASE);
    }
    /* seeds 1..N of the base run (the "one seed is one story" picture); compared with the checker's file when given */
    let SEEDS = null, seedsChecked = 0, seedsDiffer = 0;
    function seeds() {
      if (SEEDS) return SEEDS;
      const want = DATA.seeds, list = want ? want.seeds.map((s) => s.seed) : Array.from({ length: PL.seedCount || 200 }, (_, i) => i + 1);
      SEEDS = list.map((s) => { const R = saRun(Object.assign({}, BASE, { seed: s, moves: want ? want.moves : BASE.moves })); return { seed: s, best: R.bestVal, final: R.final, acc: R.tally[R.n].acc, rej: R.tally[R.n].rej, bestMove: R.bestMove }; });
      if (want) want.seeds.forEach((w, i) => {
        seedsChecked++;
        const g = SEEDS[i];
        if (Math.abs(g.best - w.best) > 1e-9 || Math.abs(g.final - w.final) > 1e-9 || g.acc !== w.accepted || g.rej !== w.rejected) { seedsDiffer++; if (seedsDiffer === 1) err(`engine and checker disagree on seed ${w.seed}: engine ${JSON.stringify(g)} checker ${JSON.stringify(w)}`); }
      });
      return SEEDS;
    }
    const median = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

    /* ---- claims: every number the narration or a text says ---- */
    const claims = [];
    for (const c of PL.claims || sb.claims || []) {
      let got = {}, ok = true;
      const cmp = (k, v) => { got[k] = v; if (c[k] != null && !same(c[k], v)) ok = false; };
      if (c.seeds) {
        const S = seeds(), bs = S.map((s) => s.best), mn = Math.min(...bs), mx = Math.max(...bs);
        cmp("min", mn); cmp("max", mx); cmp("median", median(bs));
        cmp("minSeed", S.find((s) => s.best === mn).seed); cmp("maxSeed", S.find((s) => s.best === mx).seed);
        cmp("finalAboveBest", S.filter((s) => s.final > s.best).length); cmp("count", S.length);
        if (c.worstRank) { const me = S.find((s) => s.seed === c.worstRank.seed); got.worstRank = me ? S.filter((s) => s.best > me.best).length + 1 : null; if (!same(c.worstRank.rank, got.worstRank)) ok = false; }
        if (c.beat) { const me = S.find((s) => s.seed === c.beat.seed); got.beat = me ? S.filter((s) => s.best < me.best).length : null; if (!same(c.beat.count, got.beat)) ok = false; }
      } else if (c.formula === "p") {
        cmp("p", Math.exp(-c.dHpwl / c.T));
      } else if (c.positions) {
        const pos = c.positions === "start" ? BASE.start : c.positions;
        if (c.net != null) { const b = NETS[c.net] && netBox(NETS[c.net], pos); cmp("hpwl", b ? (b[2] - b[0]) + (b[3] - b[1]) : null); }
        else cmp("hpwl", totalHpwl(NETS, pos));
      } else if (c.sameAs != null) {
        // two runs with the same seed tell the same story for as long as both last
        const A = run(c.run, "(claim)"), B = run(c.sameAs, "(claim)"), n = c.moves != null ? c.moves : Math.min(A.n, B.n);
        let k = 0; while (k < n && A.mv[k + 1] && B.mv[k + 1] && A.mv[k + 1].cell === B.mv[k + 1].cell && A.mv[k + 1].ok === B.mv[k + 1].ok && A.mv[k + 1].hpwl === B.mv[k + 1].hpwl) k++;
        got.sameMoves = k; if (k !== n) ok = false;
      } else {
        const R = run(c.run != null ? c.run : PL.run, "(claim)");
        if (c.move != null) {
          const m = R.mv[c.move];
          if (!m) { ok = false; got = null; } else { cmp("cell", m.cell); cmp("axis", m.axis); cmp("dHpwl", m.d); cmp("T", m.T); cmp("p", m.p); cmp("u", m.u); cmp("accepted", m.ok); cmp("kind", m.kind); cmp("hpwl", m.hpwl); cmp("bestSoFar", m.best); cmp("clamped", m.clamped); }
        } else {
          const tl = R.tally[R.n];
          cmp("start", R.hp[0]); cmp("best", R.bestVal); cmp("final", R.final); cmp("bestMove", R.bestMove); cmp("accepted", tl.acc); cmp("rejected", tl.rej);
          cmp("better", tl.better); cmp("worse", tl.worse); cmp("free", tl.free); cmp("draws", R.draws); cmp("clamped", R.clamped); cmp("peak", R.peak); cmp("Tend", R.T[R.n]);
        }
      }
      claims.push({ claim: c, got, ok });
      if (!ok) err(`claim failed: ${JSON.stringify(c)} -> ${JSON.stringify(got)}`);
    }

    /* ---- geometry ---- */
    const FB = PL.floorBox || [36, 168, 344, 344];       // the floor: walls WMIN..WMAX on both axes (stage units)
    const SB = PL.sideBox || [470, 168, 460, 344];       // move card, dice, tally, chart
    const U = FB[2] / (WMAX - WMIN), CS = 0.64 * U;
    const ux = (x) => FB[0] + (x - WMIN) * U, uy = (y) => FB[1] + FB[3] - (y - WMIN) * U;
    const TH = { x: FB[0] + FB[2] + 26, y: FB[1] + 34, w: 16, h: FB[3] - 46 };
    const CH = { x: SB[0] + 36, y: SB[1] + 176, w: SB[2] - 40, h: SB[3] - 176 - 24 };
    const DB = { x: SB[0], y: SB[1] + 72, w: SB[2], h: 22 };
    const SP = { x: CH.x, y: SB[1] + 64, w: CH.w, h: SB[3] - 64 - 24 };   // the seed spread is taller than the chart

    /* ---- the landscape sketch ("walking downhill in fog"): a shallow dip, a hill, a deeper valley ---- */
    const WALK = { top: 0.03, dip: 0.27, hill: 0.5, valley: 0.8 };
    const LAND = [[0, 0.95], [0.27, 0.55], [0.5, 0.82], [0.8, 0.12], [1, 0.62]];   // x, height (0..1)
    const landH = (x) => { for (let i = 1; i < LAND.length; i++) if (x <= LAND[i][0]) { const a = LAND[i - 1], b = LAND[i], f = (x - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], (1 - Math.cos(Math.PI * f)) / 2); } return LAND[LAND.length - 1][1]; };

    /* ---- tracks ---- */
    const tracks = {
      run: { init: PL.run || Object.keys(NAMED)[0], conv: (v) => v, dur: 0.5, mix: null },
      move: { init: 0, conv: (v) => (v && typeof v === "object" ? v : { to: v }), dur: DUR_STEP, mix: null, checkDur: 1.0 },
      camera: { init: "full", conv: "camera", dur: 1.3, mix: (a, b, p) => cx.mixArr(a, b, p) },
      side: { init: 1, conv: (v) => +v, dur: DUR_PANEL, mix: lerp },
      walker: { init: "top", conv: (v) => { if (WALK[v] == null) { err(`placement: walker must be top, dip, hill or valley, not ${v}`); return WALK.top; } return WALK[v]; }, dur: 1.5, mix: lerp },
      dim: { init: 1, conv: (v) => +v, dur: 0.6, mix: lerp },
    };
    let sideAt, dimAt, walkAt, RUNK, SEGS;
    function ready() {
      sideAt = cx.track("side"); dimAt = cx.track("dim"); walkAt = cx.track("walker");
      RUNK = cx.keys("run").map(([t, v, ref]) => ({ t, R: run(v, `(run key ${ref})`) }));
      const runSeg = (t) => { let i = 0; for (let k = 0; k < RUNK.length; k++) if (RUNK[k].t <= t) i = k; return RUNK[i]; };
      SEGS = [];
      cx.keys("move").forEach(([t, spec, ref]) => {
        const rs = runSeg(t), R = rs.R, prev = SEGS[SEGS.length - 1];
        const prevN = prev && prev.t >= rs.t ? prev.n : 0;
        let n = spec.to === "all" || spec.to === "end" ? R.n : +spec.to;
        if (!(n >= 0 && n <= R.n)) { err(`placement: move must be 0..${R.n} or "all" (key ${ref})`); n = clamp(n || 0, 0, R.n); }
        // "stop": play one move only up to its change in wirelength ("delta") or up to the dice ("dice") and hold
        // there; the next key with the same "to" plays the rest.
        const resume = prev && prev.hold != null && prev.t >= rs.t && n === prev.prevN + 1 ? prev : null;
        const base = resume ? resume.prevN : prevN, count = n - base;
        const detail = count > 0 && (spec.detail != null ? !!spec.detail : count === 1);
        let hold = null;
        if (spec.stop != null) {
          hold = { delta: 0.44, dice: 0.7 }[spec.stop];
          if (hold == null || count !== 1) { err(`placement: move key ${ref}: "stop" is "delta" or "dice", on a key that plays exactly one move`); hold = null; }
        }
        const q0 = resume ? resume.hold : 0, q1 = hold != null ? hold : 1;
        let dur = 0;
        if (count > 0) dur = spec.until != null ? resolve(spec.until, "(move until)") - t : spec.over != null ? +spec.over : detail ? DUR_STEP * count * (q1 - q0) : clamp(count * 0.22, 1.5, 9);
        if (count > 0 && dur <= 0) { err(`placement: move key ${ref} has no time to play (until is before the key)`); dur = 0.5; }
        if (prev && prev.count > 0 && prev.t >= rs.t && t < prev.t + prev.dur - 0.05) err(`placement: move key ${ref} at ${t.toFixed(2)}s starts before the previous replay is over (${(prev.t + prev.dur).toFixed(2)}s): move it later or shorten the replay with "over"`);
        // one detailed move: its progress q runs from q0 to q1; "phases" pins delta, dice and verdict to words
        let remap = null;
        if (count === 1 && detail) {
          const pts = [[t, q0]];
          for (const [name, q] of [["delta", 0.3], ["dice", 0.45], ["verdict", V_AT]]) if (spec.phases && spec.phases[name] != null && q > q0 && q < q1) pts.push([resolve(spec.phases[name], `(move phase ${name})`), q]);
          pts.push([t + dur, q1]);
          for (let i = 1; i < pts.length; i++) if (pts[i][0] <= pts[i - 1][0]) err(`placement: move key ${ref}: the phases must come in the order delta, dice, verdict, between the key and its end`);
          remap = (time) => { for (let i = 1; i < pts.length; i++) if (time < pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (time - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])); return q1; };
          remap.pts = pts;
        } else if (spec.phases) err(`placement: move key ${ref}: "phases" needs a key that plays exactly one move`);
        SEGS.push({ t, n: hold != null ? base : n, prevN: base, count, dur, detail, R, ref, remap, hold, q0, q1, pts: remap ? remap.pts : null });
      });
      for (const o of sb.overlays || []) if (o.type === "thumbs") for (const it of o.items || []) run(it.run != null ? it.run : PL.run, "(thumbs)");
      if ((cx.WIN.spread || []).length) seeds();
    }
    /** Sound cues: the dice rattles, a wall is hit, and every move gets its verdict (see the core's SND). */
    const verdictSound = (m) => (m.ok ? (m.newBest ? "best" : m.kind === "free" ? "free" : m.kind === "better" ? "good" : "risk") : "reject");
    function cues() {
      const out = [];
      for (const g of SEGS) {
        if (g.count <= 0) continue;
        if (g.pts) {   // one detailed move: find the time at which its progress reaches q
          const m = g.R.mv[g.prevN + 1];
          const when = (q) => { if (q <= g.q0 || q > g.q1) return null; for (let i = 1; i < g.pts.length; i++) { const a = g.pts[i - 1], b = g.pts[i]; if (q <= b[1]) return a[0] + ((q - a[1]) / (b[1] - a[1])) * (b[0] - a[0]); } return null; };
          const add = (q, type) => { const t = when(q); if (t != null) out.push({ t, type }); };
          add(0.02, "slide");                                  // the ghost slides to the proposed place
          if (m.clamped) add(0.27, "wall");
          if (m.d !== 0) add(0.31, m.d > 0 ? "grow" : "shrink"); // the wires get longer or shorter
          if (m.u != null) add(0.47, "dice");
          add(V_AT, verdictSound(m));
        } else {
          const each = g.dur / g.count, at = g.detail ? V_AT : 0.5;
          for (let j = 0; j < g.count; j++) { const m = g.R.mv[g.prevN + j + 1]; out.push({ t: g.t + (j + at) * each, type: verdictSound(m) }); if (g.detail && m.u != null) out.push({ t: g.t + (j + 0.47) * each, type: "dice" }); }
        }
      }
      return out;
    }
    /** What the annealer is doing at time t: k moves done, move m in progress (or null) at progress q. */
    function stateAt(t) {
      let rs = RUNK[0];
      for (const r of RUNK) if (r.t <= t) rs = r;
      let seg = null;
      for (const s of SEGS) if (s.t <= t && s.t >= rs.t) seg = s;
      if (!seg) return { R: rs.R, k: 0, m: null, q: 0, detail: false };
      if (seg.remap) { const q = seg.remap(t); return q >= 1 ? { R: seg.R, k: seg.prevN + 1, m: null, q: 0, detail: false } : { R: seg.R, k: seg.prevN, m: seg.R.mv[seg.prevN + 1], q, detail: true }; }
      return inSeg(seg.R, seg.prevN, seg.count, seg.detail, seg.dur > 0 ? (t - seg.t) / seg.dur : 1, seg.n);
    }
    function inSeg(R, prevN, count, detail, frac, n) {
      if (count > 0 && frac < 1) {
        const x = Math.max(0, frac) * count, idx = Math.min(count - 1, Math.floor(x));
        return { R, k: prevN + idx, m: R.mv[prevN + idx + 1], q: x - idx, detail };
      }
      return { R, k: n, m: null, q: 0, detail: false };
    }
    /** Everything drawn for a state: positions, ghost, numbers. `custom` = the learner's own positions. */
    function picture(S, custom) {
      const { R, k, m, q, detail } = S;
      const pos = clonePos(custom || R.pos[k]);
      const vAt = detail ? V_AT : 0.5;
      let ghost = null, done = k, card = k > 0 ? R.mv[k] : null, cardQ = 1;
      if (m && !custom) {
        card = m; cardQ = q;
        const slide = detail ? ease(q / 0.28) : ease(q / 0.45);
        const g = { id: m.cell, x: pos[m.cell].x, y: pos[m.cell].y, op: 0, bad: false };
        if (m.ok) {
          const a = detail ? ease((q - V_AT) / (1 - V_AT)) : ease(q / 0.7);
          pos[m.cell][m.axis] = lerp(m.fv, m.tv, a);
          if (detail) { g[m.axis] = lerp(m.fv, m.tv, slide); g.op = 1 - clamp((q - V_AT) / 0.2); }
        } else {
          const back = detail ? ease((q - V_AT) / (1 - V_AT)) : 0;
          g[m.axis] = lerp(lerp(m.fv, m.tv, slide), m.fv, back);
          g.op = detail ? 1 - clamp((q - V_AT - 0.05) / 0.2) : Math.sin(Math.PI * q) * 0.8;
          g.bad = q >= vAt;
        }
        ghost = g.op > 0.01 ? g : null;
        if (q >= vAt) done = k + 1;
      }
      const Tn = m && !custom ? lerp(R.T[k], R.T[k + 1], clamp((q - 0.88) / 0.12)) : R.T[k];
      return { R, k, m: custom ? null : m, q, detail, pos, ghost, done, card: custom ? null : card, cardQ, T: Tn, hpwl: totalHpwl(NETS, pos), tally: R.tally[done], best: R.best[done], vAt, custom: !!custom };
    }

    /* ---- SVG ---- */
    let gFloor, gNets, gCells, gGhost, gBest, gThermo, gSide, gCard, gDice, gTally, gChart, gSpread, gPiles, gLand, wallEl;
    const pileEls = [];
    const netEls = [], trialEls = [], cellEls = {}, bestEls = {};
    let E = {}, lastP = null, spreadDots = [];
    function buildSvg() {
      const { mk } = cx;
      gFloor = mk("g", { class: "pl-floor" });
      mk("rect", { class: "pl-chip", x: ux(0), y: uy(8), width: 8 * U, height: 8 * U }, gFloor);
      const gl = mk("g", { class: "pl-gridlines" }, gFloor);
      for (let v = Math.ceil(WMIN); v <= WMAX; v++) { mk("line", { x1: ux(v), y1: uy(WMIN), x2: ux(v), y2: uy(WMAX) }, gl); mk("line", { x1: ux(WMIN), y1: uy(v), x2: ux(WMAX), y2: uy(v) }, gl); }
      wallEl = mk("rect", { class: "pl-wall", x: ux(WMIN), y: uy(WMAX), width: FB[2], height: FB[3] }, gFloor);
      const ax = mk("g", { class: "pl-axis" }, gFloor);
      for (const v of [0, 4, 8]) { mk("text", { x: ux(v), y: uy(WMIN) + 14 }, ax).textContent = String(v); mk("text", { x: ux(WMIN) - 9, y: uy(v) + 1, class: "pl-axis-y" }, ax).textContent = String(v); }
      gNets = mk("g", { class: "pl-nets" }, gFloor);
      NETS.forEach((net, i) => {
        const g = mk("g", { class: "pl-net" }, gNets);
        netEls.push({ g, r: mk("rect", { rx: 4 }, g), ln: mk("line", {}, g), lab: mk("text", {}, g) });
        trialEls.push(mk("rect", { class: "pl-trial", rx: 4 }, gNets));
      });
      gBest = mk("g", { class: "pl-bestpos" }, gFloor);
      for (const id of CELLS) bestEls[id] = mk("rect", { rx: 4, width: CS, height: CS, stroke: COLORS[id] }, gBest);
      gGhost = mk("g", { class: "pl-ghost" }, gFloor);
      E.gr = mk("rect", { rx: 4, width: CS, height: CS, x: -CS / 2, y: -CS / 2 }, gGhost); E.gt = mk("text", { y: 1 }, gGhost);
      gCells = mk("g", { class: "pl-cells" }, gFloor);
      for (const id of CELLS) {
        const g = mk("g", { class: "plk" + (PADS.has(id) ? " pad" : ""), tabindex: 0, role: "button", "aria-label": fill(T.plCell, { n: id }) }, gCells);
        mk("rect", { class: "pl-ring", rx: 7, x: -CS / 2 - 5, y: -CS / 2 - 5, width: CS + 10, height: CS + 10 }, g);
        mk("rect", { rx: 4, x: -CS / 2, y: -CS / 2, width: CS, height: CS, fill: COLORS[id] }, g);
        mk("text", { y: 1 }, g).textContent = id;
        bindCell(g, id);
        cellEls[id] = g;
      }
      gPiles = mk("g", { class: "pl-piles" }, gFloor);
      for (let i = 0; i < 3; i++) { const g = mk("g", {}, gPiles); mk("rect", { rx: 9 }, g); mk("circle", { r: 13 }, g); mk("text", { y: 1 }, g); pileEls.push(g); }
      // landscape sketch (its own group: it does not follow "side")
      gLand = mk("g", { class: "pl-land" });
      const LX = (x) => SP.x + x * SP.w, LY = (x) => SP.y + 30 + (1 - landH(x)) * (SP.h - 60);
      let dPath = `M ${LX(0).toFixed(1)} ${LY(0).toFixed(1)}`;
      for (let i = 1; i <= 80; i++) dPath += ` L ${LX(i / 80).toFixed(1)} ${LY(i / 80).toFixed(1)}`;
      mk("path", { class: "ground", d: dPath + ` L ${LX(1).toFixed(1)} ${(SP.y + SP.h).toFixed(1)} L ${LX(0).toFixed(1)} ${(SP.y + SP.h).toFixed(1)} Z` }, gLand);
      mk("path", { class: "line", d: dPath }, gLand);
      E.lb = mk("circle", { class: "ball", r: 11 }, gLand);
      const LL = (PL.landscape && PL.landscape.labels) || {};
      for (const k of ["dip", "valley"]) if (LL[k]) { const tx = mk("text", { class: "lab " + k, x: LX(WALK[k]), y: LY(WALK[k]) + 30 }, gLand); tx.textContent = L(LL[k]); E["ll" + k] = tx; }
      E.land = { LX, LY };
      // thermometer
      gThermo = mk("g", { class: "pl-thermo" });
      mk("rect", { class: "tube", x: TH.x, y: TH.y, width: TH.w, height: TH.h, rx: TH.w / 2 }, gThermo);
      E.tf = mk("rect", { class: "fill", x: TH.x + 3, width: TH.w - 6, rx: (TH.w - 6) / 2 }, gThermo);
      E.tl = mk("text", { x: TH.x + TH.w / 2, y: TH.y - 22 }, gThermo); E.tl.textContent = "T";
      E.tv = mk("text", { class: "v", x: TH.x + TH.w / 2, y: TH.y - 7 }, gThermo);
      // side panel: move card, dice, tally, chart or spread
      gSide = mk("g", { class: "pl-side" });
      gCard = mk("g", { class: "pl-card" }, gSide);
      E.ml = mk("text", { class: "line", x: SB[0], y: SB[1] + 14 }, gCard);
      E.md = mk("text", { class: "delta", x: SB[0], y: SB[1] + 40 }, gCard);
      E.mv = mk("text", { class: "verdict", x: SB[0] + SB[2], y: SB[1] + 34 }, gCard);
      gDice = mk("g", { class: "pl-dice" }, gSide);
      mk("rect", { class: "track", x: DB.x, y: DB.y, width: DB.w, height: DB.h, rx: 5 }, gDice);
      E.dp = mk("rect", { class: "pfill", x: DB.x, y: DB.y, height: DB.h, rx: 5 }, gDice);
      E.dm = mk("g", { class: "marker" }, gDice);
      mk("line", { x1: 0, y1: DB.y - 7, x2: 0, y2: DB.y + DB.h + 7 }, E.dm); mk("circle", { cx: 0, cy: DB.y + DB.h / 2, r: 6.5 }, E.dm);
      E.dt = mk("text", { x: DB.x, y: DB.y + DB.h + 20 }, gDice);
      E.du = mk("text", { class: "u", y: DB.y - 11 }, gDice);
      gTally = mk("g", { class: "pl-tally" }, gSide);
      E.t1 = mk("text", { x: SB[0], y: SB[1] + 136 }, gTally); E.t2 = mk("text", { class: "kinds", x: SB[0], y: SB[1] + 157 }, gTally);
      gChart = mk("g", { class: "pl-chart" }, gSide);
      mk("line", { class: "axis", x1: CH.x, y1: CH.y, x2: CH.x, y2: CH.y + CH.h }, gChart); mk("line", { class: "axis", x1: CH.x, y1: CH.y + CH.h, x2: CH.x + CH.w, y2: CH.y + CH.h }, gChart);
      E.cs = mk("line", { class: "startline" }, gChart); E.csl = mk("text", { class: "lab start" }, gChart);
      E.cb = mk("polyline", { class: "best" }, gChart); E.cc = mk("polyline", { class: "cur" }, gChart); E.cd = mk("circle", { class: "dot", r: 5 }, gChart);
      E.cbl = mk("text", { class: "lab bestl" }, gChart);
      E.chi = mk("text", { class: "tick", x: CH.x - 6, y: CH.y + 4 }, gChart); E.clo = mk("text", { class: "tick", x: CH.x - 6, y: CH.y + CH.h }, gChart);
      E.cx0 = mk("text", { class: "tick x", x: CH.x, y: CH.y + CH.h + 16 }, gChart); E.cx0.textContent = "0";
      E.cx1 = mk("text", { class: "tick x end", x: CH.x + CH.w, y: CH.y + CH.h + 16 }, gChart);
      gSpread = mk("g", { class: "pl-spread" }, gSide);
    }
    function buildSpread(w) {
      const { mk } = cx, S = seeds(), bs = S.map((s) => s.best);
      gSpread.innerHTML = ""; spreadDots = [];
      const lo = 0, hi = Math.ceil(Math.max(...bs) / 5) * 5 + 2, X = (v) => SP.x + ((v - lo) / (hi - lo)) * SP.w, base = SP.y + SP.h;
      mk("line", { class: "axis", x1: SP.x, y1: base, x2: SP.x + SP.w, y2: base }, gSpread);
      for (let v = 0; v <= hi; v += 10) { mk("line", { class: "axis", x1: X(v), y1: base, x2: X(v), y2: base + 5 }, gSpread); mk("text", { class: "tick x mid", x: X(v), y: base + 17 }, gSpread).textContent = String(v); }
      mk("text", { class: "scap", x: SP.x, y: SP.y - 10 }, gSpread).textContent = T.plSpread;
      const bins = {}, binW = 1.25; let maxN = 1;
      const order = [...S].sort((a, b) => a.best - b.best);
      const lay = order.map((s) => { const b = Math.floor(s.best / binW); bins[b] = (bins[b] || 0) + 1; maxN = Math.max(maxN, bins[b]); return { s, b, n: bins[b] }; });
      const nHot = (w.seeds || []).length, dy = Math.min(7.4, (SP.h - 40 - 18 * nHot) / maxN), marks = new Set(w.seeds || []);
      for (const d of lay) {
        const hot = marks.has(d.s.seed);
        const c = mk("circle", { class: "d" + (hot ? " hot" : ""), cx: X((d.b + 0.5) * binW).toFixed(1), cy: (base - 5 - (d.n - 1) * dy).toFixed(1), r: hot ? 5 : 2.9 }, gSpread);
        spreadDots.push({ c, seed: d.s.seed });
      }
      if (w.median !== false) {
        const md = median(bs);
        mk("line", { class: "median", x1: X(md), y1: SP.y + 6, x2: X(md), y2: base }, gSpread);
        mk("text", { class: "lab med", x: X(md) + 5, y: SP.y + 16 }, gSpread).textContent = fill(T.plMedian, { v: f1(md) });
      }
      (w.seeds || []).forEach((sd, i) => {
        const s = S.find((x) => x.seed === sd); if (!s) return;
        const right = X(s.best) > SP.x + SP.w * 0.6, ly = SP.y + 40 + i * 18;
        mk("line", { class: "lead", x1: X(s.best), y1: base - 10, x2: X(s.best), y2: ly + 5 }, gSpread);
        const tx = mk("text", { class: "lab hot" + (right ? " endl" : ""), x: X(s.best) + (right ? 4 : -4), y: ly }, gSpread);
        tx.textContent = fill(T.plSeedN, { s: sd, v: f1(s.best) });
      });
      gSpread._key = w;
    }

    /* ---- widgets ---- */
    let counter, cl, cv, cbox;
    function buildWidgets() {
      const W = sb.widgets || {};
      counter = cx.widget("ov-counter", W.counter || { x: 79, y: 3 }, `<div class="counter pl-counter"><span class="l"></span><span class="v">0</span></div>`);
      cl = counter.querySelector(".l"); cv = counter.querySelector(".v"); cbox = counter.querySelector(".counter");
      return [{ d: counter, label: "counter" }];
    }
    const METRIC = {
      hpwl: (P) => [T.plWire, f1(P.hpwl), P.hpwl], best: (P) => [T.plBest, f1(P.best), P.best], temp: (P) => [T.plTemp, nf(P.T, 2), P.T],
      move: (P) => [T.plMoveN, String(P.done), P.done], accepted: (P) => [T.plAcc, String(P.tally.acc), P.tally.acc], rejected: (P) => [T.plRej, String(P.tally.rej), P.tally.rej],
      final: (P) => [T.plFinal, f1(P.R.final), P.R.final],
    };

    /* ---- render ---- */
    function current(t, F) {
      if (!F) return picture(stateAt(t));
      if (F.anim) {
        const A = F.anim, frac = (performance.now() - A.t0) / (cx.reduce ? 1 : A.dur);
        if (frac >= 1) { F.k = A.k1; F.anim = null; } else {
          const S = inSeg(F.run, A.k0, A.k1 - A.k0, A.detail, frac, A.k1);
          if (!A.detail && S.k !== A.said) { A.said = S.k; if (S.k > A.k0) cx.sfx(verdictSound(F.run.mv[S.k]), false); }
          return picture(S);
        }
      }
      return picture({ R: F.run, k: F.k, m: null, q: 0, detail: false }, F.custom);
    }
    function render(t, F, layer) {
      if (layer === "widgets") return lastP && renderWidgets(t, F, lastP);
      const P = current(t, F);
      lastP = P;
      const setOp = cx.setOp, dim = F ? 1 : dimAt(t), side = F ? 1 : sideAt(t);
      const on = (name) => !!F || !!cx.win(name, t);
      const fade = (name) => { if (F) return name === "spread" ? 0 : 1; const w = cx.win(name, t); return w ? Math.min(w.a <= 0.01 ? 1 : clamp((t - w.a) / 0.4), clamp((w.b - t) / 0.25)) : 0; };
      setOp(gFloor, dim); setOp(gSide, dim * side); setOp(gThermo, dim * fade("thermo"));

      // nets: bounding boxes (a two-pin net also gets its straight line); the nets of the moving cell stand out
      const netsOp = fade("nets"), labW = !F && cx.win("netlabels", t), hot = P.m || P.ghost ? (P.m || {}).cell : null;
      const hlNets = new Set(F ? [] : cx.wins("nets", t).flatMap((w) => w.ids || []));
      const only = !F && cx.wins("nets", t).some((w) => w.only) ? hlNets : null;
      setOp(gNets, netsOp);
      NETS.forEach((net, i) => {
        const b = netBox(net, P.pos), N = netEls[i];
        const x = ux(b[0]), y = uy(b[3]), w = (b[2] - b[0]) * U, h = (b[3] - b[1]) * U;
        N.r.setAttribute("x", (x - 4).toFixed(1)); N.r.setAttribute("y", (y - 4).toFixed(1)); N.r.setAttribute("width", (w + 8).toFixed(1)); N.r.setAttribute("height", (h + 8).toFixed(1));
        const two = net.length === 2, a = P.pos[net[0]], c = P.pos[net[1]];
        if (two) { N.ln.setAttribute("x1", ux(a.x).toFixed(1)); N.ln.setAttribute("y1", uy(a.y).toFixed(1)); N.ln.setAttribute("x2", ux(c.x).toFixed(1)); N.ln.setAttribute("y2", uy(c.y).toFixed(1)); }
        setOp(N.ln, two ? 1 : 0);
        N.g.classList.toggle("hot", (hot != null && net.includes(hot)) || hlNets.has(i));
        setOp(N.g, only && !only.has(i) ? 0.12 : 1);
        if (labW && (!labW.ids || labW.ids.includes(i))) {
          N.lab.textContent = f1(b[2] - b[0] + b[3] - b[1]);
          // a two-pin net: beside its wire, on the side of the floor's centre; a bigger net: inside its box.
          // Of a few candidate spots, take the first that no cell covers.
          const mid = (WMIN + WMAX) / 2, cands = [];
          if (two) for (const f of [0.5, 0.3, 0.7, 0.15]) {
            const px = lerp(a.x, c.x, f), py = lerp(a.y, c.y, f), vert = h > w;
            cands.push(vert ? [px + (px > mid ? -0.62 : 0.62), py] : [px, py + (py > mid ? -0.4 : 0.4)]);
          } else for (const dyU of [0, 1.6, -1.6, 2.6, -2.6]) cands.push([(b[0] + b[2]) / 2, (b[1] + b[3]) / 2 + dyU]);
          const free = (q) => CELLS.every((id) => Math.abs(P.pos[id].x - q[0]) > 0.85 || Math.abs(P.pos[id].y - q[1]) > 0.55);
          const spot = cands.find(free) || cands[0], lx = ux(spot[0]), ly = uy(spot[1]);
          N.lab.setAttribute("x", lx.toFixed(1)); N.lab.setAttribute("y", ly.toFixed(1));
          setOp(N.lab, clamp((t - labW.a) / 0.4));
        } else setOp(N.lab, 0);
        // the box the net would have if the proposed move were kept
        const tr = trialEls[i];
        if (P.ghost && P.detail && net.includes(P.ghost.id) && P.q < P.vAt + 0.1) {
          const tp = Object.assign({}, P.pos, { [P.ghost.id]: P.ghost }), tb = netBox(net, tp);
          tr.setAttribute("x", (ux(tb[0]) - 4).toFixed(1)); tr.setAttribute("y", (uy(tb[3]) - 4).toFixed(1));
          tr.setAttribute("width", ((tb[2] - tb[0]) * U + 8).toFixed(1)); tr.setAttribute("height", ((tb[3] - tb[1]) * U + 8).toFixed(1));
          setOp(tr, P.ghost.op * 0.9);
        } else setOp(tr, 0);
      });

      // cells, ghost of the proposed move, outline of the best placement so far
      const hl = new Set(F ? (F.drag ? [F.drag] : []) : cx.wins("highlight", t).flatMap((w) => w.ids || []));
      for (const id of CELLS) {
        const p = P.pos[id], g = cellEls[id];
        g.setAttribute("transform", `translate(${ux(p.x).toFixed(1)} ${uy(p.y).toFixed(1)})`);
        g.classList.toggle("hl", hl.has(id) || (P.m && P.detail && P.m.cell === id));
      }
      if (P.ghost) {
        gGhost.setAttribute("transform", `translate(${ux(P.ghost.x).toFixed(1)} ${uy(P.ghost.y).toFixed(1)})`);
        E.gt.textContent = P.ghost.id; gGhost.classList.toggle("bad", P.ghost.bad); setOp(gGhost, P.ghost.op);
      } else setOp(gGhost, 0);
      wallEl.classList.toggle("hit", !!(P.m && P.detail && P.m.clamped && P.q > 0.24 && P.q < P.vAt));
      const bw = !F && cx.win("bestpos", t);
      if (bw) {
        // the best placement so far is the placement right after the last move that set a new best
        let bk = 0; for (let i = 1; i <= P.done; i++) if (P.R.mv[i].newBest) bk = i;
        for (const id of CELLS) { const p = P.R.pos[bk][id]; bestEls[id].setAttribute("x", (ux(p.x) - CS / 2).toFixed(1)); bestEls[id].setAttribute("y", (uy(p.y) - CS / 2).toFixed(1)); }
        setOp(gBest, clamp((t - bw.a) / 0.4));
      } else setOp(gBest, 0);

      // piles: cells drawn on top of each other get one red ring and a "×n" badge
      const pw = !F && cx.win("piles", t);
      if (pw) {
        const grp = {}, find = (a) => (grp[a] === a ? a : (grp[a] = find(grp[a])));
        for (const id of CELLS) grp[id] = id;
        for (let i = 0; i < CELLS.length; i++) for (let j = i + 1; j < CELLS.length; j++) { const a = P.pos[CELLS[i]], b = P.pos[CELLS[j]]; if (Math.abs(a.x - b.x) < 0.64 && Math.abs(a.y - b.y) < 0.64) grp[find(CELLS[i])] = find(CELLS[j]); }
        const sets = {}; for (const id of CELLS) (sets[find(id)] = sets[find(id)] || []).push(id);
        const piles = Object.values(sets).filter((g) => g.length > 1);
        pileEls.forEach((g, i) => {
          const pl = piles[i]; if (!pl) return setOp(g, 0);
          const xs = pl.map((id) => ux(P.pos[id].x)), ys = pl.map((id) => uy(P.pos[id].y));
          const x0 = Math.min(...xs) - CS / 2 - 7, x1 = Math.max(...xs) + CS / 2 + 7, y0 = Math.min(...ys) - CS / 2 - 7, y1 = Math.max(...ys) + CS / 2 + 7;
          const [r, c, tx] = g.children;
          r.setAttribute("x", x0.toFixed(1)); r.setAttribute("y", y0.toFixed(1)); r.setAttribute("width", (x1 - x0).toFixed(1)); r.setAttribute("height", (y1 - y0).toFixed(1));
          c.setAttribute("cx", (x1 + 6).toFixed(1)); c.setAttribute("cy", (y0 - 6).toFixed(1)); tx.setAttribute("x", (x1 + 6).toFixed(1)); tx.setAttribute("y", (y0 - 5).toFixed(1)); tx.textContent = "×" + pl.length;
          setOp(g, clamp((t - pw.a) / 0.4));
        });
      } else pileEls.forEach((g) => setOp(g, 0));

      // landscape sketch
      const lw = !F && cx.win("landscape", t);
      if (lw) {
        const wx = walkAt(t);
        E.lb.setAttribute("cx", E.land.LX(wx).toFixed(1)); E.lb.setAttribute("cy", (E.land.LY(wx) - 12).toFixed(1));
        for (const k of ["dip", "valley"]) if (E["ll" + k]) setOp(E["ll" + k], lw.labels === false ? 0 : 1);
        setOp(gLand, dim * fade("landscape"));
      } else setOp(gLand, 0);

      // thermometer
      const fr = clamp(P.T / P.R.P.t0), fh = Math.max(TH.w - 6, fr * (TH.h - 6));
      E.tf.setAttribute("y", (TH.y + TH.h - 3 - fh).toFixed(1)); E.tf.setAttribute("height", fh.toFixed(1));
      E.tf.setAttribute("fill", `rgb(${Math.round(lerp(37, 220, fr))},${Math.round(lerp(99, 38, fr))},${Math.round(lerp(235, 38, fr))})`);
      E.tv.textContent = nf(P.T, 2);

      // move card, dice
      const c = P.card, cardOp = fade("move"), diceOp = fade("dice");
      if (c) {
        E.ml.textContent = fill(T.plMoveLine, { k: c.k, c: c.cell, axis: c.axis, d: sg1(c.delta) });
        const dq = P.m ? (P.detail ? clamp((P.cardQ - 0.3) / 0.12) : 1) : 1;
        E.md.textContent = fill(T.plDelta, { d: sg1(c.d * dq) });
        E.md.setAttribute("class", "delta " + c.kind); setOp(E.md, P.m && P.detail ? clamp((P.cardQ - 0.28) / 0.06) : 1);
        const shown = !P.m || P.cardQ >= P.vAt;
        E.mv.textContent = shown ? (c.ok ? (c.kind === "free" ? T.plVFree : T.plVAcc) : T.plVRej) + (c.ok && c.newBest ? " · " + T.plVBest : "") : "";
        E.mv.setAttribute("class", "verdict " + (c.ok ? (c.kind === "free" ? "free" : "yes") : "no"));
        setOp(E.mv, shown ? (P.m ? clamp((P.cardQ - P.vAt) / 0.06) : 1) : 0);
        const dOn = !P.m || !P.detail || P.cardQ >= 0.45;
        E.dp.setAttribute("width", (DB.w * c.p).toFixed(1));
        E.dp.setAttribute("class", "pfill" + (c.u == null ? " sure" : ""));
        E.dt.textContent = c.u == null ? T.plNoDice : fill(T.plChance, { p: Math.round(c.p * 100) });
        if (c.u != null) {
          const a = P.m && P.detail ? ease((P.cardQ - 0.47) / 0.2) : 1, mx = DB.x + DB.w * c.u * a;
          E.dm.setAttribute("transform", `translate(${mx.toFixed(1)} 0)`); E.dm.setAttribute("class", "marker " + (a >= 1 ? (c.ok ? "yes" : "no") : ""));
          E.du.textContent = a >= 1 ? nf(c.u, 2) : ""; E.du.setAttribute("x", clamp(mx, DB.x + 14, DB.x + DB.w - 14).toFixed(1));
          setOp(E.dm, 1); setOp(E.du, 1);
        } else { setOp(E.dm, 0); setOp(E.du, 0); }
        setOp(gCard, cardOp); setOp(gDice, diceOp * (dOn ? (P.m && P.detail ? clamp((P.cardQ - 0.45) / 0.06) : 1) : 0));
      } else { setOp(gCard, 0); setOp(gDice, 0); }

      // tally
      const tw = F ? { kinds: true } : cx.win("tally", t);
      setOp(gTally, fade("tally"));
      if (tw) {
        E.t1.textContent = `${T.plAcc} ${P.tally.acc}  ·  ${T.plRej} ${P.tally.rej}`;
        E.t2.textContent = tw.kinds ? `${P.tally.better} ${T.plBetter}  ·  ${P.tally.worse} ${T.plWorse}  ·  ${P.tally.free} ${T.plFree}` : "";
      }

      // chart of the wirelength after each move (current) and the best so far; or the spread over seeds
      const sw = !F && cx.win("spread", t), cw = F ? { best: true } : cx.win("chart", t);
      if (sw) {
        if (gSpread._key !== sw) buildSpread(sw);
        setOp(gSpread, fade("spread"));
        const span = sw.stagger != null ? sw.stagger : 1.6;
        spreadDots.forEach((d, i) => setOp(d.c, clamp((t - sw.a - (i / spreadDots.length) * span) / 0.15)));
      } else setOp(gSpread, 0);
      if (cw && !sw) {
        const R = P.R, lo = Math.floor(Math.min(...R.hp) - 1), hi = Math.ceil(R.peak + 1);
        const X = (i) => CH.x + (i / R.n) * CH.w, Y = (v) => CH.y + CH.h - ((v - lo) / (hi - lo)) * CH.h;
        const pts = [], bp = [];
        for (let i = 0; i <= P.done; i++) { pts.push(`${X(i).toFixed(1)},${Y(R.hp[i]).toFixed(1)}`); if (i > 0) bp.push(`${X(i).toFixed(1)},${Y(R.best[i - 1]).toFixed(1)}`); bp.push(`${X(i).toFixed(1)},${Y(R.best[i]).toFixed(1)}`); }
        E.cc.setAttribute("points", pts.join(" ")); E.cb.setAttribute("points", bp.join(" "));
        E.cd.setAttribute("cx", X(P.done).toFixed(1)); E.cd.setAttribute("cy", Y(R.hp[P.done]).toFixed(1));
        for (const [k, v] of Object.entries({ x1: CH.x, x2: CH.x + CH.w, y1: Y(R.hp[0]), y2: Y(R.hp[0]) })) E.cs.setAttribute(k, v.toFixed(1));
        E.csl.textContent = fill(T.plStartLine, { v: f1(R.hp[0]) }); E.csl.setAttribute("x", CH.x + CH.w); E.csl.setAttribute("y", (Y(R.hp[0]) - 6).toFixed(1));
        const showBest = cw.best !== false;
        setOp(E.cb, showBest ? 1 : 0); setOp(E.cbl, showBest && P.done > 0 && R.best[P.done] < R.hp[0] ? 1 : 0);
        E.cbl.textContent = fill(T.plBestLine, { v: f1(R.best[P.done]) }); E.cbl.setAttribute("x", CH.x + 8); E.cbl.setAttribute("y", (Math.min(CH.y + CH.h - 6, Y(R.best[P.done]) + 16)).toFixed(1));
        E.chi.textContent = String(hi); E.clo.textContent = String(lo); E.cx1.textContent = `${R.n} ${T.plMoves}`;
        setOp(gChart, fade("chart"));
      } else setOp(gChart, 0);
    }
    function renderWidgets(t, F, P) {
      const cw = F ? { metric: "hpwl", a: -1, b: 1e9 } : cx.win("counter", t);
      if (!cw) { counter.style.opacity = 0; return; }
      if (F) counter.style.opacity = 1; else cx.ovStyle(counter, t, cw.a, cw.b);
      const fn = METRIC[cw.metric || "hpwl"];
      if (!fn) { err(`placement: unknown counter metric ${cw.metric}`); return; }
      const [label, val0, v] = fn(P), val = cw.decimals != null && /hpwl|best|temp|final/.test(cw.metric || "hpwl") ? nf(v, +cw.decimals) : val0;
      cl.textContent = cw.label ? L(cw.label) : label; cv.textContent = val;
      cbox.classList.toggle("bad", cw.bad != null && v >= cw.bad); cbox.classList.toggle("good", cw.good != null && v <= cw.good);
    }

    /* ---- thumbnails (overlay "thumbs": items { run?, move?, label?, best?, bestLabel? }) ---- */
    function thumb(item) {
      const R = run(item.run != null ? item.run : PL.run, "(thumbs)"), k = item.move === "best" ? null : item.move === "all" || item.move == null ? R.n : +item.move;
      const pos = item.positions ? item.positions : k == null ? R.bestPos : R.pos[clamp(k, 0, R.n)], u = 15, sz = (WMAX - WMIN) * u, X = (v) => (v - WMIN) * u, Y = (v) => sz - (v - WMIN) * u;
      let s = `<svg viewBox="-4 -4 ${sz + 8} ${sz + 8}" aria-hidden="true"><rect x="0" y="0" width="${sz}" height="${sz}" fill="none" stroke="var(--line)" stroke-width="2" stroke-dasharray="6 5"/>`;
      for (const net of NETS) { const b = netBox(net, pos); s += `<rect x="${X(b[0]) - 2}" y="${Y(b[3]) - 2}" width="${(b[2] - b[0]) * u + 4}" height="${(b[3] - b[1]) * u + 4}" rx="3" fill="none" stroke="var(--edge)" stroke-width="1.5"/>`; }
      for (const id of CELLS) s += `<rect x="${X(pos[id].x) - 6}" y="${Y(pos[id].y) - 6}" width="12" height="12" rx="2" fill="${COLORS[id]}" stroke="var(--surface)" stroke-width="1"/>`;
      s += "</svg>";
      const best = item.best ? `<span class="ok" data-a="${resolve(item.best, "(thumb best)").toFixed(3)}">${esc(L(item.bestLabel) || "best")}</span>` : "";
      const cap = item.label ? L(item.label) : f1(totalHpwl(NETS, pos));
      return `<div class="thumb pl-thumb${item.best ? " best" : ""}">${s}<span class="c">${cx.md(cap)}</span>${best}</div>`;
    }

    /* ---- try it yourself: drag a cell, one move, a whole run, another seed ---- */
    function benchHtml() {
      return `<div class="row pl-ops"><label>${esc(T.plSeed)} <input type="number" class="pl-seed" min="2" max="99999" step="1" value="${BASE.seed}"></label>
        <button class="btn" type="button" data-act="pl-step">${esc(T.plStep)}</button><button class="btn" type="button" data-act="pl-run">${esc(T.plRun)}</button><button class="btn" type="button" data-act="pl-reset">${esc(T.plReset)}</button></div>
      <p>${esc(T.plHint)}</p>
      <div class="readout">${esc(T.plStart)}</div>`;
    }
    let seedIn, freeRaf = 0;
    function lessonPicture() { return picture(stateAt(cx.au.currentTime)); }
    function freeStart(fromLesson) {
      const P = lessonPicture(), seed = parseInt(seedIn.value, 10);
      const same = fromLesson && P.R.P.seed === seed;
      const R = same ? P.R : runOf(Object.assign({}, P.R.P, { seed: isFinite(seed) ? seed : BASE.seed }));
      cx.enterFree({ run: R, k: same ? P.done : 0, custom: null, anim: null, drag: null, lessonH: P.hpwl });
    }
    function animateFree() {
      cancelAnimationFrame(freeRaf);
      const step = () => { if (!cx.FREE) return; cx.render(); if (cx.FREE.anim) freeRaf = requestAnimationFrame(step); else if (cx.FREE.after) { const f = cx.FREE.after; cx.FREE.after = null; f(); } };
      freeRaf = requestAnimationFrame(step);
    }
    function stepMsg(R, k) {
      const m = R.mv[k];
      return fill(T.plStepMsg, { k, c: m.cell, axis: m.axis, d: sg1(m.delta), dh: sg1(m.d), T: nf(m.T, 2), how: m.u == null ? T.plHowFree : fill(T.plHowDice, { p: Math.round(m.p * 100), u: nf(m.u, 2) }),
        v: m.ok ? (m.kind === "free" ? T.plVFree : T.plVAcc) : T.plVRej, h: f1(m.hpwl), b: f1(m.best) });
    }
    function runMsg(R) {
      const tl = R.tally[R.n];
      return fill(T.plRunMsg, { s: R.P.seed, n: R.n, b: f1(R.bestVal), bm: R.bestMove ? fill(T.plAtMove, { k: R.bestMove }) : T.plNoBest, f: f1(R.final), a: tl.acc, be: tl.better, w: tl.worse, fr: tl.free, r: tl.rej });
    }
    function act(what) {
      if (!cx.FREE) freeStart(what !== "reset");
      const F = cx.FREE;
      if (F.anim) { F.k = F.anim.k1; F.anim = null; }
      F.custom = null; F.after = null;
      const seed = parseInt(seedIn.value, 10);
      if (isFinite(seed) && seed !== F.run.P.seed) { F.run = runOf(Object.assign({}, F.run.P, { seed })); F.k = 0; }
      if (what === "reset") { F.k = 0; cx.readout.textContent = T.plStart; return cx.render(); }
      if (F.k >= F.run.n) { cx.readout.innerHTML = runMsg(F.run) + " " + esc(T.plDone); return cx.render(); }
      if (what === "step") {
        F.anim = { k0: F.k, k1: F.k + 1, t0: performance.now(), dur: 1900, detail: true };
        const R = F.run, k = F.k + 1; F.after = () => { cx.readout.innerHTML = stepMsg(R, k); };
        setTimeout(() => cx.sfx("slide"), 90);
        setTimeout(() => { if (cx.FREE && cx.FREE.run === R) cx.sfx(verdictSound(R.mv[k])); }, cx.reduce ? 0 : 1900 * V_AT);
      } else {
        const count = F.run.n - F.k;
        F.anim = { k0: F.k, k1: F.run.n, t0: performance.now(), dur: clamp(count * 60, 1800, 7000), detail: false };
        const R = F.run; F.after = () => { cx.readout.innerHTML = runMsg(R); cx.sfx(R.bestVal < R.hp[0] ? "win" : "miss"); };
      }
      animateFree();
    }
    function toUnits(ev) {
      const pt = cx.svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      const q = pt.matrixTransform(cx.svg.getScreenCTM().inverse());
      return { x: clamp(WMIN + (q.x - FB[0]) / U, WMIN, WMAX), y: clamp(WMIN + (FB[1] + FB[3] - q.y) / U, WMIN, WMAX) };
    }
    function moveOwn(id, p) {
      if (!cx.FREE) freeStart(true);
      const F = cx.FREE;
      if (F.anim) { F.k = F.anim.k1; F.anim = null; F.after = null; }
      if (!F.custom) F.custom = clonePos(F.run.pos[F.k]);
      F.custom[id] = { x: Math.round(p.x * 4) / 4, y: Math.round(p.y * 4) / 4 };
      const h = totalHpwl(NETS, F.custom);
      cx.readout.innerHTML = fill(T.plDrag, { h: f1(h), l: f1(F.lessonH) });
      // like a game: a note per change, higher when the wires are shorter
      if (F.lastH != null && Math.abs(h - F.lastH) > 1e-9) cx.sfx("pitch", false, clamp(1 - h / (1.5 * F.run.hp[0])));
      F.lastH = h;
      cx.render();
    }
    function bindCell(g, id) {
      g.addEventListener("pointerdown", (ev) => { ev.preventDefault(); g.setPointerCapture(ev.pointerId); moveOwn(id, toUnits(ev)); cx.FREE.drag = id; g.focus(); });
      g.addEventListener("pointermove", (ev) => { if (cx.FREE && cx.FREE.drag === id) moveOwn(id, toUnits(ev)); });
      const up = () => { if (cx.FREE && cx.FREE.drag === id) { cx.FREE.drag = null; cx.sfx("drop"); cx.render(); } };
      g.addEventListener("pointerup", up); g.addEventListener("pointercancel", up);
      g.addEventListener("keydown", (ev) => {
        const d = { ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, 0.5], ArrowDown: [0, -0.5] }[ev.key];
        if (!d) return;
        ev.preventDefault(); ev.stopPropagation();
        const base = cx.FREE && cx.FREE.custom ? cx.FREE.custom[id] : (cx.FREE ? cx.FREE.run.pos[cx.FREE.k] : lessonPicture().pos)[id];
        moveOwn(id, { x: clamp(base.x + d[0], WMIN, WMAX), y: clamp(base.y + d[1], WMIN, WMAX) });
      });
    }
    function bindBench() {
      seedIn = cx.root.querySelector(".pl-seed");
      for (const w of ["step", "run", "reset"]) { const b = cx.root.querySelector(`[data-act="pl-${w}"]`); if (b) b.addEventListener("click", () => act(w)); }
    }

    function boxes(s, kx, ky, cam) {
      const out = [];
      if (!lastP) return out;
      const op = (el) => +(el.style.opacity === "" ? 1 : el.style.opacity);
      if (op(gFloor) >= 0.6) for (const id of CELLS) {
        const p = lastP.pos[id], X = (ux(p.x) - cam[0]) * kx, Y = (uy(p.y) - cam[1]) * ky, w = CS * kx, h = CS * ky;
        out.push({ kind: "node", label: `cell ${id}`, x: X - w / 2, y: Y - h / 2, w, h });
      }
      const grp = (el, label, gate) => {
        if (op(gSide) < 0.6 && gate !== "thermo") return;
        if (op(el) < 0.6) return;
        const r = el.getBoundingClientRect(); if (!r.width) return;
        out.push({ kind: "node", label, x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height });
      };
      grp(gCard, "move card"); grp(gDice, "dice bar"); grp(gTally, "tally"); grp(gChart, "chart"); grp(gSpread, "seed spread"); grp(gThermo, "thermometer", "thermo"); grp(gLand, "landscape", "thermo");
      return out;
    }

    return {
      soundTracks: { walker: "slide", side: "whoosh" },
      tracks, claims, ready, cues, benchHtml, buildSvg, buildWidgets, render, thumb, boxes, bindBench,
      svgLabel: T.plStage, bannerText: T.plYours, pausedText: T.plPaused,
      leaveFree() { cancelAnimationFrame(freeRaf); cx.readout.textContent = T.plBack; },
      expose() {
        return {
          placement: {
            dataChecked, dataDiffer, dataMoves, get seedsChecked() { return seedsChecked; }, get seedsDiffer() { return seedsDiffer; }, runs: Object.keys(NAMED),
            run(name) { const R = run(name); const tl = R.tally[R.n]; return { seed: R.P.seed, moves: R.n, best: R.bestVal, bestMove: R.bestMove, final: R.final, accepted: tl.acc, rejected: tl.rej, better: tl.better, worse: tl.worse, free: tl.free, draws: R.draws, clamped: R.clamped, peak: R.peak }; },
            at(t) { const P = picture(stateAt(t)); return { run: P.R.P.seed, done: P.done, moving: P.m ? P.m.k : null, hpwl: P.hpwl, best: P.best, T: P.T, pos: P.pos }; },
            /** Sound cues between two times (step 4 of v5 uses this): [{ t, type }] */
            segments() { return SEGS.map((s) => ({ t: s.t, dur: s.dur, from: s.prevN, to: s.n, detail: s.detail, seed: s.R.P.seed })); },
          },
        };
      },
    };
  };

  window.LessonEngine = { mount, parseTree, packTree, treeStr, mulberry32, totalHpwl, saRun };
})();
