import "server-only";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject =
    process.env.VAPID_SUBJECT ?? "mailto:obemstudio@gmail.com";
  if (!publicKey || !privateKey) {
    throw new Error(
      "Missing VAPID keys. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.",
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

// Sends a notification to every registered device of a user.
// Dead subscriptions (404/410) are cleaned up automatically.
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; removed: number }> {
  ensureConfigured();
  const admin = createAdminClient();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);
  if (error || !subs || subs.length === 0) {
    return { sent: 0, removed: 0 };
  }

  const json = JSON.stringify(payload);
  const deadIds: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          json,
          { TTL: 60 * 60 * 12 },
        );
        sent += 1;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          deadIds.push(s.id);
        } else {
          console.error("webpush failed", code, err);
        }
      }
    }),
  );

  if (deadIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", deadIds);
  }

  return { sent, removed: deadIds.length };
}
