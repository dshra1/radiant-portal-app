import { useEffect, useState } from "react";

/** True while the browser reports a network connection (navigator.onLine + online/offline events). */
export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
