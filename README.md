# Structured Memory MCP Server

A Model Context Protocol (MCP) server that provides structured, domain-specific memory management through markdown files. This is particularly useful for ongoing projects around a particular area of focus where you want to accumulate valuable context over time. Examples include focused domains like travel planning, research projects, real estate search, investment theses, product planning, and career development.

## Why Structured Memory?

Traditional MCP memory servers use semantic search across scattered conversation snippets. This works well for general recall but fails for focused projects that need organized, categorical information.

Structured Memory instead maintains **living documents** with structured content that you can scan, update, and track over time - just like you would with a personal notebook, but with AI assistance.

Memory documents are stored as markdown files, primarily updated automatically by the LLM as it learns from your conversations to build rich context over time.

## Typical usage
1. Ask your LLM client to create a memory document for your focused project
   `Create a new travel advisor memory document and tell me how to use it. This should start empty and grow over time.`
2. Create a new Project for conversations in that area. Add the provided usage instructions to your project context

    *Note: LLMs will, against all tool advice, occasionally fail to show you the installation instructions. If that happens, follow up with a request to the LLM to show you the installation instructions and it should comply.*

3. New chat conversations start by checking the available info from the project's memory. Your LLM will update this memory over time to build up valuable context.
4. Optionally prompt your LLM to add/adjust the memory file on demand. It's also helpful to ask the LLM to prompt you for relevant info (e.g. "Ask me some questions to learn about my travel preferences")

## Installation

### Option 1: Install from npm (when published)
```bash
npm install -g @nmeierpolys/mcp-structured-memory
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
      "command": "npx",
      "args": ["@nmeierpolys/mcp-structured-memory"]
    }
  }
}
```

## Available Tools

- **create_memory** - Create a new memory document with optional initial content
- **list_memories** - List all available memory documents
- **get_memory_summary** - Get a high-level summary of a memory document
- **get_section** - Retrieve a specific section from a memory document
- **get_full_memory** - Retrieve the complete content of a memory document
- **search_within_memory** - Search for information within a memory document
- **update_section** - Update an entire section of a memory document
- **add_to_list** - Add an item to a list section
- **update_list_item** - Update an existing item in a list
- **move_list_item** - Move an item between list sections

## Flexible Structure

Memory documents support any structure you need. The AI will help you organize sections based on your use case. Common examples:

- **Travel Planning**: destinations, itinerary, accommodations, activities, restaurants, travel tips, budget tracker
- **Research Project**: research questions, literature review, methodology, findings, data sources, next steps
- **Real Estate Search**: search criteria, active listings, visited properties, rejected properties, market insights, agent contacts

### Example: Automatic Memory Building

```
User: "Create a new Minnesota trip memory document and tell me how to use it. This should start empty and grow over time."

Claude: "I've created a travel memory document for your Minnesota trip. As we discuss your plans, I'll automatically update it with destinations, timing, preferences, and other details I learn about your trip."

User: "I want to see fall colors, go hiking, try local cuisine, and visit both the North Shore and the Twin Cities."

Claude: "I've noted your priorities in the memory: fall foliage viewing, hiking opportunities, local restaurants, North Shore destinations, and Twin Cities attractions. I'll keep track of specific recommendations as we explore options."

[Later conversation]
User: "What hiking trails have good fall colors?"

Claude: "Based on our previous discussions, I see you're focused on fall colors in Minnesota. Let me suggest some trails and I'll add the best ones to your travel memory..."
```

## Backup and Version Control

The server automatically creates timestamped backups before major updates.

## Storage Locations

Memory document files are stored as markdown files in:

- **macOS**: `~/Library/Application Support/mcp-structured-memory/`
- **Windows**: `%LOCALAPPDATA%\mcp-structured-memory\`
- **Linux**: `~/.local/share/mcp-structured-memory/`

