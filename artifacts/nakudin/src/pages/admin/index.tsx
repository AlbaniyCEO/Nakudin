import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import {
  useGetAdminStats, useAdminListShops, useAdminListProducts, useAdminListReports,
  useAdminUpdateShop, useAdminDeleteShop, useAdminUpdateReport,
  getAdminListShopsQueryKey, getAdminListProductsQueryKey, getAdminListReportsQueryKey, getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Package, ShoppingBag, Users, Flag, BarChart2, ArrowLeft, CheckCircle2, XCircle, Trash2, LogIn, Newspaper, Pencil, ImagePlus, MessageSquareText, Reply } from "lucide-react";
import { motion } from "framer-motion";
import { ADMIN_EMAIL, setActingShopId, clearActingShopId } from "@/lib/admin";
import { ImageUpload } from "@/components/ImageUpload";
import { useCreateBlogPost, useDeleteBlogPost, useListBlogPosts, useUpdateBlogPost } from "@/lib/blog-hooks";
import { makeBlogExcerpt, type BlogPost, type BlogStatus } from "@/lib/blog";
import { useListFeedbackMessages, useUpdateFeedbackMessage } from "@/lib/feedback-hooks";
import type { FeedbackMessage, FeedbackStatus } from "@/lib/feedback";

const TABS = ["Overview", "Shops", "Products", "Reports", "Feedback", "Blog"] as const;
type Tab = (typeof TABS)[number];


function BlogEditor({ editing, onDone }: { editing: BlogPost | null; onDone: () => void }) {
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<BlogStatus>("published");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setBody(editing.body);
      setExcerpt(editing.excerpt);
      setTagsText(editing.tags.join(", "));
      setImages(editing.images ?? []);
      setStatus(editing.status);
    } else {
      setTitle(""); setBody(""); setExcerpt(""); setTagsText(""); setImages([]); setStatus("published");
    }
    setError("");
  }, [editing]);

  const addImage = (url: string) => setImages(prev => prev.length >= 5 ? prev : [...prev, url]);
  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (title.trim().length < 4) { setError("Add a clearer title."); return; }
    if (body.trim().length < 20) { setError("Body should be at least 20 characters."); return; }
    const payload = {
      title: title.trim(),
      body: body.trim(),
      excerpt: excerpt.trim() || makeBlogExcerpt(body),
      images,
      tags: tagsText.split(",").map(t => t.trim()).filter(Boolean).slice(0, 6),
      status,
    };
    if (editing) await updatePost.mutateAsync({ postId: editing.id, data: payload });
    else await createPost.mutateAsync(payload);
    onDone();
  };

  const pending = createPost.isPending || updatePost.isPending;

  return (
    <form onSubmit={submit} className="surface-1 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Newspaper size={17} className="text-primary" />
        <h2 className="font-semibold text-foreground">{editing ? "Edit blog post" : "Create blog post"}</h2>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full surface-2 border border-input rounded-lg px-3 py-2 text-sm outline-none" placeholder="e.g. How to prepare your shop for festive sales" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Body</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="mt-1 w-full surface-2 border border-input rounded-lg px-3 py-2 text-sm outline-none resize-none" placeholder="Write the post. Separate paragraphs with a blank line." />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Excerpt / short summary</label>
        <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} className="mt-1 w-full surface-2 border border-input rounded-lg px-3 py-2 text-sm outline-none resize-none" placeholder="Optional — auto-generated from body if empty." />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Tags</label>
        <input value={tagsText} onChange={e => setTagsText(e.target.value)} className="mt-1 w-full surface-2 border border-input rounded-lg px-3 py-2 text-sm outline-none" placeholder="selling tips, trust, whatsapp" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground"><ImagePlus size={14} /> Images, up to 5</div>
        <div className="flex gap-2 flex-wrap">
          {images.map((url, idx) => (
            <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden surface-2">
              <img src={url} alt="Blog" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs">×</button>
            </div>
          ))}
          {images.length < 5 && <div className="w-20 h-20"><ImageUpload label="Add" onChange={addImage} aspect="square" /></div>}
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as BlogStatus)} className="mt-1 w-full surface-2 border border-input rounded-lg px-3 py-2 text-sm outline-none">
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={pending}>{pending ? "Saving..." : editing ? "Save post" : "Publish post"}</Button>
        {editing && <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>}
      </div>
    </form>
  );
}

