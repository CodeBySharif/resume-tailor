"use client";

import { cn } from "@/lib/utils";
import { useResumeStore, type AppFlow } from "@/store/resume-store";

const NAV_ITEMS: { id: AppFlow | "home"; label: string; action: (s: ReturnType<typeof useResumeStore.getState>) => void }[] = [
  { id: "home", label: "Home", action: (s) => s.goToLanding() },
  { id: "create", label: "Create Resume", action: (s) => s.startCreateFlow() },
  { id: "tailor", label: "Tailor Resume", action: (s) => s.startTailorFlow() },
  { id: "ats", label: "ATS Checker", action: (s) => s.startAtsFlow() },
];

function flowBadgeLabel(flow: AppFlow): string {
  if (flow === "create") return "Create flow";
  if (flow === "tailor") return "Tailor flow";
  return "ATS flow";
}

export function FlowNav() {
  const store = useResumeStore();
  const { flow } = store;

  return (
    <nav
      className="mt-3 flex flex-wrap items-center gap-1"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.id === "home" ? flow === "landing" : flow === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => item.action(store)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary-foreground/20 text-primary-foreground ring-1 ring-primary-foreground/30"
                : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            )}
          >
            {item.label}
          </button>
        );
      })}
      {flow !== "landing" && (
        <span className="ml-auto rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
          {flowBadgeLabel(flow)}
        </span>
      )}
    </nav>
  );
}
