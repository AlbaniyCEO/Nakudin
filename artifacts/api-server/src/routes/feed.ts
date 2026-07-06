import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, shopsTable, likesTable, followsTable } from "@workspace/db";
import { desc, eq, and, sql, ilike, or } from "drizzle-orm";

const router = Router();

router.get("/feed", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const category = req.query.category as string | undefined;
    const lat = req.query.lat ? Number(req.query.lat) : null;
    const lng = req.query.lng ? Number(req.query.lng) : null;
    const userId = (req as any).userId as string | undefined;

    const rows = await db
      .select({
        product: productsTable,
        shop: {
          id: shopsTable.id,
          businessName: shopsTable.businessName,
          verified: shopsTable.verified,
          premiumStatus: shopsTable.premiumStatus,
          logoUrl: shopsTable.logoUrl,
          whatsappNumber: shopsTable.whatsappNumber,
          locationCity: shopsTable.locationCity,
          locationState: shopsTable.locationState,
          locationLat: shopsTable.locationLat,
          locationLng: shopsTable.locationLng,
        },
      })
      .from(productsTable)
      .innerJoin(shopsTable, eq(productsTable.shopId, shopsTable.id))
      .where(
        and(
          eq(productsTable.status, "active"),
          eq(shopsTable.suspended, false),
          category ? eq(productsTable.category, category) : undefined,
        )
      )
      .orderBy(desc(sql`${productsTable.trendScore} + CASE WHEN ${productsTable.featuredUntil} > NOW() THEN 5 ELSE 0 END - CASE WHEN ${productsTable.stockQuantity} = 0 THEN 0.35 ELSE 0 END`), desc(productsTable.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const likedProductIds = new Set<string>();
    const followedShopIds = new Set<string>();
    if (userId) {
      const liked = await db
        .select({ productId: likesTable.productId })
        .from(likesTable)
        .where(eq(likesTable.userId, userId));
      liked.forEach(l => likedProductIds.add(l.productId));

      const followed = await db
        .select({ shopId: followsTable.shopId })
        .from(followsTable)
        .where(eq(followsTable.followerId, userId));
      followed.forEach(f => followedShopIds.add(f.shopId));
    }

    const products = items.map(({ product, shop }) => {
      let distanceKm: number | null = null;
      if (lat && lng && shop.locationLat && shop.locationLng) {
        const dLat = (shop.locationLat - lat) * Math.PI / 180;
        const dLng = (shop.locationLng - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat * Math.PI/180) * Math.cos(shop.locationLat * Math.PI/180) * Math.sin(dLng/2)**2;
        distanceKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
      }

      return {
        id: product.id,
        title: product.title,
        price: product.price,
        images: product.images || [],
        likeCount: product.likeCount,
        viewCount: product.viewCount,
        shopId: shop.id,
        shopName: shop.businessName,
        shopVerified: shop.verified,
        shopPremium: shop.premiumStatus === "active",
        shopLogoUrl: shop.logoUrl,
        shopWhatsapp: shop.whatsappNumber,
        category: product.category,
        locationCity: product.locationCity || shop.locationCity,
        locationState: product.locationState || shop.locationState,
        distanceKm,
        isLiked: likedProductIds.has(product.id),
        isFollowed: followedShopIds.has(shop.id),
        trendScore: product.trendScore,
        stockQuantity: product.stockQuantity,
        featuredUntil: product.featuredUntil?.toISOString() || null,
        createdAt: product.createdAt.toISOString(),
      };
    });

    res.json({ products, nextCursor: hasMore ? items[items.length - 1].product.id : null });
  } catch (err) {
    req.log.error({ err }, "Feed error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
