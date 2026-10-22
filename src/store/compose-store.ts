import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Edge, Node } from "@xyflow/react";
import type { ComposeProject, ParseError, RelationshipType } from "@/types/compose";
import { parseComposeFile } from "@/lib/parser/compose-parser";
import { buildGraph, type NodePositions } from "@/lib/graph/graph-builder";
import { serializeComposeProject } from "@/lib/compose/serializer";
import { ComposeHistory } from "@/lib/compose/history";
import {
  ComposeMutationError,
  addService,
  addNetwork,
  addVolume,
  connectServices,
  deleteService,
  detachRelationship,
  duplicateService,
  renameService,
  changeRelationshipType,
  retargetRelationship,
  type NewServiceInput,
  type ConnectServicesInput,
} from "@/lib/compose/mutations";
import { DEFAULT_EDITOR_THEME_ID } from "@/lib/editor/editor-themes";

export type ViewTab = "architecture" | "services" | "networks" | "volumes" | "yaml";
export type SyncStatus = "synced" | "updating" | "yaml-error" | "sync-error";

interface ComposeState {
  yamlText: string;
  project: ComposeProject | null;
  error: ParseError | null;
  visualized: boolean;
  activeTab: ViewTab;
  nodes: Node[];
  edges: Edge[];
  nodePositions: NodePositions;
  selectedServiceId: string | null;
  selectedRelationshipId: string | null;
  searchQuery: string;
  editorThemeId: string;
  successCount: number;
  showSummaryPanels: boolean;
  syncStatus: SyncStatus;
  mutationError: string | null;
  lastAction: string | null;

  history: ComposeHistory | null;

  setYamlText: (text: string) => void;
  visualize: () => void;
  clear: () => void;
  setActiveTab: (tab: ViewTab) => void;
  selectService: (id: string | null) => void;
  selectRelationship: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setNodes: (nodes: Node[]) => void;
  setNodePosition: (id: string, position: { x: number; y: number }) => void;
  setEditorThemeId: (id: string) => void;
  toggleSummaryPanels: () => void;

