import { readFileSync } from "node:fs";
import * as W from "./project-workbooks.ts";
const b = readFileSync("/mnt/user-data/uploads/Downloads/Cyber-Enclave-Master-BOQ_1.xlsx");
const m = W.parseMasterBoq(W.readWorkbook(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)));
const seen = new Set<string>();
for (const l of m.lines) { if (!l.make) continue; const k = l.pkg+"|"+l.make; if (seen.has(k)) continue; seen.add(k); console.log(l.pkgNo, "|", l.pkg, "|", l.item.slice(0,50), "|", l.make.slice(0,60), "|", (l.spec||"").slice(0,50)); }
