// Helper functions for addToList tool

export type SectionType = 'pipeline' | 'ruled_out' | 'contact' | 'interview' | 'generic';

export interface FieldMapping {
  [outputField: string]: string[];
}

/**
 * Detects the section type based on section name keywords
 */
export function detectSectionType(sectionName: string): SectionType {
  const name = sectionName.toLowerCase();
  
  if (name.includes('pipeline') || name.includes('active')) {
    return 'pipeline';
  } else if (name.includes('ruled') || name.includes('rejected')) {
    return 'ruled_out';
  } else if (name.includes('contact') || name.includes('network')) {
    return 'contact';
  } else if (name.includes('interview')) {
    return 'interview';
  } else {
    return 'generic';
  }
}

/**
 * Extracts fields from an item using field mappings with fallback values
 */
export function extractFields(
  item: Record<string, any>, 
  fieldMappings: FieldMapping,
  defaults: Record<string, string> = {}
): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [outputField, possibleKeys] of Object.entries(fieldMappings)) {
    let value = '';
    
    // Try each possible key until we find a value
    for (const key of possibleKeys) {
      if (item[key]) {
        value = String(item[key]);
        break;
      }
    }
    
    // Use default if no value found
    if (!value && defaults[outputField]) {
      value = defaults[outputField];
    }
    
    result[outputField] = value;
  }
  
  return result;
}

/**
 * Formats a rating value as star emojis
 */
export function formatStarRating(rating: any): string {
  if (!rating) return '';
  
  const numStars = parseInt(rating.toString().replace(/[^0-9]/g, ''));
  
  if (numStars && numStars >= 1 && numStars <= 5) {
    return ' ' + '⭐'.repeat(numStars);
  }
  
  return '';
}

/**
 * Converts key-value pairs to markdown bullet points
 */
export function formatFieldList(
  fields: Record<string, string>, 
  excludeKeys: string[] = [],
  requiredFields: string[] = []
): string {
  let result = '';
  
  // Add required fields first (always show even if empty)
  for (const key of requiredFields) {
    if (!excludeKeys.includes(key)) {
      const formattedKey = formatKeyName(key);
      const value = fields[key] || 'Not specified';
      result += `- **${formattedKey}**: ${value}\n`;
    }
  }
  
  // Add optional fields (only if they have values)
  for (const [key, value] of Object.entries(fields)) {
    if (value && !requiredFields.includes(key) && !excludeKeys.includes(key)) {
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
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Gets current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}