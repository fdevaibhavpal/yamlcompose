"use client";

import { X } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";
import { getCategoryStyle } from "@/lib/technology/categories";
import { playClickSound } from "@/lib/audio/sound-effects";

export function ServiceInspector() {
  const project = useComposeStore((s) => s.project);
  const selectedServiceId = useComposeStore((s) => s.selectedServiceId);
  const selectService = useComposeStore((s) => s.selectService);

  const service = project?.services.find((s) => s.id === selectedServiceId);
  if (!service) return null;

  const style = getCategoryStyle(service.category);
  const Icon = style.icon;

  return (
    <div className="absolute inset-y-0 right-0 z-20 w-full max-w-[320px] border-l-2 border-ink bg-panel brutal-shadow-lg overflow-y-auto">
      <div
        className="flex items-start justify-between gap-2 border-b-2 border-ink px-4 py-3"
        style={{ backgroundColor: style.bg }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={18} strokeWidth={2.5} color={style.color} className="shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-mono font-bold tracking-widest" style={{ color: style.color }}>
              {style.label}
            </div>
            <div className="text-lg font-bold leading-tight truncate">{service.name}</div>
          </div>
        </div>
        <button
          onClick={() => {
            playClickSound();
            selectService(null);
          }}
          className="shrink-0 p-1 hover:bg-ink hover:text-paper transition-colors"
          aria-label="Close inspector"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4 text-sm">
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted mb-1">
            Technology
          </div>
          <div className="font-medium">{service.technologyLabel}</div>
        </div>

        {service.image && (
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted mb-1">
              Image
            </div>
            <div className="font-mono text-xs brutal-border bg-paper px-2 py-1 inline-block break-all">
              {service.image}
            </div>
          </div>
        )}

        {service.build && (
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted mb-1">
              Build
            </div>
            <div className="font-mono text-xs brutal-border bg-paper px-2 py-1 inline-block break-all">
              {service.build.context}
              {service.build.dockerfile ? ` (${service.build.dockerfile})` : ""}
            </div>
          </div>
        )}

        {service.ports.length > 0 && (
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted mb-1">
              Ports
            </div>
            <div className="flex flex-col gap-1">
              {service.ports.map((p, i) => (
                <div key={i} className="font-mono text-xs">
                  {p.host ? `${p.host}:${p.container}` : p.container}
                </div>
              ))}
            </div>
          </div>
        )}

        {service.dependsOn.length > 0 && (
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted mb-1">
              Depends on
            </div>
            <div className="flex flex-wrap gap-1.5">
              {service.dependsOn.map((dep) => (
                <span
                  key={dep.service}
                  className="brutal-border bg-paper px-2 py-0.5 text-xs font-mono"
                >
                  {dep.service}
                  {dep.condition ? ` (${dep.condition})` : ""}
                </span>
              ))}
            </div>
          </div>
        )}

        {service.networks.length > 0 && (
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted mb-1">
              Networks
            </div>
            <div className="flex flex-wrap gap-1.5">
              {service.networks.map((net) => (
                <span key={net.network} className="brutal-border bg-paper px-2 py-0.5 text-xs font-mono">
                  {net.network}
                </span>
              ))}
            </div>
          </div>
        )}

        {service.volumes.length > 0 && (
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted mb-1">
              Volumes
            </div>
            <div className="flex flex-col gap-1">
              {service.volumes.map((v, i) => (
                <div key={i} className="brutal-border bg-paper px-2 py-0.5 text-xs font-mono">
                  {v.source}
                  {v.target ? `:${v.target}` : ""}
                  {v.mode ? `:${v.mode}` : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {service.environment.length > 0 && (
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted mb-1">
              Environment
            </div>
            <div className="flex flex-col gap-1">
              {service.environment.map((env) => (
                <div key={env.key} className="font-mono text-xs flex gap-2">
                  <span className="font-semibold">{env.key}</span>
                  {env.value != null && (
                    <span className="text-muted truncate">
                      {env.sensitive ? "••••••••" : env.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {service.warnings.length > 0 && (
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted mb-1">
              Warnings
            </div>
            <div className="flex flex-col gap-1.5">
              {service.warnings.map((w, i) => (
                <div
                  key={i}
                  className="brutal-border bg-[#fdf3e0] px-2 py-1.5 text-xs flex items-start gap-1.5"
                >
                  <span aria-hidden="true">⚠</span>
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
