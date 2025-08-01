# Structured Memory MCP Server

A Model Context Protocol (MCP) server that provides structured, domain-specific memory management through markdown files. This is particularly useful for ongoing projects around a particular area of focus where you want to accumulate valuable context over time. Examples include focused domains like travel planning, research projects, real estate search, investment theses, product planning, and career development.

## Why Structured Memory?

Traditional MCP memory servers use semantic search across scattered conversation snippets. This works well for general recall but fails for focused projects that need organized, categorical information.

Structured Memory instead maintains **living documents** with structured content that you can scan, update, and track over time - just like you would with a personal notebook, but with AI assistance.

Memory documents are stored as markdown on the file system allowing manual curation, but this is primarily intended as something LLMs update over time to improve their ability to support your goals.

## Typical usage
1. Ask your LLM client to create a memory  document
  `Create a new travel advisor memory document`
2. Create a new Project for chat conversations in that area. Add the provided usage instructions
3. New chat conversations start by checking the available info from the project's memory. Your LLM will update this memory over time to build up valuable context.
4. Optionally prompt your LLM to add/adjust the memory file on demand

## Installation

### Option 1: Install from npm (when published)
```bash
npm install -g mcp-structured-memory
```

### Option 2: Install from source
```bash
git clone https://github.com/nmeierpolys/mcp-structured-memory.git
cd mcp-structured-memory
npm install
npm run build
```

## Configuration

### For Claude Desktop
Edit the `claude_desktop_config.json` file with the following entry:

```json
{
  "mcpServers": {
    "mcp-structured-memory": {
      "command": "node",
      "args": ["/path/to/mcp-structured-memory/dist/index.js"]
    }
  }
}
```

## Storage Locations

Memory document files are stored as markdown files in:

- **macOS**: `~/Library/Application Support/mcp-structured-memory/`
- **Windows**: `%LOCALAPPDATA%\mcp-structured-memory\`
- **Linux**: `~/.local/share/mcp-structured-memory/`

## Available Tools

### Memory Management

#### `create_memory`
Create a new structured memory document.

**Parameters:**
- `name` (string, required): Unique identifier for this memory document
- `initial_context` (string, optional): Context for AI to customize the memory structure

**Example:**
```
"Create a travel advisor memory document with initial context: I'm planning a week-long trip to Minnesota in fall"
```

#### `list_memories`
List all available memory documents.

**Returns:** Array of memory summaries with metadata

### Reading Operations

#### `get_memory_summary`
Get a high-level summary of a memory document.

**Parameters:**
- `memory_id` (string, required): The memory document to summarize

**Example:**
```
"Give me a summary of my Minnesota travel plans"
```

#### `get_section`
Retrieve a specific section from a memory document.

**Parameters:**
- `memory_id` (string, required): The memory document to read from
- `section` (string, required): Section name (e.g., "active_pipeline", "search_criteria")

**Example:**
```
"Show me the must-visit destinations from my Minnesota trip"
```

#### `search_within_memory`
Search for information within a memory document.

**Parameters:**
- `memory_id` (string, required): The memory document to search
- `query` (string, required): Search query

**Example:**
```
"Search my travel plans for fall foliage viewing spots"
```

### Update Operations

#### `update_section`
Update an entire section of a memory document.

**Parameters:**
- `memory_id` (string, required): The memory document to update
- `section` (string, required): Section to update
- `content` (string, required): New content
- `mode` (string, optional): "replace" or "append" (default: "append")

#### `add_to_list`
Add an item to a list section.

**Parameters:**
- `memory_id` (string, required): The memory document to update
- `section` (string, required): List section name
- `item` (object, required): Item data to add

**Example:**
```
"Add Boundary Waters to my Minnesota itinerary: 5 stars, 3-day canoe trip, includes camping"
```

#### `update_list_item`
Update an existing item in a list.

**Parameters:**
- `memory_id` (string, required): The memory document to update
- `section` (string, required): List section name
- `item_identifier` (string, required): Item to update (e.g., company name)
- `updates` (object, required): Fields to update

**Example:**
```
"Update Split Rock Lighthouse in my itinerary: change status to 'Reservation confirmed'"
```

#### `move_list_item`
Move an item between list sections.

**Parameters:**
- `memory_id` (string, required): The memory document to update
- `from_section` (string, required): Source section
- `to_section` (string, required): Destination section
- `item_identifier` (string, required): Item to move
- `reason` (string, optional): Reason for move (stored as metadata)

**Example:**
```
"Move Voyageurs National Park from must-visit to ruled out: too far for this trip"
```

### Analysis Tools

#### `analyze_memory`
Get AI-powered insights from a memory document.

**Parameters:**
- `memory_id` (string, required): The memory document to analyze
- `aspect` (string, optional): Specific aspect to analyze

**Example:**
```
"Analyze my travel plans and suggest if I should adjust my itinerary"
```

### Export/Import

#### `export_memory`
Export a memory document in various formats.

**Parameters:**
- `memory_id` (string, required): The memory document to export
- `format` (string, optional): "markdown", "json", "pdf" (default: "markdown")

## Flexible Structure

Memory documents support any structure you need. The AI will help you organize sections based on your use case. Common examples:

- **Travel Planning**: destinations, itinerary, accommodations, activities, restaurants, travel tips, budget tracker
- **Research Project**: research questions, literature review, methodology, findings, data sources, next steps
- **Real Estate Search**: search criteria, active listings, visited properties, rejected properties, market insights, agent contacts
- **Custom**: Any structure that fits your needs

## Example Usage

### Starting a Travel Plan

```
User: "Create a travel advisor memory document. I'm planning a week-long trip to Minnesota in fall for the autumn colors."

