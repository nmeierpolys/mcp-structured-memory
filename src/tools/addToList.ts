import { StorageManager } from '../storage/StorageManager.js';
import { AddToListParams } from '../types/memory.js';
import { formatGenericItem } from './addToListHelpers.js';

export async function addToListTool(
  storageManager: StorageManager,
  args: any
): Promise<any> {
  const params = args as AddToListParams;
  
  if (!params.memory_id || !params.section || !params.item) {
    throw new Error('memory_id, section, and item are required');
  }

  // Read the memory document
  const memory = await storageManager.readMemory(params.memory_id);
  if (!memory) {
    throw new Error(`Memory document '${params.memory_id}' not found`);
  }

  // Find the section
  const section = storageManager.findSection(memory.content, params.section);
  if (!section) {
    throw new Error(`Section '${params.section}' not found in memory document '${params.memory_id}'`);
  }

  // Format the item using generic formatting
  const itemText = formatGenericItem(params.item);

  // Add the item to the section
  await storageManager.updateSection(params.memory_id, params.section, itemText, 'append');

  return {
    content: [{
      type: 'text',
      text: `Successfully added item to ${params.section} in memory document '${params.memory_id}':

${itemText}

The item has been appended to the section. You can view the updated section using the get_section tool.`
    }]
  };
}

