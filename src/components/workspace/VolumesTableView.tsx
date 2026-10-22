"use client";

import { Database } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";

export function VolumesTableView() {
  const project = useComposeStore((s) => s.project);
  const volumes = project?.volumes ?? [];

  return (
    <div className="h-full w-full overflow-auto p-4">
      <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {volumes.map((vol) => (
          <div key={vol.id} className="brutal-border bg-panel brutal-shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database size={18} strokeWidth={2.5} className="text-[var(--cat-storage)]" />
              <span className="font-bold">{vol.name}</span>
            </div>
            <div className="text-xs text-muted">
              {vol.usedBy.length > 0 ? `Used by ${vol.usedBy.join(", ")}` : "Unused"}
            </div>
          </div>
        ))}
        {volumes.length === 0 && (
          <div className="text-sm text-muted">No volumes defined.</div>
        )}
      </div>
    </div>
  );
}
