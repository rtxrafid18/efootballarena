import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTournament } from "@/hooks/useTournament";
import { TeamBadge } from "@/components/team/TeamBadge";
import { stageLabel } from "@/lib/tournament";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/matches/$matchId")({
  head: () => ({
    meta: [
      { title: "Match Details — eFootball Cup" },
      { name: "description", content: "Full match details, goals timeline, MVP and penalty results." },
      { property: "og:title", content: "Match Details — eFootball Cup" },
      { property: "og:description", content: "Full match details, goals timeline, MVP and penalty results." },
    ],
  }),
  component: MatchDetailPage,
});

function MatchDetailPage() {
  const { matchId } = useParams({ from: "/matches/$matchId" });
  const { data } = useTournament();

  if (!data) return <AppLayout><div className="text-muted-foreground">Loading…</div></AppLayout>;

  const match = data.matches.find((m) => m.id === matchId);
  if (!match) {
    return (
      <AppLayout>
        <Link to="/matches" className="text-sm text-accent inline-flex items-center gap-1 mb-4"><ArrowLeft className="h-3.5 w-3.5" /> All matches</Link>
        <div className="card-elevated p-8 text-center text-muted-foreground">Match not found.</div>
      </AppLayout>
    );
  }

  const teamById = new Map(data.teams.map((t) => [t.id, t]));
  const home = match.home_team_id ? teamById.get(match.home_team_id) ?? null : null;
  const away = match.away_team_id ? teamById.get(match.away_team_id) ?? null : null;
  const goals = data.goals.filter((g) => g.match_id === match.id).sort((a, b) => a.minute - b.minute);
  const homeGoals = goals.filter((g) => g.team_id === match.home_team_id);
  const awayGoals = goals.filter((g) => g.team_id === match.away_team_id);
  const hasPens = match.home_pens !== null && match.away_pens !== null;
  const penWinner = hasPens
    ? (match.home_pens ?? 0) > (match.away_pens ?? 0) ? home : away
    : null;

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <AppLayout>
      <Link to="/matches" className="text-sm text-accent inline-flex items-center gap-1 mb-4 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> All matches
      </Link>

      <div className="card-elevated overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-4 pb-2 text-xs uppercase tracking-widest text-muted-foreground">
          <span>{stageLabel[match.stage]}</span>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--live)_20%,transparent)] px-2 py-0.5 text-[10px] font-bold text-[var(--live)]">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--live)]" /> LIVE
            </span>
          )}
          {isFinished && <span>Full Time</span>}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-6">
          <div className="text-center md:text-left"><TeamBadgeLg team={home} align="center" /></div>
          <div className="text-center">
            <div className={`text-5xl md:text-6xl font-black tabular-nums ${isLive ? "text-[var(--live)]" : ""}`}>
              {isFinished || isLive ? `${match.home_score} - ${match.away_score}` : "vs"}
            </div>
            {hasPens && (
              <div className="mt-2 text-xs text-muted-foreground">
                Penalties: <span className="text-foreground font-semibold tabular-nums">{match.home_pens} - {match.away_pens}</span>
              </div>
            )}
            {match.went_to_extra_time && (
              <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">After Extra Time</div>
            )}
          </div>
          <div className="text-center md:text-right"><TeamBadgeLg team={away} align="center" /></div>
        </div>

        {penWinner && (
          <div className="mx-6 mb-4 rounded-md gold-gradient text-accent-foreground px-4 py-2 text-center text-sm font-bold">
            🏆 {penWinner.name} win on penalties
          </div>
        )}

        {goals.length > 0 && (
          <div className="border-t border-border/60 px-6 py-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Goal Timeline</div>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <ul className="space-y-1.5">
                {homeGoals.map((g) => (
                  <li key={g.id}><span className="text-accent">⚽</span> {g.scorer_name} <span className="text-muted-foreground">{g.minute}'</span></li>
                ))}
                {homeGoals.length === 0 && <li className="text-muted-foreground text-xs">—</li>}
              </ul>
              <ul className="space-y-1.5 text-right">
                {awayGoals.map((g) => (
                  <li key={g.id}><span className="text-muted-foreground">{g.minute}'</span> {g.scorer_name} <span className="text-accent">⚽</span></li>
                ))}
                {awayGoals.length === 0 && <li className="text-muted-foreground text-xs">—</li>}
              </ul>
            </div>
          </div>
        )}

        {match.mvp_player_name && (
          <div className="border-t border-border/60 px-6 py-4 flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Man of the Match</div>
              <div className="font-semibold">{match.mvp_player_name}</div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function TeamBadgeLg({ team, align }: { team: Parameters<typeof TeamBadge>[0]["team"]; align?: "center" | "right" }) {
  return (
    <div className={`flex flex-col items-${align === "center" ? "center" : "start"} gap-2`}>
      {team?.logo_url ? (
        <img src={team.logo_url} alt="" className="h-16 w-16 rounded-full object-cover bg-surface-2" />
      ) : (
        <div className="h-16 w-16 rounded-full bg-surface-2 flex items-center justify-center text-xl font-bold text-muted-foreground">
          {team?.short_name?.slice(0, 3) ?? team?.name?.slice(0, 3) ?? "?"}
        </div>
      )}
      <div className="text-base font-bold text-center">{team?.name ?? "TBD"}</div>
    </div>
  );
}
