export type ShopTheme = "classic" | "editorial" | "boutique" | "catalog" | "spotlight";

export const SHOP_THEMES: Array<{
  id: ShopTheme;
  name: string;
  description: string;
  accent: string;
}> = [
  { id: "classic", name: "Classic Social", description: "Balanced profile header with tabs and a clean product grid.", accent: "from-primary/30 to-cyan-500/5" },
  { id: "editorial", name: "Editorial Hero", description: "Large magazine-style cover for shops with strong lifestyle imagery.", accent: "from-amber-500/25 to-primary/10" },
  { id: "boutique", name: "Boutique Cards", description: "Soft luxury cards and rounded sections for fashion, beauty, and gifts.", accent: "from-pink-500/20 to-amber-500/10" },
  { id: "catalog", name: "Catalog Pro", description: "Dense product-first layout for inventory-heavy shops.", accent: "from-emerald-500/20 to-primary/10" },
  { id: "spotlight", name: "Spotlight", description: "Pinned/featured product gets a premium hero treatment.", accent: "from-violet-500/25 to-primary/10" },
];

export function getShopTheme(theme?: string | null) {
  return SHOP_THEMES.find((t) => t.id === theme) ?? SHOP_THEMES[0];
}
