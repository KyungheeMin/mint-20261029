import { describe, expect, test, vi } from "vitest";

import { fetchPhotoFor } from "./library";

function searchResponse(count = 5) {
  const items = Array.from({ length: count }, (_, i) => ({
    data: [
      {
        nasa_id: `PIA${i}`,
        title: `Photo ${i}`,
        description: `Description ${i}.`,
        date_created: "2011-08-10T00:00:00Z",
        media_type: "image",
      },
    ],
    links: [{ href: `https://images-assets.nasa.gov/image/PIA${i}/PIA${i}~small.jpg` }],
  }));
  return new Response(JSON.stringify({ collection: { items } }), { status: 200 });
}

function fakeFetch(headOk: (url: string) => boolean, search = searchResponse()) {
  return vi.fn(async (input: URL | string, init?: RequestInit) => {
    const url = String(input);
    if (init?.method === "HEAD") {
      return new Response(null, { status: headOk(url) ? 200 : 404 });
    }
    return search.clone();
  });
}

describe("fetchPhotoFor", () => {
  test("날짜로 고른 사진의 제목, 공개일, 출처, 설명을 돌려준다", async () => {
    const fetchFn = fakeFetch(() => true);
    const photo = await fetchPhotoFor("2026-10-29", fetchFn);

    expect(photo).toMatchObject({
      title: expect.stringMatching(/^Photo \d$/),
      date: "2011-08-10",
      explanation: expect.stringMatching(/^Description \d\.$/),
      id: expect.stringMatching(/^PIA\d$/),
    });
  });

  test("큰 이미지가 있으면 large 주소를 쓴다", async () => {
    const photo = await fetchPhotoFor("2026-10-29", fakeFetch(() => true));
    expect(photo?.url).toMatch(/~large\.jpg$/);
  });

  test("large가 없으면 medium, 그것도 없으면 받은 주소를 쓴다", async () => {
    const noLarge = await fetchPhotoFor(
      "2026-10-29",
      fakeFetch((url) => !url.includes("~large")),
    );
    expect(noLarge?.url).toMatch(/~medium\.jpg$/);

    const onlyOriginal = await fetchPhotoFor(
      "2026-10-29",
      fakeFetch((url) => url.includes("~small")),
    );
    expect(onlyOriginal?.url).toMatch(/~small\.jpg$/);
  });

  test("검색어에 날짜별 검색어와 이미지 조건을 담아 요청한다", async () => {
    const fetchFn = fakeFetch(() => true);
    await fetchPhotoFor("2026-10-29", fetchFn);

    const searchUrl = new URL(String(fetchFn.mock.calls[0][0]));
    expect(searchUrl.origin).toBe("https://images-api.nasa.gov");
    expect(searchUrl.searchParams.get("media_type")).toBe("image");
    expect(searchUrl.searchParams.get("q")).toBeTruthy();
  });

  test("검색 결과가 없으면 null이다", async () => {
    const photo = await fetchPhotoFor("2026-10-29", fakeFetch(() => true, searchResponse(0)));
    expect(photo).toBeNull();
  });

  test("호출이 실패하면 던지지 않고 null이다", async () => {
    const failing = vi.fn(async () => {
      throw new Error("offline");
    });
    expect(await fetchPhotoFor("2026-10-29", failing)).toBeNull();

    const serverError = vi.fn(async () => new Response("", { status: 500 }));
    expect(await fetchPhotoFor("2026-10-29", serverError)).toBeNull();
  });
});
