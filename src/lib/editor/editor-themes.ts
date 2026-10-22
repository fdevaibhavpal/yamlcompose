import {
  vscodeDark,
  dracula,
  nord,
  monokai,
  githubDark,
  tokyoNight,
} from "@uiw/codemirror-themes-all";
import type { Extension } from "@codemirror/state";

export interface EditorThemeOption {
  id: string;
  label: string;
  theme: Extension;
  swatch: [string, string, string];
}

export const EDITOR_THEMES: EditorThemeOption[] = [
  {
    id: "vscode-dark",
    label: "VS Code Dark",
    theme: vscodeDark,
    swatch: ["#1e1e1e", "#569cd6", "#ce9178"],
  },
  {
    id: "dracula",
    label: "Dracula",
    theme: dracula,
    swatch: ["#282a36", "#ff79c6", "#f1fa8c"],
  },
  {
    id: "nord",
    label: "Nord",
    theme: nord,
    swatch: ["#2e3440", "#88c0d0", "#a3be8c"],
  },
  {
    id: "monokai",
    label: "Monokai",
    theme: monokai,
    swatch: ["#272822", "#f92672", "#e6db74"],
  },
  {
    id: "github-dark",
    label: "GitHub Dark",
    theme: githubDark,
    swatch: ["#0d1117", "#79c0ff", "#a5d6ff"],
  },
  {
    id: "tokyo-night",
    label: "Tokyo Night",
    theme: tokyoNight,
    swatch: ["#1a1b26", "#7aa2f7", "#9ece6a"],
  },
];

export const DEFAULT_EDITOR_THEME_ID = "vscode-dark";

export function getEditorTheme(id: string): Extension {
  return (
    EDITOR_THEMES.find((t) => t.id === id)?.theme ??
    EDITOR_THEMES[0].theme
  );
}
