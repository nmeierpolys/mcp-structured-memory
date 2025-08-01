#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { StorageManager } from "./storage/StorageManager.js";
import { createMemoryTool } from "./tools/createMemory.js";
import { addToListTool } from "./tools/addToList.js";
import { getSectionTool } from "./tools/getSection.js";
import { listMemoriesTool } from "./tools/listMemories.js";
import { getMemorySummaryTool } from "./tools/getMemorySummary.js";
import { searchWithinMemoryTool } from "./tools/searchWithinMemory.js";
import { updateSectionTool } from "./tools/updateSection.js";
import { updateListItemTool } from "./tools/updateListItem.js";
import { moveListItemTool } from "./tools/moveListItem.js";
import { getFullMemoryTool } from "./tools/getFullMemory.js";
import { createMemoryFromContentTool } from "./tools/createMemoryFromContent.js";

const server = new Server(
  {
    name: "mcp-structured-memory",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize storage manager
const storageManager = new StorageManager();

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_memory",
        description: "Create a new structured memory document. Supports full Markdown formatting including headings (H1-H6), **bold**, *italic*, `code`, [links](url), fenced code blocks, lists, tables, and more. Returns CRITICAL setup instructions - the memory will NOT work until user manually updates their project context file.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Unique identifier/name for this memory",
            },
            initial_context: {
              type: "string",
              description: "Optional context to initialize the memory with. Supports full Markdown formatting including headings, **bold**, *italic*, `code`, [links](url), tables, lists, and more.",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "add_to_list",
        description: "Add an item to a list section in a memory document",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "The ID of the memory document to update",
            },
            section: {
              type: "string",
              description: "The section name to add the item to",
            },
            item: {
              type: "object",
              description:
                "The item data to add (structure depends on template)",
            },
          },
          required: ["memory_id", "section", "item"],
        },
      },
      {
        name: "get_section",
        description: "Retrieve a specific section from a memory document",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "The ID of the memory document to read from",
            },
            section: {
              type: "string",
              description: "The section name to retrieve",
            },
          },
          required: ["memory_id", "section"],
        },
      },
      {
        name: "list_memories",
        description: "List all available memory documents",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: "get_memory_summary",
        description: "Get a high-level summary of a memory document",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "The ID of the memory document to summarize",
            },
          },
          required: ["memory_id"],
        },
      },
      {
        name: "search_within_memory",
        description: "Search for information within a memory document",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "The ID of the memory document to search",
            },
            query: {
              type: "string",
              description: "The search query (words or phrases)",
            },
          },
          required: ["memory_id", "query"],
        },
      },
      {
        name: "update_section",
        description: "Update an entire section of a memory document. Content supports full Markdown formatting including headings, **bold**, *italic*, `code blocks`, [links](url), lists, tables, and all standard Markdown syntax.",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "The ID of the memory document to update",
            },
            section: {
              type: "string",
              description: "The section name to update",
            },
            content: {
              type: "string",
              description: "The new content for the section. Supports full Markdown: headings (#), **bold**, *italic*, `code`, [links](url), ```code blocks```, lists, tables, etc.",
            },
            mode: {
              type: "string",
              enum: ["append", "replace"],
              description: "Whether to append to or replace the section content (default: append)",
            },
          },
          required: ["memory_id", "section", "content"],
        },
      },
      {
        name: "update_list_item",
        description: "Update an existing item in a list section",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "The ID of the memory document to update",
            },
            section: {
              type: "string",
              description: "The section containing the item to update",
            },
            item_identifier: {
              type: "string",
              description: "Identifier for the item to update (e.g., company name, contact name)",
            },
            updates: {
              type: "object",
              description: "Fields to update with their new values",
            },
          },
          required: ["memory_id", "section", "item_identifier", "updates"],
        },
      },
      {
        name: "move_list_item",
        description: "Move an item from one section to another",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "The ID of the memory document to update",
            },
            from_section: {
              type: "string",
              description: "The source section containing the item",
            },
            to_section: {
              type: "string",
              description: "The destination section for the item",
            },
            item_identifier: {
              type: "string",
              description: "Identifier for the item to move (e.g., company name)",
            },
            reason: {
              type: "string",
              description: "Optional reason for the move (stored as metadata)",
            },
          },
          required: ["memory_id", "from_section", "to_section", "item_identifier"],
        },
      },
      {
        name: "get_full_memory",
        description: "Retrieve the complete content of a memory document with all Markdown formatting preserved (headings, **bold**, *italic*, `code`, [links](url), tables, lists, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "The ID of the memory document to retrieve",
            },
          },
          required: ["memory_id"],
        },
      },
      {
        name: "create_memory_from_content",
        description: "Create a new structured memory document from existing Markdown content. Supports full Markdown formatting including headings (H1-H6), **bold**, *italic*, `code`, [links](url), fenced code blocks, lists, tables, and more. Returns CRITICAL setup instructions - the memory will NOT work until user manually updates their project context file.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Unique identifier/name for this memory",
            },
            content: {
              type: "string",
              description: "The complete Markdown content for the memory document. Supports full Markdown: headings (#), **bold**, *italic*, `code`, [links](url), ```code blocks```, lists, tables, etc.",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Optional tags to categorize this memory",
            },
            status: {
              type: "string",
              description: "Optional status for the memory (default: 'active')",
            },
          },
          required: ["name", "content"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_memory":
        return await createMemoryTool(storageManager, args);

      case "add_to_list":
        return await addToListTool(storageManager, args);

      case "get_section":
        return await getSectionTool(storageManager, args);

      case "list_memories":
        return await listMemoriesTool(storageManager, args);

      case "get_memory_summary":
        return await getMemorySummaryTool(storageManager, args);

      case "search_within_memory":
        return await searchWithinMemoryTool(storageManager, args);

      case "update_section":
        return await updateSectionTool(storageManager, args);

      case "update_list_item":
        return await updateListItemTool(storageManager, args);

      case "move_list_item":
        return await moveListItemTool(storageManager, args);

      case "get_full_memory":
        return await getFullMemoryTool(storageManager, args);

      case "create_memory_from_content":
        return await createMemoryFromContentTool(storageManager, args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with MCP communication
  console.error("Structured Memory MCP Server running on stdio");
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Server failed to start:", error);
    process.exit(1);
  });
}
