import { parse as parseYaml } from "yaml";
import { detectTechnology } from "@/lib/technology/detector";
import type {
  ComposeBuild,
  ComposeEnvVar,
  ComposeNetwork,
  ComposeNetworkAttachment,
  ComposePort,
  ComposeRelationship,
  ComposeService,
  ComposeVolume,
  ComposeVolumeMount,
  DependsOnCondition,
  DependsOnEntry,
  HealthCheck,
  ParseError,
  ParseResult,
  ServiceWarning,
} from "@/types/compose";

const SENSITIVE_KEY_PATTERN =
  /(password|secret|token|key|credential|private|auth)/i;

const VALID_CONDITIONS = new Set<DependsOnCondition>([
  "service_started",
  "service_healthy",
  "service_completed_successfully",
]);

function toArray<T = unknown>(value: unknown): T[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value as T[];
  return [value as T];
}

function parsePorts(raw: unknown): ComposePort[] {
  const entries = toArray<string | number | Record<string, unknown>>(raw);
  const ports: ComposePort[] = [];

  for (const entry of entries) {
    if (typeof entry === "string" || typeof entry === "number") {
      const str = String(entry);
      const [proto, portsPart] = str.includes("/")
        ? [str.split("/")[1], str.split("/")[0]]
        : [undefined, str];
      const protocol = proto === "udp" ? "udp" : proto === "tcp" ? "tcp" : undefined;
      const parts = portsPart.split(":");
      if (parts.length === 1) {
        ports.push({ container: parts[0], protocol });
      } else {
        ports.push({
          host: parts[0],
          container: parts[parts.length - 1],
          protocol,
        });
      }
    } else if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      const container = String(obj.target ?? "");
      const host = obj.published != null ? String(obj.published) : undefined;
      const protocolRaw = obj.protocol ? String(obj.protocol) : undefined;
      ports.push({
        host,
        container,
        protocol: protocolRaw === "udp" ? "udp" : protocolRaw === "tcp" ? "tcp" : undefined,
      });
    }
  }

  return ports;
}

function parseEnvironment(raw: unknown): ComposeEnvVar[] {
  const result: ComposeEnvVar[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const str = String(item);
      const eq = str.indexOf("=");
      if (eq === -1) {
        result.push({ key: str, sensitive: false });
      } else {
        const key = str.slice(0, eq);
        const value = str.slice(eq + 1);
        result.push({
          key,
          value,
          sensitive: SENSITIVE_KEY_PATTERN.test(key),
        });
      }
    }
  } else if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw)) {
      result.push({
        key,
        value: value != null ? String(value) : undefined,
        sensitive: SENSITIVE_KEY_PATTERN.test(key),
      });
    }
  }

  return result;
}

/** Shared shape for environment-like key/value lists (env vars, labels). */
function parseKeyValueList(raw: unknown): ComposeEnvVar[] {
  return parseEnvironment(raw).map((e) => ({ ...e, sensitive: false }));
}

function parseHealthcheck(raw: unknown): HealthCheck | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  if (obj.disable) return undefined;
  return {
    test: obj.test as string | string[] | undefined,
    interval: obj.interval ? String(obj.interval) : undefined,
    timeout: obj.timeout ? String(obj.timeout) : undefined,
    retries: obj.retries != null ? Number(obj.retries) : undefined,
    startPeriod: obj.start_period ? String(obj.start_period) : undefined,
  };
}

function parseBuild(raw: unknown): ComposeBuild | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return { context: raw };
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return {
      context: obj.context ? String(obj.context) : "./",
      dockerfile: obj.dockerfile ? String(obj.dockerfile) : undefined,
    };
  }
  return undefined;
}

function parseDependsOn(raw: unknown): DependsOnEntry[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((s) => ({ service: String(s) }));
  }
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>).map(([service, value]) => {
      const obj = (value ?? {}) as Record<string, unknown>;
      const conditionRaw = obj.condition ? String(obj.condition) : undefined;
      const condition =
        conditionRaw && VALID_CONDITIONS.has(conditionRaw as DependsOnCondition)
          ? (conditionRaw as DependsOnCondition)
          : undefined;
      return { service, condition };
    });
  }
  return [];
}

