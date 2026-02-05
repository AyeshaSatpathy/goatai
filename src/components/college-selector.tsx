"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollege } from "@/components/college-context";
import { colleges } from "@/lib/colleges";
import { useAuth } from "@/components/auth-provider";

export function CollegeSelector({
  variant = "default",
  persist = true,
}: {
  variant?: "default" | "header";
  persist?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { selectedCollege, setSelectedCollege } = useCollege();
  const { session } = useAuth();

  const persistCampus = async (collegeId: string) => {
    if (!persist) return;
    try {
      localStorage.setItem("hunch:campusId", collegeId);
    } catch {}
    if (session?.user) {
      await fetch("/api/me/campus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campusId: collegeId }),
      }).catch(() => {});
    }
  };

  if (variant === "header") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between gap-2 bg-transparent min-w-[140px]"
          >
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedCollege ? selectedCollege.shortName : "Select school"}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search colleges..." />
            <CommandList>
              <CommandEmpty>No college found.</CommandEmpty>
              <CommandGroup>
                {colleges.map((college) => (
                  <CommandItem
                    key={college.id}
                    value={college.name}
                    onSelect={() => {
                      setSelectedCollege(college);
                      persistCampus(college.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCollege?.id === college.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{college.shortName}</span>
                      <span className="text-xs text-muted-foreground">{college.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between gap-2 h-12 text-base bg-transparent"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 shrink-0" />
            <span>
              {selectedCollege ? selectedCollege.name : "Select your college"}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search colleges..." />
          <CommandList>
            <CommandEmpty>No college found.</CommandEmpty>
            <CommandGroup>
              {colleges.map((college) => (
                <CommandItem
                  key={college.id}
                  value={college.name}
                  onSelect={() => {
                    setSelectedCollege(college);
                    persistCampus(college.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCollege?.id === college.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{college.shortName}</span>
                    <span className="text-xs text-muted-foreground">{college.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
