"use client";

import { Box, Network, Database, Link2, DoorOpen } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";

export function ConfigSummary() {
  const project = useComposeStore((s) => s.project);

  const servicesCount = project?.services.length ?? 0;
  const networksCount = project?.networks.length ?? 0;
  const volumesCount = project?.volumes.length ?? 0;
  const dependenciesCount = project?.relationships.length ?? 0;
  const portsCount =
    project?.services.reduce((acc, s) => acc + s.ports.filter((p) => p.host).length, 0) ?? 0;

  const rows = [
    { icon: Box, label: "services", value: servicesCount },
    { icon: Network, label: "network" + (networksCount === 1 ? "" : "s"), value: networksCount },
    { icon: Database, label: "volume" + (volumesCount === 1 ? "" : "s"), value: volumesCount },
    { icon: Link2, label: "dependencies", value: dependenciesCount },
    { icon: DoorOpen, label: "exposed ports", value: portsCount },
  ];

  return (
    <div className="brutal-border bg-panel flex flex-col min-h-0">
      <div className="border-b-2 border-ink px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wide">
        Config Summary
      </div>
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <row.icon size={13} strokeWidth={2.5} className="shrink-0" />
            <span className="text-xs">
              <span className="font-bold">{row.value}</span>{" "}
              <span className="text-muted">{row.label}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
