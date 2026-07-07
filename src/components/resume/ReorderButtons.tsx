"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReorderButtonsProps {
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ReorderButtons({
  index,
  total,
  onMoveUp,
  onMoveDown,
}: ReorderButtonsProps) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={index === 0}
        onClick={onMoveUp}
        title="Move up"
        aria-label="Move up"
      >
        <ChevronUp className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={index === total - 1}
        onClick={onMoveDown}
        title="Move down"
        aria-label="Move down"
      >
        <ChevronDown className="size-3.5" />
      </Button>
    </div>
  );
}
