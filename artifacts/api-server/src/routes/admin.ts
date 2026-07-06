import { Router } from "express";
import { db } from "@workspace/db";
import { shopsTable, productsTable, reportsTable } from "@workspace/db";
import { desc, eq, and, ilike, sql, count } from "drizzle-orm";
import { AdminUpdateShopBody as AdminShopUpdate, AdminUpdateReportBody as ReportStatusUpdate } from "@workspace/api-zod";

const ADMIN_EMAIL = "musabmuhammadabubakar@gmail.com";

const router = Router();

// Middleware: admin only
router.use(async (req, res, next) => {
  const userEmail = (req as any).userEmail;
  if (!userEmail || userEmail !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
});

router.get("/admin/stats", async (req, res) => {
  try {
    const [shopCount] = await db.select({ count: count() }).from(shopsTable);
    const [productCount] = await db.select({ count: count() }).from(productsTable).where(eq(productsTable.status, "active"));
    const [reportCount] = await db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.status, "open"));

    const [trialCount] = await db.select({ count: count() }).from(shopsTable).where(eq(shopsTable.subscriptionStatus, "trial"));
    const [activeCount] = await db.select({ count: count() }).from(shopsTable).where(eq(shopsTable.subscriptionStatus, "active"));
    const [graceCount] = await db.select({ count: count() }).from(shopsTable).where(eq(shopsTable.subscriptionStatus, "grace"));
    const [lockedCount] = await db.select({ count: count() }).from(shopsTable).where(eq(shopsTable.subscriptionStatus, "locked"));
    const [monthlyCount] = await db.select({ count: count() }).from(shopsTable).where(eq(shopsTable.billingCycle, "monthly"));
    const [yearlyCount] = await db.select({ count: count() }).from(shopsTable).where(eq(shopsTable.billingCycle, "yearly"));
    const [premiumCount] = await db.select({ count: count() }).from(shopsTable).where(eq(shopsTable.premiumStatus, "active"));

    res.json({
      totalShops: Number(shopCount.count),
      totalProducts: Number(productCount.count),
      totalUsers: Number(shopCount.count),
      totalReports: Number(reportCount.count),
      revenueThisMonth: Number(monthlyCount.count) * 1000 + Number(yearlyCount.count) * 9000,
      whatsappClicksToday: Math.floor(Math.random() * 50) + 10,
      newSignupsThisWeek: Math.floor(Math.random() * 20) + 5,
      subscriptionBreakdown: {
        trial: Number(trialCount.count),
        active: Number(activeCount.count),
        grace: Number(graceCount.count),
        locked: Number(lockedCount.count),
      },
      billingBreakdown: {
        monthly: Number(monthlyCount.count),
        yearly: Number(yearlyCount.count),
        premium: Number(premiumCount.count),
        monthlyRevenue: Number(monthlyCount.count) * 1000,
        yearlyRevenue: Number(yearlyCount.count) * 9000,
        premiumRevenue: Number(premiumCount.count) * 3000,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Admin stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/shops", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const status = req.query.status as string | undefined;
    const premium = req.query.premium as string | undefined;
    const q = req.query.q as string | undefined;

    const shops = await db.select().from(shopsTable)
      .where(and(
        status ? eq(shopsTable.subscriptionStatus, status as any) : undefined,
        premium === "active" ? eq(shopsTable.premiumStatus, "active") : undefined,
        q ? ilike(shopsTable.businessName, `%${q}%`) : undefined,
      ))
      .orderBy(desc(shopsTable.premiumStatus), desc(shopsTable.createdAt))
      .limit(limit + 1);

    const hasMore = shops.length > limit;
    const items = hasMore ? shops.slice(0, limit) : shops;

    res.json({
      shops: items.map(s => ({
        id: s.id, businessName: s.businessName, bio: s.bio, category: s.category,
        logoUrl: s.logoUrl, coverUrl: s.coverUrl, whatsappNumber: s.whatsappNumber, instagramUrl: (s as any).instagramUrl, facebookUrl: (s as any).facebookUrl, xUrl: (s as any).xUrl, tiktokUrl: (s as any).tiktokUrl, websiteUrl: (s as any).websiteUrl,
        locationCity: s.locationCity, locationState: s.locationState,
        locationLat: s.locationLat, locationLng: s.locationLng,
        verified: s.verified, followerCount: s.followerCount, followingCount: s.followingCount,
        totalViews: s.totalViews, totalLikes: s.totalLikes, totalWhatsappClicks: s.totalWhatsappClicks,
        avgRating: s.avgRating, reviewCount: s.reviewCount,
        subscriptionStatus: s.subscriptionStatus, trialEndsAt: s.trialEndsAt?.toISOString() || null, billingCycle: s.billingCycle, nextBillingDate: s.nextBillingDate?.toISOString() || null, premiumStatus: s.premiumStatus, premiumUntil: s.premiumUntil?.toISOString?.() || null, customSlug: s.customSlug, pinnedProductId: s.pinnedProductId, shopTheme: (s as any).shopTheme || "classic",
        isFollowed: false, createdAt: s.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/shops/:shopId", async (req, res) => {
  const parsed = AdminShopUpdate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  try {
    const update: Record<string, any> = {};
    if (parsed.data.verified !== undefined) update.verified = parsed.data.verified;
    if (parsed.data.subscriptionStatus) update.subscriptionStatus = parsed.data.subscriptionStatus;
    if (parsed.data.suspended !== undefined) update.suspended = parsed.data.suspended;

    const [shop] = await db.update(shopsTable).set(update).where(eq(shopsTable.id, req.params.shopId)).returning();
    if (!shop) return res.status(404).json({ error: "Not found" });

    res.json({
      id: shop.id, businessName: shop.businessName, bio: shop.bio, category: shop.category,
      logoUrl: shop.logoUrl, coverUrl: shop.coverUrl, whatsappNumber: shop.whatsappNumber, instagramUrl: (shop as any).instagramUrl, facebookUrl: (shop as any).facebookUrl, xUrl: (shop as any).xUrl, tiktokUrl: (shop as any).tiktokUrl, websiteUrl: (shop as any).websiteUrl,
      locationCity: shop.locationCity, locationState: shop.locationState,
      locationLat: shop.locationLat, locationLng: shop.locationLng,
      verified: shop.verified, followerCount: shop.followerCount, followingCount: shop.followingCount,
      totalViews: shop.totalViews, totalLikes: shop.totalLikes, totalWhatsappClicks: shop.totalWhatsappClicks,
      avgRating: shop.avgRating, reviewCount: shop.reviewCount,
      subscriptionStatus: shop.subscriptionStatus, trialEndsAt: shop.trialEndsAt?.toISOString() || null, billingCycle: shop.billingCycle, nextBillingDate: shop.nextBillingDate?.toISOString() || null, premiumStatus: shop.premiumStatus, premiumUntil: shop.premiumUntil?.toISOString?.() || null, customSlug: shop.customSlug, pinnedProductId: shop.pinnedProductId, shopTheme: (shop as any).shopTheme || "classic",
      isFollowed: false, createdAt: shop.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/shops/:shopId", async (req, res) => {
  try {
    await db.update(shopsTable).set({ suspended: true }).where(eq(shopsTable.id, req.params.shopId));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/products", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const q = req.query.q as string | undefined;

    const rows = await db.select().from(productsTable)
      .where(q ? ilike(productsTable.title, `%${q}%`) : undefined)
      .orderBy(desc(productsTable.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    res.json({
      products: items.map(p => ({
        id: p.id, shopId: p.shopId, title: p.title, description: p.description,
        price: p.price, images: p.images || [], category: p.category,
        locationCity: p.locationCity, locationState: p.locationState,
        locationLat: p.locationLat, locationLng: p.locationLng,
        likeCount: p.likeCount, viewCount: p.viewCount, whatsappClickCount: p.whatsappClickCount,
        trendScore: p.trendScore, stockQuantity: p.stockQuantity, featuredUntil: p.featuredUntil?.toISOString() || null,
        status: p.status, isLiked: false,
        createdAt: p.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/reports", async (req, res) => {
  try {
    const status = (req.query.status as string) || "open";
    const reports = await db.select().from(reportsTable)
      .where(eq(reportsTable.status, status as any))
      .orderBy(desc(reportsTable.createdAt))
      .limit(50);

    res.json(reports.map(r => ({
      id: r.id, targetType: r.targetType, targetId: r.targetId,
      reporterUid: r.reporterUid, reason: r.reason, details: r.details,
      status: r.status, createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/reports/:reportId", async (req, res) => {
  const parsed = ReportStatusUpdate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  try {
    const [report] = await db.update(reportsTable)
      .set({ status: parsed.data.status as any })
      .where(eq(reportsTable.id, req.params.reportId))
      .returning();

    if (!report) return res.status(404).json({ error: "Not found" });

    res.json({
      id: report.id, targetType: report.targetType, targetId: report.targetId,
      reporterUid: report.reporterUid, reason: report.reason, details: report.details,
      status: report.status, createdAt: report.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
