import { type ReactElement, useCallback, useEffect, useState } from "react";

import { cn } from "@/components/ui/cn";
import { useRuntimeSettingsClineController } from "@/hooks/use-runtime-settings-cline-controller";
import type { RuntimeAgentId, RuntimeConfigResponse } from "@/runtime/types";

interface OnboardingSlide {
	title: string;
	description: string;
	assetVideoUrl?: string;
	assetImageUrl?: string;
	assetStemPath?: string;
	assetAlt: string;
	assetWidthPx: number;
	assetHeightPx: number;
	assetFrameWidthPx?: number;
	assetFrameHeightPx?: number;
	assetObjectFit?: "contain" | "cover";
}

interface OnboardingDoneResult {
	ok: boolean;
	message?: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
	{
		title: "Create tasks with Kanban",
		description:
			"Press c to create a task yourself, or talk to the sidebar Kanban agent to plan work for you. It can pull projects and issues from Linear and GitHub, then turn them into tasks your coding agent can pick up.",
		assetVideoUrl: "https://github.com/user-attachments/assets/4408930c-33cd-4af9-a343-e82b099eab8c",
		assetAlt: "Talking to the sidebar Kanban agent to create tasks from Linear and GitHub",
		assetWidthPx: 1908,
		assetHeightPx: 720,
	},
	{
		title: "Auto commit and link",
		description:
			"Create dependency chains of linked tasks that start one another automatically. Agents can auto commit their work as they finish, so you can orchestrate tasks in order and watch the board burn them down automatically.",
		assetVideoUrl: "https://github.com/user-attachments/assets/9a979242-bd22-4ac1-94c5-3ed5351a99d1",
		assetAlt: "Linking task cards in Cline Kanban",
		assetWidthPx: 1156,
		assetHeightPx: 720,
	},
	{
		title: "Review changes with comments",
		description:
			"Your workflow will feel like writing tickets, reviewing code, and shipping. Watch the agent work next to real-time diffs, then click lines to leave comments like you're reviewing a PR.",
		assetVideoUrl: "https://github.com/user-attachments/assets/17992035-c1ca-449a-a48b-bb094007f0a1",
		assetAlt: "Leaving comments on code diffs in Cline Kanban",
		assetWidthPx: 1616,
		assetHeightPx: 1080,
	},
];

const DEFAULT_AGENT_ID: RuntimeAgentId = "kimchi";
const FALLBACK_ONBOARDING_SLIDE = {
	title: "",
	description: "",
} as OnboardingSlide;
const ONBOARDING_MEDIA_FRAME_REFERENCE_SLIDE =
	ONBOARDING_SLIDES.reduce<OnboardingSlide | null>((tallestSlide, slide) => {
		if (tallestSlide === null) {
			return slide;
		}
		const tallestRelativeHeight = tallestSlide.assetHeightPx / tallestSlide.assetWidthPx;
		const slideRelativeHeight = slide.assetHeightPx / slide.assetWidthPx;
		return slideRelativeHeight > tallestRelativeHeight ? slide : tallestSlide;
	}, null) ?? null;
const ONBOARDING_MEDIA_FRAME_WIDTH_PX = ONBOARDING_MEDIA_FRAME_REFERENCE_SLIDE?.assetWidthPx ?? 0;
const ONBOARDING_MEDIA_FRAME_HEIGHT_PX = ONBOARDING_MEDIA_FRAME_REFERENCE_SLIDE?.assetHeightPx ?? 0;

