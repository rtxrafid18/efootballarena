import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useTournament, useInvalidateTournament } from "@/hooks/useTournament";
import { write } from "@/lib/admin-client";
import { getAdminStatus, unlockAdmin, lockAdmin } from "@/lib/admin.functions";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";
import type { Match, MatchStage, MatchStatus, Team } from "@/lib/tournament";
import { stageLabel } from "@/lib/tournament";
import { Plus, Trash2, Save, Lock, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — eFootball Cup" },
      { name: "description", content: "Manage teams, matches, goals, MVPs and player stats." },
      { property: "og:title", content: "Admin — eFootball Cup" },
      { property: "og:description", content: "Tournament administration." },
    ],
  }),
  component: AdminPage,
});

const TABS = ["Settings", "Teams", "Matches", "Assists", "Goalkeepers"] as const;
type Tab = (typeof TABS)[number];

function AdminPage() {
  const { data } = useTournament();
  const [tab, setTab] = useState<Tab>("Settings");
  const { data: status, refetch } = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => getAdminStatus(),
    staleTime: 0,
  });

  if (status && !status.unlocked) {
    return (
      <AppLayout>
        <Toaster theme="dark" position="top-right" richColors />
        <PageHeader title="Admin Panel" subtitle="Protected — enter the admin passcode" />
        <PasscodeGate onUnlocked={() => refetch()} />
      </AppLayout>
    );
  }

  if (!data || !status) return (
      <AppLayout>
        <div className="space-y-4">
          <div className="h-28 rounded-2xl bg-surface/60 animate-pulse" />
          <div className="grid gap-3.5 md:grid-cols-2 stagger-pop">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-surface/50 animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );

  return (
    <AppLayout>
      <Toaster theme="dark" position="top-right" richColors />
      <PageHeader title="Admin Panel" subtitle="Unlocked — editing enabled on this device" />

      <div className="flex justify-end mb-3">
        <button
          onClick={async () => {
            await lockAdmin();
            refetch();
          }}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-accent transition"
        >
          <Lock className="h-3.5 w-3.5" /> Lock admin
        </button>
      </div>


      <div className="flex gap-2 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap",
              tab === t
                ? "bg-accent text-accent-foreground"
                : "bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Settings" && <SettingsTab data={data} />}
      {tab === "Teams" && <TeamsTab data={data} />}
      {tab === "Matches" && <MatchesTab data={data} />}
      {tab === "Assists" && <AssistsTab data={data} />}
      {tab === "Goalkeepers" && <GkTab data={data} />}
    </AppLayout>
  );
}

/* ---------------- Passcode gate ---------------- */

function PasscodeGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode) return;
    setBusy(true);
    try {
      const res = await unlockAdmin({ data: { passcode } });
      if (!res.ok) {
        toast.error("Incorrect passcode");
        setPasscode("");
        return;
      }
      toast.success("Admin unlocked");
      onUnlocked();
    } catch {
      toast.error("Could not verify passcode");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-elevated p-6 max-w-md mx-auto space-y-4 text-center">
      <ShieldCheck className="h-8 w-8 mx-auto text-accent" />
      <div>
        <div className="font-display text-lg font-bold">Admin access</div>
        <p className="text-xs text-muted-foreground mt-1">
          Editing is locked. Enter the shared admin passcode to manage the tournament.
        </p>
      </div>
      <Input
        type="password"
        autoComplete="current-password"
        placeholder="Admin passcode"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md gold-gradient text-accent-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
      >
        <Lock className="h-4 w-4" /> {busy ? "Checking…" : "Unlock admin"}
      </button>
    </form>
  );
}

/* ---------------- Settings ---------------- */

