import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { signOut, updateDisplayName } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", claims.sub)
    .single();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">설정</h1>
          <p className="text-sm text-muted-foreground">{claims.email}</p>
        </div>
        <form action={updateDisplayName} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            표시 이름
            <input
              name="display_name"
              defaultValue={profile?.display_name ?? ""}
              maxLength={50}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <Button type="submit">저장</Button>
        </form>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="w-full">
            로그아웃
          </Button>
        </form>
      </div>
    </main>
  );
}
