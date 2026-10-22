import { useCallback } from "react";
import { useComposeStore } from "@/store/compose-store";
import { playVisualizeSound, playErrorSound } from "@/lib/audio/sound-effects";

export function useVisualizeWithSound() {
  const visualize = useComposeStore((s) => s.visualize);

  return useCallback(() => {
    visualize();
    const { error } = useComposeStore.getState();
    if (error) {
      playErrorSound();
    } else {
      playVisualizeSound();
    }
  }, [visualize]);
}
