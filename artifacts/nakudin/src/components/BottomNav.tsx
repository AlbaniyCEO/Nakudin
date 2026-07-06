import { Link, useLocation } from "wouter";
import { Home, Search, Store, LayoutDashboard, Newspaper } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/i18n";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();

  const links = [
    { href: "/", icon: Home, labelKey: "home" as const },
    { href: "/explore", icon: Search, labelKey: "explore" as const },
    { href: "/shops", icon: Store, labelKey: "shops" as const },
    { href: "/blog", icon: Newspaper, labelKey: "blog" as const },
    { href: user ? "/dashboard" : "/login?next=dashboard", icon: LayoutDashboard, labelKey: "dashboard" as const },
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 premium-glass rounded-2xl flex items-stretch h-16 max-w-screen-sm mx-auto shadow-[0_12px_30px_rgba(0,0,0,0.35)]" data-testid="bottom-nav">
      {links.map(({ href, icon: Icon, labelKey }) => {
        const active = location === href || (href !== "/" && location.startsWith(href));
        const label = t(labelKey);
        return (
          <Link key={href} href={href} className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-200 ${active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/4"}`} data-testid={`nav-${labelKey}`}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
