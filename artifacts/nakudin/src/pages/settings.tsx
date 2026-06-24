import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, User, CreditCard, LogOut, Shield, Globe } from "lucide-react";
import { useI18n } from "@/i18n";

interface SettingsRowProps {
  icon: any;
  label: string;
  description?: string;
  onClick?: () => void;
  href?: string;
  destructive?: boolean;
  rightElement?: React.ReactNode;
}

function SettingsRow({ icon: Icon, label, description, onClick, href, destructive, rightElement }: SettingsRowProps) {
  const inner = (
    <div
      className={`flex items-center gap-3 py-3.5 border-b border-border last:border-0 cursor-pointer ${destructive ? "text-destructive" : "text-foreground hover:text-primary"} transition-colors`}
      onClick={onClick}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${destructive ? "bg-destructive/10" : "bg-muted"}`}>
        <Icon size={16} className={destructive ? "text-destructive" : "text-muted-foreground"} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {rightElement ?? <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

export default function Settings() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { lang, setLang, t } = useI18n();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto" data-testid="page-settings">
      <h1 className="text-xl font-bold text-foreground mb-6">{t("settings")}</h1>

      {user && (
        <div className="bg-card border border-card-border rounded-xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user.displayName || "Account"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      )}

      <div className="bg-card border border-card-border rounded-xl px-4 mb-4">
        <SettingsRow icon={User} label={t("editShopProfile")} description={t("changeNameBioLogo")} href="/dashboard" />
        <SettingsRow icon={CreditCard} label={t("subscriptionBilling")} description={t("manageYourPlan")} href="/subscription" />
        {user?.email === "musabmuhammadabubakar@gmail.com" && (
          <SettingsRow icon={Shield} label="Admin Panel" description="Manage the marketplace" href="/admin" />
        )}
      </div>

      <div className="bg-card border border-card-border rounded-xl px-4 mb-4">
        <SettingsRow
          icon={Globe}
          label={t("language")}
          description={lang === "en" ? t("english") : t("hausa")}
          rightElement={
            <div className="flex gap-1">
              {(["en", "ha"] as const).map((l) => (
                <button
                  key={l}
                  onClick={(e) => { e.stopPropagation(); setLang(l); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    lang === l
                      ? "bg-primary text-black"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l === "en" ? "EN" : "HA"}
                </button>
              ))}
            </div>
          }
        />
      </div>

      <div className="bg-card border border-card-border rounded-xl px-4">
        <SettingsRow
          icon={LogOut}
          label={t("signOut")}
          onClick={handleLogout}
          destructive
        />
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">Nakudin v1.0</p>
    </div>
  );
}
