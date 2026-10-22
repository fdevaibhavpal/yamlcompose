"use client";

import { ChevronRight } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";
import { getCategoryStyle } from "@/lib/technology/categories";
import { playNodeSound } from "@/lib/audio/sound-effects";

export function ServicePanel() {
  const project = useComposeStore((s) => s.project);
  const selectService = useComposeStore((s) => s.selectService);
  const setActiveTab = useComposeStore((s) => s.setActiveTab);
  const services = project?.services ?? [];

  const focusService = (id: string) => {
    playNodeSound();
    selectService(id);
    setActiveTab("architecture");
  };

  return (
    <div className="brutal-border bg-panel flex flex-col min-h-0">
      <div className="border-b-2 border-ink px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wide">
        Services ({services.length})
      </div>
      <div className="flex-1 overflow-y-auto">
        {services.map((service) => {
          const style = getCategoryStyle(service.category);
          const portLabel = service.ports[0]
            ? `:${service.ports[0].host ?? service.ports[0].container}`
            : "—";
          return (
            <button
              key={service.id}
              onClick={() => focusService(service.id)}
              className="flex w-full items-center gap-1.5 border-b border-ink/15 px-2.5 py-1 text-left hover:bg-[#eceae2] transition-colors"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: style.color }}
              />
              <span className="flex-1 min-w-0 truncate text-xs font-semibold">
                {service.name}
              </span>
              <span className="hidden shrink-0 font-mono text-[10px] text-muted sm:block">
                {portLabel}
              </span>
              <ChevronRight size={12} strokeWidth={2.5} className="shrink-0 text-muted" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
