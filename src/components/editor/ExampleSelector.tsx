"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { EXAMPLES } from "@/examples";
import { useComposeStore } from "@/store/compose-store";
import { useClickOutside } from "@/hooks/useClickOutside";
import { playClickSound, playSelectSound } from "@/lib/audio/sound-effects";

export function ExampleSelector() {
  const [open, setOpen] = useState(false);
  const setYamlText = useComposeStore((s) => s.setYamlText);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          playClickSound();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1.5 brutal-border bg-lime px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wide text-ink hover:bg-[#c3ea2e] transition-colors"
      >
        Load Example
        <ChevronDown size={12} strokeWidth={3} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-56 brutal-border bg-panel brutal-shadow-sm">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                playSelectSound();
                setYamlText(ex.yaml);
                setOpen(false);
              }}
              className="block w-full border-b-2 border-ink px-3 py-2 text-left text-xs font-mono font-medium last:border-b-0 hover:bg-lime transition-colors"
            >
              {ex.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
