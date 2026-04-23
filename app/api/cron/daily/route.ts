import { NextResponse } from "next/server";
import { notifyRecapReminder, notifyStaleTimers } from "@/lib/push/dispatch";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const results: Record<string, unknown> = {};
  try {
    await notifyRecapReminder();
    results.recap = "ok";
  } catch (err) {
    results.recap = (err as Error).message;
  }
  try {
    await notifyStaleTimers();
    results.staleTimer = "ok";
  } catch (err) {
    results.staleTimer = (err as Error).message;
  }
  return NextResponse.json({ ok: true, results });
}
