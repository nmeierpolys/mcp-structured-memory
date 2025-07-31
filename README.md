# Structured Memory MCP Server

A Model Context Protocol (MCP) server that provides structured, domain-specific memory management through markdown files. Unlike general-purpose semantic memory systems, this tool maintains organized, living documents for focused domains like job searches, research projects, real estate hunting, and more.

## Why Structured Memory?

Traditional MCP memory servers use semantic search across scattered conversation snippets. This works well for general recall but fails for focused projects that need organized, categorical information. 

Structured Memory instead maintains **living documents** with **defined sections** that you can scan, update, and track over time - just like you would with a personal notebook, but with AI assistance.

## Key Features

- 📁 **Markdown-based storage** - Edit your memories in any text editor
- 🏗️ **Domain templates** - Pre-built structures for common use cases
- 🤖 **AI-powered updates** - Natural language commands to maintain your documents
- 📊 **Structured sections** - Information stays organized, not scattered
- 🔍 **Smart querying** - Find information within and across your memories
- 💾 **Local-first** - Your data stays on your machine
- 🎯 **Purpose-built** - Optimized for focused, ongoing projects

## Installation

### Option 1: Install from npm (when published)
```bash
npm install -g structured-memory-mcp
```

### Option 2: Install from source
```bash
git clone https://github.com/yourusername/structured-memory-mcp.git
cd structured-memory-mcp
npm install
npm run build
```

## Configuration

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "structured-memory": {
      "command": "node",
      "args": ["/path/to/structured-memory-mcp/dist/index.js"],
      "env": {
        "MEMORY_STORAGE_PATH": "~/Documents/StructuredMemory"
      }
    }
  }
}
```

### Configuration Options

- `MEMORY_STORAGE_PATH`: Where to store memory files (defaults to platform-specific location)
- `ENABLE_FILE_WATCH`: Watch for external file changes (default: true)
- `BACKUP_ON_UPDATE`: Create backups before updates (default: true)
- `DEFAULT_TEMPLATE`: Default template for new memories (default: "custom")

## Storage Locations

Memory files are stored as markdown files in:

- **macOS**: `~/Library/Application Support/structured-memory/`
- **Windows**: `%LOCALAPPDATA%\structured-memory\`
- **Linux**: `~/.local/share/structured-memory/`

You can override this with the `MEMORY_STORAGE_PATH` environment variable.

## Available Tools

### Memory Management

#### `create_memory`
Create a new structured memory document.

**Parameters:**
- `type` (string, required): Template type (job_search, research, real_estate, custom)
- `name` (string, required): Unique identifier for this memory
- `initial_context` (string, optional): Context for AI to customize the template

**Example:**
```
"Create a job search memory with initial context: I'm a senior engineer looking for climate tech roles"
```

#### `list_memories`
List all available memory documents.

**Returns:** Array of memory summaries with metadata

### Reading Operations

#### `get_memory_summary`
Get a high-level summary of a memory document.

**Parameters:**
- `memory_id` (string, required): The memory to summarize

**Example:**
```
"Give me a summary of my job search"
```

#### `get_section`
Retrieve a specific section from a memory.

**Parameters:**
- `memory_id` (string, required): The memory to read from
- `section` (string, required): Section name (e.g., "active_pipeline", "search_criteria")

**Example:**
```
"Show me the active pipeline from my job search"
```

#### `search_within_memory`
Search for information within a memory document.

**Parameters:**
- `memory_id` (string, required): The memory to search
- `query` (string, required): Search query

**Example:**
```
"Search my job search for companies offering over 300k"
```

### Update Operations

#### `update_section`
Update an entire section of a memory.

**Parameters:**
- `memory_id` (string, required): The memory to update
- `section` (string, required): Section to update
- `content` (string, required): New content
- `mode` (string, optional): "replace" or "append" (default: "append")

#### `add_to_list`
Add an item to a list section.

**Parameters:**
- `memory_id` (string, required): The memory to update
- `section` (string, required): List section name
- `item` (object, required): Item data (structure depends on template)

**Example:**
```
"Add Anthropic to my job search pipeline: 5 stars, Senior Engineer, $320-485k, applied today"
```

#### `update_list_item`
Update an existing item in a list.

**Parameters:**
- `memory_id` (string, required): The memory to update
- `section` (string, required): List section name
- `item_identifier` (string, required): Item to update (e.g., company name)
- `updates` (object, required): Fields to update

**Example:**
```
"Update Anthropic in my pipeline: change status to 'Interview scheduled'"
```

#### `move_list_item`
Move an item between list sections.

**Parameters:**
- `memory_id` (string, required): The memory to update
- `from_section` (string, required): Source section
- `to_section` (string, required): Destination section
- `item_identifier` (string, required): Item to move
- `reason` (string, optional): Reason for move (stored as metadata)

**Example:**
```
"Move Watershed from active pipeline to ruled out: they require in-person work"
```

### Analysis Tools

#### `analyze_memory`
Get AI-powered insights from a memory.

**Parameters:**
- `memory_id` (string, required): The memory to analyze
- `aspect` (string, optional): Specific aspect to analyze

**Example:**
```
"Analyze my job search and tell me if I should adjust my strategy"
```

### Export/Import

#### `export_memory`
Export a memory in various formats.

**Parameters:**
- `memory_id` (string, required): The memory to export
- `format` (string, optional): "markdown", "json", "pdf" (default: "markdown")

## Built-in Templates

### Job Search
Sections: search_criteria, active_pipeline, companies_ruled_out, market_insights, networking_contacts, interview_notes

### Research Project
Sections: research_questions, literature_review, methodology, findings, data_sources, next_steps

### Real Estate Search  
Sections: search_criteria, active_listings, visited_properties, rejected_properties, market_insights, agent_contacts

### Custom
Start with a blank template and define your own sections.

## Example Usage

### Starting a Job Search

```
User: "Create a job search memory. I'm a senior frontend engineer looking for remote climate tech roles."

