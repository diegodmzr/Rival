"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export interface UpdateProfileInput {
  name?: string;
  initials?: string;
  weeklyGoal?: number;
  monthlyGoal?: number;
}

export async function updateProfile(
  patch: UpdateProfileInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const dbPatch: UserUpdate = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.initials !== undefined) dbPatch.initials = patch.initials.toUpperCase();
  if (patch.weeklyGoal !== undefined) dbPatch.weekly_goal_hours = patch.weeklyGoal;
  if (patch.monthlyGoal !== undefined) dbPatch.monthly_goal_hours = patch.monthlyGoal;

  const { error } = await supabase.from("users").update(dbPatch).eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut(): Promise<never> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
