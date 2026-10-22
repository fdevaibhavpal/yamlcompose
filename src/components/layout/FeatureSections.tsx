"use client";

import {
  FileCode2,
  Workflow,
  Search,
  ShieldCheck,
  Database,
  Network,
  MousePointerClick,
  Undo2,
  Table2,
  Palette,
  Link2,
  Volume2,
} from "lucide-react";
import { PlaygroundCta } from "./PlaygroundCta";

const FEATURES = [
  {
    icon: FileCode2,
    title: "Paste & Parse",
    desc: "Drop in any docker-compose.yml and get instant validation with line-accurate error messages.",
  },
  {
    icon: Workflow,
    title: "Auto Layout",
    desc: "Services, dependencies, and networks are arranged automatically — no manual dragging required.",
  },
  {
    icon: Search,
    title: "Technology Detection",
    desc: "Recognizes 90+ technologies from image names, ports, and env vars — with real brand icons.",
  },
  {
    icon: Network,
    title: "Relationship Mapping",
    desc: "depends_on, networks, and volumes are all rendered as distinct, labeled connections.",
  },
  {
    icon: Database,
    title: "Full Inspector",
    desc: "Click any service to see its image, ports, environment, volumes, and config warnings.",
  },
  {
    icon: MousePointerClick,
    title: "Visual Editing",
    desc: "Add, rename, duplicate, connect, or delete services right on the canvas — the YAML rewrites itself.",
  },
  {
    icon: Undo2,
    title: "Undo & Redo",
    desc: "Every change is tracked. Step backward and forward with ⌘Z and ⌘⇧Z, just like a real editor.",
  },
  {
    icon: Table2,
    title: "Table Views",
    desc: "Switch between architecture, services, networks, volumes, and the live raw YAML output.",
  },
  {
    icon: Link2,
    title: "Editable Relationships",
    desc: "Drag an edge to retarget it, change depends_on to a network, or detach it entirely.",
  },
  {
    icon: Palette,
    title: "Six Editor Themes",
    desc: "VS Code Dark, Dracula, Nord, Monokai, GitHub Dark, and Tokyo Night for the YAML editor.",
  },
  {
    icon: Volume2,
    title: "Audio Feedback",
    desc: "Distinct sound effects for navigation, tabs, toggles, edits, and errors — synthesized, never downloaded.",
  },
  {
    icon: ShieldCheck,
    title: "Private by Design",
    desc: "No backend, no uploads, no accounts. Your Compose file never leaves your browser.",
  },
];

const STEPS = [
  { n: "01", title: "Paste your YAML", desc: "Drop in docker-compose.yml or load one of 7 built-in examples." },
  { n: "02", title: "Click Visualize", desc: "Services, networks, and volumes are parsed and laid out instantly." },
  { n: "03", title: "Explore & edit", desc: "Inspect, search, rewire, and add services — YAML stays in sync." },
];

/** Headline capability counts, verified against the app's own data. */
const STATS = [
  { value: "90+", label: "Technologies detected" },
  { value: "7", label: "Built-in examples" },
  { value: "5", label: "Workspace views" },
  { value: "0", label: "Bytes sent to a server" },
];

const VIEWS = [
  { name: "Architecture", desc: "Interactive node graph with zoom, minimap, and live search." },
  { name: "Services", desc: "Every service with its category, image, and exposed ports." },
  { name: "Networks", desc: "Each network, its driver, and which services attach to it." },
  { name: "Volumes", desc: "Named volumes and the services that mount them." },
  { name: "Raw YAML", desc: "The regenerated Compose file, ready to copy back out." },
];

export function FeatureSections() {
  return (
    <>
      {/* Stats band — concrete numbers, straight from the app's own data. */}
      <section className="border-t-2 border-ink bg-ink px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-lime sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-[11px] font-mono font-bold uppercase tracking-widest text-paper/60">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="border-t-2 border-ink bg-panel px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-10 flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-muted">
            <span className="h-px w-8 bg-ink" />
            Features
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="brutal-border brutal-shadow-sm bg-paper p-5 transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px]"
              >
                <f.icon size={22} strokeWidth={2.5} className="mb-3" />
                <div className="mb-1.5 text-base font-bold">{f.title}</div>
                <p className="text-sm leading-relaxed text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="explore" className="border-t-2 border-ink bg-paper px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-10 flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-muted">
            <span className="h-px w-8 bg-ink" />
            How it works
          </div>
          <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col items-center gap-2">
                <span className="text-4xl font-bold text-lime [-webkit-text-stroke:1.5px_var(--ink)]">
                  {s.n}
                </span>
                <div className="text-base font-bold">{s.title}</div>
                <p className="max-w-xs text-sm leading-relaxed text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Five workspace views — what the tabs in the playground actually show. */}
      <section className="border-t-2 border-ink bg-panel px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-10 flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-muted">
            <span className="h-px w-8 bg-ink" />
            Five ways to read your stack
          </div>
          <div className="brutal-border bg-paper">
            {VIEWS.map((v, i) => (
              <div
                key={v.name}
                className={`flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-6 ${
                  i < VIEWS.length - 1 ? "border-b-2 border-ink" : ""
                }`}
              >
                <div className="flex shrink-0 items-center gap-3 sm:w-56">
                  <span className="font-mono text-[11px] font-bold text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-base font-bold uppercase tracking-wide">
                    {v.name}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="examples" className="border-t-2 border-ink bg-paper px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-muted">
            <span className="h-px w-8 bg-ink" />
            Ready when you are
            <span className="h-px w-8 bg-ink" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            TRY IT WITH YOUR OWN STACK
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            No signup, no install. Paste a Compose file and see your
            architecture in seconds.
          </p>
          <PlaygroundCta className="mt-2 flex items-center gap-2 brutal-border bg-lime px-6 py-3.5 text-sm font-bold uppercase tracking-wide brutal-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:brutal-shadow-lg active:translate-x-0 active:translate-y-0 active:shadow-none transition-all" />
        </div>
      </section>
    </>
  );
}
