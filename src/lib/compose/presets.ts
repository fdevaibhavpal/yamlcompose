import type { ServiceCategory } from "@/types/compose";
import type { NewServiceInput } from "@/lib/compose/mutations";

export interface ServicePreset {
  id: string;
  label: string;
  category: ServiceCategory;
  build: (name: string) => Omit<NewServiceInput, "name">;
}

export const DATABASE_PRESETS: ServicePreset[] = [
  {
    id: "postgres",
    label: "PostgreSQL",
    category: "database",
    build: () => ({
      image: "postgres:17",
      ports: [{ host: "5432", container: "5432" }],
      environment: [
        { key: "POSTGRES_DB", value: "app" },
        { key: "POSTGRES_USER", value: "app" },
        { key: "POSTGRES_PASSWORD", value: "app" },
      ],
      restart: "unless-stopped",
    }),
  },
  {
    id: "mysql",
    label: "MySQL",
    category: "database",
    build: () => ({
      image: "mysql:8",
      ports: [{ host: "3306", container: "3306" }],
      environment: [
        { key: "MYSQL_DATABASE", value: "app" },
        { key: "MYSQL_USER", value: "app" },
        { key: "MYSQL_PASSWORD", value: "app" },
        { key: "MYSQL_ROOT_PASSWORD", value: "root" },
      ],
      restart: "unless-stopped",
    }),
  },
  {
    id: "mariadb",
    label: "MariaDB",
    category: "database",
    build: () => ({
      image: "mariadb:11",
      ports: [{ host: "3306", container: "3306" }],
      environment: [
        { key: "MARIADB_DATABASE", value: "app" },
        { key: "MARIADB_USER", value: "app" },
        { key: "MARIADB_PASSWORD", value: "app" },
        { key: "MARIADB_ROOT_PASSWORD", value: "root" },
      ],
      restart: "unless-stopped",
    }),
  },
  {
    id: "mongodb",
    label: "MongoDB",
    category: "database",
    build: () => ({
      image: "mongo:7",
      ports: [{ host: "27017", container: "27017" }],
      environment: [
        { key: "MONGO_INITDB_ROOT_USERNAME", value: "app" },
        { key: "MONGO_INITDB_ROOT_PASSWORD", value: "app" },
      ],
      restart: "unless-stopped",
    }),
  },
  {
    id: "redis",
    label: "Redis",
    category: "cache",
    build: () => ({
      image: "redis:7",
      ports: [{ host: "6379", container: "6379" }],
      restart: "unless-stopped",
    }),
  },
];

export const CACHE_PRESETS: ServicePreset[] = [
  DATABASE_PRESETS.find((p) => p.id === "redis")!,
  {
    id: "memcached",
    label: "Memcached",
    category: "cache",
    build: () => ({
      image: "memcached:1.6",
      ports: [{ host: "11211", container: "11211" }],
      restart: "unless-stopped",
    }),
  },
];

export const PROXY_PRESETS: ServicePreset[] = [
  {
    id: "nginx",
    label: "Nginx",
    category: "proxy",
    build: () => ({
      image: "nginx:alpine",
      ports: [
        { host: "80", container: "80" },
        { host: "443", container: "443" },
      ],
      restart: "unless-stopped",
    }),
  },
  {
    id: "traefik",
    label: "Traefik",
    category: "proxy",
    build: () => ({
      image: "traefik:v3",
      ports: [
        { host: "80", container: "80" },
        { host: "8080", container: "8080" },
      ],
      restart: "unless-stopped",
    }),
  },
  {
    id: "caddy",
    label: "Caddy",
    category: "proxy",
    build: () => ({
      image: "caddy:2-alpine",
      ports: [
        { host: "80", container: "80" },
        { host: "443", container: "443" },
      ],
      restart: "unless-stopped",
    }),
  },
];

export const WORKER_PRESETS: ServicePreset[] = [
  {
    id: "generic-worker",
    label: "Background Worker",
    category: "worker",
    build: () => ({
      image: "node:22",
      command: "npm run worker",
      restart: "on-failure",
    }),
  },
];

export const EXTERNAL_PRESETS: ServicePreset[] = [
  {
    id: "external-api",
    label: "External Service",
    category: "unknown",
    build: () => ({
      image: "alpine:latest",
    }),
  },
];

export type AddNodeCategory =
  | "service"
  | "database"
  | "cache"
  | "worker"
  | "proxy"
  | "external";

export const PRESETS_BY_ADD_CATEGORY: Record<AddNodeCategory, ServicePreset[]> = {
  service: [],
  database: DATABASE_PRESETS,
  cache: CACHE_PRESETS,
  worker: WORKER_PRESETS,
  proxy: PROXY_PRESETS,
  external: EXTERNAL_PRESETS,
};
