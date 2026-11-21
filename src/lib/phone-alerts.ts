import { supabase } from "@/integrations/supabase/client";

/** Public half of the app's Web Push (VAPID) key pair. The private half is the worker secret VAPID_PRIVATE_JWK. */
export const VAPID_PUBLIC_KEY =
  "BPNetPSKf2s38o51X0E0tp_tpu6qjNJI2_Aaeegu0Ky4AiSpqLAp_O4LEKcQF4HHQo2YVzbZ1fntQfnvZRo-oR0";

export type AlertState = "on" | "off" | "blocked" | "unsupported" | "install-first";

const isIos = () =>
  typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true);

function keyBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  const reg =
    (await navigator.serviceWorker.getRegistration("/")) ??
    (await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }));
  await navigator.serviceWorker.ready;
  return reg;
}

export async function alertState(): Promise<AlertState> {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window))
    return isIos() && !standalone() ? "install-first" : "unsupported";
  if (Notification.permission === "denied") return "blocked";
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    return sub && Notification.permission === "granted" ? "on" : "off";
  } catch {
    return "off";
  }
}

async function save(sub: PushSubscription) {
  const j = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  const { error } = await supabase.rpc("push_subscribe" as never, {
    p_endpoint: j.endpoint,
    p_p256dh: j.keys?.p256dh,
    p_auth: j.keys?.auth,
    p_device: navigator.userAgent.slice(0, 200),
  } as never);
  if (error) throw new Error("Phone alerts could not be saved. Please try again in a minute.");
}

/** Ask permission, subscribe this device and store it for the signed-in user. */
export async function turnOnAlerts(): Promise<AlertState> {
  const st = await alertState();
  if (st === "unsupported" || st === "install-first" || st === "blocked") return st;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "blocked" : "off";
  const reg = await registration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub)
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(VAPID_PUBLIC_KEY),
    });
  await save(sub);
  return "on";
}

export async function turnOffAlerts(): Promise<AlertState> {
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await supabase
      .from("push_subscriptions" as never)
      .delete()
      .eq("endpoint" as never, sub.endpoint as never);
    await sub.unsubscribe().catch(() => {});
  }
  return "off";
}

/** Keep this device tied to whoever is signed in now (a shared phone, or a renewed subscription). */
export async function refreshAlerts() {
  try {
    if ((await alertState()) !== "on") return;
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) await save(sub);
  } catch {
    /* alerts are optional */
  }
}
