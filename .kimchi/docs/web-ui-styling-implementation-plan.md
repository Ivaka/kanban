# Kimchi Studio Web-UI Styling Implementation Plan

## Decisions

1. **Themes**: Light/Dark with configuration presets (simplified from 8 themes)
2. **Naming**: Adopt semantic naming where feasible, keep current as fallback
3. **Borders**: Switch to `rgba()` opacity blending

## Implementation Steps

### Step 1: Update globals.css Foundation

**File**: `web-ui/src/styles/globals.css`

Remove the multiple `[data-theme="..."]` blocks and replace with:

```css
/* 1. Primitives (8 scales × 9 stops) */
:root {
  --primitive-grey-50: #ededed; ... --primitive-grey-800: #181818;
  --primitive-orange-50: #ffece5; ... --primitive-orange-800: #2e0c04;
  --primitive-teal-50: #dbf5f5; ... --primitive-teal-800: #001c1c;
  --primitive-pink-50: #ffe5ee; ... --primitive-pink-800: #350318;
  --primitive-blue-50: #ebeeff; ... --primitive-blue-800: #06163b;
  --primitive-green-50: #eff7ca; ... --primitive-green-800: #111e02;
  --primitive-purple-50: #f0ebff; ... --primitive-purple-800: #1f0866;
  --primitive-yellow-50: #f8f1d3; ... --primitive-yellow-800: #1e1902;
}

/* 2. Base radius */
:root {
  --radius: 0.875rem;
}

/* 3. Theme mappings via --color-* prefix for Tailwind v4 */
@theme inline {
  /* Primitives exposed as Tailwind colors */
  --color-grey-50: var(--primitive-grey-50);
  --color-grey-100: var(--primitive-grey-100);
  ... all 8 scales × 9 stops ...

  /* Semantic backgrounds */
  --color-bg-page: var(--color-grey-50);
  --color-bg-surface: #ffffff;
  --color-bg-surface-raised: #ffffff;
  --color-bg-sidebar: #ffffff;
  --color-bg-tag: var(--color-grey-100);
  --color-bg-input: #ffffff;

  /* Semantic actions */
  --color-action-brand: var(--color-orange-400);
  --color-action-brand-hover: var(--color-orange-500);
  --color-action-brand-text: #ffffff;
  --color-action-primary: var(--color-grey-800);
  --color-action-primary-hover: var(--color-grey-700);
  --color-action-primary-text: #ffffff;
  --color-action-secondary: #ffffff;
  --color-action-secondary-border: var(--color-grey-200);

  /* Semantic text */
  --color-text-primary: var(--color-grey-800);
  --color-text-secondary: var(--color-grey-600);
  --color-text-tertiary: var(--color-grey-400);
  --color-text-disabled: var(--color-grey-300);
  --color-text-inverse: #ffffff;
  --color-text-accent: var(--color-orange-400);
  --color-text-link: var(--color-orange-500);

  /* Semantic borders - with rgba for opacity blending */
  --color-border-subtle: rgba(0, 0, 0, 0.05);
  --color-border-default: rgba(0, 0, 0, 0.1);
  --color-border-emphasis: rgba(0, 0, 0, 0.2);
  --color-border-accent: var(--color-orange-400);

  /* Semantic status (teal = success, orange = error) */
  --color-status-success: var(--color-teal-400);
  --color-status-success-bg: rgba(0, 146, 147, 0.15);
  --color-status-error: var(--color-orange-400);
  --color-status-error-bg: rgba(244, 87, 46, 0.15);
  --color-status-warning: var(--color-yellow-400);
  --color-status-warning-bg: rgba(217, 180, 19, 0.15);
  --color-status-info: var(--color-blue-400);
  --color-status-info-bg: rgba(64, 124, 248, 0.15);

  /* Chart categorical palette */
  --color-chart-1: #ff6433;
  --color-chart-2: #c7ea0c;
  ... chart series ...

  /* Typography */
  --font-display: "Geist", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Border radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* 4. Dark mode overrides */
.dark,
:root:has(.dark) {
  /* Backgrounds */
  --color-bg-page: var(--color-grey-800);
  --color-bg-surface: #1c1c20;
  --color-bg-surface-raised: #242428;
  --color-bg-sidebar: #141416;
  --color-bg-tag: var(--color-grey-700);
  --color-bg-input: #1c1c20;

  /* Actions - inverted for dark */
  --color-action-brand: var(--color-orange-400);
  --color-action-brand-hover: var(--color-orange-300);
  --color-action-brand-text: #ffffff;
  --color-action-primary: var(--color-grey-50);
  --color-action-primary-hover: var(--color-grey-100);
  --color-action-primary-text: var(--color-grey-800);
  --color-action-secondary: #242428;
  --color-action-secondary-border: var(--color-grey-600);

  /* Text - inverted */
  --color-text-primary: var(--color-grey-50);
  --color-text-secondary: var(--color-grey-300);
  --color-text-tertiary: var(--color-grey-500);
  --color-text-disabled: var(--color-grey-600);
  --color-text-inverse: var(--color-grey-800);
  --color-text-accent: var(--color-orange-300);
  --color-text-link: var(--color-orange-200);

  /* Borders - with rgba for opacity blending */
  --color-border-subtle: rgba(255, 255, 255, 0.05);
  --color-border-default: rgba(255, 255, 255, 0.1);
  --color-border-emphasis: rgba(255, 255, 255, 0.2);
  --color-border-accent: var(--color-orange-400);

  /* Status backgrounds - darker for dark mode */
  --color-status-success-bg: rgba(133, 222, 222, 0.1);
  --color-status-error-bg: rgba(255, 82, 29, 0.1);
  --color-status-warning-bg: rgba(251, 233, 152, 0.1);
  --color-status-info-bg: rgba(124, 150, 255, 0.1);
}

/* 5. Legacy compatibility layer (remove after migration) */
@theme {
  /* Map old surface tokens to new semantic tokens for gradual migration */
  --color-surface-0: var(--color-bg-page);
  --color-surface-1: var(--color-bg-surface);
  --color-surface-2: var(--color-bg-surface-raised);
  --color-surface-3: var(--color-bg-tag);
  --color-surface-4: var(--color-grey-700);

  --color-accent: var(--color-action-brand);
  --color-accent-hover: var(--color-action-brand-hover);
  --color-accent-fg: var(--color-action-brand-text);

  --color-border: var(--color-border-default);
  --color-border-bright: var(--color-border-emphasis);
  --color-border-focus: var(--color-orange-400);

  --color-divider: var(--color-border-subtle);

  --color-text-primary: var(--color-text-primary);
  --color-text-secondary: var(--color-text-secondary);
  --color-text-tertiary: var(--color-text-tertiary);

  --color-status-blue: var(--color-blue-400);
  --color-status-green: var(--color-status-success);
  --color-status-orange: var(--color-orange-400);
  --color-status-red: var(--color-status-error);
  --color-status-purple: var(--color-purple-400);
  --color-status-gold: var(--color-yellow-400);
  --color-status-violet: var(--color-purple-500);
  --color-status-rose: var(--color-pink-500);
  --color-status-cyan: var(--color-teal-400);
  --color-status-lime: var(--color-green-400);
}

/* 6. Animations (optional additions) */
@keyframes shimmer {
  0% { background-position: 100% center; }
  100% { background-position: -100% center; }
}

@keyframes pulse-gentle {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.05); }
}
```

