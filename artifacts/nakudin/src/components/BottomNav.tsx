import { Link, useLocation } from "wouter";
import { Home, Search, Store, LayoutDashboard, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const links = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/explore", icon: Search, label: "Explore" },
    { href: "/shops", icon: Store, label: "Shops" },
    { href: user ? "/dashboard" : "/login?next=dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: user ? "/settings" : "/register", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-stretch h-16 max-w-screen-sm mx-auto" data-testid="bottom-nav">
      {links.map(({ href, icon: Icon, label }) => {
        const active = location === href || (href !== "/" && location.startsWith(href));
        return (
          <Link key={href} href={href} className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} data-testid={`nav-${label.toLowerCase()}`}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
