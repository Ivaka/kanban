import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check, ExternalLink, Plus, RefreshCw, X } from "lucide-react";
import { type ReactElement, type ReactNode, useMemo } from "react";

import {
	buildClineAgentModelPickerOptions,
	CLINE_REASONING_EFFORT_OPTIONS,
} from "@/components/detail-panels/cline-model-picker-options";
import { SearchSelectDropdown } from "@/components/search-select-dropdown";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Tooltip } from "@/components/ui/tooltip";
import type { UseRuntimeSettingsClineControllerResult } from "@/hooks/use-runtime-settings-cline-controller";
import type { UseRuntimeSettingsClineMcpControllerResult } from "@/hooks/use-runtime-settings-cline-mcp-controller";
import { openFileOnHost } from "@/runtime/runtime-config-query";
import type { RuntimeClineMcpServer, RuntimeClineReasoningEffort } from "@/runtime/types";
import { formatPathForDisplay } from "@/utils/path-display";

export function KimchiSetupSection({
	controller,
	mcpController,
	controlsDisabled,
	workspaceId = null,
	showMcpSettings = true,
	accountSection = null,
	onError,
	onSaved,
}: {
	controller: UseRuntimeSettingsClineControllerResult;
	mcpController?: UseRuntimeSettingsClineMcpControllerResult;
	controlsDisabled: boolean;
	workspaceId?: string | null;
	showMcpSettings?: boolean;
	accountSection?: ReactNode;
	onError?: (message: string | null) => void;
	onSaved?: () => void;
}): ReactElement {
	const mcpControlsDisabled = controlsDisabled || (mcpController?.isSavingMcpSettings ?? false);

	const modelPickerOptions = useMemo(
		() => buildClineAgentModelPickerOptions(controller.providerId, controller.providerModels),
		[controller.providerId, controller.providerModels],
	);
	const clineModelOptions = modelPickerOptions.options;
	const selectedProvider = useMemo(
		() =>
			controller.providerCatalog.find(
				(provider) => provider.id.trim().toLowerCase() === controller.normalizedProviderId,
			) ?? null,
		[controller.normalizedProviderId, controller.providerCatalog],
	);
	const shouldShowBaseUrlField =
		!controller.isOauthProviderSelected &&
		(selectedProvider?.supportsBaseUrl ?? controller.baseUrl.trim().length > 0);

	const handleAddMcpServer = () => {
		if (!mcpController) {
			return;
		}
		mcpController.setMcpServers((current) => [
			...current,
			{
				name: "",
				disabled: false,
				type: "streamableHttp",
				url: "",
			},
		]);
	};

	const updateMcpServer = (serverIndex: number, updater: (server: RuntimeClineMcpServer) => RuntimeClineMcpServer) => {
		if (!mcpController) {
			return;
		}
		mcpController.setMcpServers((current) =>
			current.map((server, index) => (index === serverIndex ? updater(server) : server)),
		);
	};

	const removeMcpServer = (serverIndex: number) => {
		if (!mcpController) {
			return;
		}
		mcpController.setMcpServers((current) => current.filter((_, index) => index !== serverIndex));
	};

	const handleMcpServerOauth = (serverName: string) => {
		void (async () => {
			if (!mcpController) {
				return;
			}
			onError?.(null);
			const result = await mcpController.runMcpServerOauth(serverName);
			if (!result.ok) {
				onError?.(result.message ?? `Failed to authorize MCP server "${serverName}".`);
				return;
			}
			onSaved?.();
		})();
	};

	const handleSetupLinearMcp = () => {
		void (async () => {
			if (!mcpController) {
				return;
			}
			onError?.(null);
			const result = await mcpController.linearMcpPreset.setup();
			if (!result.ok) {
				onError?.(result.message ?? "Failed to set up Linear MCP.");
				return;
			}
			onSaved?.();
		})();
	};

	const handleOpenFilePath = (filePath: string) => {
		onError?.(null);
		void openFileOnHost(workspaceId, filePath).catch((error) => {
			const message = error instanceof Error ? error.message : String(error);
			onError?.(`Could not open file on host: ${message}`);
		});
	};

	const handleRefreshProviderModels = () => {
		void (async () => {
			onError?.(null);
			const result = await controller.refreshProviderModels();
			if (!result.ok) {
				onError?.(result.message ?? "Failed to refresh Cline models.");
				return;
			}
		})();
	};

	return (
		<>
			<div className="mt-2">
				<p className="text-text-primary font-semibold text-[12px] mt-0 mb-2">Model</p>
				<div
					className="grid gap-2"
					style={{ gridTemplateColumns: controller.selectedModelSupportsReasoningEffort ? "1fr 1fr" : "1fr" }}
				>
					<div className="min-w-0">
						<div className="mb-1 flex items-center justify-between gap-2 h-7">
							<p className="text-text-secondary text-[12px] m-0">Model ID</p>
							{shouldShowBaseUrlField ? (
								<Tooltip side="bottom" content="Save settings and refresh models">
									<Button
										variant="ghost"
										size="sm"
										icon={
											<RefreshCw
												size={14}
												className={controller.isLoadingProviderModels ? "animate-spin" : undefined}
											/>
										}
										aria-label="Save settings and refresh models"
										disabled={
											controlsDisabled ||
											controller.isLoadingProviderModels ||
											controller.providerId.trim().length === 0
										}
										onClick={handleRefreshProviderModels}
									/>
								</Tooltip>
							) : null}
						</div>
						<SearchSelectDropdown
							options={clineModelOptions}
							selectedValue={controller.modelId}
							onSelect={(value) => controller.setModelId(value)}
							disabled={controlsDisabled || controller.isLoadingProviderModels}
							fill
							size="sm"
							buttonText={
								controller.isLoadingProviderModels
									? "Loading models..."
									: (clineModelOptions.find((option) => option.value === controller.modelId)?.label ??
											controller.modelId.trim()) ||
										undefined
							}
							emptyText="Select model"
							noResultsText="No matching models"
							placeholder="Search models..."
							showSelectedIndicator
							pinSelectedToTop={modelPickerOptions.shouldPinSelectedModelToTop}
							recommendedOptionValues={modelPickerOptions.recommendedModelIds}
							recommendedHeading="Recommended models"
							allowCustomValue
						/>
					</div>
					{controller.selectedModelSupportsReasoningEffort ? (
						<div className="min-w-0">
							<div className="mb-1 flex items-center h-7">
								<p className="text-text-secondary text-[12px] m-0">Reasoning effort</p>
							</div>
							<SearchSelectDropdown
								options={CLINE_REASONING_EFFORT_OPTIONS}
								selectedValue={controller.reasoningEffort}
								onSelect={(value) => controller.setReasoningEffort(value as RuntimeClineReasoningEffort | "")}
								disabled={controlsDisabled}
								fill
								size="sm"
								buttonText={
									CLINE_REASONING_EFFORT_OPTIONS.find((option) => option.value === controller.reasoningEffort)
										?.label
								}
								emptyText="Default"
								noResultsText="No matching reasoning levels"
								placeholder="Search reasoning levels..."
								showSelectedIndicator
							/>
						</div>
					) : null}
				</div>
				{controller.isLoadingProviderModels ? (
					<p className="text-text-secondary text-[12px] mt-1 mb-0">Fetching Cline models...</p>
				) : null}
			</div>

			{mcpController && showMcpSettings ? (
				<>
					<div className="flex items-center justify-between mt-4 mb-2">
						<h6 className="font-semibold text-[12px] text-text-primary m-0">MCP servers</h6>
						<Button
							variant="ghost"
							size="sm"
							icon={<Plus size={14} />}
							disabled={mcpControlsDisabled || mcpController.isLoadingMcpSettings}
							onClick={handleAddMcpServer}
						>
							Add
						</Button>
					</div>
					<p className="text-text-secondary text-[12px] mt-0 mb-2">Configure MCP servers for tool integrations.</p>
					{mcpController.mcpSettingsPath ? (
						<p
							className="text-text-secondary font-mono text-xs mt-0 mb-2 break-all"
							style={{ cursor: "pointer" }}
							onClick={() => {
								handleOpenFilePath(mcpController.mcpSettingsPath);
							}}
						>
							{formatPathForDisplay(mcpController.mcpSettingsPath)}
							<ExternalLink size={12} className="inline ml-1.5 align-middle" />
						</p>
					) : null}
					{mcpController.linearMcpPreset.status !== "connected" ? (
						<div className="rounded-md border border-border bg-surface-1 px-3 py-2 mb-2">
							<div className="flex items-center justify-between gap-3">
								<div className="min-w-0">
									<p className="text-text-primary text-[13px] font-medium mt-0 mb-0.5">Linear</p>
									<p className="text-text-secondary text-[12px] mt-0 mb-0">
										Connect Linear for project management tools.
									</p>
								</div>
								<Button
									variant="primary"
									size="sm"
									disabled={
										mcpControlsDisabled ||
										mcpController.isLoadingMcpSettings ||
										mcpController.linearMcpPreset.isSettingUp
									}
									onClick={handleSetupLinearMcp}
									className="shrink-0"
								>
									{mcpController.linearMcpPreset.isSettingUp
										? "Setting up..."
										: mcpController.linearMcpPreset.status === "configured"
											? "Connect Linear"
											: "Set up Linear"}
								</Button>
							</div>
						</div>
					) : null}

					{mcpController.isLoadingMcpSettings ? (
						<p className="text-text-secondary text-[12px] mt-1 mb-0">Loading MCP settings...</p>
					) : null}

					{!mcpController.isLoadingMcpSettings && mcpController.mcpServers.length === 0 ? (
						<p className="text-text-secondary text-[12px] mt-1 mb-0">No MCP servers configured.</p>
					) : null}

					{mcpController.mcpServers.map((server, serverIndex) => {
						const authStatus = mcpController.mcpAuthStatusByServerName[server.name];
						const oauthSupported = server.type !== "stdio";
						const oauthConfigured = authStatus?.oauthConfigured ?? false;
						const isAuthenticating = mcpController.authenticatingMcpServerName === server.name;

						return (
							<div key={serverIndex} className="flex items-start gap-2 mt-2">
								<div className="rounded-md border border-border p-2 flex-1 min-w-0">
									<div className="grid gap-2" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
										<div className="min-w-0">
											<p className="text-text-secondary text-[12px] mt-0 mb-1">Server name</p>
											<input
												value={server.name}
												onChange={(event) => {
													updateMcpServer(serverIndex, (current) => ({
														...current,
														name: event.target.value,
													}));
												}}
												placeholder="linear"
												disabled={mcpControlsDisabled}
												className="h-8 w-full rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
											/>
										</div>
										<div className="min-w-0">
											<p className="text-text-secondary text-[12px] mt-0 mb-1">Transport</p>
											<NativeSelect
												fill
												value={server.type}
												onChange={(event) => {
													const nextType = event.target.value as RuntimeClineMcpServer["type"];
													updateMcpServer(serverIndex, (current) => {
														if (nextType === "stdio") {
															return {
																name: current.name,
																disabled: current.disabled,
																type: "stdio",
																command: "",
															};
														}
														return {
															name: current.name,
															disabled: current.disabled,
															type: nextType,
															url: "",
														};
													});
												}}
												disabled={mcpControlsDisabled}
											>
												<option value="streamableHttp">HTTP</option>
												<option value="sse">SSE</option>
												<option value="stdio">Stdio</option>
											</NativeSelect>
										</div>
									</div>

									{server.type === "stdio" ? (
										<div className="grid gap-2 mt-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
											<div className="min-w-0">
												<p className="text-text-secondary text-[12px] mt-0 mb-1">Command</p>
												<input
													value={server.command}
													onChange={(event) => {
														updateMcpServer(serverIndex, (current) => {
															if (current.type !== "stdio") {
																return current;
															}
															return {
																...current,
																command: event.target.value,
															};
														});
													}}
													placeholder="Command"
													disabled={mcpControlsDisabled}
													className="h-8 w-full rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
												/>
											</div>
											<div className="min-w-0">
												<p className="text-text-secondary text-[12px] mt-0 mb-1">Arguments</p>
												<input
													value={(server.args ?? []).join(" ")}
													onChange={(event) => {
														updateMcpServer(serverIndex, (current) => {
															if (current.type !== "stdio") {
																return current;
															}
															return {
																...current,
																args: event.target.value
																	.split(/\s+/)
																	.map((value) => value.trim())
																	.filter((value) => value.length > 0),
															};
														});
													}}
													placeholder="Args"
													disabled={mcpControlsDisabled}
													className="h-8 w-full rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
												/>
											</div>
											<div className="min-w-0" style={{ gridColumn: "1 / -1" }}>
												<p className="text-text-secondary text-[12px] mt-0 mb-1">Working directory</p>
												<input
													value={server.cwd ?? ""}
													onChange={(event) => {
														updateMcpServer(serverIndex, (current) => {
															if (current.type !== "stdio") {
																return current;
															}
															return {
																...current,
																cwd: event.target.value,
															};
														});
													}}
													placeholder="Working directory (optional)"
													disabled={mcpControlsDisabled}
													className="h-8 w-full rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
												/>
											</div>
										</div>
									) : (
										<div className="min-w-0 mt-2">
											<p className="text-text-secondary text-[12px] mt-0 mb-1">URL</p>
											<input
												value={server.url}
												onChange={(event) => {
													updateMcpServer(serverIndex, (current) => {
														if (current.type === "stdio") {
															return current;
														}
														return {
															...current,
															url: event.target.value,
														};
													});
												}}
												placeholder="https://example.com/mcp"
												disabled={mcpControlsDisabled}
												className="h-8 w-full rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
											/>
										</div>
									)}

									{oauthSupported ? (
										<div className="mt-2">
											<p className="text-text-secondary text-[12px] mt-0 mb-1">
												OAuth:{" "}
												<span className="text-text-primary">
													{oauthConfigured ? "Connected" : "Not connected"}
												</span>
											</p>
											{authStatus?.lastError ? (
												<p className="text-status-red text-[12px] mt-0 mb-1">{authStatus.lastError}</p>
											) : null}
											<Button
												variant="default"
												size="sm"
												disabled={mcpControlsDisabled || isAuthenticating}
												onClick={() => {
													handleMcpServerOauth(server.name);
												}}
											>
												{isAuthenticating
													? "Connecting OAuth..."
													: oauthConfigured
														? "Reconnect OAuth"
														: "Connect OAuth"}
											</Button>
										</div>
									) : null}

									<label
										htmlFor={`mcp-disabled-${serverIndex}`}
										className="flex items-center gap-2 text-[12px] text-text-primary mt-2 cursor-pointer select-none"
									>
										<RadixCheckbox.Root
											id={`mcp-disabled-${serverIndex}`}
											checked={server.disabled}
											disabled={mcpControlsDisabled}
											onCheckedChange={(checked) => {
												updateMcpServer(serverIndex, (current) => ({
													...current,
													disabled: checked === true,
												}));
											}}
											className="flex h-4 w-4 cursor-pointer items-center justify-center rounded border border-border bg-surface-2 data-[state=checked]:bg-accent data-[state=checked]:border-accent disabled:cursor-default disabled:opacity-40"
										>
											<RadixCheckbox.Indicator>
												<Check size={12} className="text-white" />
											</RadixCheckbox.Indicator>
										</RadixCheckbox.Root>
										<span>Disabled</span>
									</label>
								</div>
								<Button
									variant="ghost"
									size="sm"
									icon={<X size={14} />}
									aria-label={`Remove MCP server ${server.name || serverIndex + 1}`}
									disabled={mcpControlsDisabled}
									onClick={() => removeMcpServer(serverIndex)}
								/>
							</div>
						);
					})}
				</>
			) : null}

			{accountSection ? <div className="mt-4">{accountSection}</div> : null}
		</>
	);
}
