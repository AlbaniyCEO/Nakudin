import { Link } from "wouter";
import { BadgeCheck, Users, Star } from "lucide-react";
import type { Shop } from "@workspace/api-client-react";

interface ShopCardProps {
  shop: Shop;
}

export function ShopCard({ shop }: ShopCardProps) {
  return (
    <Link href={`/shops/${shop.id}`} data-testid={`card-shop-${shop.id}`}>
      <div className="group bg-card border border-card-border rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
        <div className="relative h-24 bg-muted overflow-hidden">
          {shop.coverUrl ? (
            <img src={shop.coverUrl} alt={shop.businessName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
        </div>
        <div className="px-4 pb-4 pt-0 -mt-6 relative">
          <div className="w-12 h-12 rounded-xl border-2 border-card overflow-hidden bg-muted mb-2 shadow-sm">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.businessName} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {shop.businessName[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground truncate" data-testid={`text-shop-name-${shop.id}`}>{shop.businessName}</span>
                {shop.verified && <BadgeCheck size={15} className="text-[#1D9BF0] fill-[#1D9BF0] flex-shrink-0" strokeWidth={0} />}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{shop.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users size={11} />
              <span>{shop.followerCount.toLocaleString()}</span>
            </div>
            {shop.avgRating != null && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span>{shop.avgRating.toFixed(1)}</span>
              </div>
            )}
            {shop.locationCity && (
              <span className="text-xs text-muted-foreground truncate">{shop.locationCity}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
