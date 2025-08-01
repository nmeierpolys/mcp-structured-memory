import { StorageManager } from "../storage/StorageManager.js";
import { CreateMemoryFromContentParams, Memory } from "../types/memory.js";

export async function createMemoryFromContentTool(
  storageManager: StorageManager,
  args: any
): Promise<any> {
  const params = args as CreateMemoryFromContentParams;

  if (!params.name) {
    throw new Error("Memory document name is required");
  }

  if (!params.content) {
    throw new Error("Memory content is required");
  }

  // Generate memory ID from name (sanitize for filename)
  const memoryId = params.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

  if (!memoryId) {
    throw new Error("Name must contain at least some alphanumeric characters");
  }

  // Check if memory already exists
  const existing = await storageManager.readMemory(memoryId);
  if (existing) {
    throw new Error(`Memory document with ID '${memoryId}' already exists`);
  }

  // Use provided content directly
  const content = params.content;

  // Create memory object
  const memory: Memory = {
    metadata: {
      id: memoryId,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: params.tags || [],
      status: params.status || "active",
    },
    content: content,
    filePath: "",
  };

  // Save to storage
  await storageManager.writeMemory(memory);

  const storagePath =
    process.platform === "darwin"
      ? "~/Library/Application Support/mcp-structured-memory"
      : process.platform === "win32"
      ? "%LOCALAPPDATA%\\mcp-structured-memory"
      : "~/.local/share/mcp-structured-memory";

  // Count sections and words for summary
  const sections = Math.max(0, content.split(/^#+\s/m).length - 1);
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lines = content.split('\n').length;

  return {
    content: [
      {
        type: "text",
        text: `Successfully created memory document: "${params.name}"

Memory ID: ${memoryId}
File location: ${storagePath}/${memoryId}.md

Content imported:
- **Sections**: ${sections}
- **Words**: ${words}
- **Lines**: ${lines}
${params.tags?.length ? `- **Tags**: ${params.tags.join(", ")}\n` : ""}${params.status ? `- **Status**: ${params.status}\n` : ""}
The memory document has been created with your existing content and is ready for use. You can:
- Add new items to any section using natural language
- Update existing sections with new content
- Edit the file directly in any text editor

⚠️ **CRITICAL - ACTION REQUIRED**: 

The memory "${params.name}" has been created but will NOT be usable in future conversations until you complete this required setup step:

**YOU MUST manually add these instructions to your project context file (CLAUDE.md or similar):**

\`\`\`
At the start of each conversation, check the project memory "${params.name}" using get_memory_summary.
Update the memory with new context that would be helpful for future requests using add_to_list or update_section.
\`\`\`

⚠️ **Without this manual setup, the memory will not be automatically loaded in new conversations and will be essentially unused.**

Start by saying something like "Add [item] to my [section name]" or "Update my [section name] with [new content]".`,
      },
    ],
  };
}