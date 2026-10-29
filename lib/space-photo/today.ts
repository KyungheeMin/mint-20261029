import { createKoreanTranslator } from "@/lib/translate/korean";

import { fetchPhotoFor, type SpacePhoto } from "./library";

const translate = createKoreanTranslator();
// Holds in-flight and finished lookups so concurrent calls share one request.
const photos = new Map<string, Promise<SpacePhoto | null>>();

// The same date always yields the same photo, so a successful lookup is kept.
export async function getPhotoFor(date: string): Promise<SpacePhoto | null> {
  let pending = photos.get(date);
  if (!pending) {
    pending = fetchPhotoFor(date);
    photos.set(date, pending);
  }

  const photo = await pending;
  if (!photo && photos.get(date) === pending) photos.delete(date);
  return photo;
}

export async function getTranslationFor(date: string): Promise<string | null> {
  const photo = await getPhotoFor(date);
  if (!photo?.explanation) return null;
  return translate(date, photo.explanation);
}
