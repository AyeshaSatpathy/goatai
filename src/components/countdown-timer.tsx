"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
  compact?: boolean;
  onExpire?: () => void;
}

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
};

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
}

export function CountdownTimer({
  targetDate,
  className,
  compact = false,
  onExpire,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(targetDate)
  );
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0 && !hasExpired) {
        setHasExpired(true);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, hasExpired, onExpire]);

  if (timeLeft.total <= 0) {
    return (
      <div className={cn("flex items-center gap-1 text-amber-600 dark:text-amber-400", className)}>
        <Clock className="h-3.5 w-3.5" />
        <span className="font-medium">Awaiting resolution</span>
      </div>
    );
  }

  // Urgent styling when less than 1 hour left
  const isUrgent = timeLeft.total < 60 * 60 * 1000;
  // Warning styling when less than 24 hours left
  const isWarning = timeLeft.total < 24 * 60 * 60 * 1000;

  if (compact) {
    // Compact format for cards
    let display = "";
    if (timeLeft.days > 0) {
      display = `${timeLeft.days}d ${timeLeft.hours}h`;
    } else if (timeLeft.hours > 0) {
      display = `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.minutes > 0) {
      display = `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      display = `${timeLeft.seconds}s`;
    }

    return (
      <div
        className={cn(
          "flex items-center gap-1 text-xs",
          isUrgent
            ? "text-red-600 dark:text-red-400 font-semibold animate-pulse"
            : isWarning
            ? "text-amber-600 dark:text-amber-400 font-medium"
            : "text-muted-foreground",
          className
        )}
      >
        <Clock className="h-3.5 w-3.5" />
        <span>{display}</span>
      </div>
    );
  }

  // Full format for detail pages
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Clock
        className={cn(
          "h-5 w-5",
          isUrgent
            ? "text-red-600 dark:text-red-400"
            : isWarning
            ? "text-amber-600 dark:text-amber-400"
            : "text-muted-foreground"
        )}
      />
      <div className="flex gap-2">
        {timeLeft.days > 0 && (
          <TimeUnit value={timeLeft.days} label="d" isUrgent={isUrgent} isWarning={isWarning} />
        )}
        <TimeUnit value={timeLeft.hours} label="h" isUrgent={isUrgent} isWarning={isWarning} />
        <TimeUnit value={timeLeft.minutes} label="m" isUrgent={isUrgent} isWarning={isWarning} />
        <TimeUnit value={timeLeft.seconds} label="s" isUrgent={isUrgent} isWarning={isWarning} />
      </div>
    </div>
  );
}

function TimeUnit({
  value,
  label,
  isUrgent,
  isWarning,
}: {
  value: number;
  label: string;
  isUrgent: boolean;
  isWarning: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-0.5 tabular-nums",
        isUrgent
          ? "text-red-600 dark:text-red-400 font-bold"
          : isWarning
          ? "text-amber-600 dark:text-amber-400 font-semibold"
          : "text-foreground font-medium"
      )}
    >
      <span className="text-lg">{String(value).padStart(2, "0")}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
