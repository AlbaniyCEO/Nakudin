export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Fashion & Clothing": ["dress", "gown", "ankara", "asoebi", "shirt", "jeans", "shoe", "sneaker", "bag", "wear", "kaftan", "lace"],
  "Electronics & Gadgets": ["laptop", "speaker", "camera", "watch", "gadget", "power bank", "console", "tv", "monitor"],
  "Phones & Accessories": ["iphone", "samsung", "android", "phone", "charger", "earpiece", "airpod", "case", "screen guard"],
  "Home & Furniture": ["sofa", "chair", "table", "bed", "mattress", "lamp", "curtain", "rug", "kitchen", "decor"],
  "Beauty & Personal Care": ["cream", "perfume", "makeup", "wig", "skincare", "soap", "lotion", "hair", "nails", "lipstick"],
  "Food & Groceries": ["rice", "food", "snack", "cake", "drink", "oil", "spice", "grocery", "meat", "fish"],
  "Automobile & Spare Parts": ["car", "tyre", "engine", "battery", "spare", "oil filter", "brake", "vehicle"],
  "Health & Wellness": ["fitness", "supplement", "vitamin", "health", "wellness", "massage", "therapy"],
  "Baby & Kids": ["baby", "kids", "toy", "stroller", "diaper", "children", "school bag"],
  "Books & Stationery": ["book", "pen", "notebook", "stationery", "textbook", "journal"],
  "Sports & Fitness": ["gym", "dumbbell", "sport", "jersey", "football", "yoga", "fitness"],
  "Agriculture & Livestock": ["farm", "seed", "fertilizer", "chicken", "goat", "cow", "livestock", "agric"],
  "Services": ["service", "repair", "training", "design", "delivery", "cleaning", "consultation"],
  "Real Estate": ["house", "apartment", "land", "rent", "property", "estate", "duplex"],
};

const RISK_WORDS = ["fake", "clone", "stolen", "weapon", "gun", "drug", "password", "hack", "counterfeit"];

export function suggestCategory(title: string, description = "") {
  const text = `${title} ${description}`.toLowerCase();
  let best = { category: "Other", score: 0 };
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
    if (score > best.score) best = { category, score };
  }
  return best.score > 0 ? best : null;
}

export function getProductQualityHints(input: { title: string; description?: string; price?: number; images?: string[]; category?: string }) {
  const hints: string[] = [];
  const risk: string[] = [];
  const text = `${input.title} ${input.description ?? ""}`.toLowerCase();

  if (input.title.trim().length < 8) hints.push("Use a clearer product title with brand, type, or key feature.");
  if ((input.description ?? "").trim().length < 40) hints.push("Add size, condition, material, color, pickup/delivery info, or warranty details.");
  if (!input.category) hints.push("Choose a category so buyers can find this faster.");
  if (!input.images?.length) hints.push("Add at least one clear product photo.");
  if (!input.price || input.price <= 0) hints.push("Add a valid price.");
  for (const word of RISK_WORDS) if (text.includes(word)) risk.push(`Review risky word: ${word}`);

  return { hints, risk };
}

export function scoreProductForDiscovery(product: {
  title?: string; description?: string | null; category?: string | null; stockQuantity?: number | null;
  likeCount?: number; viewCount?: number; whatsappClickCount?: number; featuredUntil?: string | null; createdAt?: string;
}) {
  const title = product.title ?? "";
  const description = product.description ?? "";
  const hasGoodTitle = title.trim().length >= 8 ? 1 : 0;
  const hasDescription = description.trim().length >= 40 ? 1 : 0;
  const isFeatured = product.featuredUntil && new Date(product.featuredUntil).getTime() > Date.now();
  const created = product.createdAt ? new Date(product.createdAt).getTime() : Date.now();
  const ageDays = Math.max(0, (Date.now() - created) / 86_400_000);
  const freshness = Math.max(0, 8 - ageDays * 0.25);

  return (isFeatured ? 40 : 0) +
    ((product.stockQuantity ?? 1) > 0 ? 8 : -8) +
    Math.log1p(product.likeCount ?? 0) * 3 +
    Math.log1p(product.viewCount ?? 0) * 1.2 +
    Math.log1p(product.whatsappClickCount ?? 0) * 4 +
    (product.category ? 2 : 0) +
    hasGoodTitle * 2 +
    hasDescription * 2 +
    freshness;
}
