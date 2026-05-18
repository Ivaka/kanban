import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { delimiter, join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadRuntimeConfig, saveRuntimeConfig, updateRuntimeConfig } from "../../../src/config/runtime-config.js";
import { createTempDir } from "../../utilities/temp-dir.js";

function writeFakeCommand(binDir: string, command: string): void {
	mkdirSync(binDir, { recursive: true });
	if (process.platform === "win32") {
		const scriptPath = join(binDir, `${command}.cmd`);
		writeFileSync(scriptPath, "@echo off\r\nexit /b 0\r\n", "utf8");
		return;
	}
	const scriptPath = join(binDir, command);
	writeFileSync(scriptPath, "#!/usr/bin/env sh\nexit 0\n", "utf8");
	chmodSync(scriptPath, 0o755);
}

function withTemporaryEnv<T>(
	input: {
		home: string;
		pathPrefix?: string;
		replacePath?: boolean;
	},
	fn: () => T | Promise<T>,
): Promise<T> {
	const previousHome = process.env.HOME;
	const previousPath = process.env.PATH;
	const previousKanbanConfig = process.env.KANBAN_CONFIG;
	process.env.HOME = input.home;
	process.env.KANBAN_CONFIG = undefined;
	if (input.pathPrefix) {
		if (input.replacePath) {
			process.env.PATH = input.pathPrefix;
		} else {
			process.env.PATH = `${input.pathPrefix}${delimiter}${process.env.PATH}`;
		}
	}
	async function restore(): Promise<void> {
		process.env.HOME = previousHome;
		process.env.PATH = previousPath;
		process.env.KANBAN_CONFIG = previousKanbanConfig;
	}
	async function run(): Promise<T> {
		let result: T;
		try {
			result = await fn();
		} catch (error) {
			await restore();
			throw error;
		}
		await restore();
		return result;
	}
	return run();
}

describe.sequential("runtime-config auto agent selection", () => {
	it("defaults to kimchi when unset", async () => {
		if (process.platform === "win32") {
			return;
		}
		const { path: tempHome, cleanup: cleanupHome } = createTempDir("kanban-home-runtime-config-");
		const { path: tempProject, cleanup: cleanupProject } = createTempDir("kanban-project-runtime-config-");
		const { path: tempBin, cleanup: cleanupBin } = createTempDir("kanban-bin-runtime-config-");

		try {
			writeFakeCommand(tempBin, "kimchi");

			const previousShell = process.env.SHELL;
			try {
				process.env.SHELL = "/definitely-not-a-shell";
				const isolatedPath = `${tempBin}${delimiter}/usr/bin${delimiter}/bin`;
				await withTemporaryEnv({ home: tempHome, pathPrefix: isolatedPath, replacePath: true }, async () => {
					const state = await loadRuntimeConfig(tempProject);
					expect(state.selectedAgentId).toBe("kimchi");
					// No config file created since kimchi is the default
					expect(existsSync(join(tempHome, ".config", "kimchi", "studio", "config.json"))).toBe(false);

					const reloadedState = await loadRuntimeConfig(tempProject);
					expect(reloadedState.selectedAgentId).toBe("kimchi");
				});
			} finally {
				if (previousShell === undefined) {
					delete process.env.SHELL;
				} else {
					process.env.SHELL = previousShell;
				}
				cleanupBin();
			}
		} finally {
			cleanupProject();
			cleanupHome();
		}
	});
});

