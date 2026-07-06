import { useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  useGetShop, useGetShopBySlug, useListProducts, useFollowShop, useUnfollowShop,
  useGetShopReviews, useCanReviewShop, useCreateReview,
  getGetShopQueryKey, getGetShopReviewsQueryKey,
} from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Crown, Share2, MapPin, Star, Users, MessageCircle, Package, ShoppingBag, Sparkles, Instagram, Facebook, Globe, Music2 } from "lucide-react";
import { motion } from "framer-motion";
import { ShareDialog } from "@/components/ShareDialog";
import { openShareSheet, updateOgMeta } from "@/lib/share";
import { getShopTheme, type ShopTheme } from "@/lib/shop-themes";

const TABS = ["Products", "Reviews", "About"] as const;
type Tab = (typeof TABS)[number];

type ShopLike = NonNullable<ReturnType<typeof useGetShop>["data"]>;
type ProductLike = { id: string; title: string; price: number; images?: string[]; stockQuantity?: number; status?: string; [key: string]: any };

function StarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} className="focus:outline-none">
          <Star size={22} className={s <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />
        </button>
      ))}
    </div>
  );
}


function normalizeSocialUrl(value?: string | null, platform?: "instagram" | "x" | "tiktok") {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  if (platform === "instagram") return `https://instagram.com/${handle}`;
  if (platform === "x") return `https://x.com/${handle}`;
  if (platform === "tiktok") return `https://tiktok.com/@${handle}`;
  return `https://${trimmed}`;
}

