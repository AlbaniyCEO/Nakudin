import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, shopsTable } from "@workspace/db";
import { desc, eq, and, ilike, or, sql } from "drizzle-orm";

const router = Router();

router.get("/search", async (req, res) => {
  const q = (req.query.q as string || "").trim();
  const type = (req.query.type as string) || "all";
  const category = req.query.category as string | undefined;

  if (!q) return res.status(400).json({ error: "Query required" });

  try {
    const searchPattern = `%${q}%`;
    const products = (type === "all" || type === "products")
      ? await db.select({ product: productsTable, shop: shopsTable })
          .from(productsTable)
          .innerJoin(shopsTable, eq(productsTable.shopId, shopsTable.id))
          .where(and(
            eq(productsTable.status, "active"),
            or(ilike(productsTable.title, searchPattern), ilike(productsTable.description, searchPattern)),
            category ? eq(productsTable.category, category) : undefined,
          ))
          .orderBy(desc(productsTable.trendScore))
          .limit(20)
      : [];

    const shops = (type === "all" || type === "shops")
      ? await db.select().from(shopsTable)
          .where(and(
            eq(shopsTable.suspended, false),
            or(ilike(shopsTable.businessName, searchPattern), ilike(shopsTable.bio, searchPattern)),
            category ? eq(shopsTable.category, category) : undefined,
          ))
          .orderBy(desc(shopsTable.followerCount))
          .limit(10)
      : [];

    res.json({
      products: products.map(({ product: p, shop }) => ({
        id: p.id, title: p.title, price: p.price, images: p.images || [],
        likeCount: p.likeCount, viewCount: p.viewCount,
        shopId: shop.id, shopName: shop.businessName, shopVerified: shop.verified,
        shopPremium: shop.premiumStatus === "active",
        shopLogoUrl: shop.logoUrl, shopWhatsapp: shop.whatsappNumber,
        category: p.category, locationCity: p.locationCity || shop.locationCity,
        locationState: p.locationState, distanceKm: null,
        stockQuantity: p.stockQuantity, featuredUntil: p.featuredUntil?.toISOString() || null,
        isLiked: false, isFollowed: false, trendScore: p.trendScore,
        createdAt: p.createdAt.toISOString(),
      })),
      shops: shops.map(s => ({
        id: s.id, businessName: s.businessName, bio: s.bio, category: s.category,
        logoUrl: s.logoUrl, coverUrl: s.coverUrl, whatsappNumber: s.whatsappNumber,
        locationCity: s.locationCity, locationState: s.locationState,
        locationLat: s.locationLat, locationLng: s.locationLng,
        verified: s.verified, followerCount: s.followerCount, followingCount: s.followingCount,
        totalViews: s.totalViews, totalLikes: s.totalLikes, totalWhatsappClicks: s.totalWhatsappClicks,
        avgRating: s.avgRating, reviewCount: s.reviewCount,
        subscriptionStatus: s.subscriptionStatus, trialEndsAt: s.trialEndsAt?.toISOString() || null,
        nextBillingDate: s.nextBillingDate?.toISOString() || null, billingCycle: s.billingCycle,
        premiumStatus: s.premiumStatus, premiumUntil: s.premiumUntil?.toISOString?.() || null,
        customSlug: s.customSlug, pinnedProductId: s.pinnedProductId,
        isFollowed: false, createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Search error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
