import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  useGetMyShop, useCreateProduct, useUpdateProduct, useGetProduct,
  getListProductsQueryKey, getGetProductQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { ChevronLeft, Loader2, X } from "lucide-react";

const CATEGORIES = [
  "Fashion & Clothing","Electronics & Gadgets","Phones & Accessories","Home & Furniture",
  "Beauty & Personal Care","Food & Groceries","Automobile & Spare Parts","Health & Wellness",
  "Baby & Kids","Books & Stationery","Sports & Fitness","Agriculture & Livestock",
  "Services","Real Estate","Other",
];

export default function ProductForm() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [, newParams] = useRoute("/dashboard/product/new");
  const [, editParams] = useRoute<{ id: string }>("/dashboard/product/:id/edit");
  const editId = editParams?.id;
  const isEditing = !!editId;
  const queryClient = useQueryClient();

  const { data: shop } = useGetMyShop();
  const { data: existing } = useGetProduct(editId ?? "", { query: { enabled: !!editId } });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setPrice(String(existing.price));
      setDescription(existing.description ?? "");
      setCategory(existing.category ?? "");
      setImages(existing.images ?? []);
      setCity(existing.locationCity ?? "");
      setState(existing.locationState ?? "");
    }
  }, [existing]);

  const addImage = (url: string) => {
    if (images.length < 6) setImages(prev => [...prev, url]);
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) { setError("Title and price are required"); return; }
    if (images.length === 0) { setError("Add at least one image"); return; }
    setError("");

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) { setError("Invalid price"); return; }

    try {
      if (isEditing && editId) {
        await updateProduct.mutateAsync({
          productId: editId,
          data: { title: title.trim(), price: priceNum, description: description || undefined, category: category || undefined, images, locationCity: city || undefined, locationState: state || undefined },
        });
        queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(editId) });
      } else {
        await createProduct.mutateAsync({
          data: { title: title.trim(), price: priceNum, description: description || undefined, category: category || undefined, images, locationCity: city || shop?.locationCity || undefined, locationState: state || shop?.locationState || undefined },
        });
      }
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({ shopId: shop?.id }) });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  if (!user) return <div className="p-8 text-center text-muted-foreground">Sign in first.</div>;

  return (
    <div className="min-h-[100dvh] px-4 py-4 pb-24 max-w-lg mx-auto" data-testid="page-product-form">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-foreground">{isEditing ? "Edit Product" : "Add Product"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Images */}
        <div>
          <Label className="mb-2 block">Images (up to 6) *</Label>
          <div className="flex flex-wrap gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                <img src={url} alt={`Product ${i+1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X size={11} className="text-white" />
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <div className="w-20 h-20"><ImageUpload label="Add" onChange={addImage} aspect="square" /></div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="title">Product Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="e.g. Nigerian Ankara Dress"
            className="mt-1"
            data-testid="input-title"
          />
        </div>

        <div>
          <Label htmlFor="price">Price (₦) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
            placeholder="5000"
            className="mt-1"
            data-testid="input-price"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe your product — size, material, condition, etc."
            rows={4}
            className="mt-1 resize-none"
            data-testid="input-description"
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="select-category"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
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

        <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit">
          {isPending ? <Loader2 className="animate-spin" size={16} /> : isEditing ? "Save Changes" : "List Product"}
        </Button>
      </form>
    </div>
  );
}
