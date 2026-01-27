import { Header } from "@/components/header";
import { HeroSection, FeaturesBar } from "@/components/hero-section";
import { MarketsSection } from "@/components/markets-section";
import { HowItWorks } from "@/components/how-it-works";
import { LeaderboardSection } from "@/components/leaderboard-section";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";
import { CollegeProvider } from "@/components/college-context";

export default function Home() {
  return (
    <CollegeProvider>
      <main className="min-h-screen">
        <Header />
        <HeroSection />
        <FeaturesBar />
        <MarketsSection />
        <HowItWorks />
        <LeaderboardSection />
        <CTASection />
        <Footer />
      </main>
    </CollegeProvider>
  );
}
