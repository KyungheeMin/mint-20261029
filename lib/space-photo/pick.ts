export type LibraryItem = {
  data: Array<{
    nasa_id: string;
    title: string;
    description?: string;
    date_created: string;
    media_type: string;
  }>;
  links?: Array<{ href: string }>;
};

export type PickedPhoto = {
  id: string;
  title: string;
  date: string;
  explanation: string;
  previewUrl: string;
};

const SEARCH_TERMS = [
  "nebula",
  "galaxy",
  "supernova",
  "star cluster",
  "Saturn",
  "Jupiter",
  "Mars",
  "Earth from space",
  "aurora",
  "Milky Way",
  "comet",
  "Moon",
];

const MAX_EXPLANATION = 1000;

function hash(text: string): number {
  let value = 0;
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value;
}

function daysSinceEpoch(date: string): number {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 86_400_000);
}

export function searchTermFor(date: string): string {
  return SEARCH_TERMS[daysSinceEpoch(date) % SEARCH_TERMS.length];
}

export function cleanDescription(raw: string): string {
  const text = raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= MAX_EXPLANATION) return text;

  const head = text.slice(0, MAX_EXPLANATION);
  const lastStop = Math.max(
    head.lastIndexOf(". "),
    head.lastIndexOf("? "),
    head.lastIndexOf("! "),
  );
  return lastStop > 0 ? head.slice(0, lastStop + 1) : head;
}

export function pickPhoto(items: LibraryItem[], date: string): PickedPhoto | null {
  const candidates = items.filter(
    (item) => item.data[0]?.media_type === "image" && item.links?.[0]?.href,
  );
  if (candidates.length === 0) return null;

  const chosen = candidates[hash(date) % candidates.length];
  const meta = chosen.data[0];
  return {
    id: meta.nasa_id,
    title: meta.title,
    date: meta.date_created.slice(0, 10),
    explanation: cleanDescription(meta.description ?? ""),
    previewUrl: chosen.links![0].href,
  };
}
