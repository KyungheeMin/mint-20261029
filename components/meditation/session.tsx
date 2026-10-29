"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DEFAULT_TRACK_ID,
  FADE_OUT_MS,
  FINISH_PHRASE,
  PHRASES,
  PHRASE_INTERVAL_SECONDS,
  SESSION_SECONDS,
  TRACKS,
} from "@/lib/meditation/content";

export type PhotoView = {
  id: string;
  date: string;
  title: string;
  url: string;
  explanation: string;
};

type Props = {
  loadPhoto: () => Promise<PhotoView | null>;
  loadTranslation: () => Promise<string | null>;
  createAudio?: (src: string) => HTMLAudioElement;
};

type Phase = "idle" | "running" | "finished";

const FADE_TICK_MS = 100;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function MeditationSession({
  loadPhoto,
  loadTranslation,
  createAudio = (src) => new Audio(src),
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [trackId, setTrackId] = useState(DEFAULT_TRACK_ID);
  // undefined: still loading, null: no usable photo today
  const [photo, setPhoto] = useState<PhotoView | null | undefined>(undefined);
  const [translation, setTranslation] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch the photo and its translation ahead of the start click.
  useEffect(() => {
    let cancelled = false;
    loadPhoto()
      .catch(() => null)
      .then((loaded) => {
        if (cancelled) return;
        setPhoto(loaded);
        if (!loaded) return;
        return loadTranslation()
          .catch(() => null)
          .then((text) => {
            if (!cancelled) setTranslation(text);
          });
      });
    return () => {
      cancelled = true;
    };
  }, [loadPhoto, loadTranslation]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (fadeRef.current) clearInterval(fadeRef.current);
    timerRef.current = null;
    fadeRef.current = null;
  }, []);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  useEffect(
    () => () => {
      clearTimers();
      stopAudio();
    },
    [clearTimers, stopAudio],
  );

  function fadeOutAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    const step = FADE_TICK_MS / FADE_OUT_MS;
    const lower = () => {
      audio.volume = Math.max(0, audio.volume - step);
      if (audio.volume <= 0) {
        if (fadeRef.current) clearInterval(fadeRef.current);
        fadeRef.current = null;
        stopAudio();
      }
    };
    lower();
    fadeRef.current = setInterval(lower, FADE_TICK_MS);
  }

  function start() {
    const track = TRACKS.find((t) => t.id === trackId) ?? TRACKS[0];
    const audio = createAudio(track.src);
    audio.loop = true;
    audio.volume = 1;
    audio.play().catch(() => {});
    audioRef.current = audio;

    const startedAt = Date.now();
    setElapsed(0);
    setPhase("running");
    timerRef.current = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      if (seconds >= SESSION_SECONDS) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setElapsed(SESSION_SECONDS);
        setPhase("finished");
        fadeOutAudio();
        return;
      }
      setElapsed(seconds);
    }, 250);
  }

  function endEarly() {
    clearTimers();
    stopAudio();
    setElapsed(0);
    setPhase("idle");
  }

  if (phase === "idle") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-24">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              아침 명상
            </h1>
            <p className="text-muted-foreground">
              오늘의 우주 사진과 음악으로 5분 동안 몸과 마음을 비워 보세요.
            </p>
          </div>
          <div role="radiogroup" aria-label="음악 선택" className="flex flex-col gap-2">
            {TRACKS.map((track) => {
              const selected = track.id === trackId;
              return (
                <Button
                  key={track.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  variant={selected ? "default" : "outline"}
                  size="lg"
                  className="justify-start"
                  onClick={() => setTrackId(track.id)}
                >
                  {track.title}
                  <span className="text-xs opacity-70">{track.composer}</span>
                </Button>
              );
            })}
          </div>
          <Button type="button" size="lg" onClick={start}>
            명상 시작
          </Button>
        </div>
      </main>
    );
  }

  const remaining = SESSION_SECONDS - elapsed;
  const phrase =
    phase === "finished"
      ? FINISH_PHRASE
      : PHRASES[Math.floor(elapsed / PHRASE_INTERVAL_SECONDS) % PHRASES.length];

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-black text-white">
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.url}
          alt={photo.title}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative flex flex-1 flex-col justify-between gap-6 p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <div role="timer" className="font-mono text-2xl tabular-nums">
            {formatTime(remaining)}
          </div>
          <Button type="button" variant="outline" className="bg-black/30 text-white" onClick={endEarly}>
            명상 끝내기
          </Button>
        </div>

        <p className="mx-auto max-w-2xl text-center font-heading text-2xl leading-relaxed text-balance sm:text-3xl">
          {phrase}
        </p>

        <section className="mx-auto flex max-h-[40vh] w-full max-w-2xl flex-col gap-2 overflow-y-auto text-sm leading-relaxed">
          {photo === undefined && <p>사진을 불러오는 중입니다.</p>}
          {photo && (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h2 className="text-base font-semibold">{photo.title}</h2>
                <time>{photo.date}</time>
              </div>
              <p className="text-white/70">
                출처: NASA 이미지 라이브러리 · {photo.id}
              </p>
              {photo.explanation && <p>{photo.explanation}</p>}
              {translation && <p>{translation}</p>}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
