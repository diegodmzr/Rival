"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { LogOut, Camera, Trash2 } from "lucide-react";
import { Avatar } from "@/components/primitives/Avatar";
import { useStore } from "@/lib/store";
import { exportEntriesCSV } from "@/lib/export";
import { updateProfile, uploadAvatar, removeAvatar, signOut } from "@/lib/actions/user";

export function SettingsContent() {
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const entries = useStore((s) => s.entries);
  const projects = useStore((s) => s.projects);

  const me = users[currentUserId];
  const team = Object.values(users);
  const others = team.filter((u) => u.id !== currentUserId);

  const [name, setName] = useState(me?.name ?? "");
  const [initials, setInitials] = useState(me?.initials ?? "");
  const [weeklyGoal, setWeeklyGoal] = useState<number>(me?.weeklyGoal ?? 40);
  const [monthlyGoal, setMonthlyGoal] = useState<number>(me?.monthlyGoal ?? 160);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [avatarPending, startAvatarTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!me) return;
    setName(me.name);
    setInitials(me.initials);
    setWeeklyGoal(me.weeklyGoal);
    setMonthlyGoal(me.monthlyGoal);
  }, [me?.id, me?.name, me?.initials, me?.weeklyGoal, me?.monthlyGoal]);

  if (!me) return null;

  const dirty =
    name !== me.name ||
    initials !== me.initials ||
    weeklyGoal !== me.weeklyGoal ||
    monthlyGoal !== me.monthlyGoal;

  const save = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await updateProfile({
        name: name.trim(),
        initials: initials.trim().toUpperCase(),
        weeklyGoal,
        monthlyGoal,
      });
      if (!res.ok) {
        setError(res.error ?? "Erreur inconnue.");
      } else {
        setMessage("Profil enregistré.");
        setTimeout(() => setMessage(null), 2500);
      }
    });
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    startAvatarTransition(async () => {
      const res = await uploadAvatar(form);
      if (!res.ok) setError(res.error ?? "Upload échoué.");
      else {
        setMessage("Photo mise à jour.");
        setTimeout(() => setMessage(null), 2500);
      }
    });
  };

  const onRemoveAvatar = () => {
    setError(null);
    setMessage(null);
    startAvatarTransition(async () => {
      const res = await removeAvatar();
      if (!res.ok) setError(res.error ?? "Erreur.");
      else {
        setMessage("Photo supprimée.");
        setTimeout(() => setMessage(null), 2500);
      }
    });
  };

  return (
    <div className="p-5 md:p-6 max-w-[720px]">
      <div className="mb-5">
        <div className="text-[18px] md:text-[22px] text-text font-medium tracking-[-0.4px]">
          Paramètres
        </div>
        <div className="text-[11.5px] text-text-3 mt-[2px]">
          Ton profil, tes objectifs et les données du workspace.
        </div>
      </div>

      <section className="bg-surface border border-border rounded-md px-[18px] py-4 mb-[14px]">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <Avatar userId={me.id} size={64} active={!me.avatarUrl} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarPending}
              aria-label="Changer la photo"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-text text-[#050505] border-2 border-surface grid place-items-center cursor-pointer disabled:opacity-40"
            >
              <Camera size={13} strokeWidth={1.6} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={onPickFile}
              className="hidden"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-text font-medium">{me.name}</div>
            <div className="text-[11px] text-text-3 truncate">{me.email}</div>
            <div className="flex items-center gap-3 mt-[6px]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarPending}
                className="text-[11px] text-text-2 hover:text-text bg-transparent border-0 cursor-pointer p-0 disabled:opacity-40"
              >
                {avatarPending ? "…" : me.avatarUrl ? "Changer la photo" : "Ajouter une photo"}
              </button>
              {me.avatarUrl && (
                <button
                  type="button"
                  onClick={onRemoveAvatar}
                  disabled={avatarPending}
                  className="inline-flex items-center gap-1 text-[11px] text-text-3 hover:text-text bg-transparent border-0 cursor-pointer p-0 disabled:opacity-40"
                >
                  <Trash2 size={11} strokeWidth={1.4} />
                  Retirer
                </button>
              )}
            </div>
          </div>
          <span className="text-[10px] text-text-3 font-mono uppercase tracking-[0.6px] self-start">
            toi
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Nom" value={name} onChange={setName} />
          <Field label="Initiales" value={initials} maxLength={3} onChange={setInitials} />
          <NumberField
            label="Objectif hebdo (h)"
            value={weeklyGoal}
            onChange={setWeeklyGoal}
          />
          <NumberField
            label="Objectif mensuel (h)"
            value={monthlyGoal}
            onChange={setMonthlyGoal}
          />
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            disabled={!dirty || pending}
            onClick={save}
            className="px-4 py-2 rounded-[5px] bg-text text-[#050505] text-[12px] font-medium border-0 cursor-pointer disabled:opacity-40"
          >
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
          {message && <span className="text-[11.5px] text-text-2">{message}</span>}
          {error && <span className="text-[11.5px] text-text-3">{error}</span>}
        </div>
      </section>

      {others.length > 0 && (
        <section className="bg-surface border border-border rounded-md px-[18px] py-4 mb-[14px]">
          <div className="text-[13px] text-text font-medium mb-3">Équipe</div>
          <div className="flex flex-col gap-2">
            {others.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 px-3 py-[10px] rounded-[6px] bg-surface2 border border-border"
              >
                <Avatar userId={u.id} size={24} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-text">{u.name}</div>
                  <div className="text-[11px] text-text-3 truncate">{u.email}</div>
                </div>
                <div className="text-[10.5px] text-text-3 font-mono">
                  {u.weeklyGoal}h/sem
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-surface border border-border rounded-md px-[18px] py-4 mb-[14px]">
        <div className="text-[13px] text-text font-medium mb-3">Données</div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => exportEntriesCSV(entries, users, projects)}
            className="px-3 py-2 rounded-[5px] bg-surface2 border border-border text-[12px] text-text-2 hover:text-text hover:border-border-strong cursor-pointer"
          >
            Exporter CSV
          </button>
        </div>
        <div className="text-[10.5px] text-text-4 mt-3 font-mono">
          {entries.length} entrées · {projects.length} projets · {team.length} membres
        </div>
      </section>

      <section className="bg-surface border border-border rounded-md px-[18px] py-4 mb-[14px]">
        <div className="text-[13px] text-text font-medium mb-3">Session</div>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-[5px] bg-surface2 border border-border text-[12px] text-text-2 hover:text-text hover:border-border-strong cursor-pointer"
          >
            <LogOut size={12} strokeWidth={1.3} />
            Se déconnecter
          </button>
        </form>
      </section>
      <div className="h-10" />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-[6px]">
      <span className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="px-3 py-[9px] rounded-[5px] bg-surface2 border border-border text-[13px] text-text outline-none focus:border-border-strong"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-[6px]">
      <span className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono">
        {label}
      </span>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className="px-3 py-[9px] rounded-[5px] bg-surface2 border border-border text-[13px] text-text outline-none font-mono focus:border-border-strong"
      />
    </label>
  );
}
