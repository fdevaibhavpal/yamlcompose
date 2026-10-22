"use client";

import { useEffect, useRef, useState } from "react";
import { Boxes, Check } from "lucide-react";
import {
  startLoadingLoop,
  playLoadCompleteSound,
  type LoadingLoop,
} from "@/lib/audio/sound-effects";

const STEPS = [
  "Parsing compose schema",
  "Resolving services",
  "Detecting technologies",
  "Mapping dependencies",
  "Building graph layout",
];

const STEP_MS = 700;
const TOTAL_MS = STEPS.length * STEP_MS;

export function LaunchOverlay() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const loopRef = useRef<LoadingLoop | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const loop = startLoadingLoop();
    loopRef.current = loop;
    loop.tick();

    const stepInterval = setInterval(() => {
      setStepIndex((i) => {
        const next = Math.min(i + 1, STEPS.length - 1);
        if (next !== i) loop.tick();
        return next;
      });
    }, STEP_MS);

    const start = Date.now();
    const progressInterval = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / TOTAL_MS) * 100));
      setProgress(pct);
      loop.setProgress(pct);
      if (pct >= 100 && !completedRef.current) {
        completedRef.current = true;
        loop.stop();
        playLoadCompleteSound();
      }
    }, 50);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      loop.stop();
    };
  }, []);

  const complete = progress >= 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper animate-[overlayIn_260ms_ease-out]">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: "radial-gradient(var(--ink) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Expanding rings behind the mark, pulsing with the audio bed. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 border-2 border-ink/15"
            style={{
              animation: `ringOut 2.4s ease-out ${i * 0.8}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center gap-6 px-6 text-center">
        <span
          className="flex h-16 w-16 items-center justify-center brutal-border bg-lime brutal-shadow"
          style={{
            animation: complete
              ? "markSettle 500ms cubic-bezier(.2,1.4,.4,1) forwards"
              : "markSpin 2.4s cubic-bezier(.65,0,.35,1) infinite",
          }}
        >
          <Boxes
            size={28}
            strokeWidth={2.5}
            style={{
              animation: complete
                ? "none"
                : "markSpinReverse 2.4s cubic-bezier(.65,0,.35,1) infinite",
            }}
          />
        </span>

        <div>
          <div className="text-xl font-bold tracking-tight">
            {complete ? "READY" : "LAUNCHING PLAYGROUND"}
          </div>
          <div
            key={stepIndex}
            className="mt-2 font-mono text-xs text-muted animate-[stepIn_320ms_ease-out]"
          >
            {complete ? "Opening workspace…" : `${STEPS[stepIndex]}…`}
          </div>
        </div>

        {/* Step checklist — shows what the product actually does on load. */}
        <div className="flex w-full flex-col gap-1.5">
          {STEPS.map((step, i) => {
            const done = i < stepIndex || complete;
            const active = i === stepIndex && !complete;
            return (
              <div
                key={step}
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide transition-all duration-300"
                style={{
                  opacity: done || active ? 1 : 0.3,
                  transform: active ? "translateX(2px)" : "translateX(0)",
                }}
              >
                <span
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center border-2 border-ink transition-colors duration-300"
                  style={{
                    backgroundColor: done
                      ? "var(--lime)"
                      : active
                        ? "var(--panel)"
                        : "transparent",
                  }}
                >
                  {done && <Check size={9} strokeWidth={4} />}
                  {active && (
                    <span className="h-1 w-1 bg-ink animate-[blink_600ms_steps(2)_infinite]" />
                  )}
                </span>
                <span className={done ? "text-muted" : active ? "font-bold" : "text-muted"}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative h-3 w-full brutal-border bg-panel overflow-hidden">
          <div
            className="h-full bg-lime transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
          {/* Travelling sheen along the filled portion. */}
          <div
            className="pointer-events-none absolute inset-y-0 w-16 opacity-40"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,.9), transparent)",
              animation: "sheen 1.2s linear infinite",
            }}
          />
        </div>
        <div className="font-mono text-[11px] font-bold text-muted tabular-nums">
          {progress}%
        </div>
      </div>

      <style>{`
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes markSpin {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.08); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes markSpinReverse {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes markSettle {
          0%   { transform: rotate(0deg) scale(1); }
          60%  { transform: rotate(0deg) scale(1.18); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes ringOut {
          0%   { opacity: .6; transform: translate(-50%,-50%) scale(.8); }
          100% { opacity: 0;  transform: translate(-50%,-50%) scale(3.2); }
        }
        @keyframes sheen {
          from { transform: translateX(-4rem); }
          to   { transform: translateX(100vw); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fixed * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
