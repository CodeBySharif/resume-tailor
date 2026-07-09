"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatLanguageEntry,
  LANGUAGE_PROFICIENCY_OPTIONS,
  parseLanguageEntry,
} from "@/lib/language-utils";
import { cn } from "@/lib/utils";

interface LanguageListFieldProps {
  id?: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export function LanguageListField({
  id,
  label,
  values,
  onChange,
  className,
}: LanguageListFieldProps) {
  const [language, setLanguage] = useState("");
  const [proficiency, setProficiency] = useState<string>(
    LANGUAGE_PROFICIENCY_OPTIONS[0]
  );

  function addItem() {
    const entry = formatLanguageEntry(language, proficiency);
    if (!entry) return;
    const exists = values.some(
      (v) => v.toLowerCase() === entry.toLowerCase()
    );
    if (exists) {
      setLanguage("");
      return;
    }
    onChange([...values, entry]);
    setLanguage("");
  }

  function removeItem(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          id={id}
          value={language}
          placeholder="e.g. English"
          onChange={(e) => setLanguage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1"
        />
        <Select
          value={proficiency}
          onValueChange={(value) => {
            if (value) setProficiency(value);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Proficiency" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_PROFICIENCY_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 sm:w-auto"
          onClick={addItem}
          disabled={!language.trim()}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((item, index) => {
            const { language: name, proficiency: level } =
              parseLanguageEntry(item);
            return (
              <li
                key={`${item}-${index}`}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-sm"
              >
                <span>
                  {name}
                  {level ? (
                    <span className="text-muted-foreground"> · {level}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={`Remove ${item}`}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          No languages yet — add one above.
        </p>
      )}
    </div>
  );
}
