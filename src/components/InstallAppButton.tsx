import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    setHint(true);
    window.setTimeout(() => setHint(false), 6000);
  };

  return (
    <div className="fixed bottom-20 left-4 z-[200] flex flex-col items-start gap-2 md:bottom-6 md:left-auto md:right-6 md:items-end">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Download / install Saha OS app"
        title="Download / install app"
        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-lg backdrop-blur transition-transform hover:scale-105"
      >
        <span className="material-symbols-outlined text-base leading-none">download</span>
        <span className="hidden sm:inline">Download app</span>
      </button>
      {hint ? (
        <div className="max-w-[240px] rounded-lg border border-border bg-card px-3 py-2 text-[11px] leading-snug text-card-foreground shadow-lg">
          To install: open the browser menu and choose{" "}
          <strong>Add to Home screen</strong> (Android) or{" "}
          <strong>Share → Add to Home Screen</strong> (iPhone).
        </div>
      ) : null}
    </div>
  );
}
