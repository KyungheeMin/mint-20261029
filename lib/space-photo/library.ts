import { pickPhoto, searchTermFor } from "./pick";

const SEARCH_ENDPOINT = "https://images-api.nasa.gov/search";

export type SpacePhoto = {
  id: string;
  title: string;
  date: string;
  explanation: string;
  url: string;
};

type FetchFn = (input: URL, init?: RequestInit) => Promise<Response>;

async function exists(url: string, fetchFn: FetchFn): Promise<boolean> {
  try {
    const response = await fetchFn(new URL(url), { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

// Prefer the large rendition; fall back to medium, then to the preview itself.
async function bestImageUrl(previewUrl: string, fetchFn: FetchFn): Promise<string> {
  const swap = (size: string) => previewUrl.replace(/~[a-z]+(\.[a-z]+)$/i, `~${size}$1`);
  for (const candidate of [swap("large"), swap("medium")]) {
    if (candidate !== previewUrl && (await exists(candidate, fetchFn))) return candidate;
  }
  return previewUrl;
}

export async function fetchPhotoFor(
  date: string,
  fetchFn: FetchFn = (input, init) => fetch(input, { cache: "no-store", ...init }),
): Promise<SpacePhoto | null> {
  try {
    const url = new URL(SEARCH_ENDPOINT);
    url.searchParams.set("q", searchTermFor(date));
    url.searchParams.set("media_type", "image");
    url.searchParams.set("page_size", "100");

    const response = await fetchFn(url);
    if (!response.ok) return null;
    const body = (await response.json()) as {
      collection: { items: Parameters<typeof pickPhoto>[0] };
    };

    const picked = pickPhoto(body.collection.items, date);
    if (!picked) return null;

    const { previewUrl, ...rest } = picked;
    return { ...rest, url: await bestImageUrl(previewUrl, fetchFn) };
  } catch {
    return null;
  }
}