function SocialLinks({ shop }: { shop: ShopLike }) {
  const links = [
    { label: "Instagram", icon: Instagram, url: normalizeSocialUrl(shop.instagramUrl, "instagram") },
    { label: "Facebook", icon: Facebook, url: normalizeSocialUrl(shop.facebookUrl) },
    { label: "X", icon: Globe, url: normalizeSocialUrl(shop.xUrl, "x") },
    { label: "TikTok", icon: Music2, url: normalizeSocialUrl(shop.tiktokUrl, "tiktok") },
    { label: "Website", icon: Globe, url: normalizeSocialUrl(shop.websiteUrl) },
  ].filter(item => item.url);

  if (!links.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {links.map(({ label, icon: Icon, url }) => (
        <a key={label} href={url!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full surface-2 border border-white/8 px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
          <Icon size={13} /> {label}
        </a>
      ))}
    </div>
  );
}

function ShopAvatar({ shop, size = "md" }: { shop: ShopLike; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "w-24 h-24 text-3xl" : size === "sm" ? "w-12 h-12 text-lg" : "w-16 h-16 text-2xl";
  return (
    <div className={`${cls} rounded-2xl border border-white/10 surface-2 overflow-hidden shadow-lg flex-shrink-0`}>
      {shop.logoUrl ? (
        <img src={shop.logoUrl} alt={shop.businessName} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold">
          {shop.businessName[0]}
        </div>
      )}
    </div>
  );
}

function ShopName({ shop, large = false }: { shop: ShopLike; large?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
      <h1 className={`${large ? "text-3xl" : "text-xl"} font-extrabold text-foreground tracking-tight`} data-testid="text-shop-name">
        {shop.businessName}
      </h1>
      {shop.verified && <BadgeCheck size={large ? 22 : 18} className="text-[#1D9BF0] fill-[#1D9BF0] verified-glow rounded-full" strokeWidth={0} />}
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-500 px-2 py-0.5 text-xs font-semibold border border-amber-500/20">
        <Crown size={12} />Included tools
      </span>
    </div>
  );
}

function ShopActions({ isOwner, isFollowed, onShare, onFollow, onWhatsApp, onEdit }: {
  isOwner: boolean; isFollowed: boolean; onShare: () => void; onFollow: () => void; onWhatsApp: () => void; onEdit: () => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button variant="ghost" size="icon" onClick={onShare} className="h-9 w-9"><Share2 size={16} /></Button>
      {isOwner ? (
        <Button size="sm" variant="outline" onClick={onEdit} data-testid="button-edit-shop">Edit Shop</Button>
      ) : (
        <>
          <Button size="sm" variant={isFollowed ? "outline" : "default"} onClick={onFollow} data-testid="button-follow">
            {isFollowed ? "Following" : "Follow"}
          </Button>
          <Button size="sm" onClick={onWhatsApp} className="bg-[#25D366] hover:bg-[#1ebe5a] text-white" data-testid="button-whatsapp">
            WhatsApp
          </Button>
        </>
      )}
    </div>
  );
}

function ShopStats({ shop, productCount }: { shop: ShopLike; productCount: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="surface-1 rounded-2xl p-3 text-center"><p className="text-base font-bold text-foreground">{(shop.followerCount ?? 0).toLocaleString()}</p><p className="text-[11px] text-muted-foreground">Followers</p></div>
      <div className="surface-1 rounded-2xl p-3 text-center"><p className="text-base font-bold text-foreground">{productCount}</p><p className="text-[11px] text-muted-foreground">Products</p></div>
      <div className="surface-1 rounded-2xl p-3 text-center"><p className="text-base font-bold text-foreground flex items-center justify-center gap-0.5">{shop.avgRating != null ? shop.avgRating.toFixed(1) : "—"}<Star size={12} className="text-amber-400 fill-amber-400" /></p><p className="text-[11px] text-muted-foreground">Rating</p></div>
    </div>
  );
}

function ProductGrid({ products, shop, layout = "grid" }: { products: ProductLike[]; shop: ShopLike; layout?: "grid" | "list" | "masonry" }) {
  if (!products.length) {
    return (
      <div className="col-span-2 py-12 text-center text-muted-foreground">
        <Package size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No products listed yet.</p>
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className="space-y-3">
        {products.map(p => (
          <ProductCard key={p.id} product={{ ...p, shopName: shop.businessName, shopVerified: shop.verified, shopPremium: true, shopLogoUrl: shop.logoUrl ?? null, shopWhatsapp: shop.whatsappNumber ?? null, distanceKm: null, isFollowed: false, trendScore: null }} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 ${layout === "masonry" ? "gap-4" : "gap-3"}`}>
      {products.map((p, idx) => (
        <div key={p.id} className={layout === "masonry" && idx % 5 === 0 ? "col-span-2" : ""}>
          <ProductCard product={{ ...p, shopName: shop.businessName, shopVerified: shop.verified, shopPremium: true, shopLogoUrl: shop.logoUrl ?? null, shopWhatsapp: shop.whatsappNumber ?? null, distanceKm: null, isFollowed: false, trendScore: null }} />
        </div>
      ))}
    </div>
  );
}

function ThemeHero({ theme, shop, products, isOwner, isFollowed, actions }: {
  theme: ShopTheme; shop: ShopLike; products: ProductLike[]; isOwner: boolean; isFollowed: boolean; actions: { onShare: () => void; onFollow: () => void; onWhatsApp: () => void; onEdit: () => void };
}) {
  const config = getShopTheme(theme);
  const featured = products.find(p => p.id === shop.pinnedProductId) ?? products[0];

  if (theme === "editorial") {
    return (
      <section className="relative min-h-[360px] overflow-hidden rounded-b-[2rem] surface-1 border-x-0 border-t-0">
        <div className="absolute inset-0">
          {shop.coverUrl ? <img src={shop.coverUrl} alt={shop.businessName} className="w-full h-full object-cover opacity-55" /> : <div className={`w-full h-full bg-gradient-to-br ${config.accent}`} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/15" />
        </div>
        <div className="relative px-5 pt-20 pb-6 flex min-h-[360px] flex-col justify-end">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs text-white/80 mb-4 border border-white/10"><Sparkles size={13} />{shop.category}</div>
          <ShopName shop={shop} large />
          {shop.bio && <p className="text-sm text-white/75 mt-3 leading-relaxed max-w-[34rem]">{shop.bio}</p>}
          <div className="mt-5 flex items-end justify-between gap-3"><ShopAvatar shop={shop} /><ShopActions isOwner={isOwner} isFollowed={isFollowed} {...actions} /></div>
        </div>
      </section>
    );
  }

  if (theme === "boutique") {
    return (
      <section className="px-4 pt-5">
        <div className="rounded-[2rem] p-5 bg-gradient-to-br from-amber-500/10 via-pink-500/8 to-primary/8 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,.35)]">
          <div className="flex items-start gap-4"><ShopAvatar shop={shop} size="lg" /><div className="flex-1 min-w-0"><ShopName shop={shop} /><p className="text-sm text-muted-foreground mt-1">{shop.category}</p>{shop.bio && <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{shop.bio}</p>}</div></div>
          <div className="mt-5 flex justify-between gap-3 flex-wrap"><ShopActions isOwner={isOwner} isFollowed={isFollowed} {...actions} /></div>
        </div>
      </section>
    );
  }

  if (theme === "catalog") {
    return (
      <section className="px-4 pt-5">
        <div className="surface-1 rounded-2xl p-4 flex items-center gap-4">
          <ShopAvatar shop={shop} />
          <div className="flex-1 min-w-0"><ShopName shop={shop} /><p className="text-xs text-muted-foreground mt-1">{shop.category} · Product-first catalog</p></div>
          <ShopActions isOwner={isOwner} isFollowed={isFollowed} {...actions} />
        </div>
      </section>
    );
  }

  if (theme === "spotlight") {
    return (
      <section className="px-4 pt-5">
        <div className="surface-1 rounded-[2rem] overflow-hidden">
          <div className="relative h-44 surface-2">
            {featured?.images?.[0] ? <img src={featured.images[0]} alt={featured.title} className="w-full h-full object-cover opacity-75" /> : shop.coverUrl ? <img src={shop.coverUrl} alt={shop.businessName} className="w-full h-full object-cover opacity-75" /> : <div className={`w-full h-full bg-gradient-to-br ${config.accent}`} />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4"><p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-1">Spotlight shop</p><ShopName shop={shop} /></div>
          </div>
          <div className="p-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><ShopAvatar shop={shop} size="sm" /><p className="text-xs text-muted-foreground">{featured ? `Featured: ${featured.title}` : shop.category}</p></div><ShopActions isOwner={isOwner} isFollowed={isFollowed} {...actions} /></div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="relative h-44 surface-2 overflow-hidden">
        {shop.coverUrl ? <img src={shop.coverUrl} alt={shop.businessName} className="w-full h-full object-cover" /> : <div className={`w-full h-full bg-gradient-to-br ${config.accent} via-background to-background`} />}
      </div>
      <div className="px-4 -mt-8 relative">
        <div className="flex items-end justify-between gap-3"><ShopAvatar shop={shop} /><ShopActions isOwner={isOwner} isFollowed={isFollowed} {...actions} /></div>
        <div className="mt-4"><ShopName shop={shop} /><p className="text-sm text-muted-foreground mt-1">{shop.category}</p>{shop.bio && <p className="text-sm text-foreground mt-2 leading-relaxed">{shop.bio}</p>}</div>
      </div>
    </section>
  );
}

function Tabs({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void }) {
  return (
    <div className="flex surface-1 rounded-2xl p-1 mb-4 gap-1">
      {TABS.map(tab => (
        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${activeTab === tab ? "bg-primary text-black shadow-[0_0_18px_rgba(0,217,255,0.16)]" : "text-muted-foreground hover:text-foreground"}`}>{tab}</button>
      ))}
    </div>
  );
}

export default function ShopProfile() {
  const [, params] = useRoute("/shops/:shopId");
  const [, slugParams] = useRoute("/s/:slug");
  const shopId = params?.shopId ?? "";
  const slug = slugParams?.slug ?? "";
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("Products");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [followOverride, setFollowOverride] = useState<boolean | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const queryClient = useQueryClient();

  const shopById = useGetShop(shopId, { query: { enabled: !!shopId, queryKey: getGetShopQueryKey(shopId) } });
  const shopBySlug = useGetShopBySlug(slug, { query: { enabled: !!slug } });
  const shop = shopById.data ?? shopBySlug.data;
  const isLoading = shopById.isLoading || shopBySlug.isLoading;
  const resolvedShopId = shop?.id ?? shopId;
  const { data: products } = useListProducts({ shopId: resolvedShopId }, { query: { enabled: !!resolvedShopId } });
  const { data: reviews } = useGetShopReviews(resolvedShopId, { query: { enabled: activeTab === "Reviews" && !!resolvedShopId, queryKey: getGetShopReviewsQueryKey(resolvedShopId) } });
  const { data: canReview } = useCanReviewShop(resolvedShopId, { query: { enabled: activeTab === "Reviews" && !!user && !!resolvedShopId } });
  const follow = useFollowShop();
  const unfollow = useUnfollowShop();
  const createReview = useCreateReview();

  const sortedProducts = useMemo(() => [...(products?.products ?? [])].sort((a, b) => (a.id === shop?.pinnedProductId ? -1 : b.id === shop?.pinnedProductId ? 1 : 0)), [products?.products, shop?.pinnedProductId]);

  const handleFollow = () => {
    if (!user) { navigate("/login"); return; }
    const current = followOverride ?? shop?.isFollowed ?? false;
    const next = !current;
    setFollowOverride(next);
    const mutation = next ? follow : unfollow;
    mutation.mutate({ shopId: resolvedShopId }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetShopQueryKey(resolvedShopId) }), onError: () => setFollowOverride(current) });
  };

  const handleWhatsApp = () => {
    if (!shop?.whatsappNumber) return;
    window.open(`https://wa.me/${shop.whatsappNumber.replace(/\D/g, "")}?text=Hi, I found your shop on Nakudin!`, "_blank");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    await createReview.mutateAsync({ shopId: resolvedShopId, data: { rating: reviewRating, text: reviewText || undefined } });
    setReviewText("");
    queryClient.invalidateQueries({ queryKey: getGetShopReviewsQueryKey(resolvedShopId) });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try { await openShareSheet({ title: shop?.businessName || "Nakudin shop", text: shop?.bio || "Check out this shop on Nakudin", url }); }
    catch { setShareOpen(true); }
  };

  if (isLoading) {
    return <div className="animate-pulse" data-testid="page-shop-profile-loading"><div className="h-52 surface-2" /><div className="px-4 -mt-8"><div className="w-16 h-16 rounded-xl surface-2 mb-3" /><div className="h-5 w-40 surface-2 rounded mb-2" /><div className="h-4 w-28 surface-2 rounded" /></div></div>;
  }

  if (!shop) return <div className="p-8 text-center text-muted-foreground">Shop not found.</div>;

  updateOgMeta({ title: `${shop.businessName} • Nakudin`, description: shop.bio || shop.category, image: shop.logoUrl || shop.coverUrl, url: window.location.href });

  const theme = (shop.shopTheme ?? "classic") as ShopTheme;
  const isOwner = user?.uid === resolvedShopId;
  const isFollowedState = followOverride ?? shop?.isFollowed ?? false;
  const layout = theme === "catalog" ? "list" : theme === "boutique" ? "masonry" : "grid";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} data-testid="page-shop-profile" className={theme === "editorial" ? "" : "pb-20"}>
      <ThemeHero theme={theme} shop={shop} products={sortedProducts} isOwner={isOwner} isFollowed={isFollowedState} actions={{ onShare: handleShare, onFollow: handleFollow, onWhatsApp: handleWhatsApp, onEdit: () => navigate(`/shops/${resolvedShopId}/edit`) }} />

      <div className="px-4 pt-4 pb-20 space-y-4">
        {(shop.locationCity || shop.locationState) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} />{[shop.locationCity, shop.locationState].filter(Boolean).join(", ")}</div>
        )}
        <SocialLinks shop={shop} />
        <ShopStats shop={shop} productCount={sortedProducts.length} />
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "Products" && <ProductGrid products={sortedProducts} shop={shop} layout={layout as any} />}

        {activeTab === "Reviews" && (
          <div className="space-y-4">
            {user && canReview?.canReview && (
              <form onSubmit={handleSubmitReview} className="surface-1 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Leave a Review</h3>
                <StarRating rating={reviewRating} onChange={setReviewRating} />
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience with this shop..." rows={3} className="w-full surface-2 border border-input rounded-lg px-3 py-2 text-sm resize-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                <Button type="submit" size="sm" disabled={createReview.isPending}>{createReview.isPending ? "Posting..." : "Post Review"}</Button>
              </form>
            )}
            {reviews?.map(r => (
              <div key={r.id} className="surface-1 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  {r.authorLogoUrl ? <img src={r.authorLogoUrl} className="w-8 h-8 rounded-full object-cover" alt={r.authorName} /> : <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{r.authorName[0]}</div>}
                  <div><p className="text-sm font-medium text-foreground">{r.authorName}</p><div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={11} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />)}</div></div>
                </div>
                {r.text && <p className="text-sm text-foreground">{r.text}</p>}
                {r.ownerReply && <div className="mt-2 pl-3 border-l-2 border-primary/30"><p className="text-xs text-muted-foreground">Shop reply:</p><p className="text-sm text-foreground">{r.ownerReply}</p></div>}
              </div>
            ))}
            {!reviews?.length && <div className="py-12 text-center text-muted-foreground"><MessageCircle size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No reviews yet. Be the first!</p></div>}
          </div>
        )}

        {activeTab === "About" && (
          <div className="surface-1 rounded-2xl p-4 space-y-4">
            {shop.bio && <div><p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">About</p><p className="text-sm text-foreground">{shop.bio}</p></div>}
            {shop.whatsappNumber && <div><p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Contact</p><p className="text-sm text-foreground">{shop.whatsappNumber}</p></div>}
            <SocialLinks shop={shop} />
            {(shop.locationCity || shop.locationState) && <div><p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Location</p><p className="text-sm text-foreground">{[shop.locationCity, shop.locationState].filter(Boolean).join(", ")}</p></div>}
            <div><p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Member since</p><p className="text-sm text-foreground">{new Date(shop.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}</p></div>
            <div className="grid grid-cols-2 gap-2 pt-1"><div className="surface-2 rounded-xl p-3"><ShoppingBag size={16} className="text-primary mb-1" /><p className="text-xs text-muted-foreground">WhatsApp-first selling</p></div><div className="surface-2 rounded-xl p-3"><Users size={16} className="text-primary mb-1" /><p className="text-xs text-muted-foreground">Community profile shop</p></div></div>
          </div>
        )}
      </div>
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} title={shop?.businessName || "Nakudin shop"} url={window.location.href} />
    </motion.div>
  );
}
