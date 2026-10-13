// @ts-nocheck -- static report data with dynamic table indices
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/saha/Shell";
import { useActiveProject } from "@/hooks/useActiveProject";
import report from "@/data/cyber-enclave-report.json";

export const Route = createFileRoute("/site-material-guide")({
  head: () => ({
    meta: [
      { title: "Site Material Guide | Saha OS" },
      { name: "description", content: "Flat-wise and room-wise material, points and quantities for supervisors and engineers — electrical, plumbing, tiles, kitchens, doors and structure." },
      { property: "og:title", content: "Site Material Guide | Saha OS" },
      { property: "og:description", content: "Pick a trade, flat and room to see what to order, fix and check." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Tbl = { flat: string | null; title: string; rows: string[][] };
type Pt = { p: string; h: string; n: number };
const TABLES = (report as { tables: Tbl[] }).tables;
const POINTS = (report as unknown as { points: Record<string, Record<string, Pt[]>> }).points;
const FLATS = ["Flat-01", "Flat-02"];

const TRADES: { id: string; label: string; tables: number[]; flatTables?: number[]; points?: boolean; qa?: string }[] = [
  { id: "electrical", label: "Electrical", flatTables: [0, 3], tables: [26, 27, 28, 17, 29, 56, 58], points: true, qa: "Check conduit depth, bends, draw-wire and box levels before plaster." },
  { id: "plumbing", label: "Plumbing", flatTables: [1, 2, 4, 5], tables: [32, 31, 16, 25, 33, 34, 30, 38], qa: "Pressure-test CPVC lines and check slopes/sleeves before concealing." },
  { id: "tiles", label: "Tiles & Granite", tables: [14, 15, 19, 20] },
  { id: "kitchen", label: "Kitchen", tables: [18, 21, 22, 23, 24] },
  { id: "ac", label: "AC", tables: [6] },
  { id: "doors", label: "Doors & Windows", tables: [9, 7, 8, 10] },
  { id: "structure", label: "Structure", tables: [41, 43, 44], qa: "Use a Pour Card: check cover blocks, laps, sleeves and shuttering before pour." },
  { id: "water", label: "Water & External", tables: [45, 46, 47, 48, 49, 50, 51, 52, 53, 61, 62] },
  { id: "areas", label: "Areas & Vastu", tables: [11, 12, 35, 13] },
];

function TableCard({ t, flat, room }: { t: Tbl; flat: string; room: string }) {
  const [head, ...body] = t.rows;
  const rows = body.filter((r) => {
    const s = r.join(" ");
    const hasFlat = /Flat-0\d/.test(s);
    if (hasFlat && !s.includes(flat)) return false;
    if (room && !s.toLowerCase().includes(room.toLowerCase().replace(/ (bathroom|toilet)$/, ""))) return false;
    return true;
  });
  if (!rows.length) return null;
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{t.title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr>{head.map((h, i) => <th key={i} className="border-b border-border px-2 py-1.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="odd:bg-muted/40">{r.map((c, j) => <td key={j} className="px-2 py-1.5 align-top text-foreground">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

const ft = (s: string) => { const m = s.match(/(\d+)′(?:(\d+(?:\.\d+)?)″)?/); return m ? Number(m[1]) + Number(m[2] ?? 0) / 12 : 0; };

function ColumnPlan() {
  const sched = TABLES[40].rows.slice(1), loads = TABLES[42].rows.slice(1), beams = TABLES[41];
  const cols = sched.map((r) => ({ tag: r[0], x: ft(r[1]), y: ft(r[2]), row: r }));
  const [sel, setSel] = useState(cols[0]?.tag ?? "");
  const W = Math.max(...cols.map((c) => c.x)) + 4, H = Math.max(...cols.map((c) => c.y)) + 4;
  const c = cols.find((k) => k.tag === sel);
  const load = loads.find((r) => r[0] === sel);
  const foot = load ? TABLES[43].rows.find((r) => r[0] === load[7]) : undefined;
  const bm = beams.rows.slice(1).filter((r) => r.join(" ").match(new RegExp(`\\b${sel}\\b`)));
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-1 text-sm font-semibold">Column plan — tap a column</h3>
      <svg viewBox={`-2 -2 ${W} ${H}`} className="w-full max-h-[420px] rounded-lg bg-muted/40">
        {cols.map((k) => (
          <g key={k.tag} onClick={() => setSel(k.tag)} className="cursor-pointer">
            <rect x={k.x - 0.6} y={k.y - 0.9} width={1.2} height={1.8} className={k.tag === sel ? "fill-primary" : "fill-foreground/70"} />
            <text x={k.x + 0.9} y={k.y + 0.4} fontSize={1.3} className="fill-foreground">{k.tag}</text>
          </g>
        ))}
      </svg>
      {c && (
        <div className="mt-3 grid gap-3 md:grid-cols-2 text-xs">
          <dl className="grid grid-cols-2 gap-1 rounded-lg border border-border p-3">
            {TABLES[40].rows[0].map((h, i) => <div key={"h" + i} className="contents"><dt className="text-muted-foreground">{h}</dt><dd>{c.row[i]}</dd></div>)}
            {load && TABLES[42].rows[0].slice(3).map((h, i) => <div key={"lh" + i} className="contents"><dt className="text-muted-foreground">{h}</dt><dd>{load[i + 3]}</dd></div>)}
          </dl>
          <div className="space-y-2 rounded-lg border border-border p-3">
            {foot && <p><b>Footing {foot[0]}:</b> {TABLES[43].rows[0].slice(1).map((h, i) => `${h}: ${foot[i + 1]}`).join(" · ")}</p>}
            <p><b>Beams framing in:</b> {bm.length ? bm.map((r) => `${r[0]} (${r[2]}, ${r[3]})`).join("; ") : "—"}</p>
            <p className="text-muted-foreground"><b>Steel / stirrups:</b> not in the report yet — upload the bar bending schedule to the Drawings register.</p>
            <Link to="/pour-cards" className="inline-block rounded-lg bg-primary px-3 py-1.5 text-primary-foreground">Open pour card checklist</Link>
          </div>
        </div>
      )}
    </section>
  );
}

function Page() {
  const project = useActiveProject();
  const [trade, setTrade] = useState("electrical");
  const [flat, setFlat] = useState("Flat-01");
  const [room, setRoom] = useState("");
  const T = TRADES.find((t) => t.id === trade)!;
  const rooms = useMemo(() => Object.keys(POINTS[flat] ?? {}), [flat]);
  const pts = room ? POINTS[flat]?.[room] ?? [] : [];
  const isCyber = /cyber/i.test(project.name ?? "");
  const pill = (on: boolean) => `rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`;

  return (
    <Shell title="Site Material Guide" subtitle="Trade → flat → room: what to order, fix and check (Cyber Enclave Phase 2 set, 5 typical floors)">
      {!isCyber && <p className="mb-3 rounded-lg border border-border bg-muted p-3 text-sm">This guide holds the Cyber Enclave report. Switch the project to Cyber Enclave to use it on site.</p>}
      <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Superseded: this guide is from the Phase 2 set of 5 identical floors, before the frozen plans (D-118:
        4BHK floors 1–2, 3BHK floors 3–5, Bedroom-03 as family hall, new switchboard rules). Use the current
        electrical and plumbing drawing sets in Drawings &amp; Documents and the imported BOQ until this guide is rebuilt.
      </p>
      <div className="mb-3 flex flex-wrap gap-2">{TRADES.map((t) => <button key={t.id} className={pill(t.id === trade)} onClick={() => setTrade(t.id)}>{t.label}</button>)}</div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FLATS.map((f) => <button key={f} className={pill(f === flat)} onClick={() => { setFlat(f); setRoom(""); }}>{f}</button>)}
        {trade !== "structure" && (
          <select value={room} onChange={(e) => setRoom(e.target.value)} className="rounded-lg border border-border bg-card px-2 py-1 text-xs">
            <option value="">All rooms</option>
            {rooms.map((r) => <option key={r}>{r}</option>)}
          </select>
        )}
        <span className="ml-auto flex gap-2 text-xs">
          <Link to="/inventory-control" className="rounded-lg border border-border px-3 py-1.5">Issue from stock</Link>
          <Link to="/po-create" className="rounded-lg border border-border px-3 py-1.5">Raise PO</Link>
          <Link to="/qa-inspection" className="rounded-lg border border-border px-3 py-1.5">Quality check</Link>
        </span>
      </div>
      {T.qa && <p className="mb-3 rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs"><b>Before you close it up:</b> {T.qa}</p>}
      <div className="grid gap-3">
        {trade === "structure" && <ColumnPlan />}
        {T.points && room && pts.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold">{flat} · {room} — points and heights</h3>
            <ul className="grid gap-1 text-xs sm:grid-cols-2">{pts.map((p, i) => <li key={i} className="flex justify-between rounded bg-muted/40 px-2 py-1"><span>{p.n > 1 ? `${p.n} × ` : ""}{p.p}</span><span className="text-muted-foreground">{p.h}</span></li>)}</ul>
          </section>
        )}
        {!room && T.flatTables?.filter((i) => TABLES[i].flat === flat).map((i) => <TableCard key={i} t={{ ...TABLES[i], title: `${flat} · ${TABLES[i].title}` }} flat={flat} room="" />)}
        {T.tables.map((i) => <TableCard key={i} t={TABLES[i]} flat={flat} room={room} />)}
      </div>
    </Shell>
  );
}
