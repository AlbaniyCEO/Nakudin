import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  useGetMyShop, useGetShopAnalytics, useListProducts, useDeleteProduct,
  getGetMyShopQueryKey, getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Eye, Heart, MessageCircle, Users, Plus, Pencil, Trash2,
  AlertTriangle, Lock, Clock, BarChart2, Package,
} from "lucide-react";
import { motion } from "framer-motion";

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function SubscriptionBanner({ status, trialEndsAt }: { status: string; trialEndsAt?: string | null }) {
  if (status === "active") return null;

  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  if (status === "trial") {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3 mb-4">
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
      <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 flex items-start gap-3 mb-4">
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
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 mb-4">
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

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const deleteProduct = useDeleteProduct();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: shop, isLoading: shopLoading } = useGetMyShop({ query: { queryKey: getGetMyShopQueryKey() } });
  const { data: analytics } = useGetShopAnalytics(shop?.id ?? "", { query: { enabled: !!shop?.id } });
  const { data: products } = useListProducts({ shopId: shop?.id }, { query: { enabled: !!shop?.id, queryKey: getListProductsQueryKey({ shopId: shop?.id }) } });

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
        <div className="h-16 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
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

  const locked = shop.subscriptionStatus === "locked";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="px-4 py-4 pb-24" data-testid="page-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">{shop.businessName}</p>
        </div>
        <Link href={`/shops/${shop.id}/edit`}>
          <Button size="sm" variant="outline"><Pencil size={13} className="mr-1.5" />Edit Shop</Button>
        </Link>
      </div>

      <SubscriptionBanner status={shop.subscriptionStatus} trialEndsAt={shop.trialEndsAt} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={Eye} label="Total Views" value={(analytics?.totalViews ?? shop.totalViews).toLocaleString()} color="bg-primary" />
        <StatCard icon={Heart} label="Total Likes" value={(analytics?.totalLikes ?? shop.totalLikes).toLocaleString()} color="bg-red-500" />
        <StatCard icon={MessageCircle} label="WhatsApp Clicks" value={(analytics?.totalWhatsappClicks ?? shop.totalWhatsappClicks).toLocaleString()} color="bg-[#25D366]" />
        <StatCard icon={Users} label="Followers" value={(analytics?.followerCount ?? shop.followerCount).toLocaleString()} color="bg-[#1D9BF0]" />
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
        {products?.products.map(p => (
          <div key={p.id} className="bg-card border border-card-border rounded-xl flex items-center gap-3 p-3">
            <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate" data-testid={`text-product-${p.id}`}>{p.title}</p>
              <p className="text-sm font-bold text-secondary">₦{p.price.toLocaleString("en-NG")}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span>{p.viewCount} views</span>
                <span>{p.likeCount} likes</span>
                <span className={`px-1.5 rounded-full ${p.status === "active" ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"}`}>
                  {p.status}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => navigate(`/dashboard/product/${p.id}/edit`)}
                disabled={locked}
                data-testid={`button-edit-product-${p.id}`}
              >
                <Pencil size={14} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(p.id)}
                disabled={deletingId === p.id}
                data-testid={`button-delete-product-${p.id}`}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        {!products?.products.length && (
          <div className="py-10 text-center text-muted-foreground">
            <Package size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No products yet. Add your first product!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
