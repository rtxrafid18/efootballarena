import { createServerFn } from "@tanstack/react-start";
import { requireUnlocked } from "./admin.server";

type Kind = "worldcup" | "ucl";

async function getJson(url: string): Promise<any> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "eFootballArena/1.0" } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function fromSportsDb(name: string) {
  const j = await getJson(
    `https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(name)}`,
  );
  const teams: any[] = (j?.teams ?? []).filter((t: any) => t?.strSport === "Soccer" && t?.strBadge);
  const t = teams.find((x) => x.strGender !== "Female") ?? teams[0];
  return t ? { logo: t.strBadge as string, short: (t.strTeamShort as string) || null } : null;
}

const ALIASES: Record<string, string> = {
  usa: "united states", "united states of america": "united states", "south korea": "south korea",
  "korea republic": "south korea", "ivory coast": "côte d'ivoire", "cote d'ivoire": "côte d'ivoire",
  holland: "netherlands", "czech republic": "czechia", "bosnia": "bosnia and herzegovina",
  iran: "iran", turkiye: "turkey", "türkiye": "turkey", "dr congo": "dr congo", uae: "united arab emirates",
};

async function fromCountry(name: string) {
  const codes = await getJson("https://flagcdn.com/en/codes.json");
  if (!codes) return null;
  let lower = name.toLowerCase().trim();
  lower = ALIASES[lower] ?? lower;
  const entries = Object.entries(codes as Record<string, string>);
  const hit =
    entries.find(([, n]) => n.toLowerCase() === lower) ??
    entries.find(([, n]) => n.toLowerCase().startsWith(lower) || lower.startsWith(n.toLowerCase()));
  if (!hit) return null;
  return { logo: `https://flagcdn.com/w320/${hit[0]}.png`, short: name.slice(0, 3).toUpperCase() };
}

async function fromWikipedia(name: string, kind: Kind) {
  const q = kind === "ucl" ? `${name} F.C.` : `${name} national football team`;
  const j = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=1&gsrsearch=${encodeURIComponent(q)}&prop=pageimages&piprop=thumbnail&pithumbsize=320`,
  );
  const pages = j?.query?.pages ? Object.values(j.query.pages) : [];
  const src = (pages[0] as any)?.thumbnail?.source;
  return src ? { logo: src as string, short: null } : null;
}

export async function findLogo(name: string, kind: Kind) {
  const order =
    kind === "ucl"
      ? [fromSportsDb, (n: string) => fromWikipedia(n, kind)]
      : [fromCountry, fromSportsDb, (n: string) => fromWikipedia(n, kind)];
  for (const fn of order) {
    const r = await fn(name);
    if (r) return r;
  }
  return null;
}

export const lookupTeamLogo = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; kind: Kind }) => {
    if (!d || typeof d.name !== "string" || !d.name.trim() || d.name.length > 80) throw new Error("Invalid name");
    return { name: d.name.trim(), kind: d.kind === "ucl" ? ("ucl" as const) : ("worldcup" as const) };
  })
  .handler(async ({ data }) => {
    await requireUnlocked();
    return { result: await findLogo(data.name, data.kind) };
  });
