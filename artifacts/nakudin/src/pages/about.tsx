import { Link } from "wouter";
import {
  ArrowLeft, BadgeCheck, HeartHandshake, PackageSearch,
  ShieldCheck, Store, Users, Star, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NakudinLogo } from "@/components/NakudinLogo";

const values = [
  {
    icon: Store,
    title: "Built for Nigerian businesses",
    body: "Nakudin helps local shop owners list products, manage stock, share their shop link, and receive buyer enquiries directly on WhatsApp — no tech skills needed.",
  },
  {
    icon: PackageSearch,
    title: "Open discovery, no barriers",
    body: "Anyone can browse products, view shops, and contact sellers without creating an account. Discovery is open, friction-free, and fast.",
  },
  {
    icon: ShieldCheck,
    title: "Trust built in",
    body: "Verified badges, product photos, stock levels, customer reviews, and report tools help buyers shop with confidence every time.",
  },
  {
    icon: HeartHandshake,
    title: "Tools sellers actually need",
    body: "Dashboards include analytics, print tools, receipt generation, smart performance advice, custom shop themes, and direct messaging to admin.",
  },
];

const stats = [
  { icon: Users, label: "Active shops", value: "500+" },
  { icon: PackageSearch, label: "Products listed", value: "10k+" },
  { icon: Star, label: "Avg shop rating", value: "4.8" },
  { icon: Zap, label: "WhatsApp connections", value: "Daily" },
];

export default function AboutPage() {
  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto" data-testid="page-about">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <button className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={22} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">About Nakudin</h1>
          <p className="text-xs text-muted-foreground">Nigeria's marketplace for real shops and quality products.</p>
        </div>
      </div>

      {/* Hero card */}
      <section className="surface-1 rounded-3xl p-5 mb-5 border border-white/8 overflow-hidden relative">
        <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-orange-500/8 blur-2xl pointer-events-none" />
        <div className="relative">
          <NakudinLogo size="lg" />
          <div className="inline-flex items-center gap-1.5 rounded-full surface-2 border border-primary/20 px-3 py-1 text-xs text-primary mt-4">
            <BadgeCheck size={13} />
            Real shops. Real products. Real connections.
          </div>
          <h2 className="text-2xl font-black text-foreground mt-4 leading-tight">
            Nigeria's home for trusted local shops and quality products.
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Nakudin makes it easy to discover and buy from verified Nigerian businesses.
            Buyers browse freely — no account needed. Sellers get a powerful, mobile-first
            storefront with the tools to grow their business and connect with more customers every day.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-5">
            <Link href="/explore"><Button className="w-full">Explore products</Button></Link>
            <Link href="/contact"><Button variant="outline" className="w-full">Contact us</Button></Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="surface-1 rounded-2xl p-3 border border-white/8 text-center">
            <Icon size={16} className="text-primary mx-auto mb-1" />
            <p className="text-base font-black text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <section className="surface-1 rounded-3xl p-5 mb-5 border border-white/8">
        <h3 className="text-base font-bold text-foreground mb-2">Our mission</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We believe every Nigerian entrepreneur deserves a professional online presence without the
          complexity or high cost of traditional e-commerce. Nakudin removes every unnecessary barrier —
          for buyers and sellers alike — so the focus stays on great products and real connections.
        </p>
      </section>

      {/* Values */}
      <section className="space-y-3 mb-5">
        <h3 className="text-base font-bold text-foreground px-1">What we stand for</h3>
        {values.map(({ icon: Icon, title, body }) => (
          <div key={title} className="surface-1 rounded-2xl p-4 border border-white/8 flex gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="surface-1 rounded-3xl p-5 border border-primary/20 text-center overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/6 to-transparent pointer-events-none" />
        <div className="relative">
          <p className="text-base font-bold text-foreground mb-1">Ready to start selling?</p>
          <p className="text-xs text-muted-foreground mb-4">
            Create your shop in minutes. 60-day free trial — no card needed.
          </p>
          <div className="flex gap-2">
            <Link href="/register" className="flex-1"><Button className="w-full">Open a shop</Button></Link>
            <Link href="/shops" className="flex-1"><Button variant="outline" className="w-full">Browse shops</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
