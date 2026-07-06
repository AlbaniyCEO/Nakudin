import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./firebase";

const API_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export async function registerPushNotifications(getIdToken: () => Promise<string>) {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;
  if (!(await isSupported())) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) return false;

  const idToken = await getIdToken();
  await fetch(`${API_BASE}/api/push/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ token }),
  });

  return true;
}
