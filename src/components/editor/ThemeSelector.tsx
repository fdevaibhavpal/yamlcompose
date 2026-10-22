"use client";

import { useRef, useState } from "react";
import { ChevronDown, Check, Palette } from "lucide-react";
import { EDITOR_THEMES } from "@/lib/editor/editor-themes";
import { useComposeStore } from "@/store/compose-store";
import { useClickOutside } from "@/hooks/useClickOutside";
import { playClickSound, playSelectSound } from "@/lib/audio/sound-effects";

export function ThemeSelector() {
  const [open, setOpen] = useState(false);
  const editorThemeId = useComposeStore((s) => s.editorThemeId);
  const setEditorThemeId = useComposeStore((s) => s.setEditorThemeId);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          playClickSound();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1.5 brutal-border bg-panel px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wide text-ink hover:bg-[#eceae2] transition-colors"
        aria-label="Change editor theme"
        title="Change editor theme"
      >
        <Palette size={12} strokeWidth={2.5} />
        <ChevronDown size={12} strokeWidth={3} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-48 brutal-border bg-panel brutal-shadow-sm">
          {EDITOR_THEMES.map((t) => {
            const active = t.id === editorThemeId;
            return (
              <button
                key={t.id}
                onClick={() => {
                  playSelectSound();
                  setEditorThemeId(t.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 border-b-2 border-ink px-3 py-2 text-left text-xs font-mono font-medium last:border-b-0 hover:bg-lime transition-colors ${
                  active ? "bg-[#eceae2]" : ""
                }`}
              >
                <span className="flex shrink-0 overflow-hidden brutal-border h-4 w-6">
                  {t.swatch.map((c, i) => (
                    <span key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </span>
                <span className="flex-1 truncate">{t.label}</span>
                {active && <Check size={13} strokeWidth={3} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
