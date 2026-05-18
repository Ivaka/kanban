import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";

import { cn } from "@/components/ui/cn";

export type ButtonVariant = "default" | "primary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	icon?: ReactNode;
	iconRight?: ReactNode;
	fill?: boolean;
}

/**
 * Standardized button variants.
 *
 * - primary: Main CTA - solid brand color, no border
 * - default: Secondary action - subtle border + background
 * - danger: Destructive action - subtle error border
 * - ghost: Low emphasis - transparent, appears on hover
 */
const variantStyles: Record<ButtonVariant, string> = {
	// Primary: Solid brand for main CTAs
	primary:
		"bg-action-brand text-action-brand-text border-0 shadow-sm hover:bg-action-brand-hover hover:shadow-md active:shadow-sm active:translate-y-px",

	// Default: Secondary with subtle border
	default:
		"bg-bg-surface border border-border-default text-text-primary shadow-sm hover:border-border-emphasis hover:bg-bg-tag hover:shadow active:bg-bg-sidebar active:shadow-sm",

	// Danger: Destructive with error accent
	danger:
		"bg-bg-surface border border-status-error/40 text-status-error shadow-sm hover:bg-status-error-bg hover:border-status-error/60 hover:shadow active:bg-status-error/20 active:shadow-sm",

	// Ghost: Transparent, for toolbars and subtle actions
	ghost: "bg-transparent border-0 text-text-secondary hover:text-text-primary hover:bg-surface-3 active:bg-surface-4",
};

const sizeStyles: Record<ButtonSize, string> = {
	sm: "h-7 px-2 text-xs gap-1.5",
	md: "h-8 px-3 text-[13px] gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{ variant = "default", size = "md", icon, iconRight, fill, children, className, disabled, ...props },
	ref,
) {
	const iconOnly = !children && !!(icon || iconRight);
	const buttonType = props.type ?? "button";

	return (
		<button
			ref={ref}
			type={buttonType}
			className={cn(
				"inline-flex items-center justify-center rounded-md font-medium cursor-pointer select-none",
				"disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none",
				"focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-action-brand",
				"transition-all duration-150 ease-out",
				variantStyles[variant],
				sizeStyles[size],
				fill && "w-full",
				iconOnly && "px-0 aspect-square",
				className,
			)}
			disabled={disabled}
			{...props}
		>
			{icon}
			{children}
			{iconRight}
		</button>
	);
});