describe.sequential("runtime-config live config", () => {
	it("treats the home directory as global-only config scope", async () => {
		const { path: tempHome, cleanup: cleanupHome } = createTempDir("kanban-home-runtime-config-home-scope-");

		try {
			await withTemporaryEnv({ home: tempHome }, async () => {
				const state = await loadRuntimeConfig(tempHome);
				expect(state.globalConfigPath).toBe(join(tempHome, ".config", "kimchi", "studio", "config.json"));
				expect(state.projectConfigPath).toBeNull();
				expect(state.shortcuts).toEqual([]);
			});
		} finally {
			cleanupHome();
		}
	});

	it("loads global runtime config without a project scope", async () => {
		const { path: tempHome, cleanup: cleanupHome } = createTempDir("kanban-home-runtime-config-global-only-");

		try {
			await withTemporaryEnv({ home: tempHome }, async () => {
				const state = await loadRuntimeConfig(tempHome);
				expect(state.globalConfigPath).toBe(join(tempHome, ".config", "kimchi", "studio", "config.json"));
				expect(state.projectConfigPath).toBeNull();
			});
		} finally {
			cleanupHome();
		}
	});

	it("defaults to kimchi even when no CLI is detected", async () => {
		if (process.platform === "win32") {
			return;
		}
		const { path: tempHome, cleanup: cleanupHome } = createTempDir("kanban-home-runtime-config-default-");
		const { path: tempProject, cleanup: cleanupProject } = createTempDir("kanban-project-runtime-config-default-");
		const { path: tempBin, cleanup: cleanupBin } = createTempDir("kanban-bin-runtime-config-default-");

		try {
			const previousShell = process.env.SHELL;
			try {
				process.env.SHELL = "/definitely-not-a-shell";
				await withTemporaryEnv({ home: tempHome, pathPrefix: tempBin, replacePath: true }, async () => {
					const state = await loadRuntimeConfig(tempProject);
					expect(state.selectedAgentId).toBe("kimchi");
					// Kimchi is always the default, no config file needed
					expect(existsSync(join(tempHome, ".config", "kimchi", "studio", "config.json"))).toBe(false);
				});
			} finally {
				if (previousShell === undefined) {
					delete process.env.SHELL;
				} else {
					process.env.SHELL = previousShell;
				}
			}

			cleanupBin();
		} finally {
			cleanupProject();
			cleanupHome();
		}
	});

	it("normalized unsupported configured agents to the default launch agent", async () => {
		const { path: tempHome, cleanup: cleanupHome } = createTempDir("kanban-home-runtime-config-set-");
		const { path: tempProject, cleanup: cleanupProject } = createTempDir("kanban-project-runtime-config-set-");
		const { path: tempBin, cleanup: cleanupBin } = createTempDir("kanban-bin-runtime-config-set-");

		try {
			writeFakeCommand(tempBin, "kimchi");

			const runtimeConfigDir = join(tempHome, ".config", "kimchi", "studio");
			mkdirSync(runtimeConfigDir, { recursive: true });
			writeFileSync(
				join(runtimeConfigDir, "config.json"),
				JSON.stringify(
					{
						selectedAgentId: "gemini",
					},
					null,
					2,
				),
				"utf8",
			);

			await withTemporaryEnv({ home: tempHome, pathPrefix: tempBin }, async () => {
				const state = await loadRuntimeConfig(tempProject);
				expect(state.selectedAgentId).toBe("kimchi");
			});
		} finally {
			cleanupBin();
			cleanupProject();
			cleanupHome();
		}
	});

	it("does not auto-select when global config file already exists without selected agent", async () => {
		const { path: tempHome, cleanup: cleanupHome } = createTempDir("kanban-home-runtime-config-existing-");
		const { path: tempProject, cleanup: cleanupProject } = createTempDir("kanban-project-runtime-config-existing-");
		const { path: tempBin, cleanup: cleanupBin } = createTempDir("kanban-bin-runtime-config-existing-");

		try {
			writeFakeCommand(tempBin, "kimchi");

			const runtimeConfigDir = join(tempHome, ".config", "kimchi", "studio");
			mkdirSync(runtimeConfigDir, { recursive: true });
			writeFileSync(
				join(runtimeConfigDir, "config.json"),
				JSON.stringify(
					{
						readyForReviewNotificationsEnabled: true,
					},
					null,
					2,
				),
				"utf8",
			);

			await withTemporaryEnv({ home: tempHome, pathPrefix: tempBin }, async () => {
				const state = await loadRuntimeConfig(tempProject);
				expect(state.selectedAgentId).toBe("kimchi");
			});
		} finally {
			cleanupBin();
			cleanupProject();
			cleanupHome();
		}
	});

	it("removes an existing empty project config file when no shortcuts are saved", async () => {
		const { path: tempHome, cleanup: cleanupHome } = createTempDir("kanban-home-runtime-config-empty-project-");
		const { path: tempProject, cleanup: cleanupProject } = createTempDir(
			"kanban-project-runtime-config-empty-project-",
		);
		const { path: tempBin, cleanup: cleanupBin } = createTempDir("kanban-bin-runtime-config-empty-project-");

		try {
			writeFakeCommand(tempBin, "kimchi");

			const projectConfigDir = join(tempProject, ".config", "kimchi", "studio");
			mkdirSync(projectConfigDir, { recursive: true });
			writeFileSync(join(projectConfigDir, "config.json"), "{}", "utf8");
			await withTemporaryEnv({ home: tempHome, pathPrefix: tempBin }, async () => {
				const current = await loadRuntimeConfig(tempProject);
				await saveRuntimeConfig(tempProject, {
					selectedAgentId: "kimchi",
					selectedShortcutLabel: null,
					agentAutonomousModeEnabled: true,
					readyForReviewNotificationsEnabled: true,
					shortcuts: [],
					commitPromptTemplate: current.commitPromptTemplateDefault,
					openPrPromptTemplate: current.openPrPromptTemplateDefault,
				});
				expect(existsSync(join(projectConfigDir, "config.json"))).toBe(false);
			});
		} finally {
			cleanupBin();
			cleanupProject();
			cleanupHome();
		}
	});

	it("updateRuntimeConfig supports partial updates", async () => {
		const { path: tempHome, cleanup: cleanupHome } = createTempDir("kanban-home-runtime-config-partial-");
		const { path: tempProject, cleanup: cleanupProject } = createTempDir("kanban-project-runtime-config-partial-");

		try {
			await withTemporaryEnv({ home: tempHome }, async () => {
				await loadRuntimeConfig(tempProject);

				// Setting selectedAgentId to "kimchi" (the default) - returns early, no new writes
				const updated = await updateRuntimeConfig(tempProject, {
					selectedAgentId: "kimchi",
				});
				expect(updated.selectedAgentId).toBe("kimchi");

				// No config file created since kimchi is default and update didn't change anything
				expect(existsSync(join(tempHome, ".config", "kimchi", "studio", "config.json"))).toBe(false);
			});
		} finally {
			cleanupProject();
			cleanupHome();
		}
	});

	it("persists autonomous mode when disabled", async () => {
		const { path: tempHome, cleanup: cleanupHome } = createTempDir("kanban-home-runtime-config-autonomous-disabled-");
		const { path: tempProject, cleanup: cleanupProject } = createTempDir(
			"kanban-project-runtime-config-autonomous-disabled-",
		);

		try {
			await withTemporaryEnv({ home: tempHome }, async () => {
				const updated = await updateRuntimeConfig(tempProject, {
					agentAutonomousModeEnabled: false,
				});
				expect(updated.agentAutonomousModeEnabled).toBe(false);

				const globalPayload = JSON.parse(
					readFileSync(join(tempHome, ".config", "kimchi", "studio", "config.json"), "utf8"),
				) as {
					agentAutonomousModeEnabled?: boolean;
				};
				expect(globalPayload.agentAutonomousModeEnabled).toBe(false);
			});
		} finally {
			cleanupProject();
			cleanupHome();
		}
	});

	it("persists ready-for-review notifications when disabled", async () => {
		const { path: tempHome, cleanup: cleanupHome } = createTempDir(
			"kanban-home-runtime-config-notifications-disabled-",
		);
		const { path: tempProject, cleanup: cleanupProject } = createTempDir(
			"kanban-project-runtime-config-notifications-disabled-",
		);

		try {
			await withTemporaryEnv({ home: tempHome }, async () => {
				const updated = await updateRuntimeConfig(tempProject, {
					readyForReviewNotificationsEnabled: false,
				});
				expect(updated.readyForReviewNotificationsEnabled).toBe(false);

				const globalPayload = JSON.parse(
					readFileSync(join(tempHome, ".config", "kimchi", "studio", "config.json"), "utf8"),
				) as {
					readyForReviewNotificationsEnabled?: boolean;
				};
				expect(globalPayload.readyForReviewNotificationsEnabled).toBe(false);
			});
		} finally {
			cleanupProject();
			cleanupHome();
		}
	});

	it("labels project-scoped settings with projectConfigPath", async () => {
		const { path: tempHome, cleanup: cleanupHome } = createTempDir("kanban-home-runtime-config-project-scope-");
		const { path: tempProject, cleanup: cleanupProject } = createTempDir(
			"kanban-project-runtime-config-project-scope-",
		);

		try {
			await withTemporaryEnv({ home: tempHome }, async () => {
				await loadRuntimeConfig(tempProject);
				const updated = await updateRuntimeConfig(tempProject, {
					shortcuts: [{ icon: "storybook", label: "Storybook", command: "npm run storybook" }],
				});
				expect(updated.projectConfigPath).toBe(join(tempProject, ".config", "kimchi", "studio", "config.json"));
			});
		} finally {
			cleanupProject();
			cleanupHome();
		}
	});

	it("protects against concurrent updates", async () => {
		const { path: tempHome, cleanup: cleanupHome } = createTempDir("kanban-home-runtime-config-concurrent-");
		const { path: tempProject, cleanup: cleanupProject } = createTempDir("kanban-project-runtime-config-concurrent-");

		try {
			await withTemporaryEnv({ home: tempHome }, async () => {
				await loadRuntimeConfig(tempProject);

				const [selectedAgentState, autonomousModeState] = await Promise.all([
					updateRuntimeConfig(tempProject, {
						selectedAgentId: "kimchi",
					}),
					updateRuntimeConfig(tempProject, {
						agentAutonomousModeEnabled: false,
					}),
				]);

				expect(selectedAgentState.selectedAgentId).toBe("kimchi");
				expect(autonomousModeState.agentAutonomousModeEnabled).toBe(false);

				const reloaded = await loadRuntimeConfig(tempProject);
				expect(reloaded.selectedAgentId).toBe("kimchi");
				expect(reloaded.agentAutonomousModeEnabled).toBe(false);
			});
		} finally {
			cleanupProject();
			cleanupHome();
		}
	});
});
