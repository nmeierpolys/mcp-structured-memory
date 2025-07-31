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
        description: "Create a new structured memory document",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Unique identifier/name for this memory",
            },
            initial_context: {
              type: "string",
              description: "Optional context to initialize the memory with specific information",
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
