const ENDPOINT = "https://api.mymemory.translated.net/get";
// The free endpoint rejects queries over 500 characters.
const MAX_CHUNK = 450;

type FetchFn = (input: URL) => Promise<Response>;

export function splitForTranslation(text: string, max = MAX_CHUNK): string[] {
  const sentences = text.split(/(?<=[.?!])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    for (let i = 0; i < sentence.length; i += max) {
      const piece = sentence.slice(i, i + max);
      if (current && current.length + 1 + piece.length > max) {
        chunks.push(current);
        current = piece;
      } else {
        current = current ? `${current} ${piece}` : piece;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(chunk: string, fetchFn: FetchFn): Promise<string> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", chunk);
  url.searchParams.set("langpair", "en|ko");

  const response = await fetchFn(url);
  const body = (await response.json()) as {
    responseStatus: number | string;
    responseData: { translatedText: string };
  };
  if (Number(body.responseStatus) !== 200) {
    throw new Error(`translation failed: ${body.responseStatus}`);
  }
  return body.responseData.translatedText;
}

export function createKoreanTranslator(fetchFn: FetchFn = (url) => fetch(url)) {
  // Holds in-flight and finished translations so concurrent calls share one request.
  const saved = new Map<string, Promise<string>>();

  async function run(text: string): Promise<string> {
    const parts: string[] = [];
    for (const chunk of splitForTranslation(text)) {
      parts.push(await translateChunk(chunk, fetchFn));
    }
    return parts.join(" ");
  }

  // Returns null on any failure so the session can carry on with English only.
  return async function translate(
    date: string,
    text: string,
  ): Promise<string | null> {
    let pending = saved.get(date);
    if (!pending) {
      pending = run(text);
      saved.set(date, pending);
    }

    try {
      return await pending;
    } catch {
      // Forget the failure so the next call tries again.
      if (saved.get(date) === pending) saved.delete(date);
      return null;
    }
  };
}
