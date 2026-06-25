import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import {
  useGetAdminStats, useAdminListShops, useAdminListProducts, useAdminListReports,
  useAdminUpdateShop, useAdminDeleteShop, useAdminUpdateReport,
  getAdminListShopsQueryKey, getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Package, ShoppingBag, Users, Flag, BarChart2, ArrowLeft, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const ADMIN_EMAIL = "musabmuhammadabubakar@gmail.com";

const TABS = ["Overview", "Shops", "Products", "Reports"] as const;
type Tab = (typeof TABS)[number];

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <p className="text-xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const { data: stats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: shopData } = useAdminListShops({ limit: 30 }, { query: { enabled: activeTab === "Shops", queryKey: getAdminListShopsQueryKey({ limit: 30 }) } });
  const { data: productData } = useAdminListProducts({ limit: 30 }, { query: { enabled: activeTab === "Products" } });
  const { data: reports } = useAdminListReports({ status: "open" }, { query: { enabled: activeTab === "Reports" } });
  const updateShop = useAdminUpdateShop();
  const deleteShop = useAdminDeleteShop();
  const updateReport = useAdminUpdateReport();

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground text-sm">Access denied. Admin only.</p>
        <Link href="/"><Button className="mt-4" variant="outline">Go Home</Button></Link>
      </div>
    );
  }

  const handleVerify = async (shopId: string, verified: boolean) => {
    await updateShop.mutateAsync({ shopId, data: { verified } });
    queryClient.invalidateQueries({ queryKey: getAdminListShopsQueryKey({ limit: 30 }) });
  };

  const handleDelete = async (shopId: string) => {
    if (!confirm("Suspend this shop?")) return;
    await deleteShop.mutateAsync({ shopId });
    queryClient.invalidateQueries({ queryKey: getAdminListShopsQueryKey({ limit: 30 }) });
  };

  const handleReport = async (reportId: string, status: "reviewed" | "dismissed") => {
    await updateReport.mutateAsync({ reportId, data: { status } });
    queryClient.invalidateQueries();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="px-4 py-4 pb-24" data-testid="page-admin">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4 gap-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={ShoppingBag} label="Total Shops" value={stats.totalShops} color="bg-primary" />
            <StatCard icon={Package} label="Total Products" value={stats.totalProducts} color="bg-secondary" />
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-[#1D9BF0]" />
            <StatCard icon={Flag} label="Open Reports" value={stats.totalReports} color="bg-destructive" />
          </div>

          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Subscription Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(stats?.subscriptionBreakdown ?? {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{status}</span>
                  <span className="text-sm font-semibold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">New Signups (7 days)</span>
              <span className="text-sm font-semibold text-foreground">{stats.newSignupsThisWeek}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">WhatsApp Clicks (today)</span>
              <span className="text-sm font-semibold text-foreground">{stats.whatsappClicksToday}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Shops" && (
        <div className="space-y-2">
          {shopData?.shops?.map(s => (
            <div key={s.id} className="bg-card border border-card-border rounded-xl p-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {s.logoUrl ? <img src={s.logoUrl} className="w-full h-full object-cover" alt={s.businessName} /> : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{s.businessName[0]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground truncate">{s.businessName}</span>
                    {s.verified && <BadgeCheck size={14} className="text-[#1D9BF0] fill-[#1D9BF0]" strokeWidth={0} />}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.category} · {s.subscriptionStatus}</p>
                </div>
                <div className="flex gap-1">
                  {!s.verified ? (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-[#1D9BF0]" onClick={() => handleVerify(s.id, true)} title="Verify">
                      <CheckCircle2 size={14} />
                    </Button>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => handleVerify(s.id, false)} title="Unverify">
                      <XCircle size={14} />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(s.id)} title="Suspend">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!shopData?.shops.length && <p className="text-center text-muted-foreground py-8 text-sm">No shops found.</p>}
        </div>
      )}

      {activeTab === "Products" && (
        <div className="space-y-2">
          {productData?.products?.map(p => (
            <div key={p.id} className="bg-card border border-card-border rounded-xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt={p.title} /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">₦{(p?.price ?? 0).toLocaleString()} · {p.viewCount} views · {p.status}</p>
              </div>
            </div>
          ))}
          {!productData?.products.length && <p className="text-center text-muted-foreground py-8 text-sm">No products found.</p>}
        </div>
      )}

      {activeTab === "Reports" && (
        <div className="space-y-3">
          {reports?.map(r => (
            <div key={r.id} className="bg-card border border-card-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground capitalize">{r.targetType}</span>
                  <p className="text-sm font-medium text-foreground mt-1">{r.reason}</p>
                  {r.details && <p className="text-xs text-muted-foreground mt-0.5">{r.details}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleReport(r.id, "reviewed")}>Mark Reviewed</Button>
                <Button size="sm" variant="ghost" className="flex-1 text-muted-foreground" onClick={() => handleReport(r.id, "dismissed")}>Dismiss</Button>
              </div>
            </div>
          ))}
          {!reports?.length && (
            <div className="py-10 text-center">
              <Flag size={32} className="mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">No open reports.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
