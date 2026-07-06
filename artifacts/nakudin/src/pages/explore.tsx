import { useEffect, useMemo, useState } from "react";
import { Search, Store, TrendingUp, Loader2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ShopCard } from "@/components/ShopCard";
import { getFeed, getShops, type Product, type Shop } from "@/lib/firestore";

const CATEGORIES = [
  "All",
  "Fashion & Clothing",
  "Electronics & Gadgets",
  "Phones & Accessories",
  "Home & Furniture",
  "Beauty & Personal Care",
  "Food & Groceries",
  "Automobile & Spare Parts",
  "Services",
  "Other",
];

export default function Explore() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getFeed(60), getShops({ limit: 40 })])
      .then(([productRows, shopRows]) => {
        if (cancelled) return;
        setProducts(productRows);
        setShops(shopRows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inCategory = (value?: string | null) => category === "All" || value === category;

    const productRows = products.filter((p) => {
      const matchesText = !q || [p.title, p.description, p.category, p.locationCity, p.locationState]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
      return matchesText && inCategory(p.category);
    });

    const shopRows = shops.filter((s) => {
      const matchesText = !q || [s.businessName, s.bio, s.category, s.locationCity, s.locationState]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
      return matchesText && inCategory(s.category);
    });

    return { products: productRows, shops: shopRows };
  }, [products, shops, query, category]);

  return (
    <div className="p-4 pb-24" data-testid="page-explore">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground">Explore</h1>
        <p className="text-sm text-muted-foreground mt-1">Search products and discover shops on Nakudin.</p>
      </div>

      <div className="surface-1 rounded-2xl p-3 mb-4">
        <div className="flex items-center gap-2 surface-2 rounded-xl px-3 py-2 border border-white/8">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, shops, cities..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            data-testid="input-explore-search"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                category === c
                  ? "bg-primary text-black border-primary shadow-[0_0_18px_rgba(0,217,255,0.16)]"
                  : "surface-2 border-white/8 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <div className="space-y-7">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">Products</h2>
              <span className="text-xs text-muted-foreground">({filtered.products.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filtered.products.slice(0, 30).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {!filtered.products.length && <p className="col-span-2 text-center text-sm text-muted-foreground py-8">No matching products.</p>}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Store size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">Shops</h2>
              <span className="text-xs text-muted-foreground">({filtered.shops.length})</span>
            </div>
            <div className="grid gap-3">
              {filtered.shops.slice(0, 20).map((shop) => <ShopCard key={shop.id} shop={shop} />)}
              {!filtered.shops.length && <p className="text-center text-sm text-muted-foreground py-8">No matching shops.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
