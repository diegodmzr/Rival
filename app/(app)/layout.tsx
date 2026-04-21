import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getDashboardData } from "@/lib/db/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen grid place-items-center bg-bg text-text p-6">
        <div className="max-w-[420px] bg-surface border border-border rounded-md p-5 text-[13px] text-text-2 leading-[1.5]">
          <div className="text-text font-medium mb-1">Supabase non configuré.</div>
          Renseigne{" "}
          <span className="font-mono text-text">NEXT_PUBLIC_SUPABASE_URL</span> et{" "}
          <span className="font-mono text-text">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> dans{" "}
          <span className="font-mono text-text">.env.local</span>, puis redémarre le dev.
        </div>
      </div>
    );
  }

  const data = await getDashboardData();
  if (!data) redirect("/login");

  return <AppShell data={data}>{children}</AppShell>;
}
