import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
    query, where, limit, Timestamp, serverTimestamp, deleteDoc,
    increment,
  } from "firebase/firestore";
  import { db } from "./firebase";
  import { scoreProductForDiscovery } from "./smart-discovery";

  // ── Types ──────────────────────────────────────────────────────────────────────

  export interface Shop {
    id: string;
    businessName: string;
    businessNameLower: string;
    bio?: string | null;
    category: string;
    logoUrl?: string | null;
    coverUrl?: string | null;
    whatsappNumber?: string | null;
    instagramUrl?: string | null;
    facebookUrl?: string | null;
    xUrl?: string | null;
    tiktokUrl?: string | null;
    websiteUrl?: string | null;
    locationCity?: string | null;
    locationState?: string | null;
    followerCount: number;
    totalViews: number;
    totalLikes: number;
    totalWhatsappClicks: number;
    avgRating?: number | null;
    reviewCount: number;
    verified: boolean;
    suspended: boolean;
    subscriptionStatus: "trial" | "active" | "grace" | "locked";
    trialEndsAt?: string | null;
    nextBillingDate?: string | null;
    billingCycle: "monthly" | "yearly";
    premiumStatus?: "none" | "active";
    premiumUntil?: string | null;
    customSlug?: string | null;
    pinnedProductId?: string | null;
    shopTheme?: "classic" | "editorial" | "boutique" | "catalog" | "spotlight";
    createdAt: string;
  }

  export interface Product {
    id: string;
    shopId: string;
    title: string;
    description?: string | null;
    price: number;
    images: string[];
    category?: string | null;
    status: "active" | "hidden" | "deleted";
    likeCount: number;
    stockQuantity: number;
    locationCity?: string | null;
    locationState?: string | null;
    featuredUntil?: string | null;
    viewCount?: number;
    whatsappClickCount?: number;
    isLiked?: boolean;
    createdAt: string;
  }

  export interface Review {
    id: string;
    shopId: string;
    authorId: string;
    authorName: string;
    authorLogoUrl?: string | null;
    rating: number;
    text?: string | null;
    ownerReply?: string | null;
    createdAt: string;
  }

  export interface ProductComment {
    id: string;
    productId: string;
    authorId: string;
    authorName: string;
    authorLogoUrl?: string | null;
    text: string;
    createdAt: string;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────────

  function toDate(ts: any): string {
    if (!ts) return new Date().toISOString();
    if (ts?.toDate) return ts.toDate().toISOString();
    if (ts instanceof Date) return ts.toISOString();
    if (typeof ts === "string" || typeof ts === "number") {
      const date = new Date(ts);
      return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }
    return new Date().toISOString();
  }

  function toShop(id: string, d: any): Shop {
    return {
      id,
      businessName: d.businessName ?? "",
      businessNameLower: d.businessNameLower ?? "",
      bio: d.bio ?? null,
      category: d.category ?? "",
      logoUrl: d.logoUrl ?? null,
      coverUrl: d.coverUrl ?? null,
      whatsappNumber: d.whatsappNumber ?? null,
      instagramUrl: d.instagramUrl ?? null,
      facebookUrl: d.facebookUrl ?? null,
      xUrl: d.xUrl ?? null,
      tiktokUrl: d.tiktokUrl ?? null,
      websiteUrl: d.websiteUrl ?? null,
      locationCity: d.locationCity ?? null,
      locationState: d.locationState ?? null,
      followerCount: d.followerCount ?? 0,
      totalViews: d.totalViews ?? 0,
      totalLikes: d.totalLikes ?? 0,
      totalWhatsappClicks: d.totalWhatsappClicks ?? 0,
      avgRating: d.avgRating ?? null,
      reviewCount: d.reviewCount ?? 0,
      verified: d.verified ?? false,
      suspended: d.suspended ?? false,
      subscriptionStatus: d.subscriptionStatus ?? "trial",
      trialEndsAt: d.trialEndsAt ? toDate(d.trialEndsAt) : null,
      nextBillingDate: d.nextBillingDate ? toDate(d.nextBillingDate) : null,
      billingCycle: d.billingCycle ?? "monthly",
      premiumStatus: d.premiumStatus ?? "none",
      premiumUntil: d.premiumUntil ? toDate(d.premiumUntil) : null,
      customSlug: d.customSlug ?? null,
      pinnedProductId: d.pinnedProductId ?? null,
      shopTheme: d.shopTheme ?? "classic",
      createdAt: toDate(d.createdAt),
    };
  }

  function toProduct(id: string, d: any): Product {
    return {
      id,
      shopId: d.shopId ?? "",
      title: d.title ?? "",
      description: d.description ?? null,
      price: d.price ?? 0,
      images: d.images ?? [],
      category: d.category ?? null,
      status: d.status ?? "active",
      likeCount: d.likeCount ?? 0,
      stockQuantity: d.stockQuantity ?? 1,
      locationCity: d.locationCity ?? null,
      locationState: d.locationState ?? null,
      featuredUntil: d.featuredUntil ? toDate(d.featuredUntil) : null,
      viewCount: d.viewCount ?? 0,
      whatsappClickCount: d.whatsappClickCount ?? 0,
      createdAt: toDate(d.createdAt),
    };
  }

  function toReview(id: string, d: any): Review {
    return {
      id,
      shopId: d.shopId ?? "",
      authorId: d.authorId ?? "",
      authorName: d.authorName ?? "User",
      authorLogoUrl: d.authorLogoUrl ?? null,
      rating: d.rating ?? 5,
      text: d.text ?? null,
      ownerReply: d.ownerReply ?? null,
      createdAt: toDate(d.createdAt),
    };
  }

  function toComment(id: string, d: any): ProductComment {
    return {
      id,
      productId: d.productId ?? "",
      authorId: d.authorId ?? "",
      authorName: d.authorName ?? "User",
      authorLogoUrl: d.authorLogoUrl ?? null,
      text: d.text ?? "",
      createdAt: toDate(d.createdAt),
    };
  }

  // ── Shops ──────────────────────────────────────────────────────────────────────

  export async function getShop(shopId: string): Promise<Shop | null> {
    if (!shopId) return null;
    const snap = await getDoc(doc(db, "shops", shopId));
    return snap.exists() ? toShop(snap.id, snap.data()) : null;
  }

  export async function getShopBySlug(slug: string): Promise<Shop | null> {
    if (!slug) return null;
    const q = query(collection(db, "shops"), where("customSlug", "==", slug), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return toShop(docSnap.id, docSnap.data());
  }

  export async function checkBusinessName(name: string): Promise<boolean> {
    if (!name || name.length < 2) return true;
    const q = query(collection(db, "shops"), where("businessNameLower", "==", name.toLowerCase()), limit(1));
    const snap = await getDocs(q);
    return snap.empty;
  }

  export async function createShop(userId: string, data: {
    businessName: string; whatsappNumber: string; category: string;
    bio?: string; logoUrl?: string; coverUrl?: string;
    locationCity?: string; locationState?: string;
  }): Promise<Shop> {
    const trialEndsAt = Timestamp.fromDate(new Date(Date.now() + 60 * 86400 * 1000));
    const payload = {
      businessName: data.businessName,
      businessNameLower: data.businessName.toLowerCase(),
      whatsappNumber: data.whatsappNumber,
      instagramUrl: null,
      facebookUrl: null,
      xUrl: null,
      tiktokUrl: null,
      websiteUrl: null,
      category: data.category,
      bio: data.bio ?? null,
      logoUrl: data.logoUrl ?? null,
      coverUrl: data.coverUrl ?? null,
      locationCity: data.locationCity ?? null,
      locationState: data.locationState ?? null,
      followerCount: 0, totalViews: 0, totalLikes: 0, totalWhatsappClicks: 0,
      reviewCount: 0, verified: false, suspended: false,
      subscriptionStatus: "trial",
      billingCycle: "monthly",
      premiumStatus: "none",
      customSlug: null,
      pinnedProductId: null,
      shopTheme: "classic",
      trialEndsAt,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "shops", userId), payload);
    return toShop(userId, { ...payload, createdAt: Timestamp.now() });
  }

  export async function updateShop(userId: string, data: Partial<{
    businessName: string; whatsappNumber: string; category: string;
    bio: string; logoUrl: string; coverUrl: string;
    instagramUrl: string | null; facebookUrl: string | null; xUrl: string | null; tiktokUrl: string | null; websiteUrl: string | null;
    locationCity: string; locationState: string;
    subscriptionStatus: "trial" | "active" | "grace" | "locked";
    nextBillingDate: string | null; billingCycle: "monthly" | "yearly";
    premiumStatus: "none" | "active"; premiumUntil: string | null;
    customSlug: string | null; pinnedProductId: string | null;
    shopTheme: "classic" | "editorial" | "boutique" | "catalog" | "spotlight";
  }>): Promise<void> {
    const current = await getShop(userId);
    const update: Record<string, any> = { ...data };
    if (data.businessName) update.businessNameLower = data.businessName.toLowerCase();
    if (data.nextBillingDate !== undefined) update.nextBillingDate = data.nextBillingDate ? Timestamp.fromDate(new Date(data.nextBillingDate)) : null;
    if (data.premiumUntil !== undefined) update.premiumUntil = data.premiumUntil ? Timestamp.fromDate(new Date(data.premiumUntil)) : null;

    if (data.customSlug !== undefined) {
      const slug = (data.customSlug ?? "").trim().toLowerCase();
      if (!slug) {
        update.customSlug = null;
      } else {
        const reserved = new Set(["admin", "api", "login", "register", "dashboard", "settings", "premium", "subscription", "shops", "products", "explore", "search", "create-shop", "s"]);
        const valid = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(slug) && !reserved.has(slug);
        if (!valid) throw new Error("Use a 3–30 character slug with lowercase letters, numbers, and hyphens only.");
        const existing = await getShopBySlug(slug);
        if (existing && existing.id !== userId) throw new Error("That custom shop URL is already taken.");
        update.customSlug = slug;
      }
    }

    if (data.pinnedProductId !== undefined && data.pinnedProductId) {
      const product = await getProduct(data.pinnedProductId, { incrementView: false });
      if (!product || product.shopId !== userId) throw new Error("You can only pin one of your own products.");
    }

    await updateDoc(doc(db, "shops", userId), update);
  }

  export async function getShops(opts?: { category?: string; limit?: number }): Promise<Shop[]> {
    // Keep this query index-light for Firebase projects without composite indexes.
    const q = query(collection(db, "shops"), limit(Math.max(opts?.limit ?? 20, 50)));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => toShop(d.id, d.data()))
      .filter(s => !s.suspended && (!opts?.category || s.category === opts.category))
      .sort((a, b) => (b.followerCount ?? 0) - (a.followerCount ?? 0))
      .slice(0, opts?.limit ?? 20);
  }

  // ── Products ───────────────────────────────────────────────────────────────────

  export async function getFeed(limitN = 20): Promise<Product[]> {
    // Avoid composite-index requirements; rank/filter client-side for the current MVP feed window.
    const q = query(collection(db, "products"), limit(Math.max(limitN * 3, 60)));
    const snap = await getDocs(q);
    const rows = snap.docs.map(d => toProduct(d.id, d.data())).filter(p => p.status === "active");
    return rows.sort((a, b) => {
      const score = (product: Product) => {
        const isFeatured = product.featuredUntil && new Date(product.featuredUntil).getTime() > Date.now();
        return scoreProductForDiscovery(product) + (isFeatured ? 1000 : 0);
      };
      return score(b) - score(a);
    }).slice(0, limitN);
  }

  export async function getProducts(shopId: string): Promise<Product[]> {
    if (!shopId) return [];
    const q = query(collection(db, "products"), where("shopId", "==", shopId), limit(100));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => toProduct(d.id, d.data()))
      .filter(p => p.status !== "deleted")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  export async function getProduct(productId: string, opts?: { incrementView?: boolean }): Promise<Product | null> {
    if (!productId) return null;
    const ref = doc(db, "products", productId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const product = toProduct(snap.id, snap.data());
    if (opts?.incrementView) {
      await updateDoc(ref, { viewCount: increment(1) });
      return { ...product, viewCount: (product.viewCount ?? 0) + 1 };
    }
    return product;
  }

  export async function createProduct(data: {
    shopId: string; title: string; price: number;
    description?: string; images?: string[]; category?: string;
    locationCity?: string; locationState?: string; stockQuantity?: number;
    featuredUntil?: string | null;
  }): Promise<Product> {
    const maxImages = 5;
    if ((data.images ?? []).length > maxImages) {
      throw new Error(`Products can upload up to 5 images.`);
    }

    const payload = {
      shopId: data.shopId,
      title: data.title,
      price: data.price,
      description: data.description ?? null,
      images: data.images ?? [],
      category: data.category ?? null,
      status: "active",
      likeCount: 0,
      viewCount: 0,
      whatsappClickCount: 0,
      stockQuantity: data.stockQuantity ?? 1,
      featuredUntil: data.featuredUntil ? Timestamp.fromDate(new Date(data.featuredUntil)) : null,
      locationCity: data.locationCity ?? null,
      locationState: data.locationState ?? null,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, "products"), payload);
    return toProduct(ref.id, { ...payload, createdAt: Timestamp.now() });
  }

  export async function fsUpdateProduct(productId: string, data: Partial<{
    title: string; price: number; description: string; images: string[];
    category: string; status: string; stockQuantity: number;
    locationCity: string; locationState: string; featuredUntil: string | null;
  }>): Promise<void> {
    const ref = doc(db, "products", productId);
    const before = await getDoc(ref);
    if (!before.exists()) throw new Error("Product not found.");
    const existing = toProduct(before.id, before.data());
    const maxImages = 5;
    if (data.images && data.images.length > maxImages) {
      throw new Error(`Products can upload up to 5 images.`);
    }

    const prevStock = before.data().stockQuantity ?? 1;
    const update: Record<string, any> = { ...data };
    if (data.featuredUntil !== undefined) {
      update.featuredUntil = data.featuredUntil ? Timestamp.fromDate(new Date(data.featuredUntil)) : null;
    }
    await updateDoc(ref, update as any);

    // Firestore-mode restock cleanup. Browser clients cannot securely send FCM,
    // but this keeps the watcher list accurate when the frontend uses Firestore paths.
    if (data.stockQuantity !== undefined && data.stockQuantity > 0 && prevStock === 0) {
      const watchers = await getDocs(query(collection(db, "stockWatchers"), where("productId", "==", productId), limit(100)));
      await Promise.all(watchers.docs.map(d => deleteDoc(d.ref)));
    }
  }

  export async function fsDeleteProduct(productId: string): Promise<void> {
    await updateDoc(doc(db, "products", productId), { status: "deleted" });
  }

  export async function likeProduct(userId: string, productId: string): Promise<{ liked: true; likeCount: number }> {
    const likeId = `${userId}_${productId}`;
    const likeRef = doc(db, "likes", likeId);
    const productRef = doc(db, "products", productId);
    const existing = await getDoc(likeRef);
    if (!existing.exists()) {
      await setDoc(likeRef, { userId, productId, createdAt: serverTimestamp() });
      await updateDoc(productRef, { likeCount: increment(1) });
    }
    const product = await getDoc(productRef);
    const productData = product.data();
    if (!existing.exists() && productData?.shopId) await updateDoc(doc(db, "shops", productData.shopId), { totalLikes: increment(1) });
    return { liked: true, likeCount: productData?.likeCount ?? 0 };
  }

  export async function unlikeProduct(userId: string, productId: string): Promise<{ liked: false; likeCount: number }> {
    const likeId = `${userId}_${productId}`;
    const productRef = doc(db, "products", productId);
    const existing = await getDoc(doc(db, "likes", likeId));
    const before = await getDoc(productRef);
    if (existing.exists()) {
      await deleteDoc(doc(db, "likes", likeId));
      await updateDoc(productRef, { likeCount: increment(-1) });
      const shopId = before.data()?.shopId;
      if (shopId) await updateDoc(doc(db, "shops", shopId), { totalLikes: increment(-1) });
    }
    const product = await getDoc(productRef);
    return { liked: false, likeCount: Math.max(0, product.data()?.likeCount ?? 0) };
  }

  export async function isProductLiked(userId: string, productId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, "likes", `${userId}_${productId}`));
    return snap.exists();
  }


  export async function isWatchingStock(userId: string, productId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, "stockWatchers", `${userId}_${productId}`));
    return snap.exists();
  }

  export async function watchStock(userId: string, productId: string): Promise<{ watching: true }> {
    await setDoc(doc(db, "stockWatchers", `${userId}_${productId}`), { userId, productId, createdAt: serverTimestamp() }, { merge: true });
    return { watching: true };
  }

  export async function unwatchStock(userId: string, productId: string): Promise<{ watching: false }> {
    await deleteDoc(doc(db, "stockWatchers", `${userId}_${productId}`));
    return { watching: false };
  }

  export async function getProductComments(productId: string): Promise<ProductComment[]> {
    const q = query(collection(db, "comments"), where("productId", "==", productId), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => toComment(d.id, d.data())).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  export async function createProductComment(data: {
    productId: string; authorId: string; authorName: string; authorLogoUrl?: string; text: string;
  }): Promise<ProductComment> {
    const payload = { ...data, createdAt: serverTimestamp() };
    const ref = await addDoc(collection(db, "comments"), payload);
    return toComment(ref.id, { ...payload, createdAt: Timestamp.now() });
  }

  export async function getRelatedProducts(productId: string): Promise<Product[]> {
    const product = await getProduct(productId, { incrementView: false });
    if (!product) return [];
    const q = query(collection(db, "products"), where("shopId", "==", product.shopId), limit(20));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => toProduct(d.id, d.data()))
      .filter(p => p.id !== productId && p.status === "active")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }

  // ── Follows ────────────────────────────────────────────────────────────────────

  export async function followShop(followerId: string, shopId: string): Promise<void> {
    const followId = `${followerId}_${shopId}`;
    await setDoc(doc(db, "follows", followId), { followerId, shopId, createdAt: serverTimestamp() });
    await updateDoc(doc(db, "shops", shopId), { followerCount: increment(1) });
  }

  export async function unfollowShop(followerId: string, shopId: string): Promise<void> {
    const followId = `${followerId}_${shopId}`;
    await deleteDoc(doc(db, "follows", followId));
    await updateDoc(doc(db, "shops", shopId), { followerCount: increment(-1) });
  }

  export async function isFollowing(followerId: string, shopId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, "follows", `${followerId}_${shopId}`));
    return snap.exists();
  }

  // ── Reviews ────────────────────────────────────────────────────────────────────

  export async function getShopReviews(shopId: string): Promise<Review[]> {
    const q = query(collection(db, "reviews"), where("shopId", "==", shopId), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => toReview(d.id, d.data())).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  export async function createReview(data: {
    shopId: string; authorId: string; authorName: string;
    authorLogoUrl?: string; rating: number; text?: string;
  }): Promise<Review> {
    const payload = { ...data, createdAt: serverTimestamp() };
    const ref = await addDoc(collection(db, "reviews"), payload);
    // Update shop avg rating
    const existing = await getDocs(query(collection(db, "reviews"), where("shopId", "==", data.shopId)));
    const ratings = existing.docs.map(d => d.data().rating as number);
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await updateDoc(doc(db, "shops", data.shopId), { avgRating: avg, reviewCount: ratings.length });
    return toReview(ref.id, { ...payload, createdAt: Timestamp.now() });
  }

  // ── WhatsApp click tracking ────────────────────────────────────────────────────

  export async function trackWhatsAppClick(userId: string, shopId: string): Promise<void> {
    const clickId = `${userId}_${shopId}`;
    await setDoc(doc(db, "whatsappClicks", clickId), { userId, shopId, createdAt: serverTimestamp() }, { merge: true });
    await updateDoc(doc(db, "shops", shopId), { totalWhatsappClicks: increment(1) });
  }

  export async function trackProductWhatsAppClick(args: { productId: string; shopId: string; userId?: string | null; deviceId: string }): Promise<void> {
    const clickId = `${args.productId}_${args.userId || args.deviceId}`;
    const clickRef = doc(db, "whatsappClicks", clickId);
    const existing = await getDoc(clickRef);
    await setDoc(clickRef, {
      productId: args.productId,
      shopId: args.shopId,
      userId: args.userId ?? null,
      deviceId: args.deviceId,
      createdAt: serverTimestamp(),
    }, { merge: true });

    // Count first unique click per user/device for this product to avoid extreme duplicate inflation.
    if (!existing.exists()) {
      await updateDoc(doc(db, "products", args.productId), { whatsappClickCount: increment(1) });
      await updateDoc(doc(db, "shops", args.shopId), { totalWhatsappClicks: increment(1) });
    }
  }

  export async function canReview(userId: string, shopId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, "whatsappClicks", `${userId}_${shopId}`));
    return snap.exists();
  }
  