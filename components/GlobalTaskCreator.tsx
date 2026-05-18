"use client";

import { useStore } from "@/lib/store";
import { TaskDialog } from "@/components/views/tasks/TaskDialog";

export function GlobalTaskCreator() {
  const open = useStore((s) => s.taskCreatorOpen);
  const close = useStore((s) => s.closeTaskCreator);
  return <TaskDialog open={open} onClose={close} />;
}
