# Tasks System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un système de tâches (riches, par projet ou libres) à Rival, avec 3 vues (liste / kanban / calendrier), lien optionnel session ↔ tâches, surfaces dashboard et push « rival a terminé une tâche ».

**Architecture:** Table `tasks` unifiée (project_id nullable, parent_task_id self-ref pour sous-tâches profondeur 1) + table de liaison `entry_tasks`. Server actions Next.js (`"use server"`), zustand store hydraté au bootstrap, Supabase Realtime pour la sync, RLS basée sur le caractère partagé du projet. UI dans `components/views/tasks/` réutilisée par `/tasks` et la page projet.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + Realtime + RLS), TypeScript strict, Tailwind, zustand, lucide-react, **nouvelle dep `@dnd-kit/core` + `@dnd-kit/sortable`** pour drag (kanban + liste + calendrier).

**Réf spec:** `docs/superpowers/specs/2026-05-14-tasks-system-design.md`

---

## Phase 1 — Backend (data + actions)

### Task 1: Migration SQL

**Files:**
- Create: `supabase/migrations/0012_tasks.sql`

- [ ] **Step 1: Vérifier le schéma de `projects`**

```bash
grep -E "create table projects|is_personal|created_by" supabase/migrations/*.sql
```

Confirmer que `projects.is_personal boolean` et `projects.created_by uuid` existent (issu de 0001 et 0007). Ajuster les policies ci-dessous si nommage différent.

- [ ] **Step 2: Écrire la migration**

```sql
-- supabase/migrations/0012_tasks.sql

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

-- Helper expression: true if current user can access the project context
-- Tâche libre (project_id null) → créateur uniquement
-- Tâche sur projet personnel → créateur uniquement
-- Tâche sur projet partagé non-personnel → tout utilisateur authentifié (duo Rival)

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

create policy entry_tasks_all on entry_tasks for all using (
  exists (select 1 from time_entries e where e.id = entry_tasks.entry_id and e.user_id = auth.uid())
) with check (
  exists (select 1 from time_entries e where e.id = entry_tasks.entry_id and e.user_id = auth.uid())
);

-- Realtime
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table entry_tasks;

-- Trigger updated_at
create or replace function set_task_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger tasks_set_updated_at
before update on tasks
for each row execute function set_task_updated_at();
```

- [ ] **Step 3: Régénérer les types Supabase**

Selon le workflow du repo. Si la commande est documentée dans SETUP.md, l'utiliser. Sinon :

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> --schema public > lib/supabase/database.types.ts
```

Si pas d'accès, ajouter manuellement les types `tasks` et `entry_tasks` dans `lib/supabase/database.types.ts` (suivre le pattern des autres tables).

- [ ] **Step 4: Appliquer la migration en local**

```bash
# Si le repo utilise supabase CLI
npx supabase migration up
# Sinon, appliquer manuellement via le dashboard Supabase
```

- [ ] **Step 5: Vérifier**

```bash
# Test rapide : insertion d'une tâche dans psql ou Supabase Studio
# select * from tasks limit 1;
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0012_tasks.sql lib/supabase/database.types.ts
git commit -m "Add tasks and entry_tasks schema with RLS"
```

---

### Task 2: Types & mappers

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/mappers.ts`

- [ ] **Step 1: Ajouter les types dans `lib/types.ts`**

À la fin du fichier :

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

export interface EntryTaskLink {
  entryId: string;
  taskId: string;
}
```

- [ ] **Step 2: Ajouter les mappers dans `lib/mappers.ts`**

Suivre le pattern existant (`mapProject`, `mapEntry`, `mapResource`) :

```ts
import type { Task, EntryTaskLink, TaskStatus, TaskPriority } from "./types";

interface TaskRow {
  id: string;
  project_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assigned_user_id: string | null;
  created_by: string;
  completed_by: string | null;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    parentTaskId: row.parent_task_id,
    title: row.title,
    description: row.description ?? "",
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    assignedUserId: row.assigned_user_id,
    createdBy: row.created_by,
    completedBy: row.completed_by,
    completedAt: row.completed_at,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEntryTask(row: { entry_id: string; task_id: string }): EntryTaskLink {
  return { entryId: row.entry_id, taskId: row.task_id };
}
```

- [ ] **Step 3: Vérifier la compilation**

```bash
npx tsc --noEmit
```

Expected: pas d'erreur dans les fichiers touchés.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts lib/mappers.ts
git commit -m "Add Task types and mappers"
```

---

### Task 3: Queries

**Files:**
- Modify: `lib/db/queries.ts`

- [ ] **Step 1: Lire le fichier**

```bash
cat lib/db/queries.ts
```

Identifier le pattern (`loadEntries`, `loadResources`, etc.) et la signature exacte (souvent `(supabase, userId)`).

- [ ] **Step 2: Ajouter `loadTasks` et `loadEntryTasks`**

```ts
// À ajouter en imports
import { mapTask, mapEntryTask } from "@/lib/mappers";
import type { Task, EntryTaskLink } from "@/lib/types";

export async function loadTasks(supabase: SupabaseServerClient): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapTask);
}

export async function loadEntryTasks(supabase: SupabaseServerClient): Promise<EntryTaskLink[]> {
  const { data, error } = await supabase.from("entry_tasks").select("entry_id, task_id");
  if (error) throw error;
  return (data ?? []).map(mapEntryTask);
}
```

(RLS filtre automatiquement — pas besoin de passer `userId`.)

- [ ] **Step 3: Brancher dans le bootstrap**

Identifier où `loadEntries` / `loadResources` sont appelés (probablement `lib/db/queries.ts` exposera un `loadSnapshot` ou similar, ou bien `app/(app)/layout.tsx`). Ajouter `tasks` et `entryTasks` au `ServerSnapshot` :

```ts
// lib/store.ts - étendre ServerSnapshot
export interface ServerSnapshot {
  // ... existant
  tasks: Task[];
  entryTasks: EntryTaskLink[];
}
```

Et appeler les nouvelles fonctions dans le loader serveur.

- [ ] **Step 4: Vérifier la compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add lib/db/queries.ts lib/store.ts
git commit -m "Load tasks and entry_tasks at bootstrap"
```

---

### Task 4: Server actions

**Files:**
- Create: `lib/actions/tasks.ts`

- [ ] **Step 1: Squelette aligné avec `entries.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyTaskCompleted } from "@/lib/push/dispatch";
import type { TaskPriority, TaskStatus } from "@/lib/types";

type ActionResult = { ok: boolean; error?: string };

async function getAuthed() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, userId: null as string | null };
  return { supabase, userId: user.id };
}

interface CreateTaskInput {
  projectId: string | null;
  parentTaskId?: string | null;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedUserId?: string | null;
}

