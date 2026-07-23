import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAll } from "@/lib/tournament";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTournament() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["tournament"], queryFn: fetchAll });

  useEffect(() => {
    const channel = supabase
      .channel("tournament-any")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        qc.invalidateQueries({ queryKey: ["tournament"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export function useInvalidateTournament() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["tournament"] });
}
