import { CELLS, NETS, STARTER_PLACEMENT as S, clonePositions, totalHpwl, forceDirectedPlace, quadraticPlace, saPlace, round1, GOLDEN_PLACEMENT, densityBins, FIXED_PADS } from "/home/capeur/Documents/3A/SJTU/VLSI_Mort/test2/eda-learning-lab7-pl/platform/assets/placement-core.js";
function mb(seed){let a=seed>>>0;return()=>{a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
// o.drawEarly: draw u every move before testing; o.noClamp; o.coolFirst; o.int: integer step
function run(o){const rand=mb(o.seed??42);let pos=clonePositions(S),cur=totalHpwl(NETS,pos),best=cur,T=3,acc=0,rej=0,peak=cur;
 for(let m=0;m<60;m++){const id=CELLS[Math.floor(rand()*6)];const trial=clonePositions(pos);const axis=rand()<0.5?"x":"y";
  const delta=o.int?((rand()<0.5?-1:1)*1):((rand()<0.5?-1:1)*(0.5+rand()));
  trial[id][axis]=pos[id][axis]+delta;if(!o.noClamp){trial[id].x=Math.max(-1,Math.min(9,trial[id].x));trial[id].y=Math.max(-1,Math.min(9,trial[id].y));}
  const nx=totalHpwl(NETS,trial),d=nx-cur;if(o.coolFirst)T*=0.94;const u=o.drawEarly?rand():null;
  const a=d<=0||(u??rand())<Math.exp(-d/T);if(a){pos=trial;cur=nx;acc++;if(cur<best)best=cur;}else rej++;if(!o.coolFirst)T*=0.94;peak=Math.max(peak,cur);}
 return `best ${best.toFixed(3)} final ${cur.toFixed(3)} acc ${acc} rej ${rej} peak ${peak.toFixed(2)}`;}
console.log("reference rules          :", run({}));
console.log("draw u on every move     :", run({drawEarly:true}));
console.log("no clamp to -1..9        :", run({noClamp:true}));
console.log("cool before the test     :", run({coolFirst:true}));
console.log("integer step of 1        :", run({int:true}));
const f=forceDirectedPlace(S);console.log("force-directed from starter:",totalHpwl(NETS,f),"round1",round1(totalHpwl(NETS,f)));
console.log("quadratic:",totalHpwl(NETS,quadraticPlace(S)), " golden placement:",totalHpwl(NETS,GOLDEN_PLACEMENT));
const t=saPlace(S,{seed:42});console.log("SA best positions round1 HPWL",round1(totalHpwl(NETS,t.positions)),"; fixed pads list:",FIXED_PADS.join(","));
console.log("density 2x2 cap1 of SA best:",JSON.stringify(densityBins(t.positions)),"| starter:",JSON.stringify(densityBins(S)));
