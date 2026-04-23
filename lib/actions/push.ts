"use server";

import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";

export interface SubscribePushInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

export async function subscribePush(
  input: SubscribePushInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent ?? null,
    },
    { onConflict: "endpoint" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function unsubscribePush(
  endpoint: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function sendTestPush(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  try {
    const res = await sendPushToUser(user.id, {
      title: "Rival",
      body: "Notifications activées ✓",
      url: "/",
      tag: "test",
    });
    if (res.sent === 0) {
      return { ok: false, error: "Aucun appareil abonné." };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
