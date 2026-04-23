"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function upsertRecap(
  date: string,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const trimmed = note.trim();

  if (trimmed === "") {
    const { error } = await supabase
      .from("day_recaps")
      .delete()
      .eq("user_id", user.id)
      .eq("date", date);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("day_recaps")
      .upsert(
        { user_id: user.id, date, note: trimmed },
        { onConflict: "user_id,date" },
      );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
