import { describe, expect, test } from "vitest";

import {
  cleanDescription,
  pickPhoto,
  searchTermFor,
  type LibraryItem,
} from "./pick";

function item(n: number, overrides: Partial<LibraryItem["data"][0]> = {}): LibraryItem {
  return {
    data: [
      {
        nasa_id: `PIA${n}`,
        title: `Photo ${n}`,
        description: `Description ${n}.`,
        date_created: "2011-08-10T00:00:00Z",
        media_type: "image",
        ...overrides,
      },
    ],
    links: [{ href: `https://images-assets.nasa.gov/image/PIA${n}/PIA${n}~medium.jpg` }],
  };
}

describe("searchTermFor", () => {
  test("같은 날짜는 같은 검색어를 돌려준다", () => {
    expect(searchTermFor("2026-10-29")).toBe(searchTermFor("2026-10-29"));
  });

  test("날짜가 바뀌면 검색어가 바뀐다", () => {
    expect(searchTermFor("2026-10-29")).not.toBe(searchTermFor("2026-10-30"));
  });
});

describe("pickPhoto", () => {
  const items = Array.from({ length: 30 }, (_, i) => item(i));

  test("같은 날짜에는 같은 사진을 고른다", () => {
    expect(pickPhoto(items, "2026-10-29")).toEqual(pickPhoto(items, "2026-10-29"));
  });

  test("날짜가 다르면 다른 사진을 고른다", () => {
    const ids = new Set(
      ["2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"].map(
        (date) => pickPhoto(items, date)?.id,
      ),
    );
    expect(ids.size).toBeGreaterThan(1);
  });

  test("영상은 후보에서 빠지고 이미지만 고른다", () => {
    const mixed = [
      item(1, { media_type: "video" }),
      item(2, { media_type: "video" }),
      item(3),
    ];
    for (const date of ["2026-10-29", "2026-10-30", "2026-10-31"]) {
      expect(pickPhoto(mixed, date)?.id).toBe("PIA3");
    }
  });

  test("미리보기 링크가 없는 항목은 후보에서 빠진다", () => {
    const noLink: LibraryItem = { ...item(1), links: [] };
    expect(pickPhoto([noLink, item(2)], "2026-10-29")?.id).toBe("PIA2");
  });

  test("후보가 없으면 null이다", () => {
    expect(pickPhoto([], "2026-10-29")).toBeNull();
    expect(pickPhoto([item(1, { media_type: "video" })], "2026-10-29")).toBeNull();
  });

  test("제목, 공개일, 출처 식별번호, 정리된 설명을 돌려준다", () => {
    const picked = pickPhoto(
      [item(7, { description: "<b>Bold</b> text &amp; more." })],
      "2026-10-29",
    );
    expect(picked).toEqual({
      id: "PIA7",
      title: "Photo 7",
      date: "2011-08-10",
      explanation: "Bold text & more.",
      previewUrl: "https://images-assets.nasa.gov/image/PIA7/PIA7~medium.jpg",
    });
  });
});

describe("cleanDescription", () => {
  test("HTML 태그를 지우고 공백을 정리한다", () => {
    expect(cleanDescription("<p>A  nebula\n\nglows.</p>")).toBe("A nebula glows.");
  });

  test("긴 설명은 문장 경계에서 1,000자 안쪽으로 줄인다", () => {
    const sentence = "This is a sentence about space. ";
    const long = sentence.repeat(60);
    const cleaned = cleanDescription(long);
    expect(cleaned.length).toBeLessThanOrEqual(1000);
    expect(cleaned.endsWith(".")).toBe(true);
  });
});
