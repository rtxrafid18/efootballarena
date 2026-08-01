import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useTournament } from "@/hooks/useTournament";
import { MatchCard } from "@/components/match/MatchCard";
import { stageLabel, type MatchStage } from "@/lib/tournament";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Matches — eFootball Cup" },
      { name: "description", content: "All tournament matches with live scores and goal timelines." },
      { property: "og:title", content: "Matches — eFootball Cup" },
      { property: "og:description", content: "All tournament matches, live and finished." },
    ],
  }),
  component: MatchesPage,
});

const FILTERS: { key: "all" | "live" | "finished" | "scheduled"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "finished", label: "Finished" },
  { key: "scheduled", label: "Upcoming" },
];

function MatchesPage() {
  const { data } = useTournament();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [stageFilter, setStageFilter] = useState<MatchStage | "all">("all");


  if (!data) return (
      <AppLayout>
        <div className="space-y-4">
          <div className="h-28 rounded-2xl bg-surface/60 animate-pulse" />
          <div className="grid gap-3.5 md:grid-cols-2 stagger-kick">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-surface/50 animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );

  const matches = data.matches.filter(
    (m) => (filter === "all" || m.status === filter) && (stageFilter === "all" || m.stage === stageFilter),
  );


  // group by stage
  const byStage = new Map<MatchStage, typeof matches>();
  for (const m of matches) {
    const arr = byStage.get(m.stage) ?? [];
    arr.push(m);
    byStage.set(m.stage, arr);
  }

  return (
    <AppLayout>
      <PageHeader title="Match Center" subtitle="Live, finished and upcoming fixtures" />

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-full font-display text-[11px] font-bold uppercase tracking-[0.14em] border transition-all duration-300 ease-out",
              filter === f.key
                ? "gold-gradient text-accent-foreground border-transparent shadow-[0_10px_24px_-14px_var(--gold)] -translate-y-px"
                : "border-border text-muted-foreground hover:text-foreground hover:border-accent/40",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {matches.length === 0 ? (
        <div className="card-elevated p-8 text-center text-muted-foreground text-sm">
          No matches to show.
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(byStage.entries()).map(([stage, list]) => (
            <section key={stage}>
              <h2 className="section-title text-foreground mb-4">
                {stageLabel[stage]}
              </h2>
              <div className="grid gap-3.5 md:grid-cols-2 stagger-kick">
                {list.map((m) => (
                  <MatchCard key={m.id} match={m} teams={data.teams} goals={data.goals} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
