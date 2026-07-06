import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import { useAuth } from "./auth-context";
  import { getActingShopId, isAdminEmail } from "./admin";
  import {
    getShop, getShopBySlug, checkBusinessName, createShop, updateShop, getShops,
    getFeed, getProducts, getProduct, createProduct, fsUpdateProduct, fsDeleteProduct,
    likeProduct as fsLikeProduct, unlikeProduct as fsUnlikeProduct, isProductLiked,
    isWatchingStock, watchStock, unwatchStock,
    getProductComments as fsGetProductComments, createProductComment as fsCreateProductComment, getRelatedProducts as fsGetRelatedProducts,
    followShop, unfollowShop, isFollowing,
    getShopReviews, createReview, canReview, trackWhatsAppClick, trackProductWhatsAppClick,
  } from "./firestore";

  function useEffectiveShopId() {
    const { user } = useAuth();
    const [actingShopId, setActingShopIdState] = useState(() => getActingShopId());

    useEffect(() => {
      const handler = () => setActingShopIdState(getActingShopId());
      window.addEventListener("nakudin-admin-acting-shop-change", handler as EventListener);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener("nakudin-admin-acting-shop-change", handler as EventListener);
        window.removeEventListener("storage", handler);
      };
    }, []);

    const canActAsShop = isAdminEmail(user?.email);
    return canActAsShop && actingShopId ? actingShopId : user?.uid ?? null;
  }

  export function useAdminActingShop() {
    const { user } = useAuth();
    const actingShopId = useEffectiveShopId();
    const active = isAdminEmail(user?.email) && !!getActingShopId();
    return { actingShopId, active };
  }

  // ── Query key helpers (same names as api-client-react exports) ─────────────────
  export const getGetMyShopQueryKey = () => ["myShop"] as const;
  export const getListProductsQueryKey = (p?: { shopId?: string }) => ["products", p?.shopId ?? "all"] as const;
  export const getGetShopQueryKey = (shopId: string) => ["shop", shopId] as const;
  export const getGetShopReviewsQueryKey = (shopId: string) => ["reviews", shopId] as const;
  export const getGetProductQueryKey = (productId: string) => ["product", productId] as const;
  export const getGetProductCommentsQueryKey = (productId: string) => ["productComments", productId] as const;
  export const getGetRelatedProductsQueryKey = (productId: string) => ["relatedProducts", productId] as const;
  export const getGetFeedQueryKey = () => ["feed"] as const;

  // ── Shops ──────────────────────────────────────────────────────────────────────

  export function useGetMyShop(_opts?: any) {
    const { user } = useAuth();
    const effectiveShopId = useEffectiveShopId();
    return useQuery({
      queryKey: [...getGetMyShopQueryKey(), effectiveShopId ?? "none"],
      queryFn: async () => {
        if (!effectiveShopId) return null;
        try {
          const shop = await getShop(effectiveShopId);
          if (shop) return shop;
        } catch {}
        try {
          const cached = localStorage.getItem(`nakudin_dashboard_cache_${effectiveShopId}`);
          if (cached) return JSON.parse(cached).shop ?? null;
        } catch {}
        return null;
      },
      enabled: !!user && !!effectiveShopId,
    });
  }

  export function useGetShop(shopId: string, opts?: any) {
    const { user } = useAuth();
    return useQuery({
      queryKey: getGetShopQueryKey(shopId),
      queryFn: async () => {
        const shop = await getShop(shopId);
        if (!shop) return null;
        return { ...shop, isFollowed: user ? await isFollowing(user.uid, shopId) : false };
      },
      enabled: opts?.query?.enabled ?? !!shopId,
    });
  }

  export function useGetShopBySlug(slug: string, opts?: any) {
    const { user } = useAuth();
    return useQuery({
      queryKey: ["shopSlug", slug],
      queryFn: async () => {
        const shop = await getShopBySlug(slug);
        if (!shop) return null;
        return { ...shop, isFollowed: user ? await isFollowing(user.uid, shop.id) : false };
      },
      enabled: opts?.query?.enabled ?? !!slug,
    });
  }

  export function useGetShopAnalytics(shopId: string, opts?: any) {
    return useQuery({
      queryKey: ["shopAnalytics", shopId],
      queryFn: async () => {
        const shop = await getShop(shopId);
        const products = await getProducts(shopId);
        return {
          shopId,
          totalViews: shop?.totalViews ?? products.reduce((sum, p) => sum + (p.viewCount ?? 0), 0),
          totalLikes: shop?.totalLikes ?? products.reduce((sum, p) => sum + (p.likeCount ?? 0), 0),
          totalWhatsappClicks: shop?.totalWhatsappClicks ?? products.reduce((sum, p) => sum + (p.whatsappClickCount ?? 0), 0),
          followerCount: shop?.followerCount ?? 0,
          premiumStatus: shop?.premiumStatus ?? "none",
          trafficSources: [{ source: "Search", value: 42 }, { source: "Direct", value: 31 }, { source: "Feed", value: 27 }],
          timeOfDayEngagement: [{ slot: "Morning", value: 18 }, { slot: "Afternoon", value: 34 }, { slot: "Evening", value: 48 }],
          recentActivity: [],
          topProducts: [...products]
            .sort((a, b) => ((b.viewCount ?? 0) + b.likeCount + (b.whatsappClickCount ?? 0)) - ((a.viewCount ?? 0) + a.likeCount + (a.whatsappClickCount ?? 0)))
            .slice(0, 5)
            .map(p => ({ productId: p.id, title: p.title, views: p.viewCount ?? 0, likes: p.likeCount, clicks: p.whatsappClickCount ?? 0 })),
        };
      },
      enabled: opts?.query?.enabled ?? !!shopId,
    });
  }

  export function useCheckBusinessName(params: { name: string }, opts?: any) {
    return useQuery({
      queryKey: ["checkName", params.name],
      queryFn: async () => {
        const available = await checkBusinessName(params.name);
        return { available };
      },
      enabled: opts?.query?.enabled ?? (params.name.length >= 2),
    });
  }

  export function useCreateShop() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (data: {
        businessName: string; whatsappNumber: string; category: string;
        bio?: string; logoUrl?: string; coverUrl?: string;
        locationCity?: string; locationState?: string;
      }) => {
        if (!user) throw new Error("Not authenticated");
        return createShop(user.uid, data);
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetMyShopQueryKey() }),
    });
  }

  export function useUpdateMyShop(_opts?: any) {
    const { user } = useAuth();
    const effectiveShopId = useEffectiveShopId();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (data: Parameters<typeof updateShop>[1]) => {
        if (!user || !effectiveShopId) throw new Error("Not authenticated");
        return updateShop(effectiveShopId, data);
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetMyShopQueryKey() }),
    });
  }

  // ── Products ───────────────────────────────────────────────────────────────────

  export function useListProducts(params?: { shopId?: string }, opts?: any) {
    const shopId = params?.shopId ?? "";
    return useQuery({
      queryKey: getListProductsQueryKey({ shopId }),
      queryFn: async () => {
        try {
          const products = await getProducts(shopId);
          return { products };
        } catch {
          try {
            const cached = localStorage.getItem(`nakudin_dashboard_cache_${shopId}`);
            if (cached) return { products: JSON.parse(cached).products ?? [] };
          } catch {}
          return { products: [] };
        }
      },
      enabled: opts?.query?.enabled ?? !!shopId,
    });
  }

  export function useGetFeed(_params?: any, _opts?: any) {
    const { user } = useAuth();
    return useQuery({
      queryKey: [...getGetFeedQueryKey(), user?.uid ?? "guest"],
      queryFn: async () => {
        const products = await getFeed(30);
        const shopIds = [...new Set(products.map(p => p.shopId).filter(Boolean))];
        const shopMap = new Map((await Promise.all(shopIds.map(id => getShop(id)))).filter(Boolean).map(s => [s!.id, s!]));
        const likedIds = new Set<string>();
        const followedShopIds = new Set<string>();
        if (user) {
          await Promise.all(products.map(async (p) => {
            if (await isProductLiked(user.uid, p.id)) likedIds.add(p.id);
          }));
          await Promise.all(shopIds.map(async (shopId) => {
            if (await isFollowing(user.uid, shopId)) followedShopIds.add(shopId);
          }));
        }
        return {
          products: products.map(p => {
            const shop = shopMap.get(p.shopId);
            return {
              ...p,
              shopName: shop?.businessName ?? "Shop",
              shopVerified: shop?.verified ?? false,
              shopPremium: shop?.premiumStatus === "active",
              shopLogoUrl: shop?.logoUrl ?? null,
              shopWhatsapp: shop?.whatsappNumber ?? null,
              distanceKm: null,
              isLiked: likedIds.has(p.id),
              isFollowed: followedShopIds.has(p.shopId),
              trendScore: null,
            };
          }),
        };
      },
    });
  }

  export function useGetProduct(productId: string, opts?: any) {
    const { user } = useAuth();
    return useQuery({
      queryKey: getGetProductQueryKey(productId),
      queryFn: async () => {
        const product = await getProduct(productId, { incrementView: opts?.incrementView ?? false });
        if (!product) return null;
        return { ...product, isLiked: user ? await isProductLiked(user.uid, productId) : false };
      },
      enabled: opts?.query?.enabled ?? !!productId,
    });
  }

  export function useCreateProduct() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (args: { data: Parameters<typeof createProduct>[0] }) => {
        if (!user) throw new Error("Not authenticated");
        return createProduct(args.data);
      },
      onSuccess: (_r, v) => {
        qc.invalidateQueries({ queryKey: getListProductsQueryKey({ shopId: v.data.shopId }) });
      },
    });
  }

  export function useUpdateProduct() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (args: { productId: string; data: Parameters<typeof fsUpdateProduct>[1] }) => {
        if (!user) throw new Error("Not authenticated");
        return fsUpdateProduct(args.productId, args.data);
      },
      onSuccess: (_r, v) => {
        qc.invalidateQueries({ queryKey: getGetProductQueryKey(v.productId) });
        qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
    });
  }

  export function useDeleteProduct() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (args: { productId: string }) => {
        if (!user) throw new Error("Not authenticated");
        return fsDeleteProduct(args.productId);
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
    });
  }

  export function useLikeProduct() {
    const { user } = useAuth();
    return useMutation({
      mutationFn: async (args: { productId: string }) => {
        if (!user) throw new Error("Not authenticated");
        return fsLikeProduct(isAdminEmail(user.email) ? getActingShopId() || user.uid : user.uid, args.productId);
      },
    });
  }

  export function useUnlikeProduct() {
    const { user } = useAuth();
    return useMutation({
      mutationFn: async (args: { productId: string }) => {
        if (!user) throw new Error("Not authenticated");
        return fsUnlikeProduct(isAdminEmail(user.email) ? getActingShopId() || user.uid : user.uid, args.productId);
      },
    });
  }


  export function useGetStockWatch(productId: string, opts?: any) {
    const { user } = useAuth();
    return useQuery({
      queryKey: ["stockWatch", user?.uid ?? "guest", productId],
      queryFn: async () => ({ watching: user ? await isWatchingStock(user.uid, productId) : false }),
      enabled: opts?.query?.enabled ?? (!!user && !!productId),
    });
  }

  export function useToggleStockWatch() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (args: { productId: string; watching: boolean }) => {
        if (!user) throw new Error("Not authenticated");
        const effectiveUserId = isAdminEmail(user.email) ? getActingShopId() || user.uid : user.uid;
        return args.watching ? unwatchStock(effectiveUserId, args.productId) : watchStock(effectiveUserId, args.productId);
      },
      onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: ["stockWatch", user?.uid ?? "guest", v.productId] }),
    });
  }

  export function useGetProductComments(productId: string, opts?: any) {
    return useQuery({
      queryKey: getGetProductCommentsQueryKey(productId),
      queryFn: () => fsGetProductComments(productId),
      enabled: opts?.query?.enabled ?? !!productId,
    });
  }

  export function useCreateComment() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (args: { productId: string; data: { text: string } }) => {
        if (!user) throw new Error("Not authenticated");
        const effectiveShopId = isAdminEmail(user.email) ? getActingShopId() || user.uid : user.uid;
        const shop = await getShop(effectiveShopId);
        return fsCreateProductComment({
          productId: args.productId,
          authorId: effectiveShopId,
          authorName: shop?.businessName ?? user.displayName ?? "User",
          authorLogoUrl: shop?.logoUrl ?? undefined,
          text: args.data.text,
        });
      },
      onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: getGetProductCommentsQueryKey(v.productId) }),
    });
  }

  export function useGetRelatedProducts(productId: string, opts?: any) {
    return useQuery({
      queryKey: getGetRelatedProductsQueryKey(productId),
      queryFn: () => fsGetRelatedProducts(productId),
      enabled: opts?.query?.enabled ?? !!productId,
    });
  }

  export function useLogWhatsappClick() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (args: { productId: string; data?: { deviceId?: string } }) => {
        const product = await getProduct(args.productId, { incrementView: false });
        if (!product) return;
        await trackProductWhatsAppClick({ productId: args.productId, shopId: product.shopId, userId: user?.uid, deviceId: args.data?.deviceId ?? "unknown" });
      },
      onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: getGetProductQueryKey(v.productId) }),
    });
  }

  // ── Follows ────────────────────────────────────────────────────────────────────

  export function useFollowShop() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (args: { shopId: string }) => {
        if (!user) throw new Error("Not authenticated");
        return followShop(isAdminEmail(user.email) ? getActingShopId() || user.uid : user.uid, args.shopId);
      },
      onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: getGetShopQueryKey(v.shopId) }),
    });
  }

  export function useUnfollowShop() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (args: { shopId: string }) => {
        if (!user) throw new Error("Not authenticated");
        return unfollowShop(isAdminEmail(user.email) ? getActingShopId() || user.uid : user.uid, args.shopId);
      },
      onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: getGetShopQueryKey(v.shopId) }),
    });
  }

  // ── Reviews ────────────────────────────────────────────────────────────────────

  export function useGetShopReviews(shopId: string, opts?: any) {
    return useQuery({
      queryKey: getGetShopReviewsQueryKey(shopId),
      queryFn: () => getShopReviews(shopId),
      enabled: opts?.query?.enabled ?? !!shopId,
    });
  }

  export function useCanReviewShop(shopId: string, opts?: any) {
    const { user } = useAuth();
    return useQuery({
      queryKey: ["canReview", user?.uid, shopId],
      queryFn: async () => {
        if (!user) return { canReview: false };
        const can = await canReview(isAdminEmail(user.email) ? getActingShopId() || user.uid : user.uid, shopId);
        return { canReview: can };
      },
      enabled: opts?.query?.enabled ?? (!!user && !!shopId),
    });
  }

  export function useCreateReview() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (args: { shopId: string; data: { rating: number; text?: string } }) => {
        if (!user) throw new Error("Not authenticated");
        const effectiveShopId = isAdminEmail(user.email) ? getActingShopId() || user.uid : user.uid;
        const shop = await getShop(effectiveShopId);
        return createReview({
          shopId: args.shopId,
          authorId: effectiveShopId,
          authorName: shop?.businessName ?? user.displayName ?? "User",
          authorLogoUrl: shop?.logoUrl ?? undefined,
          rating: args.data.rating,
          text: args.data.text,
        });
      },
      onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: getGetShopReviewsQueryKey(v.shopId) }),
    });
  }

  // ── WhatsApp tracking ──────────────────────────────────────────────────────────

  export function useTrackWhatsAppClick() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (args: { shopId: string }) => {
        if (!user) return;
        return trackWhatsAppClick(isAdminEmail(user.email) ? getActingShopId() || user.uid : user.uid, args.shopId);
      },
      onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: ["canReview", user?.uid, v.shopId] }),
    });
  }
  