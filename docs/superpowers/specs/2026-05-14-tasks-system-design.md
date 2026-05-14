# Système de tâches — Design

**Date** : 2026-05-14
**Statut** : approuvé, prêt pour plan d'implémentation

## Objectif

Ajouter un système de tâches à Rival permettant d'organiser le travail par projet (ou hors projet), avec lien optionnel entre une session de travail (time entry) et une ou plusieurs tâches. Cohérent avec l'esthétique existante (typographie compacte, mono pour chiffres, palette text/text-2/text-3, accent unique) et avec les patterns établis (server actions `lib/actions/*`, store zustand, realtime Supabase, push duo).

## Décisions de cadrage

| Sujet | Décision |
|---|---|
| Portée | Tâches **par projet** + tâches **libres** (sans projet) |
| Visibilité | Projet partagé non-personnel → tâches communes (les 2 modifient). Projet perso ou tâche libre → créateur uniquement |
| Champs | Riche : titre, statut, description, échéance, priorité, assignation, sous-tâches (profondeur 1) |
| Lien session | Plusieurs tâches par session (multi-select au stop-timer et dans l'édition) |
| Emplacement UI | Section dans page projet **+** page globale `/tasks` |
| Vues | Liste / Kanban / Calendrier, disponibles aux deux endroits |
| Calendrier | Toggle semaine/mois, défaut semaine |
| Kanban | Colonnes par statut (à faire / en cours / fait) |
| Dashboard | Carte « Tâches du jour » + ligne aperçu rival dans VersusCard |
| Push | « Rival a terminé une tâche » sur projet partagé |

## 1. Data model

### Migration `supabase/migrations/0012_tasks.sql`

```sql
create table tasks (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references projects(id) on delete cascade,
  parent_task_id  uuid references tasks(id) on delete cascade,
  title           text not null check (length(title) between 1 and 200),
  description     text not null default '',
  status          text not null default 'todo'
                  check (status in ('todo','in_progress','done')),
  priority        text not null default 'normal'
                  check (priority in ('low','normal','high')),
  due_date        date,
  assigned_user_id uuid references auth.users(id) on delete set null,
  created_by      uuid not null references auth.users(id) on delete cascade,
  completed_by    uuid references auth.users(id) on delete set null,
  completed_at    timestamptz,
  position        integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index tasks_project_idx on tasks(project_id);
create index tasks_parent_idx on tasks(parent_task_id);
create index tasks_assigned_idx on tasks(assigned_user_id);
create index tasks_due_idx on tasks(due_date) where status <> 'done';

create table entry_tasks (
  entry_id uuid not null references time_entries(id) on delete cascade,
  task_id  uuid not null references tasks(id) on delete cascade,
  primary key (entry_id, task_id)
);
create index entry_tasks_task_idx on entry_tasks(task_id);

alter table tasks enable row level security;
alter table entry_tasks enable row level security;

-- RLS tasks : tâche libre ou sur projet personnel = créateur uniquement,
-- sinon (projet partagé non-personnel) = tous les users authentifiés.
create policy tasks_select on tasks for select using (
  case
    when project_id is null then created_by = auth.uid()
    else exists (
      select 1 from projects p
      where p.id = tasks.project_id
        and (p.is_personal = false or p.created_by = auth.uid())
    )
  end
);
create policy tasks_insert on tasks for insert with check (
  created_by = auth.uid()
  and (
    project_id is null
    or exists (
      select 1 from projects p
      where p.id = tasks.project_id
        and (p.is_personal = false or p.created_by = auth.uid())
    )
  )
);
create policy tasks_update on tasks for update using (
  case
    when project_id is null then created_by = auth.uid()
    else exists (
      select 1 from projects p
      where p.id = tasks.project_id
        and (p.is_personal = false or p.created_by = auth.uid())
    )
  end
);
create policy tasks_delete on tasks for delete using (
  case
    when project_id is null then created_by = auth.uid()
    else exists (
      select 1 from projects p
      where p.id = tasks.project_id
        and (p.is_personal = false or p.created_by = auth.uid())
    )
  end
);

-- RLS entry_tasks : l'user doit posséder l'entry
create policy entry_tasks_all on entry_tasks for all using (
  exists (select 1 from time_entries e where e.id = entry_tasks.entry_id and e.user_id = auth.uid())
) with check (
  exists (select 1 from time_entries e where e.id = entry_tasks.entry_id and e.user_id = auth.uid())
);

-- Realtime
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table entry_tasks;
```

**Note** : la policy peut nécessiter ajustement selon le schéma exact des `projects` (vérifier `is_personal` vs un autre champ d'ownership lors de l'implémentation).

## 2. Types

`lib/types.ts` :

```ts
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high';

export interface Task {
  id: string;
  projectId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignedUserId: UserId | null;
  createdBy: UserId;
  completedBy: UserId | null;
  completedAt: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}
```

## 3. Server actions — `lib/actions/tasks.ts`

```ts
createTask(input)         // { projectId, parentTaskId?, title, description?, priority?, dueDate?, assignedUserId? }
updateTask(id, patch)
setTaskStatus(id, status) // gère completed_by/completed_at + push si applicable
deleteTask(id)
reorderTasks(scope, orderedIds)
linkEntryTasks(entryId, taskIds) // remplace l'ensemble
```

Règles :
- `parentTaskId` rejeté si le parent a déjà un parent (profondeur 1 max).
- `setTaskStatus('done')` → `completed_by = userId`, `completed_at = now()`. Vers `todo`/`in_progress` → reset à null.
- Trigger push `notifyTaskCompleted` si projet partagé non-personnel et destinataire ≠ acteur.
- `linkEntryTasks` valide que les tâches sont du même projet que l'entry OU `project_id is null` (tâches libres autorisées).
- `stopTimerAndSave(dateISO, note, taskIds?)` étendu : après insert de l'entry, appelle `linkEntryTasks(entryId, taskIds)`.

## 4. Queries — `lib/db/queries.ts`

```ts
loadTasks(supabase, userId)
loadEntryTasksMap(supabase, userId)
```

Appelées au bootstrap du store comme `loadEntries` / `loadResources`.

## 5. Store — `lib/store.ts`

```ts
tasks: Task[]
entryTasks: Record<string, string[]>

addTaskLocal, updateTaskLocal, removeTaskLocal, reorderTasksLocal
setEntryTasksLocal(entryId, taskIds)

// préférence d'affichage (persistée localStorage)
tasksView: 'list' | 'kanban' | 'calendar'
tasksCalendarMode: 'week' | 'month'
```

Sélecteurs :
- `selectTasksForProject(projectId)` — tri : status → priority desc → due_date asc → position asc.
- `selectFreeTasks(userId)` — `project_id is null` créées par userId.
- `selectTodayTasks(userId)` — `due_date = today` OR (`in_progress` AND assigné moi/commune).
- `selectOpenTasksCount(userId, scope)`, `selectCompletedThisWeek(userId)` — pour aperçu rival.
- `selectSubtasks(parentId)`.
- `selectTaskHours(taskId)` — somme `entries.hours` reliées via `entryTasks`.

`RealtimeSync.tsx` étendu pour `tasks` et `entry_tasks`.

## 6. UI — Composants

Structure :

```
components/
  views/
    TasksContent.tsx            # page /tasks
    ProjectDetailContent.tsx    # étendu : section tâches
    tasks/
      TasksSection.tsx          # wrapper switcher + filtres + vue
      TasksViewSwitcher.tsx     # segmented Liste / Kanban / Calendrier
      TasksFilters.tsx          # chips (projet, priorité, assignation, statut, search)
      TasksListView.tsx
      TasksKanbanView.tsx
      TasksCalendarView.tsx     # toggle week/month interne
      TaskRow.tsx               # ligne liste (incl. sous-tâches)
      TaskCard.tsx              # carte kanban
      TaskChip.tsx              # chip calendrier
      TaskDialog.tsx            # création/édition
      LinkTasksControl.tsx      # multi-select utilisé par stop-timer & EditEntryDialog
  desktop/
    TasksTodayCard.tsx          # dashboard
  mobile/
    MobileTasksToday.tsx
```

### 6.1 Vue Liste

Groupée par échéance : `En retard` → `Aujourd'hui` → `Cette semaine` → `Plus tard` → `Sans échéance` → `Terminées` (repliée par défaut).
- Icônes statut : `Circle` / `CircleDashed` / `CheckCircle2` (lucide). Click = cycle.
- Click ligne = `TaskDialog`.
- Point coloré priorité (low text-3, normal text-2, high `text-accent`).
- Sous-tâches indentées avec `↳` 12px text-3.
- Avatar `assignedUserId` à droite si défini.
- Compteur d'heures cumulées en text-3 11px à droite (`Σ entry hours`).
- Drag desktop pour réordonner (`@dnd-kit`). Mobile : menu kebab → flèches.

### 6.2 Vue Kanban

3 colonnes : `À faire` · `En cours` · `Terminées`.
- Header colonne : titre 12px text-2 + compteur mono text-3.
- Card : titre 13px, meta 11px text-3 (projet · ⚑ priorité · 📅 échéance · avatar).
- Sous-tâches non listées, juste un compteur `2/5` sur la parent.
- Drag = `setTaskStatus`. `@dnd-kit/core` à ajouter aux deps.
- Mobile : colonnes en scroll-snap horizontal, drag remplacé par menu long-press « Déplacer vers… ».

### 6.3 Vue Calendrier

Toggle `Semaine` / `Mois`.

**Semaine** :
- 7 colonnes scrollables verticalement.
- Header `Lun 12` … `Dim 18`, jour courant souligné accent.
- Tâches en chips compactes posées sur la colonne de leur `due_date`.
- Click chip = `TaskDialog`. Drag chip vers autre jour = update `due_date`.
- Bouton `+` discret par colonne — crée une tâche avec date pré-remplie.
- Bandeau « En retard » au-dessus de la grille (chips overdue).

**Mois** :
- Grille 7×5/6 inspirée de `Heatmap.tsx`.
- Cellule jour : 3 mini-chips max (10px) + `+N`.
- Click jour = popover/drawer avec les tâches du jour.
- Drag inter-jours = update `due_date`.

Tâches **sans échéance** : rail latéral droit « À planifier » (desktop, repliable) ou section au-dessus (mobile).

### 6.4 Filtres partagés

Chips text-3 11px (style `HistoryContent`) :
- Projet (chip par projet + « Libres »)
- Priorité (low/normal/high)
- Assignation (moi/rival/commune)
- Statut (sauf en kanban — redondant avec colonne)
- Recherche texte (input compact)

### 6.5 Page projet

`ProjectDetailContent` reçoit la `TasksSection` sous le header, au-dessus de l'historique des entrées. Filtre projet masqué (déjà scopé). Défaut = vue Liste. Vue Calendrier dans un conteneur de hauteur limitée (ou lien « Plein écran → » vers `/tasks?project=X&view=calendar`).

### 6.6 Page `/tasks`

Header : titre + `TasksViewSwitcher`.
Sous-header : filtres complets.
Body : vue sélectionnée.

Entrée navigation : sidebar desktop entre `Projets` et `Resources`, icône `CheckSquare`. Mobile bottom-nav à arbitrer pendant le build (selon densité actuelle).

### 6.7 Lien session ↔ tâches

- `LinkTasksControl` : multi-select de chips de tâches *du projet de l'entry* (statut `todo`/`in_progress`, top 8 par défaut + expand) + section repliée « Tâches libres ». Texte d'état vide : « Aucune tâche sur ce projet ».
- Intégré dans :
  - le modal `stopTimerAndSave` (TimerBar desktop + MobileTimerSheet)
  - `EditEntryDialog` (affichage + édition des tâches actuellement liées)

### 6.8 Dashboard

- **`TasksTodayCard`** (desktop) / **`MobileTasksToday`** : 3 lignes max — `in_progress` mienne ou commune, puis `todo` dues aujourd'hui, puis en retard. Click ligne = `TaskDialog`, click icône = cycle. Footer `Voir toutes les tâches →`.
- **`VersusCard` / `MobileVersus`** : ligne discrète text-3 11px :
  > « Rival · 5 tâches en cours · 12 terminées cette semaine »

  Données issues du store (tâches partagées non-personnelles, `completed_at` dans la semaine ISO courante).

## 7. Push — `lib/push/dispatch.ts`

Nouvelle fonction :

```ts
notifyTaskCompleted({ actorUserId, projectName, taskTitle })
```

Déclenchée depuis `setTaskStatus(id, 'done')` quand :
- la tâche est sur un projet non-personnel,
- le destinataire est ≠ acteur et est un user authentifié distinct.

4 variantes de copy aléatoires :
1. « [Rival] a coché *X* sur [Projet]. À toi. »
2. « [Rival] vient de finir *X*. »
3. « Une tâche de moins pour [Rival] : *X*. »
4. « [Rival] avance — *X* faite sur [Projet]. »

## 8. Esthétique / cohérence

- Typographie : titres 13–14px, meta 11px text-3, mono pour compteurs/heures.
- Palette : `text`, `text-2`, `text-3`, `text-accent` existants. Aucune nouvelle couleur.
- Icônes : lucide existantes (`CheckSquare`, `Circle`, `CircleDashed`, `CheckCircle2`, `Flag`, `Calendar`).
- Espacement : `p-5 md:p-6` pour les pages, `gap-3`/`gap-4` cohérent avec views existantes.
- Mobile-first : toutes les vues testées sur shell mobile (cf. `AppShell`/`MobileBottomNav`).

## 9. Dépendances à ajouter

- `@dnd-kit/core` (kanban + drag liste/calendrier). Léger, tree-shakeable, cohérent avec la philosophie du repo.

## 10. Hors scope (YAGNI)

- Récurrence de tâches.
- Profondeur de sous-tâches > 1.
- Tags/labels custom (priorité suffit).
- Pièces jointes sur les tâches (les resources couvrent ce besoin).
- Notifications push sur ajout de tâche ou échéance proche (réservé pour itération 2).
- Assignation à 3+ users (assigned_user_id nullable suffit : moi / rival / commune).
