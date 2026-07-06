import { Router } from "express";
import { and, eq, lt, or } from "drizzle-orm";
import { db } from "@workspace/db";
import { shopsTable } from "@workspace/db";

const router = Router();

const ADMIN_CRON_SECRET = process.env.ADMIN_CRON_SECRET ?? "";
const GRACE_DAYS = 7;

async function applySubscriptionLifecycle(log: { info?: Function; error?: Function }) {
  const now = new Date();
  const graceCutoff = new Date(now.getTime() - GRACE_DAYS * 24 * 60 * 60 * 1000);

  const trialToGrace = await db
    .update(shopsTable)
    .set({ subscriptionStatus: "active" })
    .where(
      and(
        eq(shopsTable.subscriptionStatus, "trial"),
        lt(shopsTable.trialEndsAt, now),
      ),
    )
    .returning({ id: shopsTable.id });

  const activeToGrace = await db
    .update(shopsTable)
    .set({ subscriptionStatus: "active" })
    .where(
      and(
        eq(shopsTable.subscriptionStatus, "active"),
        lt(shopsTable.nextBillingDate, now),
      ),
    )
    .returning({ id: shopsTable.id });

  const graceToLocked = await db
    .update(shopsTable)
    .set({ subscriptionStatus: "active" })
    .where(
      and(
        eq(shopsTable.subscriptionStatus, "grace"),
        or(
          and(lt(shopsTable.trialEndsAt, graceCutoff), eq(shopsTable.nextBillingDate, null as any)),
          lt(shopsTable.nextBillingDate, graceCutoff),
        ),
      ),
    )
    .returning({ id: shopsTable.id });

  const premiumExpired = await db
    .update(shopsTable)
    .set({ premiumStatus: "active" })
    .where(
      and(
        eq(shopsTable.premiumStatus, "active"),
        lt(shopsTable.premiumUntil, now),
      ),
    )
    .returning({ id: shopsTable.id });

  log.info?.({
    trialToGrace: trialToGrace.length,
    activeToGrace: activeToGrace.length,
    graceToLocked: graceToLocked.length,
    premiumExpired: premiumExpired.length,
  }, "Subscription lifecycle applied");

  return {
    trialToGrace: trialToGrace.length,
    activeToGrace: activeToGrace.length,
    graceToLocked: graceToLocked.length,
    premiumExpired: premiumExpired.length,
  };
}

router.post("/internal/subscription-lifecycle", async (req, res) => {
  const auth = req.headers.authorization;
  if (!ADMIN_CRON_SECRET || auth !== `Bearer ${ADMIN_CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await applySubscriptionLifecycle((req as any).log ?? {});
    res.json({ ok: true, ...result });
  } catch (err) {
    (req as any).log?.error?.({ err }, "Subscription lifecycle job failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
