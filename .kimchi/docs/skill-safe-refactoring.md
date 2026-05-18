---
name: safe-refactoring
description: Patterns for safely refactoring identifiers and module exports
tags: [refactoring, lsp, exports, imports, backward-compatibility]
---

# Safe Refactoring Patterns

Techniques for safely renaming, moving, or removing symbols in TypeScript/JavaScript codebases while maintaining backward compatibility and avoiding breaking changes.

## Before Deleting or Renaming Symbols

Always use `lsp_references` to understand the full impact before making changes:

```bash
# Find all usages of a symbol before deleting or renaming it
lsp_references --file_path src/module.ts --line 10 --character 15
```

This prevents:
- Breaking imports in other files
- Missing call sites
- Breaking external consumers of your module

## Export Aliasing for Backward Compatibility

When renaming exports, maintain backward compatibility using export aliases during gradual migrations:

```typescript
// OLD name kept as alias during transition
export { newFunctionName as oldFunctionName };

// Full example
export function detectInstalledCommands() { /* ... */ }

// Temporary alias for backward compatibility
export { detectInstalledCommands as checkAgentsInstalled };
```

Remove aliases only after all consumers have migrated.

## Refactoring Sequencing

When moving code between modules, follow this order:

1. **Add exports at new location first** (with aliases for compatibility)
2. **Update imports in consumers** (using new path or new name)
3. **Remove from old location** (after all refs updated)

This prevents intermediate broken states.

## When User Says "Stop" (Review Mode)

If a user asks you to "check", "review", "verify", or "summarize" and then says "Stop":

1. **Cease all file modifications immediately**
2. **Report your findings only** — do not continue making changes
3. **Wait for explicit next direction** before resuming edits

The user has switched from "fix things" mode to "understand the situation" mode. Respect this boundary.
