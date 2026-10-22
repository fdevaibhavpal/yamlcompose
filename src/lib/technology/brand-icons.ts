import * as simpleIcons from "simple-icons";

type SimpleIcon = { title: string; hex: string; path: string };

// Map our internal technology keys to simple-icons export names (siXxx)
const TECH_TO_ICON_EXPORT: Record<string, string> = {
  postgres: "siPostgresql",
  mysql: "siMysql",
  mariadb: "siMariadb",
  mongodb: "siMongodb",
  cassandra: "siApachecassandra",
  cockroachdb: "siCockroachlabs",
  sqlite: "siSqlite",
  influxdb: "siInfluxdb",
  neo4j: "siNeo4j",
  couchdb: "siApachecouchdb",
  clickhouse: "siClickhouse",
  supabase: "siSupabase",

  redis: "siRedis",

  rabbitmq: "siRabbitmq",
  kafka: "siApachekafka",
  nats: "siNatsdotio",
  celery: "siCelery",

  nginx: "siNginx",
  traefik: "siTraefikmesh",
  caddy: "siCaddy",
  envoy: "siEnvoyproxy",

  node: "siNodedotjs",
  nodejs: "siNodedotjs",
  python: "siPython",
  golang: "siGo",
  go: "siGo",
  java: "siOpenjdk",
  openjdk: "siOpenjdk",
  ruby: "siRuby",
  php: "siPhp",
  rust: "siRust",
  dotnet: "siDotnet",
  django: "siDjango",
  flask: "siFlask",
  fastapi: "siFastapi",
  rails: "siRubyonrails",
  laravel: "siLaravel",
  spring: "siSpring",
  express: "siExpress",
  nextjs: "siNextdotjs",
  "next.js": "siNextdotjs",
  react: "siReact",
  vue: "siVuedotjs",
  angular: "siAngular",
  deno: "siDeno",
  bun: "siBun",

  minio: "siMinio",

  elasticsearch: "siElasticsearch",
  opensearch: "siOpensearch",
  solr: "siApachesolr",
  meilisearch: "siMeilisearch",
  algolia: "siAlgolia",

  prometheus: "siPrometheus",
  grafana: "siGrafana",
  jaeger: "siJaeger",
  loki: "siGrafana",
  sentry: "siSentry",
  datadog: "siDatadog",

  ollama: "siOllama",
  langchain: "siLangchain",
  qdrant: "siQdrant",
  tensorflow: "siTensorflow",
  pytorch: "siPytorch",
  huggingface: "siHuggingface",

  docker: "siDocker",
  alpine: "siAlpinelinux",
  ubuntu: "siUbuntu",
  keycloak: "siKeycloak",
  vault: "siVault",
  consul: "siConsul",
  portainer: "siPortainer",
};

const iconsLib = simpleIcons as unknown as Record<string, SimpleIcon>;

export function getBrandIcon(
  technology: string
): { path: string; hex: string; title: string } | null {
  const exportName = TECH_TO_ICON_EXPORT[technology];
  if (!exportName) return null;
  const icon = iconsLib[exportName];
  if (!icon) return null;
  return { path: icon.path, hex: icon.hex, title: icon.title };
}
