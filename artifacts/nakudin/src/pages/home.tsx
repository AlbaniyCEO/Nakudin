import { Link } from "wouter";
import { useGetFeed } from "@/lib/hooks";
import { ProductCard } from "@/components/ProductCard";
import { Globe, MessageSquareText, Store, Plus } from "lucide-react";
import { NakudinLogo } from "@/components/NakudinLogo";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

function ProductSkeleton() {
  return (
    <div className="surface-1 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square surface-2" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 surface-2 rounded w-3/4" />
        <div className="h-4 surface-2 rounded w-1/2" />
        <div className="h-3 surface-2 rounded w-2/3 mt-2" />
      </div>
    </div>
  );
}

export default function Home() {
  const { data, isLoading } = useGetFeed();
  const { lang, setLang, t } = useI18n();
  const { user } = useAuth();

  const toggleLang = () => setLang(lang === "en" ? "ha" : "en");
  const hasProducts = (data?.products?.length ?? 0) > 0;

  return (
    <div className="flex flex-col min-h-[100dvh]" data-testid="page-home">
      <header className="sticky top-0 z-40 premium-glass border-b border-white/8 px-4 py-3 flex items-center justify-between rounded-b-2xl">
        <NakudinLogo size="md" />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="surface-2 interactive-card flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-primary/50"
            aria-label="Toggle language"
          >
            <Globe size={13} />
            <span className="font-medium">{lang === "en" ? "EN" : "HA"}</span>
          </button>
        </div>
      </header>

      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">{t("forYou")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real products from verified Nigerian shops — contact sellers instantly.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Link href="/about" className="hidden xs:inline-flex rounded-full surface-2 border border-white/8 px-3 py-2 text-[11px] text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">About</Link>
            <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-full surface-2 border border-white/8 px-3 py-2 text-[11px] text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
              <MessageSquareText size={13} />
              Contact
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : hasProducts ? (
          <div className="grid grid-cols-2 gap-4">
            {data!.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Empty state — marketplace is new or no products yet */
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
              <Store size={36} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {t("noProducts")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Nakudin is a growing marketplace for verified Nigerian shops.
              Be among the first sellers.
            </p>
            <div className="flex gap-3">
              <Link href="/explore">
                <Button variant="outline">Browse shops</Button>
              </Link>
              {user ? (
                <Link href="/dashboard">
                  <Button><Plus size={15} className="mr-1.5" />Add product</Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button><Store size={15} className="mr-1.5" />Open a shop</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
