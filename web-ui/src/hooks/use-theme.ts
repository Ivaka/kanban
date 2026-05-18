import { useCallback, useSyncExternalStore } from "react";

import { LocalStorageKey, readLocalStorageItem, writeLocalStorageItem } from "@/storage/local-storage-store";

// ---------------------------------------------------------------------------
// Theme definitions (simplified to light/dark with accent presets)
// ---------------------------------------------------------------------------

export type ThemeId = "light" | "dark";
export type AccentPreset = "orange" | "blue" | "green" | "pink";

export interface ThemeConfig {
	readonly mode: ThemeId;
	readonly accent: AccentPreset;
}

// Color swatches for the settings dialog (includes theme colors)
export interface ThemeColorSwatch {
	readonly id: string;
	readonly label: string;
	readonly group: string;
	readonly surface: string;
	readonly accent: string;
	readonly accent2: string;
}

export const THEME_COLOR_SWATCHES: readonly ThemeColorSwatch[] = [
	{ id: "dark", label: "Dark", group: "dark", surface: "#1c1c1c", accent: "#f4572e", accent2: "#ec3f7d" },
	{ id: "light", label: "Light", group: "light", surface: "#ffffff", accent: "#f4572e", accent2: "#ec3f7d" },
];

export interface ThemeDefinition {
	readonly id: ThemeId;
	readonly label: string;
}

export const THEMES: readonly ThemeDefinition[] = [
	{ id: "dark", label: "Dark" },
	{ id: "light", label: "Light" },
];

export const ACCENT_PRESETS: readonly AccentPreset[] = ["orange", "blue", "green", "pink"];

// Accent colors mapped to primitive scales
const ACCENT_COLORS: Record<AccentPreset, { primary: string; secondary: string }> = {
	orange: { primary: "#f4572e", secondary: "#7c2d18" },
	blue: { primary: "#407cf8", secondary: "#193887" },
	green: { primary: "#79b026", secondary: "#3e5d13" },
	pink: { primary: "#ec3f7d", secondary: "#891e47" },
};

// ---------------------------------------------------------------------------
// Terminal colors (legacy - migrated to use semantic values where possible)
// ---------------------------------------------------------------------------

export interface ThemeTerminalColors {
	readonly textPrimary: string;
	readonly surfacePrimary: string;
	readonly surfaceRaised: string;
	readonly selectionBackground: string;
	readonly selectionForeground: string;
	readonly selectionInactiveBackground: string;
	readonly isLightBackground: boolean;
}

