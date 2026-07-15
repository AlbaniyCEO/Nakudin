import { useEffect, useMemo, useState } from "react";
import { Search, Store, TrendingUp } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ShopCard } from "@/components/ShopCard";
import { getFeed, getShops, type Product, type Shop } from "@/lib/firestore";

const CATEGORIES = [
  "All", "Fashion & Clothing", "Electronics & Gadgets", "Phones & Accessories",
  "Home & Furniture", "Beauty & Personal Care", "Food & Groceries",
  "Automobile & Spare Parts", "Services", "Other",
];

type EnrichedProduct = Product & {
  shopName: string;
  shopVerified: boolean;
  shopPremium: boolean;
  shopLogoUrl: string | null;
  shopWhatsapp: string | null;
  isLiked: boolean;
  isFollowed: boolean;
  trendScore: null;
  distanceKm: null;
};

function ProductSkeleton() {
  return (
    <div className="surface-1 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square surface-2" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 surface-2 rounded w-3/4" />
        <div className="h-4 surface-2 rounded w-1/2" />
        <div className="h-3 surface-2 rounded w-2/3 mt-2" />
      </div>
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div className="surface-1 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-xl surface-2 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 surface-2 rounded w-1/2" />
        <div className="h-3 surface-2 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function Explore() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [products, setProducts] = useState<EnrichedProduct[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getFeed(60), getShops({ limit: 40 })])
      .then(([productRows, shopRows]) => {
        if (cancelled) return;
        // Merge shop data into each product so ProductCard shows name, badges etc.
        const shopMap = new Map(shopRows.map((s) => [s.id, s]));
        const enriched: EnrichedProduct[] = productRows.map((p) => {
          const shop = shopMap.get(p.shopId);
          return {
            ...p,
            shopName: shop?.businessName ?? "Shop",
            shopVerified: shop?.verified ?? false,
            shopPremium: shop?.premiumStatus === "active",
            shopLogoUrl: shop?.logoUrl ?? null,
            shopWhatsapp: shop?.whatsappNumber ?? null,
            isLiked: false,
            isFollowed: false,
            trendScore: null,
            distanceKm: null,
          };
        });
        setProducts(enriched);
        setShops(shopRows);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inCat = (v?: string | null) => category === "All" || v === category;
    return {
      products: products.filter((p) => {
        const match = !q || [p.title, p.description, p.category, p.locationCity, p.locationState]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
        return match && inCat(p.category);
      }),
      shops: shops.filter((s) => {
        const match = !q || [s.businessName, s.bio, s.category, s.locationCity, s.locationState]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
        return match && inCat(s.category);
      }),
    };
  }, [products, shops, query, category]);

  return (
    <div className="p-4 pb-24" data-testid="page-explore">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground">Explore</h1>
        <p className="text-sm text-muted-foreground mt-1">Search products and discover shops on Nakudin.</p>
      </div>

      {/* Search + category filter */}
      <div className="surface-1 rounded-2xl p-3 mb-4">
        <div className="flex items-center gap-2 surface-2 rounded-xl px-3 py-2 border border-white/8">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, shops, cities…"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            data-testid="input-explore-search"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={[
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors",
                category === c
                  ? "bg-primary text-black border-primary shadow-[0_0_18px_rgba(0,217,255,0.16)]"
                  : "surface-2 border-white/8 text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-7">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">Products</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          </section>
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Store size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">Shops</h2>
            </div>
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, i) => <ShopSkeleton key={i} />)}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-7">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">Products</h2>
              <span className="text-xs text-muted-foreground">({filtered.products.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filtered.products.slice(0, 30).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
              {!filtered.products.length && (
                <p className="col-span-2 text-center text-sm text-muted-foreground py-8">No matching products.</p>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Store size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">Shops</h2>
              <span className="text-xs text-muted-foreground">({filtered.shops.length})</span>
            </div>
            <div className="grid gap-3">
              {filtered.shops.slice(0, 20).map((s) => (
                <ShopCard key={s.id} shop={s} />
              ))}
              {!filtered.shops.length && (
                <p className="text-center text-sm text-muted-foreground py-8">No matching shops.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
