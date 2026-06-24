import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { CreateReportBody as ReportInput } from "@workspace/api-zod";

const router = Router();

router.post("/reports", async (req, res) => {
  const userId = (req as any).userId;
  const parsed = ReportInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  try {
    const [report] = await db.insert(reportsTable).values({
      id: randomUUID(),
      targetType: parsed.data.targetType as any,
      targetId: parsed.data.targetId,
      reporterUid: userId || undefined,
      reason: parsed.data.reason,
      details: parsed.data.details,
      status: "open",
    }).returning();

    res.status(201).json({
      id: report.id, targetType: report.targetType, targetId: report.targetId,
      reporterUid: report.reporterUid, reason: report.reason, details: report.details,
      status: report.status, createdAt: report.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
