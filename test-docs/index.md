---
title: Welcome to Smart Docs
description: A local documentation viewer for AI-native codebases
---

# Welcome to Smart Docs

This is a test documentation file to demonstrate the Smart Docs viewer.

## Features

- **Markdown rendering** with syntax highlighting
- **Claude Code integration** - view skills, commands, agents, and hooks
- **Plugin management** - enable/disable plugins per project

## Code Example

```typescript
function hello(name: string): string {
  return `Hello, ${name}!`;
}
```

## Architecture

```mermaid
graph TD
    A[Browser] --> B[Next.js Frontend]
    B --> C[API Routes]
    C --> D[File System]
    C --> E[Socket.IO Server]
    E --> F[File Watcher]
    F --> D
```

## Request Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant FileSystem

    User->>Frontend: Select file
    Frontend->>API: GET /api/docs/content
    API->>FileSystem: Read markdown
    FileSystem-->>API: File content
    API-->>Frontend: Parsed content
    Frontend-->>User: Rendered markdown
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Ready: Files loaded
    Loading --> Error: Load failed
    Ready --> Viewing: Select file
    Viewing --> Ready: Clear selection
    Error --> Loading: Retry
```

## Next Steps

- Check out the Claude Config tab to see your Claude Code setup
- Visit the Plugins tab to manage your installed plugins
