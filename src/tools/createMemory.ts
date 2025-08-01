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

  // Handle content - either use provided content or generate basic structure
  const title = params.name;
  let content = "";

  if (params.content && params.content.trim()) {
    // Use provided content directly (full markdown content)
    content = params.content;
  } else {
    // Generate basic structure with title and placeholder
    content = `# ${title}\n\n## Notes\n\n[Add your notes and organize into sections as needed]`;
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
    content: content,
    filePath: "",
  };

  // Save to storage
  await storageManager.writeMemory(memory);

  return {
    content: [
      {
        type: "text",
        text: `SHOW THIS TO THE USER - Successfully created memory document: "${params.name}"
🚨 **PROJECT SETUP REQUIRED - MEMORY WILL NOT WORK OTHERWISE** 🚨

The memory "${params.name}" has been created but needs to be integrated into your project workflow.

**Add these instructions to your project context:**

\`\`\`
At the start of each conversation, check the project memory "${params.name}" using get_full_memory.
Automatically update the memory as you learn new information using add_to_list or update_section.
\`\`\`

⚠️ **The memory will be unused until you add these instructions to your project context.**`,
      },
    ],
  };
}
