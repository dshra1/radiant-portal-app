import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fuel, Plus, Save, Truck, Wrench, X } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { MetricTile, PageTabs, StatusBadge } from "@/components/saha/ui";
import { StageSelect } from "@/components/saha/StageSelect";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAccess, useSessionUser } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";

type Search = { log?: string };
type Machine = Database["public"]["Tables"]["machines"]["Row"];
type MachineIn = Database["public"]["Tables"]["machines"]["Insert"];
type Log = Database["public"]["Tables"]["machine_logs"]["Row"];

export const Route = createFileRoute("/machines")({
  validateSearch: (s: Record<string, unknown>): Search =>
    typeof s["log"] === "string" && s["log"] ? { log: s["log"] } : {},
  head: () => ({
    meta: [
      { title: "Machines & Diesel | SiteYantra" },
      {
        name: "description",
        content:
          "Owned and hired machines per site: daily hours and diesel, idle and service alerts, diesel per hour against the machine's normal, and hire bills checked against logged hours.",
      },
    ],
  }),
  component: Page,
});

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const monthStart = () => today().slice(0, 8) + "01";

const KINDS = [
  "Excavator",
  "Backhoe loader (JCB)",
  "Tipper",
  "Concrete mixer",
  "Concrete pump",
  "Transit mixer",
  "Needle vibrator",
  "Plate compactor",
  "Roller",
  "Tower crane",
  "Builder hoist",
  "DG set",
  "Bar bending machine",
  "Other",
];

/** Hire cost of one machine for a set of logs (owned machines: diesel only). */
function hireCost(m: Machine, logs: Log[]) {
  if (m.ownership !== "hired") return 0;
  const days = new Map<string, number>();
  for (const l of logs) days.set(l.log_date, (days.get(l.log_date) ?? 0) + num(l.hours));
  if (m.rate_unit === "day") return days.size * num(m.hire_rate);
  if (m.rate_unit === "month") return num(m.hire_rate) * (days.size / 26);
  let hrs = 0;
  for (const h of days.values()) hrs += Math.max(h, num(m.min_hours_per_day));
  return hrs * num(m.hire_rate);
}

