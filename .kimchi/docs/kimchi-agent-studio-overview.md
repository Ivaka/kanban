# Kimchi Agent Studio (Kanban) - Codebase Overview

## What is this project?

Kanban is a local web-based IDE for orchestrating multiple CLI agents in parallel. It provides a kanban board interface where each card represents a task that runs in its own isolated git worktree. This allows agents to work in parallel without merge conflicts.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              React Frontend                              │
│                          (web-ui/src/)                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Kanban Board │  │ Card Detail  │  │  Terminal    │  │  Git Diff   │  │
│  │              │  │    View      │  │   Panel      │  │   Viewer    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                                          │
│  Communication: tRPC (type-safe RPC over HTTP/WebSocket)                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Node.js Backend                                 │
│                          (src/)                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  CLI Entry   │  │   tRPC API   │  │ Git Worktree │  │   Cline     │  │
│  │   (cli.ts)   │  │   Router     │  │   Manager    │  │    SDK      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                                          │
│  Key: Each task card gets its own git worktree + terminal session        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Concepts

| Term | Description |
|------|-------------|
| **Workspace** | A git repository being managed by Kanban |
| **Task/Card** | A unit of work on the kanban board |
| **Column** | Board columns: `backlog` → `in_progress` → `review` → `trash` |
| **Worktree** | Git worktree created for each task to isolate changes |
| **Dependency** | Link between tasks - when one completes, dependent tasks auto-start |
| **Agent** | CLI agent (Cline, etc.) running in a task's terminal session |

---

## Backend Structure (`src/`)

### Entry Point
- **`cli.ts`** - Main CLI entry, argument parsing, server lifecycle management

### API Layer (`src/trpc/`)
- **`app-router.ts`** - Main tRPC router defining all API endpoints
- **`runtime-api.ts`** - Runtime operations (config, task sessions, shell)
- **`workspace-api.ts`** - Workspace operations (git, worktrees, state)
- **`projects-api.ts`** - Project management (add/remove/list)
- **`hooks-api.ts`** - Hook events from agents

### Core Services (`src/server/`)
- **`runtime-server.ts`** - HTTP server setup, tRPC handler
- **`runtime-state-hub.ts`** - Central state management hub
- **`workspace-registry.ts`** - Manages multiple workspaces
- **`directory-picker.ts`** - Native directory picker integration
- **`browser.ts`** - Browser auto-open functionality

### Git & Worktree Management (`src/workspace/`)
- **`task-worktree.ts`** - Create/manage per-task git worktrees
- **`git-sync.ts`** - Git pull/push/fetch operations
- **`git-history.ts`** - Commit history queries
- **`get-workspace-changes.ts`** - Diff generation
- **`turn-checkpoints.ts`** - Agent turn checkpoint system

### Agent Integration (`src/cline-sdk/`)
- **`cline-task-session-service.ts`** - Manages Cline agent sessions
- **`cline-session-runtime.ts`** - Runtime for agent execution
- **`cline-provider-service.ts`** - LLM provider management
- **`cline-mcp-runtime-service.ts`** - MCP (Model Context Protocol) support

### Terminal (`src/terminal/`)
- **`session-manager.ts`** - Manages terminal sessions using node-pty

### Configuration (`src/config/`)
- **`runtime-config.ts`** - Runtime settings loading/saving

---

## Frontend Structure (`web-ui/src/`)

### Main Entry
- **`App.tsx`** - Main app component, orchestrates all hooks and surfaces
- **`main.tsx`** - React entry point

### Core Types (`web-ui/src/types/`)
- **`board.ts`** - Core data models (BoardCard, BoardColumn, BoardDependency)

```typescript
// Key interfaces from board.ts
interface BoardCard {
  id: string;
  title: string;
  prompt: string;
  baseRef: string;        // Git branch the task is based on
  autoReviewEnabled?: boolean;
  autoReviewMode?: "commit" | "pr";
  agentId?: string;       // Which CLI agent to use
  kimchiSettings?: {...};  // Cline-specific settings
}

interface BoardColumn {
  id: "backlog" | "in_progress" | "review" | "trash";
  title: string;
  cards: BoardCard[];
}

interface BoardDependency {
  id: string;
  fromTaskId: string;     // Task that blocks
  toTaskId: string;       // Task that is blocked
}
```

### Components (`web-ui/src/components/`)

#### Main Board
- **`kanban-board.tsx`** - Main kanban board with drag-drop
- **`board-column.tsx`** - Individual columns
- **`board-card.tsx`** - Task cards
- **`card-detail-view.tsx`** - Detailed task view (opens when clicking card)

#### Detail Panels (`detail-panels/`)
- **`agent-terminal-panel.tsx`** - Terminal for the agent session
- **`diff-viewer-panel.tsx`** - Git diff viewer
- **`cline-agent-chat-panel.tsx`** - Chat interface with agent
- **`column-context-panel.tsx`** - Column-level context panel
- **`file-tree-panel.tsx`** - File tree view

#### Dialogs & Settings
- **`runtime-settings-dialog.tsx`** - Settings modal
- **`task-create-dialog.tsx`** - Create new task
- **`add-project-dialog.tsx`** - Add new project/workspace
- **`git-history-view.tsx`** - Git history browser

#### UI Primitives (`ui/`)
- **`button.tsx`** - Button component
- **`dialog.tsx`** - Dialog containers
- **`tooltip.tsx`** - Tooltips
- **`spinner.tsx`** - Loading spinners

### State Management
- **`state/board-state.ts`** - Board state mutations, drag rules, card operations
- **`stores/workspace-metadata-store.ts`** - Workspace metadata storage

