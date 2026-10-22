"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";
import {
  playModalOpenSound,
  playModalCloseSound,
  playDeleteSound,
  playClickSound,
} from "@/lib/audio/sound-effects";

export function DeleteServiceDialog({
  serviceId,
  onClose,
}: {
  serviceId: string;
  onClose: () => void;
}) {
  const project = useComposeStore((s) => s.project);
  const deleteServiceAction = useComposeStore((s) => s.deleteServiceAction);
  const [confirmedOrphans, setConfirmedOrphans] = useState<"keep" | "remove" | null>(null);

  const service = project?.services.find((s) => s.id === serviceId);

  const dependents = useMemo(
    () =>
      (project?.services ?? []).filter((s) =>
        s.dependsOn.some((d) => d.service === serviceId)
      ),
    [project, serviceId]
  );

  const wouldOrphanVolumes = useMemo(() => {
    if (!project) return [];
    const namedVolumeNames = service?.volumes.filter((v) => v.isNamedVolume).map((v) => v.source) ?? [];
    return project.volumes.filter(
      (v) =>
        namedVolumeNames.includes(v.name) &&
        v.usedBy.length === 1 &&
        v.usedBy[0] === serviceId
    );
  }, [project, service, serviceId]);

  // Declared before the early return so hook order stays stable.
  useEffect(() => {
    playModalOpenSound();
  }, []);

  if (!service) return null;

  const handleClose = () => {
    playModalCloseSound();
    onClose();
  };

  const handleConfirm = () => {
    playDeleteSound();
    deleteServiceAction(serviceId, confirmedOrphans === "remove");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 px-4">
      <div className="w-full max-w-sm brutal-border bg-panel brutal-shadow-lg">
        <div className="flex items-center gap-2 border-b-2 border-ink bg-[#fde8eb] px-4 py-3">
          <AlertTriangle size={18} strokeWidth={2.5} className="text-[#e0344c]" />
          <h2 className="text-sm font-bold uppercase tracking-wide">Delete Service?</h2>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="font-mono text-base font-bold">{service.name}</div>

          <div className="text-xs text-muted">
            This will also remove:
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              <li>{service.dependsOn.length} outgoing relationship(s)</li>
              <li>references from {dependents.length} dependent service(s)</li>
            </ul>
          </div>

          {wouldOrphanVolumes.length > 0 && (
            <div className="brutal-border bg-[#fdf3e0] p-3">
              <div className="flex items-start gap-2 text-xs">
                <AlertTriangle size={14} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[#c75a00]" />
                <div>
                  {wouldOrphanVolumes.map((v) => (
                    <div key={v.name} className="font-mono font-semibold">
                      {v.name} will become unused.
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    playClickSound();
                    setConfirmedOrphans("keep");
                  }}
                  className={`flex-1 brutal-border px-2 py-1 text-[11px] font-bold uppercase transition-colors ${
                    confirmedOrphans === "keep" ? "bg-lime" : "bg-paper hover:bg-[#eceae2]"
                  }`}
                >
                  Keep
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setConfirmedOrphans("remove");
                  }}
                  className={`flex-1 brutal-border px-2 py-1 text-[11px] font-bold uppercase transition-colors ${
                    confirmedOrphans === "remove" ? "bg-[#e0344c] text-paper" : "bg-paper hover:bg-[#eceae2]"
                  }`}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t-2 border-ink px-4 py-3">
          <button
            onClick={handleClose}
            className="brutal-border bg-panel px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-[#eceae2] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 brutal-border bg-[#e0344c] px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper brutal-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
          >
            <Trash2 size={14} strokeWidth={3} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