function Page() {
  const user = useSessionUser();
  const { access } = useAccess();
  const canWrite = !!access && access.roles.some((r) => r !== "landowner_investor");
  const project = useActiveProject();
  const pid = project.id;
  const qc = useQueryClient();
  const [tab, setTab] = useState<"today" | "machines" | "bill">("today");
  const [editing, setEditing] = useState<MachineIn | null>(null);
  const [diesel, setDiesel] = useState(92);

  const machinesQ = useQuery({
    queryKey: ["machines", pid],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("machines").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const logsQ = useQuery({
    queryKey: ["machine_logs", pid],
    enabled: Boolean(pid),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machine_logs")
        .select("*")
        .eq("project_id", pid)
        .gte("log_date", daysAgo(120))
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const allHoursQ = useQuery({
    queryKey: ["machine_logs", "hours-total"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("machine_logs").select("machine_id,hours");
      if (error) throw error;
      const m = new Map<string, number>();
      for (const r of data ?? []) m.set(r.machine_id, (m.get(r.machine_id) ?? 0) + num(r.hours));
      return m;
    },
  });

  const machines = useMemo(() => machinesQ.data ?? [], [machinesQ.data]);
  const onSite = machines.filter((m) => m.project_id === pid && m.status !== "returned");
  const logs = useMemo(() => logsQ.data ?? [], [logsQ.data]);
  const month = logs.filter((l) => l.log_date >= monthStart());

  const stats = useMemo(() => {
    return onSite.map((m) => {
      const ml = logs.filter((l) => l.machine_id === m.id);
      const mm = ml.filter((l) => l.log_date >= monthStart());
      const hours = mm.reduce((s, l) => s + num(l.hours), 0);
      const fuel = mm.reduce((s, l) => s + num(l.diesel_l), 0);
      const lph = hours > 0 ? fuel / hours : 0;
      const base = num(m.diesel_lph);
      const recent = ml.filter((l) => l.log_date >= daysAgo(3) && num(l.hours) > 0).length;
      const total = allHoursQ.data?.get(m.id) ?? 0;
      const since = total - num(m.last_service_hours);
      const every = num(m.service_every_hours);
      const alerts: { tone: "red" | "amber"; text: string }[] = [];
      if (base > 0 && hours >= 5 && lph > base * 1.15)
        alerts.push({ tone: "red", text: `Diesel ${lph.toFixed(1)} l/h vs normal ${base} l/h` });
      if (m.status === "working" && recent === 0)
        alerts.push({
          tone: "amber",
          text: "No hours in the last 3 days: idle? Return or move it",
        });
      if (every > 0 && since >= every * 0.9)
        alerts.push({
          tone: since >= every ? "red" : "amber",
          text: `Service ${since >= every ? "overdue" : "due soon"}: ${Math.round(since)} h since last`,
        });
      if (m.ownership === "hired" && m.hire_end && m.hire_end <= daysAgo(-7))
        alerts.push({ tone: "amber", text: `Hire ends ${m.hire_end}` });
      const cost = hireCost(m, mm) + (m.diesel_in_hire ? 0 : fuel * diesel);
      return { m, hours, fuel, lph, alerts, cost };
    });
  }, [onSite, logs, allHoursQ.data, diesel]);

  const totals = {
    hours: month.reduce((s, l) => s + num(l.hours), 0),
    fuel: month.reduce((s, l) => s + num(l.diesel_l), 0),
    cost: stats.reduce((s, x) => s + x.cost, 0),
    alerts: stats.reduce((s, x) => s + x.alerts.length, 0),
  };

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["machines"] });
    void qc.invalidateQueries({ queryKey: ["machine_logs"] });
  };

  return (
    <Shell
      title="Machines & Diesel"
      subtitle={`${project.name} · daily hours and diesel, idle and service alerts, hire bills checked against the log`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <MetricTile
            label="Machines on site"
            value={String(onSite.length)}
            icon={<Truck className="size-4" />}
          />
          <MetricTile label="Hours this month" value={totals.hours.toFixed(0)} />
          <MetricTile
            label="Diesel this month"
            value={`${totals.fuel.toFixed(0)} l`}
            icon={<Fuel className="size-4" />}
          />
          <MetricTile
            label="Machine cost this month"
            value={inr(totals.cost)}
            delta={totals.alerts ? `${totals.alerts} alerts` : "no alerts"}
            tone={totals.alerts ? "warn" : "good"}
          />
        </div>

        <PageTabs
          tabs={[
            { key: "today" as const, label: "Today's log" },
            { key: "machines" as const, label: "Machines" },
            { key: "bill" as const, label: "Check a hire bill" },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === "today" && (
          <>
            {canWrite && onSite.length > 0 && (
              <LogForm
                machines={onSite}
                projectId={pid}
                userId={user?.id ?? null}
                onSaved={refresh}
              />
            )}
            {onSite.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No machines on this site yet. Add them in the Machines tab.
              </p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {stats.map(({ m, hours, fuel, lph, alerts, cost }) => (
                <article
                  key={m.id}
                  className="space-y-2 rounded-xl border border-border bg-card p-3"
                >
                  <header className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.kind} {m.reg_no ? `· ${m.reg_no}` : ""} ·{" "}
                        {m.ownership === "hired" ? `hired from ${m.hire_party || "—"}` : "owned"}
                      </p>
                    </div>
                    <StatusBadge tone={m.status === "working" ? "emerald" : "slate"}>
                      {m.status}
                    </StatusBadge>
                  </header>
                  <p className="text-sm">
                    This month: <b>{hours.toFixed(1)} h</b> · {fuel.toFixed(0)} l diesel
                    {lph > 0 ? ` · ${lph.toFixed(1)} l/h` : ""} · <b>{inr(cost)}</b>
                  </p>
                  {alerts.map((a) => (
                    <StatusBadge key={a.text} tone={a.tone}>
                      {a.text}
                    </StatusBadge>
                  ))}
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {logs
                      .filter((l) => l.machine_id === m.id)
                      .slice(0, 3)
                      .map((l) => (
                        <li key={l.id}>
                          {l.log_date}: {num(l.hours)} h · {num(l.diesel_l)} l
                          {l.work_done ? ` · ${l.work_done}` : ""}
                          {l.operator ? ` · ${l.operator}` : ""}
                        </li>
                      ))}
                  </ul>
                </article>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Diesel price used for cost ₹/l
              <input
                type="number"
                value={diesel}
                onChange={(e) => setDiesel(num(e.target.value))}
                className="h-8 w-20 rounded border border-border bg-card px-2"
              />
            </label>
          </>
        )}

        {tab === "machines" && (
          <div className="space-y-3">
            {canWrite && !editing && (
              <button
                type="button"
                onClick={() =>
                  setEditing({
                    name: "",
                    kind: "Excavator",
                    ownership: "hired",
                    rate_unit: "hour",
                    project_id: pid,
                    status: "working",
                  })
                }
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="size-4" /> Add machine
              </button>
            )}
            {editing && (
              <MachineForm
                value={editing}
                userId={user?.id ?? null}
                onClose={() => setEditing(null)}
                onSaved={() => {
                  setEditing(null);
                  refresh();
                }}
              />
            )}
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Machine</th>
                    <th className="px-3 py-2 text-left">Site</th>
                    <th className="px-3 py-2 text-left">Hire</th>
                    <th className="px-3 py-2 text-right">Total hours</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {machines.map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="px-3 py-2">
                        <b>{m.name}</b>
                        <div className="text-xs text-muted-foreground">
                          {m.kind} {m.reg_no}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {m.project_id === pid ? "This site" : m.project_id ? "Other site" : "Yard"}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {m.ownership === "hired"
                          ? `${inr(num(m.hire_rate))}/${m.rate_unit} · ${m.hire_party}`
                          : "Owned"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {(allHoursQ.data?.get(m.id) ?? 0).toFixed(0)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          tone={
                            m.status === "working"
                              ? "emerald"
                              : m.status === "idle"
                                ? "amber"
                                : "slate"
                          }
                        >
                          {m.status}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-2">
                        {canWrite && (
                          <button
                            type="button"
                            className="text-xs font-semibold text-primary underline"
                            onClick={() => setEditing(m)}
                          >
                            Edit / move / service
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {machines.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                        No machines yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              An idle owned machine on another site can be moved here before hiring one: edit it and
              change the site.
            </p>
          </div>
        )}

        {tab === "bill" && (
          <BillCheck machines={machines.filter((m) => m.ownership === "hired")} projectId={pid} />
        )}
      </div>
    </Shell>
  );
}

const field = "h-10 w-full rounded-lg border border-border bg-background px-2 text-sm";

function LogForm({
  machines,
  projectId,
  userId,
  onSaved,
}: {
  machines: Machine[];
  projectId: string;
  userId: string | null;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    machine_id: machines[0]?.id ?? "",
    log_date: today(),
    hours: "",
    diesel_l: "",
    operator: "",
    work_done: "",
    stage_code: "",
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!f.machine_id || !(num(f.hours) >= 0) || (f.hours === "" && f.diesel_l === ""))
      return setMsg("Enter hours and/or diesel.");
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("machine_logs").insert({
      machine_id: f.machine_id,
      project_id: projectId,
      log_date: f.log_date,
      hours: num(f.hours),
      diesel_l: num(f.diesel_l),
      operator: f.operator.trim(),
      work_done: f.work_done.trim(),
      stage_code: f.stage_code,
      created_by: userId,
    });
    setBusy(false);
    if (error) return setMsg(error.message);
    setF({ ...f, hours: "", diesel_l: "", work_done: "" });
    setMsg("Saved.");
    onSaved();
  };
  return (
    <section className="space-y-2 rounded-xl border-2 border-primary/40 bg-card p-3">
      <h2 className="text-base font-bold">Log machine hours & diesel</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <select
          className={cn(field, "col-span-2")}
          value={f.machine_id}
          onChange={(e) => setF({ ...f, machine_id: e.target.value })}
        >
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.kind})
            </option>
          ))}
        </select>
        <input
          type="date"
          className={field}
          value={f.log_date}
          onChange={(e) => setF({ ...f, log_date: e.target.value })}
        />
        <StageSelect
          projectId={projectId}
          value={f.stage_code}
          onChange={(v) => setF({ ...f, stage_code: v })}
          className={field}
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="Hours worked"
          className={field}
          value={f.hours}
          onChange={(e) => setF({ ...f, hours: e.target.value })}
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="Diesel filled (litres)"
          className={field}
          value={f.diesel_l}
          onChange={(e) => setF({ ...f, diesel_l: e.target.value })}
        />
        <input
          placeholder="Operator"
          className={field}
          value={f.operator}
          onChange={(e) => setF({ ...f, operator: e.target.value })}
        />
        <input
          placeholder="Work done"
          className={field}
          value={f.work_done}
          onChange={(e) => setF({ ...f, work_done: e.target.value })}
        />
      </div>
      {msg && <p className="text-sm">{msg}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50 md:w-auto md:px-6"
      >
        <Save className="size-4" /> {busy ? "Saving…" : "Save log"}
      </button>
    </section>
  );
}

function MachineForm({
  value,
  userId,
  onClose,
  onSaved,
}: {
  value: MachineIn;
  userId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<MachineIn>(value);
  const [msg, setMsg] = useState("");
  const projects = useQuery({
    queryKey: ["site_projects", "machines"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_projects").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const set = (p: Partial<MachineIn>) => setF((x) => ({ ...x, ...p }));
  const save = async () => {
    if (!f.name?.trim()) return setMsg("Give the machine a name (e.g. JCB 3DX – Ravi).");
    const body = { ...f, name: f.name.trim(), updated_at: new Date().toISOString() };
    const { error } = f.id
      ? await supabase.from("machines").update(body).eq("id", f.id)
      : await supabase.from("machines").insert({ ...body, created_by: userId });
    if (error) return setMsg(error.message);
    onSaved();
  };
  const hired = f.ownership === "hired";
  return (
    <section className="space-y-2 rounded-xl border-2 border-primary/40 bg-card p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{f.id ? "Edit machine" : "Add machine"}</h2>
        <button type="button" aria-label="Close" onClick={onClose}>
          <X className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <input
          placeholder="Name"
          className={cn(field, "col-span-2")}
          value={f.name ?? ""}
          onChange={(e) => set({ name: e.target.value })}
        />
        <select
          className={field}
          value={f.kind ?? ""}
          onChange={(e) => set({ kind: e.target.value })}
        >
          {KINDS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <input
          placeholder="Reg. no."
          className={field}
          value={f.reg_no ?? ""}
          onChange={(e) => set({ reg_no: e.target.value })}
        />
        <select
          className={field}
          value={f.ownership ?? "hired"}
          onChange={(e) => set({ ownership: e.target.value })}
        >
          <option value="hired">Hired</option>
          <option value="owned">Owned</option>
        </select>
        <select
          className={field}
          value={f.project_id ?? ""}
          onChange={(e) => set({ project_id: e.target.value || null })}
        >
          <option value="">Yard (no site)</option>
          {(projects.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className={field}
          value={f.status ?? "working"}
          onChange={(e) => set({ status: e.target.value })}
        >
          <option value="working">Working</option>
          <option value="idle">Idle</option>
          <option value="returned">Returned / off hire</option>
        </select>
        <label className="flex items-center gap-1 text-xs">
          Normal diesel l/h
          <input
            type="number"
            className={field}
            value={f.diesel_lph ?? 0}
            onChange={(e) => set({ diesel_lph: num(e.target.value) })}
          />
        </label>
        {hired && (
          <>
            <input
              placeholder="Hire party"
              className={field}
              value={f.hire_party ?? ""}
              onChange={(e) => set({ hire_party: e.target.value })}
            />
            <input
              type="number"
              placeholder="Hire rate ₹"
              className={field}
              value={f.hire_rate ?? ""}
              onChange={(e) => set({ hire_rate: num(e.target.value) })}
            />
            <select
              className={field}
              value={f.rate_unit ?? "hour"}
              onChange={(e) => set({ rate_unit: e.target.value })}
            >
              <option value="hour">per hour</option>
              <option value="day">per day</option>
              <option value="month">per month</option>
            </select>
            <label className="flex items-center gap-1 text-xs">
              Min h/day
              <input
                type="number"
                className={field}
                value={f.min_hours_per_day ?? 0}
                onChange={(e) => set({ min_hours_per_day: num(e.target.value) })}
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!f.diesel_in_hire}
                onChange={(e) => set({ diesel_in_hire: e.target.checked })}
              />
              Diesel included in hire
            </label>
            <label className="text-xs">
              Hire from
              <input
                type="date"
                className={field}
                value={f.hire_start ?? ""}
                onChange={(e) => set({ hire_start: e.target.value || null })}
              />
            </label>
            <label className="text-xs">
              Hire until
              <input
                type="date"
                className={field}
                value={f.hire_end ?? ""}
                onChange={(e) => set({ hire_end: e.target.value || null })}
              />
            </label>
          </>
        )}
        <label className="flex items-center gap-1 text-xs">
          <Wrench className="size-3.5" /> Service every (h)
          <input
            type="number"
            className={field}
            value={f.service_every_hours ?? 0}
            onChange={(e) => set({ service_every_hours: num(e.target.value) })}
          />
        </label>
        <label className="flex items-center gap-1 text-xs">
          Hour meter at last service
          <input
            type="number"
            className={field}
            value={f.last_service_hours ?? 0}
            onChange={(e) => set({ last_service_hours: num(e.target.value) })}
          />
        </label>
      </div>
      {msg && <p className="text-sm text-destructive">{msg}</p>}
      <button
        type="button"
        onClick={save}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground"
      >
        <Save className="size-4" /> Save machine
      </button>
    </section>
  );
}

function BillCheck({ machines, projectId }: { machines: Machine[]; projectId: string }) {
  const [id, setId] = useState(machines[0]?.id ?? "");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [billed, setBilled] = useState("");
  const m = machines.find((x) => x.id === id);
  const logs = useQuery({
    queryKey: ["machine_logs", "bill", id, from, to],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machine_logs")
        .select("*")
        .eq("machine_id", id)
        .gte("log_date", from)
        .lte("log_date", to);
      if (error) throw error;
      return data ?? [];
    },
  });
  if (machines.length === 0)
    return <p className="text-sm text-muted-foreground">No hired machines yet.</p>;
  const ls = logs.data ?? [];
  const days = new Set(ls.filter((l) => num(l.hours) > 0).map((l) => l.log_date)).size;
  const hours = ls.reduce((s, l) => s + num(l.hours), 0);
  const unit = m?.rate_unit ?? "hour";
  const payable = m ? hireCost(m, ls) : 0;
  const logged = unit === "day" ? days : unit === "hour" ? hours : days;
  const claim = num(billed);
  const extra = claim - (unit === "month" ? days : logged);
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-3">
      <p className="text-sm text-muted-foreground">
        Enter what the hire party billed. The app compares it with the hours logged on site for the
        same period{projectId ? "" : ""}, before the bill is paid.
      </p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <select
          className={cn(field, "col-span-2")}
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          {machines.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name} · {x.hire_party}
            </option>
          ))}
        </select>
        <input
          type="date"
          className={field}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input type="date" className={field} value={to} onChange={(e) => setTo(e.target.value)} />
        <input
          type="number"
          inputMode="decimal"
          placeholder={`Billed ${unit === "hour" ? "hours" : "days"}`}
          className={field}
          value={billed}
          onChange={(e) => setBilled(e.target.value)}
        />
      </div>
      <p className="text-sm">
        Logged on site: <b>{hours.toFixed(1)} h</b> on <b>{days} days</b>
        {m && num(m.min_hours_per_day) > 0
          ? ` (minimum ${m.min_hours_per_day} h/day applied)`
          : ""}{" "}
        · payable by log <b>{inr(payable)}</b>
      </p>
      {billed !== "" && (
        <StatusBadge tone={extra > 0.5 ? "red" : "emerald"}>
          {extra > 0.5
            ? `Bill claims ${extra.toFixed(1)} ${unit === "hour" ? "hours" : "days"} more than logged: check before paying`
            : "Bill matches the site log ✓"}
        </StatusBadge>
      )}
    </section>
  );
}
