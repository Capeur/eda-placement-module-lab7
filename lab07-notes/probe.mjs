import {saPlace, STARTER_PLACEMENT, GOLDENS, totalHpwl, NETS} from "/home/capeur/Documents/3A/SJTU/VLSI_Mort/test2/eda-learning-lab7-pl/platform/assets/placement-core.js";
const r = saPlace(STARTER_PLACEMENT, {seed:42});
console.log(JSON.stringify({hpwl:r.hpwl, fin:r.finalHpwl, acc:r.accepted, rej:r.rejected, hist:r.history.length, pos:r.positions, goldens:GOLDENS, start:totalHpwl(NETS,STARTER_PLACEMENT)}));
