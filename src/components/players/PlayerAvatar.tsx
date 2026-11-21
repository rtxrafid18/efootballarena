import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Team } from "@/lib/tournament";
import { lookupPlayerPhoto } from "@/lib/player-photo.functions";
import { cn } from "@/lib/utils";

export function PlayerAvatar({
  name,
  team,
  size = "md",
}: {
  name: string;
  team?: Team | null;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const { data } = useQuery({
    queryKey: ["player-photo", name, team?.name ?? ""],
    queryFn: async () => (await lookupPlayerPhoto({ data: { name, team: team?.name ?? "" } })).photoUrl,
    enabled: Boolean(name.trim()),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });

  const dimension = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const photo = !failed ? data : null;

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 ring-1 ring-border",
        dimension,
      )}
    >
      {photo ? (
        <img
          src={photo}
          alt={`${name} portrait`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : team?.logo_url ? (
        <img src={team.logo_url} alt={`${team.name} badge`} loading="lazy" className="h-full w-full object-contain p-1" />
      ) : (
        <span className="font-display text-xs font-bold text-muted-foreground">
          {name.trim().slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}