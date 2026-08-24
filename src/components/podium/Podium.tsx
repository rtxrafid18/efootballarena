import { TeamBadge } from "@/components/team/TeamBadge";
import type { TournamentData } from "@/lib/tournament";
import { tournamentPodium } from "@/lib/tournament";

export function Podium({ data }: { data: TournamentData }) {
  const { champion, runnerUp, third, best, boot, finalMatch } = tournamentPodium(data);
  if (!champion) return null;

  const score = finalMatch
    ? `${finalMatch.home_score}–${finalMatch.away_score}` +
      (finalMatch.home_pens !== null && finalMatch.away_pens !== null
        ? ` (${finalMatch.home_pens}–${finalMatch.away_pens} pens)`
        : "")
    : null;

  return (
    <section className="card-elevated overflow-hidden mb-8 reveal">
      <div className="absolute inset-x-0 top-0 h-[2px] ribbon-strip" />
      <div className="px-5 pt-6 pb-5 text-center border-b border-border/60">
        <div className="eyebrow opacity-70">Final standings</div>
        <div className="text-4xl mt-3 mb-2 float-y">🏆</div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
          {champion.name} are champions
        </h2>
        {score && (
          <p className="text-xs text-muted-foreground mt-2 uppercase tracking-[0.18em]">
            Final {score}
            {runnerUp ? ` · vs ${runnerUp.name}` : ""}
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
        <PodiumSlot rank="1st" label="Champion" medal="🥇" team={champion} highlight />
        <PodiumSlot rank="2nd" label="Runners-up" medal="🥈" team={runnerUp} />
        <PodiumSlot rank="3rd" label="Third place" medal="🥉" team={third} />
      </div>

      {(best || boot) && (
        <div className="grid sm:grid-cols-2 border-t border-border/60 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          {best && (
            <AwardSlot
              emoji="⭐"
              label="Player of the tournament"
              name={best.player}
              sub={`${best.team?.name ?? ""} · ${best.goals}G ${best.assists}A · ${best.score} pts`}
            />
          )}
          {boot && (
            <AwardSlot
              emoji="👟"
              label="Golden Boot"
              name={boot.player}
              sub={`${boot.team?.name ?? ""} · ${boot.goals} goals`}
            />
          )}
        </div>
      )}
    </section>
  );
}

function PodiumSlot({
  rank,
  label,
  medal,
  team,
  highlight,
}: {
  rank: string;
  label: string;
  medal: string;
  team: { id: string; name: string; short_name: string | null; logo_url: string | null; group_id: string | null } | null;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "group flex items-center gap-3 px-5 py-4 transition-colors duration-300 " +
        (highlight ? "bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]" : "hover:bg-surface-2/60")
      }
    >
      <span className="text-xl leading-none">{medal}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-accent/90">
          {rank} · {label}
        </div>
        <div className="mt-1.5">
          <TeamBadge team={team} size="sm" />
        </div>
      </div>
    </div>
  );
}

function AwardSlot({
  emoji,
  label,
  name,
  sub,
}: {
  emoji: string;
  label: string;
  name: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="h-9 w-9 rounded-lg gold-frame grid place-items-center text-base shrink-0">
        {emoji}
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-accent/90">
          {label}
        </div>
        <div className="font-semibold truncate">{name}</div>
        <div className="text-[11px] text-muted-foreground truncate">{sub}</div>
      </div>
    </div>
  );
}
