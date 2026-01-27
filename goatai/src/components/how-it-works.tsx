import { UserPlus, Search, DollarSign, Trophy } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up",
    description: "Create your account with your college email. It takes less than a minute.",
  },
  {
    icon: Search,
    title: "Find Markets",
    description: "Browse predictions about sports, academics, campus events, and more.",
  },
  {
    icon: DollarSign,
    title: "Make Predictions",
    description: "Buy Yes or No shares based on what you think will happen.",
  },
  {
    icon: Trophy,
    title: "Win & Earn",
    description: "If you're right, collect your winnings. Climb the leaderboard.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start predicting in minutes. No experience needed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-border" />
              )}

              <div className="relative flex flex-col items-center text-center">
                {/* Step Number */}
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center z-10">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center mb-4 shadow-sm">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
