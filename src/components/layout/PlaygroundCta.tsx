"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { LaunchOverlay } from "./LaunchOverlay";
import { playLaunchSound } from "@/lib/audio/sound-effects";

const LAUNCH_DURATION_MS = 4100;

export function PlaygroundCta({ className }: { className?: string }) {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (launching) return;
    setLaunching(true);
    playLaunchSound();
    router.prefetch("/playground");
    setTimeout(() => {
      router.push("/playground");
    }, LAUNCH_DURATION_MS);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={
          className ??
          "flex items-center justify-center gap-2 brutal-border bg-lime px-6 py-3.5 text-sm font-bold uppercase tracking-wide brutal-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:brutal-shadow-lg active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
        }
      >
        Launch Playground
        <ArrowRight size={16} strokeWidth={2.5} />
      </button>
      {launching && <LaunchOverlay />}
    </>
  );
}
