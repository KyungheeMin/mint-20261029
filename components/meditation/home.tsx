"use client";

import { MeditationSession, type PhotoView } from "./session";

// The user's own calendar day decides which photo "today" means.
function localDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

async function loadPhoto(): Promise<PhotoView | null> {
  const response = await fetch(`/api/photo?date=${localDate()}`);
  if (!response.ok) return null;
  const body = (await response.json()) as { photo: PhotoView | null };
  return body.photo;
}

async function loadTranslation(): Promise<string | null> {
  const response = await fetch(`/api/translation?date=${localDate()}`);
  if (!response.ok) return null;
  const body = (await response.json()) as { text: string | null };
  return body.text;
}

export function MeditationHome() {
  return (
    <MeditationSession loadPhoto={loadPhoto} loadTranslation={loadTranslation} />
  );
}
