import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  FADE_OUT_MS,
  FINISH_PHRASE,
  PHRASES,
  PHRASE_INTERVAL_SECONDS,
  SESSION_SECONDS,
  TRACKS,
} from "@/lib/meditation/content";

import { MeditationSession, type PhotoView } from "./session";

const photo: PhotoView = {
  id: "PIA14417",
  date: "2011-08-10",
  title: "Weighing in on the Dumbbell Nebula",
  url: "https://images-assets.nasa.gov/image/PIA14417/PIA14417~large.jpg",
  explanation: "The nebula glows in infrared light.",
};

class FakeAudio {
  static instances: FakeAudio[] = [];
  volume = 1;
  paused = true;
  play = vi.fn(async () => {
    this.paused = false;
  });
  pause = vi.fn(() => {
    this.paused = true;
  });
  constructor(public src: string) {
    FakeAudio.instances.push(this);
  }
}

function setup(
  overrides: Partial<React.ComponentProps<typeof MeditationSession>> = {},
) {
  return render(
    <MeditationSession
      loadPhoto={async () => photo}
      loadTranslation={async () => "금성에도 위상이 있습니다."}
      createAudio={(src) => new FakeAudio(src) as unknown as HTMLAudioElement}
      {...overrides}
    />,
  );
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function advance(seconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(seconds * 1000);
  });
}

async function start() {
  fireEvent.click(screen.getByRole("button", { name: "명상 시작" }));
  await flush();
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeAudio.instances = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("시작 전 화면", () => {
  test("곡 선택과 시작 버튼이 보이고 기본 곡이 선택되어 있다", async () => {
    setup();
    await flush();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(TRACKS.length);
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "명상 시작" })).toBeEnabled();
  });
});

describe("명상 세션", () => {
  test("시작을 한 번 누르면 사진과 설명, 문구, 음악, 05:00 카운트다운이 보인다", async () => {
    setup();
    await flush();
    await start();

    expect(screen.getByText("Weighing in on the Dumbbell Nebula")).toBeInTheDocument();
    expect(screen.getByText("2011-08-10")).toBeInTheDocument();
    expect(screen.getByText("The nebula glows in infrared light.")).toBeInTheDocument();
    expect(screen.getByText("금성에도 위상이 있습니다.")).toBeInTheDocument();
    expect(screen.getByText(PHRASES[0])).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("05:00");

    expect(FakeAudio.instances).toHaveLength(1);
    expect(FakeAudio.instances[0].src).toBe(TRACKS[0].src);
    expect(FakeAudio.instances[0].play).toHaveBeenCalled();
  });

  test("영어 원문이 위에, 한국어 번역이 그 아래에 있다", async () => {
    setup();
    await flush();
    await start();

    const english = screen.getByText("The nebula glows in infrared light.");
    const korean = screen.getByText("금성에도 위상이 있습니다.");
    expect(
      english.compareDocumentPosition(korean) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test("시간이 지나면 카운트다운이 줄고 문구가 바뀐다", async () => {
    setup();
    await flush();
    await start();

    await advance(PHRASE_INTERVAL_SECONDS);

    expect(screen.getByRole("timer")).toHaveTextContent("04:30");
    expect(screen.getByText(PHRASES[1])).toBeInTheDocument();
    expect(screen.queryByText(PHRASES[0])).not.toBeInTheDocument();
  });

  test("다른 곡을 고르고 시작하면 고른 곡이 흐른다", async () => {
    setup();
    await flush();

    fireEvent.click(screen.getAllByRole("radio")[1]);
    await start();

    expect(FakeAudio.instances[0].src).toBe(TRACKS[1].src);
  });

  test("5분이 끝나면 음악이 서서히 줄며 멈추고 마침 문구가 보이며 사진은 남는다", async () => {
    setup();
    await flush();
    await start();

    await advance(SESSION_SECONDS);

    expect(screen.getByText(FINISH_PHRASE)).toBeInTheDocument();
    expect(screen.getByText("Weighing in on the Dumbbell Nebula")).toBeInTheDocument();

    const audio = FakeAudio.instances[0];
    expect(audio.volume).toBeLessThan(1);
    expect(audio.pause).not.toHaveBeenCalled();

    await advance(FADE_OUT_MS / 1000 + 1);

    expect(audio.pause).toHaveBeenCalled();
  });

  test("중간 종료를 누르면 음악이 즉시 멈추고 시작 전 화면으로 돌아간다", async () => {
    setup();
    await flush();
    await start();

    fireEvent.click(screen.getByRole("button", { name: "명상 끝내기" }));

    expect(FakeAudio.instances[0].pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "명상 시작" })).toBeInTheDocument();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });
});

describe("실패하는 날", () => {
  test("번역이 실패하면 영어만 보이고 명상은 끝까지 진행된다", async () => {
    setup({ loadTranslation: async () => null });
    await flush();
    await start();

    expect(screen.getByText("The nebula glows in infrared light.")).toBeInTheDocument();

    await advance(SESSION_SECONDS);
    expect(screen.getByText(FINISH_PHRASE)).toBeInTheDocument();
  });

  test("쓸 수 있는 사진이 없어도 사진 없이 명상이 진행된다", async () => {
    setup({ loadPhoto: async () => null });
    await flush();
    await start();

    expect(screen.getByRole("timer")).toHaveTextContent("05:00");
    expect(FakeAudio.instances[0].play).toHaveBeenCalled();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  test("사진의 출처를 NASA 이미지 라이브러리와 식별번호로 밝힌다", async () => {
    setup();
    await flush();
    await start();

    expect(screen.getByText(/NASA 이미지 라이브러리 · PIA14417/)).toBeInTheDocument();
  });
});
