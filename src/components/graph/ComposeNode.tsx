"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ComposeService } from "@/types/compose";
import { getCategoryStyle } from "@/lib/technology/categories";
import { getBrandIcon } from "@/lib/technology/brand-icons";
import { useComposeStore } from "@/store/compose-store";

function BrandOrCategoryIcon({ service }: { service: ComposeService }) {
  const brand = getBrandIcon(service.technology);
  const style = getCategoryStyle(service.category);

  if (brand) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={16}
        height={16}
        fill={style.color}
        aria-hidden="true"
      >
        <path d={brand.path} />
      </svg>
    );
  }

  const Icon = style.icon;
  return <Icon size={16} color={style.color} strokeWidth={2.5} aria-hidden="true" />;
}

function ComposeNodeImpl({ id, data, selected }: NodeProps) {
  const service = data.service as ComposeService;
  const style = getCategoryStyle(service.category);
  const selectedServiceId = useComposeStore((s) => s.selectedServiceId);
  const searchQuery = useComposeStore((s) => s.searchQuery);

  const isHighlightedBySearch =
    searchQuery.trim().length > 0 &&
    service.name.toLowerCase().includes(searchQuery.toLowerCase());
  const isDimmedBySearch = searchQuery.trim().length > 0 && !isHighlightedBySearch;
  const isSelected = selectedServiceId === id || selected;

  const portLabel =
    service.ports.length > 0
      ? service.ports
          .slice(0, 2)
          .map((p) => (p.host ? `:${p.host}` : `:${p.container}`))
          .join(", ")
      : null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${service.name} service, ${style.label.toLowerCase()}, ${service.technologyLabel}`}
      className="brutal-border w-[240px] cursor-pointer select-none transition-all"
      style={{
        backgroundColor: style.bg,
        boxShadow: isSelected ? "6px 6px 0 0 var(--ink)" : "4px 4px 0 0 var(--ink)",
        opacity: isDimmedBySearch ? 0.3 : 1,
        transform: isSelected ? "translate(-2px, -2px)" : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center justify-between px-3 pt-2.5">
        <div className="flex items-center gap-1.5">
          <BrandOrCategoryIcon service={service} />
          <span
            className="text-[10px] font-bold tracking-widest font-mono"
            style={{ color: style.color }}
          >
            {style.label}
          </span>
        </div>
        <span
          className="status-dot h-2 w-2 rounded-full bg-[#1f9254]"
          aria-label="running"
        />
      </div>

      <div className="px-3 pt-1.5 pb-3">
        <div className="text-[17px] font-bold leading-tight truncate">{service.name}</div>
        <div className="text-[12px] text-muted font-mono mt-0.5 truncate">
          {service.image ?? (service.build ? `build: ${service.build.context}` : "—")}
        </div>
        {portLabel && (
          <div className="text-[12px] font-mono mt-1 font-medium">{portLabel}</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export const ComposeNode = memo(ComposeNodeImpl);
