import { describe, expect, test, vi } from "vitest";

import { createKoreanTranslator, splitForTranslation } from "./korean";

function myMemoryResponse(translatedText: string, responseStatus = 200) {
  return new Response(
    JSON.stringify({ responseStatus, responseData: { translatedText } }),
    { status: 200 },
  );
}

describe("splitForTranslation", () => {
  test("짧은 글은 한 조각으로 둔다", () => {
    expect(splitForTranslation("Short text.")).toEqual(["Short text."]);
  });

  test("문장 경계에서 나누고 각 조각은 한도를 넘지 않는다", () => {
    const sentence = "A".repeat(200) + ".";
    const text = [sentence, sentence, sentence].join(" ");
    const chunks = splitForTranslation(text, 450);
    expect(chunks.length).toBe(2);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(450);
    expect(chunks.join(" ")).toBe(text);
  });

  test("한 문장이 한도보다 길어도 한도 안으로 잘라낸다", () => {
    const chunks = splitForTranslation("B".repeat(1000), 450);
    expect(chunks.length).toBe(3);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(450);
  });
});

describe("createKoreanTranslator", () => {
  test("조각마다 번역을 받아 이어 붙인다", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(myMemoryResponse("첫째 조각"))
      .mockResolvedValueOnce(myMemoryResponse("둘째 조각"));
    const translate = createKoreanTranslator(fetchFn);
    const text = ["A".repeat(300) + ".", "B".repeat(300) + "."].join(" ");

    expect(await translate("2026-10-29", text)).toBe("첫째 조각 둘째 조각");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  test("같은 날짜는 한 번만 번역하고 저장된 결과를 쓴다", async () => {
    const fetchFn = vi.fn().mockResolvedValue(myMemoryResponse("번역됨"));
    const translate = createKoreanTranslator(fetchFn);

    await translate("2026-10-29", "Hello.");
    await translate("2026-10-29", "Hello.");

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test("같은 날짜를 동시에 요청해도 번역 요청은 한 번만 나간다", async () => {
    const fetchFn = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return myMemoryResponse("번역됨");
    });
    const translate = createKoreanTranslator(fetchFn);

    const [a, b] = await Promise.all([
      translate("2026-10-29", "Hello."),
      translate("2026-10-29", "Hello."),
    ]);

    expect(a).toBe("번역됨");
    expect(b).toBe("번역됨");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test("다른 날짜는 따로 번역한다", async () => {
    const fetchFn = vi.fn().mockResolvedValue(myMemoryResponse("번역됨"));
    const translate = createKoreanTranslator(fetchFn);

    await translate("2026-10-29", "Hello.");
    await translate("2026-10-28", "Hello.");

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  test("네트워크가 실패하면 null을 돌려주고 다음에 다시 시도한다", async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(myMemoryResponse("두 번째엔 성공"));
    const translate = createKoreanTranslator(fetchFn);

    expect(await translate("2026-10-29", "Hello.")).toBeNull();
    expect(await translate("2026-10-29", "Hello.")).toBe("두 번째엔 성공");
  });

  test("번역 서비스가 오류 상태를 돌려주면 null이다", async () => {
    const fetchFn = vi.fn().mockResolvedValue(myMemoryResponse("QUOTA", 429));
    const translate = createKoreanTranslator(fetchFn);

    expect(await translate("2026-10-29", "Hello.")).toBeNull();
  });
});
