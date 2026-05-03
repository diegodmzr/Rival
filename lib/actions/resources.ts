"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResourceKind, ResourceStatus } from "@/lib/types";

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export function parseYouTubeId(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;
  if (url.hostname.endsWith("youtu.be")) {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
  }
  if (url.pathname === "/watch") {
    const id = url.searchParams.get("v");
    return id && /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") {
    const id = parts[1];
    return id && /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
  }
  return null;
}

async function fetchYouTubeMeta(videoId: string): Promise<{ title: string | null }> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { cache: "no-store" },
    );
    if (!res.ok) return { title: null };
    const data = (await res.json()) as { title?: string };
    return { title: data.title?.trim() || null };
  } catch {
    return { title: null };
  }
}

export interface AddResourceInput {
  kind: ResourceKind;
  url: string;
  title?: string;
  description?: string;
  category?: string;
}

export async function addResource(
  input: AddResourceInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const url = (input.url || "").trim();
  if (!url) return { ok: false, error: "URL requise." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  let title = (input.title || "").trim();
  const description = (input.description || "").trim();
  const category = (input.category || "").trim();

  let youtubeId: string | null = null;
  let thumbnailUrl: string | null = null;

  if (input.kind === "youtube") {
    youtubeId = parseYouTubeId(url);
    if (!youtubeId) return { ok: false, error: "URL YouTube invalide." };
    thumbnailUrl = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
    if (!title) {
      const meta = await fetchYouTubeMeta(youtubeId);
      title = meta.title ?? "Vidéo YouTube";
    }
  } else if (input.kind === "pdf") {
    if (!title) {
      try {
        const u = new URL(url);
        const last = u.pathname.split("/").filter(Boolean).pop() ?? "";
        title = decodeURIComponent(last).replace(/\.pdf$/i, "") || "Document PDF";
      } catch {
        return { ok: false, error: "URL invalide." };
      }
    }
  } else {
    return { ok: false, error: "Type non supporté." };
  }

  const { data, error } = await supabase
    .from("resources")
    .insert({
      kind: input.kind,
      title,
      description,
      category,
      url,
      youtube_id: youtubeId,
      thumbnail_url: thumbnailUrl,
      added_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, id: data.id };
}

export async function deleteResource(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setResourceStatus(
  resourceId: string,
  status: ResourceStatus,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  if (status === "to_watch") {
    const { error } = await supabase
      .from("resource_views")
      .delete()
      .eq("resource_id", resourceId)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("resource_views")
      .upsert(
        { resource_id: resourceId, user_id: user.id, status },
        { onConflict: "resource_id,user_id" },
      );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