function OnboardingMedia({
	assetStemPath,
	assetVideoUrl,
	assetImageUrl,
	assetWidthPx,
	assetHeightPx,
	assetFrameWidthPx,
	assetFrameHeightPx,
	assetObjectFit,
	alt,
}: {
	assetStemPath?: string;
	assetVideoUrl?: string;
	assetImageUrl?: string;
	assetWidthPx?: number;
	assetHeightPx?: number;
	assetFrameWidthPx?: number;
	assetFrameHeightPx?: number;
	assetObjectFit?: "contain" | "cover";
	alt: string;
}): ReactElement {
	const [assetMode, setAssetMode] = useState<"video" | "image" | "missing">("video");
	const [isVideoLoading, setIsVideoLoading] = useState(true);
	const videoPath = assetVideoUrl ?? (assetStemPath ? `${assetStemPath}.mp4` : null);
	const imagePath = assetImageUrl ?? (assetStemPath ? `${assetStemPath}.gif` : null);
	const mediaWidth = assetWidthPx;
	const mediaHeight = assetHeightPx;
	const frameWidth = assetFrameWidthPx ?? assetWidthPx;
	const frameHeight = assetFrameHeightPx ?? assetHeightPx;
	const objectFitClassName = assetObjectFit === "cover" ? "object-cover" : "object-contain";
	const hasFrameSize = typeof frameWidth === "number" && typeof frameHeight === "number";
	const mediaContainerStyle = hasFrameSize
		? {
				aspectRatio: `${frameWidth} / ${frameHeight}`,
				maxWidth: `${frameWidth}px`,
				width: "100%",
			}
		: typeof frameWidth === "number"
			? {
					maxWidth: `${frameWidth}px`,
					width: "100%",
				}
			: {
					width: "100%",
				};
	const missingStateStyle =
		typeof frameWidth === "number" && typeof frameHeight === "number"
			? {
					maxHeight: `${frameHeight}px`,
					maxWidth: `${frameWidth}px`,
					width: "100%",
				}
			: typeof frameHeight === "number"
				? {
						maxHeight: `${frameHeight}px`,
						maxWidth: "100%",
						width: "auto",
					}
				: {
						width: "100%",
					};

	useEffect(() => {
		setAssetMode("video");
		setIsVideoLoading(true);
	}, [imagePath, videoPath]);

	if (assetMode === "missing") {
		return (
			<div className="flex w-full justify-center">
				<div
					className="flex min-h-[180px] w-full items-center justify-center rounded-md border border-dashed border-border-bright bg-surface-1 p-4 text-center"
					style={missingStateStyle}
				>
					<p className="m-0 text-xs text-text-secondary">
						Add onboarding media by setting a valid slide video or gif source.
					</p>
				</div>
			</div>
		);
	}

	if (assetMode === "video") {
		if (!videoPath) {
			if (!imagePath) {
				return (
					<div className="flex w-full justify-center">
						<div
							className="flex min-h-[180px] w-full items-center justify-center rounded-md border border-dashed border-border-bright bg-surface-1 p-4 text-center"
							style={mediaContainerStyle}
						>
							<p className="m-0 text-xs text-text-secondary">
								Add onboarding media by setting a valid slide video or gif source.
							</p>
						</div>
					</div>
				);
			}
			return (
				<div className="flex w-full justify-center">
					<div className="relative w-full overflow-hidden rounded-md bg-surface-1" style={mediaContainerStyle}>
						<img
							src={imagePath}
							alt={alt}
							onError={() => setAssetMode("missing")}
							width={mediaWidth}
							height={mediaHeight}
							className={cn("h-full w-full", objectFitClassName)}
						/>
					</div>
				</div>
			);
		}
		return (
			<div className="flex w-full justify-center">
				<div className="relative w-full overflow-hidden rounded-md bg-surface-1" style={mediaContainerStyle}>
					{isVideoLoading ? <div aria-hidden="true" className="kb-skeleton absolute inset-0" /> : null}
					<video
						src={videoPath}
						autoPlay
						loop
						muted
						playsInline
						preload="auto"
						width={mediaWidth}
						height={mediaHeight}
						onLoadedData={() => setIsVideoLoading(false)}
						onError={() => {
							setIsVideoLoading(false);
							setAssetMode(imagePath ? "image" : "missing");
						}}
						className={cn(
							"h-full w-full transition-opacity duration-200",
							objectFitClassName,
							isVideoLoading ? "opacity-0" : "opacity-100",
						)}
					/>
				</div>
			</div>
		);
	}

	if (!imagePath) {
		return (
			<div className="flex w-full justify-center">
				<div
					className="flex min-h-[180px] w-full items-center justify-center rounded-md border border-dashed border-border-bright bg-surface-1 p-4 text-center"
					style={mediaContainerStyle}
				>
					<p className="m-0 text-xs text-text-secondary">
						Add onboarding media by setting a valid slide video or gif source.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex w-full justify-center">
			<div className="relative w-full overflow-hidden rounded-md bg-surface-1" style={mediaContainerStyle}>
				<img
					src={imagePath}
					alt={alt}
					onError={() => setAssetMode("missing")}
					width={mediaWidth}
					height={mediaHeight}
					className={cn("h-full w-full", objectFitClassName)}
				/>
			</div>
		</div>
	);
}

export function TaskStartAgentOnboardingCarousel({
	open,
	workspaceId,
	runtimeConfig,
	activeSlideIndex,
	onClineSetupSaved,
	onDoneActionChange,
}: {
	open: boolean;
	workspaceId: string | null;
	runtimeConfig: RuntimeConfigResponse | null;
	activeSlideIndex: number;
	onClineSetupSaved?: () => void;
	onDoneActionChange?: (action: (() => Promise<OnboardingDoneResult>) | null) => void;
}): ReactElement {
	const currentSlide = ONBOARDING_SLIDES[activeSlideIndex] ?? ONBOARDING_SLIDES[0] ?? FALLBACK_ONBOARDING_SLIDE;
	const clineSettings = useRuntimeSettingsClineController({
		open,
		workspaceId,
		selectedAgentId: DEFAULT_AGENT_ID,
		config: runtimeConfig,
	});

	const handleDoneAction = useCallback(async (): Promise<OnboardingDoneResult> => {
		if (!clineSettings.hasUnsavedChanges) {
			return { ok: true };
		}
		const saveResult = await clineSettings.saveProviderSettings();
		if (!saveResult.ok) {
			const message = saveResult.message ?? "Could not save Cline provider settings.";
			return { ok: false, message };
		}
		onClineSetupSaved?.();
		return { ok: true };
	}, [clineSettings, onClineSetupSaved]);

	useEffect(() => {
		onDoneActionChange?.(handleDoneAction);
		return () => {
			onDoneActionChange?.(null);
		};
	}, [handleDoneAction, onDoneActionChange]);

	return (
		<div className="space-y-3">
			{open ? (
				<div aria-hidden="true" className="h-0 overflow-hidden opacity-0">
					{ONBOARDING_SLIDES.map((slide) =>
						slide.assetVideoUrl ? (
							<video key={slide.assetVideoUrl} src={slide.assetVideoUrl} preload="auto" muted playsInline />
						) : null,
					)}
				</div>
			) : null}

			<div>
				<h4 className="m-0 text-[15px] font-semibold text-text-primary">{currentSlide?.title}</h4>
				<p className="mt-1 mb-0 text-[13px] text-text-secondary">{currentSlide?.description}</p>
			</div>

			<OnboardingMedia
				assetStemPath={currentSlide.assetStemPath}
				assetVideoUrl={currentSlide.assetVideoUrl}
				assetImageUrl={currentSlide.assetImageUrl}
				assetWidthPx={currentSlide.assetWidthPx}
				assetHeightPx={currentSlide.assetHeightPx}
				assetFrameWidthPx={currentSlide.assetFrameWidthPx ?? ONBOARDING_MEDIA_FRAME_WIDTH_PX}
				assetFrameHeightPx={currentSlide.assetFrameHeightPx ?? ONBOARDING_MEDIA_FRAME_HEIGHT_PX}
				assetObjectFit={currentSlide.assetObjectFit}
				alt={currentSlide.assetAlt}
			/>
		</div>
	);
}
