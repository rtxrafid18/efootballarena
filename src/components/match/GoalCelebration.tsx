import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTournament } from "@/hooks/useTournament";

type Celebration = {
  id: string;
  scorer: string;
  minute: number;
  teamName: string;
};

export function GoalCelebration() {
  const { data } = useTournament();
  const [queue, setQueue] = useState<Celebration[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const bootstrapped = useRef(false);

  // Seed with existing goal ids so we don't celebrate on first load.
  useEffect(() => {
    if (bootstrapped.current || !data) return;
    for (const g of data.goals) seen.current.add(g.id);
    bootstrapped.current = true;
  }, [data]);

  useEffect(() => {
    const channel = supabase.channel(`goal-celebration-${Math.random().toString(36).slice(2)}`);
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "goals" },
        (payload) => {
          const g = payload.new as {
            id: string;
            match_id: string;
            team_id: string;
            scorer_name: string;
            minute: number;
          };
          if (!bootstrapped.current) return;
          if (seen.current.has(g.id)) return;
          seen.current.add(g.id);

          // Only celebrate for live matches
          const match = data?.matches.find((m) => m.id === g.match_id);
          if (match && match.status !== "live") return;

          const team = data?.teams.find((t) => t.id === g.team_id);
          const celeb: Celebration = {
            id: g.id,
            scorer: g.scorer_name,
            minute: g.minute,
            teamName: team?.name ?? "",
          };
          setQueue((q) => [...q, celeb]);
          setTimeout(() => {
            setQueue((q) => q.filter((c) => c.id !== celeb.id));
          }, 3500);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [data]);

  if (queue.length === 0) return null;
  const current = queue[0];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />
      <div
        key={current.id}
        className="relative animate-scale-in card-elevated px-10 py-8 text-center border-2 border-accent shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.42 0.16 15), oklch(0.28 0.10 15))",
        }}
      >
        <div className="text-7xl mb-2 goal-bounce">⚽</div>
        <div className="text-4xl font-black tracking-wider text-accent drop-shadow">
          GOAL!
        </div>
        <div className="mt-3 text-xl font-bold text-white">{current.scorer}</div>
        {current.teamName && (
          <div className="text-sm uppercase tracking-widest text-white/80 mt-1">
            {current.teamName}
          </div>
        )}
        <div className="mt-2 text-xs text-white/70 tabular-nums">
          {current.minute}'
        </div>
      </div>
    </div>
  );
}
