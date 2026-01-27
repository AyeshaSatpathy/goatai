"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth-modal";
import { ArrowRight, TrendingUp, Shield, Sparkles } from "lucide-react";

export function HeroSection() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden bg-primary">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M0 0h1v40H0zM39 0h1v40h-1zM0 0h40v1H0zM0 39h40v1H0z'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-sm font-medium mb-6">
              Built for college students
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 text-balance">
              Predict the Future of Your Campus
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/75 mb-8 max-w-2xl mx-auto text-pretty">
              Trade on outcomes that matter. From sports to dining hall menus, 
              put your knowledge to the test and compete with friends.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold gap-2"
                onClick={() => setIsAuthOpen(true)}
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold bg-transparent"
              >
                Explore Markets
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-primary-foreground">10k+</div>
                <div className="text-sm text-primary-foreground/60">Students</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-primary-foreground">$50k</div>
                <div className="text-sm text-primary-foreground/60">Volume</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-primary-foreground">150+</div>
                <div className="text-sm text-primary-foreground/60">Markets</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 100V50C240 83.3333 480 100 720 100C960 100 1200 83.3333 1440 50V100H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}

export function FeaturesBar() {
  const features = [
    { icon: TrendingUp, text: "Real-time prices" },
    { icon: Shield, text: "Secure & transparent" },
    { icon: Sparkles, text: "Campus verified" },
  ];

  return (
    <div className="bg-background py-6 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {features.map((feature) => (
            <div
              key={feature.text}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <feature.icon className="h-5 w-5 text-foreground" />
              <span className="text-sm font-medium">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
