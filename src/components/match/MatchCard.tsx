import type { Goal, Match, Team } from "@/lib/tournament";
import { stageLabel } from "@/lib/tournament";
import { TeamBadge } from "@/components/team/TeamBadge";
import { cn } from "@/lib/utils";

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

  return (
    <div className="card-elevated overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{stageLabel[match.stage]}</span>
        <StatusBadge status={match.status} />
      </div>

      {/* scoreline */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2">
        <TeamBadge team={home} />
        <div className={cn("text-center tabular-nums", compact ? "text-xl" : "text-2xl font-bold")}>
          {isFinished || isLive ? (
            <span className={isLive ? "text-[var(--live)]" : ""}>
              {match.home_score}<span className="mx-2 text-muted-foreground">-</span>{match.away_score}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">vs</span>
          )}
        </div>
        <TeamBadge team={away} align="right" />
      </div>

      {/* goals timeline */}
      {matchGoals.length > 0 && (
        <div className="grid grid-cols-2 gap-2 px-4 pb-3 pt-2 border-t border-border/60 text-xs">
          <ul className="space-y-1">
            {homeGoals.map((g) => (
              <li key={g.id} className="text-foreground/90">
                <span className="text-accent">⚽</span> {g.scorer_name}{" "}
                <span className="text-muted-foreground">{g.minute}'</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-1 text-right">
            {awayGoals.map((g) => (
              <li key={g.id} className="text-foreground/90">
                <span className="text-muted-foreground">{g.minute}'</span> {g.scorer_name}{" "}
                <span className="text-accent">⚽</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {match.mvp_player_name && (
        <div className="px-4 pb-3 -mt-1 text-[11px] text-accent flex items-center gap-1">
          ★ MVP: <span className="font-medium">{match.mvp_player_name}</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Match["status"] }) {
  if (status === "live")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--live)_20%,transparent)] px-2 py-0.5 text-[10px] font-bold text-[var(--live)]">
        <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--live)]" /> LIVE
      </span>
    );
  if (status === "finished")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
        FT
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      SCHEDULED
    </span>
  );
}
