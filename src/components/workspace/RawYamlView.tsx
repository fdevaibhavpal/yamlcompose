"use client";

import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { EditorView } from "@codemirror/view";
import { Copy, Check } from "lucide-react";
import { useComposeStore } from "@/store/compose-store";
import { getEditorTheme } from "@/lib/editor/editor-themes";
import { playSuccessSound } from "@/lib/audio/sound-effects";

export function RawYamlView() {
  const yamlText = useComposeStore((s) => s.yamlText);
  const editorThemeId = useComposeStore((s) => s.editorThemeId);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(yamlText);
    playSuccessSound();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative h-full w-full">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 brutal-border bg-panel px-2.5 py-1.5 text-xs font-mono font-bold hover:bg-lime transition-colors"
      >
        {copied ? (
          <>
            <Check size={13} strokeWidth={2.5} /> Copied
          </>
        ) : (
          <>
            <Copy size={13} strokeWidth={2.5} /> Copy
          </>
        )}
      </button>
      <div className="absolute inset-0">
        <CodeMirror
          className="h-full"
          value={yamlText}
          theme={getEditorTheme(editorThemeId)}
          extensions={[yaml(), EditorView.editable.of(false)]}
          height="100%"
          basicSetup={{ lineNumbers: true, foldGutter: false }}
        />
      </div>
    </div>
  );
}
