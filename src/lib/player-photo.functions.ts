import { createServerFn } from "@tanstack/react-start";

export const lookupPlayerPhoto = createServerFn({ method: "GET" })
  .inputValidator((input: { name: string; team: string }) => {
    if (!input || typeof input.name !== "string" || input.name.trim().length === 0 || input.name.length > 100) {
      throw new Error("Invalid player name");
    }
    if (typeof input.team !== "string" || input.team.length > 100) {
      throw new Error("Invalid team name");
    }
    return { name: input.name.trim(), team: input.team.trim() };
  })
  .handler(async ({ data }) => {
    try {
      const search = `${data.name} ${data.team} footballer`.trim();
      const params = new URLSearchParams({
        action: "query",
        format: "json",
        origin: "*",
        generator: "search",
        gsrlimit: "5",
        gsrsearch: search,
        prop: "pageimages",
        piprop: "thumbnail",
        pithumbsize: "320",
      });
      const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`, {
        headers: { "User-Agent": "eFootballArena/1.0 (player photo lookup)" },
      });
      if (!response.ok) return { photoUrl: null };
      const payload = (await response.json()) as {
        query?: { pages?: Record<string, { ns?: number; title?: string; thumbnail?: { source?: string } }> };
      };
      const pages = Object.values(payload.query?.pages ?? {}).filter((page) => page.ns === 0 && page.thumbnail?.source);
      const photoUrl = pages[0]?.thumbnail?.source;
      return { photoUrl: photoUrl?.startsWith("https://") ? photoUrl : null };
    } catch {
      return { photoUrl: null };
    }
  });