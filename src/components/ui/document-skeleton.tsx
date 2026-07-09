"use client";

import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

interface DocumentSkeletonProps {
  variant?: "resume" | "cover";
  className?: string;
}

export function DocumentSkeleton({
  variant = "resume",
  className,
}: DocumentSkeletonProps) {
  if (variant === "cover") {
    return (
      <div className={cn("space-y-3 rounded-lg border bg-card p-6", className)}>
        <Bone className="h-4 w-1/3" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-5/6" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-4/5" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-5 rounded-lg border bg-card p-6", className)}>
      <div className="space-y-2 border-b pb-4">
        <Bone className="mx-auto h-6 w-48" />
        <Bone className="mx-auto h-3 w-64" />
        <Bone className="mx-auto h-3 w-56" />
      </div>
      <div className="space-y-2">
        <Bone className="h-4 w-32" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-[92%]" />
      </div>
      <div className="space-y-3">
        <Bone className="h-4 w-40" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-[88%]" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-9/12" />
      </div>
      <div className="space-y-2">
        <Bone className="h-4 w-24" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Bone key={i} className="h-6 w-16" />
          ))}
        </div>
      </div>
    </div>
  );
}
