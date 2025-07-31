import { StorageManager } from '../storage/StorageManager.js';
import { GetSectionParams } from '../types/memory.js';

export async function getSectionTool(
  storageManager: StorageManager,
  args: any
): Promise<any> {
  const params = args as GetSectionParams;
  
  if (!params.memory_id || !params.section) {
    throw new Error('Both memory_id and section are required');
  }

  // Read the memory document
  const memory = await storageManager.readMemory(params.memory_id);
  if (!memory) {
    throw new Error(`Memory document '${params.memory_id}' not found`);
  }

  // Find the section
  const section = storageManager.findSection(memory.content, params.section);
  if (!section) {
    // List available sections to help the user
    const allSections = storageManager.parseSections(memory.content);
    const sectionNames = allSections.map(s => s.name).join(', ');
    
    throw new Error(
      `Section '${params.section}' not found in memory document '${params.memory_id}'. ` +
      `Available sections: ${sectionNames}`
    );
  }

  const sectionContent = section.content || '(This section is empty)';

  return {
    content: [{
      type: 'text',
      text: `## ${section.name}

${sectionContent}

---
*From memory document: ${params.memory_id}*
*Last updated: ${memory.metadata.updated}*`
    }]
  };
}