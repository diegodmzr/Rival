import type { TaskPriority } from "./types";

export const PRIORITY_FLAG: Record<TaskPriority, string> = {
  low: "text-emerald-400",
  normal: "text-amber-400",
  high: "text-red-400",
};

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-emerald-400",
  normal: "bg-amber-400",
  high: "bg-red-400",
};

export const PRIORITY_BORDER: Record<TaskPriority, string> = {
  low: "border-emerald-400/50",
  normal: "border-amber-400/50",
  high: "border-red-400/60",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
};