export async function createTask(input: CreateTaskInput): Promise<ActionResult & { id?: string }> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Titre requis." };
  if (title.length > 200) return { ok: false, error: "Titre trop long." };

  // Profondeur max 1 : si parent fourni, vérifier qu'il n'a pas lui-même de parent
  if (input.parentTaskId) {
    const { data: parent } = await supabase
      .from("tasks")
      .select("parent_task_id, project_id")
      .eq("id", input.parentTaskId)
      .maybeSingle();
    if (!parent) return { ok: false, error: "Tâche parente introuvable." };
    if (parent.parent_task_id) return { ok: false, error: "Sous-tâches limitées à 1 niveau." };
    if (parent.project_id !== input.projectId) {
      return { ok: false, error: "La sous-tâche doit être dans le même projet." };
    }
  }

  // Position = max(position) + 1 dans le scope (project_id, parent_task_id)
  const { data: maxRow } = await supabase
    .from("tasks")
    .select("position")
    .eq("project_id", input.projectId)
    .eq("parent_task_id", input.parentTaskId ?? null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (maxRow?.position ?? -1) + 1;

  const { data: inserted, error } = await supabase.from("tasks").insert({
    project_id: input.projectId,
    parent_task_id: input.parentTaskId ?? null,
    title,
    description: input.description?.trim() ?? "",
    priority: input.priority ?? "normal",
    due_date: input.dueDate ?? null,
    assigned_user_id: input.assignedUserId ?? null,
    created_by: userId,
    position,
  }).select("id").maybeSingle();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, id: inserted?.id };
}

interface UpdateTaskPatch {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedUserId?: string | null;
  status?: TaskStatus;
}

