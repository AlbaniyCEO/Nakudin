import { and, desc, eq, gt, gte, inArray, sql } from "drizzle-orm";
import { db, followsTable, likesTable, productsTable, pushTokensTable, shopsTable, whatsappClicksTable } from "@workspace/db";
import { sendPushToTokens, type PushPayload } from "./push";

type Logger = { info?: Function; warn?: Function; error?: Function };

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function pickOwnerAdvice(args: {
  shop: typeof shopsTable.$inferSelect;
  products: Array<typeof productsTable.$inferSelect>;
  views: number;
  clicks: number;
  likes: number;
}): PushPayload {
  const { shop, products, views, clicks, likes } = args;
  const activeProducts = products.filter(p => p.status === "active");
  const outOfStock = activeProducts.filter(p => (p.stockQuantity ?? 1) === 0);
  const lowStock = activeProducts.filter(p => (p.stockQuantity ?? 1) > 0 && (p.stockQuantity ?? 1) <= 3);
  const topProduct = [...activeProducts].sort((a, b) => ((b.viewCount ?? 0) + b.likeCount + (b.whatsappClickCount ?? 0) * 2) - ((a.viewCount ?? 0) + a.likeCount + (a.whatsappClickCount ?? 0) * 2))[0];

  if (outOfStock.length > 0) {
    return {
      title: "Restock reminder",
      body: `${outOfStock.length} product${outOfStock.length === 1 ? " is" : "s are"} out of stock. Restock today so buyers can contact you with confidence.`,
      url: "/dashboard",
    };
  }

  if (lowStock.length > 0) {
    return {
      title: "Low stock opportunity",
      body: `${lowStock.length} product${lowStock.length === 1 ? " has" : "s have"} only a few left. Restock before demand is lost.`,
      url: "/dashboard",
    };
  }

  if (views >= 20 && clicks === 0) {
    return {
      title: "Views need WhatsApp contacts",
      body: `${shop.businessName} got views but no WhatsApp clicks. Improve your first photo, price note, and delivery details today.`,
      url: "/dashboard",
    };
  }

  if (clicks > 0) {
    return {
      title: "Buyer interest today",
      body: `${clicks} WhatsApp click${clicks === 1 ? "" : "s"} came in recently. Reply fast and pin your strongest product.`,
      url: "/dashboard",
    };
  }

  if (likes > 0) {
    return {
      title: "People are saving your products",
      body: `${likes} like${likes === 1 ? "" : "s"} show interest. Share your shop link and feature your best item today.`,
      url: "/dashboard",
    };
  }

  if (activeProducts.length < 5) {
    return {
      title: "Add more products today",
      body: "Shops with more clear listings get more buyer trust. Add 3–5 products with good photos and prices.",
      url: "/dashboard/product/new",
    };
  }

  if (!shop.instagramUrl && !shop.facebookUrl && !shop.tiktokUrl && !shop.websiteUrl && !shop.xUrl) {
    return {
      title: "Build buyer trust",
      body: "Connect a social handle in your dashboard so buyers can trust and verify your shop faster.",
      url: "/dashboard",
    };
  }

  return {
    title: "Daily shop growth tip",
    body: topProduct ? `Share “${topProduct.title}” today and keep your WhatsApp replies fast.` : "Share your shop link today and keep your product photos clear.",
    url: "/dashboard",
  };
}

function pickUserRecommendation(args: {
  followedShopName?: string | null;
  likedProductTitle?: string | null;
  product?: typeof productsTable.$inferSelect | null;
  shop?: typeof shopsTable.$inferSelect | null;
}): PushPayload {
  const { followedShopName, likedProductTitle, product, shop } = args;
  if (product && shop) {
    return {
      title: followedShopName ? `New pick from ${shop.businessName}` : "Product pick for you",
      body: likedProductTitle
        ? `Because you liked “${likedProductTitle}”, check “${product.title}” from ${shop.businessName}.`
        : `Check “${product.title}” from ${shop.businessName}.`,
      url: `/products/${product.id}`,
    };
  }

  return {
    title: "Fresh products on Nakudin",
    body: "Open Nakudin to discover new products and shops near you today.",
    url: "/",
  };
}