function SettingsTab({ data }: { data: ReturnType<typeof useTournament>["data"] & object }) {
  const refresh = useInvalidateTournament();
  const [name, setName] = useState(data.settings.tournament_name);
  const [format, setFormat] = useState(data.settings.tournament_format);

  async function save() {
    const { error } = await write("settings", "update", {
      tournament_name: name,
      tournament_format: format,
    }, 1);
    if (error) return toast.error(error.message);
    toast.success("Settings updated");
    refresh();
  }

  return (
    <div className="card-elevated p-5 max-w-xl space-y-4">
      <div>
        <Label>Tournament name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Format</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "groups", title: "48 Teams · 12 Groups", sub: "Group stage → Knockout" },
            { key: "knockout", title: "Direct Knockout", sub: "Round of 32" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFormat(opt.key as "groups" | "knockout")}
              className={cn(
                "text-left p-3 rounded-lg border transition",
                format === opt.key
                  ? "border-accent bg-[color-mix(in_oklab,var(--gold)_10%,transparent)]"
                  : "border-border hover:border-muted-foreground/40",
              )}
            >
              <div className="text-sm font-bold">{opt.title}</div>
              <div className="text-xs text-muted-foreground">{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>
      <PrimaryButton onClick={save} icon={<Save className="h-4 w-4" />}>Save settings</PrimaryButton>
    </div>
  );
}

/* ---------------- Teams ---------------- */

