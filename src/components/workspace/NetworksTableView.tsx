"use client";

import { Network } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";

export function NetworksTableView() {
  const project = useComposeStore((s) => s.project);
  const networks = project?.networks ?? [];

  return (
    <div className="h-full w-full overflow-auto p-4">
      <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {networks.map((net) => (
          <div key={net.id} className="brutal-border bg-panel brutal-shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Network size={18} strokeWidth={2.5} className="text-[var(--cat-service)]" />
              <span className="font-bold">{net.name}</span>
            </div>
            <div className="text-xs font-mono text-muted mb-1">
              {net.driver}
              {net.external ? " · external" : ""}
            </div>
            <div className="text-xs text-muted">Used by {net.usedBy.length} services</div>
            {net.usedBy.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {net.usedBy.map((s) => (
                  <span key={s} className="brutal-border bg-paper px-2 py-0.5 text-xs font-mono">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {networks.length === 0 && (
          <div className="text-sm text-muted">No networks defined.</div>
        )}
      </div>
    </div>
  );
}
