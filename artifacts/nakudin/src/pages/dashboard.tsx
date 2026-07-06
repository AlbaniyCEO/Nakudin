import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  useGetMyShop, useGetShopAnalytics, useListProducts, useDeleteProduct, useUpdateProduct, useUpdateMyShop, useAdminActingShop,
  getGetMyShopQueryKey, getListProductsQueryKey,
} from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Eye, Heart, MessageCircle, Users, Plus, Pencil, Trash2,
  AlertTriangle, Lock, Clock, BarChart2, Package, ShieldCheck, CheckCircle2, Palette, Sparkles, TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { printCatalog, printStockReport, printMonthlySummary, printFlyer, printReceipt } from "@/lib/printables";
import { SHOP_THEMES, type ShopTheme } from "@/lib/shop-themes";
import type { Product } from "@/lib/firestore";
import { buildPerformanceAnalysis, type PerformanceAnalysisResult } from "@/lib/performance-insights";

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="surface-1 interactive-card rounded-2xl p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

const metricToneClass: Record<PerformanceAnalysisResult["metrics"][number]["tone"], string> = {
  primary: "from-primary to-cyan-300",
  green: "from-[#25D366] to-emerald-300",
  red: "from-red-500 to-rose-300",
  blue: "from-[#1D9BF0] to-sky-300",
  amber: "from-amber-500 to-yellow-300",
  violet: "from-violet-500 to-fuchsia-300",
};

