import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useCreateShop, useCheckBusinessName } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useEffect } from "react";

const CATEGORIES = [
  "Fashion & Clothing","Electronics & Gadgets","Phones & Accessories","Home & Furniture",
  "Beauty & Personal Care","Food & Groceries","Automobile & Spare Parts","Health & Wellness",
  "Baby & Kids","Books & Stationery","Sports & Fitness","Agriculture & Livestock",
  "Services","Real Estate","Other",
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function CreateShop() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const createShop = useCreateShop();

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [category, setCategory] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");

  const debouncedName = useDebounce(name.trim(), 500);
  const { data: nameCheck, isFetching: checkingName } = useCheckBusinessName(
    { name: debouncedName },
    { query: { enabled: debouncedName.length >= 2 } }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsapp || !category) { setError("Name, WhatsApp, and category are required"); return; }
    setError("");
    try {
      await createShop.mutateAsync({
        businessName: name.trim(),
        whatsappNumber: whatsapp.trim(),
        category,
        bio: bio || undefined,
        logoUrl: logoUrl || undefined,
        coverUrl: coverUrl || undefined,
        locationCity: city || undefined,
        locationState: state || undefined,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create shop");
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Please sign in first.</p>
        <a href="/login" className="text-primary">Go to Login</a>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] px-4 py-8 max-w-lg mx-auto" data-testid="page-create-shop">
      <h1 className="text-2xl font-extrabold text-foreground mb-1">Set up your shop</h1>
      <p className="text-muted-foreground text-sm mb-8">Your shop is your profile — make it count.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <ImageUpload label="Cover Photo" value={coverUrl} onChange={setCoverUrl} aspect="wide" />
        </div>

        <div>
          <ImageUpload label="Shop Logo" value={logoUrl} onChange={setLogoUrl} aspect="square" />
        </div>

        <div>
          <Label htmlFor="business-name">Business Name *</Label>
          <div className="relative mt-1">
            <Input
              id="business-name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Amira's Fashion House"
              className="pr-8"
              data-testid="input-business-name"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {checkingName && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
              {!checkingName && nameCheck?.available === true && <CheckCircle2 size={14} className="text-green-500" />}
              {!checkingName && nameCheck?.available === false && <XCircle size={14} className="text-destructive" />}
            </div>
          </div>
          {!checkingName && nameCheck?.available === false && (
            <p className="text-destructive text-xs mt-1">This name is taken. Try another.</p>
          )}
        </div>

        <div>
          <Label htmlFor="whatsapp">WhatsApp Number *</Label>
          <Input
            id="whatsapp"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            required
            placeholder="+2348012345678"
            className="mt-1"
            data-testid="input-whatsapp"
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="select-category"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell buyers what you sell and what makes you special..."
            rows={3}
            className="mt-1 resize-none"
            data-testid="input-bio"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Lagos" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" value={state} onChange={e => setState(e.target.value)} placeholder="Lagos" className="mt-1" />
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full"
          disabled={createShop.isPending || (nameCheck?.available === false)}
          data-testid="button-create-shop"
        >
          {createShop.isPending ? <Loader2 className="animate-spin" size={16} /> : "Open My Shop"}
        </Button>
      </form>
    </div>
  );
}
