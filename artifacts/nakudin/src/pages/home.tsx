import { useGetFeed } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { Loader2, Globe } from "lucide-react";
import { NakudinLogo } from "@/components/NakudinLogo";
import { useI18n, type Lang } from "@/i18n";

export default function Home() {
  const { data, isLoading } = useGetFeed();
  const { lang, setLang, t } = useI18n();

  const toggleLang = () => setLang(lang === "en" ? "ha" : "en");

  return (
    <div className="flex flex-col min-h-[100dvh]" data-testid="page-home">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <NakudinLogo size="md" />
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg border border-border hover:border-primary"
          aria-label="Toggle language"
        >
          <Globe size={13} />
          <span className="font-medium">{lang === "en" ? "EN" : "HA"}</span>
        </button>
      </header>

      <div className="p-4 flex-1">
        <h2 className="text-base font-semibold text-muted-foreground mb-4">{t("forYou")}</h2>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {data?.products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {!data?.products?.length && (
              <p className="col-span-2 text-center text-muted-foreground py-16 text-sm">
                {t("noProducts")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
