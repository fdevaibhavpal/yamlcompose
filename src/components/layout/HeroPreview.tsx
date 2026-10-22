"use client";

import { useEffect, useRef, useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { getCategoryStyle } from "@/lib/technology/categories";
import { getBrandIcon } from "@/lib/technology/brand-icons";
import {
  playTypeTickSound,
  playNodeDropSound,
  playTraceSound,
  playInspectSound,
  playSearchSound,
  playTableSound,
  playSlideTransitionSound,
  playToggleOnSound,
  playToggleOffSound,
} from "@/lib/audio/sound-effects";

interface PreviewNode {
  id: string;
  name: string;
  image: string;
  category: "application" | "database" | "cache" | "proxy" | "queue";
  technology: string;
  top: number;
  left: number;
  port?: string;
}

/**
 * Positions are percentages of the canvas. They stay inside 14–86% on both
 * axes so a node (plus its offset shadow and the scale-up on highlight)
 * never reaches the container border.
 */
const NODES: PreviewNode[] = [
  { id: "proxy", name: "nginx", image: "nginx:alpine", category: "proxy", technology: "nginx", top: 15, left: 50, port: ":80" },
  { id: "frontend", name: "frontend", image: "node:22", category: "application", technology: "node", top: 33, left: 50, port: ":3000" },
  { id: "backend", name: "backend", image: "node:22", category: "application", technology: "node", top: 51, left: 50, port: ":8000" },
  { id: "worker", name: "worker", image: "node:22", category: "application", technology: "node", top: 69, left: 50, port: "—" },
  { id: "db", name: "postgres", image: "postgres:16", category: "database", technology: "postgres", top: 86, left: 22, port: ":5432" },
  { id: "cache", name: "redis", image: "redis:7", category: "cache", technology: "redis", top: 86, left: 50, port: ":6379" },
  { id: "queue", name: "kafka", image: "bitnami/kafka:3.6", category: "queue", technology: "kafka", top: 86, left: 78, port: ":9092" },
];

const EDGES: Array<[string, string]> = [
  ["proxy", "frontend"],
  ["frontend", "backend"],
  ["backend", "worker"],
  ["backend", "db"],
  ["backend", "cache"],
  ["worker", "queue"],
];

const YAML_LINES = [
  "services:",
  "  nginx:",
  "    image: nginx:alpine",
  "  frontend:",
  "    image: node:22",
  "  backend:",
  "    image: node:22",
  "  worker:",
  "    image: node:22",
  "  postgres:",
  "    image: postgres:16",
  "  redis:",
  "    image: redis:7",
  "  kafka:",
  "    image: bitnami/kafka:3.6",
];

/** The service the inspector/trace phases focus on. */
const FOCUS_ID = "backend";
const FOCUS_NODE = NODES.find((n) => n.id === FOCUS_ID)!;
const FOCUS_NEIGHBOURS = new Set(
  EDGES.filter(([a, b]) => a === FOCUS_ID || b === FOCUS_ID).flatMap(([a, b]) => [a, b])
);

type Phase = "typing" | "building" | "tracing" | "inspect" | "search" | "table";

const PHASE_LABELS: Record<Phase, string> = {
  typing: "Paste",
  building: "Layout",
  tracing: "Dependencies",
  inspect: "Inspect",
  search: "Search",
  table: "Tables",
};

const PHASES: Phase[] = ["typing", "building", "tracing", "inspect", "search", "table"];

const DURATIONS = {
  typingPerLine: 95,
  buildPerNode: 200,
  traceHold: 1900,
  inspectHold: 2200,
  searchHold: 1900,
  tableHold: 2200,
};

function MiniNode({
  node,
  visible,
  dim,
  highlight,
}: {
  node: PreviewNode;
  visible: boolean;
  dim: boolean;
  highlight: boolean;
}) {
  const style = getCategoryStyle(node.category);
  const brand = getBrandIcon(node.technology);
  const Icon = style.icon;

  return (
    <div
      className="absolute flex flex-col gap-0.5 brutal-border px-2.5 py-1.5"
      style={{
        top: `${node.top}%`,
        left: `${node.left}%`,
        transform: `translate(-50%, -50%) scale(${
          visible ? (highlight ? 1.1 : 1) : 0.6
        })`,
        opacity: visible ? (dim ? 0.28 : 1) : 0,
        backgroundColor: style.bg,
        boxShadow: visible
          ? highlight
            ? "5px 5px 0 0 var(--ink)"
            : "3px 3px 0 0 var(--ink)"
          : "none",
        minWidth: "112px",
        zIndex: highlight ? 5 : 1,
        transition:
          "transform 420ms cubic-bezier(.2,.9,.3,1.2), opacity 420ms ease-out, box-shadow 320ms ease-out",
      }}
    >
      <div className="flex items-center gap-1.5">
        {brand ? (
          <svg viewBox="0 0 24 24" width={12} height={12} fill={style.color}>
            <path d={brand.path} />
          </svg>
        ) : (
          <Icon size={12} color={style.color} strokeWidth={2.5} />
        )}
        <span className="text-[10px] font-mono font-bold truncate">{node.name}</span>
        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#1f9254] status-dot" />
      </div>
      {node.port && (
        <span className="text-[9px] font-mono text-muted">{node.port}</span>
      )}
    </div>
  );
}

function EdgeLine({
  from,
  to,
  visible,
  active,
  dim,
}: {
  from: PreviewNode;
  to: PreviewNode;
  visible: boolean;
  active: boolean;
  dim: boolean;
}) {
  return (
    <g>
      <line
        x1={`${from.left}%`}
        y1={`${from.top}%`}
        x2={`${to.left}%`}
        y2={`${to.top}%`}
        stroke="var(--ink)"
        strokeWidth={active ? 2.5 : 1.5}
        style={{
          opacity: visible ? (dim ? 0.15 : 1) : 0,
          transition: "opacity 400ms ease-out, stroke-width 300ms ease-out",
        }}
      />
      {/* Packet travelling the edge — shows data flow during the trace phase. */}
      {active && (
        <circle r={3} fill="var(--lime)" stroke="var(--ink)" strokeWidth={1}>
          <animate
            attributeName="cx"
            values={`${from.left}%;${to.left}%`}
            dur="1.1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values={`${from.top}%;${to.top}%`}
            dur="1.1s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
}

/** Floating inspector card — mirrors the real ServiceInspector panel. */
function InspectorCard({ visible }: { visible: boolean }) {
  const style = getCategoryStyle(FOCUS_NODE.category);
  const Icon = style.icon;

  const rows: Array<[string, string]> = [
    ["IMAGE", FOCUS_NODE.image],
    ["PORTS", "8000:8000"],
    ["DEPENDS ON", "postgres, redis"],
    ["NETWORKS", "backend-net"],
  ];

  return (
    <div
      className="absolute right-3 top-1/2 z-10 w-[46%] max-w-[200px] -translate-y-1/2 overflow-hidden brutal-border bg-panel"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateY(-50%) translateX(${visible ? 0 : 16}px)`,
        boxShadow: "4px 4px 0 0 var(--ink)",
        transition: "opacity 400ms ease-out, transform 400ms cubic-bezier(.2,.9,.3,1.1)",
        pointerEvents: "none",
      }}
    >
      <div
        className="flex items-center gap-1.5 border-b-2 border-ink px-2 py-1.5"
        style={{ backgroundColor: style.bg }}
      >
        <Icon size={11} strokeWidth={2.5} color={style.color} />
        <span className="text-[9px] font-bold truncate">{FOCUS_NODE.name}</span>
        <span
          className="ml-auto text-[7px] font-mono font-bold tracking-widest"
          style={{ color: style.color }}
        >
          {style.label}
        </span>
      </div>
      <div className="flex flex-col">
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className="flex flex-col gap-0.5 border-b border-ink/10 px-2 py-1 last:border-b-0"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(3px)",
              transition: `opacity 300ms ease-out ${i * 70 + 150}ms, transform 300ms ease-out ${i * 70 + 150}ms`,
            }}
          >
            <span className="text-[6.5px] font-mono font-bold tracking-widest text-muted">
              {label}
            </span>
            <span className="text-[8px] font-mono truncate">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 border-t-2 border-ink bg-[#fdf3e0] px-2 py-1">
        <AlertTriangle size={8} strokeWidth={3} className="shrink-0 text-[#c75a00]" />
        <span className="text-[7px] font-mono text-[#c75a00]">No healthcheck</span>
      </div>
    </div>
  );
}

/** Search overlay — types a query and filters the graph live. */
const SEARCH_QUERY = "re";

function SearchBar({ visible, typed }: { visible: boolean; typed: string }) {
  return (
    <div
      className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5 brutal-border bg-paper px-2 py-1"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? 0 : -8}px)`,
        boxShadow: "3px 3px 0 0 var(--ink)",
        transition: "opacity 300ms ease-out, transform 300ms ease-out",
        pointerEvents: "none",
      }}
    >
      <Search size={10} strokeWidth={2.5} className="text-muted" />
      <span className="font-mono text-[9px] min-w-[70px]">
        {typed}
        <span className="ml-px inline-block h-2 w-[3px] translate-y-[1px] bg-ink animate-pulse" />
      </span>
    </div>
  );
}

function ServicesTableFrame({ visible }: { visible: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden bg-paper px-6 py-5"
    >
      <div className="mb-3 text-[10px] font-mono font-bold uppercase tracking-widest text-muted">
        Services ({NODES.length})
      </div>
      <div className="flex-1 min-h-0 brutal-border bg-panel">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 border-b-2 border-ink bg-[#eceae2] px-3 py-2 text-[9px] font-mono font-bold uppercase tracking-wide">
          <span>Name</span>
          <span>Category</span>
          <span>Port</span>
        </div>
        {NODES.map((node, i) => {
          const style = getCategoryStyle(node.category);
          const brand = getBrandIcon(node.technology);
          const Icon = style.icon;
          return (
            <div
              key={node.id}
              className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 border-b border-ink/10 px-3 py-2 text-[10px] transition-all duration-300 last:border-b-0"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-10px)",
                transitionDelay: visible ? `${i * 70}ms` : "0ms",
              }}
            >
              <span className="font-bold font-mono truncate">{node.name}</span>
              <span className="flex items-center gap-1.5">
                {brand ? (
                  <svg viewBox="0 0 24 24" width={11} height={11} fill={style.color}>
                    <path d={brand.path} />
                  </svg>
                ) : (
                  <Icon size={11} color={style.color} strokeWidth={2.5} />
                )}
                <span className="font-mono text-muted truncate">{style.label}</span>
              </span>
              <span className="font-mono text-muted">{node.port}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HeroPreview() {
  const [phase, setPhase] = useState<Phase>("typing");
  const [lineCount, setLineCount] = useState(0);
  const [nodeCount, setNodeCount] = useState(0);
  const [typedQuery, setTypedQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  /**
   * Audio gate: sound defaults to "on" (the user's preference, persisted
   * across visits), but browsers suspend AudioContext until a user gesture,
   * so it only actually plays once unlocked by the first click/keydown AND
   * the preview is on screen. The label itself is also a toggle so the user
   * can explicitly turn it back off.
   */
  const audibleRef = useRef(false);
  const onScreenRef = useRef(true);
  const [soundWanted, setSoundWanted] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const soundOn = soundWanted && unlocked;

  useEffect(() => {
    const stored = window.localStorage.getItem("hero-sound-enabled");
    if (stored !== null) setSoundWanted(stored === "true");
  }, []);

  useEffect(() => {
    audibleRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    const unlock = () => setUnlocked(true);
    const opts = { once: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);

    const el = rootRef.current;
    const io = el
      ? new IntersectionObserver(
          ([entry]) => {
            onScreenRef.current = entry.isIntersecting;
          },
          { threshold: 0.35 }
        )
      : null;
    if (el && io) io.observe(el);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      io?.disconnect();
    };
  }, []);

  const toggleSound = () => {
    setSoundWanted((prev) => {
      const next = !prev;
      window.localStorage.setItem("hero-sound-enabled", String(next));
      setUnlocked(true);
      if (next) playToggleOnSound();
      else playToggleOffSound();
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, delay: number) => {
      timers.push(setTimeout(() => !cancelled && fn(), delay));
    };

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    /** Play only while unlocked, on screen, and motion is not reduced. */
    const sfx = (fn: () => void) => {
      if (!audibleRef.current || !onScreenRef.current || reduced) return;
      fn();
    };

    /** Every phase change gets the shared whoosh plus its own voice. */
    const enterPhase = (next: Phase, voice: () => void) => {
      setPhase(next);
      sfx(playSlideTransitionSound);
      sfx(voice);
    };

    function runCycle() {
      if (cancelled) return;
      // Drop the previous cycle's pending timers so cycles never overlap.
      timers.forEach(clearTimeout);
      timers = [];
      setPhase("typing");
      setLineCount(0);
      setNodeCount(0);
      setTypedQuery("");
      sfx(playSlideTransitionSound);

      let t = 0;
      YAML_LINES.forEach((_, i) => {
        schedule(() => {
          setLineCount(i + 1);
          sfx(playTypeTickSound);
        }, t);
        t += DURATIONS.typingPerLine;
      });
      t += 350;

      schedule(() => {
        setPhase("building");
        sfx(playSlideTransitionSound);
      }, t);
      NODES.forEach((_, i) => {
        schedule(() => {
          setNodeCount(i + 1);
          sfx(() => playNodeDropSound(i));
        }, t + i * DURATIONS.buildPerNode);
      });
      t += NODES.length * DURATIONS.buildPerNode + 450;

      schedule(() => enterPhase("tracing", playTraceSound), t);
      t += DURATIONS.traceHold;

      schedule(() => enterPhase("inspect", playInspectSound), t);
      t += DURATIONS.inspectHold;

      schedule(() => {
        enterPhase("search", playSearchSound);
        setTypedQuery("");
      }, t);
      SEARCH_QUERY.split("").forEach((_, i) => {
        schedule(() => {
          setTypedQuery(SEARCH_QUERY.slice(0, i + 1));
          sfx(playTypeTickSound);
        }, t + 350 + i * 180);
      });
      t += DURATIONS.searchHold;

      schedule(() => enterPhase("table", playTableSound), t);
      t += DURATIONS.tableHold;

      schedule(runCycle, t);
    }

    runCycle();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  const visibleLines = YAML_LINES.slice(0, lineCount);
  const graphVisible =
    phase === "building" ||
    phase === "tracing" ||
    phase === "inspect" ||
    phase === "search";

  const matchesSearch = (name: string) =>
    typedQuery.length === 0 || name.toLowerCase().includes(typedQuery.toLowerCase());

  function nodeState(node: PreviewNode, index: number) {
    const visible = index < nodeCount;
    if (phase === "tracing") {
      return {
        visible,
        dim: !FOCUS_NEIGHBOURS.has(node.id),
        highlight: node.id === FOCUS_ID,
      };
    }
    if (phase === "inspect") {
      return { visible, dim: node.id !== FOCUS_ID, highlight: node.id === FOCUS_ID };
    }
    if (phase === "search") {
      const match = matchesSearch(node.name);
      return { visible, dim: !match, highlight: match && typedQuery.length > 0 };
    }
    return { visible, dim: false, highlight: false };
  }

  /**
   * Each layer slides along the deck rather than cross-fading, so moving
   * between slides reads as travel in one direction.
   */
  const slideIndex = PHASES.indexOf(phase);
  const layerStyle = (layerPhases: Phase[]): React.CSSProperties => {
    const active = layerPhases.includes(phase);
    const layerAt = PHASES.indexOf(layerPhases[0]);
    const offset = active ? 0 : slideIndex > layerAt ? -6 : 6;
    return {
      opacity: active ? 1 : 0,
      transform: `translateX(${offset}%)`,
      transition:
        "opacity 520ms cubic-bezier(.4,0,.2,1), transform 620ms cubic-bezier(.4,0,.2,1)",
      pointerEvents: active ? "auto" : "none",
    };
  };

  return (
    <div
      ref={rootRef}
      className="flex h-full w-full flex-col overflow-hidden brutal-border brutal-shadow bg-panel"
    >
      <div className="flex items-center justify-between gap-2 border-b-2 border-ink bg-[#0a0a0a] px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e0344c]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e0a632]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#1f9254]" />
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest transition-colors hover:bg-white/10"
            style={{ color: soundOn ? "#d4fb3f" : "#f5f3ed80" }}
            title={
              !unlocked
                ? "Click to enable sound"
                : soundOn
                  ? "Sound on — click to mute"
                  : "Sound off — click to enable"
            }
          >
            <span aria-hidden>{soundOn ? "♪" : "✕"}</span>
            <span className="hidden sm:inline">
              {!unlocked ? "CLICK FOR SOUND" : soundOn ? "SOUND ON" : "SOUND OFF"}
            </span>
          </button>
          <span className="hidden h-3 w-px shrink-0 bg-[#f5f3ed]/20 sm:block" />
          <span className="truncate font-mono text-[10px] font-bold text-[#f5f3ed]/70">
            docker-compose.yml
          </span>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0" style={layerStyle(["typing"])}>
          <div className="h-full w-full overflow-hidden bg-[#0a0a0a] px-5 py-4 font-mono text-[12px] leading-relaxed">
            {visibleLines.map((line, i) => (
              <div
                key={i}
                className="whitespace-pre animate-[lineIn_200ms_ease-out]"
              >
                <span className="text-[#6b6b63] mr-2 select-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[#f5f3ed]">{line}</span>
                {i === visibleLines.length - 1 && (
                  <span className="ml-0.5 inline-block h-3 w-1.5 bg-[#d4fb3f] animate-pulse align-middle" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          className="absolute inset-0"
          style={layerStyle(["building", "tracing", "inspect", "search"])}
        >
          <div className="relative h-full w-full bg-paper">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: "radial-gradient(var(--ink) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
            {/*
              Padded field: edges and nodes share this inset coordinate space,
              so node percentages can never place a card on the border.
            */}
            <div className="absolute inset-0 px-10 py-8">
            <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
              {EDGES.map(([fromId, toId], i) => {
                const from = NODES.find((n) => n.id === fromId)!;
                const to = NODES.find((n) => n.id === toId)!;
                const fromVisible = NODES.findIndex((n) => n.id === fromId) < nodeCount;
                const toVisible = NODES.findIndex((n) => n.id === toId) < nodeCount;
                const touchesFocus = fromId === FOCUS_ID || toId === FOCUS_ID;
                return (
                  <EdgeLine
                    key={i}
                    from={from}
                    to={to}
                    visible={fromVisible && toVisible}
                    active={phase === "tracing" && touchesFocus}
                    dim={
                      (phase === "tracing" || phase === "inspect") && !touchesFocus
                    }
                  />
                );
              })}
            </svg>
            {NODES.map((node, i) => {
              const state = nodeState(node, i);
              return (
                <MiniNode
                  key={node.id}
                  node={node}
                  visible={state.visible}
                  dim={state.dim}
                  highlight={state.highlight}
                />
              );
            })}
            </div>

            <InspectorCard visible={phase === "inspect"} />
            <SearchBar visible={phase === "search"} typed={typedQuery} />
          </div>
        </div>

        <div className="absolute inset-0" style={layerStyle(["table"])}>
          <ServicesTableFrame visible={phase === "table"} />
        </div>

        {/* Phase caption — names the feature currently being demonstrated. */}
        <div
          key={phase}
          className="absolute bottom-3 left-4 z-20 animate-[captionIn_380ms_cubic-bezier(.2,.9,.3,1.2)] brutal-border bg-lime px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest"
        >
          {PHASE_LABELS[phase]}
        </div>
      </div>

      <div className="border-t-2 border-ink bg-panel px-3 py-2 shrink-0 flex items-center justify-center gap-1.5">
        {PHASES.map((p) => (
          <span
            key={p}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: phase === p ? "14px" : "6px",
              backgroundColor: phase === p ? "var(--ink)" : "#0a0a0a22",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes lineIn {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes captionIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
