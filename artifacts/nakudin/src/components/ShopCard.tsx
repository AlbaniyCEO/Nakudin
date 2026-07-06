import { Link } from "wouter";
import { BadgeCheck, Crown, Users, Star } from "lucide-react";
type ShopCardItem = {
  id: string;
  businessName: string;
  bio?: string | null;
  category: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  whatsappNumber?: string | null;
  locationCity?: string | null;
  verified?: boolean;
  followerCount?: number;
  avgRating?: number | null;
  premiumStatus?: "none" | "active";
  customSlug?: string | null;
};

interface ShopCardProps {
  shop: ShopCardItem;
}

export function ShopCard({ shop }: ShopCardProps) {
  return (
    <Link href={shop.customSlug ? `/s/${shop.customSlug}` : `/shops/${shop.id}`} data-testid={`card-shop-${shop.id}`}>
      <div className="group surface-1 border border-card-border interactive-card rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
        <div className="relative h-24 surface-2 overflow-hidden">
          {shop.coverUrl ? (
            <img src={shop.coverUrl} alt={shop.businessName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
        </div>
        <div className="px-4 pb-4 pt-0 -mt-6 relative">
          <div className="w-12 h-12 rounded-xl border-2 border-card overflow-hidden surface-2 mb-2 shadow-sm">
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
                {shop.premiumStatus === "active" && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-500 px-1.5 py-0.5 text-[10px] font-semibold"><Crown size={10} />Premium</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{shop.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users size={11} />
              <span>{(shop.followerCount ?? 0).toLocaleString()}</span>
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
