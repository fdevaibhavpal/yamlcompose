"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type OnReconnect,
  type OnNodeDrag,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useComposeStore } from "@/store/compose-store";
import { ComposeNode } from "./ComposeNode";
import { ComposeEdge } from "./ComposeEdge";
import { NodeToolbar } from "./NodeToolbar";
import { RelationshipInspector } from "./RelationshipInspector";
import { AddNodeMenu, type AddMenuSelection } from "./AddNodeMenu";
import { AddNodeModal } from "./AddNodeModal";
import { AddSimpleResourceModal } from "./AddSimpleResourceModal";
import { Maximize2, Minus, Plus, LocateFixed } from "lucide-react";
import { playNodeSound, playClickSound } from "@/lib/audio/sound-effects";
import type { AddNodeCategory } from "@/lib/compose/presets";

const nodeTypes = { composeNode: ComposeNode };
const edgeTypes = { composeEdge: ComposeEdge };

function GraphInner() {
  const nodes = useComposeStore((s) => s.nodes);
  const edges = useComposeStore((s) => s.edges);
  const selectService = useComposeStore((s) => s.selectService);
  const selectRelationship = useComposeStore((s) => s.selectRelationship);
  const selectedServiceId = useComposeStore((s) => s.selectedServiceId);
  const selectedRelationshipId = useComposeStore((s) => s.selectedRelationshipId);
  const setNodePosition = useComposeStore((s) => s.setNodePosition);
  const retargetRelationshipAction = useComposeStore((s) => s.retargetRelationshipAction);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [zoomPct, setZoomPct] = useState(100);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [addModalCategory, setAddModalCategory] = useState<AddNodeCategory | null>(null);
  const [addSimpleKind, setAddSimpleKind] = useState<"network" | "volume" | null>(null);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      playNodeSound();
      selectService(node.id === selectedServiceId ? null : node.id);
    },
    [selectService, selectedServiceId]
  );

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_, edge) => {
      selectRelationship(edge.id === selectedRelationshipId ? null : edge.id);
    },
    [selectRelationship, selectedRelationshipId]
  );

  const onPaneClick = useCallback(() => {
    selectService(null);
    selectRelationship(null);
  }, [selectService, selectRelationship]);

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_, node) => {
      setNodePosition(node.id, node.position);
    },
    [setNodePosition]
  );

  const onReconnect: OnReconnect = useCallback(
    (oldEdge, newConnection) => {
      if (newConnection.target && newConnection.target !== oldEdge.target) {
        retargetRelationshipAction(oldEdge.id, newConnection.target);
      }
    },
    [retargetRelationshipAction]
  );

  const handleAddMenuSelect = useCallback((selection: AddMenuSelection) => {
    playClickSound();
    if (selection.kind === "node") {
      setAddModalCategory(selection.category);
    } else {
      setAddSimpleKind(selection.kind);
    }
  }, []);

  const styledEdges = useMemo(() => {
    return edges.map((e) => ({
      ...e,
      selected: e.id === selectedRelationshipId,
      style: selectedServiceId
        ? {
            opacity:
              e.source === selectedServiceId || e.target === selectedServiceId ? 1 : 0.2,
          }
        : undefined,
      reconnectable: true,
    }));
  }, [edges, selectedServiceId, selectedRelationshipId]);

  const styledNodes = useMemo(() => {
    if (!selectedServiceId) return nodes;
    const connected = new Set<string>([selectedServiceId]);
    for (const e of edges) {
      if (e.source === selectedServiceId) connected.add(e.target);
      if (e.target === selectedServiceId) connected.add(e.source);
    }
    return nodes.map((n) => ({
      ...n,
      style: { opacity: connected.has(n.id) ? 1 : 0.25 },
    }));
  }, [nodes, edges, selectedServiceId]);

  const selectedNode: Node | undefined = nodes.find((n) => n.id === selectedServiceId);

  const handleFullscreen = useCallback(() => {
    playClickSound();
    wrapperRef.current?.requestFullscreen?.();
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-full w-full bg-panel">
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        onReconnect={onReconnect}
        onMove={(_, viewport) => setZoomPct(Math.round(viewport.zoom * 100))}
        fitView
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#0a0a0a22" />
        <Controls showZoom={false} showFitView={false} showInteractive={false} position="bottom-left" />
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          nodeColor={() => "#d4fb3f"}
          maskColor="rgba(10,10,10,0.08)"
          style={{ width: 100, height: 75 }}
        />
      </ReactFlow>

      <AddNodeMenu onSelect={handleAddMenuSelect} />

      {selectedNode && <NodeToolbar node={selectedNode} />}
      {selectedRelationshipId && <RelationshipInspector />}

      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <div className="flex items-center brutal-border bg-panel brutal-shadow-sm">
          <button
            onClick={() => {
              playClickSound();
              zoomOut();
            }}
            className="p-1.5 hover:bg-lime transition-colors"
            aria-label="Zoom out"
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <span className="px-2 text-xs font-mono font-bold min-w-[44px] text-center border-x-2 border-ink">
            {zoomPct}%
          </span>
          <button
            onClick={() => {
              playClickSound();
              zoomIn();
            }}
            className="p-1.5 hover:bg-lime transition-colors"
            aria-label="Zoom in"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
        <button
          onClick={() => {
            playClickSound();
            fitView({ duration: 300 });
          }}
          className="p-2 brutal-border bg-panel brutal-shadow-sm hover:bg-lime transition-colors"
          aria-label="Fit view"
          title="Fit view (F)"
        >
          <LocateFixed size={14} strokeWidth={2.5} />
        </button>
        <button
          onClick={handleFullscreen}
          className="p-2 brutal-border bg-panel brutal-shadow-sm hover:bg-lime transition-colors"
          aria-label="Fullscreen"
        >
          <Maximize2 size={14} strokeWidth={2.5} />
        </button>
      </div>

      {addModalCategory && (
        <AddNodeModal
          initialCategory={addModalCategory}
          onClose={() => setAddModalCategory(null)}
        />
      )}
      {addSimpleKind && (
        <AddSimpleResourceModal kind={addSimpleKind} onClose={() => setAddSimpleKind(null)} />
      )}
    </div>
  );
}

export function ComposeGraph() {
  return (
    <ReactFlowProvider>
      <GraphInner />
    </ReactFlowProvider>
  );
}
