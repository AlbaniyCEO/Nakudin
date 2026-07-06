import { useState } from "react";
import { Link } from "wouter";
import { Heart, BadgeCheck, Crown, MapPin } from "lucide-react";
import { useLikeProduct, useUnlikeProduct, getGetFeedQueryKey, getGetProductQueryKey } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
type ProductCardItem = {
  id: string;
  title: string;
  price: number;
  images?: string[];
  likeCount?: number;
  viewCount?: number;
  shopId?: string;
  shopName?: string;
  shopVerified?: boolean;
  shopPremium?: boolean;
  shopLogoUrl?: string | null;
  shopWhatsapp?: string | null;
  category?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  distanceKm?: number | null;
  isLiked?: boolean;
  isFollowed?: boolean;
  trendScore?: number | null;
  stockQuantity?: number | null;
  featuredUntil?: string | null;
  createdAt?: string;
};

interface ProductCardProps {
  product: ProductCardItem;
  onLikeToggle?: () => void;
}

function formatPrice(price: number) {
  return `₦${price.toLocaleString("en-NG")}`;
}

export function ProductCard({ product }: ProductCardProps) {
  const [liked, setLiked] = useState(product.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(product.likeCount ?? 0);
  const queryClient = useQueryClient();
  const like = useLikeProduct();
  const unlike = useUnlikeProduct();

  const isOOS = product.stockQuantity === 0;
  const isLowStock = !isOOS && product.stockQuantity != null && product.stockQuantity <= 3;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (liked) {
      setLiked(false);
      setLikeCount(c => c - 1);
      unlike.mutate({ productId: product.id }, {
        onError: () => { setLiked(true); setLikeCount(c => c + 1); },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(product.id) }),
      });
    } else {
      setLiked(true);
      setLikeCount(c => c + 1);
      like.mutate({ productId: product.id }, {
        onError: () => { setLiked(false); setLikeCount(c => c - 1); },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(product.id) }),
      });
    }
    queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
  };

  const image = product.images?.[0];

  return (
    <Link href={`/products/${product.id}`} data-testid={`card-product-${product.id}`}>
      <div className={`group surface-1 border border-card-border interactive-card rounded-xl overflow-hidden transition-all duration-200 ${isOOS ? "opacity-60 grayscale-[30%]" : "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"}`}>
        <div className="relative aspect-square surface-2 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={product.title}
              className={`w-full h-full object-cover ${!isOOS ? "group-hover:scale-105 transition-transform duration-300" : ""}`}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
          )}
          <button
            onClick={handleLike}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${liked ? "bg-red-500/90 text-white scale-110" : "premium-glass text-white hover:premium-glass"}`}
            data-testid={`button-like-${product.id}`}
          >
            <Heart size={14} fill={liked ? "currentColor" : "none"} />
          </button>
          {(product.shopVerified || product.shopPremium) && (
            <div className="absolute top-2 left-2 flex items-center gap-1">
              {product.shopVerified && <div className="w-6 h-6 rounded-full bg-[#1D9BF0] verified-glow flex items-center justify-center"><BadgeCheck size={14} className="text-white" fill="white" strokeWidth={0} /></div>}
              {product.shopPremium && <div className="h-6 rounded-full bg-amber-500/90 text-white px-2 flex items-center justify-center text-[10px] font-semibold gap-1"><Crown size={10} />Premium</div>}
            </div>
          )}
          {isOOS && (
            <div className="absolute bottom-2 left-2 bg-zinc-800/75 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Out of Stock
            </div>
          )}
          {isLowStock && (
            <div className="absolute bottom-2 left-2 bg-amber-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Only a few left
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-foreground line-clamp-1">{product.title}</p>
          <p className={`text-base font-bold mt-0.5 ${isOOS ? "text-muted-foreground" : "text-primary"}`}>{formatPrice(product.price)}</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 min-w-0">
              {product.shopLogoUrl ? (
                <img src={product.shopLogoUrl} alt={product.shopName} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full surface-2 flex-shrink-0" />
              )}
              <span className="text-xs text-muted-foreground truncate">{product.shopName}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <Heart size={10} fill={liked ? "currentColor" : "none"} className={liked ? "text-red-400" : ""} />
              <span>{likeCount}</span>
            </div>
          </div>
          {product.locationCity && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={10} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{product.locationCity}</span>
              {product.distanceKm != null && <span className="text-xs text-muted-foreground">· {product.distanceKm}km</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
