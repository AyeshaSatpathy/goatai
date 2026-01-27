"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface College {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
}

export const colleges: College[] = [
  { id: "stanford", name: "Stanford University", shortName: "Stanford" },
  { id: "mit", name: "Massachusetts Institute of Technology", shortName: "MIT" },
  { id: "harvard", name: "Harvard University", shortName: "Harvard" },
  { id: "berkeley", name: "UC Berkeley", shortName: "Berkeley" },
  { id: "ucla", name: "UCLA", shortName: "UCLA" },
  { id: "umich", name: "University of Michigan", shortName: "Michigan" },
  { id: "utexas", name: "University of Texas at Austin", shortName: "UT Austin" },
  { id: "gatech", name: "Georgia Institute of Technology", shortName: "Georgia Tech" },
  { id: "usc", name: "University of Southern California", shortName: "USC" },
  { id: "nyu", name: "New York University", shortName: "NYU" },
  { id: "columbia", name: "Columbia University", shortName: "Columbia" },
  { id: "cornell", name: "Cornell University", shortName: "Cornell" },
];

interface CollegeContextType {
  selectedCollege: College | null;
  setSelectedCollege: (college: College | null) => void;
}

const CollegeContext = createContext<CollegeContextType | undefined>(undefined);

export function CollegeProvider({ children }: { children: ReactNode }) {
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

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
