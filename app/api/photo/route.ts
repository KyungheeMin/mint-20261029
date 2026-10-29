import { getPhotoFor } from "@/lib/space-photo/today";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!DATE.test(date)) return Response.json({ photo: null }, { status: 400 });

  const photo = await getPhotoFor(date);
  if (!photo) return Response.json({ photo: null }, { status: 503 });
  return Response.json({ photo });
}
