import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only the auth routes touch Supabase; the meditation screen must work without it.
export const config = {
  matcher: ["/settings/:path*", "/login"],
};
