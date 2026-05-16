"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, Link2, Trash2, Upload, ExternalLink, FileText } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useStore, selectTaskAttachments } from "@/lib/store";
import { createClient as createBrowserSupabase } from "@/lib/supabase/browser";
import {
  addTaskFile,
  addTaskLink,
  removeTaskAttachment,
} from "@/lib/actions/tasks";

const BUCKET = "task-attachments";
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 Mo

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function TaskAttachmentsEditor({ taskId }: { taskId: string }) {
  const attachments = useStore(useShallow(selectTaskAttachments(taskId)));
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError("Fichier trop volumineux (max 25 Mo).");
      return;
    }
    setUploading(true);
    try {
      const supabase = createBrowserSupabase();
      const safeId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
      const path = `${taskId}/${safeId}${ext ? `.${ext}` : ""}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
      if (upErr) {
        setError(upErr.message || "Échec de l'upload.");
        setUploading(false);
        return;
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const res = await addTaskFile({
        taskId,
        name: file.name,
        storagePath: path,
        url: pub.publicUrl,
        sizeBytes: file.size,
        mime: file.type || null,
      });
      if (!res.ok) {
        setError(res.error ?? "Erreur lors de l'ajout.");
        await supabase.storage.from(BUCKET).remove([path]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setUploading(false);
    }
  };

  const submitLink = () => {
    setError(null);
    const url = linkUrl.trim();
    if (!url) return;
    startTransition(async () => {
      const res = await addTaskLink({
        taskId,
        name: linkName.trim() || url,
        url,
      });
      if (!res.ok) {
        setError(res.error ?? "Erreur.");
        return;
      }
      setLinkUrl("");
      setLinkName("");
      setLinkOpen(false);
    });
  };

  const remove = (id: string) => {
    setError(null);
    startTransition(async () => {
      const res = await removeTaskAttachment(id);
      if (!res.ok) setError(res.error ?? "Erreur.");
    });
  };

  return (
    <div className="border-t border-border pt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[11px] text-text-3 uppercase tracking-wide">
          <Paperclip size={11} strokeWidth={1.4} />
          Pièces jointes
          {attachments.length > 0 && (
            <span className="font-mono">· {attachments.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePickFile}
            disabled={uploading || pending}
            className="flex items-center gap-1 px-2 py-1 rounded border border-border text-[11px] text-text-2 hover:text-text hover:border-text-3 disabled:opacity-50"
          >
            <Upload size={11} strokeWidth={1.4} />
            {uploading ? "Upload…" : "Fichier"}
          </button>
          <button
            type="button"
            onClick={() => setLinkOpen((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded border border-border text-[11px] text-text-2 hover:text-text hover:border-text-3"
          >
            <Link2 size={11} strokeWidth={1.4} />
            Lien
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {linkOpen && (
        <div className="mb-2 flex flex-col gap-1.5 p-2 rounded bg-bg border border-border">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
            className="w-full bg-surface border border-border rounded px-2 py-1.5 text-[12px] text-text placeholder:text-text-3 focus:outline-none focus:border-text-3"
            autoFocus
          />
          <input
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="Libellé (optionnel)"
            className="w-full bg-surface border border-border rounded px-2 py-1.5 text-[12px] text-text placeholder:text-text-3 focus:outline-none focus:border-text-3"
            onKeyDown={(e) => {
              if (e.key === "Enter") submitLink();
            }}
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setLinkOpen(false);
                setLinkUrl("");
                setLinkName("");
              }}
              className="px-2 py-1 text-[11px] text-text-3 hover:text-text"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submitLink}
              disabled={pending || !linkUrl.trim()}
              className="px-2 py-1 rounded bg-text text-bg text-[11px] disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="text-[11px] text-text-3 italic py-1">
          Aucune pièce jointe.
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded border border-border bg-bg group"
            >
              {a.kind === "file" ? (
                <FileText
                  size={12}
                  strokeWidth={1.4}
                  className="text-text-2 shrink-0"
                />
              ) : (
                <Link2
                  size={12}
                  strokeWidth={1.4}
                  className="text-text-2 shrink-0"
                />
              )}
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 flex items-center gap-1.5 text-[12px] text-text hover:text-text-2 truncate"
              >
                <span className="truncate">{a.name}</span>
                <ExternalLink
                  size={10}
                  strokeWidth={1.4}
                  className="text-text-3 shrink-0"
                />
              </a>
              {a.kind === "file" && a.sizeBytes && (
                <span className="text-[10px] font-mono text-text-3 shrink-0">
                  {formatSize(a.sizeBytes)}
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(a.id)}
                disabled={pending}
                className="text-text-3 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                aria-label="Supprimer"
              >
                <Trash2 size={11} strokeWidth={1.4} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <div className="mt-1.5 text-[11px] text-red-400">{error}</div>}
    </div>
  );
}