export async function updateTask(id: string, patch: UpdateTaskPatch): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) return { ok: false, error: "Titre requis." };
    update.title = t;
  }
  if (patch.description !== undefined) update.description = patch.description.trim();
  if (patch.priority !== undefined) update.priority = patch.priority;
  if (patch.dueDate !== undefined) update.due_date = patch.dueDate;
  if (patch.assignedUserId !== undefined) update.assigned_user_id = patch.assignedUserId;
  if (patch.status !== undefined) {
    update.status = patch.status;
    if (patch.status === "done") {
      update.completed_by = userId;
      update.completed_at = new Date().toISOString();
    } else {
      update.completed_by = null;
      update.completed_at = null;
    }
  }

  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase.from("tasks").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Push si transition vers done sur projet partagé non-personnel
  if (patch.status === "done") {
    const { data: row } = await supabase
      .from("tasks")
      .select("title, project_id, projects:project_id(name, is_personal)")
      .eq("id", id)
      .maybeSingle();
    const project = (row as any)?.projects;
    if (project && project.is_personal === false) {
      notifyTaskCompleted({
        actorUserId: userId,
        projectName: project.name,
        taskTitle: row?.title ?? "",
      });
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<ActionResult> {
  return updateTask(id, { status });
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

interface ReorderScope {
  projectId: string | null;
  parentTaskId: string | null;
}

export async function reorderTasks(scope: ReorderScope, orderedIds: string[]): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  // Update positions one by one (Postgres ne supporte pas un bulk upsert simple via supabase-js sans conflict target)
  const updates = orderedIds.map((id, idx) =>
    supabase.from("tasks").update({ position: idx }).eq("id", id),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function linkEntryTasks(entryId: string, taskIds: string[]): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  // Valider que l'entry appartient à l'user et récupérer son project_id
  const { data: entry } = await supabase
    .from("time_entries")
    .select("project_id, user_id")
    .eq("id", entryId)
    .maybeSingle();
  if (!entry || entry.user_id !== userId) {
    return { ok: false, error: "Entrée introuvable." };
  }

  // Valider que toutes les tâches sont du même projet OU libres
  if (taskIds.length > 0) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, project_id")
      .in("id", taskIds);
    const bad = (tasks ?? []).find(
      (t) => t.project_id !== null && t.project_id !== entry.project_id,
    );
    if (bad) return { ok: false, error: "Tâche hors projet." };
  }

  // Replace : delete all then insert
  const { error: delErr } = await supabase
    .from("entry_tasks")
    .delete()
    .eq("entry_id", entryId);
  if (delErr) return { ok: false, error: delErr.message };

  if (taskIds.length > 0) {
    const rows = taskIds.map((task_id) => ({ entry_id: entryId, task_id }));
    const { error: insErr } = await supabase.from("entry_tasks").insert(rows);
    if (insErr) return { ok: false, error: insErr.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit
```

Note : `notifyTaskCompleted` n'existe pas encore — créer un stub minimal pour passer le type-check, ou bien faire cette task **après** la Task 5 (push). Choisir l'option stub :

```ts
// lib/push/dispatch.ts — temp stub
export function notifyTaskCompleted(_input: {
  actorUserId: string;
  projectName: string;
  taskTitle: string;
}): void {}
```

- [ ] **Step 3: Commit**

```bash
git add lib/actions/tasks.ts lib/push/dispatch.ts
git commit -m "Add task server actions and entry_tasks linking"
```

---

### Task 5: Push notification — `notifyTaskCompleted`

**Files:**
- Modify: `lib/push/dispatch.ts`

- [ ] **Step 1: Lire l'existant**

```bash
cat lib/push/dispatch.ts | head -80
```

Identifier la fonction de référence (`notifyEntryAdded` ou `notifyDailyMilestone`) pour réutiliser le mécanisme d'envoi.

- [ ] **Step 2: Remplacer le stub par l'implémentation**

```ts
export async function notifyTaskCompleted(input: {
  actorUserId: string;
  projectName: string;
  taskTitle: string;
}): Promise<void> {
  const variants = [
    `${ACTOR_NAME} a coché "${input.taskTitle}" sur ${input.projectName}. À toi.`,
    `${ACTOR_NAME} vient de finir "${input.taskTitle}".`,
    `Une tâche de moins pour ${ACTOR_NAME} : "${input.taskTitle}".`,
    `${ACTOR_NAME} avance — "${input.taskTitle}" faite sur ${input.projectName}.`,
  ];
  const body = variants[Math.floor(Math.random() * variants.length)];
  await sendToRivalsOf(input.actorUserId, {
    title: "Tâche terminée",
    body,
    url: "/tasks",
  });
}
```

Adapter les helpers (`ACTOR_NAME`, `sendToRivalsOf`) au pattern exact de `dispatch.ts` — copier les utilitaires utilisés par `notifyEntryAdded`.

- [ ] **Step 3: Vérifier**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add lib/push/dispatch.ts
git commit -m "Add task-completed push notification"
```

---

## Phase 2 — Store & realtime

### Task 6: Étendre le store

**Files:**
- Modify: `lib/store.ts`

- [ ] **Step 1: Étendre l'état**

```ts
// Ajouts dans AppState
tasks: Task[];
entryTasks: Record<string /*entryId*/, string[] /*taskIds*/>;
tasksView: 'list' | 'kanban' | 'calendar';
tasksCalendarMode: 'week' | 'month';

// Mutations locales
addTaskLocal: (task: Task) => void;
updateTaskLocal: (id: string, patch: Partial<Task>) => void;
removeTaskLocal: (id: string) => void;
reorderTasksLocal: (orderedIds: string[]) => void;
setEntryTasksLocal: (entryId: string, taskIds: string[]) => void;
setTasksView: (v: 'list' | 'kanban' | 'calendar') => void;
setTasksCalendarMode: (m: 'week' | 'month') => void;
```

Initialiser à partir de `ServerSnapshot.tasks` et `entryTasks` (Record agrégé depuis `EntryTaskLink[]`).

Persistance `tasksView` / `tasksCalendarMode` via `localStorage` (au mount d'un composant racine ou via une migration zustand persist). Pour rester aligné avec le repo qui ne semble pas utiliser persist : faire un wrapper léger dans `TasksContent`/`TasksSection` qui lit/écrit `localStorage` au mount.

- [ ] **Step 2: Ajouter les sélecteurs**

Dans `lib/store.ts` (ou un nouveau `lib/selectors/tasks.ts`) :

```ts
export function selectTasksForProject(state: AppState, projectId: string | null): Task[] {
  return state.tasks
    .filter((t) => t.projectId === projectId && t.parentTaskId === null)
    .sort(compareTasks);
}

export function selectSubtasks(state: AppState, parentId: string): Task[] {
  return state.tasks.filter((t) => t.parentTaskId === parentId).sort(compareTasks);
}

export function selectFreeTasks(state: AppState, userId: UserId): Task[] {
  return state.tasks
    .filter((t) => t.projectId === null && t.createdBy === userId && t.parentTaskId === null)
    .sort(compareTasks);
}

export function selectTodayTasks(state: AppState, userId: UserId): Task[] {
  const today = todayISO();
  return state.tasks.filter((t) => {
    if (t.status === "done") return false;
    if (t.assignedUserId !== null && t.assignedUserId !== userId) return false;
    return t.dueDate === today || t.status === "in_progress";
  });
}

export function selectTaskHours(state: AppState, taskId: string): number {
  let total = 0;
  for (const [entryId, taskIds] of Object.entries(state.entryTasks)) {
    if (!taskIds.includes(taskId)) continue;
    const entry = state.entries.find((e) => e.id === entryId);
    if (entry) total += entry.hours;
  }
  return total;
}

const STATUS_RANK: Record<TaskStatus, number> = { in_progress: 0, todo: 1, done: 2 };
const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 };

function compareTasks(a: Task, b: Task): number {
  const s = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (s !== 0) return s;
  const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (p !== 0) return p;
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return a.position - b.position;
}
```

- [ ] **Step 3: Vérifier**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/store.ts
git commit -m "Add tasks to store with selectors and view prefs"
```

---

### Task 7: Realtime sync

**Files:**
- Modify: `components/RealtimeSync.tsx`

- [ ] **Step 1: Lire l'existant**

```bash
cat components/RealtimeSync.tsx
```

Identifier le pattern d'abonnement (probablement `supabase.channel(...).on('postgres_changes', ...)` pour `time_entries`).

- [ ] **Step 2: Ajouter les abonnements**

```ts
// À l'intérieur du useEffect d'abonnement
const tasksChannel = supabase
  .channel("tasks_changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
    if (payload.eventType === "INSERT") {
      addTaskLocal(mapTask(payload.new as any));
    } else if (payload.eventType === "UPDATE") {
      const t = mapTask(payload.new as any);
      updateTaskLocal(t.id, t);
    } else if (payload.eventType === "DELETE") {
      removeTaskLocal((payload.old as any).id);
    }
  })
  .subscribe();

const entryTasksChannel = supabase
  .channel("entry_tasks_changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "entry_tasks" }, (payload) => {
    // Recharger la liste pour cette entry (plus simple que diff)
    const entryId = (payload.new as any)?.entry_id ?? (payload.old as any)?.entry_id;
    if (entryId) refetchEntryTasks(entryId); // helper qui requery les liens pour l'entryId
  })
  .subscribe();

return () => {
  tasksChannel.unsubscribe();
  entryTasksChannel.unsubscribe();
};
```

(Adapter `refetchEntryTasks` selon le pattern existant ; alternative : maintenir un set complet et faire un `select` ciblé.)

- [ ] **Step 3: Vérifier**

```bash
npm run dev
```

Ouvrir deux navigateurs avec deux comptes, créer une tâche d'un côté, vérifier qu'elle apparaît de l'autre.

- [ ] **Step 4: Commit**

```bash
git add components/RealtimeSync.tsx
git commit -m "Sync tasks and entry_tasks in realtime"
```

---

## Phase 3 — UI core

### Task 8: Installer `@dnd-kit`

- [ ] **Step 1: Install**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add @dnd-kit for tasks drag-and-drop"
```

---

### Task 9: TaskDialog (création/édition)

**Files:**
- Create: `components/views/tasks/TaskDialog.tsx`

- [ ] **Step 1: Implémenter**

Inspirer-toi de `components/EditEntryDialog.tsx` pour le style (overlay, max-w, padding, font sizes).

```tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { createTask, updateTask, deleteTask } from "@/lib/actions/tasks";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaults?: {
    projectId?: string | null;
    parentTaskId?: string | null;
    dueDate?: string | null;
  };
}

export function TaskDialog({ open, onClose, task, defaults }: Props) {
  const projects = useStore((s) => s.projects);
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setProjectId(task.projectId);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate);
      setAssignedUserId(task.assignedUserId);
    } else {
      setTitle("");
      setDescription("");
      setProjectId(defaults?.projectId ?? null);
      setPriority("normal");
      setStatus("todo");
      setDueDate(defaults?.dueDate ?? null);
      setAssignedUserId(null);
    }
  }, [task, open, defaults]);

  if (!open) return null;

  const save = () => {
    startTransition(async () => {
      if (task) {
        await updateTask(task.id, { title, description, priority, status, dueDate, assignedUserId });
      } else {
        await createTask({
          projectId,
          parentTaskId: defaults?.parentTaskId ?? null,
          title,
          description,
          priority,
          dueDate,
          assignedUserId,
        });
      }
      onClose();
    });
  };

  const remove = () => {
    if (!task) return;
    startTransition(async () => {
      await deleteTask(task.id);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-bg-2 border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[14px] text-text font-medium">
            {task ? "Modifier la tâche" : "Nouvelle tâche"}
          </div>
          <button onClick={onClose} className="text-text-3 hover:text-text">
            <X size={14} strokeWidth={1.3} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la tâche"
            className="w-full bg-bg border border-border rounded px-3 py-2 text-[13px] text-text placeholder:text-text-3"
            autoFocus
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optionnel)"
            rows={3}
            className="w-full bg-bg border border-border rounded px-3 py-2 text-[12px] text-text placeholder:text-text-3 resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={projectId ?? ""}
              onChange={(e) => setProjectId(e.target.value || null)}
              className="bg-bg border border-border rounded px-2 py-2 text-[12px] text-text"
              disabled={!!task}
            >
              <option value="">Sans projet</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={dueDate ?? ""}
              onChange={(e) => setDueDate(e.target.value || null)}
              className="bg-bg border border-border rounded px-2 py-2 text-[12px] text-text"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["low", "normal", "high"] as TaskPriority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`px-2 py-1.5 rounded text-[11px] border ${
                  priority === p ? "border-text text-text" : "border-border text-text-3"
                }`}
              >
                {p === "low" ? "Basse" : p === "normal" ? "Normale" : "Haute"}
              </button>
            ))}
          </div>

          <select
            value={assignedUserId ?? ""}
            onChange={(e) => setAssignedUserId(e.target.value || null)}
            className="w-full bg-bg border border-border rounded px-2 py-2 text-[12px] text-text"
          >
            <option value="">Commune / non assignée</option>
            {Object.values(users).map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {task && (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full bg-bg border border-border rounded px-2 py-2 text-[12px] text-text"
            >
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="done">Terminée</option>
            </select>
          )}
        </div>

        <div className="flex items-center justify-between mt-5">
          {task ? (
            <button
              onClick={remove}
              disabled={pending}
              className="text-[11.5px] text-text-3 hover:text-red-400"
            >
              Supprimer
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-[12px] text-text-3 hover:text-text">
              Annuler
            </button>
            <button
              onClick={save}
              disabled={pending || !title.trim()}
              className="px-3 py-1.5 rounded bg-text text-bg text-[12px] disabled:opacity-50"
            >
              {task ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/views/tasks/TaskDialog.tsx
git commit -m "Add TaskDialog for create/edit/delete"
```

---

### Task 10: TasksFilters

**Files:**
- Create: `components/views/tasks/TasksFilters.tsx`
- Create: `components/views/tasks/types.ts`

- [ ] **Step 1: Types partagés**

```ts
// components/views/tasks/types.ts
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";

export interface TaskFilters {
  projectId: string | null | "all" | "free";
  priority: TaskPriority | "all";
  assignment: "all" | "me" | "rival" | "common";
  status: TaskStatus | "all";
  search: string;
}

export const DEFAULT_FILTERS: TaskFilters = {
  projectId: "all",
  priority: "all",
  assignment: "all",
  status: "all",
  search: "",
};

export function applyTaskFilters(
  tasks: Task[],
  filters: TaskFilters,
  meId: string,
  rivalId: string | undefined,
): Task[] {
  return tasks.filter((t) => {
    if (filters.projectId === "free" && t.projectId !== null) return false;
    if (filters.projectId !== "all" && filters.projectId !== "free" && t.projectId !== filters.projectId) return false;
    if (filters.priority !== "all" && t.priority !== filters.priority) return false;
    if (filters.status !== "all" && t.status !== filters.status) return false;
    if (filters.assignment === "me" && t.assignedUserId !== meId) return false;
    if (filters.assignment === "rival" && t.assignedUserId !== rivalId) return false;
    if (filters.assignment === "common" && t.assignedUserId !== null) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}
```

- [ ] **Step 2: Composant filtres**

```tsx
// components/views/tasks/TasksFilters.tsx
"use client";

import { useStore } from "@/lib/store";
import type { TaskFilters } from "./types";

interface Props {
  value: TaskFilters;
  onChange: (next: TaskFilters) => void;
  hideProject?: boolean;
  hideStatus?: boolean;
}

export function TasksFilters({ value, onChange, hideProject, hideStatus }: Props) {
  const projects = useStore((s) => s.projects);
  const set = (patch: Partial<TaskFilters>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      {!hideProject && (
        <select
          value={String(value.projectId)}
          onChange={(e) => set({ projectId: e.target.value as any })}
          className="bg-bg border border-border rounded px-2 py-1 text-text-2"
        >
          <option value="all">Tous projets</option>
          <option value="free">Libres</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      <select value={value.priority} onChange={(e) => set({ priority: e.target.value as any })}
        className="bg-bg border border-border rounded px-2 py-1 text-text-2">
        <option value="all">Priorité</option>
        <option value="high">Haute</option>
        <option value="normal">Normale</option>
        <option value="low">Basse</option>
      </select>
      <select value={value.assignment} onChange={(e) => set({ assignment: e.target.value as any })}
        className="bg-bg border border-border rounded px-2 py-1 text-text-2">
        <option value="all">Assignation</option>
        <option value="me">Moi</option>
        <option value="rival">Rival</option>
        <option value="common">Commune</option>
      </select>
      {!hideStatus && (
        <select value={value.status} onChange={(e) => set({ status: e.target.value as any })}
          className="bg-bg border border-border rounded px-2 py-1 text-text-2">
          <option value="all">Statut</option>
          <option value="todo">À faire</option>
          <option value="in_progress">En cours</option>
          <option value="done">Terminée</option>
        </select>
      )}
      <input value={value.search} onChange={(e) => set({ search: e.target.value })}
        placeholder="Rechercher"
        className="bg-bg border border-border rounded px-2 py-1 text-text placeholder:text-text-3 w-32" />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/views/tasks/TasksFilters.tsx components/views/tasks/types.ts
git commit -m "Add tasks filters component"
```

---

### Task 11: TasksViewSwitcher

**Files:**
- Create: `components/views/tasks/TasksViewSwitcher.tsx`

- [ ] **Step 1: Implémenter**

```tsx
"use client";

import { List, Columns3, Calendar } from "lucide-react";

type View = "list" | "kanban" | "calendar";

interface Props {
  value: View;
  onChange: (v: View) => void;
}

export function TasksViewSwitcher({ value, onChange }: Props) {
  const items: { v: View; label: string; Icon: any }[] = [
    { v: "list", label: "Liste", Icon: List },
    { v: "kanban", label: "Kanban", Icon: Columns3 },
    { v: "calendar", label: "Calendrier", Icon: Calendar },
  ];
  return (
    <div className="inline-flex bg-bg border border-border rounded p-0.5 text-[11.5px]">
      {items.map(({ v, label, Icon }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded ${
            value === v ? "bg-bg-2 text-text" : "text-text-3 hover:text-text"
          }`}
        >
          <Icon size={12} strokeWidth={1.3} />
          {label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/views/tasks/TasksViewSwitcher.tsx
git commit -m "Add tasks view switcher"
```

---

### Task 12: TaskRow + TasksListView

**Files:**
- Create: `components/views/tasks/TaskRow.tsx`
- Create: `components/views/tasks/TasksListView.tsx`

- [ ] **Step 1: TaskRow**

```tsx
// components/views/tasks/TaskRow.tsx
"use client";

import { useTransition } from "react";
import { Circle, CircleDashed, CheckCircle2, Flag } from "lucide-react";
import { useStore } from "@/lib/store";
import { setTaskStatus } from "@/lib/actions/tasks";
import { fmt } from "@/lib/format";
import { selectSubtasks, selectTaskHours } from "@/lib/store";
import type { Task, TaskStatus } from "@/lib/types";

const STATUS_ICON = { todo: Circle, in_progress: CircleDashed, done: CheckCircle2 } as const;
const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};
const PRIORITY_COLOR = { low: "text-text-3", normal: "text-text-2", high: "text-accent" } as const;

interface Props {
  task: Task;
  onOpen: (t: Task) => void;
  depth?: number;
}

export function TaskRow({ task, onOpen, depth = 0 }: Props) {
  const subtasks = useStore((s) => selectSubtasks(s, task.id));
  const hours = useStore((s) => selectTaskHours(s, task.id));
  const users = useStore((s) => s.users);
  const updateLocal = useStore((s) => s.updateTaskLocal);
  const [pending, startTransition] = useTransition();
  const Icon = STATUS_ICON[task.status];

  const cycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = NEXT_STATUS[task.status];
    updateLocal(task.id, {
      status: next,
      completedAt: next === "done" ? new Date().toISOString() : null,
    });
    startTransition(async () => { await setTaskStatus(task.id, next); });
  };

  const assignee = task.assignedUserId ? users[task.assignedUserId] : null;
  const done = task.status === "done";

  return (
    <>
      <div
        onClick={() => onOpen(task)}
        className="group flex items-center gap-2.5 px-3 py-2 rounded hover:bg-bg-2 cursor-pointer"
        style={{ paddingLeft: 12 + depth * 18 }}
      >
        <button onClick={cycle} disabled={pending}>
          <Icon
            size={13}
            strokeWidth={1.4}
            className={done ? "text-text-3" : "text-text-2 hover:text-text"}
          />
        </button>
        <span className={`text-[13px] ${done ? "text-text-3 line-through" : "text-text"} flex-1`}>
          {task.title}
        </span>
        {task.priority !== "normal" && (
          <Flag size={11} strokeWidth={1.3} className={PRIORITY_COLOR[task.priority]} />
        )}
        {task.dueDate && (
          <span className="text-[10.5px] font-mono text-text-3">{task.dueDate.slice(5)}</span>
        )}
        {hours > 0 && (
          <span className="text-[10.5px] font-mono text-text-3">{fmt(hours)}</span>
        )}
        {assignee && (
          <span className="text-[10px] text-text-3">{assignee.initials}</span>
        )}
      </div>
      {subtasks.map((sub) => (
        <TaskRow key={sub.id} task={sub} onOpen={onOpen} depth={depth + 1} />
      ))}
    </>
  );
}
```

- [ ] **Step 2: TasksListView**

```tsx
// components/views/tasks/TasksListView.tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { TaskRow } from "./TaskRow";
import { TaskDialog } from "./TaskDialog";
import { todayISO } from "@/lib/date";
import type { Task } from "@/lib/types";

interface Props {
  tasks: Task[];
}

function groupByDueDate(tasks: Task[]) {
  const today = todayISO();
  const inWeek = (d: string) => {
    const a = new Date(today);
    const b = new Date(d);
    const days = Math.round((b.getTime() - a.getTime()) / 86400000);
    return days > 0 && days <= 7;
  };
  const groups: Record<string, Task[]> = {
    overdue: [],
    today: [],
    week: [],
    later: [],
    none: [],
    done: [],
  };
  for (const t of tasks) {
    if (t.parentTaskId) continue; // sub-tasks render under parent
    if (t.status === "done") { groups.done.push(t); continue; }
    if (!t.dueDate) { groups.none.push(t); continue; }
    if (t.dueDate < today) { groups.overdue.push(t); continue; }
    if (t.dueDate === today) { groups.today.push(t); continue; }
    if (inWeek(t.dueDate)) { groups.week.push(t); continue; }
    groups.later.push(t);
  }
  return groups;
}

const GROUP_LABELS: Record<string, string> = {
  overdue: "En retard",
  today: "Aujourd'hui",
  week: "Cette semaine",
  later: "Plus tard",
  none: "Sans échéance",
  done: "Terminées",
};

export function TasksListView({ tasks }: Props) {
  const groups = useMemo(() => groupByDueDate(tasks), [tasks]);
  const [showDone, setShowDone] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  return (
    <div className="space-y-4">
      {(["overdue", "today", "week", "later", "none"] as const).map((key) => {
        const list = groups[key];
        if (list.length === 0) return null;
        return (
          <section key={key}>
            <div className="text-[11px] text-text-3 uppercase tracking-wide px-3 mb-1.5">
              {GROUP_LABELS[key]} <span className="font-mono">· {list.length}</span>
            </div>
            <div>
              {list.map((t) => <TaskRow key={t.id} task={t} onOpen={setEditing} />)}
            </div>
          </section>
        );
      })}

      {groups.done.length > 0 && (
        <section>
          <button
            onClick={() => setShowDone((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-text-3 px-3 mb-1.5 hover:text-text"
          >
            <ChevronRight size={11} className={showDone ? "rotate-90" : ""} />
            Terminées <span className="font-mono">· {groups.done.length}</span>
          </button>
          {showDone && groups.done.map((t) => <TaskRow key={t.id} task={t} onOpen={setEditing} />)}
        </section>
      )}

      <TaskDialog open={!!editing} task={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/views/tasks/TaskRow.tsx components/views/tasks/TasksListView.tsx
git commit -m "Add tasks list view with grouped due dates"
```

---

### Task 13: TasksKanbanView

**Files:**
- Create: `components/views/tasks/TaskCard.tsx`
- Create: `components/views/tasks/TasksKanbanView.tsx`

- [ ] **Step 1: TaskCard**

```tsx
"use client";

import { Flag } from "lucide-react";
import { useStore, selectSubtasks } from "@/lib/store";
import type { Task } from "@/lib/types";

const PRIORITY_COLOR = { low: "text-text-3", normal: "text-text-2", high: "text-accent" } as const;

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const projects = useStore((s) => s.projects);
  const subtasks = useStore((s) => selectSubtasks(s, task.id));
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
  const doneCount = subtasks.filter((s) => s.status === "done").length;

  return (
    <div
      onClick={() => onOpen(task)}
      className="bg-bg-2 border border-border rounded p-2.5 cursor-pointer hover:border-text-3"
    >
      <div className="text-[12.5px] text-text mb-1.5">{task.title}</div>
      <div className="flex items-center gap-2 text-[10.5px] text-text-3 font-mono">
        {project && <span>{project.name}</span>}
        {task.priority !== "normal" && <Flag size={10} className={PRIORITY_COLOR[task.priority]} />}
        {task.dueDate && <span>{task.dueDate.slice(5)}</span>}
        {subtasks.length > 0 && <span>{doneCount}/{subtasks.length}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TasksKanbanView avec dnd-kit**

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { useStore } from "@/lib/store";
import { setTaskStatus } from "@/lib/actions/tasks";
import type { Task, TaskStatus } from "@/lib/types";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "À faire" },
  { id: "in_progress", label: "En cours" },
  { id: "done", label: "Terminées" },
];

function DraggableCard({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      <TaskCard task={task} onOpen={onOpen} />
    </div>
  );
}

function Column({
  status,
  tasks,
  onOpen,
}: {
  status: TaskStatus;
  tasks: Task[];
  onOpen: (t: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[240px] rounded p-2 ${isOver ? "bg-bg-2" : ""}`}
    >
      <div className="flex items-center justify-between text-[12px] text-text-2 mb-2 px-1">
        <span>{COLUMNS.find((c) => c.id === status)?.label}</span>
        <span className="text-text-3 font-mono">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => <DraggableCard key={t.id} task={t} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

export function TasksKanbanView({ tasks }: { tasks: Task[] }) {
  const updateLocal = useStore((s) => s.updateTaskLocal);
  const [editing, setEditing] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) if (!t.parentTaskId) map[t.status].push(t);
    return map;
  }, [tasks]);

  const active = tasks.find((t) => t.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={(e) => {
        setActiveId(null);
        if (!e.over) return;
        const next = e.over.id as TaskStatus;
        const id = String(e.active.id);
        const t = tasks.find((x) => x.id === id);
        if (!t || t.status === next) return;
        updateLocal(id, {
          status: next,
          completedAt: next === "done" ? new Date().toISOString() : null,
        });
        setTaskStatus(id, next);
      }}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => (
          <Column key={col.id} status={col.id} tasks={byStatus[col.id]} onOpen={setEditing} />
        ))}
      </div>
      <DragOverlay>{active && <TaskCard task={active} onOpen={() => {}} />}</DragOverlay>
      <TaskDialog open={!!editing} task={editing} onClose={() => setEditing(null)} />
    </DndContext>
  );
}
```

- [ ] **Step 3: Vérifier dans `npm run dev`** — kanban fonctionne, drag transitionne le statut.

- [ ] **Step 4: Commit**

```bash
git add components/views/tasks/TaskCard.tsx components/views/tasks/TasksKanbanView.tsx
git commit -m "Add tasks kanban view with drag-and-drop"
```

---

### Task 14: TasksCalendarView (week + month)

**Files:**
- Create: `components/views/tasks/TasksCalendarView.tsx`
- Create: `components/views/tasks/TaskChip.tsx`

- [ ] **Step 1: TaskChip**

```tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Task } from "@/lib/types";

export function TaskChip({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className="px-1.5 py-0.5 rounded bg-bg-2 border border-border text-[10.5px] text-text truncate cursor-pointer"
    >
      {task.title}
    </div>
  );
}
```

- [ ] **Step 2: TasksCalendarView — week mode**

```tsx
"use client";

import { useMemo, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { TaskChip } from "./TaskChip";
import { TaskDialog } from "./TaskDialog";
import { useStore } from "@/lib/store";
import { updateTask } from "@/lib/actions/tasks";
import { todayISO } from "@/lib/date";
import type { Task } from "@/lib/types";

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

function DayCell({
  date,
  tasks,
  onOpenTask,
  onCreate,
}: {
  date: string;
  tasks: Task[];
  onOpenTask: (t: Task) => void;
  onCreate: (date: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${date}` });
  const today = todayISO() === date;
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[120px] border-r border-border last:border-r-0 p-1.5 ${isOver ? "bg-bg-2" : ""}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[11px] ${today ? "text-accent" : "text-text-3"} font-mono`}>
          {date.slice(8)}
        </span>
        <button onClick={() => onCreate(date)} className="text-text-3 hover:text-text text-[13px] leading-none">+</button>
      </div>
      <div className="space-y-1">
        {tasks.map((t) => <TaskChip key={t.id} task={t} onClick={onOpenTask} />)}
      </div>
    </div>
  );
}

export function TasksCalendarView({ tasks }: { tasks: Task[] }) {
  const mode = useStore((s) => s.tasksCalendarMode);
  const setMode = useStore((s) => s.setTasksCalendarMode);
  const updateLocal = useStore((s) => s.updateTaskLocal);
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const days = useMemo(() => {
    if (mode === "week") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(anchor);
        d.setDate(d.getDate() + i);
        return isoDate(d);
      });
    }
    // month
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const startGrid = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startGrid);
      d.setDate(d.getDate() + i);
      return isoDate(d);
    });
  }, [anchor, mode]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (t.parentTaskId || !t.dueDate) continue;
      (map[t.dueDate] ||= []).push(t);
    }
    return map;
  }, [tasks]);

  const overdue = tasks.filter(
    (t) => !t.parentTaskId && t.status !== "done" && t.dueDate && t.dueDate < todayISO(),
  );
  const undated = tasks.filter((t) => !t.parentTaskId && !t.dueDate && t.status !== "done");

  const handleDrop = (taskId: string, isoDateStr: string) => {
    updateLocal(taskId, { dueDate: isoDateStr });
    updateTask(taskId, { dueDate: isoDateStr });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={(e) => {
        if (!e.over) return;
        const id = String(e.over.id);
        if (!id.startsWith("day:")) return;
        handleDrop(String(e.active.id), id.slice(4));
      }}
    >
      <div className="flex items-center justify-between mb-3 text-[11.5px]">
        <div className="flex gap-2">
          <button
            onClick={() => setAnchor((a) => {
              const d = new Date(a);
              if (mode === "week") d.setDate(d.getDate() - 7);
              else d.setMonth(d.getMonth() - 1);
              return mode === "week" ? startOfWeek(d) : new Date(d.getFullYear(), d.getMonth(), 1);
            })}
            className="text-text-3 hover:text-text px-2"
          >‹</button>
          <button
            onClick={() => setAnchor(() => mode === "week" ? startOfWeek(new Date()) : new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            className="text-text-3 hover:text-text px-2"
          >Aujourd'hui</button>
          <button
            onClick={() => setAnchor((a) => {
              const d = new Date(a);
              if (mode === "week") d.setDate(d.getDate() + 7);
              else d.setMonth(d.getMonth() + 1);
              return mode === "week" ? startOfWeek(d) : new Date(d.getFullYear(), d.getMonth(), 1);
            })}
            className="text-text-3 hover:text-text px-2"
          >›</button>
        </div>
        <div className="inline-flex bg-bg border border-border rounded p-0.5">
          {(["week", "month"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-1 rounded ${mode === m ? "bg-bg-2 text-text" : "text-text-3"}`}
            >{m === "week" ? "Semaine" : "Mois"}</button>
          ))}
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="mb-3 p-2 rounded border border-border bg-bg-2">
          <div className="text-[11px] text-accent uppercase mb-1.5">En retard · {overdue.length}</div>
          <div className="flex flex-wrap gap-1">
            {overdue.map((t) => <TaskChip key={t.id} task={t} onClick={setEditing} />)}
          </div>
        </div>
      )}

      <div className={mode === "week" ? "flex border border-border rounded overflow-hidden" : "grid grid-cols-7 border border-border rounded overflow-hidden"}>
        {days.map((d) => (
          <DayCell
            key={d}
            date={d}
            tasks={tasksByDay[d] ?? []}
            onOpenTask={setEditing}
            onCreate={(date) => setCreating(date)}
          />
        ))}
      </div>

      {undated.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] text-text-3 uppercase mb-1.5">À planifier · {undated.length}</div>
          <div className="flex flex-wrap gap-1">
            {undated.map((t) => <TaskChip key={t.id} task={t} onClick={setEditing} />)}
          </div>
        </div>
      )}

      <TaskDialog open={!!editing} task={editing} onClose={() => setEditing(null)} />
      <TaskDialog
        open={!!creating}
        onClose={() => setCreating(null)}
        defaults={{ dueDate: creating }}
      />
    </DndContext>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/views/tasks/TaskChip.tsx components/views/tasks/TasksCalendarView.tsx
git commit -m "Add tasks calendar view (week and month)"
```

---

### Task 15: TasksSection (wrapper réutilisable)

**Files:**
- Create: `components/views/tasks/TasksSection.tsx`

- [ ] **Step 1: Wrapper qui orchestre filtres + switcher + vue**

```tsx
"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useStore, selectCurrentUser, selectRivalUser } from "@/lib/store";
import { TasksFilters } from "./TasksFilters";
import { TasksViewSwitcher } from "./TasksViewSwitcher";
import { TasksListView } from "./TasksListView";
import { TasksKanbanView } from "./TasksKanbanView";
import { TasksCalendarView } from "./TasksCalendarView";
import { TaskDialog } from "./TaskDialog";
import { DEFAULT_FILTERS, applyTaskFilters, type TaskFilters } from "./types";
import type { Task } from "@/lib/types";

interface Props {
  scope: { projectId: string } | "global";
}

export function TasksSection({ scope }: Props) {
  const view = useStore((s) => s.tasksView);
  const setView = useStore((s) => s.setTasksView);
  const allTasks = useStore((s) => s.tasks);
  const me = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);

  const baseTasks: Task[] = useMemo(() => {
    if (scope === "global") return allTasks;
    return allTasks.filter((t) => t.projectId === scope.projectId);
  }, [allTasks, scope]);

  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const filtered = useMemo(
    () => applyTaskFilters(baseTasks, filters, me.id, rival?.id),
    [baseTasks, filters, me.id, rival?.id],
  );

  const [creating, setCreating] = useState(false);
  const projectId = scope === "global" ? null : scope.projectId;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <TasksFilters
          value={filters}
          onChange={setFilters}
          hideProject={scope !== "global"}
          hideStatus={view === "kanban"}
        />
        <div className="flex items-center gap-2">
          <TasksViewSwitcher value={view} onChange={setView} />
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-text text-bg text-[11.5px]"
          >
            <Plus size={11} strokeWidth={1.6} /> Nouvelle
          </button>
        </div>
      </div>

      {view === "list" && <TasksListView tasks={filtered} />}
      {view === "kanban" && <TasksKanbanView tasks={filtered} />}
      {view === "calendar" && <TasksCalendarView tasks={filtered} />}

      <TaskDialog
        open={creating}
        onClose={() => setCreating(false)}
        defaults={{ projectId }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/views/tasks/TasksSection.tsx
git commit -m "Add TasksSection wrapper"
```

---

## Phase 4 — Intégration UI

### Task 16: Page `/tasks`

**Files:**
- Create: `app/(app)/tasks/page.tsx`
- Create: `components/views/TasksContent.tsx`

- [ ] **Step 1: Route**

```tsx
// app/(app)/tasks/page.tsx
import { TasksContent } from "@/components/views/TasksContent";

export default function TasksPage() {
  return <TasksContent />;
}
```

- [ ] **Step 2: View content**

```tsx
// components/views/TasksContent.tsx
"use client";

import { TasksSection } from "./tasks/TasksSection";

export function TasksContent() {
  return (
    <div className="p-5 md:p-6">
      <div className="mb-4">
        <div className="text-[18px] md:text-[22px] text-text font-medium tracking-[-0.4px]">
          Tâches
        </div>
        <div className="text-[11.5px] text-text-3 mt-[2px]">
          Organisation et planification
        </div>
      </div>
      <TasksSection scope="global" />
    </div>
  );
}
```

- [ ] **Step 3: Ajouter l'entrée sidebar et bottom-nav**

Modifier `components/desktop/Sidebar.tsx` : ajouter une entrée `Tâches` avec icône `CheckSquare`, route `/tasks`, entre `Projets` et `Resources` (voir pattern existant).

Modifier `components/mobile/MobileBottomNav.tsx` selon l'espace disponible. Si saturé : laisser dans le menu plus / settings, ou bien remplacer une entrée moins prioritaire — décision à prendre selon le rendu actuel.

- [ ] **Step 4: Vérifier dans le navigateur**

```bash
npm run dev
# Aller sur /tasks
```

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/tasks/page.tsx components/views/TasksContent.tsx components/desktop/Sidebar.tsx components/mobile/MobileBottomNav.tsx
git commit -m "Add /tasks route and navigation entry"
```

---

### Task 17: Intégrer TasksSection dans la page projet

**Files:**
- Modify: `components/views/ProjectDetailContent.tsx`

- [ ] **Step 1: Insérer la section**

Juste après le header (avant l'historique des entrées) :

```tsx
import { TasksSection } from "@/components/views/tasks/TasksSection";

// ... dans le rendu, après le bloc projet info :
<section className="mb-6">
  <div className="text-[13px] text-text-2 uppercase tracking-wide mb-2">Tâches</div>
  <TasksSection scope={{ projectId: id }} />
</section>
```

- [ ] **Step 2: Vérifier visuellement**

```bash
npm run dev
# Ouvrir un projet
```

- [ ] **Step 3: Commit**

```bash
git add components/views/ProjectDetailContent.tsx
git commit -m "Embed TasksSection in project detail page"
```

---

### Task 18: LinkTasksControl + intégration stop-timer & EditEntryDialog

**Files:**
- Create: `components/views/tasks/LinkTasksControl.tsx`
- Modify: `components/desktop/TimerBar.tsx`
- Modify: `components/mobile/MobileTimerSheet.tsx`
- Modify: `components/EditEntryDialog.tsx`
- Modify: `lib/actions/timer.ts`

- [ ] **Step 1: Composant**

```tsx
// components/views/tasks/LinkTasksControl.tsx
"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";

interface Props {
  projectId: string | null;
  value: string[];
  onChange: (next: string[]) => void;
}

export function LinkTasksControl({ projectId, value, onChange }: Props) {
  const tasks = useStore((s) => s.tasks);
  const [showFree, setShowFree] = useState(false);

  const projectTasks = tasks.filter(
    (t) => t.projectId === projectId && t.status !== "done",
  ).slice(0, 8);
  const freeTasks = tasks.filter((t) => t.projectId === null && t.status !== "done");

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  const chip = (t: Task) => (
    <button
      key={t.id}
      type="button"
      onClick={() => toggle(t.id)}
      className={`px-2 py-1 rounded border text-[11px] ${
        value.includes(t.id)
          ? "border-text text-text bg-bg-2"
          : "border-border text-text-3 hover:text-text"
      }`}
    >
      {t.title}
    </button>
  );

  return (
    <div>
      <div className="text-[11px] text-text-3 mb-1.5">Tâches liées (optionnel)</div>
      {projectTasks.length === 0 ? (
        <div className="text-[11px] text-text-3 italic">Aucune tâche sur ce projet.</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">{projectTasks.map(chip)}</div>
      )}
      {freeTasks.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowFree((v) => !v)}
            className="text-[10.5px] text-text-3 hover:text-text"
          >
            {showFree ? "Masquer" : "Afficher"} tâches libres ({freeTasks.length})
          </button>
          {showFree && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">{freeTasks.map(chip)}</div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Étendre `stopTimerAndSave`**

Dans `lib/actions/timer.ts`, ajouter un 3e paramètre `taskIds?: string[]` :

```ts
export async function stopTimerAndSave(
  dateISO: string,
  note?: string,
  taskIds?: string[],
): Promise<StopTimerResult> {
  // ... après l'insert de time_entries, récupérer l'id et lier:
  const { data: inserted, error: insErr } = await supabase
    .from("time_entries")
    .insert({ /* ... */ })
    .select("id")
    .maybeSingle();
  if (insErr) return { ok: false, error: insErr.message };

  if (taskIds && taskIds.length > 0 && inserted?.id) {
    const rows = taskIds.map((task_id) => ({ entry_id: inserted.id, task_id }));
    await supabase.from("entry_tasks").insert(rows);
  }
  // ... reste inchangé
}
```

- [ ] **Step 3: TimerBar — modal stop avec sélection**

Dans `TimerBar.tsx`, la fonction `stopAndSave` actuelle déclenche probablement directement `stopTimerAndSave`. Modifier pour passer par un modal qui contient `LinkTasksControl` et le champ note. Pattern : ajouter un state `stopOpen` et un composant `<StopTimerDialog>` interne.

```tsx
// Dans TimerBar.tsx
const [stopOpen, setStopOpen] = useState(false);
const [stopNote, setStopNote] = useState("");
const [stopTaskIds, setStopTaskIds] = useState<string[]>([]);

const openStop = () => setStopOpen(true);
const confirmStop = () => {
  startTransition(async () => {
    await stopTimerAndSave(todayISO(), stopNote, stopTaskIds);
    setStopOpen(false);
    setStopNote("");
    setStopTaskIds([]);
    localPause(); localReset();
  });
};

// Dans le rendu, remplacer le bouton Square actuel pour appeler openStop()
// Ajouter le dialog :
{stopOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-md rounded-lg bg-bg-2 border border-border p-5">
      <div className="text-[14px] text-text mb-3">Arrêter et enregistrer</div>
      <textarea
        value={stopNote}
        onChange={(e) => setStopNote(e.target.value)}
        placeholder="Note (optionnel)"
        rows={2}
        className="w-full bg-bg border border-border rounded px-3 py-2 text-[12px] mb-3 resize-none"
      />
      <LinkTasksControl
        projectId={project?.id ?? null}
        value={stopTaskIds}
        onChange={setStopTaskIds}
      />
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => setStopOpen(false)} className="px-3 py-1.5 text-[12px] text-text-3">Annuler</button>
        <button onClick={confirmStop} disabled={pending} className="px-3 py-1.5 rounded bg-text text-bg text-[12px]">
          Enregistrer
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: Idem MobileTimerSheet**

Appliquer la même logique dans `components/mobile/MobileTimerSheet.tsx`.

- [ ] **Step 5: EditEntryDialog**

Dans `components/EditEntryDialog.tsx`, ajouter `LinkTasksControl` :
- Lire `entryTasks[entry.id]` au mount → état initial.
- Au save : appeler `linkEntryTasks(entry.id, selected)` après l'update existant.

- [ ] **Step 6: Vérifier**

```bash
npm run dev
# Démarrer un timer, l'arrêter, cocher 2 tâches, valider.
# Vérifier dans /tasks que les heures cumulées s'affichent.
```

- [ ] **Step 7: Commit**

```bash
git add components/views/tasks/LinkTasksControl.tsx \
        components/desktop/TimerBar.tsx \
        components/mobile/MobileTimerSheet.tsx \
        components/EditEntryDialog.tsx \
        lib/actions/timer.ts
git commit -m "Link time entries to tasks at stop-timer and edit"
```

---

## Phase 5 — Dashboard

### Task 19: TasksTodayCard (desktop) + MobileTasksToday

**Files:**
- Create: `components/desktop/TasksTodayCard.tsx`
- Create: `components/mobile/MobileTasksToday.tsx`
- Modify: `components/views/DashboardContent.tsx`

- [ ] **Step 1: Carte desktop**

```tsx
// components/desktop/TasksTodayCard.tsx
"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useStore, selectTodayTasks, selectCurrentUser } from "@/lib/store";
import { TaskRow } from "@/components/views/tasks/TaskRow";
import { TaskDialog } from "@/components/views/tasks/TaskDialog";
import type { Task } from "@/lib/types";

export function TasksTodayCard() {
  const me = useStore(selectCurrentUser);
  const today = useStore((s) => selectTodayTasks(s, me.id));
  const [editing, setEditing] = useState<Task | null>(null);

  return (
    <div className="rounded-lg border border-border bg-bg-2 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[13px] text-text-2">Tâches du jour</div>
        <Link href="/tasks" className="text-[11px] text-text-3 hover:text-text inline-flex items-center gap-1">
          Toutes <ArrowRight size={10} />
        </Link>
      </div>
      {today.length === 0 ? (
        <div className="text-[11.5px] text-text-3 py-2">Rien aujourd'hui.</div>
      ) : (
        <div>
          {today.slice(0, 3).map((t) => <TaskRow key={t.id} task={t} onOpen={setEditing} />)}
        </div>
      )}
      <TaskDialog open={!!editing} task={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
```

- [ ] **Step 2: Variant mobile**

Copier la logique dans `components/mobile/MobileTasksToday.tsx` en adaptant le wrapping/padding au pattern mobile existant (voir `MobileVersus`, `MobileStreak`).

- [ ] **Step 3: Brancher dans DashboardContent**

Ajouter `<TasksTodayCard />` desktop et `<MobileTasksToday />` mobile dans `DashboardContent.tsx`, à côté de `RecapPromptCard` / équivalent mobile.

- [ ] **Step 4: Commit**

```bash
git add components/desktop/TasksTodayCard.tsx \
        components/mobile/MobileTasksToday.tsx \
        components/views/DashboardContent.tsx
git commit -m "Add today's tasks card to dashboard"
```

---

### Task 20: Aperçu rival dans VersusCard

**Files:**
- Modify: `components/desktop/VersusCard.tsx`
- Modify: `components/mobile/MobileVersus.tsx`

- [ ] **Step 1: Sélecteur**

Ajouter dans `lib/store.ts` :

```ts
export function selectRivalTasksSummary(state: AppState, rivalId: UserId | undefined) {
  if (!rivalId) return { inProgress: 0, doneThisWeek: 0 };
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  let inProgress = 0;
  let doneThisWeek = 0;
  for (const t of state.tasks) {
    // tâches partagées des projets non-personnels uniquement
    const proj = t.projectId ? state.projects.find((p) => p.id === t.projectId) : null;
    if (!proj || proj.isPersonal) continue;
    if (t.assignedUserId !== null && t.assignedUserId !== rivalId) continue;
    if (t.status === "in_progress" && (t.assignedUserId === rivalId || t.assignedUserId === null)) inProgress++;
    if (
      t.status === "done"
      && t.completedBy === rivalId
      && t.completedAt
      && new Date(t.completedAt) >= monday
    ) doneThisWeek++;
  }
  return { inProgress, doneThisWeek };
}
```

- [ ] **Step 2: Ajouter une ligne dans VersusCard**

```tsx
const summary = useStore((s) => selectRivalTasksSummary(s, rival?.id));
// ... dans le rendu, juste avant la fin de la carte :
<div className="text-[11px] text-text-3 mt-2">
  {rival?.name} · {summary.inProgress} tâche{summary.inProgress > 1 ? "s" : ""} en cours · {summary.doneThisWeek} terminée{summary.doneThisWeek > 1 ? "s" : ""} cette semaine
</div>
```

- [ ] **Step 3: Idem mobile dans MobileVersus**

- [ ] **Step 4: Commit**

```bash
git add components/desktop/VersusCard.tsx components/mobile/MobileVersus.tsx lib/store.ts
git commit -m "Show rival tasks summary in versus card"
```

---

## Phase 6 — Polish & vérification

### Task 21: Vérification end-to-end

- [ ] **Step 1: Smoke test toutes les surfaces**

```bash
npm run dev
```

Scénarios :
1. Créer une tâche dans la page projet (vue liste).
2. Switcher en kanban, drag d'une carte vers "Terminées" → confirmer le push reçu (autre compte).
3. Switcher en calendrier, drag d'une tâche d'un jour à l'autre → date mise à jour.
4. Aller sur `/tasks`, filtrer par projet et priorité.
5. Démarrer un timer, l'arrêter, cocher 2 tâches, vérifier les heures cumulées affichées sur les tâches.
6. Modifier une entry existante, ajouter/retirer une liaison.
7. Vérifier la carte « Tâches du jour » sur le dashboard.
8. Vérifier la ligne aperçu rival.
9. Mobile : retester les flux critiques (stop timer, navigation, kanban scrollable horizontal).

- [ ] **Step 2: Linter + typecheck**

```bash
npm run lint && npx tsc --noEmit
```

- [ ] **Step 3: Build production**

```bash
npm run build
```

Expected: build OK.

- [ ] **Step 4: Commit final si correctifs**

```bash
git add -A && git commit -m "Polish tasks system"
```

---

## Self-review notes

- Spec coverage : chaque section du spec a une task associée (data: T1; types: T2; queries: T3; actions: T4; push: T5; store: T6; realtime: T7; UI core: T8-T15; intégration: T16-T18; dashboard: T19-T20; vérif: T21).
- RLS : la policy assume `projects.is_personal` et `projects.created_by`. Validé via step 1 de T1.
- Cohérence types : `TaskStatus`, `TaskPriority`, `Task`, `EntryTaskLink` définis en T2, utilisés partout via import `@/lib/types`.
- Drag-and-drop : `@dnd-kit` utilisé en T13 (kanban) et T14 (calendrier), installé en T8.
- Push : `notifyTaskCompleted` stub en T4, implémenté en T5 ; appelé depuis `updateTask` en T4.
- Mobile : explicitement traité (MobileTimerSheet T18, MobileTasksToday T19, MobileVersus T20, MobileBottomNav T16).
