import type { ServiceCategory } from "@/types/compose";
import {
  Globe,
  Box,
  Database,
  Zap,
  Network,
  Shield,
  Cog,
  HardDrive,
  Search,
  Activity,
  Sparkles,
  Package,
  type LucideIcon,
} from "lucide-react";

export interface CategoryStyle {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const CATEGORY_STYLES: Record<ServiceCategory, CategoryStyle> = {
  application: {
    label: "SERVICE",
    icon: Box,
    color: "var(--cat-service)",
    bg: "var(--cat-service-bg)",
  },
  database: {
    label: "DATABASE",
    icon: Database,
    color: "var(--cat-database)",
    bg: "var(--cat-database-bg)",
  },
  cache: {
    label: "CACHE",
    icon: Zap,
    color: "var(--cat-cache)",
    bg: "var(--cat-cache-bg)",
  },
  queue: {
    label: "QUEUE",
    icon: Network,
    color: "var(--cat-queue)",
    bg: "var(--cat-queue-bg)",
  },
  proxy: {
    label: "PROXY",
    icon: Shield,
    color: "var(--cat-proxy)",
    bg: "var(--cat-proxy-bg)",
  },
  worker: {
    label: "WORKER",
    icon: Cog,
    color: "var(--cat-worker)",
    bg: "var(--cat-worker-bg)",
  },
  storage: {
    label: "STORAGE",
    icon: HardDrive,
    color: "var(--cat-storage)",
    bg: "var(--cat-storage-bg)",
  },
  search: {
    label: "SEARCH",
    icon: Search,
    color: "var(--cat-search)",
    bg: "var(--cat-search-bg)",
  },
  monitoring: {
    label: "MONITORING",
    icon: Activity,
    color: "var(--cat-monitoring)",
    bg: "var(--cat-monitoring-bg)",
  },
  ai: {
    label: "AI",
    icon: Sparkles,
    color: "var(--cat-ai)",
    bg: "var(--cat-ai-bg)",
  },
  unknown: {
    label: "CONTAINER",
    icon: Package,
    color: "var(--cat-unknown)",
    bg: "var(--cat-unknown-bg)",
  },
};

export function getCategoryStyle(category: ServiceCategory): CategoryStyle {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES.unknown;
}

export { Globe };
