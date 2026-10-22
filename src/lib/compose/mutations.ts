import type {
  ComposeNetwork,
  ComposeNetworkAttachment,
  ComposeProject,
  ComposeService,
  ComposeVolumeMount,
  DependsOnCondition,
  RelationshipType,
  ServiceCategory,
} from "@/types/compose";
import { detectTechnology } from "@/lib/technology/detector";

export class ComposeMutationError extends Error {}

function cloneProject(project: ComposeProject): ComposeProject {
  return {
    services: project.services.map((s) => ({
      ...s,
      build: s.build ? { ...s.build } : undefined,
      labels: s.labels.map((l) => ({ ...l })),
      ports: s.ports.map((p) => ({ ...p })),
      environment: s.environment.map((e) => ({ ...e })),
      dependsOn: s.dependsOn.map((d) => ({ ...d })),
      networks: s.networks.map((n) => ({ ...n })),
      volumes: s.volumes.map((v) => ({ ...v })),
      healthcheck: s.healthcheck ? { ...s.healthcheck } : undefined,
      warnings: s.warnings.map((w) => ({ ...w })),
    })),
    networks: project.networks.map((n) => ({ ...n, usedBy: [...n.usedBy] })),
    volumes: project.volumes.map((v) => ({ ...v, usedBy: [...v.usedBy] })),
    relationships: project.relationships.map((r) => ({ ...r })),
    missingDependencies: [...project.missingDependencies],
  };
}

function findServiceOrThrow(project: ComposeProject, id: string): ComposeService {
  const service = project.services.find((s) => s.id === id);
  if (!service) {
    throw new ComposeMutationError(`Service "${id}" does not exist.`);
  }
  return service;
}

