import { StorageManager } from '../storage/StorageManager.js';
import { MoveListItemParams } from '../types/memory.js';
import {
  findItemBoundaries,
  extractItemLines,
  removeItemFromLines,
  addReasonToItem,
  prepareDestinationContent
} from './moveListItemHelpers.js';

export async function moveListItemTool(
  storageManager: StorageManager,
  args: any
): Promise<any> {
  const params = args as MoveListItemParams;
  
  if (!params.memory_id || !params.from_section || !params.to_section || !params.item_identifier) {
    throw new Error('memory_id, from_section, to_section, and item_identifier are required');
  }

  // Read the memory document
  const memory = await storageManager.readMemory(params.memory_id);
  if (!memory) {
    throw new Error(`Memory document '${params.memory_id}' not found`);
  }

  // Find both sections
  const fromSection = storageManager.findSection(memory.content, params.from_section);
  if (!fromSection) {
    throw new Error(`Source section '${params.from_section}' not found in memory document '${params.memory_id}'`);
  }

  const toSection = storageManager.findSection(memory.content, params.to_section);
  const toSectionExists = toSection !== null;

  // Parse the from section to find and extract the item
  const fromLines = fromSection.content.split('\n');
  const boundaries = findItemBoundaries(fromLines, params.item_identifier);
  
  if (!boundaries) {
    throw new Error(`Item '${params.item_identifier}' not found in section '${params.from_section}'`);
  }
  
  // Extract the item
  let extractedItem = extractItemLines(fromLines, boundaries);
  
  // Add reason as metadata if provided
  if (params.reason) {
    extractedItem = addReasonToItem(extractedItem, params.reason, params.from_section);
  }
  
  // Remove item from source section
  const remainingFromLines = removeItemFromLines(fromLines, boundaries);
  const newFromContent = remainingFromLines.join('\n');
  
  // Add item to destination section
  const existingToContent = toSectionExists && toSection ? toSection.content : null;
  const newToContent = prepareDestinationContent(extractedItem, existingToContent);
  
  // Update both sections
  await storageManager.updateSection(params.memory_id, params.from_section, newFromContent, 'replace');
  await storageManager.updateSection(params.memory_id, params.to_section, newToContent, 'replace');
  
  return {
    content: [{
      type: 'text',
      text: `Successfully moved item '${params.item_identifier}' from '${params.from_section}' to '${params.to_section}' in memory document '${params.memory_id}':

**Item**: ${params.item_identifier}
**From**: ${params.from_section}
**To**: ${params.to_section}${params.reason ? `\n**Reason**: ${params.reason}` : ''}
**Destination Section**: ${toSectionExists ? 'Updated existing section' : 'Created new section'}

The item has been moved successfully. You can view both sections using the get_section tool.`
    }]
  };
}