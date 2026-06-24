import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, shopsTable, likesTable, commentsTable, whatsappClicksTable } from "@workspace/db";
import { desc, eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { CreateProductBody, UpdateProductBody, CreateCommentBody, LogWhatsappClickBody } from "@workspace/api-zod";

const router = Router();

router.get("/products", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const shopId = req.query.shopId as string | undefined;
    const category = req.query.category as string | undefined;
    const userId = (req as any).userId as string | undefined;

    const rows = await db
      .select()
      .from(productsTable)
      .where(
        and(
          eq(productsTable.status, "active"),
          shopId ? eq(productsTable.shopId, shopId) : undefined,
          category ? eq(productsTable.category, category) : undefined,
        )
      )
      .orderBy(desc(productsTable.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const likedProductIds = new Set<string>();
    if (userId) {
      const liked = await db
        .select({ productId: likesTable.productId })
        .from(likesTable)
        .where(eq(likesTable.userId, userId));
      liked.forEach(l => likedProductIds.add(l.productId));
    }

    const products = items.map(p => ({
      id: p.id,
      shopId: p.shopId,
      title: p.title,
      description: p.description,
      price: p.price,
      images: p.images || [],
      category: p.category,
      locationCity: p.locationCity,
      locationState: p.locationState,
      locationLat: p.locationLat,
      locationLng: p.locationLng,
      likeCount: p.likeCount,
      viewCount: p.viewCount,
      whatsappClickCount: p.whatsappClickCount,
      trendScore: p.trendScore,
      status: p.status,
      isLiked: likedProductIds.has(p.id),
      createdAt: p.createdAt.toISOString(),
    }));

    res.json({ products, nextCursor: hasMore ? items[items.length - 1].id : null });
  } catch (err) {
    req.log.error({ err }, "List products error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  try {
    const shop = await db.select().from(shopsTable).where(eq(shopsTable.id, userId)).limit(1);
    if (!shop.length) return res.status(404).json({ error: "Shop not found" });
    if (shop[0].subscriptionStatus === "locked") return res.status(403).json({ error: "Shop is locked. Please renew your subscription." });

    const id = randomUUID();
    const [product] = await db.insert(productsTable).values({
      id,
      shopId: userId,
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      images: parsed.data.images || [],
      category: parsed.data.category,
      locationCity: parsed.data.locationCity || shop[0].locationCity || undefined,
      locationState: parsed.data.locationState || shop[0].locationState || undefined,
      locationLat: parsed.data.locationLat || shop[0].locationLat || undefined,
      locationLng: parsed.data.locationLng || shop[0].locationLng || undefined,
      trendScore: 1.0,
    }).returning();

    res.status(201).json({
      id: product.id,
      shopId: product.shopId,
      title: product.title,
      description: product.description,
      price: product.price,
      images: product.images || [],
      category: product.category,
      locationCity: product.locationCity,
      locationState: product.locationState,
      locationLat: product.locationLat,
      locationLng: product.locationLng,
      likeCount: product.likeCount,
      viewCount: product.viewCount,
      whatsappClickCount: product.whatsappClickCount,
      trendScore: product.trendScore,
      status: product.status,
      isLiked: false,
      createdAt: product.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create product error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:productId", async (req, res) => {
  const userId = (req as any).userId;
  try {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.productId)).limit(1);
    if (!product) return res.status(404).json({ error: "Not found" });

    // Increment view count
    await db.update(productsTable).set({ viewCount: sql`${productsTable.viewCount} + 1` }).where(eq(productsTable.id, product.id));

    let isLiked = false;
    if (userId) {
      const liked = await db.select().from(likesTable).where(and(eq(likesTable.productId, product.id), eq(likesTable.userId, userId))).limit(1);
      isLiked = liked.length > 0;
    }

    res.json({
      id: product.id,
      shopId: product.shopId,
      title: product.title,
      description: product.description,
      price: product.price,
      images: product.images || [],
      category: product.category,
      locationCity: product.locationCity,
      locationState: product.locationState,
      locationLat: product.locationLat,
      locationLng: product.locationLng,
      likeCount: product.likeCount,
      viewCount: product.viewCount + 1,
      whatsappClickCount: product.whatsappClickCount,
      trendScore: product.trendScore,
      status: product.status,
      isLiked,
      createdAt: product.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get product error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:productId", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  try {
    const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.productId)).limit(1);
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.shopId !== userId) return res.status(403).json({ error: "Forbidden" });

    const [product] = await db.update(productsTable)
      .set({
        ...(parsed.data.title && { title: parsed.data.title }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.price !== undefined && { price: parsed.data.price }),
        ...(parsed.data.images && { images: parsed.data.images }),
        ...(parsed.data.category !== undefined && { category: parsed.data.category }),
        ...(parsed.data.status && { status: parsed.data.status as any }),
        ...(parsed.data.locationCity !== undefined && { locationCity: parsed.data.locationCity }),
        ...(parsed.data.locationState !== undefined && { locationState: parsed.data.locationState }),
      })
      .where(eq(productsTable.id, req.params.productId))
      .returning();

    res.json({
      id: product.id,
      shopId: product.shopId,
      title: product.title,
      description: product.description,
      price: product.price,
      images: product.images || [],
      category: product.category,
      locationCity: product.locationCity,
      locationState: product.locationState,
      locationLat: product.locationLat,
      locationLng: product.locationLng,
      likeCount: product.likeCount,
      viewCount: product.viewCount,
      whatsappClickCount: product.whatsappClickCount,
      trendScore: product.trendScore,
      status: product.status,
      isLiked: false,
      createdAt: product.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update product error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:productId", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.productId)).limit(1);
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.shopId !== userId) return res.status(403).json({ error: "Forbidden" });

    await db.update(productsTable).set({ status: "deleted" }).where(eq(productsTable.id, req.params.productId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete product error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Like / Unlike
router.post("/products/:productId/like", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const existing = await db.select().from(likesTable).where(and(eq(likesTable.productId, req.params.productId), eq(likesTable.userId, userId))).limit(1);
    if (!existing.length) {
      await db.insert(likesTable).values({ id: randomUUID(), productId: req.params.productId, userId });
      await db.update(productsTable).set({ likeCount: sql`${productsTable.likeCount} + 1` }).where(eq(productsTable.id, req.params.productId));
    }
    const [product] = await db.select({ likeCount: productsTable.likeCount }).from(productsTable).where(eq(productsTable.id, req.params.productId)).limit(1);
    res.json({ liked: true, likeCount: product?.likeCount || 0 });
  } catch (err) {
    req.log.error({ err }, "Like error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:productId/like", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await db.delete(likesTable).where(and(eq(likesTable.productId, req.params.productId), eq(likesTable.userId, userId)));
    await db.update(productsTable).set({ likeCount: sql`GREATEST(${productsTable.likeCount} - 1, 0)` }).where(eq(productsTable.id, req.params.productId));
    const [product] = await db.select({ likeCount: productsTable.likeCount }).from(productsTable).where(eq(productsTable.id, req.params.productId)).limit(1);
    res.json({ liked: false, likeCount: product?.likeCount || 0 });
  } catch (err) {
    req.log.error({ err }, "Unlike error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Comments
router.get("/products/:productId/comments", async (req, res) => {
  try {
    const comments = await db.select().from(commentsTable).where(eq(commentsTable.productId, req.params.productId)).orderBy(desc(commentsTable.createdAt)).limit(50);
    res.json(comments.map(c => ({
      id: c.id, productId: c.productId, authorId: c.authorId, authorName: c.authorName,
      authorLogoUrl: c.authorLogoUrl, text: c.text, createdAt: c.createdAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products/:productId/comments", async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  try {
    const shop = await db.select().from(shopsTable).where(eq(shopsTable.id, userId)).limit(1);
    const [comment] = await db.insert(commentsTable).values({
      id: randomUUID(),
      productId: req.params.productId,
      authorId: userId,
      authorName: shop[0]?.businessName || "User",
      authorLogoUrl: shop[0]?.logoUrl || undefined,
      text: parsed.data.text,
    }).returning();
    res.status(201).json({
      id: comment.id, productId: comment.productId, authorId: comment.authorId,
      authorName: comment.authorName, authorLogoUrl: comment.authorLogoUrl,
      text: comment.text, createdAt: comment.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// WhatsApp click
router.post("/products/:productId/whatsapp-click", async (req, res) => {
  const userId = (req as any).userId;
  const parsed = LogWhatsappClickBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  try {
    const [product] = await db.select({ shopId: productsTable.shopId }).from(productsTable).where(eq(productsTable.id, req.params.productId)).limit(1);
    if (!product) return res.status(404).json({ error: "Not found" });

    await db.insert(whatsappClicksTable).values({
      id: randomUUID(),
      shopId: product.shopId,
      productId: req.params.productId,
      userId: userId || undefined,
      deviceId: parsed.data.deviceId,
    });

    await db.update(productsTable).set({ whatsappClickCount: sql`${productsTable.whatsappClickCount} + 1` }).where(eq(productsTable.id, req.params.productId));
    await db.update(shopsTable).set({ totalWhatsappClicks: sql`${shopsTable.totalWhatsappClicks} + 1` }).where(eq(shopsTable.id, product.shopId));

    res.json({ logged: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Related products
router.get("/products/:productId/related", async (req, res) => {
  try {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, req.params.productId)).limit(1);
    if (!product) return res.status(404).json({ error: "Not found" });

    const related = await db
      .select({ product: productsTable, shop: shopsTable })
      .from(productsTable)
      .innerJoin(shopsTable, eq(productsTable.shopId, shopsTable.id))
      .where(and(
        eq(productsTable.status, "active"),
        eq(productsTable.shopId, product.shopId),
        sql`${productsTable.id} != ${product.id}`,
      ))
      .orderBy(desc(productsTable.trendScore))
      .limit(8);

    res.json(related.map(({ product: p, shop }) => ({
      id: p.id, title: p.title, price: p.price, images: p.images || [],
      likeCount: p.likeCount, viewCount: p.viewCount,
      shopId: shop.id, shopName: shop.businessName, shopVerified: shop.verified,
      shopLogoUrl: shop.logoUrl, shopWhatsapp: shop.whatsappNumber,
      category: p.category, locationCity: p.locationCity || shop.locationCity,
      locationState: p.locationState || shop.locationState,
      distanceKm: null, isLiked: false, isFollowed: false,
      trendScore: p.trendScore, createdAt: p.createdAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