function parseServiceNetworks(raw: unknown): ComposeNetworkAttachment[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((n) => ({ network: String(n) }));
  }
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>).map(([network, value]) => {
      const obj = (value ?? {}) as Record<string, unknown>;
      return {
        network,
        alias: Array.isArray(obj.aliases) ? String(obj.aliases[0]) : undefined,
      };
    });
  }
  return [];
}

function parseServiceVolumes(raw: unknown): ComposeVolumeMount[] {
  const entries = toArray<string | Record<string, unknown>>(raw);
  const mounts: ComposeVolumeMount[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      const parts = entry.split(":");
      const source = parts[0];
      const target = parts[1] ?? "";
      const modeRaw = parts[2];
      const isNamedVolume = !source.startsWith(".") && !source.startsWith("/");
      mounts.push({
        source,
        target,
        mode: modeRaw === "ro" ? "ro" : modeRaw === "rw" ? "rw" : undefined,
        isNamedVolume,
      });
    } else if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      const source = String(obj.source ?? "");
      mounts.push({
        source,
        target: String(obj.target ?? ""),
        mode: obj.read_only ? "ro" : undefined,
        isNamedVolume: obj.type === "volume",
      });
    }
  }

  return mounts;
}

function buildWarnings(
  service: Omit<ComposeService, "warnings">
): ServiceWarning[] {
  const warnings: ServiceWarning[] = [];

  if (!service.healthcheck) {
    warnings.push({
      type: "no-healthcheck",
      message: "No healthcheck configured",
    });
  }

  if (service.category === "database") {
    const hasHostExposed = service.ports.some((p) => p.host);
    if (hasHostExposed) {
      const portLabel = service.ports.find((p) => p.host)?.container;
      warnings.push({
        type: "exposed-db-port",
        message: `Container exposes database port ${portLabel ?? ""}`.trim(),
      });
    }
  }

  if (service.image?.endsWith(":latest") || (service.image && !service.image.includes(":"))) {
    warnings.push({
      type: "latest-tag",
      message: "Using latest image tag",
    });
  }

  if (!service.restart) {
    warnings.push({
      type: "no-restart-policy",
      message: "No restart policy",
    });
  }

  return warnings;
}

function stringifyCommand(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) return raw.map(String).join(" ");
  return String(raw);
}

