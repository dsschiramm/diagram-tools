# Tasks: Image to Diagram Converter

**Feature**: Image to Diagram Converter  
**Branch**: `001-image-to-diagram`  
**Status**: Ready for Implementation

---

## Phase 1: Setup (Project Initialization)

### Project Structure & Configuration

- [ ] T001 Initialize Electron project with TypeScript and package.json
- [ ] T002 Configure TypeScript with strict mode and Electron-specific settings
- [ ] T003 Set up ESLint and Prettier for code quality
- [ ] T004 Create .gitignore for Electron/Node.js projects
- [ ] T005 Create apps/image-to-diagram directory structure per plan

---

## Phase 2: Foundational (Blocking Prerequisites)

### Core Infrastructure

- [ ] T006 [P] Set up ML API client service with configurable provider support
- [ ] T007 [P] Implement HTTP client for image fetching with timeout handling
- [ ] T008 [P] Create config file parser for ~/.image-diagram/config.json
- [ ] T009 [P] Implement retry logic with exponential backoff (3 attempts, 2s/4s/8s)
- [ ] T010 [P] Set up file system utilities for save/open operations
- [ ] T011 Create utility functions for URL validation and image size checking

### Security & Configuration

- [ ] T012 [P] Implement secure config loading (no sensitive data in Electron storage)
- [ ] T013 [P] Add ML API provider configuration support (LM Studio/OpenAI/Anthropic)
- [ ] T014 [P] Create error handling utilities with user-friendly messages

---

## Phase 3: User Story 1 - Convert Single Image URL (Priority: P1)

### Setup & Models

- [ ] T015 [US1] Create QueueItem model with status and metadata fields
- [ ] T016 [US1] Create Diagram model with format, code, and title fields
- [ ] T017 [US1] Create MarkdownDocument model for output structure

### Services & Business Logic

- [ ] T018 [US1] Implement ImageValidator service for URL and format validation
- [ ] T019 [US1] Implement MLAPIService with provider abstraction (LM Studio/OpenAI/Anthropic)
- [ ] T020 [US1] Implement HTTPClientService for image fetching with retry logic
- [ ] T021 [US1] Implement DiagramConverterService to convert images to diagram code
- [ ] T022 [US1] Implement QueueManager service for processing pipeline

### Main Process & Integration

- [ ] T023 [US1] Create main process entry point (apps/image-to-diagram/src/main/index.ts)
- [ ] T024 [US1] Implement IPC handlers for queue management in main process
- [ ] T025 [US1] Create preload script with secure IPC bridge to renderer
- [ ] T026 [US1] Implement status display component showing queue progress

### UI Components

- [ ] T027 [US1] Create URL input field with validation feedback
- [ ] T028 [US1] Build processing queue display with status indicators
- [ ] T029 [US1] Implement "Process" button with loading state
- [ ] T030 [US1] Create diagram preview section showing markdown output

### Testing & Integration

- [ ] T031 [US1] Write unit tests for ImageValidator service
- [ ] T032 [US1] Write unit tests for MLAPIService with mock providers
- [ ] T033 [US1] Write integration tests for queue processing flow
- [ ] T034 [US1] Write E2E test for complete workflow (URL → convert → preview)

---

## Phase 4: User Story 2 - Save and Reuse Generated Markdown (Priority: P3)

### Setup & Models

- [ ] T035 [US2] Create FileStorage model with path and metadata fields
- [ ] T036 [US2] Extend Diagram model to support save state tracking

### Services & Business Logic

- [ ] T037 [US2] Implement FileStorageService for local file operations
- [ ] T038 [US2] Create MarkdownExporter service for generating .md files
- [ ] T039 [US2] Implement FileLoader service for opening saved files

### Main Process & Integration

- [ ] T040 [US2] Add save file IPC handler in main process
- [ ] T041 [US2] Add open file IPC handler in main process
- [ ] T042 [US2] Implement file dialog integration for save/open operations

### UI Components

- [ ] T043 [US2] Create "Save" button with file dialog trigger
- [ ] T044 [US2] Build file list display showing saved diagrams
- [ ] T045 [US2] Implement "Open" button for loading saved files
- [ ] T046 [US2] Add copy to clipboard button for generated content

### Testing & Integration

- [ ] T047 [US2] Write unit tests for FileStorageService
- [ ] T048 [US2] Write integration tests for save/open workflow
- [ ] T049 [US2] Write E2E test for save and reopen scenarios

---

## Phase 5: Polish & Cross-Cutting Concerns

### Error Handling & Edge Cases

- [ ] T050 Handle invalid URL formats with clear error messages
- [ ] T051 Handle unsupported image formats (WebP, HEIC)
- [ ] T052 Handle network timeouts during image fetching
- [ ] T053 Handle inaccessible remote images (404, auth required)
- [ ] T054 Handle image size limits (>10MB) gracefully
- [ ] T055 Handle ML API failures with retry and user-friendly errors
- [ ] T056 Handle rate limiting from ML APIs with request queuing

### Performance & Optimization

- [ ] T057 Optimize image fetching for standard network conditions (<30s)
- [ ] T058 Ensure UI remains responsive during ML API calls
- [ ] T059 Implement loading indicators during processing
- [ ] T060 Add progress feedback for long-running operations

### Security & Compliance

- [ ] T061 Ensure ML API credentials never stored in Electron storage
- [ ] T062 Handle CORS policies when fetching images
- [ ] T063 Validate all user inputs before processing
- [ ] T064 Implement proper error boundaries for crash prevention

### Documentation & Quality

- [ ] T065 Add README with setup and usage instructions
- [ ] T066 Create quickstart guide for first-time users
- [ ] T067 Add inline code documentation for complex logic
- [ ] T068 Run final code quality checks (lint, format, type check)

---

## Dependencies & Execution Order

### Story Completion Order

| Story | Dependencies | Can Run In Parallel |
|-------|--------------|---------------------|
| US1 (P1) | None | N/A |
| US2 (P3) | US1 complete | No |

### Parallel Execution Opportunities

- T006-T014: All foundational tasks can run in parallel
- T015-T017: Models can be created in parallel
- T018-T022: Services can be implemented in parallel (no shared state)
- T023-T026: Main process tasks can run in parallel
- T027-T030: UI components can be developed in parallel

### Recommended MVP Scope

**Start with User Story 1 only**:
- Complete Phase 3 (US1) first
- Includes core functionality: URL input → ML conversion → preview
- Can be tested independently without US2 features

---

## Independent Test Criteria

### US1 Independent Test
```
Given the app is running, When I paste a valid image URL, Then the URL is validated and added to queue.
Given an image URL is in the queue, When I click "Process", Then the image is fetched and converted.
Given the image is processed successfully, When I view the preview, Then I see the markdown output.
```

### US2 Independent Test
```
Given I have generated diagrams from images, When I save to a .md file, Then the file contains all diagram sections.
Given I have saved a .md file, When I reopen it in the app, Then I can view the generated content.
```

---

## Implementation Strategy

1. **Phase 1-2**: Set up project foundation first (1-2 days)
2. **Phase 3**: Implement core US1 functionality (3-4 days) - MVP
3. **Phase 4**: Add save/open features (2 days)
4. **Phase 5**: Polish and edge cases (2-3 days)

**Total Estimated Time**: 7-11 days for full implementation
