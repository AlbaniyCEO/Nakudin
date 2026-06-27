import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import { useAuth } from "./auth-context";
  import {
    getShop, checkBusinessName, createShop, updateShop, getShops,
    getFeed, getProducts, getProduct, createProduct, fsUpdateProduct, fsDeleteProduct,
    followShop, unfollowShop, isFollowing,
    getShopReviews, createReview, canReview, trackWhatsAppClick,
  } from "./firestore";

  // ── Query key helpers (same names as api-client-react exports) ─────────────────
  export const getGetMyShopQueryKey = () => ["myShop"] as const;
  export const getListProductsQueryKey = (p?: { shopId?: string }) => ["products", p?.shopId ?? "all"] as const;
  export const getGetShopQueryKey = (shopId: string) => ["shop", shopId] as const;
  export const getGetShopReviewsQueryKey = (shopId: string) => ["reviews", shopId] as const;
  export const getGetProductQueryKey = (productId: string) => ["product", productId] as const;
  export const getGetFeedQueryKey = () => ["feed"] as const;

  // ── Shops ──────────────────────────────────────────────────────────────────────

  export function useGetMyShop(_opts?: any) {
    const { user } = useAuth();
    return useQuery({
      queryKey: getGetMyShopQueryKey(),
      queryFn: () => (user ? getShop(user.uid) : null),
      enabled: !!user,
    });
  }

  export function useGetShop(shopId: string, opts?: any) {
    return useQuery({
      queryKey: getGetShopQueryKey(shopId),
      queryFn: () => getShop(shopId),
      enabled: opts?.query?.enabled ?? !!shopId,
    });
  }

  export function useGetShopAnalytics(shopId: string, opts?: any) {
    return useQuery({
      queryKey: getGetShopQueryKey(shopId),
      queryFn: () => getShop(shopId),
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
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (data: Parameters<typeof updateShop>[1]) => {
        if (!user) throw new Error("Not authenticated");
        return updateShop(user.uid, data);
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
        const products = await getProducts(shopId);
        return { products };
      },
      enabled: opts?.query?.enabled ?? !!shopId,
    });
  }

  export function useGetFeed(_params?: any, _opts?: any) {
    return useQuery({
      queryKey: getGetFeedQueryKey(),
      queryFn: async () => {
        const products = await getFeed(30);
        return { products };
      },
    });
  }

  export function useGetProduct(productId: string, opts?: any) {
    return useQuery({
      queryKey: getGetProductQueryKey(productId),
      queryFn: () => getProduct(productId),
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

  // ── Follows ────────────────────────────────────────────────────────────────────

  export function useFollowShop() {
    const { user } = useAuth();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (args: { shopId: string }) => {
        if (!user) throw new Error("Not authenticated");
        return followShop(user.uid, args.shopId);
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
        return unfollowShop(user.uid, args.shopId);
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
        const can = await canReview(user.uid, shopId);
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
        const shop = await getShop(user.uid);
        return createReview({
          shopId: args.shopId,
          authorId: user.uid,
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
        return trackWhatsAppClick(user.uid, args.shopId);
      },
      onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: ["canReview", user?.uid, v.shopId] }),
    });
  }
  