"use client";

import { useComposeStore } from "@/store/compose-store";
import { WorkspaceTabs } from "./WorkspaceTabs";
import { ComposeGraph } from "@/components/graph/ComposeGraph";
import { ServiceInspector } from "./ServiceInspector";
import { ServicesTableView } from "./ServicesTableView";
import { NetworksTableView } from "./NetworksTableView";
import { VolumesTableView } from "./VolumesTableView";
import { RawYamlView } from "./RawYamlView";
import { ServicePanel } from "@/components/panels/ServicePanel";
import { NetworkPanel } from "@/components/panels/NetworkPanel";
import { VolumePanel } from "@/components/panels/VolumePanel";
import { ConfigSummary } from "@/components/panels/ConfigSummary";
import { StatusBar } from "./StatusBar";

export function ArchitectureWorkspace() {
  const activeTab = useComposeStore((s) => s.activeTab);
  const selectedServiceId = useComposeStore((s) => s.selectedServiceId);
  const showSummaryPanels = useComposeStore((s) => s.showSummaryPanels);

  return (
    <div className="brutal-border brutal-shadow bg-panel flex h-full min-h-0 flex-col overflow-hidden">
      <WorkspaceTabs />

      <div className="relative min-h-0 flex-1">
        {activeTab === "architecture" && <ComposeGraph />}
        {activeTab === "services" && <ServicesTableView />}
        {activeTab === "networks" && <NetworksTableView />}
        {activeTab === "volumes" && <VolumesTableView />}
        {activeTab === "yaml" && <RawYamlView />}

        {activeTab === "architecture" && selectedServiceId && <ServiceInspector />}
      </div>

      <div
        className="shrink-0 overflow-hidden transition-[height,border-width] duration-300 ease-out"
        style={{
          height: showSummaryPanels ? 150 : 0,
          borderTopWidth: showSummaryPanels ? 2 : 0,
          borderColor: "var(--ink)",
        }}
      >
        <div className="grid h-[150px] grid-cols-1 gap-2 bg-paper p-2 sm:grid-cols-2 lg:grid-cols-4">
          <ServicePanel />
          <NetworkPanel />
          <VolumePanel />
          <ConfigSummary />
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
