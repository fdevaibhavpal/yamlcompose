"use client";

import { useComposeStore } from "@/store/compose-store";
import { playToggleOnSound, playToggleOffSound } from "@/lib/audio/sound-effects";

export function SummaryPanelsToggle() {
  const showSummaryPanels = useComposeStore((s) => s.showSummaryPanels);
  const toggleSummaryPanels = useComposeStore((s) => s.toggleSummaryPanels);

  const handleToggle = () => {
    if (showSummaryPanels) {
      playToggleOffSound();
    } else {
      playToggleOnSound();
    }
    toggleSummaryPanels();
  };

  return (
    <div className="hidden items-center gap-2 shrink-0 md:flex">
      <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-muted">
        Summary
      </span>
      <button
        onClick={handleToggle}
        role="switch"
        aria-checked={showSummaryPanels}
        aria-label="Toggle summary panels"
        className="relative h-6 w-11 shrink-0 brutal-border transition-colors duration-200"
        style={{ backgroundColor: showSummaryPanels ? "var(--lime)" : "var(--panel)" }}
      >
        <span
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 border-2 border-ink bg-ink transition-all duration-200 ease-out"
          style={{ left: showSummaryPanels ? "calc(100% - 20px)" : "2px" }}
        />
      </button>
    </div>
  );
}
