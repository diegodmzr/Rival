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
