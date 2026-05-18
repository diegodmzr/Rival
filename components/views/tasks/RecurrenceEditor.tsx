"use client";

import { Repeat } from "lucide-react";
import { WEEKDAY_LABELS, describeRecurrence } from "@/lib/recurrence";
import type {
  RecurrenceEnd,
  RecurrenceFreq,
  RecurrenceRule,
} from "@/lib/types";

interface Props {
  value: RecurrenceRule | null;
  onChange: (next: RecurrenceRule | null) => void;
  previewDates: string[];
}

const FREQS: { v: RecurrenceFreq; label: string }[] = [
  { v: "daily", label: "Jour" },
  { v: "weekly", label: "Semaine" },
  { v: "monthly", label: "Mois" },
  { v: "yearly", label: "Année" },
];

const FIELD =
  "bg-bg border border-border rounded-md px-2.5 py-1.5 text-[12px] text-text focus:outline-none focus:border-text-3";
const LABEL = "text-[10.5px] text-text-3 uppercase tracking-wide font-mono";

const DEFAULT_RULE: RecurrenceRule = {
  freq: "weekly",
  interval: 1,
  weekdays: [0],
  end: { type: "never" },
};

export function RecurrenceEditor({ value, onChange, previewDates }: Props) {
  const enabled = !!value;

  const toggle = () => {
    if (enabled) onChange(null);
    else onChange(DEFAULT_RULE);
  };

  if (!enabled) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-[12px] border border-border hover:border-text-3 bg-bg/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-left">
          <Repeat size={13} strokeWidth={1.5} className="text-text-3" />
          <span className="flex flex-col">
            <span className="text-text-2">Récurrence</span>
            <span className="text-[10.5px] text-text-3">
              Répéter cette tâche automatiquement
            </span>
          </span>
        </span>
        <span className="inline-block h-4 w-7 rounded-full border border-border bg-bg relative shrink-0">
          <span className="absolute top-[1px] left-[1px] h-3 w-3 rounded-full bg-text-3" />
        </span>
      </button>
    );
  }

  const rule = value as RecurrenceRule;
  const patch = (p: Partial<RecurrenceRule>) => onChange({ ...rule, ...p });
  const setEnd = (end: RecurrenceEnd) => patch({ end });

  const toggleWeekday = (w: number) => {
    const cur = rule.weekdays ?? [];
    const next = cur.includes(w) ? cur.filter((x) => x !== w) : [...cur, w];
    patch({ weekdays: next.sort((a, b) => a - b) });
  };

  return (
    <div className="border border-border rounded-md bg-bg/30 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[12px] text-text">
          <Repeat size={12} strokeWidth={1.5} />
          Récurrence
        </span>
        <button
          type="button"
          onClick={toggle}
          className="inline-block h-4 w-7 rounded-full border bg-text border-text relative shrink-0"
          aria-label="Désactiver la récurrence"
        >
          <span className="absolute top-[1px] left-[13px] h-3 w-3 rounded-full bg-bg" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11.5px] text-text-2">Tous les</span>
        <input
          type="number"
          min={1}
          max={99}
          value={rule.interval}
          onChange={(e) =>
            patch({ interval: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })
          }
          className={`${FIELD} w-14 font-mono text-center`}
        />
        <select
          value={rule.freq}
          onChange={(e) => {
            const nf = e.target.value as RecurrenceFreq;
            patch({
              freq: nf,
              weekdays: nf === "weekly" ? rule.weekdays ?? [0] : undefined,
            });
          }}
          className={`${FIELD} flex-1`}
        >
          {FREQS.map((f) => (
            <option key={f.v} value={f.v}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {rule.freq === "weekly" && (
        <div className="space-y-1.5">
          <div className={LABEL}>Jours</div>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((lbl, i) => {
              const active = (rule.weekdays ?? []).includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleWeekday(i)}
                  className={`h-8 rounded-md text-[11px] border transition-colors ${
                    active
                      ? "border-text-2 text-text bg-bg"
                      : "border-border text-text-3 hover:text-text-2 hover:border-text-3"
                  }`}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <div className={LABEL}>Fin</div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setEnd({ type: "never" })}
            className={`px-2 py-1.5 rounded-md text-[11px] border transition-colors ${
              rule.end.type === "never"
                ? "border-text-2 text-text bg-bg"
                : "border-border text-text-3 hover:text-text-2 hover:border-text-3"
            }`}
          >
            Jamais
          </button>
          <button
            type="button"
            onClick={() =>
              setEnd(
                rule.end.type === "count"
                  ? rule.end
                  : { type: "count", count: 10 },
              )
            }
            className={`px-2 py-1.5 rounded-md text-[11px] border transition-colors ${
              rule.end.type === "count"
                ? "border-text-2 text-text bg-bg"
                : "border-border text-text-3 hover:text-text-2 hover:border-text-3"
            }`}
          >
            Après N fois
          </button>
          <button
            type="button"
            onClick={() =>
              setEnd(
                rule.end.type === "until"
                  ? rule.end
                  : { type: "until", date: "" },
              )
            }
            className={`px-2 py-1.5 rounded-md text-[11px] border transition-colors ${
              rule.end.type === "until"
                ? "border-text-2 text-text bg-bg"
                : "border-border text-text-3 hover:text-text-2 hover:border-text-3"
            }`}
          >
            Jusqu'au
          </button>
        </div>

        {rule.end.type === "count" && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="number"
              min={1}
              max={100}
              value={rule.end.count}
              onChange={(e) =>
                setEnd({
                  type: "count",
                  count: Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                })
              }
              className={`${FIELD} w-20 font-mono text-center`}
            />
            <span className="text-[11px] text-text-3">occurrences</span>
          </div>
        )}
        {rule.end.type === "until" && (
          <input
            type="date"
            value={rule.end.date}
            onChange={(e) => setEnd({ type: "until", date: e.target.value })}
            className={`${FIELD} w-full mt-1`}
          />
        )}
      </div>

      {previewDates.length > 0 && (
        <div className="text-[10.5px] text-text-3 font-mono pt-1 border-t border-border">
          Aperçu : {previewDates.join(" · ")}
          {previewDates.length >= 4 && " …"}
        </div>
      )}

      <div className="text-[10.5px] text-text-3 italic">
        {describeRecurrence(rule)}
      </div>
    </div>
  );
}
