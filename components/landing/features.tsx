import { Target, Wallet, BarChart3, ShieldCheck } from "lucide-react";

export function LandingFeatures() {
  const features = [
    {
      title: "Trade Tracking",
      description: "Log and review every trade with precision. Never miss a detail about your setups and execution.",
      icon: Target,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "group-hover:border-blue-500/50"
    },
    {
      title: "Capital Management",
      description: "Track multiple accounts and total capital in one seamless system. Switch contexts effortlessly.",
      icon: Wallet,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "group-hover:border-purple-500/50"
    },
    {
      title: "Performance Analytics",
      description: "Visualize your growth with real data. Deep dive into win rates, profit factors, and equity curves.",
      icon: BarChart3,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "group-hover:border-emerald-500/50"
    },
    {
      title: "Discipline System",
      description: "Stay consistent with built-in rule enforcement. Hold yourself accountable to your trading plan.",
      icon: ShieldCheck,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "group-hover:border-amber-500/50"
    }
  ];

  return (
    <section className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything you need for your edge.
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            A comprehensive suite of tools built specifically to elevate your trading business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx}
                className={`group p-8 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:bg-white/[0.04] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] ${feature.border}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.bg}`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
