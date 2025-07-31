import { StorageManager } from '../storage/StorageManager.js';
import { SearchWithinMemoryParams } from '../types/memory.js';

export async function searchWithinMemoryTool(
  storageManager: StorageManager,
  args: any
): Promise<any> {
  const params = args as SearchWithinMemoryParams;
  
  if (!params.memory_id || !params.query) {
    throw new Error('Both memory_id and query are required');
  }

  // Read the memory document
  const memory = await storageManager.readMemory(params.memory_id);
  if (!memory) {
    throw new Error(`Memory document '${params.memory_id}' not found`);
  }

  // Parse sections for targeted search
  const sections = storageManager.parseSections(memory.content);
  
  // Prepare search query (case-insensitive)
  const query = params.query.toLowerCase();
  const queryTerms = query.split(/\s+/).filter(term => term.length > 0);
  
  interface SearchResult {
    section: string;
    matches: string[];
    score: number;
  }
  
  const results: SearchResult[] = [];
  
  // Search within each section
  sections.forEach(section => {
    const sectionContent = section.content.toLowerCase();
    const originalContent = section.content;
    
    if (sectionContent.includes(query)) {
      // Direct phrase match - highest score
      const lines = originalContent.split('\n');
      const matchingLines = lines.filter(line => 
        line.toLowerCase().includes(query)
      );
      
      results.push({
        section: section.name,
        matches: matchingLines.slice(0, 3), // Limit to 3 matches per section
        score: 10
      });
    } else {
      // Check for individual term matches
      const termMatches = queryTerms.filter(term => sectionContent.includes(term));
      
      if (termMatches.length > 0) {
        const lines = originalContent.split('\n');
        const matchingLines = lines.filter(line => {
          const lineLower = line.toLowerCase();
          return termMatches.some(term => lineLower.includes(term));
        });
        
        if (matchingLines.length > 0) {
          results.push({
            section: section.name,
            matches: matchingLines.slice(0, 2), // Fewer matches for partial matches
            score: termMatches.length
          });
        }
      }
    }
  });
  
  // Sort by score (descending) and then by section name
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.section.localeCompare(b.section);
  });
  
  // Format results
  let response = `# Search Results in "${params.memory_id}"\n\n`;
  response += `**Query**: "${params.query}"\n\n`;
  
  if (results.length === 0) {
    response += `No matches found for "${params.query}".`;
  } else {
    response += `Found ${results.length} section${results.length === 1 ? '' : 's'} with matches:\n\n`;
    
    results.forEach((result, index) => {
      response += `## ${index + 1}. ${result.section}\n`;
      
      result.matches.forEach(match => {
        const trimmedMatch = match.trim();
        if (trimmedMatch) {
          // Highlight the matching terms (simple approach)
          let highlightedMatch = trimmedMatch;
          queryTerms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedMatch = highlightedMatch.replace(regex, '**$1**');
          });
          
          response += `- ${highlightedMatch}\n`;
        }
      });
      
      response += `\n`;
    });
    
    response += `---\n`;
    response += `*Search completed across ${sections.length} sections*`;
  }

  return {
    content: [{
      type: 'text',
      text: response
    }]
  };
}