### Step 2: Update Button Component

**File**: `web-ui/src/components/ui/button.tsx`

Update variant styles to use semantic tokens:

```tsx
const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-bg-surface border border-border-default text-text-primary hover:bg-bg-tag hover:border-border-emphasis",
  primary: "bg-action-brand text-action-brand-text border border-transparent hover:bg-action-brand-hover",
  danger: "bg-status-error-bg text-status-error border border-status-error/30 hover:bg-status-error/20",
  ghost: "bg-transparent text-text-secondary border border-transparent hover:text-text-primary hover:bg-bg-tag",
};
```

### Step 3: Add Theme Context/Hook

**New file**: `web-ui/src/hooks/use-theme.ts`

Simple theme toggle that sets `.dark` class on `<html>`:

```tsx
export function useTheme() {
  const [isDark, setIsDark] = useState(() => 
    document.documentElement.classList.contains('dark')
  );

  const toggle = useCallback(() => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  return { isDark, toggle };
}
```

### Step 4: Create Theme Configuration Preset

Users can configure accent color via preset instead of custom theme:

```tsx
// Preset options: default (orange), ocean (blue), forest (green), berry (pink)
const presets = {
  default: { accent: 'orange', accent2: 'teal' },
  ocean: { accent: 'blue', accent2: 'teal' },
  forest: { accent: 'green', accent2: 'teal' },
  berry: { accent: 'pink', accent2: 'purple' },
};
```

### Step 5: Border Opacity Migration

Components using explicit borders will automatically get `:root` values which handle the blending correctly since they're defined as `rgba()`.

For Tailwind utilities like `border-border-default`, the underlying CSS is `rgba(...)` so blending happens automatically.

### Critical CSS Classes to Update

| Old Class | New Semantic Class |
|-----------|-------------------|
| `bg-surface-0` | `bg-bg-page` |
| `bg-surface-1` | `bg-bg-surface` |
| `bg-surface-2` | `bg-bg-surface-raised` or `bg-bg-tag` |
| `text-text-primary` | Same name, new semantic mapping |
| `border-border` | `border-border-default` |
| `border-border-bright` | `border-border-emphasis` |
| `bg-accent` | `bg-action-brand` |
| `text-accent-fg` | `text-action-brand-text` |

---

## Files to Modify

1. `web-ui/src/styles/globals.css` - Complete refactor
2. `web-ui/src/components/ui/button.tsx` - Update variants
3. `web-ui/src/components/ui/dialog.tsx` - Update backgrounds
4. `web-ui/src/components/ui/input.tsx` (if exists) - Update input styles
5. `web-ui/src/components/top-bar.tsx` - Add theme toggle
6. `web-ui/index.html` - Ensure dark class support

## Migration Order

1. **Phase 1**: Update globals.css with new token system + legacy compatibility
2. **Phase 2**: Test - everything should work unchanged due to legacy mappings
3. **Phase 3**: Remove legacy theme blocks one by one
4. **Phase 4**: Update components to use semantic classes
5. **Phase 5**: Remove legacy compatibility layer
6. **Phase 6**: Add theme toggle to UI