function FeedbackInboxItem({ message }: { message: FeedbackMessage }) {
  const updateFeedback = useUpdateFeedbackMessage();
  const [reply, setReply] = useState(message.adminReply ?? "");
  const [expanded, setExpanded] = useState(false);

  const mark = (status: FeedbackStatus) => updateFeedback.mutate({ messageId: message.id, data: { status } });
  const sendReply = () => {
    if (!reply.trim()) return;
    updateFeedback.mutate({ messageId: message.id, data: { adminReply: reply.trim() } });
  };

  return (
    <div className="surface-1 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${message.status === "open" ? "bg-primary/10 text-primary" : message.status === "replied" ? "bg-green-500/10 text-green-400" : "surface-2 text-muted-foreground"}`}>{message.status}</span>
            <span className="rounded-full surface-2 px-2 py-0.5 text-[11px] text-muted-foreground capitalize">{message.category}</span>
            <span className="rounded-full surface-2 px-2 py-0.5 text-[11px] text-muted-foreground">{message.senderType === "shop_owner" ? "Shop owner" : "User"}</span>
          </div>
          <h3 className="text-sm font-bold text-foreground mt-2 truncate">{message.subject}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">From {message.shopName || message.senderEmail || message.senderName} · {new Date(message.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setExpanded(v => !v)}>{expanded ? "Hide" : "Open"}</Button>
      </div>

      <p className={`text-sm text-foreground/85 whitespace-pre-wrap ${expanded ? "" : "line-clamp-2"}`}>{message.message}</p>

      {expanded && (
        <div className="space-y-3">
          {message.adminReply && (
            <div className="surface-2 rounded-xl p-3 border border-green-500/15">
              <p className="text-xs text-green-400 font-semibold mb-1">Admin reply</p>
              <p className="text-sm text-foreground/85 whitespace-pre-wrap">{message.adminReply}</p>
            </div>
          )}
          <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} className="w-full surface-2 border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none resize-none" placeholder="Write an internal/admin reply note..." />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => mark("reviewed")} disabled={updateFeedback.isPending}>Mark reviewed</Button>
            <Button size="sm" onClick={sendReply} disabled={updateFeedback.isPending || !reply.trim()}><Reply size={14} className="mr-1" />Save reply</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="surface-1 rounded-xl p-4">
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
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus | "all">("all");

  const { data: stats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const shopListParams = { limit: 30, ...(premiumOnly ? { premium: "active" } : {}) };
  const { data: shopData } = useAdminListShops(shopListParams, { query: { enabled: activeTab === "Shops", queryKey: getAdminListShopsQueryKey(shopListParams) } });
  const productListParams = { limit: 30 };
  const { data: productData } = useAdminListProducts(productListParams, { query: { enabled: activeTab === "Products", queryKey: getAdminListProductsQueryKey(productListParams) } });
  const reportListParams = { status: "open" as const };
  const { data: reports } = useAdminListReports(reportListParams, { query: { enabled: activeTab === "Reports", queryKey: getAdminListReportsQueryKey(reportListParams) } });
  const updateShop = useAdminUpdateShop();
  const deleteShop = useAdminDeleteShop();
  const updateReport = useAdminUpdateReport();
  const { data: blogPosts } = useListBlogPosts({ includeDrafts: true, limit: 60 });
  const deleteBlogPost = useDeleteBlogPost();
  const { data: feedbackMessages } = useListFeedbackMessages({ status: feedbackStatus, limit: 100 });

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

  const handleAccessAccount = (shopId: string) => {
    setActingShopId(shopId);
    queryClient.clear();
    navigate("/dashboard");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="px-4 py-4 pb-24" data-testid="page-admin">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => { clearActingShopId(); queryClient.clear(); }}>
          Clear acting shop
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/8 mb-4 gap-0 overflow-x-auto">
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

          <div className="surface-1 rounded-xl p-4">
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

          <div className="surface-1 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Billing Breakdown</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly shops</span>
                <span className="text-sm font-semibold text-foreground">{stats.billingBreakdown?.monthly ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Yearly shops</span>
                <span className="text-sm font-semibold text-foreground">{stats.billingBreakdown?.yearly ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Premium shops</span>
                <span className="text-sm font-semibold text-foreground">{stats.billingBreakdown?.premium ?? 0}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/8">
                <span className="text-sm text-muted-foreground">Monthly revenue</span>
                <span className="text-sm font-semibold text-foreground">₦{(stats.billingBreakdown?.monthlyRevenue ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Yearly revenue</span>
                <span className="text-sm font-semibold text-foreground">₦{(stats.billingBreakdown?.yearlyRevenue ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Premium revenue</span>
                <span className="text-sm font-semibold text-foreground">₦{(stats.billingBreakdown?.premiumRevenue ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="surface-1 rounded-xl p-4">
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
          <div className="flex justify-end mb-2">
            <button onClick={() => setPremiumOnly(v => !v)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${premiumOnly ? "bg-amber-500/15 border-amber-500/30 text-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.12)]" : "surface-1 border-white/10 text-muted-foreground hover:text-foreground"}`}>
              {premiumOnly ? "Included tools active" : "All shops"}
            </button>
          </div>
          {shopData?.shops?.map(s => (
            <div key={s.id} className="surface-1 rounded-xl p-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg surface-2 overflow-hidden flex-shrink-0">
                  {s.logoUrl ? <img src={s.logoUrl} className="w-full h-full object-cover" alt={s.businessName} /> : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{s.businessName[0]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground truncate">{s.businessName}</span>
                    {s.verified && <BadgeCheck size={14} className="text-[#1D9BF0] fill-[#1D9BF0]" strokeWidth={0} />}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.category} · {s.subscriptionStatus} · {s.billingCycle}{s.premiumStatus === "active" ? " · Premium" : ""}</p>
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
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => handleAccessAccount(s.id)} title="Access account as owner">
                    <LogIn size={14} />
                  </Button>
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
            <div key={p.id} className="surface-1 rounded-xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg surface-2 overflow-hidden flex-shrink-0">
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



      {activeTab === "Feedback" && (
        <div className="space-y-4">
          <div className="surface-1 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareText size={17} className="text-primary" />
              <div>
                <h2 className="font-semibold text-foreground">Feedback inbox</h2>
                <p className="text-xs text-muted-foreground">Messages from users and shop owners.</p>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["all", "open", "reviewed", "replied"] as const).map(status => (
                <button key={status} onClick={() => setFeedbackStatus(status)} className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${feedbackStatus === status ? "bg-primary text-black border-primary" : "surface-2 border-white/8 text-muted-foreground"}`}>
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {feedbackMessages?.map(message => <FeedbackInboxItem key={message.id} message={message} />)}
            {!feedbackMessages?.length && <p className="text-sm text-muted-foreground text-center py-8">No feedback messages found.</p>}
          </div>
        </div>
      )}

      {activeTab === "Blog" && (
        <div className="space-y-4">
          <BlogEditor editing={editingBlog} onDone={() => setEditingBlog(null)} />
          <div className="space-y-2">
            {blogPosts?.map(post => (
              <div key={post.id} className="surface-1 rounded-xl p-3 flex gap-3">
                <div className="w-14 h-14 rounded-lg surface-2 overflow-hidden flex-shrink-0">
                  {post.images?.[0] ? <img src={post.images[0]} className="w-full h-full object-cover" alt={post.title} /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{post.status} · /blog/{post.slug}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingBlog(post)}><Pencil size={14} /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => confirm("Delete this blog post?") && deleteBlogPost.mutate(post.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
            {!blogPosts?.length && <p className="text-sm text-muted-foreground text-center py-8">No blog posts yet.</p>}
          </div>
        </div>
      )}

      {activeTab === "Reports" && (
        <div className="space-y-3">
          {reports?.map(r => (
            <div key={r.id} className="surface-1 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs surface-2 px-2 py-0.5 rounded-full text-muted-foreground capitalize">{r.targetType}</span>
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
