import type { Product, Shop } from "./firestore";

export interface DashboardAnalyticsSnapshot {
  totalViews?: number | null;
  totalLikes?: number | null;
  totalWhatsappClicks?: number | null;
  followerCount?: number | null;
  topProducts?: Array<{ productId: string; title: string; views?: number; likes?: number; clicks?: number }>;
}

export interface PerformanceMetric {
  label: string;
  value: number;
  max: number;
  tone: "primary" | "green" | "red" | "blue" | "amber" | "violet";
}

export interface PerformanceAnalysisResult {
  weekKey: string;
  weekLabel: string;
  score: number;
  grade: "Needs attention" | "Growing" | "Strong" | "Excellent";
  summary: string;
  weeklyMessage: string;
  advice: string[];
  strengths: string[];
  watchouts: string[];
  metrics: PerformanceMetric[];
  funnel: PerformanceMetric[];
  topProductTitle: string | null;
  conversionRate: number;
  engagementRate: number;
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekKey(date = new Date()) {
  const start = startOfWeek(date);
  return start.toISOString().slice(0, 10);
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function formatWeekLabel(weekKey: string) {
  return new Date(`${weekKey}T00:00:00`).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function gradeFromScore(score: number): PerformanceAnalysisResult["grade"] {
  if (score >= 80) return "Excellent";
  if (score >= 62) return "Strong";
  if (score >= 38) return "Growing";
  return "Needs attention";
}

export function buildPerformanceAnalysis(args: {
  shop: Shop;
  products: Product[];
  analytics?: DashboardAnalyticsSnapshot | null;
  now?: Date;
}): PerformanceAnalysisResult {
  const { shop, products, analytics } = args;
  const weekKey = getWeekKey(args.now ?? new Date());
  const activeProducts = products.filter(p => p.status === "active");
  const outOfStock = products.filter(p => (p.stockQuantity ?? 1) === 0);
  const lowStock = products.filter(p => (p.stockQuantity ?? 1) > 0 && (p.stockQuantity ?? 1) <= 3);
  const totalViews = analytics?.totalViews ?? shop.totalViews ?? products.reduce((sum, p) => sum + (p.viewCount ?? 0), 0);
  const totalLikes = analytics?.totalLikes ?? shop.totalLikes ?? products.reduce((sum, p) => sum + (p.likeCount ?? 0), 0);
  const totalWhatsappClicks = analytics?.totalWhatsappClicks ?? shop.totalWhatsappClicks ?? products.reduce((sum, p) => sum + (p.whatsappClickCount ?? 0), 0);
  const followerCount = analytics?.followerCount ?? shop.followerCount ?? 0;
  const engagementRate = percent(totalLikes, totalViews);
  const conversionRate = percent(totalWhatsappClicks, totalViews);
  const topProduct = [...products]
    .sort((a, b) => ((b.viewCount ?? 0) + b.likeCount + (b.whatsappClickCount ?? 0) * 2) - ((a.viewCount ?? 0) + a.likeCount + (a.whatsappClickCount ?? 0) * 2))[0];

  const catalogScore = clamp(activeProducts.length * 10, 0, 25);
  const stockScore = clamp(25 - outOfStock.length * 7 - lowStock.length * 3, 0, 25);
  const demandScore = clamp(totalViews / 8 + totalWhatsappClicks * 3 + totalLikes, 0, 30);
  const trustScore = clamp((shop.verified ? 8 : 0) + (followerCount / 3) + (shop.logoUrl ? 4 : 0) + (shop.bio ? 3 : 0), 0, 20);
  const score = Math.round(catalogScore + stockScore + demandScore + trustScore);
  const grade = gradeFromScore(score);

  const strengths: string[] = [];
  const watchouts: string[] = [];
  const advice: string[] = [];

  if (totalViews > 0) strengths.push(`${totalViews.toLocaleString()} total views show buyers are finding your shop.`);
  if (totalWhatsappClicks > 0) strengths.push(`${totalWhatsappClicks.toLocaleString()} WhatsApp click${totalWhatsappClicks === 1 ? "" : "s"} show real buying interest.`);
  if (topProduct) strengths.push(`${topProduct.title} is your strongest product this week.`);
  if (followerCount > 0) strengths.push(`${followerCount.toLocaleString()} follower${followerCount === 1 ? "" : "s"} can become repeat buyers.`);

  if (activeProducts.length < 5) {
    watchouts.push("Your catalog is still small, so buyers have fewer choices.");
    advice.push("Add 3–5 more products with clear photos, prices, and locations to increase buyer trust.");
  }
  if (outOfStock.length > 0) {
    watchouts.push(`${outOfStock.length} product${outOfStock.length === 1 ? " is" : "s are"} out of stock.`);
    advice.push("Restock sold-out products or update their titles/descriptions so buyers know when they are available again.");
  }
  if (lowStock.length > 0) {
    advice.push("Restock low-stock products early; products marked ‘Only a few left’ can create urgency, but buyers still need availability.");
  }
  if (totalViews >= 20 && conversionRate < 2) {
    watchouts.push("Views are not turning into enough WhatsApp contacts yet.");
    advice.push("Improve your first product image and add a stronger description like size, condition, delivery area, and why the price is fair.");
  }
  if (totalViews >= 20 && engagementRate < 5) {
    advice.push("Try better lighting, cleaner backgrounds, and shorter product titles; this can improve likes and saves from the feed.");
  }
  if (!shop.instagramUrl && !shop.facebookUrl && !shop.tiktokUrl && !shop.websiteUrl && !shop.xUrl) {
    advice.push("Connect at least one social handle so buyers can verify your shop outside Nakudin.");
  }
  if (topProduct && shop.pinnedProductId !== topProduct.id) {
    advice.push(`Pin or feature “${topProduct.title}” because it has the best performance signal in your catalog.`);
  }
  if (advice.length === 0) {
    advice.push("Keep your best products active, share your shop link this week, and reply quickly on WhatsApp to protect your momentum.");
  }
  if (strengths.length === 0) strengths.push("Your shop is ready; the next step is to create more product activity.");
  if (watchouts.length === 0) watchouts.push("No major issue detected. Keep posting, restocking, and sharing your shop link.");

  const weeklyMessage = advice[0];
  const summary = `${grade}: score ${score}/100 based on catalog size, stock health, buyer interest, and shop trust signals.`;
  const maxMetric = Math.max(totalViews, totalLikes, totalWhatsappClicks, followerCount, 1);

  return {
    weekKey,
    weekLabel: formatWeekLabel(weekKey),
    score,
    grade,
    summary,
    weeklyMessage,
    advice: advice.slice(0, 4),
    strengths: strengths.slice(0, 3),
    watchouts: watchouts.slice(0, 3),
    metrics: [
      { label: "Views", value: totalViews, max: maxMetric, tone: "primary" },
      { label: "Likes", value: totalLikes, max: maxMetric, tone: "red" },
      { label: "WhatsApp", value: totalWhatsappClicks, max: maxMetric, tone: "green" },
      { label: "Followers", value: followerCount, max: maxMetric, tone: "blue" },
    ],
    funnel: [
      { label: "Product views", value: totalViews, max: Math.max(totalViews, 1), tone: "primary" },
      { label: "Likes", value: totalLikes, max: Math.max(totalViews, totalLikes, 1), tone: "red" },
      { label: "WhatsApp contacts", value: totalWhatsappClicks, max: Math.max(totalViews, totalWhatsappClicks, 1), tone: "green" },
    ],
    topProductTitle: topProduct?.title ?? null,
    conversionRate,
    engagementRate,
  };
}
