import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useGetMyShop, useUpdateMyShop, getGetMyShopQueryKey } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import { SHOP_THEMES, type ShopTheme } from "@/lib/shop-themes";

const CATEGORIES = [
  "Fashion & Clothing","Electronics & Gadgets","Phones & Accessories","Home & Furniture",
  "Beauty & Personal Care","Food & Groceries","Automobile & Spare Parts","Health & Wellness",
  "Baby & Kids","Books & Stationery","Sports & Fitness","Agriculture & Livestock",
  "Services","Real Estate","Other",
];

export default function ShopEdit() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: shop } = useGetMyShop({ query: { queryKey: getGetMyShopQueryKey() } });
  const updateMyShop = useUpdateMyShop();

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [category, setCategory] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [shopTheme, setShopTheme] = useState<ShopTheme>("classic");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (shop) {
      setName(shop.businessName);
      setWhatsapp(shop.whatsappNumber ?? "");
      setCategory(shop.category);
      setBio(shop.bio ?? "");
      setLogoUrl(shop.logoUrl ?? "");
      setCoverUrl(shop.coverUrl ?? "");
      setCity(shop.locationCity ?? "");
      setState(shop.locationState ?? "");
      setCustomSlug(shop.customSlug ?? "");
      setInstagramUrl(shop.instagramUrl ?? "");
      setFacebookUrl(shop.facebookUrl ?? "");
      setXUrl(shop.xUrl ?? "");
      setTiktokUrl(shop.tiktokUrl ?? "");
      setWebsiteUrl(shop.websiteUrl ?? "");
      setShopTheme((shop.shopTheme ?? "classic") as ShopTheme);
    }
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaved(false);
    try {
      await updateMyShop.mutateAsync({
        businessName: name.trim(),
        whatsappNumber: whatsapp.trim(),
        category,
        bio: bio || undefined,
        logoUrl: logoUrl || undefined,
        coverUrl: coverUrl || undefined,
        locationCity: city || undefined,
        locationState: state || undefined,
        customSlug: customSlug.trim() || null,
        instagramUrl: instagramUrl.trim() || null,
        facebookUrl: facebookUrl.trim() || null,
        xUrl: xUrl.trim() || null,
        tiktokUrl: tiktokUrl.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        shopTheme,
      });
      queryClient.invalidateQueries({ queryKey: getGetMyShopQueryKey() });
      setSaved(true);
      setTimeout(() => navigate(`/shops/${shop?.id}`), 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message?.replace(/Firebase:.*/, "") || "Failed to save changes. Please try again.");
    }
  };

  if (!user) return <div className="p-8 text-center text-muted-foreground">Sign in first.</div>;

  return (
    <div className="min-h-[100dvh] px-4 py-4 pb-24 max-w-lg mx-auto" data-testid="page-shop-edit">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/shops/${shop?.id ?? ""}`)} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Edit Shop</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <ImageUpload label="Cover Photo" value={coverUrl} onChange={setCoverUrl} aspect="wide" />
        </div>

        <div>
          <ImageUpload label="Shop Logo" value={logoUrl} onChange={setLogoUrl} aspect="square" />
        </div>

        <div>
          <Label htmlFor="name">Business Name</Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1" data-testid="input-business-name" />
        </div>

        <div>
          <Label htmlFor="whatsapp">WhatsApp Number</Label>
          <Input id="whatsapp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+2348012345678" className="mt-1" data-testid="input-whatsapp" />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="mt-1 w-full rounded-md border border-input surface-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} className="mt-1 resize-none" data-testid="input-bio" />
        </div>



        <div className="surface-1 rounded-2xl p-4 space-y-3">
          <div>
            <Label>Social handles</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Connect your public social pages so buyers can trust and follow your brand.</p>
          </div>
          <Input value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="Instagram URL or handle" />
          <Input value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="Facebook page URL" />
          <Input value={xUrl} onChange={e => setXUrl(e.target.value)} placeholder="X / Twitter URL or handle" />
          <Input value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)} placeholder="TikTok URL or handle" />
          <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="Website URL" />
        </div>

        <div>
          <Label>Shop Homepage Style</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">Choose how visitors see your shop when they open it from a product page.</p>
          <div className="grid gap-3">
            {SHOP_THEMES.map(theme => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setShopTheme(theme.id)}
                className={`text-left surface-1 interactive-card rounded-2xl p-4 border transition-all ${shopTheme === theme.id ? "border-primary shadow-[0_0_22px_rgba(0,217,255,0.14)]" : "border-white/8"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{theme.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                  </div>
                  {shopTheme === theme.id && <CheckCircle2 size={18} className="text-primary flex-shrink-0" />}
                </div>
                <div className={`mt-3 h-16 rounded-xl bg-gradient-to-br ${theme.accent} border border-white/8 overflow-hidden`}>
                  <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_22%),linear-gradient(135deg,rgba(0,0,0,0.12),rgba(0,0,0,0.45))]" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="slug">Custom Shop URL Slug</Label>
          <Input id="slug" value={customSlug} onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="yourshopname" className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Use this for a clean public link like /s/yourshopname.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={e => setCity(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" value={state} onChange={e => setState(e.target.value)} className="mt-1" />
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
        {saved && <p className="text-green-500 text-sm">Saved! Redirecting...</p>}

        <Button type="submit" className="w-full" disabled={updateMyShop.isPending} data-testid="button-save">
          {updateMyShop.isPending ? <Loader2 className="animate-spin" size={16} /> : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
