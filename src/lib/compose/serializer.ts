import { Document, YAMLMap, YAMLSeq } from "yaml";
import type {
  ComposeNetworkAttachment,
  ComposePort,
  ComposeProject,
  ComposeService,
  ComposeVolumeMount,
  DependsOnEntry,
} from "@/types/compose";

function portToString(port: ComposePort): string {
  const protoSuffix = port.protocol ? `/${port.protocol}` : "";
  if (port.host) {
    return `${port.host}:${port.container}${protoSuffix}`;
  }
  return `${port.container}${protoSuffix}`;
}

function volumeToString(mount: ComposeVolumeMount): string {
  const parts = [mount.source];
  if (mount.target) parts.push(mount.target);
  if (mount.mode) parts.push(mount.mode);
  return parts.join(":");
}

function dependsOnNeedsConditions(entries: DependsOnEntry[]): boolean {
  return entries.some((e) => e.condition);
}

function networksNeedAliases(attachments: ComposeNetworkAttachment[]): boolean {
  return attachments.some((a) => a.alias);
}

function buildServiceNode(service: ComposeService): YAMLMap {
  const node = new YAMLMap();

  if (service.image) node.set("image", service.image);
  if (service.build) {
    if (service.build.dockerfile) {
      const buildMap = new YAMLMap();
      buildMap.set("context", service.build.context);
      buildMap.set("dockerfile", service.build.dockerfile);
      node.set("build", buildMap);
    } else {
      node.set("build", service.build.context);
    }
  }

  if (service.command) node.set("command", service.command);
  if (service.entrypoint) node.set("entrypoint", service.entrypoint);

  if (service.ports.length > 0) {
    const seq = new YAMLSeq();
    for (const port of service.ports) seq.add(portToString(port));
    node.set("ports", seq);
  }

  if (service.environment.length > 0) {
    const envMap = new YAMLMap();
    for (const env of service.environment) {
      envMap.set(env.key, env.value ?? "");
    }
    node.set("environment", envMap);
  }

  if (service.labels.length > 0) {
    const labelsMap = new YAMLMap();
    for (const label of service.labels) {
      labelsMap.set(label.key, label.value ?? "");
    }
    node.set("labels", labelsMap);
  }

  if (service.dependsOn.length > 0) {
    if (dependsOnNeedsConditions(service.dependsOn)) {
      const depMap = new YAMLMap();
      for (const dep of service.dependsOn) {
        const condMap = new YAMLMap();
        condMap.set("condition", dep.condition ?? "service_started");
        depMap.set(dep.service, condMap);
      }
      node.set("depends_on", depMap);
    } else {
      const depSeq = new YAMLSeq();
      for (const dep of service.dependsOn) depSeq.add(dep.service);
      node.set("depends_on", depSeq);
    }
  }

  if (service.networks.length > 0) {
    if (networksNeedAliases(service.networks)) {
      const netMap = new YAMLMap();
      for (const net of service.networks) {
        if (net.alias) {
          const detail = new YAMLMap();
          const aliasSeq = new YAMLSeq();
          aliasSeq.add(net.alias);
          detail.set("aliases", aliasSeq);
          netMap.set(net.network, detail);
        } else {
          netMap.set(net.network, new YAMLMap());
        }
      }
      node.set("networks", netMap);
    } else {
      const netSeq = new YAMLSeq();
      for (const net of service.networks) netSeq.add(net.network);
      node.set("networks", netSeq);
    }
  }

  if (service.volumes.length > 0) {
    const volSeq = new YAMLSeq();
    for (const vol of service.volumes) volSeq.add(volumeToString(vol));
    node.set("volumes", volSeq);
  }

  if (service.restart) node.set("restart", service.restart);

  if (service.healthcheck) {
    const hc = service.healthcheck;
    const hcMap = new YAMLMap();
    if (hc.test) {
      if (Array.isArray(hc.test)) {
        const testSeq = new YAMLSeq();
        for (const t of hc.test) testSeq.add(t);
        hcMap.set("test", testSeq);
      } else {
        hcMap.set("test", hc.test);
      }
    }
    if (hc.interval) hcMap.set("interval", hc.interval);
    if (hc.timeout) hcMap.set("timeout", hc.timeout);
    if (hc.retries != null) hcMap.set("retries", hc.retries);
    if (hc.startPeriod) hcMap.set("start_period", hc.startPeriod);
    node.set("healthcheck", hcMap);
  }

  return node;
}

/**
 * Serializes a ComposeProject back into a canonical docker-compose.yml string.
 * This regenerates YAML from the model — it does not preserve the original
 * file's comments, key ordering idiosyncrasies, or formatting.
 */
export function serializeComposeProject(project: ComposeProject): string {
  const doc = new Document();
  const root = new YAMLMap();

  const servicesMap = new YAMLMap();
  for (const service of project.services) {
    servicesMap.set(service.name, buildServiceNode(service));
  }
  root.set("services", servicesMap);

  const namedNetworks = project.networks.filter((n) => n.id !== "default");
  if (namedNetworks.length > 0) {
    const networksMap = new YAMLMap();
    for (const net of namedNetworks) {
      if (net.external) {
        const detail = new YAMLMap();
        detail.set("external", true);
        networksMap.set(net.name, detail);
      } else if (net.driver && net.driver !== "bridge") {
        const detail = new YAMLMap();
        detail.set("driver", net.driver);
        networksMap.set(net.name, detail);
      } else {
        networksMap.set(net.name, new YAMLMap());
      }
    }
    root.set("networks", networksMap);
  }

  if (project.volumes.length > 0) {
    const volumesMap = new YAMLMap();
    for (const vol of project.volumes) {
      if (vol.external) {
        const detail = new YAMLMap();
        detail.set("external", true);
        volumesMap.set(vol.name, detail);
      } else {
        volumesMap.set(vol.name, new YAMLMap());
      }
    }
    root.set("volumes", volumesMap);
  }

  doc.contents = root;

  return doc.toString({
    indent: 2,
    lineWidth: 0,
  });
}
