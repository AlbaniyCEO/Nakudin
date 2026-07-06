import { useEffect, useState } from "react";
import { ShopCard } from "@/components/ShopCard";
import { Loader2 } from "lucide-react";
import { getShops, type Shop } from "@/lib/firestore";

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

  const visible = premiumOnly ? shops.filter(s => s.premiumStatus === "active") : shops;

  return (
    <div className="p-4 pb-24" data-testid="page-shops">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Shops</h1>
        <button
          onClick={() => setPremiumOnly(v => !v)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${premiumOnly ? "bg-amber-500/15 border-amber-500/30 text-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.12)]" : "surface-1 border-white/10 text-muted-foreground hover:text-foreground"}`}
        >
          {premiumOnly ? "Included tools active" : "All shops"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <div className="grid gap-4">
          {visible.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
          {!visible.length && <p className="text-sm text-muted-foreground text-center py-12">No shops found.</p>}
        </div>
      )}
    </div>
  );
}
