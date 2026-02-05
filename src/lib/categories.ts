// Market categories with display info
export const MARKET_CATEGORIES = {
  SPORTS: {
    id: "SPORTS",
    label: "Sports",
    emoji: "⚽",
    description: "Athletics, games, and competitions",
  },
  ACADEMICS: {
    id: "ACADEMICS",
    label: "Academics",
    emoji: "📚",
    description: "Classes, exams, and grades",
  },
  CAMPUS_LIFE: {
    id: "CAMPUS_LIFE",
    label: "Campus Life",
    emoji: "🏫",
    description: "Dorms, dining, events, and daily life",
  },
  ENTERTAINMENT: {
    id: "ENTERTAINMENT",
    label: "Entertainment",
    emoji: "🎬",
    description: "Movies, music, shows, and pop culture",
  },
  POLITICS: {
    id: "POLITICS",
    label: "Politics",
    emoji: "🗳️",
    description: "Elections, policies, and governance",
  },
  WEATHER: {
    id: "WEATHER",
    label: "Weather",
    emoji: "🌤️",
    description: "Weather predictions and forecasts",
  },
  OTHER: {
    id: "OTHER",
    label: "Other",
    emoji: "💡",
    description: "Everything else",
  },
} as const;

export type CategoryId = keyof typeof MARKET_CATEGORIES;

export const categoryIds = new Set(Object.keys(MARKET_CATEGORIES) as CategoryId[]);

export function getCategoryById(id: string | null | undefined) {
  if (!id) return null;
  return MARKET_CATEGORIES[id as CategoryId] ?? null;
}

export function getCategoryLabel(id: string | null | undefined): string {
  const cat = getCategoryById(id);
  return cat ? `${cat.emoji} ${cat.label}` : "Uncategorized";
}

export const categoryList = Object.values(MARKET_CATEGORIES);
