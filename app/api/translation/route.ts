import { getTranslationFor } from "@/lib/space-photo/today";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!DATE.test(date)) return Response.json({ text: null }, { status: 400 });

  return Response.json({ text: await getTranslationFor(date) });
}
