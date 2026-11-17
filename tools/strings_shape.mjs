// Same shape check for the lab's English and French strings modules: every key and sub-key present on both sides,
// same kinds, same number of arguments for the message functions.
//   node tools/strings_shape.mjs <english sa-placement-strings.js> <french sa-placement-strings.js>
// The module exports T (the words) and fmt (number formatters); both are compared.
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const load = async (p) => await import(pathToFileURL(resolve(p)).href);
const [MA, MB] = await Promise.all(process.argv.slice(2, 4).map(load));
const A = { T: MA.T, fmt: MA.fmt }, B = { T: MB.T, fmt: MB.fmt };
const bad = [];
(function walk(x, y, path) {
  const kx = typeof x, ky = typeof y;
  if (kx !== ky) return bad.push(`${path}: ${kx} vs ${ky}`);
  if (kx === "function") {
    if (x.length !== y.length) bad.push(`${path}: ${x.length} vs ${y.length} arguments`);
    return;
  }
  if (kx === "object") {
    for (const k of Object.keys(x)) k in y ? walk(x[k], y[k], `${path}.${k}`) : bad.push(`${path}.${k}: missing in French`);
    for (const k of Object.keys(y)) if (!(k in x)) bad.push(`${path}.${k}: not in English`);
  }
})(A, B, "strings");
console.log(bad.length ? bad.join("\n") : "same shape");
process.exit(bad.length ? 1 : 0);
