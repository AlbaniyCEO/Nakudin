import { useState } from "react";
import { Link } from "wouter";
import { Heart, BadgeCheck, MapPin } from "lucide-react";
import { useLikeProduct, useUnlikeProduct, getGetFeedQueryKey, getGetProductQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { FeedProduct } from "@workspace/api-client-react";

interface ProductCardProps {
  product: FeedProduct;
  onLikeToggle?: () => void;
}

function formatPrice(price: number) {
  return `₦${price.toLocaleString("en-NG")}`;
}

export function ProductCard({ product }: ProductCardProps) {
  const [liked, setLiked] = useState(product.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(product.likeCount);
  const queryClient = useQueryClient();
  const like = useLikeProduct();
  const unlike = useUnlikeProduct();

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
      <div className="group bg-card border border-card-border rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
          )}
          <button
            onClick={handleLike}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${liked ? "bg-red-500/90 text-white scale-110" : "bg-black/40 text-white hover:bg-black/60"}`}
            data-testid={`button-like-${product.id}`}
          >
            <Heart size={14} fill={liked ? "currentColor" : "none"} />
          </button>
          {product.shopVerified && (
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#1D9BF0] flex items-center justify-center">
              <BadgeCheck size={14} className="text-white" fill="white" strokeWidth={0} />
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-foreground line-clamp-1">{product.title}</p>
          <p className="text-base font-bold text-primary mt-0.5">{formatPrice(product.price)}</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 min-w-0">
              {product.shopLogoUrl ? (
                <img src={product.shopLogoUrl} alt={product.shopName} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-muted flex-shrink-0" />
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
