export interface ShortcutDef {
  keys: string[];
  description: string;
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutDef[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Actions rapides",
    items: [
      { keys: ["N"], description: "Ajouter des heures" },
      { keys: ["T"], description: "Nouvelle tâche" },
      { keys: ["?"], description: "Afficher les raccourcis" },
      { keys: ["Esc"], description: "Fermer le panneau actif" },
    ],
  },
  {
    title: "Navigation (G puis…)",
    items: [
      { keys: ["G", "D"], description: "Dashboard" },
      { keys: ["G", "T"], description: "Tâches" },
      { keys: ["G", "S"], description: "Statistiques" },
      { keys: ["G", "P"], description: "Projets" },
      { keys: ["G", "H"], description: "Historique" },
      { keys: ["G", "R"], description: "Recap" },
      { keys: ["G", "L"], description: "Ressources" },
      { keys: ["G", ","], description: "Paramètres" },
    ],
  },
  {
    title: "Vue Tâches",
    items: [
      { keys: ["V", "L"], description: "Vue liste" },
      { keys: ["V", "K"], description: "Vue kanban" },
      { keys: ["V", "C"], description: "Vue calendrier" },
      { keys: ["/"], description: "Focus recherche" },
    ],
  },
  {
    title: "Dans un dialogue",
    items: [
      { keys: ["⌘/Ctrl", "↵"], description: "Enregistrer" },
      { keys: ["Esc"], description: "Annuler" },
    ],
  },
];
