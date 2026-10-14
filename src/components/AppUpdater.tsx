import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Keeps an installed app (Android / iPhone home-screen app) on the latest version.
 * A home-screen app is often resumed, not reloaded, so it can keep showing an old
 * version for days. This checks the server's current build whenever the app comes
 * back to the screen (and every 10 minutes while open). When a newer build is out
 * it reloads by itself if nothing is being typed, otherwise it offers "Update now".
 */
function currentBuild(): string | null {
  const s = [...document.querySelectorAll<HTMLScriptElement>("script[src]")]
    .map((x) => x.getAttribute("src") ?? "")
    .find((src) => /\/assets\/index-[\w-]+\.js/.test(src));
  return s ? (/index-[\w-]+\.js/.exec(s)?.[0] ?? null) : null;
}

async function serverBuild(): Promise<string | null> {
  try {
    const r = await fetch(`/?_v=${Date.now()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
    });
    if (!r.ok) return null;
    return /\/assets\/(index-[\w-]+\.js)/.exec(await r.text())?.[1] ?? null;
  } catch {
    return null; // offline: try again next time
  }
}

function busyTyping() {
  const el = document.activeElement;
  return Boolean(
    el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      (el as HTMLElement).isContentEditable),
  );
}

export function AppUpdater() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mine = currentBuild();
    if (!mine) return;
    let offered = false;

    const check = async () => {
      if (offered || document.visibilityState !== "visible") return;
      const latest = await serverBuild();
      if (!latest || latest === mine) return;
      offered = true;
      // Drop the old service worker so the next load comes fresh from the server.
      try {
        const regs = await navigator.serviceWorker?.getRegistrations?.();
        await Promise.all((regs ?? []).map((r) => r.update().catch(() => {})));
      } catch {
        /* ignore */
      }
      // Never loop: reload by itself only once per new build.
      let tried = "";
      try {
        tried = sessionStorage.getItem("saha-reloaded-for") ?? "";
      } catch {
        /* ignore */
      }
      if (!busyTyping() && tried !== latest) {
        try {
          sessionStorage.setItem("saha-reloaded-for", latest);
        } catch {
          /* ignore */
        }
        window.location.reload();
        return;
      }
      if (tried === latest) return;
      toast("A new version of Saha OS is ready", {
        description: "Save what you are typing, then update.",
        duration: Infinity,
        action: { label: "Update now", onClick: () => window.location.reload() },
      });
    };

    const onVisible = () => void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onVisible);
    const t = window.setInterval(onVisible, 10 * 60 * 1000);
    const first = window.setTimeout(onVisible, 15 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onVisible);
      window.clearInterval(t);
      window.clearTimeout(first);
    };
  }, []);
  return null;
}
