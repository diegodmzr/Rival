"use client";

import { useEffect, useState, useTransition } from "react";
import { Moon } from "lucide-react";
import { useStore, selectCurrentUser } from "@/lib/store";
import { updateRestDay } from "@/lib/actions/user";

const WEEKDAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

export function RestDaySettings() {
  const me = useStore(selectCurrentUser);

  const [weekday, setWeekday] = useState<number | null>(
    me?.restDayWeekday ?? null,
  );
  const [maxHours, setMaxHours] = useState<number>(me?.restDayMaxHours || 3);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!me) return;
    setWeekday(me.restDayWeekday);
    setMaxHours(me.restDayMaxHours || 3);
  }, [me?.id, me?.restDayWeekday, me?.restDayMaxHours, me]);

  if (!me) return null;

  const todayWeekday = new Date().getDay();
  const lockedToday =
    me.restDayWeekday !== null && me.restDayWeekday === todayWeekday;

  const dirty =
    weekday !== me.restDayWeekday ||
    (weekday !== null && maxHours !== me.restDayMaxHours);

  const save = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await updateRestDay({
        weekday,
        maxHours: weekday === null ? 0 : maxHours,
      });
      if (!res.ok) {
        setError(res.error ?? "Erreur.");
      } else {
        setMessage("Enregistré.");
        setTimeout(() => setMessage(null), 2500);
      }
    });
  };

  return (
    <section className="bg-surface border border-border rounded-md px-[18px] py-4 mb-[14px]">
      <div className="flex items-center gap-2 mb-1">
        <Moon size={14} strokeWidth={1.3} className="text-text-2" />
        <div className="text-[13px] text-text font-medium">Jour de repos</div>
      </div>
      <div className="text-[11.5px] text-text-3 mb-3 leading-[1.5]">
        Un jour / semaine où ton travail est plafonné. Une fois le jour entamé,
        tu peux plus changer le jour ni le quota — c'est voulu.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-[6px]">
          <span className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono">
            Jour
          </span>
          <select
            value={weekday === null ? "" : String(weekday)}
            disabled={lockedToday || pending}
            onChange={(e) => {
              const v = e.target.value;
              setWeekday(v === "" ? null : Number(v));
            }}
            className="px-3 py-[9px] rounded-[5px] bg-surface2 border border-border text-[13px] text-text outline-none focus:border-border-strong disabled:opacity-40"
          >
            <option value="">Aucun</option>
            {WEEKDAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[6px]">
          <span className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono">
            Heures max
          </span>
          <input
            type="number"
            min={0}
            step={0.25}
            value={maxHours}
            disabled={weekday === null || lockedToday || pending}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              setMaxHours(Number.isFinite(n) ? n : 0);
            }}
            className="px-3 py-[9px] rounded-[5px] bg-surface2 border border-border text-[13px] text-text outline-none font-mono focus:border-border-strong disabled:opacity-40"
          />
        </label>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          disabled={!dirty || lockedToday || pending}
          onClick={save}
          className="px-4 py-2 rounded-[5px] bg-text text-[#050505] text-[12px] font-medium border-0 cursor-pointer disabled:opacity-40"
        >
          {pending ? "…" : "Enregistrer"}
        </button>
        {lockedToday && (
          <span className="text-[11px] text-text-3">
            Aujourd'hui c'est ton jour de repos — verrouillé.
          </span>
        )}
        {message && <span className="text-[11.5px] text-text-2">{message}</span>}
        {error && <span className="text-[11.5px] text-text-3">{error}</span>}
      </div>
    </section>
  );
}
