"use client";

import { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { FileCode2 } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";
import { ExampleSelector } from "./ExampleSelector";
import { ThemeSelector } from "./ThemeSelector";
import { getEditorTheme } from "@/lib/editor/editor-themes";
import { useVisualizeWithSound } from "@/hooks/useVisualizeWithSound";

export function ComposeEditor() {
  const yamlText = useComposeStore((s) => s.yamlText);
  const setYamlText = useComposeStore((s) => s.setYamlText);
  const editorThemeId = useComposeStore((s) => s.editorThemeId);
  const visualize = useVisualizeWithSound();

  const onChange = useCallback(
    (value: string) => setYamlText(value),
    [setYamlText]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        visualize();
      }
    },
    [visualize]
  );

  return (
    <div className="brutal-border brutal-shadow bg-panel flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b-2 border-ink bg-[#0a0a0a] px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2 text-[#f5f3ed]">
          <FileCode2 size={15} strokeWidth={2.5} />
          <span className="font-mono text-sm font-semibold">
            docker-compose.yml
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSelector />
          <ExampleSelector />
        </div>
      </div>

      <div onKeyDown={onKeyDown} className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <CodeMirror
            className="h-full"
            value={yamlText}
            onChange={onChange}
            theme={getEditorTheme(editorThemeId)}
            extensions={[yaml()]}
            height="100%"
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true,
              autocompletion: false,
            }}
            placeholder={"services:\n  web:\n    image: nginx:alpine\n    ports:\n      - \"80:80\""}
          />
        </div>
      </div>
    </div>
  );
}
