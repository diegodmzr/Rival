"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { LinkTasksControl } from "./LinkTasksControl";
import { stopTimerAndSave } from "@/lib/actions/timer";
import { todayISO } from "@/lib/date";

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  elapsedHours: number;
  onSaved?: () => void;
}

export function StopTimerDialog({
  open,
  onClose,
  projectId,
  elapsedHours,
  onSaved,
}: Props) {
  const [note, setNote] = useState("");
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setNote("");
      setTaskIds([]);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await stopTimerAndSave(todayISO(), note, taskIds);
      if (!res.ok) {
        setError(res.error ?? "Erreur");
        return;
      }
      onSaved?.();
      onClose();
    });
  };

  const hoursLabel = elapsedHours.toFixed(2);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-surface border border-border p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[14px] text-text font-medium">
              Arrêter et enregistrer
            </div>
            <div className="text-[11px] text-text-3 mt-0.5 font-mono">
              {hoursLabel}h
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={pending}
            className="text-text-3 hover:text-text"
            aria-label="Fermer"
          >
            <X size={14} strokeWidth={1.3} />
          </button>
        </div>

        <div className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optionnel)"
            rows={2}
            className="w-full bg-bg border border-border rounded px-3 py-2 text-[12px] text-text placeholder:text-text-3 resize-none focus:outline-none focus:border-text-3"
            autoFocus
          />

          <LinkTasksControl
            projectId={projectId}
            value={taskIds}
            onChange={setTaskIds}
          />

          {error && <div className="text-[11px] text-red-400">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={pending}
            className="px-3 py-1.5 text-[12px] text-text-3 hover:text-text"
          >
            Annuler
          </button>
          <button
            onClick={confirm}
            disabled={pending}
            className="px-3 py-1.5 rounded bg-text text-bg text-[12px] disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
