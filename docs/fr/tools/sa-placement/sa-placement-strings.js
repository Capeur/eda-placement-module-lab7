/**
 * French copy of the SA placement lab's strings module (Lab 07). build_site.py puts it in docs/fr/tools/sa-placement/ in
 * place of the English file, after checking that both have the same keys and the same function arities
 * (tools/strings_shape.mjs). Cell names (A-F), challenge ids, codes and numbers stay as they are, and so does the
 * decimal point (the lessons and the checker print 49.6, not 49,6).
 * Vocabulary: longueur de fil (wirelength), boîte de réseau (net box), mouvement (move), accepté / refusé (accepted /
 * rejected), meilleur / pire / neutre (better / worse / free), chance, dé (dice), température, graine (seed),
 * meilleur / dernier (best / final), départ (starter).
 */
const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
const f4 = (x) => String(Math.round(x * 1e4) / 1e4);
const f2 = (x) => String(Math.round(x * 100) / 100);
const pct = (p) => `${Math.round(p * 100)} %`;
const signed = (d) => (d === 0 ? "0" : `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(2)}`);

export const fmt = { f1, f2, f4, pct, signed };

export const T = {
  // ---------------- page chrome ----------------
  panelLeft: "Puce et exécution",
  panelRight: "Votre placement",
  starterButton: "Réinitialiser l'espace de travail",
  idlePrompt: "Choisissez un défi et cliquez sur <strong>Commencer</strong>. Déplacez des cellules ou lancez le recuit, puis <strong>Vérifier</strong>. Le décompte de révision ne compte jamais.",
  starterHtml: `<p><strong>Votre espace de travail :</strong> six cellules sur une puce, reliées par six réseaux. Chaque réseau est mesuré par sa
    boîte : largeur plus hauteur. Le total commence à <strong>52</strong>. Faites glisser une cellule (ou choisissez-la et utilisez les flèches)
    pour changer les fils vous-même, ou lancez le recuit. <strong>Le recuit part toujours du placement de départ</strong>, quoi que
    montre l'espace de travail, et il rend le meilleur placement qu'il a vu. La graine 42 avec 60 mouvements donne <strong>49.6</strong>, avec
    44 mouvements acceptés et 16 refusés. Déplacer une cellule à la main après une exécution annule les nombres de cette exécution.</p>`,

  // ---------------- run controls (above the workspace) ----------------
  seedLabel: "Graine",
  movesLabel: "Mouvements",
  seedAria: "Graine de l'exécution (un nombre entier)",
  movesAria: "Nombre de mouvements (1 à 3000)",
  runBtn: "Lancer le recuit depuis le départ",
  presetBtn: "Appliquer le préréglage (graine 42, 60 mouvements)",
  resetBtn: "Revenir au départ",
  showLabel: "Afficher :",
  viewBest: "meilleur (rendu)",
  viewFinal: "dernier (final)",
  tallyBtn: "Afficher le décompte (révision)",

  // ---------------- chip view ----------------
  floorCaption: "La puce (murs à −1 et 9)",
  floorLegendNets: "boîte en pointillés = un réseau (largeur + hauteur)",
  floorLegendWalls: "trait gris épais = mur : les cellules ne peuvent pas le dépasser",
  floorLegendDrag: "faites glisser une cellule, ou cliquez sur une cellule puis là où elle doit aller",
  totalLabel: (t) => `longueur de fil ${f1(t)}`,
  stackTag: (n) => `×${n}`,

  // ---------------- chart and log ----------------
  chartCaption: "L'exécution, mouvement par mouvement",
  chartEmpty: "Lancez le recuit pour tracer sa courbe.",
  chartCancelled: "Votre modification a annulé cette exécution : relancez-la pour voir sa courbe.",
  chartLegendCur: "longueur de fil actuelle",
  chartLegendBest: "meilleure jusqu'ici",
  chartLegendStart: "départ (52)",
  chartAxisMoves: "mouvement",
  logCaption: "Chaque mouvement de l'exécution",
  logFilter: "Afficher",
  logAll: "tous les mouvements",
  logAccepted: "mouvements acceptés",
  logRejected: "mouvements refusés",
  logCols: ["#", "cellule", "poussée", "fils", "temp.", "chance", "dé", "verdict"],
  logPush: (x) => `${x.axis} ${x.delta > 0 ? "+" : "−"}${Math.abs(x.delta).toFixed(2)}${x.clamped ? " (mur)" : ""}`,
  logNoDice: "pas de dé",
  logAcceptedWord: "accepté",
  logRejectedWord: "refusé",
  logNewBest: " ★ nouveau meilleur",
  logTooLong: (n) => `Affichage des 1000 premiers mouvements sur ${n}.`,

  // ---------------- right panel ----------------
  selectedLabel: "Cellule",
  cellAria: (id) => `Choisir la cellule ${id}`,
  nudgeLeft: "←",
  nudgeRight: "→",
  nudgeUp: "↑",
  nudgeDown: "↓",
  nudgeAria: { left: "Déplacer la cellule d'une demi-case vers la gauche", right: "Déplacer la cellule d'une demi-case vers la droite", up: "Déplacer la cellule d'une demi-case vers le haut", down: "Déplacer la cellule d'une demi-case vers le bas" },
  putLabel: "La mettre en",
  putBtn: "Mettre",
  putXAria: "x de la cellule choisie",
  putYAria: "y de la cellule choisie",
  netsHead: "Réseaux",
  netCols: ["réseau", "cellules", "largeur + hauteur"],
  netRow: (b) => `${f2(b.w)} + ${f2(b.h)} = ${f2(Number(f2(b.w)) + Number(f2(b.h)))}`, // the row adds up as printed
  totalLine: (t) => `Longueur de fil totale : ${f1(t)}`,
  closestLine: (c) => `Cellules les plus proches : ${c.a} et ${c.b}, ${c.d === 0 ? "au même point" : `à ${f4(c.d)} l'une de l'autre`}`,
  originStarter: (n) => (n ? `Fait à la main depuis le départ (${n} mouvement${n === 1 ? "" : "s"}).` : "Le placement de départ, intact."),
  originRun: "Parti d'une exécution du recuit (Revenir au départ pour placer à la main).",

  runHead: "L'exécution",
  runNone: "Pas encore d'exécution. Le recuit part du placement de départ (52).",
  runCancelled: (c) => `Exécution graine ${c.seed}, ${c.moves} mouvements : annulée par votre modification. Relancez-la pour retrouver ses nombres.`,
  runLines: (r, view) => [
    `graine ${r.seed}, ${r.moves} mouvements, depuis le départ (${f1(r.start)})`,
    `meilleur : ${f1(r.best)} (exactement ${f4(r.best)})${r.bestMove ? `, atteint au mouvement ${r.bestMove}` : ", jamais sous le départ"}`,
    `dernier : ${f1(r.final)} (exactement ${f4(r.final)})${r.final === r.best ? ", comme le meilleur" : r.final > r.best ? ", pire que le meilleur" : ""}`,
    `acceptés : ${r.accepted}   refusés : ${r.rejected}`,
    `température : ${f1(3)} au départ, ${r.endT.toFixed(2)} à la fin`,
    `l'espace de travail montre le placement ${view === "final" ? "final" : "meilleur"}`,
  ],
  tallyHidden: "Accepté ne veut pas dire meilleur. Combien de mouvements acceptés ont raccourci les fils ? Comptez-les dans le journal.",
  tallyLine: (t) => `acceptés = ${t.better} meilleurs + ${t.worse} pires + ${t.free} neutres (aucun fil ne change)`,

  countHead: "Comptez les mouvements acceptés",
  countHelp: "Tapez combien de mouvements acceptés ont raccourci les fils (meilleurs), les ont allongés (pires), ou les ont laissés pareils (neutres).",
  countBetter: "meilleurs",
  countWorse: "pires",
  countFree: "neutres",
  countBtn: "Enregistrer mon décompte",
  countShown: (c) => `décompte enregistré : ${c.better} meilleurs, ${c.worse} pires, ${c.free} neutres${c.blind ? "" : " (enregistré après le décompte de révision : ne compte pas)"}`,
  luckyHead: "Un dé chanceux",
  luckyHelp: "Tapez le numéro d'un mouvement où le dé a gardé un mouvement pire alors que sa chance était petite.",
  luckyAria: "Numéro du mouvement",
  luckyBtn: "Enregistrer le mouvement",
  luckyShown: (l) => `mouvement enregistré : ${l.move}`,

  // ---------------- messages after an action ----------------
  msg: {
    ran: (m) => `Graine ${m.seed} avec ${m.moves} mouvements depuis le départ : meilleur ${f1(m.best)}, ${m.accepted} acceptés, ${m.rejected} refusés.`,
    preset: (m) => `Préréglage : graine ${m.seed}, ${m.moves} mouvements, depuis le départ : meilleur ${f1(m.best)}, ${m.accepted} acceptés, ${m.rejected} refusés.`,
    "bad-seed": () => "La graine doit être un nombre entier (0, 1, 2, …).",
    "bad-moves": (m) => `Le nombre de mouvements doit être un nombre entier de 1 à ${m.max}.`,
    "need-run": () => "Lancez d'abord le recuit.",
    "view-best": () => "Affichage du meilleur placement : celui que rend le recuit.",
    "view-final": () => "Affichage du placement final : là où l'exécution s'est arrêtée.",
    "same-place": (m) => `${m.id} y est déjà.`,
    moved: (m) => `${m.id} déplacée en (${m.x}, ${m.y}). Longueur de fil totale : ${f1(m.total)}.`,
    cancelled: (m) => `Vous avez déplacé ${m.id} à la main : les nombres de l'exécution graine ${m.seed}, ${m.moves} mouvements, sont annulés.`,
    "bad-xy": () => "Tapez deux nombres, par exemple 3 et 4.5.",
    reset: () => "Retour au placement de départ (52). Les mouvements que vous faites maintenant sont faits à la main.",
    "tally-shown": () => "Décompte de révision affiché. Un décompte enregistré à partir de maintenant ne compte pas : appuyez de nouveau sur Commencer pour tenter le décompte vous-même.",
    "bad-count": () => "Tapez trois nombres entiers.",
    "count-saved": (m) => `Décompte enregistré : ${m.better} meilleurs, ${m.worse} pires, ${m.free} neutres.`,
    "bad-move-no": (m) => `Tapez un numéro de mouvement de 1 à ${m.moves}.`,
    "lucky-saved": (m) => `Mouvement ${m.move} enregistré.`,
  },

  // ---------------- Check reasons ----------------
  checkHead: "Vérification :",
  why: {
    "no-run": () => "Pas encore d'exécution : lancez d'abord le recuit.",
    cancelled: () => "Vous avez déplacé une cellule après l'exécution, donc ses nombres ne comptent plus. Relancez-la.",
    "from-run": () => "Ce placement est parti d'une exécution du recuit. Appuyez sur Revenir au départ et déplacez les cellules vous-même.",
    untouched: () => "Vous n'avez encore déplacé aucune cellule.",
    "not-below-sa": (r) => `Votre longueur de fil est ${f1(r.total)}. Le meilleur du recuit avec la graine 42 et 60 mouvements est 49.6 : passez en dessous.`,
    "ok-by-hand": (r) => `Oui : ${f1(r.total)} à la main, sous les 49.6 du recuit.`,
    "not-zero": (r) => `Votre longueur de fil est ${f1(r.total)}, pas encore 0. Quelles cellules partagent un réseau ?`,
    "ok-pile-up": () => "Oui : longueur de fil 0. Les cellules sont les unes sur les autres, et le coût s'en moque : il ne voit pas le chevauchement.",
    "too-long": (r) => `Votre longueur de fil est ${f1(r.total)} : ramenez-la à 16 ou moins.`,
    "too-close": (r) => `${r.a} et ${r.b} sont à ${f4(r.d)} l'une de l'autre : gardez chaque paire à au moins 1 de distance.`,
    "ok-spread": (r) => `Oui : ${f1(r.total)}, et deux cellules jamais plus proches que ${f4(r.d)}. Court et étalé : il faut une règle que le coût n'a pas.`,
    "need-60": (r) => `Cette exécution a ${r.moves} mouvements. Comparez des graines avec 60 mouvements chacune.`,
    "not-below-median": (r) => `La graine ${r.seed} donne ${f1(r.best)}, pas sous 36. Essayez une autre graine.`,
    "ok-median": (r) => `Oui : la graine ${r.seed} donne ${f1(r.best)}. La graine 42 (49.6) était une histoire malchanceuse.`,
    "need-162-60": () => "Comptez l'exécution de la graine 162 avec 60 mouvements. La graine 42 est l'exemple résolu : son décompte est déjà à l'écran.",
    "no-count": () => "Enregistrez d'abord votre décompte (meilleurs, pires, neutres).",
    "count-stale": () => "Votre décompte a été enregistré pour une autre exécution. Enregistrez-le de nouveau pour celle-ci.",
    peeked: () => "Le décompte de révision a été affiché avant que vous enregistriez ce décompte. Appuyez de nouveau sur Commencer et comptez vous-même.",
    "count-wrong": (r) => `Pas ce décompte. Vos trois nombres font ${r.sum} ; l'exécution a accepté ${r.accepted} mouvements.`,
    "ok-count": (r) => `Oui : ${r.better} meilleurs, ${r.worse} pires, ${r.free} neutres. Accepté n'est pas un progrès.`,
    "no-lucky": () => "Enregistrez d'abord un numéro de mouvement.",
    "lucky-stale": () => "Ce numéro de mouvement a été enregistré pour une autre exécution. Enregistrez-le de nouveau pour celle-ci.",
    "lucky-range": (r) => `Il n'y a pas de mouvement ${r.move} : cette exécution a ${r.moves} mouvements.`,
    "lucky-not-worse": (r) => `Le mouvement ${r.move} n'a pas allongé les fils : aucun dé n'a été lancé.`,
    "lucky-rejected": (r) => `Le mouvement ${r.move} a été refusé : le dé a dit non.`,
    "lucky-high": (r) => `Le mouvement ${r.move} a été gardé, mais sa chance était de 20 % ou plus. Cherchez une chance plus petite.`,
    "ok-lucky": (r) => `Oui : le mouvement ${r.move} avait une chance de ${pct(r.p)}, et le dé a affiché ${r.u.toFixed(2)}, en dessous.`,
    "final-is-best": (r) => `Avec la graine ${r.seed}, le placement final est aussi bon que le meilleur. Essayez d'autres graines.`,
    "ok-best-final": (r) => `Oui : la graine ${r.seed} finit à ${f1(r.final)}, mais son meilleur était ${f1(r.best)}. Le recuit rend le meilleur.`,
    "need-42": (r) => `Cette exécution utilise la graine ${r.seed}. Gardez la graine 42 et changez le nombre de mouvements.`,
    "not-below-golden": (r) => `Avec ${r.moves} mouvements, la graine 42 atteint ${f1(r.best)}. Donnez-lui plus de mouvements.`,
    "ok-more": (r) => `Oui : ${r.moves} mouvements atteignent ${f1(r.best)}. Regardez maintenant la puce : les cellules s'empilent-elles ?`,
    "not-worse-than-start": (r) => `La graine ${r.seed} finit à ${f1(r.final)}, pas au-dessus du départ (52). Cherchez une exécution qui finit pire qu'elle n'a commencé.`,
    "ok-ends-worse": (r) => `Oui : la graine ${r.seed} finit à ${f1(r.final)}, pire que le départ, et pourtant elle rend ${f1(r.best)}. Garder le meilleur l'a sauvée.`,
    unknown: () => "Défi inconnu.",
  },

  // ---------------- challenges ----------------
  challenges: {
    "by-hand": {
      title: "Battre le recuit à la main",
      prompt: "La graine 42 avec 60 mouvements atteint 49.6. Depuis le départ, déplacez vous-même les cellules jusqu'à ce que la longueur de fil totale soit sous 49.6.",
      hint: "Quel réseau est le plus court à améliorer ? E et F partagent un réseau : amenez F contre E.",
    },
    "below-median": {
      title: "Une graine, une histoire",
      prompt: "La graine 42 donne 49.6, mais est-ce typique ? Lancez d'autres graines avec 60 mouvements jusqu'à en trouver une dont le meilleur est sous 36, le milieu de 200 graines.",
      hint: "Environ la moitié des graines y arrivent. Changez la graine, gardez 60 mouvements, et relancez.",
    },
    "pile-up": {
      title: "Longueur de fil zéro",
      prompt: "Le coût ne mesure que les boîtes des réseaux. Depuis le départ, déplacez les cellules à la main jusqu'à ce que la longueur de fil totale soit 0.",
      hint: "Une boîte de largeur 0 et de hauteur 0 demande que toutes ses cellules soient au même point. A, B, C et D partagent des réseaux ; E et F en partagent un.",
    },
    "count-accepted": {
      title: "Accepté n'est pas meilleur",
      prompt: "La leçon a compté les mouvements acceptés de la graine 42 (son décompte est l'exemple résolu à l'écran). Lancez maintenant la graine 162 avec 60 mouvements : 41 mouvements sont acceptés. Dans le journal, comptez combien d'entre eux ont raccourci les fils, les ont allongés, ou les ont laissés pareils, et enregistrez votre décompte.",
      hint: "Affichez seulement les mouvements acceptés. Un signe moins dans la colonne des fils veut dire meilleur, un signe plus veut dire pire, 0 est un mouvement neutre.",
    },
    "lucky-dice": {
      title: "Un dé chanceux",
      prompt: "Dans le journal d'une exécution, trouvez un mouvement accepté qui a allongé les fils alors que sa chance était sous 20 %. Enregistrez son numéro de mouvement.",
      hint: "La graine 42 en a deux après le mouvement 10, quand la température est plus basse. Lisez les colonnes de la chance et du dé.",
    },
    "best-vs-final": {
      title: "Le meilleur n'est pas toujours le dernier",
      prompt: "Dans la graine 42, le placement final est aussi le meilleur. Trouvez une graine (avec n'importe quel nombre de mouvements) dont la longueur de fil finale est pire que son meilleur.",
      hint: "La leçon a montré la graine 162. Passez de la vue meilleur à la vue dernier pour voir ce qui change.",
    },
    "more-moves": {
      title: "Plus de mouvements",
      prompt: "Gardez la graine 42 et donnez plus de mouvements au recuit, jusqu'à ce que son meilleur passe sous 14, le placement fait à la main du cours.",
      hint: "60 mouvements donnent 49.6. Essayez 100, 200, 300 … et regardez la puce.",
    },
    "ends-worse": {
      title: "Pire que le départ",
      prompt: "Trouvez une exécution dont la longueur de fil finale est pire que le départ (52). Que rend alors le recuit ?",
      hint: "Lancez des graines avec 60 mouvements. La graine est entre 150 et 200.",
    },
    "short-spread": {
      title: "Court et étalé",
      prompt: "À la main, depuis le départ, atteignez une longueur de fil totale de 16 ou moins avec chaque paire de cellules à au moins 1 de distance.",
      hint: "Mettez A, B, C et D aux coins d'un petit carré, puis E et F côte à côte.",
    },
  },
};
