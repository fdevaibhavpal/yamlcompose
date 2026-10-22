"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { RelationshipType } from "@/types/compose";
import { BrutalSelect } from "@/components/ui/BrutalSelect";
import {
  playModalOpenSound,
  playModalCloseSound,
  playSuccessSound,
  playErrorSound,
} from "@/lib/audio/sound-effects";

const CONNECTION_TYPES: Array<{ id: RelationshipType; label: string }> = [
  { id: "dependency", label: "depends_on" },
  { id: "network", label: "network" },
];

export function ConnectPicker({
  sourceId,
  onClose,
}: {
  sourceId: string;
  onClose: () => void;
}) {
  const project = useComposeStore((s) => s.project);
  const connectServicesAction = useComposeStore((s) => s.connectServicesAction);
  const mutationError = useComposeStore((s) => s.mutationError);
  const [type, setType] = useState<RelationshipType>("dependency");
  const ref = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    playModalCloseSound();
    onClose();
  };

  useClickOutside(ref, handleClose);

  useEffect(() => {
    playModalOpenSound();
  }, []);

  const source = project?.services.find((s) => s.id === sourceId);
  const candidates = (project?.services ?? []).filter((s) => s.id !== sourceId);
  const alreadyConnected = new Set(source?.dependsOn.map((d) => d.service) ?? []);

  const handlePick = (targetId: string) => {
    const ok = connectServicesAction({ sourceId, targetId, type });
    if (ok) {
      playSuccessSound();
      onClose();
    } else {
      playErrorSound();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/20 px-4">
      <div ref={ref} className="w-full max-w-xs brutal-border bg-panel brutal-shadow-lg">
        <div className="flex items-center justify-between border-b-2 border-ink px-3 py-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wide">
            Connect {sourceId} to:
          </span>
          <button onClick={handleClose} className="p-0.5 hover:bg-ink hover:text-paper transition-colors">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="max-h-56 overflow-y-auto">
          {candidates.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted text-center">
              No other services to connect to.
            </div>
          )}
          {candidates.map((svc) => (
            <button
              key={svc.id}
              onClick={() => handlePick(svc.id)}
              className="flex w-full items-center justify-between border-b border-ink/15 px-3 py-2 text-left text-sm font-medium last:border-b-0 hover:bg-lime transition-colors"
            >
              {svc.name}
              {type === "dependency" && alreadyConnected.has(svc.id) && (
                <span className="text-[10px] font-mono text-muted">already connected</span>
              )}
            </button>
          ))}
        </div>

        <div className="border-t-2 border-ink p-3">
          <label className="flex flex-col gap-1 text-xs font-semibold">
            Connection type
            <BrutalSelect
              value={type}
              onChange={(v) => setType(v as RelationshipType)}
              options={CONNECTION_TYPES.map((c) => ({ value: c.id, label: c.label }))}
            />
          </label>
          {mutationError && (
            <div className="mt-2 text-[11px] font-mono text-[#e0344c]">{mutationError}</div>
          )}
        </div>
      </div>
    </div>
  );
}
