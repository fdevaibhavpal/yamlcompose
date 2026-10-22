"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Check, Plus } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";
import {
  playModalOpenSound,
  playModalCloseSound,
  playTabSound,
  playSelectSound,
  playClickSound,
  playToggleOnSound,
  playToggleOffSound,
  playSuccessSound,
  playErrorSound,
} from "@/lib/audio/sound-effects";
import {
  PRESETS_BY_ADD_CATEGORY,
  type AddNodeCategory,
  type ServicePreset,
} from "@/lib/compose/presets";
import { generateUniqueServiceName, isValidServiceName } from "@/lib/compose/mutations";
import type { RelationshipType } from "@/types/compose";
import { BrutalSelect } from "@/components/ui/BrutalSelect";

const TABS: Array<{ id: AddNodeCategory; label: string }> = [
  { id: "service", label: "Service" },
  { id: "database", label: "Database" },
  { id: "cache", label: "Cache" },
  { id: "worker", label: "Worker" },
  { id: "proxy", label: "Proxy" },
  { id: "external", label: "External" },
];

const CONNECTION_TYPES: Array<{ id: RelationshipType; label: string }> = [
  { id: "dependency", label: "depends_on" },
  { id: "network", label: "network" },
];

interface PortRow {
  host: string;
  container: string;
}

interface EnvRow {
  key: string;
  value: string;
}