const TERMINAL_COLORS: Record<ThemeId, ThemeTerminalColors> = {
	dark: {
		textPrimary: "#ededed",
		surfacePrimary: "#181818",
		surfaceRaised: "#1c1c20",
		selectionBackground: "#f4572e4D",
		selectionForeground: "#ffffff",
		selectionInactiveBackground: "#29292966",
		isLightBackground: false,
	},
	light: {
		textPrimary: "#181818",
		surfacePrimary: "#ffffff",
		surfaceRaised: "#ffffff",
		selectionBackground: "#f4572e4D",
		selectionForeground: "#000000",
		selectionInactiveBackground: "#e3e3e366",
		isLightBackground: true,
	},
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentTheme: ThemeConfig = { mode: "dark", accent: "orange" };
let storageSyncInstalled = false;
const themeStoreListeners = new Set<() => void>();

// ---------------------------------------------------------------------------
// Store helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

const LEGACY_THEME_TO_MODE: Record<string, ThemeId> = {
	// New modes (passthrough)
	dark: "dark",
	light: "light",
	// Legacy dark themes
	default: "dark",
	graphite: "dark",
	midnight: "dark",
	pitch: "dark",
	"solarized-dark": "dark",
	"high-contrast-dark": "dark",
	// Legacy light themes
	overcast: "light",
	"solarized-light": "light",
	latte: "light",
	"high-contrast-light": "light",
};

/**
 * Migrate from old single-key theme to new mode+accent system.
 * This runs once on first load of the new system.
 */
function migrateLegacyTheme(): ThemeConfig | null {
	const legacyTheme = readLocalStorageItem(LocalStorageKey.Theme);
	if (!legacyTheme) {
		return null;
	}

	const mode = LEGACY_THEME_TO_MODE[legacyTheme] ?? "dark";
	// Default accent is orange, but we could infer from legacy theme later
	const migrated = { mode, accent: "orange" as AccentPreset };

	// Clear old key and set new keys
	writeStoredTheme(migrated);
	localStorage.removeItem(LocalStorageKey.Theme);

	return migrated;
}

function isValidMode(value: string): value is ThemeId {
	return value === "light" || value === "dark";
}

function isValidAccent(value: string): value is AccentPreset {
	return ACCENT_PRESETS.includes(value as AccentPreset);
}

function readStoredTheme(): ThemeConfig {
	// Check for migration first
	const migrated = migrateLegacyTheme();
	if (migrated) {
		return migrated;
	}

	const storedMode = readLocalStorageItem(LocalStorageKey.ThemeMode);
	const storedAccent = readLocalStorageItem(LocalStorageKey.ThemeAccent);
	return {
		mode: isValidMode(storedMode ?? "") ? (storedMode as ThemeId) : "dark",
		accent: isValidAccent(storedAccent ?? "") ? (storedAccent as AccentPreset) : "orange",
	};
}

function writeStoredTheme(config: ThemeConfig): void {
	writeLocalStorageItem(LocalStorageKey.ThemeMode, config.mode);
	writeLocalStorageItem(LocalStorageKey.ThemeAccent, config.accent);
}

function notifyThemeStoreListeners(): void {
	for (const listener of themeStoreListeners) {
		listener();
	}
}

function subscribeThemeStore(listener: () => void): () => void {
	installStorageSyncListener();
	themeStoreListeners.add(listener);
	return () => {
		themeStoreListeners.delete(listener);
	};
}

function readThemeSnapshot(): ThemeConfig {
	return currentTheme;
}

function installStorageSyncListener(): void {
	if (storageSyncInstalled || typeof window === "undefined") {
		return;
	}
	storageSyncInstalled = true;
	window.addEventListener("storage", (event) => {
		if (event.key !== null && event.key !== LocalStorageKey.ThemeMode && event.key !== LocalStorageKey.ThemeAccent) {
			return;
		}
		const nextTheme = readStoredTheme();
		if (nextTheme.mode === currentTheme.mode && nextTheme.accent === currentTheme.accent) {
			return;
		}
		currentTheme = nextTheme;
		applyThemeToDocument(nextTheme);
		notifyThemeStoreListeners();
	});
}

// ---------------------------------------------------------------------------
// Theme application
// ---------------------------------------------------------------------------

export function applyThemeToDocument(config: ThemeConfig): void {
	if (typeof document === "undefined") {
		return;
	}

	const html = document.documentElement;

	// Apply dark/light class
	if (config.mode === "dark") {
		html.classList.add("dark");
		html.classList.remove("light");
	} else {
		html.classList.add("light");
		html.classList.remove("dark");
	}

	// Apply accent colors as CSS variables
	html.style.setProperty("--theme-accent-primary", ACCENT_COLORS[config.accent].primary);
	html.style.setProperty("--theme-accent-secondary", ACCENT_COLORS[config.accent].secondary);
}

function applyThemeChange(config: ThemeConfig): void {
	if (config.mode === currentTheme.mode && config.accent === currentTheme.accent) {
		return;
	}
	currentTheme = config;
	applyThemeToDocument(config);
	notifyThemeStoreListeners();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Set the theme mode (light/dark).
 */
export function setThemeMode(mode: ThemeId): void {
	const next = { ...currentTheme, mode };
	writeStoredTheme(next);
	applyThemeChange(next);
}

/**
 * Set the accent color preset.
 */
export function setAccentPreset(accent: AccentPreset): void {
	const next = { ...currentTheme, accent };
	writeStoredTheme(next);
	applyThemeChange(next);
}

/**
 * Preview a theme change without persisting.
 */
export function previewTheme(config: ThemeConfig): void {
	applyThemeChange(config);
}

/**
 * Save and apply a theme configuration.
 */
export function saveTheme(config: ThemeConfig): void {
	writeStoredTheme(config);
	applyThemeChange(config);
}

/**
 * Initialize theme from storage. Call once on app mount.
 */
export function initializeTheme(): void {
	const stored = readStoredTheme();
	currentTheme = stored;
	applyThemeToDocument(stored);
}

/**
 * Get terminal colors for the given theme mode.
 */
export function getTerminalThemeColors(mode?: ThemeId): ThemeTerminalColors {
	const id = mode ?? currentTheme.mode;
	return TERMINAL_COLORS[id];
}

// ---------------------------------------------------------------------------
// React Hook
// ---------------------------------------------------------------------------

/**
 * React hook for theme state. Returns current theme and setters.
 */
export function useTheme(): {
	mode: ThemeId;
	accent: AccentPreset;
	isDark: boolean;
	setMode: (mode: ThemeId) => void;
	setAccent: (accent: AccentPreset) => void;
} {
	const theme = useSyncExternalStore(subscribeThemeStore, readThemeSnapshot, readThemeSnapshot);

	const setMode = useCallback((next: ThemeId) => {
		setThemeMode(next);
	}, []);

	const setAccent = useCallback((next: AccentPreset) => {
		setAccentPreset(next);
	}, []);

	return {
		mode: theme.mode,
		accent: theme.accent,
		isDark: theme.mode === "dark",
		setMode,
		setAccent,
	};
}

// ---------------------------------------------------------------------------
// BACKWARD COMPATIBILITY EXPORTS (TODO: remove after migration)
// ---------------------------------------------------------------------------

/** Theme group for settings dialog */
export interface ThemeGroup {
	readonly key: string;
	readonly label: string;
}

/** Theme groups for the settings UI */
export const THEME_GROUPS: readonly ThemeGroup[] = [
	{ key: "dark", label: "Dark" },
	{ key: "light", label: "Light" },
];

/** @deprecated Use readStoredTheme instead */
export function readStoredThemeId(): string {
	return readStoredTheme().mode;
}

/** @deprecated Use saveTheme instead */
export function saveThemeId(themeId: string): void {
	const mode = LEGACY_THEME_TO_MODE[themeId];
	if (mode) {
		const current = readStoredTheme();
		saveTheme({ mode, accent: current.accent });
	}
}

/** @deprecated Use previewTheme instead */
export function previewThemeId(themeId: string): void {
	const mode = LEGACY_THEME_TO_MODE[themeId];
	if (mode) {
		const current = readStoredTheme();
		applyThemeToDocument({ mode, accent: current.accent });
	}
}

/** @deprecated Check against THEMES array instead */
export function isThemeId(value: string | null): value is ThemeId {
	return value !== null && (isValidMode(value) || value in LEGACY_THEME_TO_MODE);
}
