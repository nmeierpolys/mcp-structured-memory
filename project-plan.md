# Structured Memory MCP Server - Project Plan

## Overview
Build an MCP server that manages structured, domain-specific memories as markdown files. Start with a minimal working version and iterate.

## Phase 1: Minimal Working Prototype (MVP)
**Goal**: Get a basic job search memory working end-to-end with Claude

### Setup & Infrastructure
- [ ] Initialize TypeScript project with package.json
- [ ] Set up MCP server boilerplate (using @modelcontextprotocol/sdk)
- [ ] Configure TypeScript build process
- [ ] Create basic project structure (src/, dist/, templates/)

### Core Memory Operations
- [ ] Implement basic storage manager for markdown files
- [ ] Create `create_memory` tool (job_search template only)
- [ ] Implement `add_to_list` tool (for active_pipeline only)
- [ ] Create `get_section` tool (read any section)
- [ ] Add `list_memories` tool (show available memories)

### Markdown Processing
- [ ] Set up frontmatter parsing (gray-matter library)
- [ ] Implement markdown section parser
- [ ] Create markdown section writer (preserve formatting)
- [ ] Add file path management for platform-specific storage

### Testing the MVP
- [ ] Manual test with Claude Desktop
- [ ] Create a job search memory
- [ ] Add 2-3 companies to pipeline
- [ ] Read back the pipeline
- [ ] Verify markdown file is human-readable

## Phase 2: Complete CRUD Operations
**Goal**: Full create, read, update, delete functionality

### Enhanced Read Operations
- [ ] Implement `get_memory_summary` tool
- [ ] Add `search_within_memory` tool
- [ ] Create memory metadata extraction

### Update Operations
- [ ] Implement `update_list_item` tool
- [ ] Add `move_list_item` tool (between sections)
- [ ] Create `update_section` tool (replace/append modes)
- [ ] Add proper conflict handling for concurrent updates

### File Management
- [ ] Implement file watching for external edits
- [ ] Add backup system before updates
- [ ] Create restoration from backups
- [ ] Handle file locking/conflicts

## Phase 3: Multiple Templates
**Goal**: Support different domain templates beyond job search

### Template System
- [ ] Create template structure/interface
- [ ] Implement research_project template
- [ ] Add real_estate_search template
- [ ] Create custom/blank template option
- [ ] Build template validation system

### Template Features
- [ ] Add template-specific validation rules
- [ ] Create template migration system
- [ ] Implement template customization in create_memory
- [ ] Add template export/import

## Phase 4: Intelligence & Analysis
**Goal**: Add AI-powered insights and smart features

### Analysis Tools
- [ ] Implement `analyze_memory` tool
- [ ] Add pattern detection across sections
- [ ] Create insight generation
- [ ] Build recommendation system

### Smart Features
- [ ] Add auto-categorization suggestions
- [ ] Implement duplicate detection
- [ ] Create relationship mapping between items
- [ ] Add trend analysis over time

## Phase 5: Export & Interoperability
**Goal**: Make memories portable and shareable

### Export Formats
- [ ] Implement JSON export
- [ ] Add PDF generation (markdown-pdf)
- [ ] Create CSV export for list sections
- [ ] Build HTML export with styling

### Import Features
- [ ] Add import from JSON
- [ ] Create import from CSV (for lists)
- [ ] Implement template detection on import
- [ ] Add conflict resolution for imports

## Phase 6: Developer Experience
**Goal**: Make it easy for others to use and extend

### Documentation
- [ ] Create comprehensive API documentation
- [ ] Add inline code documentation
- [ ] Write integration guide
- [ ] Create troubleshooting guide

### Developer Tools
- [ ] Add debug mode with verbose logging
- [ ] Create memory file validator CLI
- [ ] Build template creator tool
- [ ] Add migration scripts for updates

### Testing
- [ ] Set up Jest testing framework
- [ ] Write unit tests for core functions
- [ ] Add integration tests for MCP tools
- [ ] Create test fixtures and mocks

## Phase 7: User Interface (Optional)
**Goal**: Provide visual ways to interact with memories

### Web Dashboard
- [ ] Create React/Next.js dashboard project
- [ ] Build memory list view
- [ ] Add memory editor with sections
- [ ] Implement real-time sync with files
- [ ] Add search and filter UI

### CLI Tool
- [ ] Create command-line interface
- [ ] Add quick-add commands
- [ ] Build interactive prompts
- [ ] Implement batch operations

## Phase 8: Advanced Features
**Goal**: Power user features and integrations

### Cross-Memory Features
- [ ] Implement cross-memory search
- [ ] Add relationship tracking between memories
- [ ] Create memory linking system
- [ ] Build unified timeline view

### Integrations
- [ ] Add calendar integration for deadlines
- [ ] Create email digest feature
- [ ] Build Notion sync (optional)
- [ ] Add git auto-commit option

### Performance
- [ ] Implement caching layer
- [ ] Add indexing for fast search
- [ ] Optimize large file handling
- [ ] Create memory archival system

## Success Metrics

### Phase 1 Success Criteria
- [ ] Can create a job search memory via Claude
- [ ] Can add companies to pipeline via natural language
- [ ] Can read back the pipeline data
- [ ] Markdown file is properly formatted and human-readable
- [ ] Basic error handling works

### Overall Success Criteria
- [ ] Users can manage 5+ different memory types
- [ ] External file edits are detected and handled
- [ ] Search/query performance under 100ms
- [ ] Zero data loss with backup system
- [ ] Published to npm with 10+ installs

## Technical Decisions

### Core Technologies
- TypeScript for type safety
- Node.js fs/promises for file operations
- gray-matter for frontmatter parsing
- chokidar for file watching
- @modelcontextprotocol/sdk for MCP

### Architecture Principles
1. **File-first**: Markdown files are the source of truth
2. **Human-readable**: Files must be editable without the tool
3. **Fail-safe**: Never lose user data
4. **Simple**: Start simple, add complexity only when needed
5. **Extensible**: Easy to add new templates and features

## Development Timeline

### Week 1
- Complete Phase 1 (MVP)
- Begin Phase 2 (CRUD)

### Week 2
- Complete Phase 2
- Complete Phase 3 (Templates)

### Week 3
- Complete Phase 4 (Intelligence)
- Begin Phase 5 (Export)

### Week 4
- Complete Phase 5
- Complete Phase 6 (Developer Experience)
- Publish v1.0 to npm

### Future
- Phase 7 & 8 based on user feedback

## Next Immediate Steps

1. [ ] Create package.json with dependencies
2. [ ] Set up TypeScript configuration
3. [ ] Create basic MCP server structure
4. [ ] Implement first tool: create_memory
5. [ ] Test with Claude Desktop

---

*This plan is a living document. Check off items as completed and adjust timeline based on actual progress.*