function recomputeDerivedFields(project: ComposeProject): void {
  // Recompute network/volume usedBy lists and relationships from scratch —
  // cheaper and far less error-prone than incrementally patching them.
  for (const net of project.networks) {
    net.usedBy = project.services
      .filter((s) => s.networks.some((n) => n.network === net.name))
      .map((s) => s.id);
  }
  for (const vol of project.volumes) {
    vol.usedBy = project.services
      .filter((s) => s.volumes.some((v) => v.isNamedVolume && v.source === vol.name))
      .map((s) => s.id);
  }

  const serviceIds = new Set(project.services.map((s) => s.id));
  const relationships: ComposeProject["relationships"] = [];
  const missingDependencies: string[] = [];

  for (const service of project.services) {
    for (const dep of service.dependsOn) {
      if (!serviceIds.has(dep.service)) {
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

  for (const net of project.networks) {
    if (net.id === "default") continue;
    for (let i = 0; i < net.usedBy.length; i++) {
      for (let j = i + 1; j < net.usedBy.length; j++) {
        relationships.push({
          id: `net-${net.id}-${net.usedBy[i]}-${net.usedBy[j]}`,
          source: net.usedBy[i],
          target: net.usedBy[j],
          type: "network",
          network: net.name,
          label: net.name,
        });
      }
    }
  }

  project.relationships = relationships;
  project.missingDependencies = missingDependencies;
}

function ensureDefaultNetworkConsistency(project: ComposeProject): void {
  const servicesWithNoNetwork = project.services.filter((s) => s.networks.length === 0);
  const namedNetworks = project.networks.filter((n) => n.id !== "default");

  if (namedNetworks.length === 0 && project.services.length > 1) {
    const existingDefault = project.networks.find((n) => n.id === "default");
    if (existingDefault) {
      existingDefault.usedBy = servicesWithNoNetwork.map((s) => s.id);
    } else {
      project.networks.push({
        id: "default",
        name: "default",
        driver: "bridge",
        external: false,
        usedBy: servicesWithNoNetwork.map((s) => s.id),
      });
    }
  } else {
    project.networks = project.networks.filter((n) => n.id !== "default");
  }
}

/** Applies `fn` to a cloned project, then recomputes all derived fields. Never mutates the input. */
function withMutation(
  project: ComposeProject,
  fn: (draft: ComposeProject) => void
): ComposeProject {
  const draft = cloneProject(project);
  fn(draft);
  ensureDefaultNetworkConsistency(draft);
  recomputeDerivedFields(draft);
  return draft;
}

// ---------------------------------------------------------------------------
// Service name validation
// ---------------------------------------------------------------------------

const SERVICE_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;

export function isValidServiceName(name: string): boolean {
  return SERVICE_NAME_PATTERN.test(name);
}

export function generateUniqueServiceName(
  project: ComposeProject,
  baseName: string
): string {
  const existing = new Set(project.services.map((s) => s.name));
  if (!existing.has(baseName)) return baseName;
  let i = 2;
  while (existing.has(`${baseName}-${i}`)) i++;
  return `${baseName}-${i}`;
}

// ---------------------------------------------------------------------------
// Service CRUD
// ---------------------------------------------------------------------------

export interface NewServiceInput {
  name: string;
  image?: string;
  buildContext?: string;
  buildDockerfile?: string;
  command?: string;
  entrypoint?: string;
  ports?: Array<{ host?: string; container: string; protocol?: "tcp" | "udp" }>;
  environment?: Array<{ key: string; value?: string }>;
  restart?: string;
  category?: ServiceCategory;
}

export function addService(
  project: ComposeProject,
  input: NewServiceInput
): ComposeProject {
  if (project.services.some((s) => s.name === input.name)) {
    throw new ComposeMutationError(`A service named "${input.name}" already exists.`);
  }
  if (!isValidServiceName(input.name)) {
    throw new ComposeMutationError(
      `"${input.name}" is not a valid service name. Use letters, numbers, dots, dashes, or underscores.`
    );
  }
  if (!input.image && !input.buildContext) {
    throw new ComposeMutationError("A service needs either an image or a build context.");
  }

  return withMutation(project, (draft) => {
    const detection = detectTechnology({
      name: input.name,
      image: input.image,
      build: input.buildContext,
      ports: (input.ports ?? []).map((p) => (p.host ? `${p.host}:${p.container}` : p.container)),
      envKeys: (input.environment ?? []).map((e) => e.key),
    });

    const service: ComposeService = {
      id: input.name,
      name: input.name,
      image: input.image,
      imageTag: input.image?.includes(":") ? input.image.split(":").pop() : undefined,
      build: input.buildContext
        ? { context: input.buildContext, dockerfile: input.buildDockerfile }
        : undefined,
      command: input.command,
      entrypoint: input.entrypoint,
      labels: [],
      technology: detection.technology,
      technologyLabel: detection.technologyLabel,
      category: input.category ?? detection.category,
      ports: (input.ports ?? []).map((p) => ({ ...p })),
      environment: (input.environment ?? []).map((e) => ({
        ...e,
        sensitive: /(password|secret|token|key|credential|private|auth)/i.test(e.key),
      })),
      dependsOn: [],
      networks: [],
      volumes: [],
      restart: input.restart,
      warnings: [],
    };

    draft.services.push(service);
  });
}

export function deleteService(
  project: ComposeProject,
  serviceId: string,
  options: { removeOrphanedVolumes?: boolean } = {}
): ComposeProject {
  findServiceOrThrow(project, serviceId);

  return withMutation(project, (draft) => {
    draft.services = draft.services.filter((s) => s.id !== serviceId);

    for (const service of draft.services) {
      service.dependsOn = service.dependsOn.filter((d) => d.service !== serviceId);
    }

    if (options.removeOrphanedVolumes) {
      const stillUsedVolumes = new Set(
        draft.services.flatMap((s) => s.volumes.filter((v) => v.isNamedVolume).map((v) => v.source))
      );
      draft.volumes = draft.volumes.filter(
        (v) => stillUsedVolumes.has(v.name) || v.external
      );
    }
  });
}

export function renameService(
  project: ComposeProject,
  serviceId: string,
  newName: string
): ComposeProject {
  const service = findServiceOrThrow(project, serviceId);
  if (service.name === newName) return project;

  if (!isValidServiceName(newName)) {
    throw new ComposeMutationError(
      `"${newName}" is not a valid service name. Use letters, numbers, dots, dashes, or underscores.`
    );
  }
  if (project.services.some((s) => s.id !== serviceId && s.name === newName)) {
    throw new ComposeMutationError(`A service named "${newName}" already exists.`);
  }

  return withMutation(project, (draft) => {
    const target = findServiceOrThrow(draft, serviceId);
    const oldName = target.id;
    target.id = newName;
    target.name = newName;

    for (const service of draft.services) {
      for (const dep of service.dependsOn) {
        if (dep.service === oldName) dep.service = newName;
      }
    }
  });
}

export function duplicateService(
  project: ComposeProject,
  serviceId: string
): ComposeProject {
  const source = findServiceOrThrow(project, serviceId);
  const newName = generateUniqueServiceName(project, `${source.name}-copy`);

  return withMutation(project, (draft) => {
    const original = findServiceOrThrow(draft, serviceId);
    const copy: ComposeService = {
      ...original,
      id: newName,
      name: newName,
      build: original.build ? { ...original.build } : undefined,
      labels: original.labels.map((l) => ({ ...l })),
      ports: original.ports.map((p) => ({ ...p })),
      environment: original.environment.map((e) => ({ ...e })),
      // Duplicated service starts with no dependents pointing to it and no
      // outgoing relationships duplicated automatically — connections are explicit.
      dependsOn: [],
      networks: original.networks.map((n) => ({ ...n })),
      volumes: original.volumes.map((v) => ({ ...v })),
      healthcheck: original.healthcheck ? { ...original.healthcheck } : undefined,
      warnings: [],
    };
    draft.services.push(copy);
  });
}

export interface ServiceFieldUpdate {
  image?: string;
  buildContext?: string;
  buildDockerfile?: string;
  command?: string;
  entrypoint?: string;
  restart?: string;
  ports?: Array<{ host?: string; container: string; protocol?: "tcp" | "udp" }>;
  environment?: Array<{ key: string; value?: string }>;
  volumes?: ComposeVolumeMount[];
}

export function updateServiceFields(
  project: ComposeProject,
  serviceId: string,
  update: ServiceFieldUpdate
): ComposeProject {
  findServiceOrThrow(project, serviceId);

  return withMutation(project, (draft) => {
    const service = findServiceOrThrow(draft, serviceId);

    if (update.image !== undefined) {
      service.image = update.image || undefined;
      service.imageTag = service.image?.includes(":")
        ? service.image.split(":").pop()
        : undefined;
    }
    if (update.buildContext !== undefined) {
      service.build = update.buildContext
        ? { context: update.buildContext, dockerfile: update.buildDockerfile }
        : undefined;
    }
    if (update.command !== undefined) service.command = update.command || undefined;
    if (update.entrypoint !== undefined) service.entrypoint = update.entrypoint || undefined;
    if (update.restart !== undefined) service.restart = update.restart || undefined;
    if (update.ports) service.ports = update.ports.map((p) => ({ ...p }));
    if (update.environment) {
      service.environment = update.environment.map((e) => ({
        ...e,
        sensitive: /(password|secret|token|key|credential|private|auth)/i.test(e.key),
      }));
    }
    if (update.volumes) service.volumes = update.volumes.map((v) => ({ ...v }));
  });
}

// ---------------------------------------------------------------------------
// Relationships
// ---------------------------------------------------------------------------

export interface ConnectServicesInput {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  condition?: DependsOnCondition;
  networkName?: string;
}

function ensureNetworkDeclared(
  project: ComposeProject,
  networkName: string
): ComposeNetwork {
  let net = project.networks.find((n) => n.name === networkName && n.id !== "default");
  if (!net) {
    net = { id: networkName, name: networkName, driver: "bridge", external: false, usedBy: [] };
    project.networks.push(net);
  }
  return net;
}

export function connectServices(
  project: ComposeProject,
  input: ConnectServicesInput
): ComposeProject {
  const source = findServiceOrThrow(project, input.sourceId);
  findServiceOrThrow(project, input.targetId);

  if (input.sourceId === input.targetId) {
    throw new ComposeMutationError("A service cannot depend on itself.");
  }

  if (input.type === "dependency") {
    if (source.dependsOn.some((d) => d.service === input.targetId)) {
      return project;
    }
  }

  return withMutation(project, (draft) => {
    const draftSource = findServiceOrThrow(draft, input.sourceId);
    const draftTarget = findServiceOrThrow(draft, input.targetId);

    if (input.type === "dependency") {
      draftSource.dependsOn.push({
        service: input.targetId,
        condition: input.condition,
      });
    } else if (input.type === "network") {
      const networkName = input.networkName ?? `${input.sourceId}-${input.targetId}-net`;
      const net = ensureNetworkDeclared(draft, networkName);
      if (!draftSource.networks.some((n) => n.network === net.name)) {
        draftSource.networks.push({ network: net.name });
      }
      if (!draftTarget.networks.some((n) => n.network === net.name)) {
        draftTarget.networks.push({ network: net.name });
      }
    } else {
      throw new ComposeMutationError(
        `Connection type "${input.type}" is not yet supported.`
      );
    }
  });
}

export function detachRelationship(
  project: ComposeProject,
  relationshipId: string
): ComposeProject {
  const rel = project.relationships.find((r) => r.id === relationshipId);
  if (!rel) {
    throw new ComposeMutationError(`Relationship "${relationshipId}" does not exist.`);
  }

  return withMutation(project, (draft) => {
    if (rel.type === "dependency") {
      const source = findServiceOrThrow(draft, rel.source);
      source.dependsOn = source.dependsOn.filter((d) => d.service !== rel.target);
    } else if (rel.type === "network" && rel.network) {
      const source = findServiceOrThrow(draft, rel.source);
      const target = findServiceOrThrow(draft, rel.target);
      // Only detach the two endpoints from this specific network — other
      // services sharing it remain connected to each other.
      source.networks = source.networks.filter((n) => n.network !== rel.network);
      target.networks = target.networks.filter((n) => n.network !== rel.network);
    }
  });
}

export function changeRelationshipType(
  project: ComposeProject,
  relationshipId: string,
  newType: RelationshipType,
  options: { condition?: DependsOnCondition; networkName?: string } = {}
): ComposeProject {
  const rel = project.relationships.find((r) => r.id === relationshipId);
  if (!rel) {
    throw new ComposeMutationError(`Relationship "${relationshipId}" does not exist.`);
  }
  if (rel.type === newType) {
    if (newType === "dependency" && options.condition !== undefined) {
      return withMutation(project, (draft) => {
        const source = findServiceOrThrow(draft, rel.source);
        const dep = source.dependsOn.find((d) => d.service === rel.target);
        if (dep) dep.condition = options.condition;
      });
    }
    return project;
  }

  const detached = detachRelationship(project, relationshipId);
  return connectServices(detached, {
    sourceId: rel.source,
    targetId: rel.target,
    type: newType,
    condition: options.condition,
    networkName: options.networkName,
  });
}

/** Re-targets an existing relationship to a different target service (edge drag-to-reattach). */
export function retargetRelationship(
  project: ComposeProject,
  relationshipId: string,
  newTargetId: string
): ComposeProject {
  const rel = project.relationships.find((r) => r.id === relationshipId);
  if (!rel) {
    throw new ComposeMutationError(`Relationship "${relationshipId}" does not exist.`);
  }
  findServiceOrThrow(project, newTargetId);

  const detached = detachRelationship(project, relationshipId);
  return connectServices(detached, {
    sourceId: rel.source,
    targetId: newTargetId,
    type: rel.type,
    condition: rel.condition,
    networkName: rel.network,
  });
}

// ---------------------------------------------------------------------------
// Networks & volumes (top-level)
// ---------------------------------------------------------------------------

export function addNetwork(project: ComposeProject, name: string): ComposeProject {
  if (project.networks.some((n) => n.name === name)) {
    throw new ComposeMutationError(`A network named "${name}" already exists.`);
  }
  return withMutation(project, (draft) => {
    draft.networks.push({ id: name, name, driver: "bridge", external: false, usedBy: [] });
  });
}

export function addVolume(project: ComposeProject, name: string): ComposeProject {
  if (project.volumes.some((v) => v.name === name)) {
    throw new ComposeMutationError(`A volume named "${name}" already exists.`);
  }
  return withMutation(project, (draft) => {
    draft.volumes.push({ id: name, name, external: false, usedBy: [] });
  });
}

export function removeVolume(project: ComposeProject, name: string): ComposeProject {
  return withMutation(project, (draft) => {
    draft.volumes = draft.volumes.filter((v) => v.name !== name);
    for (const service of draft.services) {
      service.volumes = service.volumes.filter(
        (v) => !(v.isNamedVolume && v.source === name)
      );
    }
  });
}

export function attachVolumeToService(
  project: ComposeProject,
  serviceId: string,
  mount: { source: string; target: string; mode?: "ro" | "rw" }
): ComposeProject {
  findServiceOrThrow(project, serviceId);
  return withMutation(project, (draft) => {
    const service = findServiceOrThrow(draft, serviceId);
    if (!draft.volumes.some((v) => v.name === mount.source)) {
      draft.volumes.push({ id: mount.source, name: mount.source, external: false, usedBy: [] });
    }
    service.volumes.push({ ...mount, isNamedVolume: true });
  });
}

export function attachNetworkToService(
  project: ComposeProject,
  serviceId: string,
  attachment: ComposeNetworkAttachment
): ComposeProject {
  findServiceOrThrow(project, serviceId);
  return withMutation(project, (draft) => {
    const service = findServiceOrThrow(draft, serviceId);
    ensureNetworkDeclared(draft, attachment.network);
    if (!service.networks.some((n) => n.network === attachment.network)) {
      service.networks.push({ ...attachment });
    }
  });
}
