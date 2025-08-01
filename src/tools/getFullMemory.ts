import { StorageManager } from "../storage/StorageManager.js";
import { GetFullMemoryParams } from "../types/memory.js";

export async function getFullMemoryTool(
  storageManager: StorageManager,
  args: any
): Promise<any> {
  const params = args as GetFullMemoryParams;

  if (!params.memory_id) {
    throw new Error("Memory ID is required");
  }

  // Read the memory document
  const memory = await storageManager.readMemory(params.memory_id);
  if (!memory) {
    throw new Error(`Memory document with ID '${params.memory_id}' not found`);
  }

  return {
    content: [
      {
        type: "text",
        text: `# Full Memory: ${params.memory_id}

**Created:** ${memory.metadata.created}
**Updated:** ${memory.metadata.updated}
**Status:** ${memory.metadata.status}
**Tags:** ${memory.metadata.tags.join(", ") || "None"}

---

${memory.content}`,
      },
    ],
  };
}