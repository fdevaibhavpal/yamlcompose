"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { playClickSound, playSelectSound } from "@/lib/audio/sound-effects";

export interface BrutalSelectOption {
  value: string;
  label: string;
}

export function BrutalSelect({
  value,
  options,
  onChange,
  placeholder = "Select…",
  className = "",
}: {
  value: string;
  options: BrutalSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          playClickSound();
          setOpen((v) => !v);
        }}
        className="flex w-full items-center justify-between gap-2 brutal-border bg-paper px-2 py-1.5 font-mono text-sm outline-none hover:bg-white transition-colors"
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown size={14} strokeWidth={2.5} className="shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-56 overflow-y-auto brutal-border bg-panel brutal-shadow-sm">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  playSelectSound();
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 border-b border-ink/15 px-2.5 py-2 text-left font-mono text-xs font-medium last:border-b-0 transition-colors ${
                  active ? "bg-lime" : "hover:bg-[#eceae2]"
                }`}
              >
                {active && <Check size={12} strokeWidth={3} className="shrink-0" />}
                <span className={active ? "" : "pl-[18px]"}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
