# Feature Specification: Image to Diagram Converter

**Feature Branch**: `001-image-to-diagram-converter`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "Build a desktop application that converts image links into diagrams in a Markdown file."

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each user story/journey as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Convert Single Image URL (Priority: P1)

A user wants to convert a single image URL into a diagram format and save it as Markdown.

**Why this priority**: This is the core functionality that delivers immediate value. Without this, the app serves no purpose.

**Independent Test**: Can be fully tested by pasting a valid image URL and verifying a Markdown file is generated with diagram content.

**Acceptance Scenarios**:

1. **Given** the app is running, **When** I paste a valid image URL, **Then** the URL is validated successfully and added to the queue
2. **Given** an image URL is in the queue, **When** I click "Process", **Then** the image is fetched and converted to a diagram format
3. **Given** the image is processed successfully and I can check in the app, **When** I save the output, **Then** a Markdown file is created with the diagram and original URL

---

### User Story 2 - Save and Reuse Generated Markdown (Priority: P3)

A user wants to save the generated Markdown and potentially reuse or edit it later.

**Why this priority**: Completes the workflow by allowing users to preserve and share their converted diagrams.

**Independent Test**: Can be tested by generating Markdown, saving it to a file, reopening the file, and verifying content integrity.

**Acceptance Scenarios**:

1. **Given** I have generated diagrams from images, **When** I save to a .md file, **Then** the file contains all diagram sections with URLs and diagrams
2. **Given** I have saved a .md file, **When** I reopen it in the app, **Then** I can view the generated content
3. **Given** I have generated content, **When** I use the copy function, **Then** the Markdown is copied to my clipboard

### Edge Cases

- What happens when the user pastes an invalid URL format?
- How does the system handle images that are too large to process?
- What happens when the network connection is lost during processing?
- How does the system handle images that cannot be converted to diagrams?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST validate image URLs before processing and provide clear feedback for invalid URLs
- **FR-002**: System MUST fetch images from valid URLs with appropriate error handling
- **FR-003**: System MUST call external ML API (LM Studio, OpenAI, or Anthropic compatible endpoints) to analyze image content and generate diagram code. The ML model will be invoked via HTTP requests to these APIs to draw the diagram based on image analysis.
- **FR-004**: System MUST convert visual structure into an editable diagram format (Mermaid, PlantUML, Graphviz, or ASCII)
- **FR-005**: System MUST display real-time status for each image in the queue (pending, fetching, converting, completed, failed)
- **FR-006**: System MUST generate Markdown sections containing original URL, diagram title, and diagram block. Output structure is fixed for MVP.
- **FR-007**: System MUST display a live preview of the generated diagram markdown in the UI before saving
- **FR-008**: System MUST support saving generated Markdown to a user-selected .md file in the local filesystem. When user clicks "Save", the .md file is written to the local filesystem after the user sees the preview.
- **FR-009**: System MUST support opening previously saved .md files for preview and editing. When user opens a saved file, the UI displays the markdown content for review.
- **FR-010**: System MUST provide a copy-to-clipboard function for generated content
- **FR-011**: System MUST handle ML API failures gracefully with retry logic (up to 3 attempts with exponential backoff: 2s, 4s, 8s) and user-friendly error messages
- **FR-012**: System MUST handle rate limiting from ML APIs with request queuing and exponential backoff
- **FR-013**: System MUST display loading indicators during ML API calls with progress feedback

### Key Entities _(include if feature involves data)_

- **Image URL**: The source URL of the image to be processed, must be validated before use
- **Queue Item**: An individual image in the processing pipeline, with associated status and metadata
- **Diagram**: The converted representation of an image, containing diagram code and metadata
- **Markdown Document**: The output file containing all processed diagrams with proper formatting
- **ML API Configuration**: Settings for the external ML service (endpoint URL, model name, API key if required)

### Non-Functional Requirements

- **NFR-001**: System MUST complete image fetching within 30 seconds for standard network conditions
- **NFR-002**: System MUST complete conversion processing within 60 seconds for typical diagrams (excluding ML API latency)
- **NFR-003**: System MUST remain responsive during processing operations
- **NFR-004**: System MUST handle network timeouts gracefully with meaningful error messages
- **NFR-005**: System MUST support common image formats: JPG, PNG, BMP, SVG
- **NFR-006**: System MUST limit image sizes to 10MB per image to prevent excessive resource usage
- **NFR-007**: System MUST retry ML API calls up to 3 times on transient failures with exponential backoff (2s, 4s, 8s)
- **NFR-008**: System MUST respect ML API rate limits and implement request queuing when throttled
- **NFR-009**: System MUST display loading indicators during ML API calls with progress feedback
- **NFR-010**: System MUST provide clear error messages for ML API failures (invalid response, timeout, authentication errors)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 80% of typical diagram images (flowcharts, architecture diagrams) convert successfully with high confidence
- **SC-002**: 95% of users can successfully convert an image URL and save the resulting Markdown on first attempt
- **SC-003**: Average processing time per image is under 90 seconds (fetch + convert), excluding ML API latency
- **SC-004**: All common failure cases are handled with clear user guidance
- **SC-005**: New users can complete the core workflow (paste URL → convert → save) without assistance
- **SC-006**: ML API failures result in automatic retry up to 3 times before showing user-friendly error
- **SC-007**: Users can preview generated diagrams in real-time before saving
- **SC-008**: Saved .md files can be opened and viewed in the app for editing

### Qualitative Outcomes

- Users receive clear feedback when ML API calls fail or timeout
- The UI provides visual indication of processing progress during ML API calls
- Error messages guide users to resolve common issues (invalid URL, network problems, API limits)

## Assumptions

- Users will have basic familiarity with Markdown format
- Users will have stable internet connectivity for image fetching and ML API calls
- The application will run on Windows, macOS, and Linux platforms
- Diagram formats will support multiple output languages: Mermaid, PlantUML, Graphviz or ASCII (Default)
- Users may need to manually edit generated diagrams for accuracy
- The application will use external ML APIs (LM Studio, OpenAI, or Anthropic compatible endpoints) for image analysis
- Users must provide valid API credentials (API key) when using paid ML services
- The UI displays a live preview of the generated diagram before saving
- Save operation writes the .md file to the local filesystem; open operation loads and displays saved files in the app

## Constraints

- No collaborative editing features in first version
- No built-in Markdown editor (preview only - shows raw markdown)
- No automatic publishing capabilities
- Must respect CORS policies when fetching images
- Must not store sensitive information (e.g., credentials)
- ML API credentials stored in user config file (~/.image-diagram/config.json)

## Failure Cases

- Invalid URL format (missing protocol, malformed domain)
- Unsupported image format (WebP, HEIC, etc.)
- Network timeout during image fetching
- Inaccessible remote image (404, authentication required)
- Image too large to process (>10MB)
- Image too complex to convert (low confidence score)
- Conversion produces unintelligible output
- File permission errors when saving output

## Clarifications

### Session 2026-05-22

- Q: How should existing .md files be handled when saving? → A: Overwrite silently - User chose Option A for faster workflow
- Q: Where should ML API credentials be stored? → A: Config file in user's home directory (~/.image-diagram/config.json) - User chose Option B for portability
- Q: What should the preview show before saving? → A: Markdown preview (raw code) - User chose Option A for simplicity
- Q: How should users select diagram format? → A: Dropdown selector before processing - User chose Option A for simple UX
- Q: How should ML API provider be selected? → A: Configurable with multiple providers (LM Studio/OpenAI/Anthropic) - User chose Option B for flexibility
