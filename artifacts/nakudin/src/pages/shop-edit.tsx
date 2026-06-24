import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useGetMyShop, useUpdateMyShop, getGetMyShopQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { ChevronLeft, Loader2 } from "lucide-react";

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
    }
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaved(false);
    try {
      await updateMyShop.mutateAsync({
        data: {
          businessName: name.trim(),
          whatsappNumber: whatsapp.trim(),
          category,
          bio: bio || undefined,
          logoUrl: logoUrl || undefined,
          coverUrl: coverUrl || undefined,
          locationCity: city || undefined,
          locationState: state || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetMyShopQueryKey() });
      setSaved(true);
      setTimeout(() => navigate(`/shops/${shop?.id}`), 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
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
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} className="mt-1 resize-none" data-testid="input-bio" />
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
