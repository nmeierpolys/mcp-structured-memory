import { StorageManager } from '../storage/StorageManager.js';
import { AddToListParams } from '../types/memory.js';

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
  let itemText: string;
  
  // For job search active_pipeline section, format as company entry
  if (params.section.toLowerCase().includes('pipeline') || params.section.toLowerCase().includes('active')) {
    itemText = formatPipelineItem(params.item);
  } else if (params.section.toLowerCase().includes('ruled') || params.section.toLowerCase().includes('rejected')) {
    itemText = formatRuledOutItem(params.item);
  } else if (params.section.toLowerCase().includes('contact') || params.section.toLowerCase().includes('network')) {
    itemText = formatContactItem(params.item);
  } else if (params.section.toLowerCase().includes('interview')) {
    itemText = formatInterviewItem(params.item);
  } else {
    // Generic formatting - just add the item as text or key-value pairs
    itemText = formatGenericItem(params.item);
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
  const company = item.company || item.name || 'Unknown Company';
  const role = item.role || item.position || 'Unknown Role';
  const compensation = item.compensation || item.salary || item.pay || 'Not specified';
  const status = item.status || 'Not applied';
  const rating = item.rating || item.stars || '';
  const notes = item.notes || item.note || '';
  
  let stars = '';
  if (rating) {
    const numStars = parseInt(rating.toString().replace(/[^0-9]/g, ''));
    if (numStars && numStars >= 1 && numStars <= 5) {
      stars = ' ' + '⭐'.repeat(numStars);
    }
  }

  let result = `### ${company}${stars}\n`;
  result += `- **Role**: ${role}\n`;
  result += `- **Compensation**: ${compensation}\n`;
  result += `- **Status**: ${status}\n`;
  
  if (item.applied_date || item.date) {
    result += `- **Applied**: ${item.applied_date || item.date}\n`;
  }
  
  if (item.next_steps) {
    result += `- **Next Steps**: ${item.next_steps}\n`;
  }
  
  if (notes) {
    result += `- **Notes**: ${notes}\n`;
  }

  return result;
}

function formatRuledOutItem(item: Record<string, any>): string {
  const company = item.company || item.name || 'Unknown Company';
  const reason = item.reason || 'Not specified';
  const date = item.date || item.ruled_out_date || new Date().toISOString().split('T')[0];
  const notes = item.notes || item.note || '';

  let result = `### ${company}\n`;
  result += `- **Reason**: ${reason}\n`;
  result += `- **Date ruled out**: ${date}\n`;
  
  if (notes) {
    result += `- **Notes**: ${notes}\n`;
  }

  return result;
}

function formatContactItem(item: Record<string, any>): string {
  const name = item.name || item.contact || 'Unknown Contact';
  const company = item.company || 'Unknown Company';
  const relationship = item.relationship || item.relation || 'Unknown';
  const contactDate = item.contact_date || item.date || new Date().toISOString().split('T')[0];
  const status = item.status || 'Contacted';
  const notes = item.notes || item.note || '';

  let result = `### ${name}\n`;
  result += `- **Company**: ${company}\n`;
  result += `- **Relationship**: ${relationship}\n`;
  result += `- **Contact Date**: ${contactDate}\n`;
  result += `- **Status**: ${status}\n`;
  
  if (notes) {
    result += `- **Notes**: ${notes}\n`;
  }

  return result;
}

function formatInterviewItem(item: Record<string, any>): string {
  const company = item.company || 'Unknown Company';
  const round = item.round || item.type || 'Interview';
  const date = item.date || item.interview_date || new Date().toISOString().split('T')[0];
  const interviewer = item.interviewer || item.interviewers || 'Not specified';
  const format = item.format || 'Not specified';
  const notes = item.notes || item.note || '';

  let result = `### ${company} - ${round}\n`;
  result += `- **Date**: ${date}\n`;
  result += `- **Interviewer(s)**: ${interviewer}\n`;
  result += `- **Format**: ${format}\n`;
  
  if (item.questions) {
    result += `- **Questions Asked**: ${item.questions}\n`;
  }
  
  if (item.performance) {
    result += `- **My Performance**: ${item.performance}\n`;
  }
  
  if (item.next_steps) {
    result += `- **Next Steps**: ${item.next_steps}\n`;
  }
  
  if (notes) {
    result += `- **Notes**: ${notes}\n`;
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
      let result = `### ${item.name || item.title}\n`;
      
      // Add other properties as bullet points
      for (const [key, value] of Object.entries(item)) {
        if (key !== 'name' && key !== 'title' && value) {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          result += `- **${formattedKey}**: ${value}\n`;
        }
      }
      
      return result;
    } else {
      // Simple key-value format
      let result = '';
      for (const [key, value] of Object.entries(item)) {
        if (value) {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          result += `- **${formattedKey}**: ${value}\n`;
        }
      }
      return result;
    }
  }
  
  return `- ${String(item)}`;
}