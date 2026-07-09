"use client";

import { useEffect, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatMonthYear,
  parseToMonthYear,
  toMonthInputValue,
  YEAR_OPTIONS,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const CURRENT_YEAR = new Date().getFullYear();

interface MonthYearInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

function splitYearMonth(value: string): { year: string; month: string } {
  const normalized = toMonthInputValue(value);
  if (!normalized) {
    return { year: String(CURRENT_YEAR), month: "" };
  }
  const [year, month] = normalized.split("-");
  return { year: year ?? String(CURRENT_YEAR), month: month ?? "" };
}

export function MonthYearInput({
  id,
  label,
  value,
  onChange,
  disabled,
  className,
}: MonthYearInputProps) {
  const [open, setOpen] = useState(false);
  const [textValue, setTextValue] = useState(value);
  const [{ year, month }, setPicker] = useState(() => splitYearMonth(value));

  useEffect(() => {
    setTextValue(value);
    setPicker(splitYearMonth(value));
  }, [value]);

  function applyPicker(monthVal: string, yearVal: string) {
    if (monthVal && yearVal) {
      onChange(`${yearVal}-${monthVal}`);
    }
  }

  function commitTextInput(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      onChange("");
      return;
    }
    if (trimmed.toLowerCase() === "present") {
      onChange("Present");
      return;
    }
    onChange(parseToMonthYear(trimmed));
  }

  const display = value
    ? formatMonthYear(toMonthInputValue(value) || value)
    : "Select month & year";

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="flex gap-1.5">
        <Input
          id={id}
          disabled={disabled}
          value={textValue}
          placeholder="Jan 2025 or 01/2025"
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={() => commitTextInput(textValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitTextInput(textValue);
            }
          }}
          className="min-w-0 flex-1"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            type="button"
            disabled={disabled}
            className={cn(
              "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm shadow-xs transition-colors hover:bg-muted/50",
              !value && "text-muted-foreground"
            )}
            title={display}
            aria-label={`Open calendar for ${label}`}
          >
            <CalendarIcon className="size-4 opacity-60" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="grid gap-3">
              <p className="text-sm font-medium">Select month & year</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Month</Label>
                  <Select
                    value={month || ""}
                    onValueChange={(m) => {
                      if (m) applyPicker(m, year || String(CURRENT_YEAR));
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Year</Label>
                  <Select
                    value={year || ""}
                    onValueChange={(y) => {
                      if (y) applyPicker(month || "01", y);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {YEAR_OPTIONS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Type a date or use the calendar — e.g. Jan 2025, 04/2026
      </p>
    </div>
  );
}
