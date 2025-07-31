import { Memory } from '../types/memory.js';

export interface SummaryData {
  memory: Memory;
  totalSections: number;
  nonEmptySections: number;
  listSections: number;
  totalItems: number;
  totalWords: number;
  totalChars: number;
  activeSections: string[];
  daysSinceCreated: number;
  daysSinceUpdated: number;
  sections: Array<{ name: string; content: string }>;
}

export function generateSummaryText(data: SummaryData): string {
  const { memory, totalSections, nonEmptySections, listSections, totalItems, 
          totalWords, totalChars, activeSections, daysSinceCreated, 
          daysSinceUpdated, sections } = data;
  
  const created = new Date(memory.metadata.created);
  const updated = new Date(memory.metadata.updated);
  
  // Build summary text
  let summary = `# Memory Document Summary: ${memory.metadata.id}\n\n`;
  
  // Basic stats
  summary += `## Overview\n`;
  summary += `- **Created**: ${created.toLocaleDateString()} (${daysSinceCreated} days ago)\n`;
  summary += `- **Last Updated**: ${updated.toLocaleDateString()} (${daysSinceUpdated} days ago)\n`;
  summary += `- **Status**: ${memory.metadata.status || 'active'}\n`;
  
  if (memory.metadata.tags.length > 0) {
    summary += `- **Tags**: ${memory.metadata.tags.join(', ')}\n`;
  }
  
  summary += `\n## Content Metrics\n`;
  summary += `- **Total Sections**: ${totalSections} (${nonEmptySections} with content)\n`;
  summary += `- **List Sections**: ${listSections}\n`;
  summary += `- **Total Items**: ${totalItems}\n`;
  summary += `- **Word Count**: ${totalWords} words\n`;
  summary += `- **Character Count**: ${totalChars} characters\n`;
  
  // Section breakdown
  summary += `\n## Section Breakdown\n`;
  if (sections.length === 0) {
    summary += `No sections found.\n`;
  } else {
    sections.forEach(section => {
      const wordCount = section.content.trim().split(/\s+/).filter(w => w.length > 0).length;
      const isEmpty = section.content.trim().length === 0;
      summary += `- **${section.name}**: ${isEmpty ? 'Empty' : `${wordCount} words`}\n`;
    });
  }
  
  // Most active sections
  if (activeSections.length > 0) {
    summary += `\n## Most Active Sections\n`;
    activeSections.forEach((name, index) => {
      summary += `${index + 1}. ${name}\n`;
    });
  }

  return summary;
}