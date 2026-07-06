import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { registerPushNotifications } from "@/lib/push";

const DISMISSED_KEY = "nakudin_push_prompt_dismissed";
const ENABLED_KEY = "nakudin_push_enabled";

export function PushNotificationPrompt() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setVisible(false); return; }
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "granted") return;
    if (localStorage.getItem(ENABLED_KEY) === "1") return;
    if (localStorage.getItem(DISMISSED_KEY) === "1") return;

    const timer = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(timer);
  }, [user?.uid]);

  const enable = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const ok = await registerPushNotifications(() => user.getIdToken());
      if (ok) {
        localStorage.setItem(ENABLED_KEY, "1");
        setVisible(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed left-4 right-4 bottom-24 z-[60] max-w-screen-sm mx-auto surface-1 border border-primary/20 rounded-3xl p-4 shadow-[0_18px_60px_rgba(0,0,0,0.42)]">
      <button onClick={dismiss} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" aria-label="Dismiss notifications">
        <X size={16} />
      </button>
      <div className="flex gap-3 pr-6">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Bell size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Get daily Nakudin recommendations</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Receive one useful daily push: shop advice if you sell, or product picks if you buy.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={enable} disabled={saving}>{saving ? "Enabling..." : "Enable"}</Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>Not now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
