import { Trophy, TrendingUp, Medal } from "lucide-react";

const topTraders = [
  {
    rank: 1,
    name: "Alex M.",
    school: "Stanford",
    profit: "+$2,847",
    winRate: "72%",
    avatar: "A",
  },
  {
    rank: 2,
    name: "Sarah K.",
    school: "MIT",
    profit: "+$2,234",
    winRate: "68%",
    avatar: "S",
  },
  {
    rank: 3,
    name: "Jordan P.",
    school: "Berkeley",
    profit: "+$1,892",
    winRate: "65%",
    avatar: "J",
  },
  {
    rank: 4,
    name: "Chris L.",
    school: "UCLA",
    profit: "+$1,567",
    winRate: "61%",
    avatar: "C",
  },
  {
    rank: 5,
    name: "Maya R.",
    school: "NYU",
    profit: "+$1,234",
    winRate: "59%",
    avatar: "M",
  },
];

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground">{rank}</span>;
}

export function LeaderboardSection() {
  return (
    <section id="leaderboard" className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Compete Against the Best
            </h2>
            <p className="text-muted-foreground mb-6">
              See how you stack up against other students. Climb the leaderboard, 
              earn bragging rights, and prove you know your campus better than anyone.
            </p>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Weekly Prizes</div>
                  <div className="text-sm text-muted-foreground">Top 10 win rewards</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Track Progress</div>
                  <div className="text-sm text-muted-foreground">See your stats grow</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Leaderboard Card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Top Predictors This Week
              </h3>
            </div>

            <div className="divide-y divide-border">
              {topTraders.map((trader) => (
                <div
                  key={trader.rank}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center">
                    {getRankIcon(trader.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {trader.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{trader.name}</div>
                    <div className="text-sm text-muted-foreground">{trader.school}</div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {trader.profit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trader.winRate} win rate
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
