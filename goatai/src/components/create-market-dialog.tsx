"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { categoryList, type CategoryId } from "@/lib/categories";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collegeId?: string;
  onCreated?: () => void;
};

export function CreateMarketDialog({ open, onOpenChange, collegeId, onCreated }: Props) {
  const { session } = useAuth();
  const isAuthed = Boolean(session?.user);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resolutionAt, setResolutionAt] = useState("");
  const [stakePoints, setStakePoints] = useState<string>("");
  const [category, setCategory] = useState<CategoryId | "">("");
  const [outcomes, setOutcomes] = useState<string[]>(["Yes", "No"]);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!isAuthed) return false;
    if (!title.trim() || !description.trim() || !resolutionAt) return false;
    const cleanOutcomes = outcomes.map((o) => o.trim()).filter(Boolean);
    if (cleanOutcomes.length < 2) return false;
    return true;
  }, [isAuthed, title, description, resolutionAt, outcomes]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setResolutionAt("");
    setStakePoints("");
    setCategory("");
    setOutcomes(["Yes", "No"]);
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const updateOutcome = (idx: number, value: string) => {
    setOutcomes((prev) => prev.map((o, i) => (i === idx ? value : o)));
  };

  const addOutcome = () => setOutcomes((prev) => [...prev, ""]);
  const removeOutcome = (idx: number) =>
    setOutcomes((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    try {
      setError(null);
      setIsSubmitting(true);

      const cleanOutcomes = outcomes.map((o) => o.trim()).filter(Boolean);
      const stake = stakePoints.trim() ? Number(stakePoints) : undefined;

      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          resolutionAt,
          outcomes: cleanOutcomes,
          stakePoints: Number.isFinite(stake) ? stake : undefined,
          collegeId: collegeId ?? undefined,
          category: category || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Failed to create market");
        setIsSubmitting(false);
        return;
      }

      handleClose(false);
      onCreated?.();
    } catch (e) {
      console.error(e);
      setError("Failed to create market");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border">
        <DialogTitle className="sr-only">Create a market</DialogTitle>

        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">Create a market</h2>
            <p className="text-sm text-muted-foreground">
              Students can create events to predict outcomes.
            </p>
          </div>

          {!isAuthed && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Please sign in with Google to create a market.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="market-title">Title</Label>
            <Input
              id="market-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Will the Spring Concert headliner be announced this week?"
              disabled={!isAuthed || isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="market-description">Description</Label>
            <textarea
              id="market-description"
              className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add helpful context, criteria for resolution, and any rules."
              disabled={!isAuthed || isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="market-category">Category</Label>
            <select
              id="market-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryId | "")}
              disabled={!isAuthed || isSubmitting}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a category...</option>
              {categoryList.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="market-resolution">Resolution date/time</Label>
              <Input
                id="market-resolution"
                type="datetime-local"
                value={resolutionAt}
                onChange={(e) => setResolutionAt(e.target.value)}
                disabled={!isAuthed || isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="market-stake">Optional stake (points)</Label>
              <Input
                id="market-stake"
                type="number"
                inputMode="numeric"
                value={stakePoints}
                onChange={(e) => setStakePoints(e.target.value)}
                placeholder="e.g., 100"
                disabled={!isAuthed || isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Outcomes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-transparent"
                onClick={addOutcome}
                disabled={!isAuthed || isSubmitting}
              >
                Add outcome
              </Button>
            </div>

            <div className="space-y-2">
              {outcomes.map((o, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={o}
                    onChange={(e) => updateOutcome(idx, e.target.value)}
                    placeholder={idx === 0 ? "Yes" : idx === 1 ? "No" : `Outcome ${idx + 1}`}
                    disabled={!isAuthed || isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOutcome(idx)}
                    disabled={!isAuthed || isSubmitting || outcomes.length <= 2}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Add at least two outcomes (e.g., Yes/No, Team A/Team B).
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="bg-transparent"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={!canSubmit || isSubmitting}
              className="font-semibold"
            >
              {isSubmitting ? "Creating..." : "Create market"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


