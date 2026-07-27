import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useTournament } from "@/hooks/useTournament";
import { MatchCard } from "@/components/match/MatchCard";
import type { MatchStage } from "@/lib/tournament";
import { stageLabel } from "@/lib/tournament";

export const Route = createFileRoute("/knockout")({
  head: () => ({
    meta: [
      { title: "Knockout Bracket — eFootball Cup" },
      { name: "description", content: "Round of 32 through to the Final — full knockout bracket." },
      { property: "og:title", content: "Knockout Bracket — eFootball Cup" },
      { property: "og:description", content: "Follow the road to the Final." },
    ],
  }),
  component: KnockoutPage,
});

const STAGES: MatchStage[] = ["r32", "r16", "qf", "sf", "3rd", "final"];

function KnockoutPage() {
  const { data } = useTournament();
  if (!data) return (
      <AppLayout>
        <div className="space-y-4">
          <div className="h-28 rounded-2xl bg-surface/60 animate-pulse" />
          <div className="grid gap-3.5 md:grid-cols-2 stagger">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-surface/50 animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );

  return (
    <AppLayout>
      <PageHeader
        title="Knockout"
        subtitle={data.settings.tournament_format === "knockout" ? "Direct knockout mode" : "Post group stage"}
      />
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const list = data.matches.filter((m) => m.stage === stage);
          if (list.length === 0) return null;
          return (
            <div key={stage} className="min-w-[280px] flex-shrink-0 space-y-3">
              <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-accent/90 text-center py-2.5 border-b border-accent/20">
                {stageLabel[stage]}
              </h2>
              {list.map((m) => (
                <MatchCard key={m.id} match={m} teams={data.teams} goals={data.goals} compact />
              ))}
            </div>
          );
        })}
        {data.matches.filter((m) => m.stage !== "group").length === 0 && (
          <div className="card-elevated p-8 text-center text-muted-foreground text-sm w-full">
            No knockout matches scheduled yet.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
