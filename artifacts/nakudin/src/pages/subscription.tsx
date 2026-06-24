import { useAuth } from "@/lib/auth-context";
import { useGetMyShop } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertTriangle, Lock, ArrowLeft } from "lucide-react";

const PLANS = [
  { name: "Starter", price: "₦1,000", period: "/month", features: ["List up to 20 products", "WhatsApp click tracking", "Basic analytics"] },
  { name: "Pro", price: "₦2,500", period: "/month", features: ["Unlimited products", "Priority listing", "Advanced analytics", "Verified badge eligibility"], highlight: true },
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
  const { data: shop } = useGetMyShop({ query: { enabled: !!user } });

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto" data-testid="page-subscription">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <button className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={22} />
          </button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Subscription</h1>
      </div>

      {shop && (
        <div className="bg-card border border-card-border rounded-xl p-4 mb-6">
          <p className="text-sm text-muted-foreground mb-2">Current Status</p>
          <StatusBadge status={shop.subscriptionStatus} />
          {shop.trialEndsAt && shop.subscriptionStatus === "trial" && (
            <p className="text-xs text-muted-foreground mt-2">
              Trial ends {new Date(shop.trialEndsAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      )}

      <h2 className="text-base font-semibold text-foreground mb-4">Choose a Plan</h2>

      <div className="space-y-4 mb-6">
        {PLANS.map(plan => (
          <div key={plan.name} className={`bg-card border rounded-xl p-4 ${plan.highlight ? "border-primary glow-cyan" : "border-card-border"}`}>
            {plan.highlight && <span className="text-xs text-primary font-semibold mb-2 block">Recommended</span>}
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-extrabold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            <p className="font-semibold text-foreground mb-2">{plan.name}</p>
            <ul className="space-y-1.5 mb-4">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 size={13} className="text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>
              Select {plan.name}
            </Button>
          </div>
        ))}
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Payment History</h3>
        <p className="text-sm text-muted-foreground text-center py-4">No payments yet.</p>
      </div>
    </div>
  );
}
