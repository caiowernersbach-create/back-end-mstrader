import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { Check, CreditCard, Zap, Users, Crown } from "lucide-react";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 19,
    description: "Essential tools for individual traders",
    features: [
      "Unlimited trade logging",
      "Daily compliance tracking",
      "Basic analytics",
      "30-day data history",
      "Email support",
    ],
    icon: Zap,
    current: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    description: "Advanced features for serious traders",
    features: [
      "Everything in Basic",
      "Strategy analysis & insights",
      "CSV & PDF exports",
      "Unlimited data history",
      "Screenshot attachments",
      "Priority support",
    ],
    icon: Crown,
    current: true,
    popular: true,
  },
  {
    id: "mentor",
    name: "Mentor",
    price: 99,
    description: "Perfect for trading mentors and coaches",
    features: [
      "Everything in Pro",
      "Student roster management",
      "Aggregated student metrics",
      "Custom reports",
      "White-label options",
      "Dedicated support",
    ],
    icon: Users,
    current: false,
  },
];

const Billing = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing</h1>
          <p className="mt-1 text-muted-foreground">Manage your subscription and payment methods</p>
        </div>

        {/* Current Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="stat-card"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Current Plan</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You are currently on the <span className="font-semibold text-primary">Pro</span> plan.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground">Next billing: Jan 8, 2025</p>
              </div>
              <button className="btn-secondary">
                <CreditCard className="h-4 w-4" />
                Manage
              </button>
            </div>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "stat-card relative",
                plan.popular && "border-primary/50"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}

              <div className="mb-6 flex items-center gap-3">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  plan.current ? "bg-primary/20" : "bg-secondary"
                )}>
                  <plan.icon className={cn(
                    "h-6 w-6",
                    plan.current ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="mb-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-profit" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={cn(
                  "w-full rounded-lg py-3 font-medium transition-all",
                  plan.current
                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
                    : "btn-primary"
                )}
                disabled={plan.current}
              >
                {plan.current ? "Current Plan" : "Upgrade"}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="stat-card"
        >
          <h3 className="mb-6 text-lg font-semibold text-foreground">Payment Method</h3>
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-secondary">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/26</p>
              </div>
            </div>
            <button className="text-sm text-primary hover:text-primary/80">
              Update
            </button>
          </div>
        </motion.div>

        {/* Coupon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="stat-card"
        >
          <h3 className="mb-4 text-lg font-semibold text-foreground">Have a coupon?</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter coupon code"
              className="input-trading flex-1"
            />
            <button className="btn-secondary">Apply</button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