function TeamsTab({ data }: { data: ReturnType<typeof useTournament>["data"] & object }) {
  const refresh = useInvalidateTournament();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [groupId, setGroupId] = useState<string>("");

  async function addTeam() {
    if (!name.trim()) return toast.error("Team name required");
    const { error } = await write("teams", "insert", {
      name: name.trim(),
      short_name: shortName.trim() || null,
      logo_url: logoUrl.trim() || null,
      group_id: groupId || null,
    });
    if (error) return toast.error(error.message);
    setName(""); setShortName(""); setLogoUrl(""); setGroupId("");
    toast.success("Team added");
    refresh();
  }

  async function updateTeamGroup(teamId: string, gid: string) {
    const { error } = await write("teams", "update", { group_id: gid || null }, teamId);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function deleteTeam(id: string) {
    if (!confirm("Delete team? This removes their matches & goals.")) return;
    const { error } = await write("teams", "delete", undefined, id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card-elevated p-5 grid gap-3 md:grid-cols-5">
        <Input placeholder="Team name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Short (BRA)" value={shortName} onChange={(e) => setShortName(e.target.value)} />
        <Input placeholder="Logo URL" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          <option value="">No group</option>
          {data.groups.map((g) => <option key={g.id} value={g.id}>Group {g.name}</option>)}
        </Select>
        <PrimaryButton onClick={addTeam} icon={<Plus className="h-4 w-4" />}>Add team</PrimaryButton>
      </div>

      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-muted-foreground bg-surface-2">
            <tr>
              <th className="text-left px-3 py-2">Team</th>
              <th className="text-left px-3 py-2">Short</th>
              <th className="text-left px-3 py-2">Group</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {data.teams.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground text-xs">No teams yet</td></tr>
            )}
            {data.teams.map((t) => (
              <tr key={t.id} className="border-t border-border/60">
                <td className="px-3 py-2 font-medium">{t.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{t.short_name ?? "—"}</td>
                <td className="px-3 py-2">
                  <Select value={t.group_id ?? ""} onChange={(e) => updateTeamGroup(t.id, e.target.value)}>
                    <option value="">—</option>
                    {data.groups.map((g) => <option key={g.id} value={g.id}>Group {g.name}</option>)}
                  </Select>
                </td>
                <td className="px-3 py-2 text-right">
                  <IconButton onClick={() => deleteTeam(t.id)}><Trash2 className="h-4 w-4" /></IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Matches ---------------- */

function MatchesTab({ data }: { data: ReturnType<typeof useTournament>["data"] & object }) {
  const refresh = useInvalidateTournament();
  const [stage, setStage] = useState<MatchStage>("group");
  const [groupId, setGroupId] = useState("");
  const [homeId, setHomeId] = useState("");
  const [awayId, setAwayId] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function createMatch() {
    if (!homeId || !awayId || homeId === awayId) return toast.error("Pick two different teams");
    const { error } = await write("matches", "insert", {
      stage,
      group_id: stage === "group" ? groupId || null : null,
      home_team_id: homeId,
      away_team_id: awayId,
      status: "scheduled",
    });
    if (error) return toast.error(error.message);
    setHomeId(""); setAwayId("");
    toast.success("Match created");
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card-elevated p-5 grid gap-3 md:grid-cols-6">
        <Select value={stage} onChange={(e) => setStage(e.target.value as MatchStage)}>
          {(["group","r32","r16","qf","sf","3rd","final"] as MatchStage[]).map((s) => (
            <option key={s} value={s}>{stageLabel[s]}</option>
          ))}
        </Select>
        {stage === "group" ? (
          <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">Group…</option>
            {data.groups.map((g) => <option key={g.id} value={g.id}>Group {g.name}</option>)}
          </Select>
        ) : <div />}
        <Select value={homeId} onChange={(e) => setHomeId(e.target.value)}>
          <option value="">Home…</option>
          {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <Select value={awayId} onChange={(e) => setAwayId(e.target.value)}>
          <option value="">Away…</option>
          {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <div className="md:col-span-2">
          <PrimaryButton onClick={createMatch} icon={<Plus className="h-4 w-4" />}>Create match</PrimaryButton>
        </div>
      </div>

      <div className="space-y-3">
        {data.matches.length === 0 && (
          <div className="card-elevated p-8 text-center text-muted-foreground text-sm">No matches yet</div>
        )}
        {data.matches.map((m) => (
          <MatchAdminRow
            key={m.id}
            match={m}
            teams={data.teams}
            goals={data.goals.filter((g) => g.match_id === m.id)}
            expanded={expanded === m.id}
            onToggle={() => setExpanded(expanded === m.id ? null : m.id)}
            onChange={refresh}
          />
        ))}
      </div>
    </div>
  );
}

function MatchAdminRow({
  match, teams, goals, expanded, onToggle, onChange,
}: {
  match: Match; teams: Team[]; goals: { id: string; team_id: string; scorer_name: string; minute: number }[];
  expanded: boolean; onToggle: () => void; onChange: () => void;
}) {
  const home = teams.find((t) => t.id === match.home_team_id);
  const away = teams.find((t) => t.id === match.away_team_id);

  async function updateMatch(patch: Partial<Match>) {
    const { error } = await write("matches", "update", patch, match.id);
    if (error) return toast.error(error.message);
    onChange();
  }
  async function deleteMatch() {
    if (!confirm("Delete match?")) return;
    const { error } = await write("matches", "delete", undefined, match.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); onChange();
  }

  return (
    <div className="card-elevated overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-2 transition">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground w-20">{stageLabel[match.stage]}</span>
          <span className="font-semibold truncate">{home?.name ?? "TBD"}</span>
          <span className="text-accent font-bold tabular-nums">{match.home_score} - {match.away_score}</span>
          <span className="font-semibold truncate">{away?.name ?? "TBD"}</span>
        </div>
        <span className="text-xs uppercase text-muted-foreground">{match.status}</span>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <NumberInput label="Home score" value={match.home_score} onChange={(v) => updateMatch({ home_score: v })} />
            <NumberInput label="Away score" value={match.away_score} onChange={(v) => updateMatch({ away_score: v })} />
            <div>
              <Label>Status</Label>
              <Select value={match.status} onChange={(e) => updateMatch({ status: e.target.value as MatchStatus })}>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="finished">Finished</option>
              </Select>
            </div>
            <div>
              <Label>MVP name</Label>
              <Input value={match.mvp_player_name ?? ""} onChange={(e) => updateMatch({ mvp_player_name: e.target.value || null })} />
            </div>
            <div>
              <Label>MVP team</Label>
              <Select value={match.mvp_team_id ?? ""} onChange={(e) => updateMatch({ mvp_team_id: e.target.value || null })}>
                <option value="">—</option>
                {home && <option value={home.id}>{home.name}</option>}
                {away && <option value={away.id}>{away.name}</option>}
              </Select>
            </div>
          </div>

          {/* Penalty shootout — for draws after extra time in knockout */}
          {match.stage !== "group" && (
            <div className="rounded-lg border border-border/70 p-3 bg-surface-2/40">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Extra time & penalties
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={match.went_to_extra_time}
                    onChange={(e) => updateMatch({ went_to_extra_time: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  Went to extra time
                </label>
                <NumberInput
                  label={`${home?.short_name ?? "Home"} pens`}
                  value={match.home_pens ?? 0}
                  onChange={(v) => updateMatch({ home_pens: v })}
                />
                <NumberInput
                  label={`${away?.short_name ?? "Away"} pens`}
                  value={match.away_pens ?? 0}
                  onChange={(v) => updateMatch({ away_pens: v })}
                />
                <button
                  onClick={() => updateMatch({ home_pens: null, away_pens: null })}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Clear penalties
                </button>
              </div>
              {match.home_score === match.away_score &&
                match.went_to_extra_time &&
                (match.home_pens === null || match.away_pens === null) && (
                  <p className="text-[11px] text-accent mt-2">
                    Draw after extra time — enter penalty scores to record the shootout winner.
                  </p>
                )}
            </div>
          )}

          <GoalsEditor matchId={match.id} home={home} away={away} goals={goals} onChange={onChange} />

          <div className="flex justify-end">
            <IconButton onClick={deleteMatch}><Trash2 className="h-4 w-4 mr-1" /> Delete match</IconButton>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalsEditor({
  matchId, home, away, goals, onChange,
}: {
  matchId: string; home?: Team; away?: Team;
  goals: { id: string; team_id: string; scorer_name: string; minute: number }[];
  onChange: () => void;
}) {
  const [teamId, setTeamId] = useState(home?.id ?? "");
  const [scorer, setScorer] = useState("");
  const [minute, setMinute] = useState<number>(1);

  async function addGoal() {
    if (!teamId || !scorer.trim()) return toast.error("Team + scorer required");
    const { error } = await write("goals", "insert", {
      match_id: matchId, team_id: teamId, scorer_name: scorer.trim(), minute,
    });
    if (error) return toast.error(error.message);
    setScorer(""); setMinute(minute + 1);
    onChange();
  }
  async function removeGoal(id: string) {
    const { error } = await write("goals", "delete", undefined, id);
    if (error) return toast.error(error.message);
    onChange();
  }

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Goal events</div>
      <div className="grid gap-2 md:grid-cols-[1fr_2fr_100px_auto]">
        <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">Team…</option>
          {home && <option value={home.id}>{home.name}</option>}
          {away && <option value={away.id}>{away.name}</option>}
        </Select>
        <Input placeholder="Scorer name" value={scorer} onChange={(e) => setScorer(e.target.value)} />
        <Input type="number" min={1} max={120} value={minute} onChange={(e) => setMinute(Number(e.target.value))} />
        <PrimaryButton onClick={addGoal} icon={<Plus className="h-4 w-4" />}>Goal</PrimaryButton>
      </div>
      {goals.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {goals.sort((a, b) => a.minute - b.minute).map((g) => (
            <li key={g.id} className="flex items-center justify-between bg-surface-2 rounded px-3 py-1.5">
              <span>
                <span className="text-accent">⚽</span> <span className="font-medium">{g.scorer_name}</span>{" "}
                <span className="text-muted-foreground">{g.minute}'</span>{" "}
                <span className="text-muted-foreground text-xs">
                  ({g.team_id === home?.id ? home?.name : away?.name})
                </span>
              </span>
              <IconButton onClick={() => removeGoal(g.id)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Assists / GK ---------------- */

function AssistsTab({ data }: { data: ReturnType<typeof useTournament>["data"] & object }) {
  const refresh = useInvalidateTournament();
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [assists, setAssists] = useState<number>(0);

  async function add() {
    if (!name.trim()) return toast.error("Name required");
    const { error } = await write("assist_stats", "insert", {
      player_name: name.trim(), team_id: teamId || null, assists,
    });
    if (error) return toast.error(error.message);
    setName(""); setAssists(0); refresh(); toast.success("Added");
  }
  async function update(id: string, patch: { assists?: number; team_id?: string | null }) {
    const { error } = await write("assist_stats", "update", patch, id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function remove(id: string) {
    const { error } = await write("assist_stats", "delete", undefined, id);
    if (error) return toast.error(error.message);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card-elevated p-5 grid gap-3 md:grid-cols-4">
        <Input placeholder="Player name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">Team…</option>
          {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <Input type="number" min={0} value={assists} onChange={(e) => setAssists(Number(e.target.value))} />
        <PrimaryButton onClick={add} icon={<Plus className="h-4 w-4" />}>Add</PrimaryButton>
      </div>
      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-muted-foreground bg-surface-2">
            <tr><th className="text-left px-3 py-2">Player</th><th className="text-left px-3 py-2">Team</th><th className="text-left px-3 py-2">Assists</th><th></th></tr>
          </thead>
          <tbody>
            {data.assists.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground text-xs">No assists tracked yet</td></tr>}
            {data.assists.map((a) => (
              <tr key={a.id} className="border-t border-border/60">
                <td className="px-3 py-2 font-medium">{a.player_name}</td>
                <td className="px-3 py-2">
                  <Select value={a.team_id ?? ""} onChange={(e) => update(a.id, { team_id: e.target.value || null })}>
                    <option value="">—</option>
                    {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </td>
                <td className="px-3 py-2 w-28">
                  <Input type="number" min={0} value={a.assists} onChange={(e) => update(a.id, { assists: Number(e.target.value) })} />
                </td>
                <td className="px-3 py-2 text-right"><IconButton onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></IconButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GkTab({ data }: { data: ReturnType<typeof useTournament>["data"] & object }) {
  const refresh = useInvalidateTournament();
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [cs, setCs] = useState<number>(0);
  const [saves, setSaves] = useState<number>(0);

  async function add() {
    if (!name.trim()) return toast.error("Name required");
    const { error } = await write("gk_stats", "insert", {
      player_name: name.trim(), team_id: teamId || null, clean_sheets: cs, saves,
    });
    if (error) return toast.error(error.message);
    setName(""); setCs(0); setSaves(0); refresh(); toast.success("Added");
  }
  async function update(id: string, patch: { clean_sheets?: number; saves?: number; team_id?: string | null }) {
    const { error } = await write("gk_stats", "update", patch, id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function remove(id: string) {
    const { error } = await write("gk_stats", "delete", undefined, id);
    if (error) return toast.error(error.message);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card-elevated p-5 grid gap-3 md:grid-cols-5">
        <Input placeholder="Goalkeeper name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">Team…</option>
          {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <Input type="number" min={0} placeholder="Clean sheets" value={cs} onChange={(e) => setCs(Number(e.target.value))} />
        <Input type="number" min={0} placeholder="Saves" value={saves} onChange={(e) => setSaves(Number(e.target.value))} />
        <PrimaryButton onClick={add} icon={<Plus className="h-4 w-4" />}>Add</PrimaryButton>
      </div>
      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-muted-foreground bg-surface-2">
            <tr><th className="text-left px-3 py-2">Player</th><th className="text-left px-3 py-2">Team</th><th className="text-left px-3 py-2">Clean sheets</th><th className="text-left px-3 py-2">Saves</th><th></th></tr>
          </thead>
          <tbody>
            {data.gks.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground text-xs">No keepers tracked yet</td></tr>}
            {data.gks.map((k) => (
              <tr key={k.id} className="border-t border-border/60">
                <td className="px-3 py-2 font-medium">{k.player_name}</td>
                <td className="px-3 py-2">
                  <Select value={k.team_id ?? ""} onChange={(e) => update(k.id, { team_id: e.target.value || null })}>
                    <option value="">—</option>
                    {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </td>
                <td className="px-3 py-2 w-28"><Input type="number" min={0} value={k.clean_sheets} onChange={(e) => update(k.id, { clean_sheets: Number(e.target.value) })} /></td>
                <td className="px-3 py-2 w-28"><Input type="number" min={0} value={k.saves} onChange={(e) => update(k.id, { saves: Number(e.target.value) })} /></td>
                <td className="px-3 py-2 text-right"><IconButton onClick={() => remove(k.id)}><Trash2 className="h-4 w-4" /></IconButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- primitives ---------------- */

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{children}</label>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("w-full h-10 rounded-md bg-surface-2 border border-border px-3 text-sm outline-none focus:border-accent transition", props.className)} />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("w-full h-10 rounded-md bg-surface-2 border border-border px-2 text-sm outline-none focus:border-accent transition", props.className)} />;
}

/* Debounced local editing: type freely, commit shortly after you stop. */
function useDebouncedCommit<T>(value: T, commit: (v: T) => void, delay = 600) {
  const [local, setLocal] = useState<T>(value);
  const dirty = useRef(false);
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    if (!dirty.current) setLocal(value);
  }, [value]);

  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => {
      dirty.current = false;
      commitRef.current(local);
    }, delay);
    return () => clearTimeout(t);
  }, [local, delay]);

  return [
    local,
    (v: T) => {
      dirty.current = true;
      setLocal(v);
    },
    dirty,
  ] as const;
}

function DebouncedInput({
  value,
  onCommit,
  ...rest
}: { value: string; onCommit: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  const [local, set, dirty] = useDebouncedCommit(value, onCommit);
  return (
    <div className="relative">
      <Input
        {...rest}
        value={local}
        onChange={(e) => set(e.target.value)}
        onBlur={() => {
          if (dirty.current) {
            dirty.current = false;
            onCommit(local);
          }
        }}
      />
      {dirty.current && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
      )}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [local, set, dirty] = useDebouncedCommit(value, onChange, 450);
  const bump = (d: number) => set(Math.max(0, local + d));
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-stretch rounded-md border border-border bg-surface-2 overflow-hidden focus-within:border-accent transition">
        <button
          type="button"
          onClick={() => bump(-1)}
          className="w-9 text-muted-foreground hover:text-accent hover:bg-surface transition active:scale-90"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={local}
          onChange={(e) => set(Number(e.target.value))}
          onBlur={() => {
            if (dirty.current) {
              dirty.current = false;
              onChange(local);
            }
          }}
          className="flex-1 w-full h-10 bg-transparent text-center text-sm font-bold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => bump(1)}
          className="w-9 text-muted-foreground hover:text-accent hover:bg-surface transition active:scale-90"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function StatInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [local, set, dirty] = useDebouncedCommit(value, onCommit, 450);
  return (
    <input
      type="number"
      min={0}
      value={local}
      onChange={(e) => set(Number(e.target.value))}
      onBlur={() => {
        if (dirty.current) {
          dirty.current = false;
          onCommit(local);
        }
      }}
      className="w-full h-9 rounded-md bg-surface-2 border border-border px-2 text-sm text-center font-semibold tabular-nums outline-none focus:border-accent transition [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}

function PrimaryButton({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md gold-gradient text-accent-foreground text-sm font-semibold transition-transform duration-200 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
    >
      {icon}{children}
    </button>
  );
}
function IconButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center h-8 px-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-surface-2 transition text-xs active:scale-90">
      {children}
    </button>
  );
}

