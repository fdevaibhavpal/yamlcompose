"use client";

import { X, Unlink } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";
import type { RelationshipType } from "@/types/compose";
import { BrutalSelect } from "@/components/ui/BrutalSelect";
import { playClickSound, playDeleteSound } from "@/lib/audio/sound-effects";

const TYPE_OPTIONS: Array<{ id: RelationshipType; label: string }> = [
  { id: "dependency", label: "depends_on" },
  { id: "network", label: "network" },
];

function relationshipYamlPreview(
  type: RelationshipType,
  target: string,
  network?: string
): string {
  if (type === "dependency") {
    return `depends_on:\n  - ${target}`;
  }
  if (type === "network") {
    return `networks:\n  - ${network ?? "shared-network"}`;
  }
  return "";
}

export function RelationshipInspector() {
  const project = useComposeStore((s) => s.project);
  const selectedRelationshipId = useComposeStore((s) => s.selectedRelationshipId);
  const selectRelationship = useComposeStore((s) => s.selectRelationship);
  const changeRelationshipTypeAction = useComposeStore((s) => s.changeRelationshipTypeAction);
  const detachRelationshipAction = useComposeStore((s) => s.detachRelationshipAction);

  const rel = project?.relationships.find((r) => r.id === selectedRelationshipId);
  if (!rel) return null;

  return (
    <div className="absolute bottom-4 left-1/2 z-20 w-full max-w-xs -translate-x-1/2 brutal-border bg-panel brutal-shadow-lg">
      <div className="flex items-center justify-between border-b-2 border-ink px-3 py-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wide">
          Relationship
        </span>
        <button
          onClick={() => {
            playClickSound();
            selectRelationship(null);
          }}
          className="p-0.5 hover:bg-ink hover:text-paper transition-colors"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
          {rel.source}
          <span aria-hidden="true">→</span>
          {rel.target}
        </div>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          Type
          <BrutalSelect
            value={rel.type}
            onChange={(v) =>
              changeRelationshipTypeAction(selectedRelationshipId!, v as RelationshipType)
            }
            options={TYPE_OPTIONS.map((opt) => ({ value: opt.id, label: opt.label }))}
          />
        </label>

        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wide text-muted mb-1">
            YAML
          </div>
          <pre className="brutal-border bg-[#0a0a0a] text-[#d4fb3f] px-2 py-1.5 font-mono text-[11px] whitespace-pre-wrap">
            {relationshipYamlPreview(rel.type, rel.target, rel.network)}
          </pre>
        </div>

        <button
          onClick={() => {
            playDeleteSound();
            detachRelationshipAction(selectedRelationshipId!);
          }}
          className="flex items-center justify-center gap-1.5 brutal-border bg-[#fde8eb] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#e0344c] hover:bg-[#e0344c] hover:text-paper transition-colors"
        >
          <Unlink size={14} strokeWidth={2.5} />
          Detach
        </button>
      </div>
    </div>
  );
}
