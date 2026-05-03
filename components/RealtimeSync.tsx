"use client";

import { useEffect } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { useStore } from "@/lib/store";
import {
  mapEntryRow,
  mapProjectRow,
  mapRecapRow,
  mapResourceRow,
  mapResourceViewRow,
  mapTimerRow,
  mapUserRow,
  type EntryRow,
  type ProjectRow,
  type RecapRow,
  type ResourceRow,
  type ResourceViewRow,
  type TimerRow,
  type UserRow,
} from "@/lib/mappers";

export function RealtimeSync({ userId }: { userId: string }) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let cancelled = false;

    const onTimer = (payload: RealtimePostgresChangesPayload<TimerRow>) => {
      if (payload.eventType === "DELETE") {
        useStore.getState().applyTimer(null);
        return;
      }
      const row = payload.new as TimerRow | undefined;
      if (!row) return;
      useStore.getState().applyTimer(mapTimerRow(row));
    };

    const onEntry = (payload: RealtimePostgresChangesPayload<EntryRow>) => {
      if (payload.eventType === "DELETE") {
        const id = (payload.old as { id?: string } | undefined)?.id;
        if (id) useStore.getState().removeEntry(id);
        return;
      }
      const row = payload.new as EntryRow | undefined;
      if (!row) return;
      useStore.getState().upsertEntry(mapEntryRow(row));
    };

    const onProject = (payload: RealtimePostgresChangesPayload<ProjectRow>) => {
      if (payload.eventType === "DELETE") {
        const id = (payload.old as { id?: string } | undefined)?.id;
        if (id) useStore.getState().removeProject(id);
        return;
      }
      const row = payload.new as ProjectRow | undefined;
      if (!row) return;
      useStore.getState().upsertProject(mapProjectRow(row));
    };

    const onUser = (payload: RealtimePostgresChangesPayload<UserRow>) => {
      if (payload.eventType === "DELETE") return;
      const row = payload.new as UserRow | undefined;
      if (!row) return;
      useStore.getState().upsertUser(mapUserRow(row));
    };

    const onRecap = (payload: RealtimePostgresChangesPayload<RecapRow>) => {
      if (payload.eventType === "DELETE") {
        const id = (payload.old as { id?: string } | undefined)?.id;
        if (id) useStore.getState().removeRecap(id);
        return;
      }
      const row = payload.new as RecapRow | undefined;
      if (!row) return;
      useStore.getState().upsertRecap(mapRecapRow(row));
    };

    const onResource = (payload: RealtimePostgresChangesPayload<ResourceRow>) => {
      if (payload.eventType === "DELETE") {
        const id = (payload.old as { id?: string } | undefined)?.id;
        if (id) useStore.getState().removeResource(id);
        return;
      }
      const row = payload.new as ResourceRow | undefined;
      if (!row) return;
      useStore.getState().upsertResource(mapResourceRow(row));
    };

    const onResourceView = (
      payload: RealtimePostgresChangesPayload<ResourceViewRow>,
    ) => {
      if (payload.eventType === "DELETE") {
        const old = payload.old as
          | { resource_id?: string; user_id?: string }
          | undefined;
        if (old?.resource_id && old.user_id) {
          useStore.getState().removeResourceView(old.resource_id, old.user_id);
        }
        return;
      }
      const row = payload.new as ResourceViewRow | undefined;
      if (!row) return;
      useStore.getState().upsertResourceView(mapResourceViewRow(row));
    };

    const channel = supabase
      .channel(`app-sync:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "active_timers",
          filter: `user_id=eq.${userId}`,
        },
        onTimer,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_entries" },
        onEntry,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        onProject,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        onUser,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "day_recaps" },
        onRecap,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resources" },
        onResource,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resource_views" },
        onResourceView,
      );

    // Make sure the realtime connection carries the user's JWT so RLS-filtered
    // events (notably active_timers) are actually delivered.
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session?.access_token) {
        await supabase.realtime.setAuth(data.session.access_token);
      }
      if (cancelled) return;
      channel.subscribe();
    })();

    // Mobile browsers can suspend websockets when the tab is backgrounded,
    // so refetch the timer state when the user comes back.
    const onVisible = async () => {
      if (typeof document === "undefined" || document.visibilityState !== "visible") {
        return;
      }
      const { data } = await supabase
        .from("active_timers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      useStore.getState().applyTimer(data ? mapTimerRow(data) : null);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  return null;
}
