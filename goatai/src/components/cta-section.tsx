"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth-modal";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <section className="py-16 md:py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Start Predicting?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of students already making predictions on their campus. 
            Sign up free and get 100 bonus credits to start trading.
          </p>

          <Button
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold gap-2"
            onClick={() => setIsAuthOpen(true)}
          >
            Create Free Account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
