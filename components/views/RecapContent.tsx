"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/primitives/Avatar";
import { fmt } from "@/lib/format";
import { formatRelativeDate, todayISO, parseISODate } from "@/lib/date";
import { upsertRecap } from "@/lib/actions/recaps";
import type { DayRecap, TimeEntry } from "@/lib/types";

const MAX_DAYS = 60;

export function RecapContent() {
  const entries = useStore((s) => s.entries);
  const recaps = useStore((s) => s.recaps);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);

  const days = useMemo(() => {
    const dates = new Set<string>();
    dates.add(todayISO());
    for (const e of entries) dates.add(e.date);
    for (const r of recaps) dates.add(r.date);
    return Array.from(dates)
      .sort((a, b) => (a > b ? -1 : 1))
      .slice(0, MAX_DAYS);
  }, [entries, recaps]);

  const team = useMemo(
    () =>
      Object.values(users).sort((a, b) =>
        a.id === currentUserId ? -1 : b.id === currentUserId ? 1 : 0,
      ),
    [users, currentUserId],
  );

  return (
    <div className="p-5 md:p-6">
      <div className="mb-4">
        <div className="text-[18px] md:text-[22px] text-text font-medium tracking-[-0.4px]">
          Recap
        </div>
        <div className="text-[11.5px] text-text-3 mt-[2px]">
          Un petit mot sur ta journée — pour toi et pour l&apos;autre.
        </div>
      </div>

      {days.length === 0 && (
        <div className="bg-surface border border-border rounded-md px-4 py-10 text-center text-[12px] text-text-3">
          Rien pour l&apos;instant.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {days.map((date) => (
          <DayCard
            key={date}
            date={date}
            entries={entries}
            recaps={recaps}
            team={team}
            currentUserId={currentUserId}
          />
        ))}
      </div>
      <div className="h-10" />
    </div>
  );
}

function DayCard({
  date,
  entries,
  recaps,
  team,
  currentUserId,
}: {
  date: string;
  entries: TimeEntry[];
  recaps: DayRecap[];
  team: { id: string; name: string }[];
  currentUserId: string;
}) {
  const parsed = parseISODate(date);
  const longLabel = parsed.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section className="bg-surface border border-border rounded-md">
      <header className="flex items-center justify-between px-4 py-[10px] border-b border-border">
        <div>
          <div className="text-[12.5px] text-text font-medium">
            {formatRelativeDate(date)}
          </div>
          <div className="text-[10.5px] text-text-3 font-mono uppercase tracking-[0.6px]">
            {longLabel}
          </div>
        </div>
      </header>
      <div className="divide-y divide-border">
        {team.map((u) => {
          const userHours = entries
            .filter((e) => e.date === date && e.userId === u.id)
            .reduce((s, e) => s + e.hours, 0);
          const recap = recaps.find(
            (r) => r.userId === u.id && r.date === date,
          );
          return (
            <UserRecapRow
              key={u.id}
              date={date}
              userId={u.id}
              userName={u.name}
              hours={userHours}
              recap={recap}
              editable={u.id === currentUserId}
            />
          );
        })}
      </div>
    </section>
  );
}

function UserRecapRow({
  date,
  userId,
  userName,
  hours,
  recap,
  editable,
}: {
  date: string;
  userId: string;
  userName: string;
  hours: number;
  recap: DayRecap | undefined;
  editable: boolean;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-[10px] mb-2">
        <Avatar userId={userId} size={20} active={editable} />
        <div className="text-[12.5px] text-text">{userName}</div>
        <div className="flex-1" />
        {hours > 0 && (
          <div className="text-[11px] text-text-3 font-mono">{fmt(hours)}</div>
        )}
      </div>
      {editable ? (
        <RecapEditor date={date} initial={recap?.note ?? ""} />
      ) : (
        <RecapDisplay note={recap?.note ?? ""} />
      )}
    </div>
  );
}

function RecapDisplay({ note }: { note: string }) {
  if (!note) {
    return (
      <div className="text-[12px] text-text-4 italic">
        Pas encore de recap.
      </div>
    );
  }
  return (
    <div className="text-[12.5px] text-text-2 leading-[1.55] whitespace-pre-wrap">
      {note}
    </div>
  );
}

function RecapEditor({ date, initial }: { date: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [savedValue, setSavedValue] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const setLocalRecap = useStore((s) => s.setLocalRecap);
  const [, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedStateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the textarea aligned with the server state when realtime pushes a
  // change from another device (but only when there's no pending local edit).
  useEffect(() => {
    setValue((v) => (v === savedValue ? initial : v));
    setSavedValue(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const commit = (next: string) => {
    setStatus("saving");
    startTransition(async () => {
      const res = await upsertRecap(date, next);
      if (res.ok) {
        setSavedValue(next);
        setStatus("saved");
        if (savedStateTimeoutRef.current) {
          clearTimeout(savedStateTimeoutRef.current);
        }
        savedStateTimeoutRef.current = setTimeout(() => setStatus("idle"), 1200);
      } else {
        setStatus("idle");
      }
    });
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setValue(next);
    setLocalRecap(date, next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => commit(next), 700);
  };

  const onBlur = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (value !== savedValue) commit(value);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (savedStateTimeoutRef.current)
        clearTimeout(savedStateTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="Qu'as-tu fait aujourd'hui ?"
        rows={Math.min(10, Math.max(2, value.split("\n").length + 1))}
        className="w-full bg-transparent border-0 outline-none resize-none text-[12.5px] text-text leading-[1.55] placeholder:text-text-4 font-sans"
      />
      <div className="text-[10px] text-text-4 font-mono h-[12px]">
        {status === "saving"
          ? "enregistrement…"
          : status === "saved"
          ? "enregistré"
          : ""}
      </div>
    </div>
  );
}