Claude: "I've created a travel advisor memory document for you. Based on your trip goals, I've set up sections for destinations, itinerary planning, accommodations, and outdoor activities. The file is at: ~/Library/Application Support/mcp-structured-memory/minnesota-trip-2025.md

You can edit this file directly in any text editor. What are your main priorities for this trip?"

User: "I want to see fall colors, go hiking, try local cuisine, and visit both the North Shore and the Twin Cities."

Claude: "I've updated your trip priorities. Would you like me to add some must-visit destinations to your itinerary?"
```

### Adding Destinations

```
User: "Add Split Rock Lighthouse to my itinerary - iconic Lake Superior lighthouse, stunning views, great for photos"

Claude: "I've added Split Rock Lighthouse to your North Shore destinations. I've given it a 5-star rating as it's one of Minnesota's most photographed landmarks. What's the best time to visit and how long should I plan?"

User: "Morning for best light, allow 2 hours including the visitor center"

Claude: "Updated. Split Rock Lighthouse is now in your itinerary with timing notes. You now have 1 destination planned for the North Shore."
```

### Getting Insights

```
User: "Show me a summary of my Minnesota travel plans"

Claude: "Here's your Minnesota travel memory document summary:

**Planned Destinations**: 12 locations
- Must-see (5-star): 5 (Split Rock Lighthouse, Boundary Waters, Minnehaha Falls, North Shore Scenic Drive, Mall of America)
- Highly recommended (4-star): 7

**Trip Status**:
- Accommodations booked: 3 locations
- Activities reserved: 4
- Restaurant reservations: 3

**Budget Tracking**: $1,800 allocated
- Accommodations: 35% ($630)
- Transportation: 25% ($450)
- Food & activities: 40% ($720)

**Key Insight**: Your itinerary is heavily focused on the North Shore (70% of time). Consider allocating a day or two to explore the Twin Cities for cultural attractions and dining."
```

## Direct File Editing

All memory document files are standard markdown with YAML frontmatter. You can edit them in:
- VS Code
- Obsidian
- Bear
- Any text editor

The MCP server watches for external changes and reloads files automatically.

## File Format

```markdown
---
id: minnesota-trip-2025
created: 2025-01-31
updated: 2025-01-31T10:30:00Z
tags: [travel, minnesota, fall-colors]
status: active
---

# Minnesota Trip Fall 2025

## Trip Overview

- **Duration**: 7 days (September 25 - October 1)
- **Budget**: $1,800
- **Main Areas**: North Shore, Twin Cities, Boundary Waters
- **Focus**: Fall foliage, hiking, local culture
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
