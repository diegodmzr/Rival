import "server-only";

import { sendPushToUser } from "./send";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmt } from "@/lib/format";
import { todayISO, daysAgoISO } from "@/lib/date";

const MILESTONES = [5, 10, 15] as const;
type Milestone = (typeof MILESTONES)[number];

const MILESTONE_MESSAGES: Record<Milestone, { title: string; body: string }[]> = {
  5: [
    { title: "5h. T'appelles ça une journée ?", body: "Moi non." },
    { title: "5h. Joli échauffement.", body: "Maintenant joue la vraie partie." },
    { title: "5h. T'as assez pour pas être nul.", body: "Pas assez pour être grand." },
    { title: "5h. Les médiocres sont déjà partis.", body: "Reste, ou tu seras l'un d'eux." },
    { title: "5h. Continue.", body: "Ou reste la merde que t'étais ce matin." },
    { title: "5h. Ceux que tu veux écraser bossent encore.", body: "Toi aussi." },
    { title: "5h.", body: "La journée n'a pas encore vraiment commencé." },
    { title: "5h. Le 1% n'envisage pas de pause.", body: "Toi non plus." },
    { title: "5h. T'es pas employé, t'es fondateur.", body: "Comporte-toi comme tel." },
    { title: "5h.", body: "Si tu lâches maintenant, t'es juste un participant." },
    { title: "5h. La médiocrité aime le café à cette heure.", body: "Résiste." },
    { title: "5h. T'es pas payé pour en faire 5.", body: "T'es payé pour faire la différence." },
  ],
  10: [
    { title: "10h. Bon, là c'est sérieux.", body: "Tu peux t'arrêter. Mais t'en as vraiment envie ?" },
    { title: "10h. Les autres rentrent chez eux.", body: "Toi, t'as encore du jus ou pas ?" },
    { title: "10h.", body: "Tu mérites une pause. Ou juste continuer. Au choix." },
    { title: "10h. C'est le moment où 90% des gens lâchent.", body: "Tu lâches aussi ?" },
    { title: "10h.", body: "C'est à partir d'ici que les vies divergent." },
    { title: "10h.", body: "Chaque heure en plus à partir d'ici, c'est du pur avantage." },
    { title: "10h. Journée pleine.", body: "Mais les journées pleines font pas les grands projets." },
    { title: "10h. Le 1% travaille en silence.", body: "Ils n'ont pas encore fini. Toi non plus." },
    { title: "10h. T'as dépassé 95% des gens.", body: "Encore deux heures et tu parles au 1%." },
    { title: "10h. La fatigue est un signal.", body: "Pas un stop." },
    { title: "10h. Les amateurs comptent leurs heures.", body: "Les pros comptent leurs résultats." },
    { title: "10h.", body: "T'as franchi la ligne entre « j'essaye » et « je fais »." },
  ],
  15: [
    { title: "15h. T'as gagné la journée.", body: "Dors fier." },
    { title: "15h. Bienvenue dans le 1%.", body: "Le vrai, pas celui d'Instagram." },
    { title: "15h.", body: "Les gens qui disent « c'est impossible », ils sont pas chez toi." },
    { title: "15h dans les jambes.", body: "Tu viens d'écrire une ligne dans ton histoire." },
    { title: "15h. T'as plus de concurrents.", body: "T'as juste des spectateurs." },
    { title: "15h. T'es un monstre de productivité.", body: "Assume." },
    { title: "15h. Les gens comme toi, on les cite.", body: "Les autres, on les oublie." },
    { title: "15h.", body: "Aujourd'hui t'as fait plus qu'un mois d'un mec normal." },
    { title: "15h. Ça, les autres appellent ça « impossible ».", body: "Toi, tu appelles ça mardi." },
    { title: "15h. Tu viens d'écraser ta concurrence.", body: "Sans même la regarder." },
    { title: "15h. Les champions ne se comparent pas.", body: "Ils définissent le standard." },
    { title: "15h. Tu fais partie des 0,1%.", body: "La mesure humaine ne s'applique plus." },
  ],
};

function pickMilestoneMessage(m: Milestone) {
  const arr = MILESTONE_MESSAGES[m];
  return arr[Math.floor(Math.random() * arr.length)];
}

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

// Triggered after a user adds an entry dated today. Fires a pep-talk
// notif to the user themselves if their day total just crossed a
// milestone (5h, 10h, 15h). Only the highest crossed tier is sent.
export function notifyDailyMilestone(params: {
  userId: string;
  oldHours: number;
  newHours: number;
}) {
  const crossed = MILESTONES.filter(
    (m) => params.oldHours < m && params.newHours >= m,
  );
  if (crossed.length === 0) return;
  const highest = crossed[crossed.length - 1];
  const msg = pickMilestoneMessage(highest);
  fireAndForget(
    sendPushToUser(params.userId, {
      title: msg.title,
      body: msg.body,
      url: "/",
      tag: `milestone-${highest}-${todayISO()}`,
    }),
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
