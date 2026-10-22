"use client";

import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";
import {
  playModalOpenSound,
  playModalCloseSound,
  playSuccessSound,
  playErrorSound,
} from "@/lib/audio/sound-effects";

export function AddSimpleResourceModal({
  kind,
  onClose,
}: {
  kind: "network" | "volume";
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const addNetworkAction = useComposeStore((s) => s.addNetworkAction);
  const addVolumeAction = useComposeStore((s) => s.addVolumeAction);

  useEffect(() => {
    playModalOpenSound();
  }, []);

  const handleClose = () => {
    playModalCloseSound();
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      playErrorSound();
      setError(`${kind === "network" ? "Network" : "Volume"} name is required.`);
      return;
    }

    const ok = kind === "network" ? addNetworkAction(trimmed) : addVolumeAction(trimmed);
    if (ok) {
      playSuccessSound();
      onClose();
    } else {
      playErrorSound();
      setError(useComposeStore.getState().mutationError ?? "Could not add resource.");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 px-4">
      <div className="w-full max-w-sm brutal-border bg-panel brutal-shadow-lg">
        <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
          <h2 className="text-base font-bold uppercase tracking-wide">
            Add {kind === "network" ? "Network" : "Volume"}
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-ink hover:text-paper transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder={kind === "network" ? "e.g. app-network" : "e.g. app_data"}
              className="brutal-border bg-paper px-2 py-1.5 font-mono text-sm outline-none focus:bg-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </label>
          {error && (
            <div className="brutal-border bg-[#fde8eb] px-3 py-2 text-xs font-mono text-[#e0344c]">
              {error}
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
            onClick={handleSubmit}
            className="flex items-center gap-1.5 brutal-border bg-lime px-4 py-2 text-xs font-bold uppercase tracking-wide brutal-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
          >
            <Plus size={14} strokeWidth={3} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
