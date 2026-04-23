"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  Folder,
  Clock,
  NotebookPen,
  Settings as SettingsIcon,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Avatar } from "@/components/primitives/Avatar";
import { useStore } from "@/lib/store";
import { signOut } from "@/lib/actions/user";

const NAV = [
  { href: "/", label: "Dashboard", Icon: Home, match: (p: string) => p === "/" },
  { href: "/stats", label: "Statistiques", Icon: BarChart3, match: (p: string) => p.startsWith("/stats") },
  { href: "/projects", label: "Projets", Icon: Folder, match: (p: string) => p.startsWith("/projects") },
  { href: "/history", label: "Historique", Icon: Clock, match: (p: string) => p.startsWith("/history") },
  { href: "/recap", label: "Recap", Icon: NotebookPen, match: (p: string) => p.startsWith("/recap") },
  { href: "/settings", label: "Paramètres", Icon: SettingsIcon, match: (p: string) => p.startsWith("/settings") },
];

export function Sidebar() {
  const pathname = usePathname() || "/";
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const currentUser = users[currentUserId];
  const team = Object.values(users);

  return (
    <aside className="w-[220px] flex-shrink-0 bg-surface border-r border-border flex flex-col px-[14px] py-5">
      <div className="flex items-center gap-[10px] px-2 py-[6px] mb-[18px]">
        <Image
          src="/logo-white.png"
          alt="Rival"
          width={22}
          height={22}
          priority
          className="rounded-[5px]"
        />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="text-[12.5px] font-medium text-text">Diego × Ismaël</div>
          <div className="text-[10.5px] text-text-3">Workspace</div>
        </div>
        <ChevronDown className="text-text-3" size={12} strokeWidth={1.4} />
      </div>

      <nav className="flex flex-col gap-[2px]">
        {NAV.map((it) => {
          const active = it.match(pathname);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-[10px] px-[9px] py-[7px] rounded-[5px] text-[13px] transition-colors ${
                active
                  ? "bg-white/[0.05] text-text font-medium"
                  : "bg-transparent text-text-2 font-normal hover:text-text hover:bg-white/[0.03]"
              }`}
            >
              <it.Icon size={14} strokeWidth={1.3} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="h-5" />
      <div className="text-[10px] text-text-4 uppercase tracking-[0.8px] px-[9px] mb-[6px]">
        Équipe
      </div>
      <div className="flex flex-col gap-[2px]">
        {team.map((u) => {
          const active = u.id === currentUserId;
          return (
            <div
              key={u.id}
              className={`flex items-center gap-[10px] px-[9px] py-[6px] rounded-[5px] text-[12.5px] ${
                active ? "text-text" : "text-text-2"
              }`}
            >
              <Avatar userId={u.id} size={18} active={active} />
              <span>{u.name}</span>
              {active && <span className="text-[10px] text-text-3 ml-auto font-mono">toi</span>}
            </div>
          );
        })}
      </div>

      <div className="flex-1" />

      {currentUser && (
        <div className="border-t border-border -mx-[14px] mt-3">
          <Link
            href="/settings"
            className="px-[23px] py-3 flex items-center gap-[10px] hover:bg-white/[0.02] transition-colors"
          >
            <Avatar userId={currentUserId} size={26} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-text font-medium truncate">{currentUser.name}</div>
              <div className="text-[10.5px] text-text-3 truncate">{currentUser.email}</div>
            </div>
            <SettingsIcon className="text-text-3" size={13} strokeWidth={1.3} />
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full px-[23px] py-[10px] flex items-center gap-[10px] text-[11.5px] text-text-3 hover:text-text hover:bg-white/[0.02] transition-colors bg-transparent border-0 border-t border-border cursor-pointer text-left"
            >
              <LogOut size={12} strokeWidth={1.3} />
              <span>Se déconnecter</span>
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
