import { Link } from "wouter";
import { useGetFeed } from "@/lib/hooks";
import { ProductCard } from "@/components/ProductCard";
import { Loader2, Globe, MessageSquareText } from "lucide-react";
import { NakudinLogo } from "@/components/NakudinLogo";
import { useI18n } from "@/i18n";

export default function Home() {
  const { data, isLoading } = useGetFeed();
  const { lang, setLang, t } = useI18n();

  const toggleLang = () => setLang(lang === "en" ? "ha" : "en");

  return (
    <div className="flex flex-col min-h-[100dvh]" data-testid="page-home">
      <header className="sticky top-0 z-40 premium-glass border-b border-white/8 px-4 py-3 flex items-center justify-between rounded-b-2xl">
        <NakudinLogo size="md" />
        <button
          onClick={toggleLang}
          className="surface-2 interactive-card flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-primary/50"
          aria-label="Toggle language"
        >
          <Globe size={13} />
          <span className="font-medium">{lang === "en" ? "EN" : "HA"}</span>
        </button>
      </header>

      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">{t("forYou")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Browse products and contact sellers directly.</p>
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
