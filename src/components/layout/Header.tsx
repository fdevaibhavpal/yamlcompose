"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";
import { GithubMark } from "@/components/icons/GithubMark";
import { playNavigationSound } from "@/lib/audio/sound-effects";

export function Header({ variant = "home" }: { variant?: "home" | "playground" }) {
  const nav = () => playNavigationSound();

  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" onClick={nav} className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center brutal-border bg-lime">
              <Boxes size={18} strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold tracking-tight">YAMLCompose</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-semibold tracking-wide lg:flex">
          {variant === "playground" && (
            <Link href="/" onClick={nav} className="hover:underline underline-offset-4">
              HOME
            </Link>
          )}
          <Link href="/#explore" onClick={nav} className="hover:underline underline-offset-4">
            EXPLORE
          </Link>
          <Link href="/#examples" onClick={nav} className="hover:underline underline-offset-4">
            EXAMPLES
          </Link>
          <Link href="/#features" onClick={nav} className="hover:underline underline-offset-4">
            FEATURES
          </Link>
        </nav>

        <a
          href="https://github.com/fdevaibhavpal/yamlcompose"
          target="_blank"
          rel="noopener noreferrer"
          onClick={nav}
          className="flex items-center gap-2 brutal-border bg-ink px-3 py-2 text-xs font-mono font-bold text-paper brutal-shadow-sm hover:bg-[#1a1a1a] transition-colors sm:text-sm"
        >
          <GithubMark size={14} />
          <span className="hidden sm:inline">VIEW ON GITHUB</span>
          <span className="sm:hidden">GITHUB</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </header>
  );
}
