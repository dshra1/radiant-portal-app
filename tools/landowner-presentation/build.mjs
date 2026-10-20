// Builds every landowner-presentation page from ONE template + ONE data file.
//   template.html  – the page (all chapters, all owners)
//   data.json      – every figure, BOQ line, schedule and drawing reference
//   photos.json    – list of product photos in public/landowner-presentation/files/prod
//   slab.json      – slab-area take-off for both projects (a = 77:76, b = 78:93)
//   save.json      – 77:76 savings options
// Outputs (never edit these by hand – edit the template/data and run `npm run presentation`):
//   src/presentation/all.html, 7893.html, 7776.html          (served behind sign-in)
//   public/landowner-presentation/index.html, 7893.html, 7776.html  (open share links)
// `node tools/landowner-presentation/build.mjs --check` fails if any output is out of date.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const tpl = readFileSync(join(here, "template.html"), "utf8");
const D = JSON.parse(readFileSync(join(here, "data.json"), "utf8"));
const photos = readFileSync(join(here, "photos.json"), "utf8").trim();
const SLAB = JSON.parse(readFileSync(join(here, "slab.json"), "utf8"));
const SAVE = JSON.parse(readFileSync(join(here, "save.json"), "utf8"));
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));

const pages = [
  { name: "all", only: null, title: "Cyber Enclave Owners' Presentation", data: D, slab: SLAB, save: SAVE, pub: "index.html" },
  { name: "7893", only: "b", title: "78:93 Owners' Presentation", data: { a: pick(D.a, ["common", "gst", "types"]), b: D.b }, slab: { b: SLAB.b }, save: { ...SAVE, common: [], own: [] }, pub: "7893.html" },
  { name: "7776", only: "a", title: "77:76 Owners' Presentation", data: { a: D.a, b: pick(D.b, ["common", "gst", "units"]) }, slab: { a: SLAB.a }, save: SAVE, pub: "7776.html" },
];

const check = process.argv.includes("--check");
let stale = [];
for (const p of pages) {
  const html = tpl
    .replace("__TITLE__", p.title)
    .replace("__DATA__", () => JSON.stringify(p.data))
    .replace("__PHOTOS__", () => photos)
    .replace("__SLAB__", () => JSON.stringify(p.slab))
    .replace("__SAVE__", () => JSON.stringify(p.save))
    .replace("__ONLY__", JSON.stringify(p.only));
  for (const out of [join(root, "src/presentation", p.name + ".html"), join(root, "public/landowner-presentation", p.pub)]) {
    const cur = existsSync(out) ? readFileSync(out, "utf8") : null;
    if (cur === html) continue;
    if (check) stale.push(out.replace(root + "/", ""));
    else { writeFileSync(out, html); console.log("wrote", out.replace(root + "/", "")); }
  }
}
if (check && stale.length) {
  console.error("Landowner presentation pages are out of date:\n  " + stale.join("\n  ") + "\nRun: npm run presentation");
  process.exit(1);
}
if (check) console.log("Landowner presentation pages are all in sync.");
