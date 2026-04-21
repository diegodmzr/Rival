"use client";

import { useEffect } from "react";
import { useStore, type ServerSnapshot } from "@/lib/store";

export function StoreHydrator({ data }: { data: ServerSnapshot }) {
  useEffect(() => {
    useStore.getState().hydrate(data);
  }, [data]);
  return null;
}
