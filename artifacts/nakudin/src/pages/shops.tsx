import { useEffect, useState } from "react";
import { ShopCard } from "@/components/ShopCard";
import { Store } from "lucide-react";
import { getShops, type Shop } from "@/lib/firestore";

function ShopSkeleton() {
  return (
    <div className="surface-1 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-xl surface-2 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 surface-2 rounded w-1/2" />
        <div className="h-3 surface-2 rounded w-1/3" />
        <div className="h-3 surface-2 rounded w-2/5" />
      </div>
    </div>
  );
}

export default function Shops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getShops({ limit: 30 })
      .then(setShops)
      .finally(() => setLoading(false));
  }, []);

  const visible = premiumOnly ? shops.filter((s) => s.premiumStatus === "active") : shops;

  return (
    <div className="p-4 pb-24" data-testid="page-shops">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Shops</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Verified Nigerian businesses on Nakudin</p>
        </div>
        <button
          onClick={() => setPremiumOnly((v) => !v)}
          className={[
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
            premiumOnly
              ? "bg-amber-500/15 border-amber-500/30 text-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.12)]"
              : "surface-1 border-white/10 text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {premiumOnly ? "Premium only" : "All shops"}
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ShopSkeleton key={i} />)}
        </div>
      ) : visible.length > 0 ? (
        <div className="grid gap-4">
          {visible.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Store size={28} className="text-primary" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">No shops yet</p>
          <p className="text-sm text-muted-foreground">
            {premiumOnly ? "No premium shops right now." : "Be the first to open a shop on Nakudin."}
          </p>
        </div>
      )}
    </div>
  );
}