Claude: "I've created a job search memory for you. Based on your background, I've set up sections for tracking opportunities, companies you've ruled out, and market insights. The file is at: ~/Library/Application Support/structured-memory/job-search-2025.md

You can edit this file directly in any text editor. What criteria should I add for your search?"

User: "I'm looking for $200k+, must be remote, and I strongly prefer companies working on renewable energy or carbon reduction."

Claude: "I've updated your search criteria. Would you like me to add any companies to your active pipeline?"
```

### Tracking Progress

```
User: "Add Terraformation to my pipeline - they're doing reforestation tech, Senior Engineer role, saw it on Climatebase today"

Claude: "I've added Terraformation to your active pipeline. I've given it a 4-star rating based on the climate impact focus. What's the salary range and application status?"

User: "Unknown salary, haven't applied yet"

Claude: "Updated. Terraformation is now in your pipeline with status 'Not applied yet'. You now have 1 company in your active pipeline."
```

### Getting Insights

```
User: "Show me a summary of my job search"

Claude: "Here's your job search summary:

**Active Pipeline**: 7 companies
- 5-star opportunities: 3 (Anthropic, Overstory, Equilibrium Energy)
- 4-star opportunities: 4

**Application Status**:
- Applied: 2
- Preparing application: 3
- Researching: 2

**Ruled Out**: 12 companies
- Most common reason: Location requirements (8)
- Compensation mismatch: 3
- Role mismatch: 1

**Key Insight**: You're targeting the right companies, but 67% of rejections are due to location requirements. Consider being more flexible on occasional office visits for exceptional opportunities."
```

## Direct File Editing

All memory files are standard markdown with YAML frontmatter. You can edit them in:
- VS Code
- Obsidian
- Bear
- Any text editor

The MCP server watches for external changes and reloads files automatically.

## File Format

```markdown
---
id: job-search-2025
type: job_search
created: 2025-01-31
updated: 2025-01-31T10:30:00Z
tags: [climate-tech, remote]
status: active
---

# Job Search 2025

## Search Criteria

- **Level**: Senior/Staff IC
- **Compensation**: $200K+
- **Location**: Remote (US)
<!-- sections continue -->
```

## Backup and Version Control

The server automatically creates timestamped backups before major updates. You can also:
- Use git to version control your memory files
- Sync with Dropbox/iCloud (files are just markdown)
- Export to other formats for archival

## Contributing

We welcome contributions! Areas we're especially interested in:
- New domain templates
- Export format additions
- UI/visualization tools
- Integration with other MCP servers

## Roadmap

- [ ] Web dashboard for easier viewing/editing
- [ ] Template marketplace
- [ ] Cross-memory insights and analysis
- [ ] Integration with calendar/task systems
- [ ] Mobile app for on-the-go updates

## License

MIT

## Acknowledgments

Inspired by the gap between general-purpose semantic memory systems and the need for structured, domain-specific knowledge management in focused projects.