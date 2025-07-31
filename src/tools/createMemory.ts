import { StorageManager } from "../storage/StorageManager.js";
import { CreateMemoryParams, Memory } from "../types/memory.js";

export async function createMemoryTool(
  storageManager: StorageManager,
  args: any
): Promise<any> {
  const params = args as CreateMemoryParams;

  if (!params.name) {
    throw new Error("Memory document name is required");
  }

  // Generate memory ID from name (sanitize for filename)
  const memoryId = params.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  if (!memoryId) {
    throw new Error("Name must contain at least some alphanumeric characters");
  }

  // Check if memory already exists
  const existing = await storageManager.readMemory(memoryId);
  if (existing) {
    throw new Error(`Memory document with ID '${memoryId}' already exists`);
  }

  // Generate flexible content based on context
  const title = params.name;
  let content = '';
  
  if (params.initial_context) {
    content = `## Context\n\n${params.initial_context}\n\n## Notes\n\n[Add your notes and organize into sections as needed]`;
  } else {
    content = `## Notes\n\n[Add your notes and organize into sections as needed]`;
  }

  // Create memory object
  const memory: Memory = {
    metadata: {
      id: memoryId,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: [],
      status: "active",
    },
    content: `# ${title}\n\n${content}`,
    filePath: "",
  };

  // Save to storage
  await storageManager.writeMemory(memory);

  const storagePath =
    process.env.MEMORY_STORAGE_PATH ||
    (process.platform === "darwin"
      ? "~/Library/Application Support/mcp-structured-memory"
      : process.platform === "win32"
      ? "%LOCALAPPDATA%\\mcp-structured-memory"
      : "~/.local/share/mcp-structured-memory");

  return {
    content: [
      {
        type: "text",
        text: `Successfully created memory document: "${params.name}"

Memory ID: ${memoryId}
File location: ${storagePath}/${memoryId}.md

${
  params.initial_context
    ? `Initial context has been added to get you started.\n`
    : ""
}The memory document is ready for you to organize with custom sections as needed. You can:
- Add items to any section using natural language
- Create new sections by adding content to them
- Edit the file directly in any text editor

Start by saying something like "Add [item] to my [section name]" and the section will be created automatically.`,
      },
    ],
  };
}
