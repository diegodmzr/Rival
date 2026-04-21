export const CATEGORIES = [
  "Code",
  "Design",
  "Marketing",
  "Admin",
  "Réunion",
  "Brainstorming",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const isCategory = (v: string): v is Category =>
  (CATEGORIES as readonly string[]).includes(v);
