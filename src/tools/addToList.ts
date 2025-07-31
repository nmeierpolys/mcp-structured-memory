import { StorageManager } from '../storage/StorageManager.js';
import { AddToListParams } from '../types/memory.js';
import { 
  detectSectionType, 
  extractFields, 
  formatStarRating, 
  formatFieldList, 
  getCurrentDate,
  FieldMapping 
} from './addToListHelpers.js';

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

  // Format the item based on the section type and item data
  const sectionType = detectSectionType(params.section);
  let itemText: string;
  
  switch (sectionType) {
    case 'pipeline':
      itemText = formatPipelineItem(params.item);
      break;
    case 'ruled_out':
      itemText = formatRuledOutItem(params.item);
      break;
    case 'contact':
      itemText = formatContactItem(params.item);
      break;
    case 'interview':
      itemText = formatInterviewItem(params.item);
      break;
    default:
      itemText = formatGenericItem(params.item);
      break;
  }

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

function formatPipelineItem(item: Record<string, any>): string {
  const fieldMappings: FieldMapping = {
    company: ['company', 'name'],
    role: ['role', 'position'],
    compensation: ['compensation', 'salary', 'pay'],
    status: ['status'],
    rating: ['rating', 'stars'],
    notes: ['notes', 'note'],
    applied_date: ['applied_date', 'date'],
    next_steps: ['next_steps']
  };
  
  const defaults = {
    company: 'Unknown Company',
    role: 'Unknown Role',
    compensation: 'Not specified',
    status: 'Not applied'
  };
  
  const fields = extractFields(item, fieldMappings, defaults);
  const stars = formatStarRating(fields.rating);
  
  let result = `### ${fields.company}${stars}\n`;
  result += formatFieldList(fields, ['company', 'rating'], ['role', 'compensation', 'status']);
  
  // Add optional fields
  if (fields.applied_date) {
    result += `- **Applied**: ${fields.applied_date}\n`;
  }
  
  if (fields.next_steps) {
    result += `- **Next Steps**: ${fields.next_steps}\n`;
  }
  
  if (fields.notes) {
    result += `- **Notes**: ${fields.notes}\n`;
  }

  return result;
}

function formatRuledOutItem(item: Record<string, any>): string {
  const fieldMappings: FieldMapping = {
    company: ['company', 'name'],
    reason: ['reason'],
    date: ['date', 'ruled_out_date'],
    notes: ['notes', 'note']
  };
  
  const defaults = {
    company: 'Unknown Company',
    reason: 'Not specified',
    date: getCurrentDate()
  };
  
  const fields = extractFields(item, fieldMappings, defaults);
  
  let result = `### ${fields.company}\n`;
  result += `- **Reason**: ${fields.reason}\n`;
  result += `- **Date ruled out**: ${fields.date}\n`;
  
  if (fields.notes) {
    result += `- **Notes**: ${fields.notes}\n`;
  }

  return result;
}

function formatContactItem(item: Record<string, any>): string {
  const fieldMappings: FieldMapping = {
    name: ['name', 'contact'],
    company: ['company'],
    relationship: ['relationship', 'relation'],
    contact_date: ['contact_date', 'date'],
    status: ['status'],
    notes: ['notes', 'note']
  };
  
  const defaults = {
    name: 'Unknown Contact',
    company: 'Unknown Company',
    relationship: 'Unknown',
    contact_date: getCurrentDate(),
    status: 'Contacted'
  };
  
  const fields = extractFields(item, fieldMappings, defaults);
  
  let result = `### ${fields.name}\n`;
  result += `- **Company**: ${fields.company}\n`;
  result += `- **Relationship**: ${fields.relationship}\n`;
  result += `- **Contact Date**: ${fields.contact_date}\n`;
  result += `- **Status**: ${fields.status}\n`;
  
  if (fields.notes) {
    result += `- **Notes**: ${fields.notes}\n`;
  }

  return result;
}

function formatInterviewItem(item: Record<string, any>): string {
  const fieldMappings: FieldMapping = {
    company: ['company'],
    round: ['round', 'type'],
    date: ['date', 'interview_date'],
    interviewer: ['interviewer', 'interviewers'],
    format: ['format'],
    questions: ['questions'],
    performance: ['performance'],
    next_steps: ['next_steps'],
    notes: ['notes', 'note']
  };
  
  const defaults = {
    company: 'Unknown Company',
    round: 'Interview',
    date: getCurrentDate(),
    interviewer: 'Not specified',
    format: 'Not specified'
  };
  
  const fields = extractFields(item, fieldMappings, defaults);
  
  let result = `### ${fields.company} - ${fields.round}\n`;
  result += `- **Date**: ${fields.date}\n`;
  result += `- **Interviewer(s)**: ${fields.interviewer}\n`;
  result += `- **Format**: ${fields.format}\n`;
  
  // Add optional fields
  if (fields.questions) {
    result += `- **Questions Asked**: ${fields.questions}\n`;
  }
  
  if (fields.performance) {
    result += `- **My Performance**: ${fields.performance}\n`;
  }
  
  if (fields.next_steps) {
    result += `- **Next Steps**: ${fields.next_steps}\n`;
  }
  
  if (fields.notes) {
    result += `- **Notes**: ${fields.notes}\n`;
  }

  return result;
}

function formatGenericItem(item: Record<string, any>): string {
  if (typeof item === 'string') {
    return `- ${item}`;
  }
  
  if (typeof item === 'object' && item !== null) {
    // If it has a name or title, use that as a heading
    if (item.name || item.title) {
      const title = item.name || item.title;
      let result = `### ${title}\n`;
      
      // Convert remaining fields to field list format
      const remainingFields: Record<string, string> = {};
      for (const [key, value] of Object.entries(item)) {
        if (key !== 'name' && key !== 'title' && value) {
          remainingFields[key] = String(value);
        }
      }
      
      result += formatFieldList(remainingFields);
      return result;
    } else {
      // Simple key-value format
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