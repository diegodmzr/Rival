"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { projectBreakdown } from "@/lib/compute";
import { fmt } from "@/lib/format";

export function ProjectsCard() {
  const entries = useStore((s) => s.entries);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const rivalId = Object.keys(users).find((i) => i !== currentUserId) ?? currentUserId;

  const breakdown = projectBreakdown(entries, 30, [currentUserId, rivalId]);
  const items = projects
    .filter((p) => !p.isPersonal)
    .map((p) => ({ project: p, stat: breakdown[p.id] ?? { projectId: p.id, hours: { [currentUserId]: 0, [rivalId]: 0 }, total: 0 } }))
    .sort((a, b) => b.stat.total - a.stat.total);
  const max = Math.max(...items.map((x) => x.stat.total), 0.01);

  return (
    <div className="bg-surface border border-border rounded-md px-[18px] py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-text font-medium">Répartition par projet</div>
        <Link href="/projects" className="text-[11px] text-text-3 font-mono hover:text-text">
          CE MOIS
        </Link>
      </div>
      <div className="flex flex-col gap-[10px]">
        {items.slice(0, 5).map(({ project, stat }) => (
          <div key={project.id}>
            <div className="flex justify-between text-[12px] mb-[5px]">
              <span className="text-text-2 truncate pr-2">{project.name}</span>
              <span className="font-mono text-text-3">{fmt(stat.total)}</span>
            </div>
            <div className="flex h-1 rounded-[2px] overflow-hidden bg-white/[0.04]">
              <div
                className="bg-text transition-[width] duration-300"
                style={{ width: `${((stat.hours[currentUserId] ?? 0) / max) * 100}%` }}
              />
              <div
                className="transition-[width] duration-300"
                style={{
                  width: `${((stat.hours[rivalId] ?? 0) / max) * 100}%`,
                  background: "rgba(250,250,250,0.30)",
                }}
              />
            </div>
          </div>
        ))}
        {items.every((x) => x.stat.total === 0) && (
          <div className="text-[11px] text-text-4 py-3">Aucune entrée sur 30 jours.</div>
        )}
      </div>
    </div>
  );
}