export function parseComposeFile(yamlText: string): ParseResult {
  if (!yamlText || !yamlText.trim()) {
    return {
      success: false,
      error: { message: "The Compose file is empty." },
    };
  }

  let doc: unknown;
  try {
    doc = parseYaml(yamlText, { strict: false });
  } catch (err) {
    const error = err as { message?: string; linePos?: Array<{ line: number }> };
    return {
      success: false,
      error: {
        message: "Invalid YAML syntax",
        line: error.linePos?.[0]?.line,
        detail: error.message,
      } satisfies ParseError,
    };
  }

  if (!doc || typeof doc !== "object") {
    return {
      success: false,
      error: { message: "The Compose file does not contain a valid mapping." },
    };
  }

  const root = doc as Record<string, unknown>;
  const servicesRaw = root.services;

  if (!servicesRaw || typeof servicesRaw !== "object") {
    return {
      success: false,
      error: {
        message: "No `services` key found",
        detail: "A valid Compose file must define at least one service.",
      },
    };
  }

  const services: ComposeService[] = [];
  const serviceNames = new Set(Object.keys(servicesRaw as object));

  for (const [name, rawValue] of Object.entries(
    servicesRaw as Record<string, unknown>
  )) {
    const raw = (rawValue ?? {}) as Record<string, unknown>;

    const image = raw.image ? String(raw.image) : undefined;
    const imageTag = image?.includes(":") ? image.split(":").pop() : undefined;
    const build = parseBuild(raw.build);

    const ports = parsePorts(raw.ports);
    const environment = parseEnvironment(raw.environment);
    const labels = parseKeyValueList(raw.labels);
    const dependsOn = parseDependsOn(raw.depends_on);
    const networks = parseServiceNetworks(raw.networks);
    const volumes = parseServiceVolumes(raw.volumes);
    const healthcheck = parseHealthcheck(raw.healthcheck);
    const restart = raw.restart ? String(raw.restart) : undefined;
    const command = stringifyCommand(raw.command);
    const entrypoint = stringifyCommand(raw.entrypoint);

    const detection = detectTechnology({
      name,
      image,
      build: build?.context,
      ports: ports.map((p) => (p.host ? `${p.host}:${p.container}` : p.container)),
      envKeys: environment.map((e) => e.key),
    });

    const base: Omit<ComposeService, "warnings"> = {
      id: name,
      name,
      image,
      imageTag,
      build,
      command,
      entrypoint,
      labels,
      technology: detection.technology,
      technologyLabel: detection.technologyLabel,
      category: detection.category,
      ports,
      environment,
      dependsOn,
      networks,
      volumes,
      restart,
      healthcheck,
    };

    services.push({
      ...base,
      warnings: buildWarnings(base),
    });
  }

  const networksRaw = (root.networks ?? {}) as Record<string, unknown>;
  const networks: ComposeNetwork[] = Object.entries(networksRaw).map(
    ([name, value]) => {
      const obj = (value ?? {}) as Record<string, unknown>;
      const usedBy = services
        .filter((s) => s.networks.some((n) => n.network === name))
        .map((s) => s.id);
      return {
        id: name,
        name,
        driver: obj.driver ? String(obj.driver) : "bridge",
        external: Boolean(obj.external),
        usedBy,
      };
    }
  );

  // Implicit default network if services declare none explicitly but multiple services exist
  const servicesWithNoNetwork = services.filter((s) => s.networks.length === 0);
  if (networks.length === 0 && services.length > 1) {
    networks.push({
      id: "default",
      name: "default",
      driver: "bridge",
      external: false,
      usedBy: servicesWithNoNetwork.map((s) => s.id),
    });
  }

  const volumesRaw = (root.volumes ?? {}) as Record<string, unknown>;
  const volumeNamesDeclared = new Set(Object.keys(volumesRaw));
  const allVolumeNames = new Set<string>([
    ...volumeNamesDeclared,
    ...services.flatMap((s) => s.volumes.filter((v) => v.isNamedVolume).map((v) => v.source)),
  ]);

  const volumes: ComposeVolume[] = Array.from(allVolumeNames).map((name) => {
    const obj = (volumesRaw[name] ?? {}) as Record<string, unknown>;
    const usedBy = services
      .filter((s) => s.volumes.some((v) => v.isNamedVolume && v.source === name))
      .map((s) => s.id);
    return {
      id: name,
      name,
      external: Boolean(obj.external),
      usedBy,
    };
  });

  const relationships: ComposeRelationship[] = [];
  const missingDependencies: string[] = [];

  for (const service of services) {
    for (const dep of service.dependsOn) {
      if (!serviceNames.has(dep.service)) {
        missingDependencies.push(
          `${service.name} depends_on "${dep.service}", but no service named "${dep.service}" exists.`
        );
        continue;
      }
      relationships.push({
        id: `dep-${service.id}-${dep.service}`,
        source: service.id,
        target: dep.service,
        type: "dependency",
        condition: dep.condition,
      });
    }
  }

  // Network relationships: connect every pair of services sharing a non-default network.
  for (const network of networks) {
    if (network.id === "default") continue;
    for (let i = 0; i < network.usedBy.length; i++) {
      for (let j = i + 1; j < network.usedBy.length; j++) {
        relationships.push({
          id: `net-${network.id}-${network.usedBy[i]}-${network.usedBy[j]}`,
          source: network.usedBy[i],
          target: network.usedBy[j],
          type: "network",
          network: network.name,
          label: network.name,
        });
      }
    }
  }

  return {
    success: true,
    project: { services, networks, volumes, relationships, missingDependencies },
  };
}
