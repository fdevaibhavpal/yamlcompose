"use client";

import { Network, ChevronRight } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";

export function NetworkPanel() {
  const project = useComposeStore((s) => s.project);
  const networks = project?.networks ?? [];

  return (
    <div className="brutal-border bg-panel flex flex-col min-h-0">
      <div className="border-b-2 border-ink px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wide">
        Networks ({networks.length})
      </div>
      <div className="flex-1 overflow-y-auto">
        {networks.length === 0 && (
          <div className="px-2.5 py-3 text-[11px] text-muted">No networks defined.</div>
        )}
        {networks.map((net) => (
          <div
            key={net.id}
            className="flex items-center gap-2 border-b border-ink/15 px-2.5 py-1.5"
          >
            <Network size={13} strokeWidth={2.5} className="shrink-0 text-[var(--cat-service)]" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold truncate">{net.name}</div>
              <div className="text-[10px] font-mono text-muted">
                {net.driver}
                {net.external ? " · external" : ""}
              </div>
              <div className="text-[10px] text-muted">Used by {net.usedBy.length} services</div>
            </div>
            <ChevronRight size={12} strokeWidth={2.5} className="shrink-0 text-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
