import {
  ENV_HINT_MAP,
  PORT_TECHNOLOGY_MAP,
  TECHNOLOGY_MAP,
  normalizeTechnologyKey,
} from "./technology-map";
import type { ServiceCategory } from "@/types/compose";

export interface DetectionResult {
  technology: string;
  technologyLabel: string;
  category: ServiceCategory;
  confidence: number;
}

function lookup(key: string): DetectionResult | null {
  const normalized = normalizeTechnologyKey(key);
  const direct = TECHNOLOGY_MAP[normalized];
  if (direct) {
    return {
      technology: normalized,
      technologyLabel: direct.label,
      category: direct.category,
      confidence: 1,
    };
  }

  // Try partial match (e.g. "my-postgres-db" contains "postgres")
  for (const [techKey, info] of Object.entries(TECHNOLOGY_MAP)) {
    if (normalized.includes(techKey)) {
      return {
        technology: techKey,
        technologyLabel: info.label,
        category: info.category,
        confidence: 0.85,
      };
    }
  }

  return null;
}

export function detectTechnology(params: {
  name: string;
  image?: string;
  build?: string;
  ports: string[];
  envKeys: string[];
}): DetectionResult {
  const { name, image, build, ports, envKeys } = params;

  if (image) {
    const imageName = image.split(":")[0].split("/").pop() ?? image;
    const result = lookup(imageName);
    if (result) return result;
  }

  if (build) {
    const result = lookup(name);
    if (result) return { ...result, confidence: 0.6 };
  }

  const nameResult = lookup(name);
  if (nameResult) return { ...nameResult, confidence: 0.75 };

  for (const envKey of envKeys) {
    const upperKey = envKey.toUpperCase();
    const hint = ENV_HINT_MAP[upperKey];
    if (hint) {
      const result = lookup(hint);
      if (result) return { ...result, confidence: 0.5 };
    }
  }

  for (const port of ports) {
    const containerPort = port.split(":").pop()?.split("/")[0];
    if (containerPort && PORT_TECHNOLOGY_MAP[containerPort]) {
      const result = lookup(PORT_TECHNOLOGY_MAP[containerPort]);
      if (result) return { ...result, confidence: 0.4 };
    }
  }

  return {
    technology: "unknown",
    technologyLabel: build ? "Custom Build" : "Container",
    category: build ? "application" : "unknown",
    confidence: 0.1,
  };
}
