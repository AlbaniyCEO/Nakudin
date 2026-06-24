import { useGetFeed } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data, isLoading } = useGetFeed();

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4" data-testid="page-home">
      <h1 className="text-xl font-bold mb-4">For You</h1>
      <div className="grid grid-cols-2 gap-4">
        {data?.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
