"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StringListField } from "@/components/ui/string-list-field";
import {
  createId,
  DEFAULT_SKILL_CATEGORY_NAMES,
  type SkillCategory,
} from "@/lib/resume-schema";

const DEFAULT_NAMES = new Set<string>(
  DEFAULT_SKILL_CATEGORY_NAMES.map((n) => n.toLowerCase())
);

function isDefaultCategory(name: string): boolean {
  return DEFAULT_NAMES.has(name.trim().toLowerCase());
}

interface SkillCategoriesFieldProps {
  categories: SkillCategory[];
  onChange: (categories: SkillCategory[]) => void;
}

export function SkillCategoriesField({
  categories,
  onChange,
}: SkillCategoriesFieldProps) {
  function updateCategory(index: number, patch: Partial<SkillCategory>) {
    const next = categories.map((cat, i) =>
      i === index ? { ...cat, ...patch } : cat
    );
    onChange(next);
  }

  function addCustomCategory() {
    onChange([
      ...categories,
      { id: createId(), name: "Custom", skills: [] },
    ]);
  }

  function removeCategory(index: number) {
    const cat = categories[index];
    if (!cat || isDefaultCategory(cat.name)) return;
    onChange(categories.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Group skills by category. Uncategorized skills from an uploaded resume
        land in <span className="font-medium text-foreground">Other</span> —
        drag them into the right groups as you edit.
      </p>

      {categories.map((cat, index) => {
        const canRemove = !isDefaultCategory(cat.name);
        return (
          <div
            key={cat.id}
            className="space-y-2 rounded-lg border border-border bg-muted/20 p-3"
          >
            <div className="flex items-center gap-2">
              {canRemove ? (
                <Input
                  value={cat.name}
                  aria-label="Category name"
                  onChange={(e) =>
                    updateCategory(index, { name: e.target.value })
                  }
                  className="h-8 max-w-xs text-sm font-medium"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">{cat.name}</p>
              )}
              {canRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${cat.name} category`}
                  onClick={() => removeCategory(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
            <StringListField
              id={`skill-cat-${cat.id}`}
              label={`${cat.name} skills`}
              placeholder={`Add a ${cat.name.toLowerCase()} skill`}
              values={cat.skills}
              onChange={(skills) => updateCategory(index, { skills })}
            />
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addCustomCategory}
      >
        <Plus className="size-4" />
        Add category
      </Button>
    </div>
  );
}
