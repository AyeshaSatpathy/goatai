/**
 * Audit logging for sensitive actions
 * Logs to console in development, can be extended to external service
 */

export type AuditAction =
  | "MARKET_CREATED"
  | "MARKET_RESOLVED"
  | "MARKET_CANCELED"
  | "TRADE_PLACED"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "CAMPUS_CHANGED"
  | "RATE_LIMIT_HIT";

export type AuditLogEntry = {
  action: AuditAction;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

// In-memory audit log (recent entries for debugging)
// In production, send to logging service (e.g., Datadog, LogRocket, etc.)
const recentLogs: AuditLogEntry[] = [];
const MAX_RECENT_LOGS = 1000;

/**
 * Log a sensitive action
 */
export function auditLog(entry: Omit<AuditLogEntry, "timestamp">): void {
  const fullEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date(),
  };

  // Add to in-memory store
  recentLogs.push(fullEntry);
  if (recentLogs.length > MAX_RECENT_LOGS) {
    recentLogs.shift();
  }

  // Log to console in structured format
  const logLevel = getLogLevel(entry.action);
  const logMessage = formatLogMessage(fullEntry);

  if (logLevel === "warn") {
    console.warn(`[AUDIT] ${logMessage}`);
  } else {
    console.log(`[AUDIT] ${logMessage}`);
  }

  // In production, you would send to external logging service here:
  // await sendToLoggingService(fullEntry);
}

function getLogLevel(action: AuditAction): "info" | "warn" {
  switch (action) {
    case "RATE_LIMIT_HIT":
    case "MARKET_CANCELED":
      return "warn";
    default:
      return "info";
  }
}

function formatLogMessage(entry: AuditLogEntry): string {
  const meta = entry.metadata ? ` | ${JSON.stringify(entry.metadata)}` : "";
  return `${entry.action} | user:${entry.userId} | ${entry.timestamp.toISOString()}${meta}`;
}

/**
 * Get recent audit logs (for admin/debugging)
 */
export function getRecentAuditLogs(limit = 100): AuditLogEntry[] {
  return recentLogs.slice(-limit);
}

/**
 * Helper to extract client info from request headers
 */
export function getClientInfo(headers: Headers): { ip?: string; userAgent?: string } {
  return {
    ip: headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
        headers.get("x-real-ip") || 
        undefined,
    userAgent: headers.get("user-agent") || undefined,
  };
}
