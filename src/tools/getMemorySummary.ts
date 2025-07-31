import { StorageManager } from '../storage/StorageManager.js';
import { GetMemorySummaryParams } from '../types/memory.js';
import { generateSummaryText, SummaryData } from './summaryHelpers.js';

// Helper functions for content analysis
export function analyzeContent(content: string): { bulletCount: number; numberedCount: number; headingCount: number; totalItems: number } {
  const bulletMatches = content.match(/^[\s]*[-*+]\s/gm) || [];
  const numberedMatches = content.match(/^[\s]*\d+\.\s/gm) || [];
  const headingMatches = content.match(/^[\s]*#{3,}\s/gm) || [];
  
  return {
    bulletCount: bulletMatches.length,
    numberedCount: numberedMatches.length,
    headingCount: headingMatches.length,
    totalItems: bulletMatches.length + numberedMatches.length + headingMatches.length
  };
}

export function calculateDaysSince(timestamp: number): number {
  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}

export function findActiveSections(sections: Array<{ name: string; content: string }>): string[] {
  return sections
    .filter(s => s.content.trim().length > 0)
    .sort((a, b) => b.content.length - a.content.length)
    .slice(0, 3)
    .map(s => s.name);
}

export async function getMemorySummaryTool(
  storageManager: StorageManager,
  args: any
): Promise<any> {
  const params = args as GetMemorySummaryParams;
  
  if (!params.memory_id) {
    throw new Error('memory_id is required');
  }

  // Read the memory document
  const memory = await storageManager.readMemory(params.memory_id);
  if (!memory) {
    throw new Error(`Memory document '${params.memory_id}' not found`);
  }

  // Parse sections for analysis
  const sections = storageManager.parseSections(memory.content);
  
  // Generate summary statistics
  const totalSections = sections.length;
  const nonEmptySections = sections.filter(s => s.content.trim().length > 0).length;
  
  // Count different types of content
  let totalItems = 0;
  let listSections = 0;
  
  sections.forEach(section => {
    const content = section.content.trim();
    if (content) {
      const analysis = analyzeContent(content);
      if (analysis.totalItems > 0) {
        totalItems += analysis.totalItems;
        listSections++;
      }
    }
  });

  // Calculate content metrics
  const totalWords = memory.content.split(/\s+/).filter(word => word.length > 0).length;
  const totalChars = memory.content.length;
  
  // Identify the most active sections (by content length)
  const activeSections = findActiveSections(sections);

  // Format creation and update dates
  const created = new Date(memory.metadata.created);
  const updated = new Date(memory.metadata.updated);
  const daysSinceCreated = calculateDaysSince(created.getTime());
  const daysSinceUpdated = calculateDaysSince(updated.getTime());

  // Build summary using helper function
  const summaryData: SummaryData = {
    memory,
    totalSections,
    nonEmptySections,
    listSections,
    totalItems,
    totalWords,
    totalChars,
    activeSections,
    daysSinceCreated,
    daysSinceUpdated,
    sections
  };
  
  const summary = generateSummaryText(summaryData);

  return {
    content: [{
      type: 'text',
      text: summary
    }]
  };
}