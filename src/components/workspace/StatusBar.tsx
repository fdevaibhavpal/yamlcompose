"use client";

import { Undo2, Redo2 } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";

const STATUS_LABEL: Record<string, string> = {
  synced: "SYNCED",
  updating: "UPDATING",
  "yaml-error": "YAML ERROR",
  "sync-error": "SYNC ERROR",
};

const STATUS_COLOR: Record<string, string> = {
  synced: "#1f9254",
  updating: "#e0a632",
  "yaml-error": "#e0344c",
  "sync-error": "#e0344c",
};

export function StatusBar() {
  const project = useComposeStore((s) => s.project);
  const syncStatus = useComposeStore((s) => s.syncStatus);
  const undo = useComposeStore((s) => s.undo);
  const redo = useComposeStore((s) => s.redo);
  const canUndo = useComposeStore((s) => s.canUndo());
  const canRedo = useComposeStore((s) => s.canRedo());

  const serviceCount = project?.services.length ?? 0;
  const networkCount = project?.networks.length ?? 0;
  const volumeCount = project?.volumes.length ?? 0;
  const relationshipCount = project?.relationships.length ?? 0;

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t-2 border-ink bg-ink px-3 py-1.5 text-paper">
      <div className="flex items-center gap-3 overflow-x-auto font-mono text-[10px] font-bold uppercase tracking-wide">
        <span>{serviceCount} services</span>
        <span className="opacity-40">|</span>
        <span>{networkCount} networks</span>
        <span className="opacity-40">|</span>
        <span>{volumeCount} volumes</span>
        <span className="opacity-40">|</span>
        <span>{relationshipCount} edges</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1 hover:bg-paper/20 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Undo"
            title="Undo (⌘Z)"
          >
            <Undo2 size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1 hover:bg-paper/20 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Redo"
            title="Redo (⌘⇧Z)"
          >
            <Redo2 size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wide">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: STATUS_COLOR[syncStatus] }}
          />
          {STATUS_LABEL[syncStatus]}
        </div>
      </div>
    </div>
  );
}