export async function sendDailyPushRecommendations(logger?: Logger) {
  const now = new Date();
  const dayKey = todayKey(now);
  const yesterday = new Date(now.getTime() - ONE_DAY_MS);

  const tokens = await db.select().from(pushTokensTable);
  const userIds = unique(tokens.map(t => t.userId));
  if (!userIds.length) return { ownerSent: 0, userSent: 0, tokenCount: 0 };

  const shops = await db.select().from(shopsTable).where(inArray(shopsTable.id, userIds));
  const shopById = new Map(shops.map(s => [s.id, s]));

  let ownerSent = 0;
  for (const shop of shops) {
    const ownerTokens = tokens.filter(t => t.userId === shop.id).map(t => t.token);
    if (!ownerTokens.length) continue;

    const products = await db.select().from(productsTable).where(eq(productsTable.shopId, shop.id));
    const recentClicks = await db.select({ count: sql<number>`count(*)` }).from(whatsappClicksTable).where(and(eq(whatsappClicksTable.shopId, shop.id), gte(whatsappClicksTable.createdAt, yesterday)));
    const recentLikes = products.length
      ? await db.select({ count: sql<number>`count(*)` }).from(likesTable).where(and(inArray(likesTable.productId, products.map(p => p.id)), gte(likesTable.createdAt, yesterday)))
      : [{ count: 0 }];

    const payload = pickOwnerAdvice({
      shop,
      products,
      views: products.reduce((sum, p) => sum + (p.viewCount ?? 0), 0),
      clicks: Number(recentClicks[0]?.count ?? 0),
      likes: Number(recentLikes[0]?.count ?? 0),
    });
    const result = await sendPushToTokens(ownerTokens, payload, logger);
    ownerSent += result.sent ?? 0;
  }

  const buyerIds = userIds.filter(id => !shopById.has(id));
  let userSent = 0;
  for (const ids of chunk(buyerIds, 50)) {
    await Promise.all(ids.map(async (userId) => {
      const userTokens = tokens.filter(t => t.userId === userId).map(t => t.token);
      if (!userTokens.length) return;

      const [follow] = await db.select({ shopId: followsTable.shopId }).from(followsTable).where(eq(followsTable.followerId, userId)).orderBy(desc(followsTable.createdAt)).limit(1);
      const [liked] = await db.select({ productId: likesTable.productId }).from(likesTable).where(eq(likesTable.userId, userId)).orderBy(desc(likesTable.createdAt)).limit(1);
      const followedShop = follow?.shopId ? shopById.get(follow.shopId) ?? (await db.select().from(shopsTable).where(eq(shopsTable.id, follow.shopId)).limit(1))[0] : null;
      const likedProduct = liked?.productId ? (await db.select().from(productsTable).where(eq(productsTable.id, liked.productId)).limit(1))[0] : null;

      let recommendedProduct: typeof productsTable.$inferSelect | null = null;
      if (follow?.shopId) {
        recommendedProduct = (await db.select().from(productsTable).where(and(eq(productsTable.shopId, follow.shopId), eq(productsTable.status, "active"), gt(productsTable.stockQuantity, 0))).orderBy(desc(productsTable.trendScore), desc(productsTable.createdAt)).limit(1))[0] ?? null;
      }
      if (!recommendedProduct && likedProduct?.category) {
        recommendedProduct = (await db.select().from(productsTable).where(and(eq(productsTable.category, likedProduct.category), eq(productsTable.status, "active"))).orderBy(desc(productsTable.trendScore), desc(productsTable.createdAt)).limit(1))[0] ?? null;
      }
      if (!recommendedProduct) {
        recommendedProduct = (await db.select().from(productsTable).where(eq(productsTable.status, "active")).orderBy(desc(productsTable.trendScore), desc(productsTable.createdAt)).limit(1))[0] ?? null;
      }
      const productShop = recommendedProduct ? (shopById.get(recommendedProduct.shopId) ?? (await db.select().from(shopsTable).where(eq(shopsTable.id, recommendedProduct.shopId)).limit(1))[0]) : null;
      const payload = pickUserRecommendation({
        followedShopName: followedShop?.businessName,
        likedProductTitle: likedProduct?.title,
        product: recommendedProduct,
        shop: productShop,
      });
      const result = await sendPushToTokens(userTokens, payload, logger);
      userSent += result.sent ?? 0;
    }));
  }

  logger?.info?.({ dayKey, ownerSent, userSent, tokenCount: tokens.length }, "Daily push recommendations completed");
  return { ownerSent, userSent, tokenCount: tokens.length };
}
