import type { Goal, Match, Team } from "@/lib/tournament";
import { stageLabel } from "@/lib/tournament";
import { TeamBadge } from "@/components/team/TeamBadge";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export function MatchCard({
  match,
  teams,
  goals,
  compact = false,
}: {
  match: Match;
  teams: Team[];
  goals: Goal[];
  compact?: boolean;
}) {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const home = match.home_team_id ? teamById.get(match.home_team_id) : null;
  const away = match.away_team_id ? teamById.get(match.away_team_id) : null;

  const matchGoals = goals
    .filter((g) => g.match_id === match.id)
    .sort((a, b) => a.minute - b.minute);
  const homeGoals = matchGoals.filter((g) => g.team_id === match.home_team_id);
  const awayGoals = matchGoals.filter((g) => g.team_id === match.away_team_id);

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const hasPens = match.home_pens !== null && match.away_pens !== null;
  const penWinner = hasPens
    ? (match.home_pens ?? 0) > (match.away_pens ?? 0)
      ? home
      : away
    : null;

  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: match.id }}
      className={cn(
        "card-elevated lift group overflow-hidden block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        isLive && "border-[color-mix(in_oklab,var(--live)_38%,var(--border))]",
      )}
    >
      {/* accent rail */}
      <span
        className={cn(
          "absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 transition-transform duration-500 ease-out group-hover:scale-y-100",
          isLive ? "bg-[var(--live)] scale-y-100" : "bg-gradient-to-b from-accent to-accent/10",
        )}
      />

      {/* header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {stageLabel[match.stage]}
        </span>
        <StatusBadge status={match.status} />
      </div>

      {/* scoreline */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2.5">
        <TeamBadge team={home} />
        <div
          className={cn(
            "font-display tabular-nums text-center px-3 py-1 rounded-lg bg-surface-2/70 border border-border/70",
            compact ? "text-lg font-bold" : "text-2xl font-extrabold",
          )}
        >
          {isFinished || isLive ? (
            <span className={isLive ? "text-[var(--live)]" : "text-foreground"}>
              {match.home_score}
              <span className="mx-1.5 text-muted-foreground/70">:</span>
              {match.away_score}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs font-bold tracking-[0.15em] uppercase">
              vs
            </span>
          )}
        </div>
        <TeamBadge team={away} align="right" />
      </div>

      {/* penalties */}
      {hasPens && (
        <div className="px-4 pb-2 text-center text-[11px] text-muted-foreground">
          Penalties{" "}
          <span className="text-foreground font-semibold tabular-nums">
            {match.home_pens} – {match.away_pens}
          </span>
          {penWinner && (
            <span className="ml-2 text-accent font-semibold">
              · {penWinner.short_name ?? penWinner.name} advance
            </span>
          )}
        </div>
      )}

      {/* goals timeline */}
      {matchGoals.length > 0 && (
        <div className="grid grid-cols-2 gap-3 px-4 pb-3.5 pt-2.5 mt-1 border-t border-border/60 text-xs">
          <ul className="space-y-1.5">
            {homeGoals.map((g) => (
              <li key={g.id} className="flex items-center gap-1.5 text-foreground/90">
                <span className="text-accent text-[10px]">⚽</span>
                <span className="truncate">{g.scorer_name}</span>
                <span className="tabular-nums text-muted-foreground">{g.minute}'</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-1.5">
            {awayGoals.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-end gap-1.5 text-foreground/90"
              >
                <span className="tabular-nums text-muted-foreground">{g.minute}'</span>
                <span className="truncate">{g.scorer_name}</span>
                <span className="text-accent text-[10px]">⚽</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {match.mvp_player_name && (
        <div className="px-4 pb-3.5 -mt-1 text-[11px] text-accent flex items-center gap-1.5">
          <span className="trophy-glow">★</span> MVP
          <span className="font-semibold text-foreground/90">{match.mvp_player_name}</span>
        </div>
      )}
    </Link>
  );
}

function StatusBadge({ status }: { status: Match["status"] }) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.16em]";
  if (status === "live")
    return (
      <span
        className={cn(
          base,
          "live-ring bg-[color-mix(in_oklab,var(--live)_18%,transparent)] text-[var(--live)]",
        )}
      >
        <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--live)]" /> Live
      </span>
    );
  if (status === "finished")
    return <span className={cn(base, "bg-surface-2 text-muted-foreground")}>Full time</span>;
  return (
    <span className={cn(base, "bg-surface-2 text-muted-foreground")}>Upcoming</span>
  );
}
