"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Plus,
  X,
  Search,
  Youtube,
  FileText,
  Eye,
  RotateCw,
  Check,
  Trash2,
  ExternalLink,
  Filter,
  Library,
  Play,
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import { useStore, selectCurrentUser, selectRivalUser } from "@/lib/store";
import { Avatar } from "@/components/primitives/Avatar";
import {
  addResource,
  deleteResource,
  setResourceStatus,
} from "@/lib/actions/resources";
import { RESOURCE_FILES_BUCKET } from "@/lib/resources";
import { createClient as createBrowserSupabase } from "@/lib/supabase/browser";
import type {
  Resource,
  ResourceKind,
  ResourceStatus,
  ResourceView,
  UserId,
} from "@/lib/types";

type KindFilter = "all" | ResourceKind;
type StatusFilter = "all" | ResourceStatus;

const STATUS_LABEL: Record<ResourceStatus, string> = {
  to_watch: "À voir",
  watched: "Visionné",
  rewatch: "À re-regarder",
};

const STATUS_CYCLE: ResourceStatus[] = ["to_watch", "watched", "rewatch"];

function statusFor(
  views: ResourceView[],
  resourceId: string,
  userId: UserId,
): ResourceStatus {
  const v = views.find((x) => x.resourceId === resourceId && x.userId === userId);
  return v ? v.status : "to_watch";
}

function StatusDot({ status }: { status: ResourceStatus }) {
  if (status === "watched") {
    return (
      <span className="w-[6px] h-[6px] rounded-full bg-text-2 inline-block" />
    );
  }
  if (status === "rewatch") {
    return (
      <span className="w-[6px] h-[6px] rounded-full bg-amber-200/80 inline-block" />
    );
  }
  return <span className="w-[6px] h-[6px] rounded-full bg-white/15 inline-block" />;
}

