import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Public download page: https://radiant-portal-app.dshra1.workers.dev/install
 * One link (or the QR code) for the site team. Android installs the app with one
 * tap; iPhone / iPad get the Safari steps; a computer shows the QR code to scan.
 * No sign-in needed to see this page; the app asks for it after it opens.
 */
export const Route = createFileRoute("/install")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Download Saha OS — Android and iPhone" },
      {
        name: "description",
        content: "Install the Saha OS app on Android or iPhone from one link.",
      },
      { property: "og:title", content: "Download Saha OS" },
      { property: "og:description", content: "Install the Saha OS app on Android or iPhone." },
      { property: "og:image", content: "/app-icon-512.png" },
    ],
  }),
  component: InstallPage,
});

const LINK = "https://radiant-portal-app.dshra1.workers.dev/install";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Device = "android" | "ios" | "ios-other-browser" | "desktop";

function detect(): Device {
  const ua = navigator.userAgent;
  const ios =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//i.test(ua) ? "ios-other-browser" : "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function InstallPage() {
  const [device, setDevice] = useState<Device>("desktop");
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDevice(detect());
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(LINK);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* the link is shown on the page to copy by hand */
    }
  }

  return (
    <div className="min-h-screen bg-[#0C1F17] px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center gap-4">
          <img
            src="/app-icon-192.png"
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-2xl shadow-lg"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Saha Developers
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">Download Saha OS</h1>
            <p className="text-sm text-white/70">Android · iPhone · iPad</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
          {installed ? (
            <Done />
          ) : device === "android" ? (
            <Android canInstall={Boolean(prompt)} onInstall={install} />
          ) : device === "ios" ? (
            <IOS />
          ) : device === "ios-other-browser" ? (
            <IOSOtherBrowser onCopy={copy} copied={copied} />
          ) : (
            <Desktop onCopy={copy} copied={copied} />
          )}
        </div>

        <details className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          <summary className="cursor-pointer font-semibold text-white">
            Steps for the other phone
          </summary>
          <div className="mt-3 space-y-4">
            <div>
              <p className="font-semibold text-emerald-300">Android (Chrome)</p>
              <p>
                Open this link in Chrome → tap <b>Install app</b> on this page, or Chrome menu ⋮ →{" "}
                <b>Install app</b>.
              </p>
            </div>
            <div>
              <p className="font-semibold text-emerald-300">iPhone / iPad (Safari)</p>
              <p>
                Open this link in Safari → <b>Share</b> → <b>Add to Home Screen</b> → <b>Add</b>.
              </p>
            </div>
          </div>
        </details>

        <p className="mt-6 text-center text-xs text-white/50">
          The app updates itself; there is nothing to download again. Sign in once on each phone.
        </p>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
        {n}
      </span>
      <span className="pt-0.5 text-[15px] leading-snug text-white/90">{children}</span>
    </li>
  );
}

function Android({ canInstall, onInstall }: { canInstall: boolean; onInstall: () => void }) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onInstall}
        disabled={!canInstall}
        className="w-full rounded-xl bg-emerald-500 px-4 py-4 text-lg font-bold text-[#0C1F17] shadow-lg transition disabled:opacity-40"
      >
        Install app
      </button>
      {!canInstall && (
        <ol className="space-y-3">
          <Step n={1}>
            If the button stays grey, open the Chrome menu <b>⋮</b> (top right).
          </Step>
          <Step n={2}>
            Tap <b>Install app</b> (or <b>Add to Home screen</b>).
          </Step>
          <Step n={3}>
            Open <b>Saha OS</b> from the home screen and sign in.
          </Step>
        </ol>
      )}
    </div>
  );
}

function IOS() {
  return (
    <ol className="space-y-4">
      <Step n={1}>
        Tap <b>Share</b> at the bottom of Safari (the square with the arrow ↑).
      </Step>
      <Step n={2}>
        Scroll down and tap <b>Add to Home Screen</b>.
      </Step>
      <Step n={3}>
        Tap <b>Add</b>. <b>Saha OS</b> is now on the home screen; open it and sign in.
      </Step>
    </ol>
  );
}

function IOSOtherBrowser({ onCopy, copied }: { onCopy: () => void; copied: boolean }) {
  return (
    <div className="space-y-4">
      <p className="text-[15px] text-white/90">
        On iPhone the app installs from <b>Safari</b> only. Copy the link and open it in Safari.
      </p>
      <button
        type="button"
        onClick={onCopy}
        className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-base font-bold text-[#0C1F17]"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
      <p className="break-all text-center text-xs text-white/60">{LINK}</p>
    </div>
  );
}

function Desktop({ onCopy, copied }: { onCopy: () => void; copied: boolean }) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-[15px] text-white/90">Scan with the phone camera to download the app.</p>
      <img
        src="/install-qr.svg"
        alt="QR code for the Saha OS download link"
        width={220}
        height={220}
        className="mx-auto h-56 w-56 rounded-xl bg-white p-2"
      />
      <p className="break-all text-xs text-white/60">{LINK}</p>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white"
      >
        {copied ? "Link copied" : "Copy link to send on WhatsApp"}
      </button>
    </div>
  );
}

function Done() {
  return (
    <div className="space-y-4 text-center">
      <p className="text-lg font-bold">Saha OS is installed.</p>
      <a
        href="/"
        className="inline-block w-full rounded-xl bg-emerald-500 px-4 py-3 text-base font-bold text-[#0C1F17]"
      >
        Open the app
      </a>
    </div>
  );
}
