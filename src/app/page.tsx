"use client";

import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/layout/Hero";
import { HeroPreview } from "@/components/layout/HeroPreview";
import { FeatureSections } from "@/components/layout/FeatureSections";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="flex min-h-[calc(100svh-61px)] w-full items-center overflow-hidden py-8">
        <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 items-stretch gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-12">
          <Hero />
          <div className="hidden h-full min-h-[560px] w-full lg:block">
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
