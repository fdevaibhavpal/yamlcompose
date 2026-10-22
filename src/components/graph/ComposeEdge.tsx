"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import type { ComposeRelationship } from "@/types/compose";

function ComposeEdgeImpl({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}: EdgeProps) {
  const relationship = data?.relationship as ComposeRelationship | undefined;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 4,
  });

  const isDashed = relationship?.type === "network";

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: isDashed ? "6 4" : undefined,
        }}
      />
      {relationship?.label && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute font-mono text-[10px] font-bold uppercase brutal-border bg-panel px-1.5 py-0.5"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {relationship.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const ComposeEdge = memo(ComposeEdgeImpl);
