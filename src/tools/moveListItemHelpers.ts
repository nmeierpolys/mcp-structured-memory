// Helper functions for moveListItem tool

export interface ItemBoundaries {
  startIndex: number;
  endIndex: number;
}

export interface ExtractedItem {
  lines: string[];
  boundaries: ItemBoundaries;
}

/**
 * Finds the boundaries of an item in a section by identifier
 */
export function findItemBoundaries(lines: string[], identifier: string): ItemBoundaries | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.toLowerCase().includes(identifier.toLowerCase())) {
      const startIndex = i;
      let endIndex = i;
      
      // Find the end of this item by looking for the next heading or end of content
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        
        // If we hit another heading (### ), this item ends at the previous line
        if (nextLine.startsWith('### ')) {
          endIndex = j - 1;
          break;
        }
        
        // If we hit an empty line followed by a heading, the item ends at the empty line
        if (nextLine === '' && lines[j + 1]?.trim().startsWith('### ')) {
          endIndex = j - 1;
          break;
        }
        
        // Otherwise, this line is part of the item
        endIndex = j;
      }
      
      return { startIndex, endIndex };
    }
  }
  
  return null;
}

/**
 * Extracts an item from lines based on boundaries
 */
export function extractItemLines(lines: string[], boundaries: ItemBoundaries): string[] {
  return lines.slice(boundaries.startIndex, boundaries.endIndex + 1);
}

/**
 * Removes an item from lines based on boundaries
 */
export function removeItemFromLines(lines: string[], boundaries: ItemBoundaries): string[] {
  return [
    ...lines.slice(0, boundaries.startIndex),
    ...lines.slice(boundaries.endIndex + 1)
  ];
}

/**
 * Adds reason metadata to extracted item lines
 */
export function addReasonToItem(itemLines: string[], reason: string, fromSection: string): string[] {
  const reasonLine = `  <!-- Moved from ${fromSection}: ${reason} -->`;
  return [...itemLines, reasonLine];
}

/**
 * Prepares content for destination section (new or existing)
 */
export function prepareDestinationContent(
  itemLines: string[], 
  existingContent: string | null
): string {
  if (existingContent !== null) {
    // Append to existing section
    const existingLines = existingContent.split('\n');
    const combinedLines = [...existingLines, '', ...itemLines];
    return combinedLines.join('\n');
  } else {
    // Create new section with the item
    return itemLines.join('\n');
  }
}

/**
 * Validates that an item identifier exists in the given lines
 */
export function validateItemExists(lines: string[], identifier: string): boolean {
  return lines.some(line => 
    line.trim().toLowerCase().includes(identifier.toLowerCase())
  );
}

/**
 * Counts remaining items in section after removal
 */
export function countRemainingItems(lines: string[]): number {
  return lines.filter(line => line.trim().startsWith('### ')).length;
}