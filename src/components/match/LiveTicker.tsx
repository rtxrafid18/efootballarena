import { Link } from "@tanstack/react-router";
import { useTournament } from "@/hooks/useTournament";
import { stageLabel } from "@/lib/tournament";

export function LiveTicker() {
  const { data } = useTournament();
  if (!data) return null;

  const live = data.matches.filter((m) => m.status === "live");
  if (live.length === 0) return null;

  const teamById = new Map(data.teams.map((t) => [t.id, t]));

  // Duplicate list for seamless marquee loop
  const items = [...live, ...live];

  return (
    <div className="sticky top-14 z-20 border-b border-border bg-[color-mix(in_oklab,var(--live)_10%,var(--background))] backdrop-blur-xl overflow-hidden">
      <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 h-9">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--live)] px-2 py-0.5 text-[10px] font-bold text-white shrink-0">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
          LIVE
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex gap-6 whitespace-nowrap animate-[ticker_40s_linear_infinite] hover:[animation-play-state:paused]">
            {items.map((m, i) => {
              const home = m.home_team_id ? teamById.get(m.home_team_id) : null;
              const away = m.away_team_id ? teamById.get(m.away_team_id) : null;
              return (
                <Link
                  key={`${m.id}-${i}`}
                  to="/matches/$matchId"
                  params={{ matchId: m.id }}
                  className="inline-flex items-center gap-2 text-xs font-medium hover:text-accent transition-colors"
                >
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {stageLabel[m.stage]}
                  </span>
                  {home?.logo_url && (
                    <img src={home.logo_url} alt="" className="h-3.5 w-5 object-cover rounded-sm" />
                  )}
                  <span>{home?.short_name ?? home?.name ?? "TBD"}</span>
                  <span className="tabular-nums font-bold text-[var(--live)]">
                    {m.home_score} - {m.away_score}
                  </span>
                  <span>{away?.short_name ?? away?.name ?? "TBD"}</span>
                  {away?.logo_url && (
                    <img src={away.logo_url} alt="" className="h-3.5 w-5 object-cover rounded-sm" />
                  )}
                  <span className="text-muted-foreground">•</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
