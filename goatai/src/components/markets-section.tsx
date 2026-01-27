"use client";

import { useState } from "react";
import { MarketCard } from "@/components/market-card";
import { CollegeSelector } from "@/components/college-selector";
import { Button } from "@/components/ui/button";
import { useCollege } from "@/components/college-context";
import { Flame, GraduationCap, Trophy, Utensils, Users, Megaphone } from "lucide-react";

const categories = [
  { id: "trending", label: "Trending", icon: Flame },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "academics", label: "Academics", icon: GraduationCap },
  { id: "campus", label: "Campus Life", icon: Users },
  { id: "food", label: "Dining", icon: Utensils },
  { id: "events", label: "Events", icon: Megaphone },
];

// Markets data with college-specific content
const marketsByCollege: Record<string, Array<{
  id: number;
  title: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  endDate: string;
  trending: "up" | "down" | "neutral";
}>> = {
  stanford: [
    { id: 1, title: "Will Stanford football beat Cal in the Big Game?", category: "Sports", yesPrice: 72, noPrice: 28, volume: "$18.2k", endDate: "Nov 23", trending: "up" },
    { id: 2, title: "Will CoHo add a new espresso machine by Winter quarter?", category: "Dining", yesPrice: 65, noPrice: 35, volume: "$4.1k", endDate: "Jan 15", trending: "up" },
    { id: 3, title: "Will CS229 final be curved more than 10%?", category: "Academics", yesPrice: 34, noPrice: 66, volume: "$7.8k", endDate: "Dec 18", trending: "down" },
    { id: 4, title: "Will there be a fountain hop before finals?", category: "Campus Life", yesPrice: 88, noPrice: 12, volume: "$2.3k", endDate: "Dec 10", trending: "up" },
    { id: 5, title: "Will Frost Amphitheater host a surprise artist this quarter?", category: "Events", yesPrice: 41, noPrice: 59, volume: "$5.6k", endDate: "Mar 1", trending: "neutral" },
    { id: 6, title: "Will Arrillaga Dining add late night hours?", category: "Dining", yesPrice: 29, noPrice: 71, volume: "$3.2k", endDate: "Feb 1", trending: "down" },
  ],
  mit: [
    { id: 1, title: "Will the MIT Blackjack Team win the next competition?", category: "Events", yesPrice: 56, noPrice: 44, volume: "$9.4k", endDate: "Feb 20", trending: "up" },
    { id: 2, title: "Will 6.042 psets get any shorter this semester?", category: "Academics", yesPrice: 12, noPrice: 88, volume: "$11.2k", endDate: "May 15", trending: "down" },
    { id: 3, title: "Will there be a hack on the Great Dome before spring?", category: "Campus Life", yesPrice: 67, noPrice: 33, volume: "$6.8k", endDate: "Apr 1", trending: "up" },
    { id: 4, title: "Will Anna's Taqueria expand their menu?", category: "Dining", yesPrice: 45, noPrice: 55, volume: "$2.9k", endDate: "Mar 10", trending: "neutral" },
    { id: 5, title: "Will MIT Engineers beat Harvard in hockey?", category: "Sports", yesPrice: 58, noPrice: 42, volume: "$8.1k", endDate: "Feb 5", trending: "up" },
    { id: 6, title: "Will the Stata Center get a new coffee shop?", category: "Dining", yesPrice: 38, noPrice: 62, volume: "$4.4k", endDate: "Sep 1", trending: "neutral" },
  ],
  harvard: [
    { id: 1, title: "Will Harvard beat Yale in The Game?", category: "Sports", yesPrice: 61, noPrice: 39, volume: "$22.5k", endDate: "Nov 18", trending: "up" },
    { id: 2, title: "Will Annenberg dining get a makeover?", category: "Dining", yesPrice: 42, noPrice: 58, volume: "$5.7k", endDate: "Aug 1", trending: "neutral" },
    { id: 3, title: "Will CS50 enrollment break 1000 students?", category: "Academics", yesPrice: 78, noPrice: 22, volume: "$8.9k", endDate: "Sep 15", trending: "up" },
    { id: 4, title: "Will there be a primal scream before finals?", category: "Campus Life", yesPrice: 95, noPrice: 5, volume: "$1.2k", endDate: "Dec 15", trending: "up" },
    { id: 5, title: "Will the Lampoon prank the Crimson this year?", category: "Events", yesPrice: 73, noPrice: 27, volume: "$4.3k", endDate: "May 30", trending: "up" },
    { id: 6, title: "Will Felipe's add breakfast burritos?", category: "Dining", yesPrice: 51, noPrice: 49, volume: "$3.1k", endDate: "Feb 28", trending: "neutral" },
  ],
  berkeley: [
    { id: 1, title: "Will Cal football make a bowl game?", category: "Sports", yesPrice: 44, noPrice: 56, volume: "$14.2k", endDate: "Dec 1", trending: "down" },
    { id: 2, title: "Will Top Dog add a vegan option?", category: "Dining", yesPrice: 33, noPrice: 67, volume: "$3.8k", endDate: "Mar 15", trending: "down" },
    { id: 3, title: "Will EECS 16A get restructured again?", category: "Academics", yesPrice: 62, noPrice: 38, volume: "$6.5k", endDate: "Aug 20", trending: "up" },
    { id: 4, title: "Will there be a protest on Sproul this week?", category: "Campus Life", yesPrice: 89, noPrice: 11, volume: "$1.8k", endDate: "Jan 31", trending: "up" },
    { id: 5, title: "Will Golden Bear Cafe extend hours?", category: "Dining", yesPrice: 47, noPrice: 53, volume: "$2.4k", endDate: "Feb 10", trending: "neutral" },
    { id: 6, title: "Will Big Game Week have a concert?", category: "Events", yesPrice: 71, noPrice: 29, volume: "$5.9k", endDate: "Nov 15", trending: "up" },
  ],
  default: [
    { id: 1, title: "Will the basketball team make it to March Madness?", category: "Sports", yesPrice: 67, noPrice: 33, volume: "$12.4k", endDate: "Mar 15", trending: "up" },
    { id: 2, title: "Will the campus coffee shop add oat milk by February?", category: "Dining", yesPrice: 82, noPrice: 18, volume: "$3.2k", endDate: "Feb 1", trending: "up" },
    { id: 3, title: "Will there be a snow day before Spring Break?", category: "Campus Life", yesPrice: 45, noPrice: 55, volume: "$8.7k", endDate: "Mar 10", trending: "neutral" },
    { id: 4, title: "Will Professor Smith curve the final exam?", category: "Academics", yesPrice: 23, noPrice: 77, volume: "$5.1k", endDate: "Dec 20", trending: "down" },
    { id: 5, title: "Will the Spring Concert headliner be announced this week?", category: "Events", yesPrice: 71, noPrice: 29, volume: "$6.8k", endDate: "Jan 31", trending: "up" },
    { id: 6, title: "Will dining hall bring back waffle bar for brunch?", category: "Dining", yesPrice: 58, noPrice: 42, volume: "$2.9k", endDate: "Feb 15", trending: "neutral" },
  ],
};

export function MarketsSection() {
  const [activeCategory, setActiveCategory] = useState("trending");
  const { selectedCollege } = useCollege();

  const markets = selectedCollege 
    ? (marketsByCollege[selectedCollege.id] || marketsByCollege.default)
    : marketsByCollege.default;

  return (
    <section id="markets" className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {selectedCollege ? `${selectedCollege.shortName} Markets` : "Popular Markets"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            {selectedCollege 
              ? `Explore predictions happening at ${selectedCollege.name}`
              : "Select your college to see campus-specific predictions"
            }
          </p>
          
          {/* College Selector */}
          <div className="max-w-md mx-auto">
            <CollegeSelector />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto pb-2 mb-8 gap-2 scrollbar-hide mt-10">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              className={`flex-shrink-0 gap-2 ${activeCategory !== category.id ? "bg-transparent" : ""}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <category.icon className="h-4 w-4" />
              {category.label}
            </Button>
          ))}
        </div>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market) => (
            <MarketCard key={market.id} {...market} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="font-semibold bg-transparent">
            View All Markets
          </Button>
        </div>
      </div>
    </section>
  );
}
