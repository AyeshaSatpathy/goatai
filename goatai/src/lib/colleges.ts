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

export const collegeIds = new Set(colleges.map((c) => c.id));

export function getCollegeById(id?: string | null) {
  if (!id) return null;
  return colleges.find((c) => c.id === id) ?? null;
}


