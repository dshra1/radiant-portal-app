import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import drawings from "@/data/report-drawings.json";

type D = { id: string; section: string; title: string };

const sectionOf = (d: D) => {
  if (/kitchen/i.test(d.title)) return "Kitchens: layouts and elevations";
  return d.section.replace(/:.*$/, "").replace(/ · detailed plan$/, " · plan");
};

export function ReportDrawings() {
  const groups = useMemo(() => {
    const m = new Map<string, D[]>();
    for (const d of drawings as D[]) {
      const k = sectionOf(d);
      m.set(k, [...(m.get(k) ?? []), d]);
    }
    return [...m.entries()];
  }, []);
  const [sec, setSec] = useState(groups[0]?.[0] ?? "");
  const list = groups.find((g) => g[0] === sec)?.[1] ?? [];
  const [sel, setSel] = useState<string>("");
  const cur = list.find((d) => d.id === sel) ?? list[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Project report drawings</h2>
        <span className="text-xs text-muted-foreground">{(drawings as D[]).length} sheets from the Phase 2 set</span>
        <Link to="/site-material-guide" className="ml-auto text-xs font-semibold text-primary underline">Open Site Material Guide</Link>
      </div>
      <div className="flex flex-wrap items-center gap-1 px-4 pt-3 text-xs text-muted-foreground">
        <span>Drawings</span><ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">{sec}</span>
        {cur && <><ChevronRight className="h-3 w-3" /><span className="text-foreground">{cur.title}</span></>}
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {groups.map(([k, ds]) => (
            <div key={k}>
              <button
                type="button"
                onClick={() => { setSec(k); setSel(""); }}
                className={`w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold ${k === sec ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {k} <span className="opacity-70">({ds.length})</span>
              </button>
              {k === sec && (
                <ul className="ml-2 mt-1 space-y-0.5 border-l border-border pl-2">
                  {ds.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => setSel(d.id)}
                        className={`w-full text-left text-xs ${cur?.id === d.id ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {d.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
        {cur && (
          <figure className="space-y-2">
            <img src={`/report-drawings/${cur.id}.svg`} alt={cur.title} className="w-full rounded-lg border border-border bg-background" />
            <figcaption className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{cur.title}</span>
              <a href={`/report-drawings/${cur.id}.svg`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary">
                <ExternalLink className="h-3.5 w-3.5" /> Open full size
              </a>
            </figcaption>
          </figure>
        )}
      </div>
    </div>
  );
}
