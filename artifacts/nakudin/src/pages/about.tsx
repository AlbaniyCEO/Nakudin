import { Link } from "wouter";
import { ArrowLeft, BadgeCheck, HeartHandshake, PackageSearch, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NakudinLogo } from "@/components/NakudinLogo";

const values = [
  {
    icon: Store,
    title: "Built for local businesses",
    body: "Nakudin helps shop owners show products, manage stock, share their shop, and receive buyer interest directly on WhatsApp.",
  },
  {
    icon: PackageSearch,
    title: "Easy product discovery",
    body: "Visitors can open the homepage, browse products, view shops, and contact sellers without being forced to create an account.",
  },
  {
    icon: ShieldCheck,
    title: "Trust and transparency",
    body: "Shop profiles, social handles, verification, product photos, stock badges, reviews, and reports help buyers make better decisions.",
  },
  {
    icon: HeartHandshake,
    title: "Support for sellers",
    body: "Dashboards include print tools, receipt generation, analytics, smart advice, themes, social links, and messaging to Admin.",
  },
];

export default function AboutPage() {
  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto" data-testid="page-about">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/"><button className="text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button></Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">About Nakudin</h1>
          <p className="text-xs text-muted-foreground">A simple marketplace for trusted local buying and selling.</p>
        </div>
      </div>

      <section className="surface-1 rounded-3xl p-5 mb-5 border border-white/8 overflow-hidden relative">
        <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <NakudinLogo size="lg" />
          <div className="inline-flex items-center gap-1.5 rounded-full surface-2 border border-primary/20 px-3 py-1 text-xs text-primary mt-4">
            <BadgeCheck size={13} />
            Shop. Discover. Connect.
          </div>
          <h2 className="text-2xl font-black text-foreground mt-4 leading-tight">
            Nakudin connects buyers with real shops and products quickly.
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Nakudin is designed to make online selling easier for local shop owners while keeping the buying experience open and simple for visitors. Buyers can browse products first, then contact sellers directly. Shop owners get tools to manage their products, stock, receipts, performance, and shop branding from one dashboard.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-5">
            <Link href="/explore"><Button className="w-full">Explore products</Button></Link>
            <Link href="/contact"><Button variant="outline" className="w-full">Contact us</Button></Link>
          </div>
        </div>
      </section>

      <section className="space-y-3 mb-5">
        {values.map(({ icon: Icon, title, body }) => (
          <div key={title} className="surface-1 rounded-2xl p-4 border border-white/8 flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon size={19} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="surface-1 rounded-2xl p-4 border border-white/8">
        <h3 className="text-sm font-semibold text-foreground">Our goal</h3>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          We want Nakudin to be a practical marketplace where sellers can grow with low cost tools and where buyers can find products without unnecessary barriers.
        </p>
      </section>
    </div>
  );
}
