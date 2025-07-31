# Development Guide

## Project Setup

This MCP server is built with TypeScript and provides structured memory management through markdown files.

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
npm install
```

### Development

```bash
# Build the project
npm run build

# Build and watch for changes
npm run build:watch

# Run the server (after building)
npm start

# Build and run in one command
npm run dev

# Lint the code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Project Structure

```
src/
├── index.ts              # Main MCP server entry point
├── types/
│   └── memory.ts         # TypeScript interfaces and types
├── storage/
│   └── StorageManager.ts # File system operations for memories
├── templates/
│   └── jobSearchTemplate.ts # Job search template definition
└── tools/                # MCP tool implementations
    ├── createMemory.ts   # Create new memories
    ├── addToList.ts      # Add items to memory sections
    ├── getSection.ts     # Read memory sections
    └── listMemories.ts   # List all memories
```

### Testing with Claude Desktop

1. Build the project: `npm run build`
2. Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "mcp-structured-memory": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-structured-memory/dist/index.js"]
    }
  }
}
```

3. Restart Claude Desktop
4. Test with: "Create a memory document called 'my-2025-search' for tracking job applications"

### MVP Status (Phase 1)

✅ **Completed**:
- [x] TypeScript project setup
- [x] MCP server boilerplate
- [x] Basic storage manager
- [x] Flexible memory document creation (no templates)
- [x] Core tools: create_memory, add_to_list, get_section, list_memories

**Ready for testing**: The MVP is complete and ready for manual testing with Claude Desktop.

### Next Steps (Phase 2)

- Enhanced read operations (get_memory_summary, search_within_memory)
- Update operations (update_list_item, move_list_item, update_section) 
- File watching for external edits
- Backup system improvements

### Memory Storage

Memory documents are stored as markdown files in:
- macOS: `~/Library/Application Support/mcp-structured-memory/`
- Windows: `%LOCALAPPDATA%\mcp-structured-memory\`
- Linux: `~/.local/share/mcp-structured-memory/`

Override with `MEMORY_STORAGE_PATH` environment variable.
