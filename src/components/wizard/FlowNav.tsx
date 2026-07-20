"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useResumeStore, type AppFlow } from "@/store/resume-store";

const NAV_ITEMS: {
  id: AppFlow | "home";
  label: string;
  action: (s: ReturnType<typeof useResumeStore.getState>) => void;
}[] = [
  { id: "home", label: "Home", action: (s) => s.goToLanding() },
  { id: "create", label: "Create Resume", action: (s) => s.startCreateFlow() },
  {
    id: "edit-resume",
    label: "Edit Resume",
    action: (s) => s.startEditResumeFlow(),
  },
  { id: "tailor", label: "Tailor Resume", action: (s) => s.startTailorFlow() },
  { id: "ats", label: "ATS Checker", action: (s) => s.startAtsFlow() },
  {
    id: "generate-cv",
    label: "Generate Cover Letter",
    action: (s) => s.startGenerateCvFlow(),
  },
  {
    id: "edit-cover",
    label: "Edit Cover Letter",
    action: (s) => s.startEditCoverFlow(),
  },
];

function flowBadgeLabel(flow: AppFlow): string {
  if (flow === "create") return "Create Resume";
  if (flow === "edit-resume") return "Edit Resume";
  if (flow === "tailor") return "Tailor Resume";
  if (flow === "ats") return "ATS Checker";
  if (flow === "generate-cv") return "Generate Cover Letter";
  if (flow === "edit-cover") return "Edit Cover Letter";
  return "Home";
}

export function FlowBadge() {
  const flow = useResumeStore((s) => s.flow);
  if (flow === "landing") return null;

  return (
    <span className="hidden rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-medium text-primary-foreground sm:inline-block">
      {flowBadgeLabel(flow)}
    </span>
  );
}

export function FlowNav() {
  const store = useResumeStore();
  const { flow } = store;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [flow]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  function isActive(id: (typeof NAV_ITEMS)[number]["id"]) {
    return id === "home" ? flow === "landing" : flow === id;
  }

  function handleNav(item: (typeof NAV_ITEMS)[number]) {
    item.action(store);
    setMenuOpen(false);
  }

  return (
    <nav className="mt-3" aria-label="Main navigation">
      <div className="hidden flex-wrap items-center gap-1 sm:flex">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNav(item)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              isActive(item.id)
                ? "bg-primary-foreground/20 text-primary-foreground ring-1 ring-primary-foreground/30"
                : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:hidden">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-flow-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex size-9 items-center justify-center rounded-md border border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground"
        >
          {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
        <span className="truncate text-xs font-medium text-primary-foreground/90">
          {flow === "landing" ? "Home" : flowBadgeLabel(flow)}
        </span>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Dismiss menu"
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-flow-menu"
            className="absolute left-4 right-4 z-50 mt-2 overflow-hidden rounded-xl border border-border bg-background shadow-lg sm:hidden"
          >
            <ul className="py-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleNav(item)}
                    className={cn(
                      "flex w-full items-center px-4 py-3 text-left text-sm font-medium transition-colors",
                      isActive(item.id)
                        ? "bg-brand-accent/10 text-brand-accent"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </nav>
  );
}
