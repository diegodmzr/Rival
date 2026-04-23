import { fmt } from "./format";

// Dashboard subcopy shown under the greeting. Picks the most biting
// line for the current state. Returns "" when nothing strong applies.
export function dashboardSubcopy(params: {
  todayHours: number;
  meWeek: number;
  rivalWeek: number;
  rivalName: string;
}): string {
  const { todayHours, meWeek, rivalWeek, rivalName } = params;
  if (todayHours === 0) return "Rien au compteur. On commence quand ?";
  if (todayHours >= 5) return "Journée sérieuse en cours. Ne lâche pas.";

  const gap = meWeek - rivalWeek;
  if (gap < -0.25) return `${rivalName} te mène. Accepte ou rattrape.`;
  if (gap > 0.25) return "Tu mènes. Les écarts, ça se creuse.";

  if (todayHours < 2) return "T'es dans le bruit. Passe dans le signal.";
  return "";
}

// Insight banner lead, based on the weekly gap with the rival.
export function insightLead(params: {
  meWeek: number;
  rivalWeek: number;
  rivalName: string;
}): string {
  const { meWeek, rivalWeek, rivalName } = params;
  const diff = meWeek - rivalWeek;
  const gap = Math.abs(diff);
  const g = fmt(gap);

  if (gap < 0.01) return "Égalité. Le premier qui flanche perd.";
  if (diff > 5) return `Tu mets ${g} à ${rivalName}. Creuse plus.`;
  if (diff > 0) return `Tu mènes de ${g}. Ça se joue à rien.`;
  if (diff > -5) return `${rivalName} te prend ${g}. Rattrape.`;
  return `${rivalName} te met ${g}. Réponds.`;
}

// Versus card leader label.
export function versusLabel(params: {
  diff: number;
  rivalName: string;
}): string {
  if (Math.abs(params.diff) < 0.01) return "Coude à coude";
  return params.diff >= 0 ? "Tu domines" : `${params.rivalName} mène`;
}
