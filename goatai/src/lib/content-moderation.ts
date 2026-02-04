/**
 * Basic content moderation for user-generated content
 * Checks for profanity, spam patterns, and inappropriate content
 */

// Common profanity words (simplified list - extend as needed)
const PROFANITY_LIST = new Set([
  // Add words as needed - keeping this minimal for the example
  "fuck", "shit", "ass", "bitch", "damn", "crap",
  "bastard", "dick", "pussy", "cock", "cunt",
  "nigger", "nigga", "fag", "faggot", "retard",
]);

// Spam patterns
const SPAM_PATTERNS = [
  /(.)\1{4,}/i, // Same character repeated 5+ times
  /https?:\/\/[^\s]+/gi, // URLs (may want to allow some)
  /\b(buy|sell|discount|free money|click here)\b/gi, // Common spam phrases
  /[A-Z]{10,}/, // All caps text 10+ chars
];

type ModerationResult = {
  allowed: boolean;
  reason?: string;
  flaggedWords?: string[];
};

/**
 * Check text content for inappropriate material
 */
export function moderateContent(text: string): ModerationResult {
  if (!text || typeof text !== "string") {
    return { allowed: true };
  }

  const lowerText = text.toLowerCase();
  const flaggedWords: string[] = [];

  // Check for profanity
  const words = lowerText.split(/\s+/);
  for (const word of words) {
    // Clean word of punctuation for matching
    const cleanWord = word.replace(/[^a-z]/g, "");
    if (PROFANITY_LIST.has(cleanWord)) {
      flaggedWords.push(word);
    }
  }

  if (flaggedWords.length > 0) {
    return {
      allowed: false,
      reason: "Content contains inappropriate language",
      flaggedWords,
    };
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: "Content appears to be spam or contains disallowed patterns",
      };
    }
  }

  // Check for excessive special characters (potential abuse)
  const specialCharRatio = (text.match(/[^a-zA-Z0-9\s]/g)?.length ?? 0) / text.length;
  if (text.length > 10 && specialCharRatio > 0.5) {
    return {
      allowed: false,
      reason: "Content contains too many special characters",
    };
  }

  return { allowed: true };
}

/**
 * Moderate market creation content
 */
export function moderateMarket(title: string, description: string, outcomes: string[]): ModerationResult {
  // Check title
  const titleResult = moderateContent(title);
  if (!titleResult.allowed) {
    return { ...titleResult, reason: `Title: ${titleResult.reason}` };
  }

  // Check description
  const descResult = moderateContent(description);
  if (!descResult.allowed) {
    return { ...descResult, reason: `Description: ${descResult.reason}` };
  }

  // Check each outcome
  for (let i = 0; i < outcomes.length; i++) {
    const outcomeResult = moderateContent(outcomes[i]);
    if (!outcomeResult.allowed) {
      return { ...outcomeResult, reason: `Outcome ${i + 1}: ${outcomeResult.reason}` };
    }
  }

  return { allowed: true };
}