export function ResourcesContent() {
  const me = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);
  const resources = useStore((s) => s.resources);
  const views = useStore((s) => s.resourceViews);

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [player, setPlayer] = useState<Resource | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) {
      if (r.category) set.add(r.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [resources]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      if (kindFilter !== "all" && r.kind !== kindFilter) return false;
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (statusFilter !== "all") {
        const mine = statusFor(views, r.id, me.id);
        if (mine !== statusFilter) return false;
      }
      if (q) {
        const hay = `${r.title} ${r.description} ${r.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [resources, kindFilter, categoryFilter, statusFilter, search, views, me.id]);

  const grouped = useMemo(() => {
    const map = new Map<string, Resource[]>();
    for (const r of filtered) {
      const key = r.category || "Sans catégorie";
      const arr = map.get(key);
      if (arr) arr.push(r);
      else map.set(key, [r]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "Sans catégorie") return 1;
      if (b === "Sans catégorie") return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  return (
    <div className="p-5 md:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-[18px] md:text-[22px] text-text font-medium tracking-[-0.4px]">
            Ressources
          </div>
          <div className="text-[11.5px] text-text-3 mt-[2px]">
            {resources.length} ressource{resources.length > 1 ? "s" : ""} partagée
            {resources.length > 1 ? "s" : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-[12px] py-[8px] rounded-md bg-text text-[#050505] border-0 text-[12px] font-medium cursor-pointer hover:opacity-90"
        >
          <Plus size={13} strokeWidth={1.5} />
          Ajouter
        </button>
      </div>

      {/* Search + kind chips */}
      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-md px-3 py-[9px]">
          <Search size={13} strokeWidth={1.3} className="text-text-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une ressource…"
            className="flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-4"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-text-3 hover:text-text bg-transparent border-0 cursor-pointer"
            >
              <X size={12} strokeWidth={1.3} />
            </button>
          )}
        </div>
        <div className="flex gap-[4px] bg-surface border border-border rounded-md p-[3px]">
          {(["all", "youtube", "pdf"] as const).map((k) => {
            const active = kindFilter === k;
            const Icon = k === "youtube" ? Youtube : k === "pdf" ? FileText : Library;
            const label = k === "all" ? "Tout" : k === "youtube" ? "Vidéos" : "Documents";
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKindFilter(k)}
                className={`flex items-center gap-[6px] px-[10px] py-[6px] rounded-[5px] text-[11.5px] cursor-pointer border-0 ${
                  active
                    ? "bg-white/[0.07] text-text"
                    : "bg-transparent text-text-3 hover:text-text-2"
                }`}
              >
                <Icon size={12} strokeWidth={1.4} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status filter (mine) */}
      <div className="flex flex-wrap items-center gap-[6px] mb-3">
        <span className="text-[10.5px] text-text-4 uppercase tracking-[0.6px] font-mono mr-1 flex items-center gap-1">
          <Filter size={10} strokeWidth={1.4} />
          Mon statut
        </span>
        {(["all", "to_watch", "watched", "rewatch"] as const).map((s) => {
          const active = statusFilter === s;
          const label = s === "all" ? "Tous" : STATUS_LABEL[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-[10px] py-[5px] rounded-full text-[11px] cursor-pointer border ${
                active
                  ? "bg-white/[0.08] border-border-strong text-text"
                  : "bg-surface border-border text-text-3 hover:text-text-2"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-[6px] mb-5">
          <span className="text-[10.5px] text-text-4 uppercase tracking-[0.6px] font-mono mr-1">
            Catégorie
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter(null)}
            className={`px-[10px] py-[5px] rounded-full text-[11px] cursor-pointer border ${
              categoryFilter === null
                ? "bg-white/[0.08] border-border-strong text-text"
                : "bg-surface border-border text-text-3 hover:text-text-2"
            }`}
          >
            Toutes
          </button>
          {categories.map((c) => {
            const active = categoryFilter === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(active ? null : c)}
                className={`px-[10px] py-[5px] rounded-full text-[11px] cursor-pointer border ${
                  active
                    ? "bg-white/[0.08] border-border-strong text-text"
                    : "bg-surface border-border text-text-3 hover:text-text-2"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-md px-4 py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-surface2 border border-border grid place-items-center mx-auto mb-3 text-text-3">
            <Library size={16} strokeWidth={1.3} />
          </div>
          <div className="text-[13px] text-text-2">
            {resources.length === 0
              ? "Aucune ressource pour le moment."
              : "Aucune ressource ne correspond à ces filtres."}
          </div>
          <div className="text-[11.5px] text-text-3 mt-1">
            {resources.length === 0
              ? "Ajoute une vidéo YouTube ou un PDF pour commencer."
              : "Essaie de retirer un filtre."}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([cat, items]) => (
            <div key={cat}>
              <div className="text-[10.5px] text-text-3 uppercase tracking-[0.8px] font-mono mb-2">
                {cat}{" "}
                <span className="text-text-4">
                  · {items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    meId={me.id}
                    rivalId={rival.id}
                    rivalName={rival.name}
                    views={views}
                    onPlay={() => setPlayer(r)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="h-10" />

      {showAdd && <AddResourceDialog onClose={() => setShowAdd(false)} />}
      {player && (
        <PlayerDialog resource={player} onClose={() => setPlayer(null)} />
      )}
    </div>
  );
}

function ResourceCard({
  resource,
  meId,
  rivalId,
  rivalName,
  views,
  onPlay,
}: {
  resource: Resource;
  meId: UserId;
  rivalId: UserId;
  rivalName: string;
  views: ResourceView[];
  onPlay: () => void;
}) {
  const myStatus = statusFor(views, resource.id, meId);
  const rivalStatus = statusFor(views, resource.id, rivalId);
  const watched = myStatus === "watched";
  const isOwn = resource.addedBy === meId;
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  const cycle = () => {
    const next =
      STATUS_CYCLE[(STATUS_CYCLE.indexOf(myStatus) + 1) % STATUS_CYCLE.length];
    startTransition(async () => {
      await setResourceStatus(resource.id, next);
    });
  };

  const pickStatus = (s: ResourceStatus) => {
    setMenuOpen(false);
    startTransition(async () => {
      await setResourceStatus(resource.id, s);
    });
  };

  const handleDelete = () => {
    if (!confirm("Supprimer cette ressource ?")) return;
    startTransition(async () => {
      await deleteResource(resource.id);
    });
  };

  const handleOpen = () => {
    if (resource.kind === "youtube") onPlay();
    else window.open(resource.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`group bg-surface border border-border rounded-md overflow-hidden flex flex-col transition-opacity ${
        watched ? "opacity-55" : "opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Ouvrir ${resource.title}`}
        className="relative w-full aspect-video bg-surface2 border-0 p-0 cursor-pointer overflow-hidden"
      >
        {resource.kind === "youtube" && resource.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resource.thumbnailUrl}
            alt=""
            className={`w-full h-full object-cover transition-all duration-300 ${
              watched ? "grayscale" : "grayscale-0 group-hover:scale-[1.02]"
            }`}
          />
        ) : (
          <div className="w-full h-full grid place-items-center bg-gradient-to-br from-[#111] to-[#0a0a0a]">
            <FileText size={36} strokeWidth={1.1} className="text-text-3" />
          </div>
        )}

        {/* Kind badge */}
        <div className="absolute top-2 left-2 flex items-center gap-[5px] px-[7px] py-[3px] rounded-[4px] bg-black/70 backdrop-blur-sm border border-white/[0.08]">
          {resource.kind === "youtube" ? (
            <>
              <Youtube size={11} strokeWidth={1.4} className="text-[#ff5252]" />
              <span className="text-[9.5px] font-mono uppercase tracking-[0.6px] text-text-2">
                YouTube
              </span>
            </>
          ) : (
            <>
              <FileText size={11} strokeWidth={1.4} className="text-text-2" />
              <span className="text-[9.5px] font-mono uppercase tracking-[0.6px] text-text-2">
                PDF
              </span>
            </>
          )}
        </div>

        {/* Watched overlay tick */}
        {watched && (
          <div className="absolute top-2 right-2 w-[22px] h-[22px] rounded-full bg-black/75 border border-white/10 grid place-items-center">
            <Check size={12} strokeWidth={1.6} className="text-text" />
          </div>
        )}
        {!watched && myStatus === "rewatch" && (
          <div className="absolute top-2 right-2 px-[7px] py-[3px] rounded-[4px] bg-amber-200/15 border border-amber-200/30 text-amber-100 text-[9.5px] font-mono uppercase tracking-[0.6px]">
            À revoir
          </div>
        )}

        {/* Hover play */}
        {resource.kind === "youtube" && !watched && (
          <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-black/70 border border-white/15 grid place-items-center">
              <Play
                size={18}
                strokeWidth={1.6}
                className="text-text translate-x-[1px]"
              />
            </div>
          </div>
        )}
      </button>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-text font-medium leading-[1.3] line-clamp-2">
              {resource.title}
            </div>
            {resource.description && (
              <div className="text-[11.5px] text-text-3 mt-1 line-clamp-2 leading-[1.4]">
                {resource.description}
              </div>
            )}
          </div>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ouvrir dans un nouvel onglet"
            className="text-text-3 hover:text-text shrink-0 mt-[2px]"
          >
            <ExternalLink size={12} strokeWidth={1.3} />
          </a>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 text-[10.5px] text-text-3 font-mono">
            <span className="flex items-center gap-[4px]">
              <Avatar userId={rivalId} size={14} />
              <StatusDot status={rivalStatus} />
              <span className="hidden sm:inline">
                {rivalStatus === "to_watch"
                  ? `${rivalName} pas vu`
                  : `${rivalName} ${STATUS_LABEL[rivalStatus].toLowerCase()}`}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1 relative">
            {isOwn && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                aria-label="Supprimer"
                className="w-[26px] h-[26px] grid place-items-center rounded-[5px] text-text-3 hover:text-text hover:bg-white/[0.04] bg-transparent border-0 cursor-pointer disabled:opacity-40"
              >
                <Trash2 size={11} strokeWidth={1.3} />
              </button>
            )}
            <button
              type="button"
              onClick={cycle}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenuOpen((v) => !v);
              }}
              disabled={pending}
              className={`flex items-center gap-[5px] px-[8px] py-[5px] rounded-[5px] text-[10.5px] cursor-pointer border ${
                myStatus === "watched"
                  ? "bg-white/[0.06] border-border-strong text-text"
                  : myStatus === "rewatch"
                    ? "bg-amber-200/10 border-amber-200/25 text-amber-100"
                    : "bg-surface2 border-border text-text-2 hover:text-text"
              }`}
            >
              {myStatus === "watched" ? (
                <Check size={11} strokeWidth={1.5} />
              ) : myStatus === "rewatch" ? (
                <RotateCw size={11} strokeWidth={1.5} />
              ) : (
                <Eye size={11} strokeWidth={1.5} />
              )}
              {STATUS_LABEL[myStatus]}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Changer le statut"
              className="text-text-3 hover:text-text bg-transparent border-0 cursor-pointer px-1"
            >
              <span className="text-[10px]">▾</span>
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-[150px] bg-surface border border-border-strong rounded-md py-[4px] shadow-xl">
                  {STATUS_CYCLE.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => pickStatus(s)}
                      className={`w-full text-left px-3 py-[7px] text-[11.5px] flex items-center gap-2 bg-transparent border-0 cursor-pointer ${
                        s === myStatus ? "text-text" : "text-text-2 hover:text-text"
                      } hover:bg-white/[0.04]`}
                    >
                      <StatusDot status={s} />
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerDialog({
  resource,
  onClose,
}: {
  resource: Resource;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[860px] bg-surface border border-border-strong rounded-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-[10px] border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <Youtube size={13} strokeWidth={1.4} className="text-[#ff5252]" />
            <div className="text-[12.5px] text-text font-medium truncate">
              {resource.title}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-text-3 hover:text-text bg-transparent border-0 cursor-pointer p-1"
          >
            <X size={16} strokeWidth={1.3} />
          </button>
        </div>
        <div className="aspect-video bg-black">
          {resource.youtubeId && (
            <iframe
              src={`https://www.youtube.com/embed/${resource.youtubeId}?autoplay=1&rel=0`}
              title={resource.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AddResourceDialog({ onClose }: { onClose: () => void }) {
  const resources = useStore((s) => s.resources);
  const me = useStore(selectCurrentUser);
  const [kind, setKind] = useState<ResourceKind>("youtube");
  const [pdfMode, setPdfMode] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) if (r.category) set.add(r.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [resources]);

  const onFilePick = (f: File | null) => {
    if (!f) {
      setFile(null);
      return;
    }
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError("Fichier trop lourd (max 50 Mo).");
      return;
    }
    setError(null);
    setFile(f);
    if (!title.trim()) {
      setTitle(f.name.replace(/\.pdf$/i, ""));
    }
  };

  const submit = async () => {
    setError(null);

    if (kind === "pdf" && pdfMode === "upload") {
      if (!file) {
        setError("Sélectionne un fichier PDF.");
        return;
      }
      setPending(true);
      try {
        const supabase = createBrowserSupabase();
        const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
        const safeId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const path = `${me.id}/${safeId}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from(RESOURCE_FILES_BUCKET)
          .upload(path, file, {
            contentType: "application/pdf",
            upsert: false,
          });
        if (upErr) {
          setPending(false);
          setError(upErr.message || "Échec de l'upload.");
          return;
        }

        const { data: pub } = supabase.storage
          .from(RESOURCE_FILES_BUCKET)
          .getPublicUrl(path);

        const res = await addResource({
          kind: "pdf",
          url: pub.publicUrl,
          storagePath: path,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          category: category.trim() || undefined,
        });
        setPending(false);
        if (!res.ok) {
          setError(res.error ?? "Erreur lors de l'ajout.");
          return;
        }
        onClose();
      } catch (e) {
        setPending(false);
        setError(e instanceof Error ? e.message : "Erreur inattendue.");
      }
      return;
    }

    if (!url.trim()) {
      setError("URL requise.");
      return;
    }
    startTransition(async () => {
      const res = await addResource({
        kind,
        url: url.trim(),
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error ?? "Erreur lors de l'ajout.");
        return;
      }
      onClose();
    });
  };

  const submitDisabled =
    pending ||
    (kind === "pdf" && pdfMode === "upload" ? !file : !url.trim());

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[90] bg-black/60 flex items-end md:items-center justify-center animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:w-[480px] rounded-t-2xl md:rounded-2xl bg-surface border border-border-strong px-[18px] pt-2 pb-7 animate-slideUp max-h-[90vh] overflow-y-auto"
      >
        <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mt-[6px] mb-[14px] md:hidden" />
        <div className="flex items-center justify-between mb-[14px]">
          <div className="text-[15px] text-text font-medium">
            Ajouter une ressource
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-text-3 cursor-pointer bg-transparent border-0 p-1"
          >
            <X size={18} strokeWidth={1.3} />
          </button>
        </div>

        <div className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono mb-[6px]">
          Type
        </div>
        <div className="flex gap-[6px] mb-3">
          {(["youtube", "pdf"] as const).map((k) => {
            const active = kind === k;
            const Icon = k === "youtube" ? Youtube : FileText;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 flex items-center justify-center gap-2 py-[10px] rounded-md cursor-pointer border text-[12px] ${
                  active
                    ? "bg-white/[0.08] border-border-strong text-text"
                    : "bg-surface2 border-border text-text-2"
                }`}
              >
                <Icon
                  size={13}
                  strokeWidth={1.4}
                  className={k === "youtube" && active ? "text-[#ff5252]" : ""}
                />
                {k === "youtube" ? "Vidéo YouTube" : "Document PDF"}
              </button>
            );
          })}
        </div>

        {kind === "pdf" && (
          <div className="flex gap-[4px] bg-surface2 border border-border rounded-md p-[3px] mb-2">
            {(["upload", "url"] as const).map((m) => {
              const active = pdfMode === m;
              const Icon = m === "upload" ? Upload : LinkIcon;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPdfMode(m)}
                  className={`flex-1 flex items-center justify-center gap-[6px] py-[7px] rounded-[5px] cursor-pointer text-[11.5px] border-0 ${
                    active
                      ? "bg-white/[0.07] text-text"
                      : "bg-transparent text-text-3 hover:text-text-2"
                  }`}
                >
                  <Icon size={12} strokeWidth={1.4} />
                  {m === "upload" ? "Importer" : "Lien externe"}
                </button>
              );
            })}
          </div>
        )}

        {kind === "pdf" && pdfMode === "upload" ? (
          <div className="mb-3">
            <label
              className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-md border-2 border-dashed cursor-pointer transition-colors ${
                file
                  ? "border-border-strong bg-white/[0.03]"
                  : "border-border bg-surface2 hover:border-border-strong hover:bg-white/[0.02]"
              }`}
            >
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => onFilePick(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {file ? (
                <>
                  <FileText size={20} strokeWidth={1.3} className="text-text-2" />
                  <div className="text-[12.5px] text-text font-medium truncate max-w-full">
                    {file.name}
                  </div>
                  <div className="text-[10.5px] text-text-3 font-mono">
                    {(file.size / (1024 * 1024)).toFixed(2)} Mo
                  </div>
                  <div className="text-[10.5px] text-text-4 mt-1">
                    Cliquer pour changer de fichier
                  </div>
                </>
              ) : (
                <>
                  <Upload size={20} strokeWidth={1.3} className="text-text-3" />
                  <div className="text-[12.5px] text-text-2">
                    Glisse ou clique pour choisir un PDF
                  </div>
                  <div className="text-[10.5px] text-text-4 font-mono">
                    PDF · jusqu&apos;à 50 Mo
                  </div>
                </>
              )}
            </label>
          </div>
        ) : (
          <>
            <div className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono mb-[6px]">
              {kind === "youtube" ? "Lien YouTube" : "Lien PDF"}
            </div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                kind === "youtube"
                  ? "https://www.youtube.com/watch?v=…"
                  : "https://example.com/doc.pdf"
              }
              className="w-full px-3 py-[10px] rounded-md bg-surface2 border border-border text-text text-[12.5px] outline-none mb-3 font-mono"
            />
          </>
        )}

        <div className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono mb-[6px]">
          Titre
          {kind === "youtube" && (
            <span className="text-text-4 normal-case tracking-normal ml-2">
              (auto-rempli si vide)
            </span>
          )}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la ressource…"
          className="w-full px-3 py-[10px] rounded-md bg-surface2 border border-border text-text text-[13px] outline-none mb-3"
        />

        <div className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono mb-[6px]">
          Catégorie
        </div>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Marketing, Code, Mindset…"
          list="resource-categories"
          className="w-full px-3 py-[10px] rounded-md bg-surface2 border border-border text-text text-[13px] outline-none mb-2"
        />
        <datalist id="resource-categories">
          {existingCategories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {existingCategories.length > 0 && (
          <div className="flex flex-wrap gap-[6px] mb-3">
            {existingCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className="px-[9px] py-[4px] rounded-full text-[10.5px] bg-surface2 border border-border text-text-3 hover:text-text cursor-pointer"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono mb-[6px]">
          Description
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Pourquoi cette ressource vaut le coup…"
          rows={3}
          className="w-full px-3 py-[10px] rounded-md bg-surface2 border border-border text-text text-[13px] outline-none resize-none mb-3"
        />

        {error && (
          <div className="text-[11.5px] text-text-2 bg-surface2 border border-border rounded-md px-3 py-2 mb-2">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={submitDisabled}
          className="w-full py-[12px] rounded-md bg-text text-[#050505] border-0 text-[13px] font-medium cursor-pointer disabled:opacity-40"
        >
          {pending
            ? kind === "pdf" && pdfMode === "upload"
              ? "Upload en cours…"
              : "Ajout…"
            : "Ajouter à la bibliothèque"}
        </button>
      </div>
    </div>
  );
}
