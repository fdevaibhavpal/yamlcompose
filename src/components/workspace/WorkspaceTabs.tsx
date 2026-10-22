"use client";

import { useComposeStore, type ViewTab } from "@/store/compose-store";
import { Search } from "lucide-react";
import { SummaryPanelsToggle } from "./SummaryPanelsToggle";
import { playTabSound } from "@/lib/audio/sound-effects";

const TABS: { id: ViewTab; label: string }[] = [
  { id: "architecture", label: "ARCHITECTURE" },
  { id: "services", label: "SERVICES" },
  { id: "networks", label: "NETWORKS" },
  { id: "volumes", label: "VOLUMES" },
  { id: "yaml", label: "RAW YAML" },
];

export function WorkspaceTabs() {
  const activeTab = useComposeStore((s) => s.activeTab);
  const setActiveTab = useComposeStore((s) => s.setActiveTab);
  const searchQuery = useComposeStore((s) => s.searchQuery);
  const setSearchQuery = useComposeStore((s) => s.setSearchQuery);

  return (
    <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-panel px-3 py-2 overflow-x-auto">
      <div className="flex items-center gap-1 shrink-0">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id !== activeTab) playTabSound(i);
              setActiveTab(tab.id);
            }}
            className={`px-3 py-1.5 text-xs font-mono font-bold tracking-wide transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-lime brutal-border"
                : "border-2 border-transparent hover:bg-[#eceae2]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <SummaryPanelsToggle />
        {activeTab === "architecture" && (
          <div className="hidden sm:flex items-center gap-1.5 brutal-border bg-paper px-2 py-1 shrink-0 min-w-[160px]">
            <Search size={13} strokeWidth={2.5} className="text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services…"
              className="w-full bg-transparent text-xs font-mono outline-none placeholder:text-muted"
            />
          </div>
        )}
      </div>
    </div>
  );
}
