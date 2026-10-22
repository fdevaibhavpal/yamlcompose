"use client";

import { Play, Trash2, AlertTriangle } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";
import { playClickSound } from "@/lib/audio/sound-effects";
import { useVisualizeWithSound } from "@/hooks/useVisualizeWithSound";

export function VisualizeControls() {
  const yamlText = useComposeStore((s) => s.yamlText);
  const error = useComposeStore((s) => s.error);
  const visualized = useComposeStore((s) => s.visualized);
  const project = useComposeStore((s) => s.project);
  const clear = useComposeStore((s) => s.clear);
  const handleVisualize = useVisualizeWithSound();

  const showStatus = yamlText.trim().length > 0;
  const missingDependencies = project?.missingDependencies ?? [];

  const handleClear = () => {
    playClickSound();
    clear();
  };

  return (
    <div className="flex flex-col gap-3">
      {showStatus && error && (
        <div className="brutal-border bg-[#fde8eb] px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[#e0344c]" />
            <div className="min-w-0">
              <div className="text-xs font-mono font-bold uppercase tracking-wide text-[#e0344c]">
                Invalid YAML
              </div>
              {error.line != null && (
                <div className="mt-0.5 text-xs font-mono text-ink">Line {error.line}</div>
              )}
              <div className="mt-0.5 text-xs text-ink/80 break-words">
                {error.detail ?? error.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatus && !error && visualized && missingDependencies.length > 0 && (
        <div className="brutal-border bg-[#fdf3e0] px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[#c75a00]" />
            <div className="min-w-0">
              <div className="text-xs font-mono font-bold uppercase tracking-wide text-[#c75a00]">
                Missing service{missingDependencies.length > 1 ? "s" : ""}
              </div>
              {missingDependencies.map((msg, i) => (
                <div key={i} className="mt-0.5 text-xs text-ink/80 break-words">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleVisualize}
          disabled={!yamlText.trim()}
          className="flex flex-1 items-center justify-center gap-2 brutal-border bg-lime px-6 py-3.5 text-sm font-bold uppercase tracking-wide brutal-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:brutal-shadow-lg active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <Play size={16} strokeWidth={2.5} fill="currentColor" />
          Visualize Diagram
          <span aria-hidden="true">→</span>
        </button>
        <button
          onClick={handleClear}
          className="flex items-center justify-center gap-2 brutal-border bg-panel px-4 py-3.5 text-sm font-bold uppercase tracking-wide brutal-shadow-sm hover:bg-[#eceae2] transition-colors"
        >
          <Trash2 size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      <div className="text-center text-[10px] font-mono font-bold text-ink">
        Press <kbd className="brutal-border px-1 py-0.5 bg-panel">⌘</kbd> +{" "}
        <kbd className="brutal-border px-1 py-0.5 bg-panel">Enter</kbd> to visualize
      </div>
    </div>
  );
}