### Runtime Integration (`web-ui/src/runtime/`)
- **`use-workspace-persistence.ts`** - Sync with backend
- **`native-agent.ts`** - Native Cline agent integration
- **`trpc-client.ts`** - tRPC client setup

### Hooks (`web-ui/src/hooks/`)
- **`use-task-sessions.ts`** - Task session lifecycle
- **`use-project-navigation.ts`** - Project switching
- **`use-git-actions.ts`** - Git operations from UI

---

## tRPC API Overview

The frontend and backend communicate via type-safe tRPC endpoints:

### Runtime Namespace (`runtime.*`)
| Endpoint | Purpose |
|----------|---------|
| `getConfig` | Load runtime settings |
| `saveConfig` | Save runtime settings |
| `startTaskSession` | Start an agent session for a task |
| `stopTaskSession` | Stop an agent session |
| `sendTaskSessionInput` | Send input to agent terminal |
| `getTaskChatMessages` | Get chat history for a task |
| `sendTaskChatMessage` | Send chat message to agent |
| `startShellSession` | Start a shell session |
| `runCommand` | Run a command in workspace |

### Workspace Namespace (`workspace.*`)
| Endpoint | Purpose |
|----------|---------|
| `getGitSummary` | Get git status summary |
| `runGitSyncAction` | Pull/push/fetch |
| `checkoutGitBranch` | Switch branches |
| `getChanges` | Get file changes/diffs |
| `ensureWorktree` | Create task worktree |
| `deleteWorktree` | Delete task worktree |
| `getState` | Load board state |
| `saveState` | Save board state |
| `searchFiles` | Search files in workspace |
| `getGitLog` | Get commit history |

### Projects Namespace (`projects.*`)
| Endpoint | Purpose |
|----------|---------|
| `list` | List all projects |
| `add` | Add new project |
| `remove` | Remove project |
| `pickDirectory` | Open directory picker |

---

## Key Workflows

### 1. Creating a Task
1. User clicks "Add Task" in a column
2. Frontend opens `task-create-dialog.tsx`
3. User enters title, prompt, selects agent
4. On submit: `workspace.saveState` called with new card
5. Backend stores in workspace state file

### 2. Starting a Task
1. User clicks play button on card
2. Frontend calls `runtime.startTaskSession`
3. Backend:
   - Calls `ensureWorktree` to create git worktree
   - Sets up terminal session via node-pty
   - Launches agent process in worktree
4. Terminal panel shows live output

### 3. Moving Cards Between Columns
1. User drags card to new column
2. `state/board-state.ts` handles drag logic
3. On drop: `workspace.saveState` persists new layout
4. Special behaviors:
   - Moving to `in_progress` → can auto-start session
   - Moving to `trash` → deletes worktree (after confirmation)

### 4. Dependency Chain Auto-Start
1. User creates dependency with ⌘+click
2. Dependency stored in `BoardDependency`
3. When a card moves to `trash`:
   - Check for cards that depend on it
   - Auto-start those tasks if configured

### 5. Commit/PR Workflow
1. User clicks "Commit" or "Open PR" in card detail
2. Frontend sends dynamic prompt to agent
3. Agent:
   - Stages changes in worktree
   - Creates commit or PR branch
   - Handles any merge conflicts
4. Worktree changes reflected in base branch

---

## Development Commands

```bash
# Build everything
npm run build

# Dev mode
npm run dev                    # Backend dev
npm run web:dev               # Frontend dev only
npm run dev:full              # Full dev mode

# Testing
npm run test                  # Run all tests
npm run test:fast             # Fast tests only
npm run test:integration      # Integration tests

# Code quality
npm run lint                  # Biome linting
npm run format                # Format code
npm run check                 # Full check (lint + typecheck + test)

# Link local build
npm run link                  # Link for local testing
```

---

## Common Extension Points

| Feature | Where to Add |
|---------|--------------|
| New board column | `web-ui/src/types/board.ts` → update `BoardColumnId` |
| New card field | `web-ui/src/types/board.ts` → update `BoardCard` |
| New git operation | `src/workspace/git-*.ts` → add to `workspace-api.ts` |
| New setting | `src/config/runtime-config.ts` → UI in `runtime-settings-dialog.tsx` |
| New agent type | `src/cline-sdk/` → update agent detection |
| New tRPC endpoint | `src/trpc/app-router.ts` + implement in `*-api.ts` |

---

## Important Files for Common Tasks

| Task | Key Files |
|------|-----------|
| Change board layout | `web-ui/src/components/kanban-board.tsx`, `board-column.tsx`, `board-card.tsx` |
| Modify task card UI | `web-ui/src/components/board-card.tsx`, `card-detail-view.tsx` |
| Add git functionality | `src/workspace/git-*.ts`, `src/trpc/workspace-api.ts` |
| Change agent behavior | `src/cline-sdk/cline-task-session-service.ts` |
| Add settings | `src/config/runtime-config.ts`, `web-ui/src/components/runtime-settings-dialog.tsx` |
| Update board state logic | `web-ui/src/state/board-state.ts` |
| Modify terminal | `src/terminal/session-manager.ts`, `web-ui/src/components/detail-panels/agent-terminal-panel.tsx` |

---

## Key Dependencies

### Backend
- `@clinebot/core` - Cline agent SDK
- `@trpc/server` - Type-safe RPC
- `node-pty` - Terminal emulation
- `commander` - CLI parsing
- `zod` - Schema validation
- `ws` - WebSocket server

### Frontend
- `react` + `typescript`
- `@trpc/client` - tRPC client
- `@hello-pangea/dnd` - Drag and drop
- `lucide-react` - Icons
- `zustand` - State management (via stores)
