import { Router } from "express";
import { sendDailyPushRecommendations } from "../lib/daily-push-recommendations";

const router = Router();

router.post("/admin/daily-push/run", async (req, res) => {
  const secret = process.env.ADMIN_CRON_SECRET;
  const provided = req.header("x-cron-secret") || req.query.secret;

  if (secret && provided !== secret) {
    return res.status(403).json({ error: "Invalid cron secret" });
  }

  try {
    const result = await sendDailyPushRecommendations(req.log);
    res.json({ ok: true, ...result });
  } catch (err) {
    req.log.error({ err }, "Daily push recommendation job failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
