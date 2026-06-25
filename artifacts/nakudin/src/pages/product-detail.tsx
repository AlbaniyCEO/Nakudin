import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  useGetProduct, useGetShop, useGetProductComments, useGetRelatedProducts,
  useLikeProduct, useUnlikeProduct, useCreateComment, useLogWhatsappClick,
  useFollowShop, getGetProductQueryKey, getGetProductCommentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Bell, BellOff, ChevronLeft, Heart, MapPin, MessageCircle, Send, Share2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function getDeviceId() {
  let id = localStorage.getItem("nakudin_device_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("nakudin_device_id", id); }
  return id;
}

async function fetchStockWatch(productId: string, token: string): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/api/products/${productId}/stock-watch`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return false;
    const d = await r.json();
    return d.watching;
  } catch { return false; }
}

async function toggleStockWatch(productId: string, token: string, watching: boolean): Promise<boolean> {
  const method = watching ? "DELETE" : "POST";
  const r = await fetch(`${API_BASE}/api/products/${productId}/stock-watch`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return watching;
  const d = await r.json();
  return d.watching;
}

export default function ProductDetail() {
  const [, params] = useRoute("/products/:productId");
  const productId = params?.productId ?? "";
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [imageIdx, setImageIdx] = useState(0);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [isFollowed, setIsFollowed] = useState(false);
  const [watching, setWatching] = useState<boolean | null>(null);
  const [watchLoading, setWatchLoading] = useState(false);

  const { data: product, isLoading } = useGetProduct(productId, { query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) } });
  const { data: shop } = useGetShop(product?.shopId ?? "", { query: { enabled: !!product?.shopId } });
  const { data: comments } = useGetProductComments(productId, { query: { enabled: !!productId, queryKey: getGetProductCommentsQueryKey(productId) } });
  const { data: related } = useGetRelatedProducts(productId, { query: { enabled: !!productId } });

  const likeProduct = useLikeProduct();
  const unlikeProduct = useUnlikeProduct();
  const createComment = useCreateComment();
  const logClick = useLogWhatsappClick();
  const followShop = useFollowShop();

  const isLiked = liked !== null ? liked : (product?.isLiked ?? false);
  const isOOS = product?.stockQuantity === 0;

  // Load watch state when product is loaded and user is available
  if (product && user && watching === null) {
    user.getIdToken().then(token => fetchStockWatch(productId, token).then(setWatching));
  }

  const handleLike = () => {
    if (!user) { navigate("/login"); return; }
    const next = !isLiked;
    setLiked(next);
    if (next) {
      likeProduct.mutate({ productId }, { onError: () => setLiked(!next) });
    } else {
      unlikeProduct.mutate({ productId }, { onError: () => setLiked(!next) });
    }
  };

  const handleWhatsApp = async () => {
    if (!shop?.whatsappNumber || !product) return;
    await logClick.mutateAsync({ productId, data: { deviceId: getDeviceId() } });
    const text = encodeURIComponent(`Hi, I'm interested in "${product.title}" on Nakudin`);
    window.open(`https://wa.me/${shop.whatsappNumber.replace(/\D/g, "")}?text=${text}`, "_blank");
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (!comment.trim()) return;
    await createComment.mutateAsync({ productId, data: { text: comment.trim() } });
    setComment("");
    queryClient.invalidateQueries({ queryKey: getGetProductCommentsQueryKey(productId) });
  };

  const handleFollow = () => {
    if (!product?.shopId || !user) { navigate("/login"); return; }
    const next = !isFollowed;
    setIsFollowed(next);
    if (next) {
      followShop.mutate({ shopId: product.shopId }, { onError: () => setIsFollowed(!next) });
    }
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: product?.title, url: window.location.href });
    else navigator.clipboard.writeText(window.location.href);
  };

  const handleWatch = async () => {
    if (!user) { navigate("/login"); return; }
    setWatchLoading(true);
    try {
      const token = await user.getIdToken();
      const next = await toggleStockWatch(productId, token, watching ?? false);
      setWatching(next);
    } finally {
      setWatchLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse" data-testid="page-product-loading">
        <div className="aspect-square bg-muted" />
        <div className="p-4 space-y-3">
          <div className="h-6 w-3/4 bg-muted rounded" />
          <div className="h-8 w-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!product) return <div className="p-8 text-center text-muted-foreground">Product not found.</div>;

  const images = product.images || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} data-testid="page-product-detail">
      {/* Back */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <button onClick={() => history.back()} className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={22} />
        </button>
      </div>

      {/* Image carousel */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {images.length > 0 ? (
          <img src={images[imageIdx]} alt={product.title} className={`w-full h-full object-cover ${isOOS ? "grayscale-[20%]" : ""}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
        )}
        {isOOS && (
          <div className="absolute top-3 left-3 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full">
            Sold Out
          </div>
        )}
        {!isOOS && product.stockQuantity != null && product.stockQuantity <= 3 && (
          <div className="absolute top-3 left-3 bg-amber-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">
            Only {product.stockQuantity} left
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setImageIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imageIdx ? "bg-white scale-125" : "bg-white/50"}`} />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-24">
        {/* Title & price */}
        <div className="py-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-foreground flex-1" data-testid="text-product-title">{product.title}</h1>
            <div className="flex gap-2">
              <button onClick={handleShare} className="p-1.5 text-muted-foreground hover:text-foreground"><Share2 size={18} /></button>
              <motion.button
                whileTap={{ scale: 1.3 }}
                onClick={handleLike}
                className={`p-1.5 transition-colors ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="button-like"
              >
                <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
              </motion.button>
            </div>
          </div>
          <p className={`text-2xl font-extrabold mt-1 ${isOOS ? "text-muted-foreground" : "text-secondary"}`} data-testid="text-product-price">
            ₦{product.price.toLocaleString("en-NG")}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{product.likeCount} likes</span>
            <span>{product.viewCount} views</span>
            {product.category && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{product.category}</span>}
          </div>
          {product.locationCity && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <MapPin size={11} />
              <span>{[product.locationCity, product.locationState].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>

        {/* Shop row */}
        {shop && (
          <Link href={`/shops/${shop.id}`}>
            <div className="flex items-center gap-3 py-4 border-b border-border group">
              <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.businessName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">{shop.businessName[0]}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">{shop.businessName}</span>
                  {shop.verified && <BadgeCheck size={14} className="text-[#1D9BF0] fill-[#1D9BF0] flex-shrink-0" strokeWidth={0} />}
                </div>
                <p className="text-xs text-muted-foreground">{shop.followerCount.toLocaleString()} followers</p>
              </div>
              <Button size="sm" variant={isFollowed ? "outline" : "default"} onClick={e => { e.preventDefault(); handleFollow(); }}>
                {isFollowed ? "Following" : "Follow"}
              </Button>
            </div>
          </Link>
        )}

        {/* Description */}
        {product.description && (
          <div className="py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        {/* WhatsApp CTA or Notify Me */}
        <div className="py-4 border-b border-border space-y-2">
          {!isOOS && shop?.whatsappNumber && (
            <Button
              className="w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-semibold"
              onClick={handleWhatsApp}
              data-testid="button-whatsapp"
            >
              Contact on WhatsApp
            </Button>
          )}
          {isOOS && (
            <Button
              variant={watching ? "outline" : "default"}
              className="w-full"
              onClick={handleWatch}
              disabled={watchLoading}
              data-testid="button-notify"
            >
              {watching ? (
                <><BellOff size={15} className="mr-2" />Stop Notifications</>
              ) : (
                <><Bell size={15} className="mr-2" />Notify me when back in stock</>
              )}
            </Button>
          )}
          {isOOS && (
            <p className="text-center text-xs text-muted-foreground">This item is currently sold out.</p>
          )}
        </div>

        {/* Comments */}
        <div className="pt-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <MessageCircle size={15} />
            Comments ({comments?.length ?? 0})
          </h3>
          <form onSubmit={handleComment} className="flex gap-2 mb-4">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={user ? "Add a comment..." : "Sign in to comment"}
              disabled={!user}
              className="flex-1 bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              data-testid="input-comment"
            />
            <Button type="submit" size="icon" disabled={!user || !comment.trim() || createComment.isPending} className="flex-shrink-0">
              <Send size={15} />
            </Button>
          </form>
          <div className="space-y-3">
            {comments?.map(c => (
              <div key={c.id} className="flex gap-3">
                {c.authorLogoUrl ? (
                  <img src={c.authorLogoUrl} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt={c.authorName} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">{c.authorName[0]}</div>
                )}
                <div className="bg-card border border-card-border rounded-xl px-3 py-2 flex-1">
                  <p className="text-xs font-medium text-foreground">{c.authorName}</p>
                  <p className="text-sm text-foreground mt-0.5">{c.text}</p>
                </div>
              </div>
            ))}
            {!comments?.length && (
              <p className="text-center text-xs text-muted-foreground py-4">No comments yet. Be the first!</p>
            )}
          </div>
        </div>

        {/* Related */}
        {(related?.length ?? 0) > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">More from this shop</h3>
            <div className="grid grid-cols-2 gap-3">
              {related?.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
