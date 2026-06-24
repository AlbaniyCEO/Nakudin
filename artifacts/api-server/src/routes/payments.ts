import { Router } from "express";
import { createHmac } from "crypto";
import { db } from "@workspace/db";
import { shopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";

// POST /api/payments/webhook  — called by Paystack after a successful charge
router.post("/payments/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"] as string;
    const rawBody = (req as any).rawBody as Buffer | undefined;

    if (!rawBody || !signature) {
      return res.status(400).json({ error: "Missing signature or body" });
    }

    if (PAYSTACK_SECRET) {
      const expected = createHmac("sha512", PAYSTACK_SECRET)
        .update(rawBody)
        .digest("hex");
      if (expected !== signature) {
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    const event = req.body as { event: string; data: any };

    if (event.event === "charge.success") {
      const { metadata } = event.data as { metadata?: { shopId?: string; plan?: string } };
      const shopId = metadata?.shopId;
      const plan = metadata?.plan ?? "monthly";

      if (shopId) {
        const nextBillingDate = new Date();
        if (plan === "yearly") {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        } else {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }

        await db
          .update(shopsTable)
          .set({ subscriptionStatus: "active", nextBillingDate })
          .where(eq(shopsTable.id, shopId));

        req.log.info({ shopId, plan }, "Subscription activated via Paystack");
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    req.log.error({ err }, "Paystack webhook error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/payments/plans  — expose plan info to frontend
router.get("/payments/plans", (_req, res) => {
  res.json({
    plans: [
      {
        id: "monthly",
        name: "Monthly",
        amountKobo: 100000,
        currency: "NGN",
        label: "₦1,000/month",
      },
      {
        id: "yearly",
        name: "Yearly",
        amountKobo: 900000,
        currency: "NGN",
        label: "₦9,000/year",
      },
    ],
  });
});

export default router;
