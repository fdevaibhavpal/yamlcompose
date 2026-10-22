"use client";

import { useState } from "react";
import { Link2, Copy, Trash2 } from "lucide-react";
import type { Node } from "@xyflow/react";
import { useComposeStore } from "@/store/compose-store";
import { ConnectPicker } from "./ConnectPicker";
import { DeleteServiceDialog } from "./DeleteServiceDialog";
import { playClickSound, playSuccessSound } from "@/lib/audio/sound-effects";

export function NodeToolbar({ node }: { node: Node }) {
  const [showConnect, setShowConnect] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const duplicateServiceAction = useComposeStore((s) => s.duplicateServiceAction);

  const x = node.position.x + (node.width ?? 240) / 2;
  const y = node.position.y;

  return (
    <>
      <div
        className="absolute z-20 flex items-center gap-1 brutal-border bg-ink p-1 brutal-shadow-sm"
        style={{
          left: x,
          top: y,
          transform: "translate(-50%, calc(-100% - 10px))",
        }}
      >
        <button
          onClick={() => {
            playClickSound();
            setShowConnect(true);
          }}
          className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-mono font-bold uppercase text-paper hover:bg-lime hover:text-ink transition-colors"
          title="Connect to another service"
        >
          <Link2 size={13} strokeWidth={2.5} />
          Connect
        </button>
        <button
          onClick={() => {
            playSuccessSound();
            duplicateServiceAction(node.id);
          }}
          className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-mono font-bold uppercase text-paper hover:bg-lime hover:text-ink transition-colors"
          title="Duplicate service"
        >
          <Copy size={13} strokeWidth={2.5} />
          Duplicate
        </button>
        <button
          onClick={() => {
            playClickSound();
            setShowDelete(true);
          }}
          className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-mono font-bold uppercase text-[#ff8a9b] hover:bg-[#e0344c] hover:text-paper transition-colors"
          title="Delete service"
        >
          <Trash2 size={13} strokeWidth={2.5} />
          Delete
        </button>
      </div>

      {showConnect && <ConnectPicker sourceId={node.id} onClose={() => setShowConnect(false)} />}
      {showDelete && (
        <DeleteServiceDialog serviceId={node.id} onClose={() => setShowDelete(false)} />
      )}
    </>
  );
}