function PerformanceInsights({ analysis }: { analysis: PerformanceAnalysisResult }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (analysis.score / 100) * circumference;

  return (
    <section className="surface-1 rounded-3xl p-4 mb-5 border border-primary/15 overflow-hidden relative">
      <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
      <div className="relative flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full surface-2 border border-white/8 px-2.5 py-1 text-[11px] text-primary mb-2">
            <Sparkles size={12} />
            Weekly smart advice · since {analysis.weekLabel}
          </div>
          <h2 className="text-base font-bold text-foreground">{analysis.grade}</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{analysis.summary}</p>
        </div>
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 86 86" className="w-20 h-20 -rotate-90">
            <circle cx="43" cy="43" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle cx="43" cy="43" r={radius} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="text-primary transition-all" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-foreground">{analysis.score}</span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      <div className="relative surface-2 rounded-2xl p-3 mb-4 border border-white/8">
        <div className="flex items-start gap-2">
          <TrendingUp size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground">This week’s automatic advice</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{analysis.weeklyMessage}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="surface-2 rounded-2xl p-3 border border-white/8">
          <p className="text-[11px] text-muted-foreground">WhatsApp conversion</p>
          <p className="text-lg font-bold text-foreground">{analysis.conversionRate}%</p>
        </div>
        <div className="surface-2 rounded-2xl p-3 border border-white/8">
          <p className="text-[11px] text-muted-foreground">Like engagement</p>
          <p className="text-lg font-bold text-foreground">{analysis.engagementRate}%</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <p className="text-xs font-semibold text-foreground">Performance visualization</p>
        {analysis.metrics.map(metric => {
          const width = Math.max(4, Math.round((metric.value / Math.max(metric.max, 1)) * 100));
          return (
            <div key={metric.label}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className="font-semibold text-foreground">{metric.value.toLocaleString()}</span>
              </div>
              <div className="h-2.5 surface-3 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${metricToneClass[metric.tone]}`} style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3">
        <div>
          <p className="text-xs font-semibold text-green-400 mb-1.5">What is working</p>
          <ul className="space-y-1">
            {analysis.strengths.map(item => <li key={item} className="text-xs text-muted-foreground leading-relaxed">• {item}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-400 mb-1.5">What to improve</p>
          <ul className="space-y-1">
            {analysis.watchouts.map(item => <li key={item} className="text-xs text-muted-foreground leading-relaxed">• {item}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-primary mb-1.5">Recommended actions</p>
          <ul className="space-y-1">
            {analysis.advice.map(item => <li key={item} className="text-xs text-muted-foreground leading-relaxed">• {item}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SubscriptionBanner({ status, trialEndsAt }: { status: string; trialEndsAt?: string | null }) {
  if (status === "active") return null;

  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  if (status === "trial") {
    return (
      <div className="surface-1 interactive-card rounded-2xl p-4 flex items-start gap-3 mb-4">
        <Clock size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">Trial Period</p>
          <p className="text-xs text-muted-foreground mt-0.5">{daysLeft} days left. Upgrade to keep your shop active.</p>
        </div>
        <Link href="/subscription"><Button size="sm" variant="default">Upgrade</Button></Link>
      </div>
    );
  }

  if (status === "grace") {
    return (
      <div className="surface-1 interactive-card rounded-2xl p-4 flex items-start gap-3 mb-4">
        <AlertTriangle size={18} className="text-secondary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-secondary">Payment Overdue</p>
          <p className="text-xs text-muted-foreground mt-0.5">Renew now to avoid your shop being locked.</p>
        </div>
        <Link href="/subscription"><Button size="sm" className="bg-secondary text-black">Renew</Button></Link>
      </div>
    );
  }

  if (status === "locked") {
    return (
      <div className="surface-1 interactive-card rounded-2xl p-4 flex items-start gap-3 mb-4">
        <Lock size={18} className="text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-destructive">Shop Locked</p>
          <p className="text-xs text-muted-foreground mt-0.5">Your shop is hidden. Pay to re-activate.</p>
        </div>
        <Link href="/subscription"><Button size="sm" variant="destructive">Pay Now</Button></Link>
      </div>
    );
  }

  return null;
}

function StockStepper({ productId, stock, disabled }: { productId: string; stock: number; disabled: boolean }) {
  const queryClient = useQueryClient();
  const updateProduct = useUpdateProduct();
  const [local, setLocal] = useState(stock);
  const [saving, setSaving] = useState(false);

  const persist = async (next: number) => {
    setLocal(next);
    setSaving(true);
    try {
      await updateProduct.mutateAsync({ productId, data: { stockQuantity: next } });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    } finally {
      setSaving(false);
    }
  };

  const change = async (delta: number) => {
    const next = Math.max(0, local + delta);
    await persist(next);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        disabled={disabled || saving || local === 0}
        onClick={() => change(-1)}
        className="w-6 h-6 rounded border border-input flex items-center justify-center text-foreground disabled:opacity-40 hover:bg-white/4 text-sm font-bold"
      >−</button>
      <input
        type="number"
        min="0"
        value={local}
        disabled={disabled || saving}
        onChange={(e) => setLocal(Math.max(0, Number(e.target.value) || 0))}
        onBlur={() => persist(Math.max(0, local))}
        className={`w-14 h-7 rounded border border-input surface-2 text-xs font-semibold text-center outline-none ${local === 0 ? "text-destructive" : local <= 3 ? "text-amber-500" : "text-green-400"}`}
        aria-label="Stock quantity"
      />
      <button
        disabled={disabled || saving}
        onClick={() => change(+1)}
        className="w-6 h-6 rounded border border-input flex items-center justify-center text-foreground disabled:opacity-40 hover:bg-white/4 text-sm font-bold"
      >+</button>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const updateShop = useUpdateMyShop();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cachedDashboard, setCachedDashboard] = useState<{ shop: any; products: any[] } | null>(null);
  const [socialDraft, setSocialDraft] = useState({ instagramUrl: "", facebookUrl: "", xUrl: "", tiktokUrl: "", websiteUrl: "" });
  const { active: adminActing } = useAdminActingShop();

  const { data: shop, isLoading: shopLoading } = useGetMyShop({ query: { queryKey: getGetMyShopQueryKey() } });
  const { data: analytics } = useGetShopAnalytics(shop?.id ?? "", { query: { enabled: !!shop?.id } });
  const { data: products } = useListProducts({ shopId: shop?.id }, { query: { enabled: !!shop?.id, queryKey: getListProductsQueryKey({ shopId: shop?.id }) } });

  useEffect(() => {
    if (shop) setSocialDraft({ instagramUrl: shop.instagramUrl ?? "", facebookUrl: shop.facebookUrl ?? "", xUrl: shop.xUrl ?? "", tiktokUrl: shop.tiktokUrl ?? "", websiteUrl: shop.websiteUrl ?? "" });
  }, [shop?.id]);

  useEffect(() => {
    if (!shop?.id) return;
    const key = `nakudin_dashboard_cache_${shop.id}`;
    try {
      const cached = localStorage.getItem(key);
      if (cached) setCachedDashboard(JSON.parse(cached));
    } catch {}
  }, [shop?.id]);

  useEffect(() => {
    if (!shop?.id || !products?.products) return;
    const snapshot = { shop, products: products.products, savedAt: new Date().toISOString() };
    setCachedDashboard(snapshot);
    try { localStorage.setItem(`nakudin_dashboard_cache_${shop.id}`, JSON.stringify(snapshot)); } catch {}
  }, [shop, products?.products]);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Sign in to access your dashboard.</p>
        <Link href="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  if (shopLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse" data-testid="page-dashboard-loading">
        <div className="h-16 surface-2 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="h-24 surface-2 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-8 text-center">
        <Package size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-foreground font-semibold mb-2">No shop yet</p>
        <p className="text-muted-foreground text-sm mb-4">Create your shop to start selling.</p>
        <Link href="/create-shop"><Button>Create My Shop</Button></Link>
      </div>
    );
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(productId);
    try {
      await deleteProduct.mutateAsync({ productId });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({ shopId: shop.id }) });
    } finally {
      setDeletingId(null);
    }
  };

  const handlePin = async (productId: string) => {
    await updateShop.mutateAsync({ pinnedProductId: shop.pinnedProductId === productId ? null : productId });
    queryClient.invalidateQueries({ queryKey: getGetMyShopQueryKey() });
  };

  const handleSaveSocials = async () => {
    await updateShop.mutateAsync({
      instagramUrl: socialDraft.instagramUrl.trim() || null,
      facebookUrl: socialDraft.facebookUrl.trim() || null,
      xUrl: socialDraft.xUrl.trim() || null,
      tiktokUrl: socialDraft.tiktokUrl.trim() || null,
      websiteUrl: socialDraft.websiteUrl.trim() || null,
    });
    queryClient.invalidateQueries({ queryKey: getGetMyShopQueryKey() });
  };

  const handleThemeChange = async (theme: ShopTheme) => {
    await updateShop.mutateAsync({ shopTheme: theme });
    queryClient.invalidateQueries({ queryKey: getGetMyShopQueryKey() });
  };

  const handleFeature = async (productId: string, days: number) => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    try {
      await updateProduct.mutateAsync({ productId, data: { featuredUntil: until.toISOString() } });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({ shopId: shop.id }) });
    } catch {}
  };

  const locked = false;
  const printableProducts = products?.products ?? cachedDashboard?.products ?? [];
  const printableShop = shop ?? cachedDashboard?.shop;
  const dashboardProducts = products?.products ?? cachedDashboard?.products ?? [];
  const lowStockItems = dashboardProducts.filter((p: Product) => (p.stockQuantity ?? 1) > 0 && (p.stockQuantity ?? 1) <= 3);
  const outOfStockItems = dashboardProducts.filter((p: Product) => (p.stockQuantity ?? 1) === 0);
  const performanceAnalysis = buildPerformanceAnalysis({ shop, products: dashboardProducts, analytics });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="px-4 py-4 pb-24" data-testid="page-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-1">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">{shop.businessName}</p>
        </div>
        <Link href={`/shops/${shop.id}/edit`}>
          <Button size="sm" variant="outline"><Pencil size={13} className="mr-1.5" />Edit Shop</Button>
        </Link>
      </div>

      {adminActing && (
        <div className="surface-1 rounded-2xl p-3 mb-4 flex items-start gap-2 border border-primary/20">
          <ShieldCheck size={15} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">Admin mode: you are managing this dashboard as the shop owner. Changes will appear as owner actions.</p>
        </div>
      )}

      <SubscriptionBanner status={shop.subscriptionStatus} trialEndsAt={shop.trialEndsAt} />

      {/* Low stock alert banner */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="surface-1 rounded-2xl p-3 mb-4 flex items-start gap-2 border border-amber-500/20">
          <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-600 dark:text-amber-400">
            {outOfStockItems.length > 0 && (
              <p><span className="font-semibold">{outOfStockItems.length} product{outOfStockItems.length > 1 ? "s" : ""} sold out</span> — update stock any time — sold-out items stay visible to visitors.</p>
            )}
            {lowStockItems.length > 0 && (
              <p className={outOfStockItems.length > 0 ? "mt-0.5" : ""}><span className="font-semibold">{lowStockItems.length} product{lowStockItems.length > 1 ? "s" : ""} low on stock</span> — restock soon to keep selling.</p>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard icon={Eye} label="Total Views" value={(analytics?.totalViews ?? shop?.totalViews ?? 0).toLocaleString()} color="bg-primary" />
        <StatCard icon={Heart} label="Total Likes" value={(analytics?.totalLikes ?? shop?.totalLikes ?? 0).toLocaleString()} color="bg-red-500" />
        <StatCard icon={MessageCircle} label="WhatsApp Clicks" value={(analytics?.totalWhatsappClicks ?? shop?.totalWhatsappClicks ?? 0).toLocaleString()} color="bg-[#25D366]" />
        <StatCard icon={Users} label="Followers" value={(analytics?.followerCount ?? shop?.followerCount ?? 0).toLocaleString()} color="bg-[#1D9BF0]" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon={BarChart2} label="Traffic Sources" value="Top referrers" color="bg-amber-500" />
          <StatCard icon={Clock} label="Best Time" value="Evenings" color="bg-violet-500" />
        </div>

      <PerformanceInsights analysis={performanceAnalysis} />

      <div className="grid grid-cols-2 gap-2 mb-5">
        <Button variant="outline" onClick={() => printCatalog(printableShop, printableProducts)}>Print Catalog</Button>
        <Button variant="outline" onClick={() => printStockReport(printableShop, printableProducts)}>Print Stock Report</Button>
        <Button variant="outline" onClick={() => printReceipt(printableShop, printableProducts)}>Generate Receipt</Button>
        <Button variant="outline" onClick={() => printMonthlySummary(printableShop, analytics, printableProducts, new Date().toLocaleString("en-NG", { month: "long", year: "numeric" }))}>Print Monthly Summary</Button>
        <Button variant="outline" onClick={() => printFlyer(printableShop)}>Download Shop Flyer</Button>
        <Button variant="outline" onClick={() => navigate("/feedback")}>Message Admin</Button>
      </div>



      <div className="surface-1 rounded-2xl p-4 mb-5">
        <h2 className="text-sm font-semibold text-foreground">Connect social handles</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-3">These appear on your public shop homepage.</p>
        <div className="grid gap-2">
          <input className="surface-2 border border-input rounded-lg px-3 py-2 text-sm outline-none" value={socialDraft.instagramUrl} onChange={e => setSocialDraft(v => ({ ...v, instagramUrl: e.target.value }))} placeholder="Instagram URL or handle" />
          <input className="surface-2 border border-input rounded-lg px-3 py-2 text-sm outline-none" value={socialDraft.facebookUrl} onChange={e => setSocialDraft(v => ({ ...v, facebookUrl: e.target.value }))} placeholder="Facebook page URL" />
          <div className="grid grid-cols-2 gap-2">
            <input className="surface-2 border border-input rounded-lg px-3 py-2 text-sm outline-none" value={socialDraft.xUrl} onChange={e => setSocialDraft(v => ({ ...v, xUrl: e.target.value }))} placeholder="X / Twitter" />
            <input className="surface-2 border border-input rounded-lg px-3 py-2 text-sm outline-none" value={socialDraft.tiktokUrl} onChange={e => setSocialDraft(v => ({ ...v, tiktokUrl: e.target.value }))} placeholder="TikTok" />
          </div>
          <input className="surface-2 border border-input rounded-lg px-3 py-2 text-sm outline-none" value={socialDraft.websiteUrl} onChange={e => setSocialDraft(v => ({ ...v, websiteUrl: e.target.value }))} placeholder="Website" />
          <Button variant="outline" onClick={handleSaveSocials} disabled={updateShop.isPending}>{updateShop.isPending ? "Saving..." : "Save social handles"}</Button>
        </div>
      </div>

      <div className="surface-1 rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Palette size={16} className="text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Shop homepage style</h2>
            <p className="text-xs text-muted-foreground">Choose how buyers see your shop when they open it from a product page.</p>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {SHOP_THEMES.map(theme => {
            const selected = (shop.shopTheme ?? "classic") === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemeChange(theme.id)}
                className={`min-w-[168px] text-left rounded-2xl border p-3 transition-all ${selected ? "border-primary bg-primary/8 shadow-[0_0_22px_rgba(0,217,255,0.14)]" : "surface-2 border-white/8 hover:border-white/14"}`}
              >
                <div className={`h-16 rounded-xl bg-gradient-to-br ${theme.accent} border border-white/8 mb-2 overflow-hidden`}>
                  <div className="h-full w-full bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.14),transparent_20%),linear-gradient(135deg,rgba(0,0,0,0.05),rgba(0,0,0,0.42))]" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">{theme.name}</p>
                  {selected && <CheckCircle2 size={14} className="text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{theme.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-foreground">Products ({products?.products.length ?? 0})</h2>
        <Button
          size="sm"
          onClick={() => navigate("/dashboard/product/new")}
          disabled={locked}
          data-testid="button-add-product"
        >
          <Plus size={14} className="mr-1" />Add Product
        </Button>
      </div>

      <div className="space-y-2">
        {products?.products?.map((p: Product) => {
          const stock = p.stockQuantity ?? 1;
          return (
            <div key={p.id} className={`surface-1 interactive-card rounded-2xl flex items-center gap-3 p-3 ${stock === 0 ? "border-destructive/30 opacity-80" : stock <= 3 ? "border-amber-500/30" : "border-card-border"}`}>
              <div className="w-14 h-14 rounded-lg surface-2 overflow-hidden flex-shrink-0">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} className={`w-full h-full object-cover ${stock === 0 ? "grayscale-[40%]" : ""}`} />
                ) : (
                  <div className="w-full h-full surface-2" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" data-testid={`text-product-${p.id}`}>{p.title}</p>
                <p className="text-sm font-bold text-secondary">₦{(p?.price ?? 0).toLocaleString("en-NG")}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                  <span>{p.viewCount} views</span>
                  <span>{p.likeCount} likes</span>
                  <span className={`px-1.5 rounded-full ${p.status === "active" ? "bg-green-500/10 text-green-400" : "surface-2 text-muted-foreground"}`}>
                    {p.status}
                  </span>
                  {stock === 0 && <span className="px-1.5 rounded-full bg-zinc-500/10 text-zinc-500 font-medium">Out of Stock</span>}
                  {stock > 0 && stock <= 3 && <span className="px-1.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">Only a few left</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex gap-1 flex-wrap justify-end max-w-[170px]">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => navigate(`/dashboard/product/${p.id}/edit`)}
                    disabled={locked}
                    data-testid={`button-edit-product-${p.id}`}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    data-testid={`button-delete-product-${p.id}`}
                  >
                    <Trash2 size={12} />
                  </Button>
                  <>
                    <Button size="sm" variant={shop.pinnedProductId === p.id ? "default" : "outline"} className="h-7 text-[10px] px-2" onClick={() => handlePin(p.id)}>
                      {shop.pinnedProductId === p.id ? "Pinned" : "Pin"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => handleFeature(p.id, 3)}>
                      Feature 3d
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => handleFeature(p.id, 7)}>
                      Feature 7d
                    </Button>
                  </>
                </div>
                <StockStepper productId={p.id} stock={stock} disabled={locked} />
              </div>
            </div>
          );
        })}
        {!products?.products?.length && (
          <div className="py-10 text-center text-muted-foreground">
            <Package size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No products yet. Add your first product!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
