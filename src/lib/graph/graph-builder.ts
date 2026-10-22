import type { Edge, Node } from "@xyflow/react";
import type { ComposeProject } from "@/types/compose";
import { layoutGraph } from "./layout";

export interface BuildGraphResult {
  nodes: Node[];
  edges: Edge[];
}

export type NodePositions = Record<string, { x: number; y: number }>;

/**
 * Builds React Flow nodes/edges from the Compose model.
 *
 * `knownPositions` lets callers preserve manual layout across re-renders —
 * only services missing a known position get auto-laid-out by dagre, and the
 * result is merged back in so one new node doesn't reshuffle the whole graph.
 */
export function buildGraph(
  project: ComposeProject,
  knownPositions: NodePositions = {}
): BuildGraphResult {
  const nodes: Node[] = project.services.map((service) => {
    const known = knownPositions[service.id];
    return {
      id: service.id,
      type: "composeNode",
      data: { service },
      position: known ?? { x: 0, y: 0 },
      width: 240,
      height: 132,
    };
  });

  const edges: Edge[] = project.relationships
    .filter((rel) => rel.type === "dependency" || rel.type === "network")
    .map((rel) => ({
      id: rel.id,
      source: rel.source,
      target: rel.target,
      type: "composeEdge",
      data: { relationship: rel },
      markerEnd:
        rel.type === "dependency"
          ? {
              type: "arrowclosed" as const,
              width: 18,
              height: 18,
              color: "#0a0a0a",
            }
          : undefined,
    }));

  const nodesNeedingLayout = nodes.filter((n) => !knownPositions[n.id]);

  if (nodesNeedingLayout.length === 0) {
    return { nodes, edges };
  }

  if (nodesNeedingLayout.length === nodes.length) {
    // Nothing has a known position yet (first load) — lay out everything.
    return { nodes: layoutGraph(nodes, edges, "TB"), edges };
  }

  // Mixed case: lay out only the new nodes, using the full edge set so they
  // land near their connections, then keep existing nodes exactly where they were.
  const laidOutAll = layoutGraph(nodes, edges, "TB");
  const laidOutById = new Map(laidOutAll.map((n) => [n.id, n]));
  const merged = nodes.map((n) =>
    knownPositions[n.id] ? n : (laidOutById.get(n.id) ?? n)
  );

  return { nodes: merged, edges };
}
