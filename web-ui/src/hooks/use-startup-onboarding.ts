import { useCallback, useEffect, useState } from "react";
import { shouldShowStartupOnboardingDialog } from "@/runtime/onboarding";
import type { RuntimeConfigResponse } from "@/runtime/types";
import { LocalStorageKey } from "@/storage/local-storage-store";
import { useBooleanLocalStorageValue } from "@/utils/react-use";

interface UseStartupOnboardingOptions {
	currentProjectId: string | null;
	runtimeProjectConfig: RuntimeConfigResponse | null;
	isRuntimeProjectConfigLoading: boolean;
	isTaskAgentReady: boolean | null;
	refreshRuntimeProjectConfig: () => void;
	refreshSettingsRuntimeProjectConfig: () => void;
}

export interface UseStartupOnboardingResult {
	isStartupOnboardingDialogOpen: boolean;
	handleOpenStartupOnboardingDialog: () => void;
	handleCloseStartupOnboardingDialog: () => void;
	handleOnboardingClineSetupSaved: () => void;
}

export function useStartupOnboarding(options: UseStartupOnboardingOptions): UseStartupOnboardingResult {
	const {
		currentProjectId,
		runtimeProjectConfig,
		isRuntimeProjectConfigLoading,
		refreshRuntimeProjectConfig,
		refreshSettingsRuntimeProjectConfig,
	} = options;
	const [isStartupOnboardingDialogOpen, setIsStartupOnboardingDialogOpen] = useState(false);
	const [isStartupOnboardingDialogForcedOpen, setIsStartupOnboardingDialogForcedOpen] = useState(false);
	const [didDismissStartupOnboardingForSession, setDidDismissStartupOnboardingForSession] = useState(false);
	const [hasShownOnboardingDialog, setHasShownOnboardingDialog] = useBooleanLocalStorageValue(
		LocalStorageKey.OnboardingDialogShown,
		false,
	);
	useEffect(() => {
		setDidDismissStartupOnboardingForSession(false);
		setIsStartupOnboardingDialogForcedOpen(false);
	}, [currentProjectId]);

	useEffect(() => {
		if (isRuntimeProjectConfigLoading && runtimeProjectConfig === null) {
			setIsStartupOnboardingDialogOpen(false);
			return;
		}
		if (isStartupOnboardingDialogForcedOpen) {
			setIsStartupOnboardingDialogOpen(true);
			return;
		}
		if (didDismissStartupOnboardingForSession) {
			setIsStartupOnboardingDialogOpen(false);
			return;
		}
		setIsStartupOnboardingDialogOpen(
			shouldShowStartupOnboardingDialog({
				hasShownOnboardingDialog,
			}),
		);
	}, [
		didDismissStartupOnboardingForSession,
		hasShownOnboardingDialog,
		isStartupOnboardingDialogForcedOpen,
		isRuntimeProjectConfigLoading,
		runtimeProjectConfig,
	]);

	const handleOpenStartupOnboardingDialog = useCallback(() => {
		setDidDismissStartupOnboardingForSession(false);
		setIsStartupOnboardingDialogForcedOpen(true);
		setIsStartupOnboardingDialogOpen(true);
	}, []);

	const handleCloseStartupOnboardingDialog = useCallback(() => {
		setIsStartupOnboardingDialogForcedOpen(false);
		setHasShownOnboardingDialog(true);
		setDidDismissStartupOnboardingForSession(true);
		setIsStartupOnboardingDialogOpen(false);
	}, [setHasShownOnboardingDialog]);

	const handleOnboardingClineSetupSaved = useCallback(() => {
		refreshRuntimeProjectConfig();
		refreshSettingsRuntimeProjectConfig();
	}, [refreshRuntimeProjectConfig, refreshSettingsRuntimeProjectConfig]);

	return {
		isStartupOnboardingDialogOpen,
		handleOpenStartupOnboardingDialog,
		handleCloseStartupOnboardingDialog,
		handleOnboardingClineSetupSaved,
	};
}
