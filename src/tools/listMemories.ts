import { StorageManager } from '../storage/StorageManager.js';

export async function listMemoriesTool(
  storageManager: StorageManager,
  _args: any
): Promise<any> {
  const memories = await storageManager.listMemories();

  if (memories.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `No memory documents found.

To create your first memory document, use the create_memory tool with any name and optional context:

Examples:
- "Create a memory document called 'minnesota trip 2025'"
- "Create a memory document for 'my travel plans' with context about exploring the North Shore and Twin Cities"
- "Create a memory document called 'midwest adventure' with context about visiting state parks and local attractions"`
      }]
    };
  }

  let result = `Found ${memories.length} memory document${memories.length === 1 ? '' : 's'}:\n\n`;

  for (const memory of memories) {
    const statusText = memory.status ? ` (${memory.status})` : '';
    
    result += `## ${memory.id}${statusText}\n`;
    result += `- **Created**: ${memory.created.split('T')[0]}\n`;
    result += `- **Updated**: ${memory.updated.split('T')[0]}\n`;
    result += `- **Sections**: ${memory.sectionCount}\n`;
    
    if (memory.tags.length > 0) {
      result += `- **Tags**: ${memory.tags.join(', ')}\n`;
    }
    
    result += `- **File**: ${memory.filePath}\n\n`;
  }

  result += `---
*Use get_section to read specific sections, or add_to_list to add items to any memory document.*`;

  return {
    content: [{
      type: 'text',
      text: result
    }]
  };
}