# Implementation Plan: Image to Diagram Converter

**Branch**: `001-image-to-diagram` | **Date**: 2026-05-22 | **Spec**: [spec.md](../specs/001-image-to-diagram/spec.md)

**Input**: Feature specification from `/specs/001-image-to-diagram/spec.md`

## Summary

Build a desktop Electron application that converts image URLs into diagram code (Mermaid, PlantUML, Graphviz, or ASCII) using external ML APIs (LM Studio, OpenAI, or Anthropic compatible endpoints). The app displays a live preview and saves output as Markdown files to the local filesystem.

## Technical Context

**Language/Version**: Node.js 20+ with TypeScript | NEEDS CLARIFICATION

**Primary Dependencies**: 
- Electron for desktop UI
- REST client (axios/node-fetch) for ML API calls
- File system APIs for save/open operations
- HTTP client for image fetching
- Retry library for ML API resilience
- Config file parser for user settings

**Storage**: Local filesystem (.md files in user-selected directory, config at ~/.image-diagram/config.json)

**Testing**: Jest + Playwright for E2E desktop testing | NEEDS CLARIFICATION

**Target Platform**: Windows, macOS, Linux (Electron)

**Project Type**: Desktop application (Electron)

**Performance Goals**: 
- Image fetch: <30s for standard networks
- ML API call: <60s excluding network latency
- UI responsiveness during processing

**Constraints**: 
- Must handle ML API failures with retry logic
- Must respect CORS policies when fetching images
- Must not store sensitive information (API keys in encrypted storage)
- Max image size: 10MB per image

**Scale/Scope**: Single-user desktop app, no multi-user collaboration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Principle I (Orchestration)**: Does the design handle fetch/convert/write failures?
  - *Status*: Addressed in NFR-007, NFR-008, FR-011 with retry logic and exponential backoff
  
- [x] **Principle II (Preservation)**: Is the file replacement logic surgical and safe?
  - *Status*: Resolved - Overwrite silently on save (FR-008)

- [x] **Principle III (Local-First)**: Are API keys and user data handled securely?
  - *Status*: Resolved - Credentials stored in config file (~/.image-diagram/config.json), not in Electron storage

- [x] **Principle IV (Electron)**: Does it utilize native desktop features correctly?
  - *Status*: Resolved - File dialogs for save/open, markdown preview in renderer

- [x] **Principle V (Extensibility)**: Is the diagram engine modular?
  - *Status*: Resolved - Dropdown selector for format choice (FR-006)

## Project Structure

### Documentation (this feature)

```text
specs/001-image-to-diagram/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── contracts/           # Phase 1 output (/speckit-plan command)
```

### Source Code (repository root)

```text
apps/image-to-diagram/
├── src/
│   ├── main/            # Electron main process
│   │   ├── index.ts     # Entry point
│   │   ├── app.ts       # App lifecycle
│   │   └── storage.ts   # File system operations
│   ├── preload/         # Preload scripts (bridge to renderer)
│   │   └── index.ts
│   ├── renderer/        # Electron renderer (UI)
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/    # ML API client, HTTP client
│   ├── services/        # Business logic
│   │   ├── ml-api.ts    # External ML API integration
│   │   ├── http-client.ts  # Image fetching
│   │   └── diagram-converter.ts  # Format conversion
│   └── utils/           # Shared utilities
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── package.json
```

**Structure Decision**: Single Electron app with main, preload, and renderer processes. ML API client in services layer for testability.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
