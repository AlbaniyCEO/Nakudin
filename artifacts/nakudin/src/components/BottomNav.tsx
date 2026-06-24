import { Link, useLocation } from "wouter";
import { Home, Search, Store, LayoutDashboard, User } from "lucide-react";
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
    { href: user ? "/dashboard" : "/login?next=dashboard", icon: LayoutDashboard, labelKey: "dashboard" as const },
    { href: user ? "/settings" : "/register", icon: User, labelKey: "profile" as const },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-stretch h-16 max-w-screen-sm mx-auto" data-testid="bottom-nav">
      {links.map(({ href, icon: Icon, labelKey }) => {
        const active = location === href || (href !== "/" && location.startsWith(href));
        const label = t(labelKey);
        return (
          <Link key={href} href={href} className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} data-testid={`nav-${labelKey}`}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
