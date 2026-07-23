import type { Team } from "@/lib/tournament";
import { cn } from "@/lib/utils";

export function TeamBadge({
  team,
  size = "md",
  showName = true,
  align = "left",
}: {
  team: Team | null | undefined;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  align?: "left" | "right";
}) {
  const px = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-6 w-6" : "h-9 w-9";
  const text = size === "lg" ? "text-base" : size === "sm" ? "text-xs" : "text-sm";
  const initials = (team?.short_name || team?.name || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const logo = (
    <div
      className={cn(
        "shrink-0 rounded-full flex items-center justify-center overflow-hidden border border-border bg-surface-2 font-semibold",
        px,
      )}
    >
      {team?.logo_url ? (
        <img src={team.logo_url} alt={team.name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[0.7em] text-muted-foreground">{initials}</span>
      )}
    </div>
  );

  if (!showName) return logo;

  return (
    <div
      className={cn(
        "flex items-center gap-2 min-w-0",
        align === "right" && "flex-row-reverse text-right",
      )}
    >
      {logo}
      <span className={cn("truncate font-medium", text)}>{team?.name ?? "TBD"}</span>
    </div>
  );
}
