"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { College } from "@/lib/colleges";
import { getCollegeById } from "@/lib/colleges";
import { useAuth } from "@/components/auth-provider";

interface CollegeContextType {
  selectedCollege: College | null;
  setSelectedCollege: (college: College | null) => void;
}

const CollegeContext = createContext<CollegeContextType | undefined>(undefined);

export function CollegeProvider({ children }: { children: ReactNode }) {
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const { session } = useAuth();

  // Initialize from localStorage (fast), then hydrate from server if signed in.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("goatai:campusId");
      const c = getCollegeById(saved);
      if (c) setSelectedCollege(c);
    } catch {}
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!session?.user) return;
      try {
        const res = await fetch("/api/me");
        const json = await res.json().catch(() => ({}));
        const campusId = json?.user?.campusId as string | undefined;
        const c = getCollegeById(campusId);
        if (c) {
          setSelectedCollege(c);
          try {
            localStorage.setItem("goatai:campusId", c.id);
          } catch {}
        }
      } catch {}
    };
    run();
  }, [session?.user]);

  return (
    <CollegeContext.Provider value={{ selectedCollege, setSelectedCollege }}>
      {children}
    </CollegeContext.Provider>
  );
}

export function useCollege() {
  const context = useContext(CollegeContext);
  if (context === undefined) {
    throw new Error("useCollege must be used within a CollegeProvider");
  }
  return context;
}
