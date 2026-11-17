import fs from "node:fs";
function mulberry32(seed){let a=seed>>>0;return function rand(){a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const seeds=[0,1,2,42,134,199,1000,123456789,4294967295,4294967303,-5,3.7];
const out={};for(const s of seeds){const r=mulberry32(s);out[s]=Array.from({length:500},()=>r());}
fs.writeFileSync(process.argv[2]+"/js_prng.json",JSON.stringify(out));
