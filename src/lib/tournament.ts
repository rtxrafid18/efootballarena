import { supabase } from "@/integrations/supabase/client";

export type Team = {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  group_id: string | null;
};

export type Group = { id: string; name: string; position: number };

export type MatchStage = "group" | "r32" | "r16" | "qf" | "sf" | "3rd" | "final";
export type MatchStatus = "scheduled" | "live" | "finished";

export type Match = {
  id: string;
  stage: MatchStage;
  group_id: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number;
  away_score: number;
  status: MatchStatus;
  scheduled_at: string | null;
  mvp_player_name: string | null;
  mvp_team_id: string | null;
  bracket_slot: number | null;
  home_pens: number | null;
  away_pens: number | null;
  went_to_extra_time: boolean;
  created_at: string;
};

export type Goal = {
  id: string;
  match_id: string;
  team_id: string;
  scorer_name: string;
  minute: number;
};

export type AssistStat = {
  id: string;
  player_name: string;
  team_id: string | null;
  assists: number;
};

export type GkStat = {
  id: string;
  player_name: string;
  team_id: string | null;
  clean_sheets: number;
  saves: number;
};

export type Settings = {
  id: number;
  tournament_format: "groups" | "knockout";
  tournament_name: string;
};

export const stageLabel: Record<MatchStage, string> = {
  group: "Group Stage",
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-final",
  sf: "Semi-final",
  "3rd": "3rd Place",
  final: "Final",
};

export async function fetchAll() {
  const [settings, teams, groups, matches, goals, assists, gks] = await Promise.all([
    supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("teams").select("*").order("name"),
    supabase.from("groups").select("*").order("position"),
    supabase.from("matches").select("*").order("created_at"),
    supabase.from("goals").select("*").order("minute"),
    supabase.from("assist_stats").select("*").order("assists", { ascending: false }),
    supabase.from("gk_stats").select("*").order("clean_sheets", { ascending: false }),
  ]);
  return {
    settings: (settings.data as Settings | null) ?? {
      id: 1,
      tournament_format: "groups" as const,
      tournament_name: "eFootball World Cup",
    },
    teams: (teams.data ?? []) as Team[],
    groups: (groups.data ?? []) as Group[],
    matches: (matches.data ?? []) as Match[],
    goals: (goals.data ?? []) as Goal[],
    assists: (assists.data ?? []) as AssistStat[],
    gks: (gks.data ?? []) as GkStat[],
  };
}

export type TournamentData = Awaited<ReturnType<typeof fetchAll>>;

/* ---------- Aggregations ---------- */

export function topScorers(goals: Goal[], teams: Team[]) {
  const map = new Map<string, { player: string; team_id: string; goals: number }>();
  for (const g of goals) {
    const key = `${g.scorer_name}::${g.team_id}`;
    const cur = map.get(key) ?? { player: g.scorer_name, team_id: g.team_id, goals: 0 };
    cur.goals += 1;
    map.set(key, cur);
  }
  const teamById = new Map(teams.map((t) => [t.id, t]));
  return Array.from(map.values())
    .map((r) => ({ ...r, team: teamById.get(r.team_id) ?? null }))
    .sort((a, b) => b.goals - a.goals);
}

export function goldenBall(data: TournamentData) {
  // Weighted formula (all metrics considered):
  // goals*4 + assists*3 + clean_sheets*2 + mvp*5
  const map = new Map<
    string,
    { player: string; team_id: string | null; goals: number; assists: number; clean_sheets: number; mvps: number }
  >();

  const get = (name: string, team_id: string | null) => {
    const key = `${name.toLowerCase()}::${team_id ?? ""}`;
    let cur = map.get(key);
    if (!cur) {
      cur = { player: name, team_id, goals: 0, assists: 0, clean_sheets: 0, mvps: 0 };
      map.set(key, cur);
    }
    return cur;
  };

  for (const g of data.goals) get(g.scorer_name, g.team_id).goals += 1;
  for (const a of data.assists) get(a.player_name, a.team_id).assists += a.assists;
  for (const k of data.gks) get(k.player_name, k.team_id).clean_sheets += k.clean_sheets;
  for (const m of data.matches) {
    if (m.mvp_player_name) get(m.mvp_player_name, m.mvp_team_id).mvps += 1;
  }

  const teamById = new Map(data.teams.map((t) => [t.id, t]));
  return Array.from(map.values())
    .map((r) => ({
      ...r,
      team: r.team_id ? teamById.get(r.team_id) ?? null : null,
      score: r.goals * 4 + r.assists * 3 + r.clean_sheets * 2 + r.mvps * 5,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

/* Group standings */
export type Standing = {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

export function groupStandings(groupId: string, data: TournamentData): Standing[] {
  const teams = data.teams.filter((t) => t.group_id === groupId);
  const rows: Record<string, Standing> = {};
  for (const t of teams)
    rows[t.id] = { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };

  const matches = data.matches.filter(
    (m) => m.stage === "group" && m.group_id === groupId && m.status === "finished",
  );
  for (const m of matches) {
    if (!m.home_team_id || !m.away_team_id) continue;
    const h = rows[m.home_team_id];
    const a = rows[m.away_team_id];
    if (!h || !a) continue;
    h.played++; a.played++;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;
    if (m.home_score > m.away_score) { h.won++; a.lost++; h.points += 3; }
    else if (m.home_score < m.away_score) { a.won++; h.lost++; a.points += 3; }
    else { h.drawn++; a.drawn++; h.points += 1; a.points += 1; }
  }
  for (const r of Object.values(rows)) r.gd = r.gf - r.ga;
  return Object.values(rows).sort(
    (a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team.name.localeCompare(b.team.name),
  );
}

/* ---------- Podium ---------- */

export function matchWinner(match: Match | null | undefined, teams: Team[]): Team | null {
  if (!match || match.status !== "finished") return null;
  const { home_team_id, away_team_id, home_score, away_score, home_pens, away_pens } = match;
  let winnerId: string | null = null;
  if (home_score > away_score) winnerId = home_team_id;
  else if (away_score > home_score) winnerId = away_team_id;
  else if (home_pens !== null && away_pens !== null)
    winnerId = home_pens > away_pens ? home_team_id : away_team_id;
  return teams.find((t) => t.id === winnerId) ?? null;
}

export function matchLoser(match: Match | null | undefined, teams: Team[]): Team | null {
  const w = matchWinner(match, teams);
  if (!match || !w) return null;
  const loserId = w.id === match.home_team_id ? match.away_team_id : match.home_team_id;
  return teams.find((t) => t.id === loserId) ?? null;
}

/** Teams that actually take part (appear in at least one fixture). */
export function participatingTeams(data: TournamentData): Team[] {
  const ids = new Set<string>();
  for (const m of data.matches) {
    if (m.home_team_id) ids.add(m.home_team_id);
    if (m.away_team_id) ids.add(m.away_team_id);
  }
  for (const t of data.teams) if (t.group_id) ids.add(t.id);
  return data.teams.filter((t) => ids.has(t.id));
}

export function tournamentPodium(data: TournamentData) {
  const finalMatch = data.matches.find((m) => m.stage === "final") ?? null;
  const thirdMatch = data.matches.find((m) => m.stage === "3rd") ?? null;
  const champion = matchWinner(finalMatch, data.teams);
  const runnerUp = matchLoser(finalMatch, data.teams);
  const third = matchWinner(thirdMatch, data.teams);
  const best = goldenBall(data)[0] ?? null;
  const boot = topScorers(data.goals, data.teams)[0] ?? null;
  return { finalMatch, thirdMatch, champion, runnerUp, third, best, boot };
}
