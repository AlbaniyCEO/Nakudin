import { useAuth } from "@/lib/auth-context";
import { useGetMyShop, useUpdateMyShop, getGetMyShopQueryKey } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Sparkles, Pin, Link2, ChartNoAxesCombined } from "lucide-react";

export default function PremiumPage() {
  const { user } = useAuth();
  const { data: shop } = useGetMyShop({ query: { enabled: !!user } });
  const updateShop = useUpdateMyShop();
  const qc = useQueryClient();

  const activatePremiumLocally = async () => {
    const premiumUntil = new Date();
    premiumUntil.setMonth(premiumUntil.getMonth() + 1);
    await updateShop.mutateAsync({ premiumStatus: "active", premiumUntil: premiumUntil.toISOString() });
    qc.invalidateQueries({ queryKey: getGetMyShopQueryKey() });
  };

  const handleEnableIncluded = () => {
    activatePremiumLocally().catch(() => qc.invalidateQueries({ queryKey: getGetMyShopQueryKey() }));
  };

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto" data-testid="page-premium">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard"><button className="text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button></Link>
        <h1 className="text-xl font-bold text-foreground">Premium</h1>
      </div>

      <div className="surface-1 border border-amber-500/30 rounded-2xl p-5 mb-5 shadow-[0_18px_45px_rgba(245,158,11,0.10)]">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 text-amber-500 px-3 py-1 text-xs font-semibold mb-3">
          <Crown size={14} /> Premium tier
        </div>
        <h2 className="text-2xl font-extrabold text-foreground">Included for every shop</h2>
        <p className="text-sm text-muted-foreground mt-1">This feature is now included for every shop. Payment is no longer required.</p>
      </div>

      <div className="space-y-3 mb-6">
        {[
          [Sparkles, "Boost one product higher in the feed"],
          [Pin, "Pin one product to the top of your shop"],
          [Link2, "Choose a custom shop slug"],
          [ChartNoAxesCombined, "Unlock extra analytics cards"],
        ].map(([Icon, label], i) => (
          <div key={i} className="surface-1 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center"><Icon size={18} /></div>
            <p className="text-sm text-foreground">{label as string}</p>
          </div>
        ))}
      </div>

      <Button className="w-full" onClick={handleEnableIncluded} disabled={shop?.premiumStatus === "active" || updateShop.isPending}>
        {shop?.premiumStatus === "active" ? "Included" : updateShop.isPending ? "Activating..." : "Premium included"}
      </Button>
      {shop?.premiumStatus === "active" && shop.premiumUntil && (
        <p className="text-xs text-center text-muted-foreground mt-2">Included tools enabled until {new Date(shop.premiumUntil).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
      )}
      {shop?.subscriptionStatus !== "active" && (
        <p className="text-xs text-center text-muted-foreground mt-2">Premium tools are available to every shop.</p>
      )}
    </div>
  );
}
