import { Router } from "express";
import { db } from "@workspace/db";
import { shopsTable, productsTable, followsTable, reviewsTable, whatsappClicksTable, likesTable } from "@workspace/db";
import { desc, eq, and, sql, ilike } from "drizzle-orm";
import { randomUUID } from "crypto";
import { CreateShopBody, UpdateMyShopBody, CreateReviewBody } from "@workspace/api-zod";

const router = Router();

router.get("/shops", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const category = req.query.category as string | undefined;

    const shops = await db.select().from(shopsTable)
      .where(and(
        eq(shopsTable.suspended, false),
        category ? eq(shopsTable.category, category) : undefined,
      ))
      .orderBy(desc(shopsTable.followerCount), desc(shopsTable.createdAt))
      .limit(limit + 1);

    const hasMore = shops.length > limit;
    const items = hasMore ? shops.slice(0, limit) : shops;

    res.json({
      shops: items.map(s => shopToJson(s, false)),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (err) {
    req.log.error({ err }, "List shops error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/shops", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreateShopBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  try {
    const existing = await db.select().from(shopsTable).where(eq(shopsTable.id, userId)).limit(1);
    if (existing.length) return res.status(409).json({ error: "Shop already exists" });

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 60);

    const [shop] = await db.insert(shopsTable).values({
      id: userId,
      businessName: parsed.data.businessName,
      businessNameLower: parsed.data.businessName.toLowerCase(),
      whatsappNumber: parsed.data.whatsappNumber,
      category: parsed.data.category,
      bio: parsed.data.bio,
      logoUrl: parsed.data.logoUrl,
      coverUrl: parsed.data.coverUrl,
      locationCity: parsed.data.locationCity,
      locationState: parsed.data.locationState,
      locationLat: parsed.data.locationLat,
      locationLng: parsed.data.locationLng,
      subscriptionStatus: "trial",
      trialEndsAt,
    }).returning();

    res.status(201).json(shopToJson(shop, false));
  } catch (err) {
    req.log.error({ err }, "Create shop error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/shops/check-name", async (req, res) => {
  const name = req.query.name as string;
  if (!name) return res.status(400).json({ error: "Name required" });

  try {
    const existing = await db.select({ id: shopsTable.id })
      .from(shopsTable)
      .where(eq(shopsTable.businessNameLower, name.toLowerCase()))
      .limit(1);
    res.json({ available: existing.length === 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/shops/me", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, userId)).limit(1);
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    res.json(shopToJson(shop, false));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/shops/me", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = UpdateMyShopBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  try {
    const update: Record<string, any> = {};
    if (parsed.data.businessName) { update.businessName = parsed.data.businessName; update.businessNameLower = parsed.data.businessName.toLowerCase(); }
    if (parsed.data.whatsappNumber !== undefined) update.whatsappNumber = parsed.data.whatsappNumber;
    if (parsed.data.category) update.category = parsed.data.category;
    if (parsed.data.bio !== undefined) update.bio = parsed.data.bio;
    if (parsed.data.logoUrl !== undefined) update.logoUrl = parsed.data.logoUrl;
    if (parsed.data.coverUrl !== undefined) update.coverUrl = parsed.data.coverUrl;
    if (parsed.data.locationCity !== undefined) update.locationCity = parsed.data.locationCity;
    if (parsed.data.locationState !== undefined) update.locationState = parsed.data.locationState;
    if (parsed.data.locationLat !== undefined) update.locationLat = parsed.data.locationLat;
    if (parsed.data.locationLng !== undefined) update.locationLng = parsed.data.locationLng;

    const [shop] = await db.update(shopsTable).set(update).where(eq(shopsTable.id, userId)).returning();
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    res.json(shopToJson(shop, false));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/shops/:shopId", async (req, res) => {
  const userId = (req as any).userId;
  try {
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, req.params.shopId)).limit(1);
    if (!shop) return res.status(404).json({ error: "Not found" });

    await db.update(shopsTable).set({ totalViews: sql`${shopsTable.totalViews} + 1` }).where(eq(shopsTable.id, shop.id));

    let isFollowed = false;
    if (userId) {
      const f = await db.select().from(followsTable).where(and(eq(followsTable.shopId, shop.id), eq(followsTable.followerId, userId))).limit(1);
      isFollowed = f.length > 0;
    }

    res.json(shopToJson(shop, isFollowed));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Follow / Unfollow
router.post("/shops/:shopId/follow", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const existing = await db.select().from(followsTable).where(and(eq(followsTable.shopId, req.params.shopId), eq(followsTable.followerId, userId))).limit(1);
    if (!existing.length) {
      await db.insert(followsTable).values({ id: randomUUID(), shopId: req.params.shopId, followerId: userId });
      await db.update(shopsTable).set({ followerCount: sql`${shopsTable.followerCount} + 1` }).where(eq(shopsTable.id, req.params.shopId));
    }
    const [shop] = await db.select({ followerCount: shopsTable.followerCount }).from(shopsTable).where(eq(shopsTable.id, req.params.shopId)).limit(1);
    res.json({ followed: true, followerCount: shop?.followerCount || 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/shops/:shopId/follow", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await db.delete(followsTable).where(and(eq(followsTable.shopId, req.params.shopId), eq(followsTable.followerId, userId)));
    await db.update(shopsTable).set({ followerCount: sql`GREATEST(${shopsTable.followerCount} - 1, 0)` }).where(eq(shopsTable.id, req.params.shopId));
    const [shop] = await db.select({ followerCount: shopsTable.followerCount }).from(shopsTable).where(eq(shopsTable.id, req.params.shopId)).limit(1);
    res.json({ followed: false, followerCount: shop?.followerCount || 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reviews
router.get("/shops/:shopId/reviews", async (req, res) => {
  try {
    const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.shopId, req.params.shopId)).orderBy(desc(reviewsTable.createdAt)).limit(50);
    res.json(reviews.map(r => ({
      id: r.id, shopId: r.shopId, authorId: r.authorId, authorName: r.authorName,
      authorLogoUrl: r.authorLogoUrl, rating: r.rating, text: r.text,
      ownerReply: r.ownerReply, createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/shops/:shopId/reviews", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  try {
    const shop = await db.select().from(shopsTable).where(eq(shopsTable.id, userId)).limit(1);
    const [review] = await db.insert(reviewsTable).values({
      id: randomUUID(),
      shopId: req.params.shopId,
      authorId: userId,
      authorName: shop[0]?.businessName || "User",
      authorLogoUrl: shop[0]?.logoUrl || undefined,
      rating: parsed.data.rating,
      text: parsed.data.text,
    }).returning();

    // Update average rating on shop
    const allReviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(eq(reviewsTable.shopId, req.params.shopId));
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await db.update(shopsTable).set({ avgRating: avg, reviewCount: allReviews.length }).where(eq(shopsTable.id, req.params.shopId));

    res.status(201).json({
      id: review.id, shopId: review.shopId, authorId: review.authorId,
      authorName: review.authorName, authorLogoUrl: review.authorLogoUrl,
      rating: review.rating, text: review.text, ownerReply: review.ownerReply,
      createdAt: review.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/shops/:shopId/can-review", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.json({ canReview: false });

  try {
    const clicks = await db.select().from(whatsappClicksTable)
      .where(and(eq(whatsappClicksTable.shopId, req.params.shopId), eq(whatsappClicksTable.userId, userId)))
      .limit(1);
    res.json({ canReview: clicks.length > 0 });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Analytics
router.get("/shops/:shopId/analytics", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, req.params.shopId)).limit(1);
    if (!shop) return res.status(404).json({ error: "Not found" });
    if (shop.id !== userId) return res.status(403).json({ error: "Forbidden" });

    const topProducts = await db.select().from(productsTable)
      .where(and(eq(productsTable.shopId, req.params.shopId), eq(productsTable.status, "active")))
      .orderBy(desc(productsTable.viewCount))
      .limit(5);

    // Generate 14 days of mock activity data
    const recentActivity = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return {
        date: date.toISOString().split("T")[0],
        views: Math.floor(Math.random() * 30) + 5,
        likes: Math.floor(Math.random() * 10),
        clicks: Math.floor(Math.random() * 8),
      };
    });

    res.json({
      shopId: shop.id,
      totalViews: shop.totalViews,
      totalLikes: shop.totalLikes,
      totalWhatsappClicks: shop.totalWhatsappClicks,
      followerCount: shop.followerCount,
      recentActivity,
      topProducts: topProducts.map(p => ({
        productId: p.id,
        title: p.title,
        views: p.viewCount,
        likes: p.likeCount,
        clicks: p.whatsappClickCount,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

function shopToJson(shop: any, isFollowed: boolean) {
  return {
    id: shop.id,
    businessName: shop.businessName,
    bio: shop.bio,
    category: shop.category,
    logoUrl: shop.logoUrl,
    coverUrl: shop.coverUrl,
    whatsappNumber: shop.whatsappNumber,
    locationCity: shop.locationCity,
    locationState: shop.locationState,
    locationLat: shop.locationLat,
    locationLng: shop.locationLng,
    verified: shop.verified,
    followerCount: shop.followerCount,
    followingCount: shop.followingCount,
    totalViews: shop.totalViews,
    totalLikes: shop.totalLikes,
    totalWhatsappClicks: shop.totalWhatsappClicks,
    avgRating: shop.avgRating,
    reviewCount: shop.reviewCount,
    subscriptionStatus: shop.subscriptionStatus,
    trialEndsAt: shop.trialEndsAt?.toISOString() || null,
    isFollowed,
    createdAt: shop.createdAt.toISOString(),
  };
}

export default router;
