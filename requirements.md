# Structured Memory MCP Server - Requirements

## Core Functionality Requirements

### Memory Management
- **R1.1** Must support creating memories from predefined templates (job_search, research_project, real_estate_search, custom)
- **R1.2** Each memory must have a unique identifier that's human-readable (e.g., "job-search-2025")
- **R1.3** Must support multiple active memories of different types simultaneously
- **R1.4** Memory files must be independent - no cross-memory dependencies for core functionality

### Data Structure
- **R2.1** Memories must be stored as markdown files with YAML frontmatter
- **R2.2** Each memory must have defined sections based on its template type
- **R2.3** Sections must maintain their order and formatting when updated
- **R2.4** Must support flexible markdown content without rigid structure
- **R2.5** Must preserve user formatting and markdown features (bold, links, etc.)
- **R2.6** Must support nested sections using any markdown heading level

### CRUD Operations
- **R3.1** Create operations must support initial context for AI customization
- **R3.2** Read operations must work at both section and document level
- **R3.3** Updates must support both append and replace modes
- **R3.4** Must support flexible content updates without assuming structure
- **R3.5** All operations must be atomic - no partial updates on failure

## Storage Requirements

### File Storage
- **R4.1** Must use platform-specific default locations:
  - macOS: `~/Library/Application Support/structured-memory/`
  - Windows: `%LOCALAPPDATA%\structured-memory\`
  - Linux: `~/.local/share/structured-memory/`
- **R4.2** Must support override via `MEMORY_STORAGE_PATH` environment variable
- **R4.3** Must create storage directory if it doesn't exist
- **R4.4** Files must be readable/editable in any text editor

### File Format
- **R5.1** Markdown files with YAML frontmatter containing:
  - id (unique identifier)
  - type (template type)
  - created (timestamp)
  - updated (timestamp)
  - tags (array)
  - status (optional)
- **R5.2** Must support any markdown heading level for sections
- **R5.3** Must preserve user's markdown formatting choices

### Backup & Safety
- **R6.1** Must create timestamped backups before any update operation
- **R6.2** Must store backups in `.backups/` subdirectory
- **R6.3** Must never lose data - failures should preserve original file
- **R6.4** Must handle concurrent access gracefully (file locking)
- **R6.5** Must keep at least one backup per day where changes were made
- **R6.6** Must keep the most recent 10 backups regardless of date
- **R6.7** Older backups beyond these criteria can be pruned

## User Experience Requirements

### Natural Language Interface
- **R7.1** Must accept natural language commands through Claude/MCP clients
- **R7.2** Must parse context from user input to populate templates
- **R7.3** Must provide helpful feedback about what was done
- **R7.4** Must suggest next steps when appropriate

### External Editing
- **R8.1** Must detect external file changes when `ENABLE_FILE_WATCH=true`
- **R8.2** Must reload and validate externally edited files
- **R8.3** Must handle malformed files gracefully with clear errors
- **R8.4** Must not overwrite external changes without user intent

### Search & Query
- **R9.1** Must support searching within a single memory
- **R9.2** Must return relevant sections/items based on query
- **R9.3** Search must be case-insensitive
- **R9.4** Must complete searches in under 100ms for typical memories

## Template Requirements

### Job Search Template
- **R10.1** Must include suggested sections:
  - search_criteria
  - active_pipeline
  - companies_ruled_out
  - market_insights
  - networking_contacts
  - interview_notes
- **R10.2** Content organization within sections is flexible

### Research Project Template
- **R11.1** Must include suggested sections:
  - research_questions
  - literature_review
  - methodology
  - findings
  - data_sources
  - next_steps

### Real Estate Search Template
- **R12.1** Must include suggested sections:
  - search_criteria
  - active_listings
  - visited_properties
  - rejected_properties
  - market_insights
  - agent_contacts

### Custom Template
- **R13.1** Must start with minimal structure
- **R13.2** Must allow adding sections dynamically
- **R13.3** Must support any markdown content structure

## Technical Requirements

### MCP Integration
- **R14.1** Must implement MCP protocol correctly
- **R14.2** Must provide proper tool descriptions for discovery
- **R14.3** Must handle errors gracefully with helpful messages
- **R14.4** Must support all standard MCP client features

### Performance
- **R15.1** Memory creation must complete in under 1 second
- **R15.2** Section updates must complete in under 500ms
- **R15.3** Must handle memory files up to 1MB efficiently
- **R15.4** Must support at least 100 memories without degradation

### Dependencies
- **R16.1** Must use minimal dependencies for reliability
- **R16.2** Core dependencies:
  - @modelcontextprotocol/sdk
  - gray-matter (frontmatter parsing)
  - markdown parser (TBD - remark or marked)
  - chokidar (file watching)
- **R16.3** Must not require external services or databases

## Export/Import Requirements

### Export Formats
- **R17.1** Must support markdown export (native format)
- **R17.2** Must support JSON export with full structure
- **R17.3** Should support PDF export (future)
- **R17.4** Should support CSV export for list sections (future)

### Import Capabilities
- **R18.1** Must import from exported JSON
- **R18.2** Must detect and validate template type on import
- **R18.3** Must handle conflicts (existing memory with same ID)

## Analysis Requirements

### Memory Analysis
- **R19.1** Must provide summary based on markdown content
- **R19.2** Analysis should understand markdown structure (headers, lists, etc.)
- **R19.3** Must generate insights based on content patterns
- **R19.4** Analysis must be flexible, not assuming rigid structure

## Error Handling Requirements

### User Errors
- **R20.1** Must provide clear errors for:
  - Memory not found
  - Section not found
  - Invalid template type
  - Malformed data
- **R20.2** Must suggest corrections when possible

### System Errors
- **R21.1** Must handle:
  - Disk full
  - Permission denied
  - File locked
  - Corrupted files
- **R21.2** Must never lose user data due to errors

## Questions/Clarifications Needed

### Resolved Questions

✅ **Template Flexibility**: Full markdown flexibility - users/agents decide structure
✅ **Nested Sections**: Yes - support all markdown heading levels
✅ **Item IDs**: No - flexible markdown structure without rigid IDs
✅ **Memory Status**: No archiving - memories exist until deleted
✅ **Backup Policy**: Keep one backup per day + last 10 backups (hybrid approach)

### Future Considerations

- **Q1**: Should memories be able to reference each other? (Future feature)
- **Q2**: Should we support memory templates from URL/GitHub? (Future feature)
- **Q3**: Should we support collaborative editing beyond basic file locking? (Future feature)

## Flexible Markdown Philosophy

### Content Freedom
- **R22.1** The system must not impose rigid data structures
- **R22.2** Users and AI agents decide how to organize content
- **R22.3** Any valid markdown is acceptable content
- **R22.4** Templates provide suggestions, not requirements

### Examples of Flexibility
- Job search "pipeline" could be:
  - A simple bulleted list
  - A table with columns
  - Nested sections by priority
  - Paragraphs with company details
- The user/agent chooses what works best

## Non-Requirements (Out of Scope)

- **NR1**: No database required - files only
- **NR2**: No user authentication/multi-user support
- **NR3**: No cloud sync (users can use Dropbox/iCloud)
- **NR4**: No real-time collaboration features
- **NR5**: No semantic/vector search - only text search

## Success Criteria

The implementation is complete when:
1. All R* requirements are met
2. A user can manage job search via natural language in Claude
3. Files can be edited externally without issues
4. No data loss scenarios exist
5. Performance targets are met
6. Published to npm and installable

---

*Note: This requirements document should be updated as questions are resolved and new requirements are discovered during implementation.*