  // Mutation-layer actions — each applies a pure mutation, records history,
  // rebuilds the graph preserving layout, and regenerates YAML.
  addServiceAction: (input: NewServiceInput) => boolean;
  deleteServiceAction: (serviceId: string, removeOrphanedVolumes?: boolean) => void;
  renameServiceAction: (serviceId: string, newName: string) => boolean;
  duplicateServiceAction: (serviceId: string) => void;
  connectServicesAction: (input: ConnectServicesInput) => boolean;
  detachRelationshipAction: (relationshipId: string) => void;
  changeRelationshipTypeAction: (
    relationshipId: string,
    newType: RelationshipType,
    options?: { networkName?: string }
  ) => void;
  retargetRelationshipAction: (relationshipId: string, newTargetId: string) => void;
  addNetworkAction: (name: string) => boolean;
  addVolumeAction: (name: string) => boolean;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

/** Applies a project-producing mutation, syncing graph + YAML + history together. */
function applyProjectMutation(
  get: () => ComposeState,
  set: (
    partial:
      | Partial<ComposeState>
      | ((state: ComposeState) => Partial<ComposeState>)
  ) => void,
  label: string,
  mutate: (project: ComposeProject) => ComposeProject
): boolean {
  const state = get();
  if (!state.project) return false;

  set({ syncStatus: "updating" });

  try {
    const nextProject = mutate(state.project);
    const nextYaml = serializeComposeProject(nextProject);
    const { nodes, edges } = buildGraph(nextProject, state.nodePositions);

    state.history?.push(nextProject, label);

    set({
      project: nextProject,
      yamlText: nextYaml,
      nodes,
      edges,
      syncStatus: "synced",
      mutationError: null,
      lastAction: label,
    });
    return true;
  } catch (err) {
    const message = err instanceof ComposeMutationError ? err.message : "Mutation failed.";
    set({ syncStatus: "sync-error", mutationError: message });
    return false;
  }
}

export const useComposeStore = create<ComposeState>()(
  persist(
    (set, get) => ({
      yamlText: "",
      project: null,
      error: null,
      visualized: false,
      activeTab: "architecture",
      nodes: [],
      edges: [],
      nodePositions: {},
      selectedServiceId: null,
      selectedRelationshipId: null,
      searchQuery: "",
      editorThemeId: DEFAULT_EDITOR_THEME_ID,
      successCount: 0,
      showSummaryPanels: true,
      syncStatus: "synced",
      mutationError: null,
      lastAction: null,
      history: null,

      setYamlText: (text) => set({ yamlText: text }),

      visualize: () => {
        const { yamlText, nodePositions } = get();
        const result = parseComposeFile(yamlText);

        if (!result.success || !result.project) {
          set({
            error: result.error ?? { message: "Unknown parse error" },
            visualized: false,
            syncStatus: "yaml-error",
          });
          return;
        }

        const { nodes, edges } = buildGraph(result.project, nodePositions);

        set((state) => ({
          project: result.project,
          error: null,
          visualized: true,
          nodes,
          edges,
          activeTab: "architecture",
          selectedServiceId: null,
          selectedRelationshipId: null,
          successCount: state.successCount + 1,
          syncStatus: "synced",
          mutationError: null,
          history: new ComposeHistory(result.project!),
        }));
      },

      clear: () =>
        set({
          yamlText: "",
          project: null,
          error: null,
          visualized: false,
          nodes: [],
          edges: [],
          nodePositions: {},
          selectedServiceId: null,
          selectedRelationshipId: null,
          syncStatus: "synced",
          mutationError: null,
          history: null,
        }),

      setActiveTab: (tab) => set({ activeTab: tab }),
      selectService: (id) => set({ selectedServiceId: id, selectedRelationshipId: null }),
      selectRelationship: (id) => set({ selectedRelationshipId: id, selectedServiceId: null }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setNodes: (nodes) => set({ nodes }),

      setNodePosition: (id, position) =>
        set((state) => ({
          nodePositions: { ...state.nodePositions, [id]: position },
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
        })),

      setEditorThemeId: (id) => set({ editorThemeId: id }),
      toggleSummaryPanels: () =>
        set((state) => ({ showSummaryPanels: !state.showSummaryPanels })),

      addServiceAction: (input) =>
        applyProjectMutation(get, set, `Add ${input.name}`, (project) =>
          addService(project, input)
        ),

      deleteServiceAction: (serviceId, removeOrphanedVolumes) => {
        applyProjectMutation(get, set, `Delete ${serviceId}`, (project) =>
          deleteService(project, serviceId, { removeOrphanedVolumes })
        );
        if (get().selectedServiceId === serviceId) {
          set({ selectedServiceId: null });
        }
      },

      renameServiceAction: (serviceId, newName) =>
        applyProjectMutation(get, set, `Rename ${serviceId} to ${newName}`, (project) =>
          renameService(project, serviceId, newName)
        ),

      duplicateServiceAction: (serviceId) =>
        applyProjectMutation(get, set, `Duplicate ${serviceId}`, (project) =>
          duplicateService(project, serviceId)
        ),

      connectServicesAction: (input) =>
        applyProjectMutation(
          get,
          set,
          `Connect ${input.sourceId} -> ${input.targetId}`,
          (project) => connectServices(project, input)
        ),

      detachRelationshipAction: (relationshipId) => {
        applyProjectMutation(get, set, "Detach relationship", (project) =>
          detachRelationship(project, relationshipId)
        );
        if (get().selectedRelationshipId === relationshipId) {
          set({ selectedRelationshipId: null });
        }
      },

      changeRelationshipTypeAction: (relationshipId, newType, options) =>
        applyProjectMutation(get, set, `Change relationship to ${newType}`, (project) =>
          changeRelationshipType(project, relationshipId, newType, options)
        ),

      retargetRelationshipAction: (relationshipId, newTargetId) =>
        applyProjectMutation(get, set, "Retarget relationship", (project) =>
          retargetRelationship(project, relationshipId, newTargetId)
        ),

      addNetworkAction: (name) =>
        applyProjectMutation(get, set, `Add network ${name}`, (project) =>
          addNetwork(project, name)
        ),

      addVolumeAction: (name) =>
        applyProjectMutation(get, set, `Add volume ${name}`, (project) =>
          addVolume(project, name)
        ),

      undo: () => {
        const { history, nodePositions } = get();
        const project = history?.undo();
        if (!project) return;
        const yaml = serializeComposeProject(project);
        const { nodes, edges } = buildGraph(project, nodePositions);
        set({
          project,
          yamlText: yaml,
          nodes,
          edges,
          syncStatus: "synced",
          mutationError: null,
          selectedServiceId: null,
          selectedRelationshipId: null,
        });
      },

      redo: () => {
        const { history, nodePositions } = get();
        const project = history?.redo();
        if (!project) return;
        const yaml = serializeComposeProject(project);
        const { nodes, edges } = buildGraph(project, nodePositions);
        set({
          project,
          yamlText: yaml,
          nodes,
          edges,
          syncStatus: "synced",
          mutationError: null,
          selectedServiceId: null,
          selectedRelationshipId: null,
        });
      },

      canUndo: () => get().history?.canUndo ?? false,
      canRedo: () => get().history?.canRedo ?? false,
    }),
    {
      name: "yamlcompose-settings",
      partialize: (state) => ({
        editorThemeId: state.editorThemeId,
        showSummaryPanels: state.showSummaryPanels,
      }),
    }
  )
);
