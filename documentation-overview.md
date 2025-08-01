# Structured Memory MCP Server - Documentation Overview

## Project Documentation Structure

This collection of markdown documents defines a complete MCP (Model Context Protocol) server for managing structured, domain-specific memories. Here's what each document represents and how they work together:

### 📋 README.md
**Purpose**: User-facing documentation and reference
- Complete installation and configuration instructions
- Detailed API documentation for all 11 MCP tools
- Usage examples showing real conversations
- Template descriptions and file format specifications

**Use for implementation**: This defines the external API contract - what users expect the tools to do and how they'll interact with them.

### 📐 project-plan.md
**Purpose**: Development roadmap and implementation guide
- 8 phases from MVP to advanced features
- Checkboxes for tracking progress
- Technical decisions and architecture principles
- Success criteria for each phase

**Use for implementation**: Follow Phase 1 to build the narrow slice first - just enough to create a travel memory, add destinations, and read them back.

### 🎯 requirements.md
**Purpose**: Detailed technical specifications
- 22 categories of requirements (R1-R22)
- Storage locations, file formats, backup policies
- Performance targets and error handling
- Flexible markdown philosophy (R22)

**Use for implementation**: These are the concrete rules your code must follow. Check each requirement as you implement.

### 🌍 background.md
**Purpose**: Context and conceptual understanding
- Origin story from real usage patterns
- Examples showing how memories evolve over time
- Why this approach works better than semantic search
- Real-world impact and use cases

**Use for implementation**: Understand the "why" behind design decisions. Refer to this when making implementation choices.

## Implementation Guide

### Start Here (Phase 1 MVP):
1. Create basic MCP server structure
2. Implement storage manager for markdown files
3. Build these tools first:
   - `create_memory` - with travel template only
   - `add_to_list` - for adding to any section
   - `get_section` - for reading sections
   - `list_memories` - to see what exists

### Core Concepts to Implement:

#### 1. Memory Structure
```yaml
---
id: minnesota-trip-2025
type: travel
created: 2025-01-31
updated: 2025-01-31T10:30:00Z
tags: [climate-tech, remote]
---

# Minnesota Trip 2025

## Trip Overview
[flexible markdown content]

## Active Pipeline
[flexible markdown content]
```

#### 2. Storage Locations
- macOS: `~/Library/Application Support/mcp-structured-memory/`
- Windows: `%LOCALAPPDATA%\mcp-structured-memory\`
- Linux: `~/.local/share/mcp-structured-memory/`

#### 3. Template System
Templates are suggestions, not rigid structures. Start with travel:
- destinations
- itinerary
- companies_ruled_out
- market_insights
- networking_contacts
- interview_notes

#### 4. Flexible Markdown Philosophy
- No rigid data structures
- Users/AI decide organization
- Any valid markdown is acceptable
- Preserve formatting and nested sections

### Key Implementation Principles:

1. **Files are the source of truth** - Everything else is derived
2. **Never lose data** - Backups before every update
3. **Flexible content** - Don't parse or validate markdown structure
4. **Natural language** - Tools should understand conversational commands
5. **External editing** - Files must remain human-readable/editable

### Testing Your Implementation:

Your MVP succeeds when:
1. Claude can create a travel memory
2. User can say "Add Split Rock Lighthouse to my itinerary - 5 stars, iconic landmark, 2 hours"
3. The markdown file shows this in a readable format
4. Claude can read back the itinerary
5. User can open and edit the file directly

### Next Steps After MVP:
- Add remaining CRUD operations (Phase 2)
- Implement other templates (Phase 3)
- Add analysis capabilities (Phase 4)
- Build export features (Phase 5)

## Remember:
This is about creating **living documents** that maintain structured context for focused projects. It's not about semantic search or conversation memory - it's about organizing domain-specific knowledge in a way that both humans and AI can work with effectively.
