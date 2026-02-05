import { Header } from "@/components/header";
import { HeroSection, FeaturesBar } from "@/components/hero-section";
import { TrendingMarkets } from "@/components/trending-markets";
import { MarketsSection } from "@/components/markets-section";
import { StatsDashboard } from "@/components/stats-dashboard";
import { HowItWorks } from "@/components/how-it-works";
import { LeaderboardSection } from "@/components/leaderboard-section";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <FeaturesBar />
      <TrendingMarkets />
      <MarketsSection />
      <StatsDashboard />
      <HowItWorks />
      <LeaderboardSection />
      <CTASection />
      <Footer />
    </main>
  );
}
