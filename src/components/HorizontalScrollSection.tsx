import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HorizontalScrollSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function HorizontalScrollSection({
  title,
  icon,
  children,
  className,
}: HorizontalScrollSectionProps) {
  return (
    <section className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12", className)}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h2 className="font-display text-xl sm:text-2xl font-bold">{title}</h2>
      </div>
      {/* Scrollable row */}
      <div
        className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>
    </section>
  );
}
