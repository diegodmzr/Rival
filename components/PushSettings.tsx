"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  subscribePush,
  unsubscribePush,
  sendTestPush,
} from "@/lib/actions/push";

type Status =
  | "loading"
  | "unsupported"
  | "needs-standalone"
  | "denied"
  | "idle"
  | "subscribed";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in window.navigator &&
    (window.navigator as { standalone?: boolean }).standalone === true;
  return mq || iosStandalone;
}

export function PushSettings() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const flash = (msg: string) => {
    setMessage(msg);
    setError(null);
    setTimeout(() => setMessage(null), 2500);
  };
  const flashError = (msg: string) => {
    setError(msg);
    setMessage(null);
    setTimeout(() => setError(null), 3500);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (isIOS() && !isStandalone()) {
        if (!cancelled) setStatus("needs-standalone");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (!cancelled) setStatus(existing ? "subscribed" : "idle");
      } catch {
        if (!cancelled) setStatus("idle");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = () => {
    if (!VAPID_PUBLIC_KEY) {
      flashError("Clé VAPID manquante côté client.");
      return;
    }
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus(permission === "denied" ? "denied" : "idle");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        const p256dh = sub.getKey("p256dh");
        const auth = sub.getKey("auth");
        if (!p256dh || !auth) throw new Error("Clés de souscription absentes.");
        const res = await subscribePush({
          endpoint: sub.endpoint,
          p256dh: bufferToBase64(p256dh),
          auth: bufferToBase64(auth),
          userAgent: navigator.userAgent,
        });
        if (!res.ok) throw new Error(res.error ?? "Erreur serveur.");
        setStatus("subscribed");
        flash("Notifications activées.");
      } catch (err) {
        flashError((err as Error).message);
      }
    });
  };

  const disable = () => {
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribePush(sub.endpoint);
          await sub.unsubscribe();
        }
        setStatus("idle");
        flash("Notifications désactivées.");
      } catch (err) {
        flashError((err as Error).message);
      }
    });
  };

  const test = () => {
    startTransition(async () => {
      const res = await sendTestPush();
      if (!res.ok) flashError(res.error ?? "Test échoué.");
      else flash("Notification envoyée.");
    });
  };

  return (
    <section className="bg-surface border border-border rounded-md px-[18px] py-4 mb-[14px]">
      <div className="flex items-center gap-2 mb-3">
        {status === "subscribed" ? (
          <Bell size={14} strokeWidth={1.3} className="text-text-2" />
        ) : (
          <BellOff size={14} strokeWidth={1.3} className="text-text-3" />
        )}
        <div className="text-[13px] text-text font-medium">Notifications</div>
      </div>

      {status === "loading" && (
        <div className="text-[12px] text-text-3">Chargement…</div>
      )}

      {status === "unsupported" && (
        <div className="text-[12px] text-text-3 leading-[1.5]">
          Ton navigateur ne supporte pas les notifications push.
        </div>
      )}

      {status === "needs-standalone" && (
        <div className="text-[12px] text-text-3 leading-[1.5]">
          Sur iPhone, ajoute d&apos;abord Rival à l&apos;écran d&apos;accueil
          (bouton Partager → « Sur l&apos;écran d&apos;accueil »), puis ouvre
          cette page depuis l&apos;icône pour activer les notifications.
        </div>
      )}

      {status === "denied" && (
        <div className="text-[12px] text-text-3 leading-[1.5]">
          Les notifications sont bloquées pour ce site. Autorise-les depuis les
          réglages du navigateur/de l&apos;app, puis recharge la page.
        </div>
      )}

      {(status === "idle" || status === "subscribed") && (
        <>
          <div className="text-[12px] text-text-2 leading-[1.5] mb-3">
            Reçois une notif quand l&apos;autre ajoute des heures, quand un
            timer tourne depuis trop longtemps, et un rappel le soir si ton
            recap du jour n&apos;est pas rempli.
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {status === "idle" ? (
              <button
                type="button"
                onClick={enable}
                disabled={pending}
                className="px-3 py-2 rounded-[5px] bg-text text-[#050505] text-[12px] font-medium border-0 cursor-pointer disabled:opacity-40"
              >
                {pending ? "…" : "Activer les notifications"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={test}
                  disabled={pending}
                  className="px-3 py-2 rounded-[5px] bg-surface2 border border-border text-[12px] text-text-2 hover:text-text hover:border-border-strong cursor-pointer disabled:opacity-40"
                >
                  {pending ? "…" : "Envoyer un test"}
                </button>
                <button
                  type="button"
                  onClick={disable}
                  disabled={pending}
                  className="px-3 py-2 rounded-[5px] bg-transparent border-0 text-[12px] text-text-3 hover:text-text cursor-pointer disabled:opacity-40"
                >
                  Désactiver
                </button>
              </>
            )}
            {message && (
              <span className="text-[11.5px] text-text-2">{message}</span>
            )}
            {error && <span className="text-[11.5px] text-text-3">{error}</span>}
          </div>
        </>
      )}
    </section>
  );
}
