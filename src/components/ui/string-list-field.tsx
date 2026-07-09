"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface StringListFieldProps {
  id?: string;
  label: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export function StringListField({
  id,
  label,
  placeholder = "Type and press Enter or Add",
  values,
  onChange,
  className,
}: StringListFieldProps) {
  const [draft, setDraft] = useState("");

  function addItem(raw: string) {
    const next = raw.trim();
    if (!next) return;
    const exists = values.some((v) => v.toLowerCase() === next.toLowerCase());
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...values, next]);
    setDraft("");
  }

  function removeItem(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(draft);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => addItem(draft)}
          disabled={!draft.trim()}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-sm"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`Remove ${item}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No items yet — add one above.</p>
      )}
    </div>
  );
}
