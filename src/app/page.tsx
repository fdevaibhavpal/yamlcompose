"use client";

import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/layout/Hero";
import { HeroPreview } from "@/components/layout/HeroPreview";
import { FeatureSections } from "@/components/layout/FeatureSections";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="flex w-full items-center overflow-hidden py-8 lg:min-h-[calc(100svh-61px)]">
        <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 items-stretch gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-12">
          <Hero />
          <div className="h-[420px] w-full sm:h-[480px] lg:h-full lg:min-h-[560px]">
            <HeroPreview />
          </div>
        </div>
      </section>

      <FeatureSections />

      <footer className="border-t-2 border-ink bg-panel px-4 py-6 text-center text-xs font-mono text-muted sm:px-6">
        YAMLCompose — your YAML never leaves your browser.
      </footer>
    </div>
  );
}
