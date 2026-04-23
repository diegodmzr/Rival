import "server-only";

import { sendPushToUser } from "./send";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmt } from "@/lib/format";
import { todayISO, daysAgoISO } from "@/lib/date";

// Fire-and-forget wrapper so callers don't need to await. Errors are logged
// but never propagated — a push failure shouldn't break the main action.
function fireAndForget(promise: Promise<unknown>) {
  promise.catch((err) => console.error("push dispatch failed", err));
}

// Triggered after a user adds a time entry. Notifies the other user.
// If the new entry pushes the current user past the rival on the week
// total, swaps the message to an "overtake" flavour.
export async function notifyEntryAdded(params: {
  actorUserId: string;
  projectName: string;
  hours: number;
  date: string;
}) {
  fireAndForget(
    (async () => {
      const admin = createAdminClient();
      const { data: team } = await admin.from("users").select("id, name");
      if (!team) return;
      const actor = team.find((u) => u.id === params.actorUserId);
      const others = team.filter((u) => u.id !== params.actorUserId);
      if (!actor || others.length === 0) return;

      const weekStart = weekStartISO();
      const { data: weekEntries } = await admin
        .from("time_entries")
        .select("user_id, hours")
        .gte("date", weekStart);
      const weekByUser = new Map<string, number>();
      for (const e of weekEntries ?? []) {
        weekByUser.set(
          e.user_id,
          (weekByUser.get(e.user_id) ?? 0) + Number(e.hours),
        );
      }
      const actorWeek = weekByUser.get(actor.id) ?? 0;

      for (const other of others) {
        const otherWeek = weekByUser.get(other.id) ?? 0;
        const overtook =
          actorWeek > otherWeek &&
          actorWeek - Number(params.hours) <= otherWeek;
        const title = overtook
          ? `${actor.name} vient de te dépasser`
          : `${actor.name} a loggué ${fmt(params.hours)}`;
        const body = overtook
          ? `Semaine : ${fmt(actorWeek)} vs ${fmt(otherWeek)}.`
          : `${params.projectName} · ${fmt(params.hours)}`;

        await sendPushToUser(other.id, {
          title,
          body,
          url: "/history",
          tag: "entry-added",
        });
      }
    })(),
  );
}

// Cron trigger, run in the evening: reminds each user who hasn't filled
// today's recap yet.
export async function notifyRecapReminder() {
  const admin = createAdminClient();
  const today = todayISO();
  const { data: users } = await admin.from("users").select("id, name");
  if (!users) return;
  const { data: recaps } = await admin
    .from("day_recaps")
    .select("user_id, note")
    .eq("date", today);
  const filled = new Set(
    (recaps ?? [])
      .filter((r) => (r.note ?? "").trim().length > 0)
      .map((r) => r.user_id),
  );

  await Promise.all(
    users
      .filter((u) => !filled.has(u.id))
      .map((u) =>
        sendPushToUser(u.id, {
          title: "Ton récap du jour",
          body: "Qu'as-tu fait aujourd'hui ? Une ligne suffit.",
          url: "/recap",
          tag: "recap-reminder",
        }),
      ),
  );
}

// Cron trigger, run periodically: nudges users whose timer has been
// running for more than 3 hours without a pause.
export async function notifyStaleTimers() {
  const admin = createAdminClient();
  const threshold = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const { data: timers } = await admin
    .from("active_timers")
    .select("user_id, started_at")
    .not("started_at", "is", null)
    .lt("started_at", threshold);
  if (!timers || timers.length === 0) return;

  await Promise.all(
    timers.map((t) => {
      if (!t.started_at) return null;
      const hours = (Date.now() - new Date(t.started_at).getTime()) / 3600_000;
      return sendPushToUser(t.user_id, {
        title: "Ton chrono tourne toujours",
        body: `${hours.toFixed(1)}h depuis le démarrage — pense à l'arrêter.`,
        url: "/",
        tag: "stale-timer",
      });
    }),
  );
}

function weekStartISO() {
  // ISO week: Monday as day 0.
  const dayIdx = (new Date().getDay() + 6) % 7;
  return daysAgoISO(dayIdx);
}
