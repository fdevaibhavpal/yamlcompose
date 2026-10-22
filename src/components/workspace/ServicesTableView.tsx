"use client";

import { useComposeStore } from "@/store/compose-store";
import { getCategoryStyle } from "@/lib/technology/categories";
import { getBrandIcon } from "@/lib/technology/brand-icons";

export function ServicesTableView() {
  const project = useComposeStore((s) => s.project);
  const services = project?.services ?? [];

  return (
    <div className="h-full w-full overflow-auto p-4">
      <div className="min-w-[640px] brutal-border bg-panel">
        <div className="grid grid-cols-[32px_1fr_1fr_1fr_100px] gap-2 border-b-2 border-ink bg-[#eceae2] px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wide">
          <span />
          <span>Name</span>
          <span>Image</span>
          <span>Category</span>
          <span>Ports</span>
        </div>
        {services.map((service) => {
          const style = getCategoryStyle(service.category);
          const brand = getBrandIcon(service.technology);
          const Icon = style.icon;
          return (
            <div
              key={service.id}
              className="grid grid-cols-[32px_1fr_1fr_1fr_100px] items-center gap-2 border-b border-ink/15 px-3 py-2.5 text-sm last:border-b-0"
            >
              <span className="h-2 w-2 rounded-full bg-[#1f9254] justify-self-center status-dot" />
              <span className="font-semibold truncate">{service.name}</span>
              <span className="font-mono text-xs text-muted truncate">
                {service.image ?? service.build?.context ?? "—"}
              </span>
              <span className="flex items-center gap-1.5">
                {brand ? (
                  <svg viewBox="0 0 24 24" width={14} height={14} fill={style.color}>
                    <path d={brand.path} />
                  </svg>
                ) : (
                  <Icon size={14} color={style.color} strokeWidth={2.5} />
                )}
                <span className="text-xs font-mono">{style.label}</span>
              </span>
              <span className="font-mono text-xs">
                {service.ports.length > 0
                  ? service.ports.map((p) => `:${p.host ?? p.container}`).join(", ")
                  : "—"}
              </span>
            </div>
          );
        })}
        {services.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-muted">No services found.</div>
        )}
      </div>
    </div>
  );
}
