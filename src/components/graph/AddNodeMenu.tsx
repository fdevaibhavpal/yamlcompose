"use client";

import { useRef, useState } from "react";
import {
  Plus,
  ChevronDown,
  Box,
  Database,
  Zap,
  Cog,
  Shield,
  Globe,
  Network,
  HardDrive,
} from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { AddNodeCategory } from "@/lib/compose/presets";
import { playClickSound, playSelectSound } from "@/lib/audio/sound-effects";

export type AddMenuSelection =
  | { kind: "node"; category: AddNodeCategory }
  | { kind: "network" }
  | { kind: "volume" };

const NODE_ITEMS: Array<{ category: AddNodeCategory; label: string; icon: typeof Box }> = [
  { category: "service", label: "Service", icon: Box },
  { category: "database", label: "Database", icon: Database },
  { category: "cache", label: "Cache", icon: Zap },
  { category: "worker", label: "Worker", icon: Cog },
  { category: "proxy", label: "Proxy", icon: Shield },
  { category: "external", label: "External", icon: Globe },
];

export function AddNodeMenu({ onSelect }: { onSelect: (selection: AddMenuSelection) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const choose = (selection: AddMenuSelection) => {
    playSelectSound();
    setOpen(false);
    onSelect(selection);
  };

  return (
    <div ref={ref} className="absolute top-3 left-3 z-10">
      <button
        onClick={() => {
          playClickSound();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1.5 brutal-border bg-lime px-3 py-2 text-xs font-bold uppercase tracking-wide brutal-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
      >
        <Plus size={14} strokeWidth={3} />
        Add
        <ChevronDown size={12} strokeWidth={3} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] w-52 brutal-border bg-panel brutal-shadow-sm">
          {NODE_ITEMS.map((item) => (
            <button
              key={item.category}
              onClick={() => choose({ kind: "node", category: item.category })}
              className="flex w-full items-center gap-2.5 border-b border-ink/15 px-3 py-2 text-left text-sm font-medium hover:bg-lime transition-colors"
            >
              <item.icon size={15} strokeWidth={2.5} />
              {item.label}
            </button>
          ))}
          <div className="h-px bg-ink/20 my-1" />
          <button
            onClick={() => choose({ kind: "network" })}
            className="flex w-full items-center gap-2.5 border-b border-ink/15 px-3 py-2 text-left text-sm font-medium hover:bg-lime transition-colors"
          >
            <Network size={15} strokeWidth={2.5} />
            Network
          </button>
          <button
            onClick={() => choose({ kind: "volume" })}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium hover:bg-lime transition-colors"
          >
            <HardDrive size={15} strokeWidth={2.5} />
            Volume
          </button>
        </div>
      )}
    </div>
  );
}
