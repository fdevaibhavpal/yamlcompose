export type ServiceCategory =
  | "application"
  | "database"
  | "cache"
  | "queue"
  | "proxy"
  | "storage"
  | "monitoring"
  | "search"
  | "ai"
  | "worker"
  | "unknown";

export interface ComposePort {
  host?: string;
  container: string;
  protocol?: "tcp" | "udp";
}

export interface ComposeEnvVar {
  key: string;
  value?: string;
  sensitive: boolean;
}

export interface ComposeVolumeMount {
  /** Named volume id, or a host/bind path (starts with "." or "/"). */
  source: string;
  target: string;
  mode?: "ro" | "rw";
  /** True when `source` is a named volume declared in top-level `volumes:`. */
  isNamedVolume: boolean;
}

export interface ComposeNetworkAttachment {
  network: string;
  alias?: string;
}

export type DependsOnCondition =
  | "service_started"
  | "service_healthy"
  | "service_completed_successfully";

export interface DependsOnEntry {
  service: string;
  condition?: DependsOnCondition;
}

export interface HealthCheck {
  test?: string | string[];
  interval?: string;
  timeout?: string;
  retries?: number;
  startPeriod?: string;
}

export interface ComposeBuild {
  context: string;
  dockerfile?: string;
}

export interface ComposeService {
  id: string;
  name: string;

  image?: string;
  imageTag?: string;
  build?: ComposeBuild;

  command?: string;
  entrypoint?: string;
  labels: ComposeEnvVar[];

  technology: string;
  technologyLabel: string;
  category: ServiceCategory;

  ports: ComposePort[];
  environment: ComposeEnvVar[];

  dependsOn: DependsOnEntry[];

  networks: ComposeNetworkAttachment[];
  volumes: ComposeVolumeMount[];

  restart?: string;
  healthcheck?: HealthCheck;

  warnings: ServiceWarning[];
}

export interface ServiceWarning {
  type:
    | "no-healthcheck"
    | "exposed-db-port"
    | "latest-tag"
    | "no-restart-policy";
  message: string;
}

export interface ComposeNetwork {
  id: string;
  name: string;
  driver: string;
  external: boolean;
  usedBy: string[];
}

export interface ComposeVolume {
  id: string;
  name: string;
  external: boolean;
  usedBy: string[];
}

export type RelationshipType = "dependency" | "network" | "volume" | "link";

export interface ComposeRelationship {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  label?: string;
  /** Present when type === "dependency". */
  condition?: DependsOnCondition;
  /** Present when type === "network": the network name the two services share. */
  network?: string;
  /** Present when type === "volume": the volume name both reference. */
  volume?: string;
}

export interface ComposeProject {
  services: ComposeService[];
  networks: ComposeNetwork[];
  volumes: ComposeVolume[];
  relationships: ComposeRelationship[];
  missingDependencies: string[];
}

export interface ParseResult {
  success: boolean;
  project?: ComposeProject;
  error?: ParseError;
}

export interface ParseError {
  message: string;
  line?: number;
  detail?: string;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
  serviceId?: string;
  relationshipId?: string;
}
