"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { parseISODate, todayISO } from "@/lib/date";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export interface UpdateProfileInput {
  name?: string;
  initials?: string;
  weeklyGoal?: number;
  monthlyGoal?: number;
}

export interface UpdateRestDayInput {
  weekday: number | null; // 0 = Sunday … 6 = Saturday, null to disable
  maxHours: number;
}

export async function updateRestDay(
  patch: UpdateRestDayInput,
): Promise<{ ok: boolean; error?: string }> {
  if (patch.weekday !== null && (patch.weekday < 0 || patch.weekday > 6)) {
    return { ok: false, error: "Jour invalide." };
  }
  if (!Number.isFinite(patch.maxHours) || patch.maxHours < 0) {
    return { ok: false, error: "Nombre d'heures invalide." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const { data: me } = await supabase
    .from("users")
    .select("rest_day_weekday")
    .eq("id", user.id)
    .maybeSingle();

  // If today is already a rest day, lock the settings — no rationalizing.
  const todayWeekday = parseISODate(todayISO()).getDay();
  if (
    me?.rest_day_weekday !== null &&
    me?.rest_day_weekday !== undefined &&
    todayWeekday === me.rest_day_weekday
  ) {
    return {
      ok: false,
      error: "Impossible de changer ton jour de repos aujourd'hui.",
    };
  }

  const { error } = await supabase
    .from("users")
    .update({
      rest_day_weekday: patch.weekday,
      rest_day_max_hours: patch.weekday === null ? 0 : patch.maxHours,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
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

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_AVATAR_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export async function uploadAvatar(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; url?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Fichier manquant." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Image trop lourde (max 5 Mo)." };
  }
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return { ok: false, error: "Format non supporté (PNG, JPG, WebP, GIF)." };
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = pub.publicUrl;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: url })
    .eq("id", user.id);
  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath("/", "layout");
  return { ok: true, url };
}

export async function removeAvatar(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const { error } = await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("id", user.id);
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
