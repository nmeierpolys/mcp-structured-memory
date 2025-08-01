// Helper functions for addToList tool


/**
 * Converts key-value pairs to markdown bullet points
 */
export function formatFieldList(
  fields: Record<string, string>
): string {
  let result = '';
  
  for (const [key, value] of Object.entries(fields)) {
    if (value) {
      const formattedKey = formatKeyName(key);
      result += `- **${formattedKey}**: ${value}\n`;
    }
  }
  
  return result;
}

/**
 * Formats a key name for display (snake_case to Title Case)
 */
export function formatKeyName(key: string): string {
  return key.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Formats an item for adding to a list using generic formatting
 */
export function formatGenericItem(item: Record<string, any>): string {
  if (typeof item === 'string') {
    return `- ${item}`;
  }
  
  if (typeof item === 'object' && item !== null) {
    // Look for common title fields
    const titleFields = ['name', 'title', 'destination', 'company', 'activity'];
    let title = '';
    
    for (const field of titleFields) {
      if (item[field]) {
        title = String(item[field]);
        break;
      }
    }
    
    if (title) {
      // Format with star rating if present
      const stars = formatStarRating(item.rating || item.stars);
      let result = `### ${title}${stars}\n`;
      
      // Convert remaining fields to field list format
      const remainingFields: Record<string, string> = {};
      for (const [key, value] of Object.entries(item)) {
        if (!titleFields.includes(key) && key !== 'rating' && key !== 'stars' && value) {
          remainingFields[key] = String(value);
        }
      }
      
      result += formatFieldList(remainingFields);
      return result;
    } else {
      // Simple key-value format without title
      const fields: Record<string, string> = {};
      for (const [key, value] of Object.entries(item)) {
        if (value) {
          fields[key] = String(value);
        }
      }
      return formatFieldList(fields);
    }
  }
  
  return `- ${String(item)}`;
}

/**
 * Formats a rating value as star emojis
 */
function formatStarRating(rating: any): string {
  if (!rating) return '';
  
  const numStars = parseInt(rating.toString().replace(/[^0-9]/g, ''));
  
  if (numStars && numStars >= 1 && numStars <= 5) {
    return ' ' + '⭐'.repeat(numStars);
  }
  
  return '';
}