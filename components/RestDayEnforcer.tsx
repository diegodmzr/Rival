"use client";

import { useEffect, useRef } from "react";
import { useStore, selectCurrentUser } from "@/lib/store";
import { todayISO } from "@/lib/date";
import { stopTimerAndSave } from "@/lib/actions/timer";

// Auto-stops the timer when the user crosses their rest-day cap.
// Relies on zustand for reactivity — reacts to both existing-entry
// changes and to the timer elapsed time as it grows.
export function RestDayEnforcer() {
  const me = useStore(selectCurrentUser);
  const entries = useStore((s) => s.entries);
  const timer = useStore((s) => s.timer);
  const localPause = useStore((s) => s.pauseTimer);
  const localReset = useStore((s) => s.resetTimer);
  const stoppingRef = useRef(false);

  useEffect(() => {
    if (!me) return;
    const weekday = me.restDayWeekday;
    if (weekday === null || weekday === undefined) return;
    const today = todayISO();
    // Only enforce when today is the rest day.
    const todayWeekday = new Date().getDay();
    if (todayWeekday !== weekday) return;

    const max = Number(me.restDayMaxHours ?? 0);
    if (max <= 0) return;

    const loggedToday = entries
      .filter((e) => e.userId === me.id && e.date === today)
      .reduce((s, e) => s + e.hours, 0);

    const remainingHours = Math.max(0, max - loggedToday);

    if (!timer.running) return;
    const startedAt = timer.startedAt
      ? new Date(timer.startedAt).getTime()
      : null;
    const base = timer.elapsedBase;

    // Returns seconds of elapsed running time right now.
    const elapsedSec = () => {
      const liveDelta = startedAt ? (Date.now() - startedAt) / 1000 : 0;
      return Math.max(0, base + liveDelta);
    };

    const remainingSec = remainingHours * 3600 - elapsedSec();

    const stop = () => {
      if (stoppingRef.current) return;
      stoppingRef.current = true;
      localPause();
      localReset();
      stopTimerAndSave(today).finally(() => {
        stoppingRef.current = false;
      });
    };

    if (remainingSec <= 0) {
      stop();
      return;
    }

    const timeout = setTimeout(stop, remainingSec * 1000);
    return () => clearTimeout(timeout);
  }, [me, entries, timer.running, timer.startedAt, timer.elapsedBase, localPause, localReset]);

  return null;
}