export function AddNodeModal({
  initialCategory,
  onClose,
}: {
  initialCategory: AddNodeCategory;
  onClose: () => void;
}) {
  const project = useComposeStore((s) => s.project);
  const addServiceAction = useComposeStore((s) => s.addServiceAction);
  const connectServicesAction = useComposeStore((s) => s.connectServicesAction);
  const mutationError = useComposeStore((s) => s.mutationError);

  const [activeTab, setActiveTab] = useState<AddNodeCategory>(initialCategory);
  const [selectedPreset, setSelectedPreset] = useState<ServicePreset | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [buildContext, setBuildContext] = useState("");
  const [ports, setPorts] = useState<PortRow[]>([]);
  const [environment, setEnvironment] = useState<EnvRow[]>([]);
  const [restart, setRestart] = useState("");
  const [connections, setConnections] = useState<string[]>([]);
  const [connectionType, setConnectionType] = useState<RelationshipType>("dependency");
  const [localError, setLocalError] = useState<string | null>(null);

  const otherServices = project?.services ?? [];

  const presets = PRESETS_BY_ADD_CATEGORY[activeTab];

  const suggestedName = useMemo(() => {
    if (!project) return "";
    const base = selectedPreset?.id ?? (activeTab === "service" ? "service" : activeTab);
    return generateUniqueServiceName(project, base);
  }, [project, selectedPreset, activeTab]);

  useEffect(() => {
    playModalOpenSound();
  }, []);

  const handleClose = () => {
    playModalCloseSound();
    onClose();
  };

  const applyPreset = (preset: ServicePreset) => {
    playSelectSound();
    setSelectedPreset(preset);
    const cfg = preset.build(preset.id);
    setName(project ? generateUniqueServiceName(project, preset.id) : preset.id);
    setImage(cfg.image ?? "");
    setBuildContext(cfg.buildContext ?? "");
    setPorts((cfg.ports ?? []).map((p) => ({ host: p.host ?? "", container: p.container })));
    setEnvironment((cfg.environment ?? []).map((e) => ({ key: e.key, value: e.value ?? "" })));
    setRestart(cfg.restart ?? "");
  };

  const switchTab = (tab: AddNodeCategory) => {
    if (tab !== activeTab) {
      playTabSound(TABS.findIndex((t) => t.id === tab));
    }
    setActiveTab(tab);
    setSelectedPreset(null);
    setName("");
    setImage(tab === "service" ? "" : "");
    setBuildContext("");
    setPorts([]);
    setEnvironment([]);
    setRestart("");
    setLocalError(null);
  };

  const toggleConnection = (serviceId: string) => {
    const wasOn = connections.includes(serviceId);
    if (wasOn) playToggleOffSound();
    else playToggleOnSound();
    setConnections((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const addPortRow = () => {
    playClickSound();
    setPorts((prev) => [...prev, { host: "", container: "" }]);
  };
  const updatePortRow = (i: number, field: keyof PortRow, value: string) =>
    setPorts((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  const removePortRow = (i: number) => {
    playClickSound();
    setPorts((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addEnvRow = () => {
    playClickSound();
    setEnvironment((prev) => [...prev, { key: "", value: "" }]);
  };
  const updateEnvRow = (i: number, field: keyof EnvRow, value: string) =>
    setEnvironment((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  const removeEnvRow = (i: number) => {
    playClickSound();
    setEnvironment((prev) => prev.filter((_, idx) => idx !== i));
  };

  const finalName = name.trim() || suggestedName;

  const handleSubmit = () => {
    setLocalError(null);

    if (!finalName) {
      playErrorSound();
      setLocalError("Service name is required.");
      return;
    }
    if (!isValidServiceName(finalName)) {
      playErrorSound();
      setLocalError("Use letters, numbers, dots, dashes, or underscores only.");
      return;
    }
    if (!image.trim() && !buildContext.trim()) {
      playErrorSound();
      setLocalError("Provide either an image or a build context.");
      return;
    }

    const validPorts = ports
      .filter((p) => p.container.trim())
      .map((p) => ({
        host: p.host.trim() || undefined,
        container: p.container.trim(),
      }));
    const validEnv = environment
      .filter((e) => e.key.trim())
      .map((e) => ({ key: e.key.trim(), value: e.value }));

    const ok = addServiceAction({
      name: finalName,
      image: image.trim() || undefined,
      buildContext: buildContext.trim() || undefined,
      ports: validPorts,
      environment: validEnv,
      restart: restart.trim() || undefined,
      category: selectedPreset?.category,
    });

    if (!ok) {
      playErrorSound();
      return;
    }

    for (const targetId of connections) {
      connectServicesAction({
        sourceId: finalName,
        targetId,
        type: connectionType,
      });
    }

    playSuccessSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 px-4">
      <div className="flex w-full max-w-xl max-h-[85vh] flex-col brutal-border bg-panel brutal-shadow-lg">
        <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
          <h2 className="text-base font-bold uppercase tracking-wide">Add New Node</h2>
          <button onClick={handleClose} className="p-1 hover:bg-ink hover:text-paper transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex border-b-2 border-ink overflow-x-auto shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`px-3 py-2 text-xs font-mono font-bold uppercase tracking-wide whitespace-nowrap border-r border-ink/15 last:border-r-0 transition-colors ${
                activeTab === tab.id ? "bg-lime" : "hover:bg-[#eceae2]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {presets.length > 0 && (
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted mb-1.5">
                Presets
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`brutal-border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      selectedPreset?.id === preset.id ? "bg-lime" : "bg-paper hover:bg-[#eceae2]"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Service Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={suggestedName}
                className="brutal-border bg-paper px-2 py-1.5 font-mono text-sm outline-none focus:bg-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Image
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="e.g. node:22"
                className="brutal-border bg-paper px-2 py-1.5 font-mono text-sm outline-none focus:bg-white"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold">
            Build Context (optional)
            <input
              value={buildContext}
              onChange={(e) => setBuildContext(e.target.value)}
              placeholder="e.g. ./service"
              className="brutal-border bg-paper px-2 py-1.5 font-mono text-sm outline-none focus:bg-white"
            />
          </label>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted">
                Ports
              </span>
              <button
                onClick={addPortRow}
                className="flex items-center gap-1 text-[11px] font-mono font-bold uppercase hover:underline"
              >
                <Plus size={12} strokeWidth={3} /> Add
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {ports.map((port, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    value={port.host}
                    onChange={(e) => updatePortRow(i, "host", e.target.value)}
                    placeholder="host"
                    className="brutal-border bg-paper px-2 py-1 font-mono text-xs w-20 outline-none focus:bg-white"
                  />
                  <span className="font-mono text-xs">:</span>
                  <input
                    value={port.container}
                    onChange={(e) => updatePortRow(i, "container", e.target.value)}
                    placeholder="container"
                    className="brutal-border bg-paper px-2 py-1 font-mono text-xs w-20 outline-none focus:bg-white"
                  />
                  <button
                    onClick={() => removePortRow(i)}
                    className="p-1 hover:bg-[#fde8eb] transition-colors"
                    aria-label="Remove port"
                  >
                    <X size={13} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted">
                Environment Variables
              </span>
              <button
                onClick={addEnvRow}
                className="flex items-center gap-1 text-[11px] font-mono font-bold uppercase hover:underline"
              >
                <Plus size={12} strokeWidth={3} /> Add
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {environment.map((env, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    value={env.key}
                    onChange={(e) => updateEnvRow(i, "key", e.target.value)}
                    placeholder="KEY"
                    className="brutal-border bg-paper px-2 py-1 font-mono text-xs flex-1 outline-none focus:bg-white"
                  />
                  <input
                    value={env.value}
                    onChange={(e) => updateEnvRow(i, "value", e.target.value)}
                    placeholder="value"
                    className="brutal-border bg-paper px-2 py-1 font-mono text-xs flex-1 outline-none focus:bg-white"
                  />
                  <button
                    onClick={() => removeEnvRow(i)}
                    className="p-1 hover:bg-[#fde8eb] transition-colors"
                    aria-label="Remove variable"
                  >
                    <X size={13} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold">
            Restart Policy
            <BrutalSelect
              value={restart}
              onChange={setRestart}
              options={[
                { value: "", label: "(none)" },
                { value: "no", label: "no" },
                { value: "always", label: "always" },
                { value: "on-failure", label: "on-failure" },
                { value: "unless-stopped", label: "unless-stopped" },
              ]}
            />
          </label>

          {otherServices.length > 0 && (
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wide text-muted mb-1.5">
                Connect to existing nodes
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {otherServices.map((svc) => {
                  const active = connections.includes(svc.id);
                  return (
                    <button
                      key={svc.id}
                      onClick={() => toggleConnection(svc.id)}
                      className={`flex items-center gap-1 brutal-border px-2 py-1 text-xs font-mono font-semibold transition-colors ${
                        active ? "bg-lime" : "bg-paper hover:bg-[#eceae2]"
                      }`}
                    >
                      {active && <Check size={11} strokeWidth={3} />}
                      {svc.name}
                    </button>
                  );
                })}
              </div>
              {connections.length > 0 && (
                <label className="flex flex-col gap-1 text-xs font-semibold max-w-[180px]">
                  Connection type
                  <BrutalSelect
                    value={connectionType}
                    onChange={(v) => setConnectionType(v as RelationshipType)}
                    options={CONNECTION_TYPES.map((c) => ({ value: c.id, label: c.label }))}
                  />
                </label>
              )}
            </div>
          )}

          {(localError || mutationError) && (
            <div className="brutal-border bg-[#fde8eb] px-3 py-2 text-xs font-mono text-[#e0344c]">
              {localError ?? mutationError}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t-2 border-ink px-4 py-3 shrink-0">
          <button
            onClick={handleClose}
            className="brutal-border bg-panel px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-[#eceae2] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 brutal-border bg-lime px-4 py-2 text-xs font-bold uppercase tracking-wide brutal-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
          >
            <Plus size={14} strokeWidth={3} />
            Add Node
          </button>
        </div>
      </div>
    </div>
  );
}
