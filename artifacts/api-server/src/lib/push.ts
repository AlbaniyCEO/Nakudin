export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendPushToTokens(tokens: string[], payload: PushPayload, logger?: { info?: Function; warn?: Function; error?: Function }) {
  if (!tokens.length) return { sent: 0, skipped: true };

  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey) {
    logger?.warn?.({ tokenCount: tokens.length }, "FCM_SERVER_KEY missing; skipping push send");
    return { sent: 0, skipped: true };
  }

  const results = await Promise.allSettled(tokens.map(async (token) => {
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${serverKey}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          url: payload.url ?? "/",
        },
        priority: "high",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`FCM ${res.status}: ${text}`);
    }

    return true;
  }));

  const sent = results.filter(r => r.status === "fulfilled").length;
  const failed = results.length - sent;
  if (failed > 0) logger?.warn?.({ failed, sent }, "Some push notifications failed");
  return { sent, failed, skipped: false };
}
