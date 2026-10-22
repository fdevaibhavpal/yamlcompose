"use client";

import { Database, ChevronRight } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";

export function VolumePanel() {
  const project = useComposeStore((s) => s.project);
  const volumes = project?.volumes ?? [];

  return (
    <div className="brutal-border bg-panel flex flex-col min-h-0">
      <div className="border-b-2 border-ink px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wide">
        Volumes ({volumes.length})
      </div>
      <div className="flex-1 overflow-y-auto">
        {volumes.length === 0 && (
          <div className="px-2.5 py-3 text-[11px] text-muted">No volumes defined.</div>
        )}
        {volumes.map((vol) => (
          <div
            key={vol.id}
            className="flex items-center gap-2 border-b border-ink/15 px-2.5 py-1.5"
          >
            <Database size={13} strokeWidth={2.5} className="shrink-0 text-[var(--cat-storage)]" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold truncate">{vol.name}</div>
              <div className="text-[10px] text-muted truncate">
                {vol.usedBy.length > 0 ? `Used by ${vol.usedBy.join(", ")}` : "Unused"}
              </div>
            </div>
            <ChevronRight size={12} strokeWidth={2.5} className="shrink-0 text-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
