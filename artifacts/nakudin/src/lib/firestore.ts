import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
    query, where, orderBy, limit, Timestamp, serverTimestamp, deleteDoc,
    increment,
  } from "firebase/firestore";
  import { db } from "./firebase";

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

  // ── Helpers ────────────────────────────────────────────────────────────────────

  function toDate(ts: any): string {
    if (!ts) return new Date().toISOString();
    if (ts?.toDate) return ts.toDate().toISOString();
    if (ts instanceof Date) return ts.toISOString();
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
      stockQuantity: d.stockQuantity ?? 0,
      locationCity: d.locationCity ?? null,
      locationState: d.locationState ?? null,
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

  // ── Shops ──────────────────────────────────────────────────────────────────────

  export async function getShop(shopId: string): Promise<Shop | null> {
    if (!shopId) return null;
    const snap = await getDoc(doc(db, "shops", shopId));
    return snap.exists() ? toShop(snap.id, snap.data()) : null;
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
      category: data.category,
      bio: data.bio ?? null,
      logoUrl: data.logoUrl ?? null,
      coverUrl: data.coverUrl ?? null,
      locationCity: data.locationCity ?? null,
      locationState: data.locationState ?? null,
      followerCount: 0, totalViews: 0, totalLikes: 0, totalWhatsappClicks: 0,
      reviewCount: 0, verified: false, suspended: false,
      subscriptionStatus: "trial",
      trialEndsAt,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "shops", userId), payload);
    return toShop(userId, { ...payload, createdAt: Timestamp.now() });
  }

  export async function updateShop(userId: string, data: Partial<{
    businessName: string; whatsappNumber: string; category: string;
    bio: string; logoUrl: string; coverUrl: string;
    locationCity: string; locationState: string;
  }>): Promise<void> {
    const update: Record<string, any> = { ...data };
    if (data.businessName) update.businessNameLower = data.businessName.toLowerCase();
    await updateDoc(doc(db, "shops", userId), update);
  }

  export async function getShops(opts?: { category?: string; limit?: number }): Promise<Shop[]> {
    const conditions: any[] = [where("suspended", "==", false)];
    if (opts?.category) conditions.push(where("category", "==", opts.category));
    const q = query(collection(db, "shops"), ...conditions, orderBy("followerCount", "desc"), limit(opts?.limit ?? 20));
    const snap = await getDocs(q);
    return snap.docs.map(d => toShop(d.id, d.data()));
  }

  // ── Products ───────────────────────────────────────────────────────────────────

  export async function getFeed(limitN = 20): Promise<Product[]> {
    const q = query(
      collection(db, "products"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(limitN)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => toProduct(d.id, d.data()));
  }

  export async function getProducts(shopId: string): Promise<Product[]> {
    if (!shopId) return [];
    const q = query(
      collection(db, "products"),
      where("shopId", "==", shopId),
      where("status", "!=", "deleted"),
      orderBy("status"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => toProduct(d.id, d.data()));
  }

  export async function getProduct(productId: string): Promise<Product | null> {
    if (!productId) return null;
    const snap = await getDoc(doc(db, "products", productId));
    return snap.exists() ? toProduct(snap.id, snap.data()) : null;
  }

  export async function createProduct(data: {
    shopId: string; title: string; price: number;
    description?: string; images?: string[]; category?: string;
    locationCity?: string; locationState?: string; stockQuantity?: number;
  }): Promise<Product> {
    const payload = {
      shopId: data.shopId,
      title: data.title,
      price: data.price,
      description: data.description ?? null,
      images: data.images ?? [],
      category: data.category ?? null,
      status: "active",
      likeCount: 0,
      stockQuantity: data.stockQuantity ?? 0,
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
    locationCity: string; locationState: string;
  }>): Promise<void> {
    await updateDoc(doc(db, "products", productId), data as any);
  }

  export async function fsDeleteProduct(productId: string): Promise<void> {
    await updateDoc(doc(db, "products", productId), { status: "deleted" });
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
    const q = query(collection(db, "reviews"), where("shopId", "==", shopId), orderBy("createdAt", "desc"), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => toReview(d.id, d.data()));
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

  export async function canReview(userId: string, shopId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, "whatsappClicks", `${userId}_${shopId}`));
    return snap.exists();
  }
  