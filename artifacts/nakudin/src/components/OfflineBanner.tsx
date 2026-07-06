import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [since] = useState(Date.now());

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online) return null;

  const minutes = Math.max(1, Math.round((Date.now() - since) / 60000));
  const label = minutes < 60 ? `${minutes} minute${minutes === 1 ? "" : "s"}` : `${Math.round(minutes / 60)} hour${Math.round(minutes / 60) === 1 ? "" : "s"}`;

  return (
    <div className="sticky top-0 z-50 bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-300 px-4 py-2 text-xs flex items-center gap-2">
      <WifiOff size={14} />
      <span>You&apos;re offline — showing saved content from {label} ago.</span>
    </div>
  );
}
