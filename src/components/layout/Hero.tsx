"use client";

import { Zap, ShieldCheck, FileText } from "lucide-react";
import { PlaygroundCta } from "./PlaygroundCta";

export function Hero() {
  return (
    <div className="flex h-full flex-col justify-center gap-5">
      <div>
        <div className="mb-3 flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-muted">
          <span className="h-px w-8 bg-ink" />
          Visualize your infrastructure
        </div>

        <div className="relative inline-block">
          <h1 className="text-[clamp(2.5rem,6.5vw,4.25rem)] font-bold leading-[0.95] tracking-tight">
            DOCKER
            <br />
            COMPOSE
            <br />
            VISUALIZER
          </h1>
          <div className="absolute -right-2 top-1 hidden -rotate-6 brutal-border bg-lime px-3 py-2 text-center text-[11px] font-mono font-bold leading-tight sm:block md:-right-6 lg:-right-10">
            YAML
            <br />
            TO
            <br />
            DIAGRAM
            <br />
            →
          </div>
        </div>
      </div>

      <p className="max-w-md text-[15px] leading-relaxed text-muted">
        Paste your docker-compose.yml and instantly get an interactive
        architecture diagram. Runs entirely in your browser. No signup. No
        data leaves your device.
      </p>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Zap size={18} strokeWidth={2.5} className="shrink-0" />
          <div>
            <div className="text-sm font-bold leading-none">100% FREE</div>
            <div className="text-xs text-muted leading-tight mt-0.5">No sign up</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} strokeWidth={2.5} className="shrink-0" />
          <div>
            <div className="text-sm font-bold leading-none">PRIVATE</div>
            <div className="text-xs text-muted leading-tight mt-0.5">
              Runs in your browser
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileText size={18} strokeWidth={2.5} className="shrink-0" />
          <div>
            <div className="text-sm font-bold leading-none">OPEN SOURCE</div>
            <div className="text-xs text-muted leading-tight mt-0.5">
              View on GitHub
            </div>
          </div>
        </div>
      </div>

      <div className="pt-1">
        <PlaygroundCta />
      </div>
    </div>
  );
}
