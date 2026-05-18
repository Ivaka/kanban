import { describe, expect, it } from "vitest";

import {
	getTaskAgentNavbarHint,
	isClineProviderAuthenticated,
	isNativeClineAgentSelected,
	isTaskAgentSetupSatisfied,
	selectLatestTaskChatMessageForTask,
	selectTaskChatMessagesForTask,
} from "@/runtime/native-agent";
import type { RuntimeConfigResponse, RuntimeStateStreamTaskChatMessage } from "@/runtime/types";

function createRuntimeConfigResponse(overrides?: Partial<RuntimeConfigResponse>): RuntimeConfigResponse {
	const nextConfig: RuntimeConfigResponse = {
		selectedAgentId: "kimchi",
		selectedShortcutLabel: null,
		agentAutonomousModeEnabled: true,
		effectiveCommand: "kimchi",
		globalConfigPath: "/tmp/global-config.json",
		projectConfigPath: "/tmp/project/.cline/kanban/config.json",
		readyForReviewNotificationsEnabled: true,
		agentConfig: {
			installed: true,
			command: "kimchi",
		},
		shortcuts: [],
		clineProviderSettings: {
			providerId: "cline",
			modelId: "sonnet",
			baseUrl: null,
			apiKeyConfigured: false,
			oauthProvider: "cline",
			oauthAccessTokenConfigured: true,
			oauthRefreshTokenConfigured: true,
			oauthAccountId: "acct_123",
			oauthExpiresAt: 123,
		},
		commitPromptTemplate: "",
		openPrPromptTemplate: "",
		commitPromptTemplateDefault: "",
		openPrPromptTemplateDefault: "",
	};
	return {
		...nextConfig,
		...overrides,
	};
}

function createLatestTaskChatMessage(taskId: string): RuntimeStateStreamTaskChatMessage {
	return {
		type: "task_chat_message",
		workspaceId: "workspace-1",
		taskId,
		message: {
			id: "message-1",
			role: "assistant",
			content: "Hello",
			createdAt: Date.now(),
			meta: null,
		},
	};
}

describe("native-agent helpers", () => {
	it("treats nothing as the native chat agent", () => {
		expect(isNativeClineAgentSelected("cline")).toBe(false);
		expect(isNativeClineAgentSelected("codex")).toBe(false);
	});

	it("returns agent setup satisfied based on agentConfig installed status", () => {
		expect(isTaskAgentSetupSatisfied(createRuntimeConfigResponse())).toBe(true);
		expect(
			isTaskAgentSetupSatisfied(createRuntimeConfigResponse({ agentConfig: { installed: false, command: null } })),
		).toBe(false);
		expect(isTaskAgentSetupSatisfied(null)).toBeNull();
	});

	it("does not show the navbar setup hint when agent is installed", () => {
		expect(getTaskAgentNavbarHint(createRuntimeConfigResponse())).toBeUndefined();
	});

	it("shows the navbar setup hint when agent is not installed", () => {
		const config = createRuntimeConfigResponse({
			agentConfig: { installed: false, command: null },
		});
		expect(getTaskAgentNavbarHint(config)).toBe("No agent configured");
		expect(
			getTaskAgentNavbarHint(config, {
				shouldUseNavigationPath: true,
			}),
		).toBeUndefined();
	});

	it("checks for a provider selection when determining cline authentication", () => {
		expect(
			isClineProviderAuthenticated({
				providerId: null,
				modelId: null,
				baseUrl: null,
				apiKeyConfigured: true,
				oauthProvider: null,
				oauthAccessTokenConfigured: false,
				oauthRefreshTokenConfigured: false,
				oauthAccountId: null,
				oauthExpiresAt: null,
			}),
		).toBe(false);
		expect(
			isClineProviderAuthenticated({
				providerId: "anthropic",
				modelId: null,
				baseUrl: null,
				apiKeyConfigured: true,
				oauthProvider: null,
				oauthAccessTokenConfigured: false,
				oauthRefreshTokenConfigured: false,
				oauthAccountId: null,
				oauthExpiresAt: null,
			}),
		).toBe(true);
	});

	it("selects the latest incoming chat message only for the matching task", () => {
		const messageEvent = createLatestTaskChatMessage("task-1");
		expect(selectLatestTaskChatMessageForTask("task-1", messageEvent)).toEqual(messageEvent.message);
		expect(selectLatestTaskChatMessageForTask("task-2", messageEvent)).toBeNull();
		expect(selectLatestTaskChatMessageForTask(null, messageEvent)).toBeNull();
	});

	it("selects the streamed task chat transcript for the matching task", () => {
		const messageEvent = createLatestTaskChatMessage("task-1");
		expect(
			selectTaskChatMessagesForTask("task-1", {
				"task-1": [messageEvent.message],
			}),
		).toEqual([messageEvent.message]);
		expect(selectTaskChatMessagesForTask("task-2", { "task-1": [messageEvent.message] })).toBeNull();
		expect(selectTaskChatMessagesForTask(null, { "task-1": [messageEvent.message] })).toBeNull();
	});
});
