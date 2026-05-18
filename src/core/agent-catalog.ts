import type { RuntimeAgentId } from "./api-contract";

export interface RuntimeAgentConfig {
	id: RuntimeAgentId;
	label: string;
	binary: string;
	baseArgs: string[];
	autonomousArgs: string[];
	installUrl: string;
}

export const KIMCHI_AGENT_CONFIG: RuntimeAgentConfig = {
	id: "kimchi",
	label: "Kimchi",
	binary: "kimchi",
	baseArgs: [],
	autonomousArgs: ["--yolo"],
	installUrl: "https://github.com/castai/kimchi",
};

export const RUNTIME_AGENT_CATALOG: RuntimeAgentConfig[] = [KIMCHI_AGENT_CONFIG];

export const RUNTIME_LAUNCH_SUPPORTED_AGENT_IDS: readonly RuntimeAgentId[] = ["kimchi"];

const RUNTIME_LAUNCH_SUPPORTED_AGENT_ID_SET = new Set<RuntimeAgentId>(RUNTIME_LAUNCH_SUPPORTED_AGENT_IDS);

export function isRuntimeAgentLaunchSupported(agentId: RuntimeAgentId): boolean {
	return RUNTIME_LAUNCH_SUPPORTED_AGENT_ID_SET.has(agentId);
}

export function getRuntimeLaunchSupportedAgentCatalog(): RuntimeAgentConfig[] {
	return RUNTIME_AGENT_CATALOG.filter((entry) => isRuntimeAgentLaunchSupported(entry.id));
}

export function getRuntimeAgentCatalogEntry(agentId: RuntimeAgentId): RuntimeAgentConfig | null {
	return RUNTIME_AGENT_CATALOG.find((entry) => entry.id === agentId) ?? null;
}
