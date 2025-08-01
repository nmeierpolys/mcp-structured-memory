import { StorageManager } from "../storage/StorageManager.js";
import { UpdateSectionParams } from "../types/memory.js";

export async function updateSectionTool(
  storageManager: StorageManager,
  args: any
): Promise<any> {
  const params = args as UpdateSectionParams;

  if (!params.memory_id || !params.section || params.content === undefined) {
    throw new Error("memory_id, section, and content are required");
  }

  // Validate mode
  const mode = params.mode || "append";
  if (mode !== "append" && mode !== "replace") {
    throw new Error('mode must be either "append" or "replace"');
  }

  // Read the memory document
  const memory = await storageManager.readMemory(params.memory_id);
  if (!memory) {
    throw new Error(`Memory document '${params.memory_id}' not found`);
  }

  // Check if section exists
  const existingSection = storageManager.findSection(
    memory.content,
    params.section
  );
  const sectionExists = existingSection !== null;

  // Update the section using the storage manager
  await storageManager.updateSection(
    params.memory_id,
    params.section,
    params.content,
    mode
  );

  // Format response based on what happened
  let actionText: string;
  if (!sectionExists) {
    actionText = `Created new section "${params.section}" with content`;
  } else if (mode === "replace") {
    actionText = `Replaced content in section "${params.section}"`;
  } else {
    actionText = `Appended content to section "${params.section}"`;
  }

  // Count words/lines for feedback
  const wordCount = params.content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const lineCount = params.content.split("\n").length;

  return {
    content: [
      {
        type: "text",
        text: `Successfully updated memory document '${params.memory_id}':

**Action**: ${actionText}
**Content Added**: ${wordCount} words, ${lineCount} lines
**Mode**: ${mode}

The section has been updated. You can view it using the get_section tool or check the full document summary with get_memory_summary.`,
      },
    ],
  };
}
