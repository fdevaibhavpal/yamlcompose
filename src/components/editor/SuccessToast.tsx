"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

const TOAST_DURATION_MS = 3000;

export function SuccessToast() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="pointer-events-none flex items-center gap-1.5 brutal-border bg-[#e3f6ea] px-2.5 py-1.5 brutal-shadow-sm transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(6px)",
      }}
    >
      <CheckCircle2 size={13} strokeWidth={2.5} className="text-[#1f9254] shrink-0" />
      <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-[#1f9254] whitespace-nowrap">
        Valid configuration
      </span>
    </div>
  );
}
