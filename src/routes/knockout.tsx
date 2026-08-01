import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useTournament } from "@/hooks/useTournament";
import { MatchCard } from "@/components/match/MatchCard";
import type { Match, MatchStage, Team } from "@/lib/tournament";
import { stageLabel } from "@/lib/tournament";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/knockout")({
  head: () => ({
    meta: [
      { title: "Knockout Bracket — eFootball Cup" },
      { name: "description", content: "Round of 32 through to the Final — full knockout bracket with live scores." },
      { property: "og:title", content: "Knockout Bracket — eFootball Cup" },
      { property: "og:description", content: "Follow the road to the Final." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KnockoutPage,
});

const BRACKET_STAGES: MatchStage[] = ["r32", "r16", "qf", "sf", "final"];

function KnockoutPage() {
  const { data } = useTournament();

  if (!data)
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="h-28 rounded-2xl bg-surface/60 animate-pulse" />
          <div className="grid gap-3.5 md:grid-cols-2 stagger-bracket">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-surface/50 animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );

  const stages = BRACKET_STAGES.map((stage) => ({
    stage,
    list: data.matches
      .filter((m) => m.stage === stage)
      .sort((a, b) => (a.bracket_slot ?? 0) - (b.bracket_slot ?? 0)),
  })).filter((s) => s.list.length > 0);

  const thirdPlace = data.matches.find((m) => m.stage === "3rd") ?? null;
  const finalMatch = data.matches.find((m) => m.stage === "final") ?? null;
  const champion = winnerOf(finalMatch, data.teams);

  if (stages.length === 0 && !thirdPlace) {
    return (
      <AppLayout>
        <PageHeader title="Knockout" subtitle="The road to the Final" />
        <div className="stadium-panel p-10 text-center">
          <div className="text-3xl mb-3 float-y">🏆</div>
          <div className="font-display text-lg font-extrabold uppercase tracking-[0.1em]">
            Bracket not drawn yet
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Knockout fixtures will appear here once they are scheduled.
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Knockout Bracket"
        subtitle={
          data.settings.tournament_format === "knockout"
            ? "Direct knockout · Round of 32 to the Final"
            : "The road to the Final"
        }
      />

      {champion && (
        <div className="champion-banner mb-6 reveal">
          <div className="text-2xl trophy-glow">🏆</div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent/90 font-bold">
              Champions
            </div>
            <div className="font-display text-xl font-extrabold uppercase tracking-[0.06em]">
              {champion.name}
            </div>
          </div>
          {champion.logo_url && (
            <img
              src={champion.logo_url}
              alt=""
              className="ml-auto h-9 w-14 rounded-md object-cover ring-1 ring-accent/40"
            />
          )}
        </div>
      )}

      {/* Bracket */}
      <div className="pitch-frame overflow-x-auto pb-3">
        <div className="bracket-grid min-w-max px-4 py-5">
          {stages.map(({ stage, list }, colIndex) => {
            const pairs = chunkPairs(list);
            const isLastCol = colIndex === stages.length - 1;
            return (
              <div key={stage} className="bk-col" style={{ ["--col" as string]: colIndex }}>
                <h2 className="bk-heading">{stageLabel[stage]}</h2>
                <div className={cn("bk-body", !isLastCol && "bk-body--linked")}>
                  {pairs.map((pair, pi) => (
                    <div key={pi} className={cn("bk-pair", pair.length === 2 && "bk-pair--joined")}>
                      {pair.map((m) => (
                        <div key={m.id} className="bk-node">
                          <MatchCard
                            match={m}
                            teams={data.teams}
                            goals={data.goals}
                            compact
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3rd place play-off */}
      {thirdPlace && (
        <section className="mt-8 reveal">
          <h2 className="section-title text-foreground mb-4">
            <span className="text-accent">🥉</span> 3rd Place Play-off
          </h2>
          <div className="md:max-w-md">
            <MatchCard match={thirdPlace} teams={data.teams} goals={data.goals} />
          </div>
        </section>
      )}

      <div className="mt-8 text-center">
        <Link
          to="/matches"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent/90 hover:text-accent transition-colors"
        >
          View all fixtures →
        </Link>
      </div>
    </AppLayout>
  );
}

function chunkPairs<T>(list: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += 2) out.push(list.slice(i, i + 2));
  return out;
}

function winnerOf(match: Match | null, teams: Team[]): Team | null {
  if (!match || match.status !== "finished") return null;
  const { home_team_id, away_team_id, home_score, away_score, home_pens, away_pens } = match;
  let winnerId: string | null = null;
  if (home_score > away_score) winnerId = home_team_id;
  else if (away_score > home_score) winnerId = away_team_id;
  else if (home_pens !== null && away_pens !== null)
    winnerId = home_pens > away_pens ? home_team_id : away_team_id;
  return teams.find((t) => t.id === winnerId) ?? null;
}
