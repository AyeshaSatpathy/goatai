# hunch.

> Campus prediction markets for college students

Hunch is a prediction market platform built for college communities. Students can create markets, trade on outcomes, and compete on leaderboards—all using virtual karma points.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E)

## ✨ Features

### Core
- **Prediction Markets** — Create Yes/No or multi-outcome markets
- **Pari-mutuel Trading** — Odds adjust based on pool distribution
- **Karma Points** — Virtual currency for risk-free trading
- **College Scoping** — Markets filtered by campus

### Analytics & Insights
- **Live Countdown Timers** — Real-time countdown to market resolution
- **Price History Charts** — Track odds changes over time
- **Personal Stats Dashboard** — Win rate, ROI, streaks, monthly performance
- **Trending Markets** — Surface hot markets based on 24h activity

### Categories
Markets are organized by category:
- ⚽ Sports
- 📚 Academics  
- 🏫 Campus Life
- 🎬 Entertainment
- 🗳️ Politics
- 🌤️ Weather
- 💡 Other

### Security
- Rate limiting on all endpoints
- Content moderation (profanity filter, spam detection)
- Audit logging for sensitive actions
- Input validation with length limits

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Better-Auth (Google OAuth) |
| Styling | Tailwind CSS |
| UI Components | Radix UI |
| Charts | Recharts |
| Analytics | Vercel Analytics |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (we recommend [Supabase](https://supabase.com))
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hunch.git
   cd hunch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your values (see [Environment Variables](#environment-variables))

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

Create a `.env.local` file with:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Better-Auth
BETTER_AUTH_SECRET="your-random-secret-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Getting Credentials

**Supabase Database:**
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection string
3. Use the "Session pooler" connection string (port 6543)
4. Add `?pgbouncer=true` to the end

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration history
├── public/                # Static assets
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── leaderboard/
│   │   │   ├── markets/   # Market CRUD + resolve/cancel
│   │   │   ├── me/        # Current user endpoints
│   │   │   ├── trades/    # Place trades
│   │   │   ├── users/     # User profiles
│   │   │   └── wallet/    # Wallet data
│   │   ├── markets/[id]/  # Market detail page
│   │   ├── profile/[id]/  # User profile page
│   │   ├── wallet/        # Wallet page
│   │   └── page.tsx       # Homepage
│   ├── components/
│   │   ├── ui/            # Base UI components
│   │   └── *.tsx          # Feature components
│   └── lib/
│       ├── auth.ts        # Better-Auth config
│       ├── prisma.ts      # Prisma client
│       ├── categories.ts  # Market categories
│       ├── colleges.ts    # College definitions
│       ├── rate-limit.ts  # Rate limiting
│       ├── content-moderation.ts
│       └── audit-log.ts   # Audit logging
└── package.json
```

## 📡 API Endpoints

### Markets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/markets` | List markets (filterable) |
| POST | `/api/markets` | Create market |
| GET | `/api/markets/[id]` | Get market details |
| GET | `/api/markets/[id]/stats` | Get market statistics |
| GET | `/api/markets/[id]/history` | Get price history |
| POST | `/api/markets/[id]/resolve` | Resolve market (creator only) |
| POST | `/api/markets/[id]/cancel` | Cancel & refund (creator only) |
| GET | `/api/markets/trending` | Get trending markets |

### Trading
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trades` | Place a trade |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me` | Get current user |
| GET | `/api/me/stats` | Get personal statistics |
| PUT | `/api/me/campus` | Update campus |
| GET | `/api/users/[id]` | Get user profile |
| GET | `/api/wallet` | Get wallet & positions |
| GET | `/api/leaderboard` | Get leaderboard |

## 🎮 How It Works

### Pari-mutuel System
- All trades go into a shared pool
- Odds are determined by pool distribution
- Winners split the pool proportionally to their stake
- No house edge—100% of karma is redistributed

### Market Lifecycle
1. **Created** — Market is open for trading
2. **Resolution Time** — Trading closes
3. **Resolved** — Creator picks winning outcome
4. **Settled** — Karma distributed to winners

### Karma
- New users start with **1,000 karma**
- Karma is virtual (no real money)
- Win karma by making correct predictions
- Compete on leaderboards

## 🧪 Development

### Database Commands
```bash
# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Generate client after schema changes
npx prisma generate

# Reset database
npx prisma migrate reset
```

### Linting
```bash
npm run lint
```

### Build
```bash
npm run build
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

**Important:** For production, update:
- `BETTER_AUTH_URL` → your production URL
- `NEXT_PUBLIC_APP_URL` → your production URL
- Google OAuth redirect URIs

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ for college students
