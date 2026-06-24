import { useAuth } from "@/lib/auth-context";
import { useGetMyShop, getGetMyShopQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertTriangle, Lock, ArrowLeft, Zap, Star } from "lucide-react";
import { useI18n } from "@/i18n";

declare const PaystackPop: {
  setup: (opts: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    metadata: Record<string, unknown>;
    onSuccess: (txn: { reference: string }) => void;
    onCancel: () => void;
  }) => { openIframe: () => void };
};

const PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? "";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "₦1,000",
    period: "/month",
    saving: null,
    amountKobo: 100_000,
    features: [
      "List up to 20 products",
      "WhatsApp click tracking",
      "Basic analytics",
      "60-day free trial",
    ],
    highlight: false,
    icon: Zap,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "₦9,000",
    period: "/year",
    saving: "₦750/month — save ₦3,000",
    amountKobo: 900_000,
    features: [
      "List up to 20 products",
      "WhatsApp click tracking",
      "Basic analytics",
      "60-day free trial",
      "2 months FREE vs monthly",
    ],
    highlight: true,
    icon: Star,
  },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: any; class: string }> = {
    trial: { label: "Trial", icon: Clock, class: "text-primary bg-primary/10 border-primary/20" },
    active: { label: "Active", icon: CheckCircle2, class: "text-green-400 bg-green-400/10 border-green-400/20" },
    grace: { label: "Grace Period", icon: AlertTriangle, class: "text-secondary bg-secondary/10 border-secondary/20" },
    locked: { label: "Locked", icon: Lock, class: "text-destructive bg-destructive/10 border-destructive/20" },
  };
  const cfg = map[status] ?? map.trial;
  const Icon = cfg.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${cfg.class}`}>
      <Icon size={14} />
      {cfg.label}
    </div>
  );
}

export default function Subscription() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data: shop } = useGetMyShop({ query: { enabled: !!user } });
  const queryClient = useQueryClient();

  const handleSubscribe = (plan: typeof PLANS[number]) => {
    if (!user?.email) return;

    if (!PUBLIC_KEY || typeof PaystackPop === "undefined") {
      alert(t("paystackKeyMissing"));
      return;
    }

    const ref = `nakudin-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const handler = PaystackPop.setup({
      key: PUBLIC_KEY,
      email: user.email,
      amount: plan.amountKobo,
      currency: "NGN",
      ref,
      metadata: {
        shopId: user.uid,
        plan: plan.id,
        custom_fields: [
          { display_name: "Shop ID", variable_name: "shopId", value: user.uid },
          { display_name: "Plan", variable_name: "plan", value: plan.id },
        ],
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyShopQueryKey() });
      },
      onCancel: () => {},
    });

    handler.openIframe();
  };

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto" data-testid="page-subscription">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <button className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={22} />
          </button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">{t("subscription")}</h1>
      </div>

      {shop && (
        <div className="bg-card border border-card-border rounded-xl p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-2">{t("currentStatus")}</p>
          <StatusBadge status={shop.subscriptionStatus} />
          {shop.trialEndsAt && shop.subscriptionStatus === "trial" && (
            <p className="text-xs text-muted-foreground mt-2">
              Trial ends {new Date(shop.trialEndsAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
          {shop.subscriptionStatus === "grace" && (
            <p className="text-xs text-secondary mt-2">{t("gracePeriodNote")}</p>
          )}
          {shop.subscriptionStatus === "locked" && (
            <p className="text-xs text-destructive mt-2">{t("lockedNote")}</p>
          )}
        </div>
      )}

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-6 flex items-start gap-2">
        <Clock size={15} className="text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-semibold">60-day free trial</span> — {t("trialNote").replace("60-day free trial — ", "")}
        </p>
      </div>

      <h2 className="text-base font-semibold text-foreground mb-4">{t("choosePlan")}</h2>

      <div className="space-y-4 mb-6">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`bg-card border rounded-xl p-4 relative ${plan.highlight ? "border-primary glow-cyan" : "border-card-border"}`}
            >
              {plan.highlight && (
                <span className="absolute -top-2.5 left-4 text-xs bg-primary text-black font-bold px-2 py-0.5 rounded-full">
                  {t("bestValue")}
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${plan.highlight ? "bg-primary/20" : "bg-muted"}`}>
                  <Icon size={14} className={plan.highlight ? "text-primary" : "text-muted-foreground"} />
                </div>
                <p className="font-semibold text-foreground">{plan.name}</p>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-extrabold text-[#FFB020]">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              {plan.saving && (
                <p className="text-xs text-primary font-medium mb-3">{plan.saving}</p>
              )}
              <ul className="space-y-1.5 mb-4 mt-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 size={13} className="text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlight ? "default" : "outline"}
                onClick={() => handleSubscribe(plan)}
                disabled={shop?.subscriptionStatus === "active"}
              >
                {shop?.subscriptionStatus === "active" ? "Active" : `${t("selectPlan")} ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">{t("paymentHistory")}</h3>
        <p className="text-sm text-muted-foreground text-center py-4">{t("noPaymentsYet")}</p>
      </div>
    </div>
  );
}
