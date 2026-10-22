"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { ComposeEditor } from "@/components/editor/ComposeEditor";
import { VisualizeControls } from "@/components/editor/VisualizeControls";
import { SuccessToast } from "@/components/editor/SuccessToast";
import { ArchitectureWorkspace } from "@/components/workspace/ArchitectureWorkspace";
import { useComposeStore } from "@/store/compose-store";
import { DEFAULT_EXAMPLE } from "@/examples";
import { useVisualizeWithSound } from "@/hooks/useVisualizeWithSound";

export default function PlaygroundPage() {
  const yamlText = useComposeStore((s) => s.yamlText);
  const setYamlText = useComposeStore((s) => s.setYamlText);
  const visualized = useComposeStore((s) => s.visualized);
  const error = useComposeStore((s) => s.error);
  const successCount = useComposeStore((s) => s.successCount);
  const visualize = useVisualizeWithSound();

  useEffect(() => {
    if (!yamlText) {
      setYamlText(DEFAULT_EXAMPLE.yaml);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        visualize();
        return;
      }

      const target = e.target as HTMLElement | null;
      const isInEditor = !!target?.closest(".cm-editor");
      if (isInEditor) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          useComposeStore.getState().redo();
        } else {
          useComposeStore.getState().undo();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visualize]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header variant="playground" />

      <main className="mx-auto flex w-full min-h-0 flex-1 max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="relative flex min-h-0 flex-col gap-4">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <h1 className="shrink-0 whitespace-nowrap text-lg font-bold tracking-tight sm:text-xl">
                PASTE &amp; VISUALIZE
              </h1>
              {!error && visualized && successCount > 0 && (
                <SuccessToast key={successCount} />
              )}
            </div>
            <ComposeEditor />
            <VisualizeControls />
          </div>

          <div className="min-w-0 min-h-0">
            {visualized ? (
              <ArchitectureWorkspace />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 brutal-border border-dashed bg-panel/40 px-6 text-center">
                <div className="text-base font-mono font-bold uppercase tracking-widest text-[#1f9254]">
                  No diagram yet
                </div>
                <p className="max-w-xs text-sm text-muted">
                  Click <span className="font-bold text-ink">Visualize Diagram</span> to
                  render your architecture.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
