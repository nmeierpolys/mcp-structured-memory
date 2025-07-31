import { StorageManager } from '../storage/StorageManager.js';
import { UpdateListItemParams } from '../types/memory.js';

export async function updateListItemTool(
  storageManager: StorageManager,
  args: any
): Promise<any> {
  const params = args as UpdateListItemParams;
  
  if (!params.memory_id || !params.section || !params.item_identifier || !params.updates) {
    throw new Error('memory_id, section, item_identifier, and updates are required');
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

  // Parse the section content to find the item
  const lines = section.content.split('\n');
  let itemFound = false;
  let itemStartIndex = -1;
  let itemEndIndex = -1;
  
  // Look for the item by identifier (could be a heading or a line containing the identifier)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line contains the identifier (flexible matching)
    if (line.toLowerCase().includes(params.item_identifier.toLowerCase())) {
      itemFound = true;
      itemStartIndex = i;
      
      // Find the end of this item (next heading or empty line or end of section)
      itemEndIndex = i;
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('### ') || (nextLine === '' && lines[j + 1]?.trim().startsWith('### '))) {
          // Found the start of next item
          itemEndIndex = j - 1;
          break;
        }
        itemEndIndex = j;
      }
      break;
    }
  }
  
  if (!itemFound) {
    throw new Error(`Item '${params.item_identifier}' not found in section '${params.section}'`);
  }
  
  // Extract the current item content
  const currentItemLines = lines.slice(itemStartIndex, itemEndIndex + 1);
  let updatedItemLines = [...currentItemLines];
  
  // Apply updates based on the format we can detect
  Object.entries(params.updates).forEach(([field, value]) => {
    const fieldPattern = new RegExp(`^(\\s*-\\s*\\*\\*${field}\\*\\*:)(.*)$`, 'i');
    let fieldUpdated = false;
    
    // Try to find and update existing field
    for (let i = 0; i < updatedItemLines.length; i++) {
      const match = updatedItemLines[i].match(fieldPattern);
      if (match) {
        updatedItemLines[i] = `${match[1]} ${value}`;
        fieldUpdated = true;
        break;
      }
    }
    
    // If field not found, add it
    if (!fieldUpdated) {
      // Add after the heading line
      if (updatedItemLines[0].startsWith('### ')) {
        updatedItemLines.splice(1, 0, `- **${field}**: ${value}`);
      } else {
        // Add at the end
        updatedItemLines.push(`- **${field}**: ${value}`);
      }
    }
  });
  
  // Replace the item in the original lines
  const newLines = [
    ...lines.slice(0, itemStartIndex),
    ...updatedItemLines,
    ...lines.slice(itemEndIndex + 1)
  ];
  
  // Update the section content
  const newSectionContent = newLines.join('\n');
  await storageManager.updateSection(params.memory_id, params.section, newSectionContent, 'replace');
  
  // Count updates made
  const updateCount = Object.keys(params.updates).length;
  const updatedFields = Object.keys(params.updates).join(', ');
  
  return {
    content: [{
      type: 'text',
      text: `Successfully updated item '${params.item_identifier}' in section '${params.section}' of memory document '${params.memory_id}':

**Fields Updated**: ${updatedFields}
**Changes Made**: ${updateCount} field${updateCount === 1 ? '' : 's'}

The item has been updated in place. You can view the updated section using the get_section tool.`
    }]
  };
}