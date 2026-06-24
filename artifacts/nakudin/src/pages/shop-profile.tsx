import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  useGetShop, useListProducts, useFollowShop, useUnfollowShop,
  useGetShopReviews, useCanReviewShop, useCreateReview,
  getGetShopQueryKey, getGetShopReviewsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { ShopCard } from "@/components/ShopCard";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Share2, MapPin, Star, Users, MessageCircle, Package } from "lucide-react";
import { motion } from "framer-motion";

const TABS = ["Products", "Reviews", "About"] as const;
type Tab = (typeof TABS)[number];

function StarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} onClick={() => onChange(s)} className="focus:outline-none">
          <Star size={22} className={s <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />
        </button>
      ))}
    </div>
  );
}

export default function ShopProfile() {
  const [, params] = useRoute("/shops/:shopId");
  const shopId = params?.shopId ?? "";
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("Products");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isFollowed, setIsFollowed] = useState(false);
  const queryClient = useQueryClient();

  const { data: shop, isLoading } = useGetShop(shopId, { query: { enabled: !!shopId, queryKey: getGetShopQueryKey(shopId) } });
  const { data: products } = useListProducts({ shopId }, { query: { enabled: !!shopId } });
  const { data: reviews } = useGetShopReviews(shopId, { query: { enabled: activeTab === "Reviews" && !!shopId, queryKey: getGetShopReviewsQueryKey(shopId) } });
  const { data: canReview } = useCanReviewShop(shopId, { query: { enabled: activeTab === "Reviews" && !!user && !!shopId } });
  const follow = useFollowShop();
  const unfollow = useUnfollowShop();
  const createReview = useCreateReview();

  const handleFollow = () => {
    if (!user) { navigate("/login"); return; }
    const next = !isFollowed;
    setIsFollowed(next);
    if (next) {
      follow.mutate({ shopId }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetShopQueryKey(shopId) }), onError: () => setIsFollowed(!next) });
    } else {
      unfollow.mutate({ shopId }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetShopQueryKey(shopId) }), onError: () => setIsFollowed(!next) });
    }
  };

  const handleWhatsApp = () => {
    if (!shop?.whatsappNumber) return;
    window.open(`https://wa.me/${shop.whatsappNumber.replace(/\D/g, "")}?text=Hi, I found your shop on Nakudin!`, "_blank");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    await createReview.mutateAsync({ shopId, data: { rating: reviewRating, text: reviewText || undefined } });
    setReviewText("");
    queryClient.invalidateQueries({ queryKey: getGetShopReviewsQueryKey(shopId) });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: shop?.businessName, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const isOwner = user?.uid === shopId;
  const isFollowedState = shop?.isFollowed ?? isFollowed;

  if (isLoading) {
    return (
      <div className="animate-pulse" data-testid="page-shop-profile-loading">
        <div className="h-40 bg-muted" />
        <div className="px-4 -mt-8">
          <div className="w-16 h-16 rounded-xl bg-muted mb-3" />
          <div className="h-5 w-40 bg-muted rounded mb-2" />
          <div className="h-4 w-28 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!shop) return <div className="p-8 text-center text-muted-foreground">Shop not found.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} data-testid="page-shop-profile">
      {/* Cover */}
      <div className="relative h-44 bg-muted overflow-hidden">
        {shop.coverUrl ? (
          <img src={shop.coverUrl} alt={shop.businessName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-background" />
        )}
      </div>

      <div className="px-4 pb-20">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-8 mb-4">
          <div className="w-16 h-16 rounded-xl border-2 border-card bg-muted overflow-hidden shadow-lg flex-shrink-0">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.businessName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                {shop.businessName[0]}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-8">
            <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8">
              <Share2 size={16} />
            </Button>
            {isOwner ? (
              <Button size="sm" variant="outline" onClick={() => navigate(`/shops/${shopId}/edit`)} data-testid="button-edit-shop">
                Edit Shop
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={isFollowedState ? "outline" : "default"}
                  onClick={handleFollow}
                  data-testid="button-follow"
                >
                  {isFollowedState ? "Following" : "Follow"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleWhatsApp}
                  className="bg-[#25D366] hover:bg-[#1ebe5a] text-white"
                  data-testid="button-whatsapp"
                >
                  WhatsApp
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h1 className="text-xl font-bold text-foreground" data-testid="text-shop-name">{shop.businessName}</h1>
            {shop.verified && <BadgeCheck size={20} className="text-[#1D9BF0] fill-[#1D9BF0]" strokeWidth={0} />}
          </div>
          <p className="text-sm text-muted-foreground">{shop.category}</p>
          {shop.bio && <p className="text-sm text-foreground mt-2 leading-relaxed">{shop.bio}</p>}
          {(shop.locationCity || shop.locationState) && (
            <div className="flex items-center gap-1 mt-2">
              <MapPin size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{[shop.locationCity, shop.locationState].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 py-3 border-y border-border mb-4">
          <div className="text-center">
            <p className="text-base font-bold text-foreground">{shop.followerCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-foreground">{products?.products.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Products</p>
          </div>
          {shop.avgRating != null && (
            <div className="text-center">
              <p className="text-base font-bold text-foreground flex items-center gap-0.5">
                {shop.avgRating.toFixed(1)}
                <Star size={12} className="text-amber-400 fill-amber-400" />
              </p>
              <p className="text-xs text-muted-foreground">{shop.reviewCount} reviews</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4 gap-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Products" && (
          <div className="grid grid-cols-2 gap-3">
            {products?.products.map(p => (
              <ProductCard key={p.id} product={{ ...p, shopName: shop.businessName, shopVerified: shop.verified, shopLogoUrl: shop.logoUrl ?? null, shopWhatsapp: shop.whatsappNumber ?? null, distanceKm: null, isFollowed: false, trendScore: null }} />
            ))}
            {!products?.products.length && (
              <div className="col-span-2 py-12 text-center text-muted-foreground">
                <Package size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No products listed yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "Reviews" && (
          <div className="space-y-4">
            {user && canReview?.canReview && (
              <form onSubmit={handleSubmitReview} className="bg-card border border-card-border rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Leave a Review</h3>
                <StarRating rating={reviewRating} onChange={setReviewRating} />
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Share your experience with this shop..."
                  rows={3}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm resize-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" size="sm" disabled={createReview.isPending}>
                  {createReview.isPending ? "Posting..." : "Post Review"}
                </Button>
              </form>
            )}
            {reviews?.map(r => (
              <div key={r.id} className="bg-card border border-card-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  {r.authorLogoUrl ? (
                    <img src={r.authorLogoUrl} className="w-8 h-8 rounded-full object-cover" alt={r.authorName} />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{r.authorName[0]}</div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.authorName}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />
                      ))}
                    </div>
                  </div>
                </div>
                {r.text && <p className="text-sm text-foreground">{r.text}</p>}
                {r.ownerReply && (
                  <div className="mt-2 pl-3 border-l-2 border-primary/30">
                    <p className="text-xs text-muted-foreground">Shop reply:</p>
                    <p className="text-sm text-foreground">{r.ownerReply}</p>
                  </div>
                )}
              </div>
            ))}
            {!reviews?.length && (
              <div className="py-12 text-center text-muted-foreground">
                <MessageCircle size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No reviews yet. Be the first!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "About" && (
          <div className="space-y-4">
            <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
              {shop.bio && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">About</p>
                  <p className="text-sm text-foreground">{shop.bio}</p>
                </div>
              )}
              {shop.whatsappNumber && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Contact</p>
                  <p className="text-sm text-foreground">{shop.whatsappNumber}</p>
                </div>
              )}
              {(shop.locationCity || shop.locationState) && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Location</p>
                  <p className="text-sm text-foreground">{[shop.locationCity, shop.locationState].filter(Boolean).join(", ")}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Member since</p>
                <p className="text-sm text-foreground">{new Date(shop.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
