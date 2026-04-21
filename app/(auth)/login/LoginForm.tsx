"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Mode = "login" | "signup";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(error.message);
          return;
        }
        router.push(next);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: name.trim() ? { name: name.trim() } : undefined,
          },
        });
        if (error) {
          setError(error.message);
          return;
        }
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setInfo(
            "Compte créé. Vérifie ta boîte mail pour confirmer, puis reviens te connecter.",
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-bg text-text p-6">
      <div className="w-full max-w-[380px]">
        <div className="mb-7">
          <div
            className="w-[28px] h-[28px] rounded-[6px] grid place-items-center text-[#050505] text-[12px] font-bold mb-4"
            style={{
              background: "linear-gradient(135deg, #fafafa 0%, #737373 100%)",
            }}
          >
            D·I
          </div>
          <div className="text-[22px] font-medium tracking-[-0.4px]">Diego × Ismaël</div>
          <div className="text-[12px] text-text-3 mt-1">
            Tracker de productivité privé
          </div>
        </div>

        {!configured ? (
          <div className="bg-surface border border-border rounded-md p-4 text-[12.5px] text-text-2 leading-[1.5]">
            Supabase n&apos;est pas encore configuré. Renseigne{" "}
            <span className="font-mono text-text">NEXT_PUBLIC_SUPABASE_URL</span> et{" "}
            <span className="font-mono text-text">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> dans{" "}
            <span className="font-mono text-text">.env.local</span>, puis redémarre le dev. Voir{" "}
            <span className="font-mono text-text">SETUP.md</span>.
          </div>
        ) : (
          <>
            <div className="flex gap-1 mb-4 bg-surface border border-border rounded-[6px] p-[3px]">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`flex-1 py-[7px] rounded-[4px] text-[12px] font-medium cursor-pointer border-0 ${
                  mode === "login"
                    ? "bg-white/[0.06] text-text"
                    : "bg-transparent text-text-3 hover:text-text-2"
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`flex-1 py-[7px] rounded-[4px] text-[12px] font-medium cursor-pointer border-0 ${
                  mode === "signup"
                    ? "bg-white/[0.06] text-text"
                    : "bg-transparent text-text-3 hover:text-text-2"
                }`}
              >
                Créer un compte
              </button>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3">
              {mode === "signup" && (
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono">
                    Nom
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Diego"
                    className="px-3 py-[10px] rounded-[6px] bg-surface border border-border text-[13px] text-text outline-none focus:border-border-strong"
                  />
                </label>
              )}
              <label className="flex flex-col gap-[6px]">
                <span className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono">
                  Email
                </span>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="px-3 py-[10px] rounded-[6px] bg-surface border border-border text-[13px] text-text outline-none focus:border-border-strong"
                />
              </label>
              <label className="flex flex-col gap-[6px]">
                <span className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono">
                  Mot de passe
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="px-3 py-[10px] rounded-[6px] bg-surface border border-border text-[13px] text-text outline-none focus:border-border-strong"
                />
              </label>
              <button
                type="submit"
                disabled={loading || !email || password.length < 6}
                className="py-[11px] rounded-[6px] bg-text text-[#050505] text-[13px] font-medium border-0 cursor-pointer disabled:opacity-40"
              >
                {loading
                  ? "…"
                  : mode === "login"
                    ? "Se connecter"
                    : "Créer le compte"}
              </button>
              {error && <div className="text-[11.5px] text-text-3">{error}</div>}
              {info && <div className="text-[11.5px] text-text-2">{info}</div>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
