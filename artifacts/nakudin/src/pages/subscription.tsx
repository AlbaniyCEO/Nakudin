import { useAuth } from "@/lib/auth-context";
import { useGetMyShop, useUpdateMyShop, getGetMyShopQueryKey } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertTriangle, Lock, ArrowLeft, Zap, Star } from "lucide-react";
import { useI18n } from "@/i18n";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "Included",
    period: "",
    saving: "No payment required",
    amountKobo: 0,
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
    price: "Included",
    period: "",
    saving: "Yearly billing tools remain available when payments are enabled",
    amountKobo: 0,
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
  const updateShop = useUpdateMyShop();
  const queryClient = useQueryClient();

  const markPlanActiveLocally = async (plan: typeof PLANS[number]) => {
    const nextBillingDate = new Date();
    if (plan.id === "yearly") nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    else nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    await updateShop.mutateAsync({
      subscriptionStatus: "active",
      billingCycle: plan.id as "monthly" | "yearly",
      nextBillingDate: nextBillingDate.toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: getGetMyShopQueryKey() });
  };

  const handleSubscribe = (plan: typeof PLANS[number]) => {
    markPlanActiveLocally(plan).catch(() => {
      queryClient.invalidateQueries({ queryKey: getGetMyShopQueryKey() });
    });
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
        <div className="surface-1 rounded-xl p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-2">{t("currentStatus")}</p>
          <StatusBadge status={shop.subscriptionStatus} />
          {shop.trialEndsAt && shop.subscriptionStatus === "trial" && (
            <p className="text-xs text-muted-foreground mt-2">
              Trial ends {new Date(shop.trialEndsAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
          {shop.nextBillingDate && (
            <p className="text-xs text-muted-foreground mt-2">Next billing: {new Date(shop.nextBillingDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })} · {shop.billingCycle}</p>
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
          <span className="text-primary font-semibold">Included access</span> — subscription tools are available to every shop while paid access is disabled.
        </p>
      </div>

      <h2 className="text-base font-semibold text-foreground mb-4">{t("choosePlan")}</h2>

      <div className="space-y-4 mb-6">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`surface-1 rounded-xl p-4 relative ${plan.highlight ? "border-primary glow-cyan" : "border-card-border"}`}
            >
              {plan.highlight && (
                <span className="absolute -top-2.5 left-4 text-xs bg-primary text-black font-bold px-2 py-0.5 rounded-full">
                  {t("bestValue")}
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${plan.highlight ? "bg-primary/20" : "surface-2"}`}>
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
                disabled={(shop?.subscriptionStatus === "active" && shop?.billingCycle === plan.id) || updateShop.isPending}
              >
                {shop?.subscriptionStatus === "active" && shop?.billingCycle === plan.id ? "Active" : updateShop.isPending ? "Updating..." : `Activate ${plan.name}` }
              </Button>
            </div>
          );
        })}
      </div>

      <div className="surface-1 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Access</h3>
        <p className="text-sm text-muted-foreground text-center py-4">Paid access is currently disabled; all shops can use these features.</p>
      </div>
    </div>
  );
}
