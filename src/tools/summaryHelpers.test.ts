import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateSummaryText, SummaryData } from './summaryHelpers.js'
import { Memory } from '../types/memory.js'

describe('Summary Text Generation', () => {
  let mockMemory: Memory;
  let baseSummaryData: SummaryData;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-07-31T12:00:00Z'));

    mockMemory = {
      metadata: {
        id: 'test-memory',
        created: new Date('2025-07-30T12:00:00Z').toISOString(),
        updated: new Date('2025-07-31T10:00:00Z').toISOString(),
        status: 'active',
        tags: ['work', 'important']
      },
      content: 'Test content',
      filePath: '/test/path/test-memory.md'
    };

    baseSummaryData = {
      memory: mockMemory,
      totalSections: 3,
      nonEmptySections: 2,
      listSections: 1,
      totalItems: 5,
      totalWords: 100,
      totalChars: 500,
      activeSections: ['Notes', 'Tasks', 'Ideas'],
      daysSinceCreated: 1,
      daysSinceUpdated: 0,
      sections: [
        { name: 'Notes', content: 'Some notes here' },
        { name: 'Tasks', content: '- Task 1\n- Task 2' },
        { name: 'Empty', content: '' }
      ]
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate complete summary with all sections', () => {
    const result = generateSummaryText(baseSummaryData);
    
    expect(result).toContain('# Memory Document Summary: test-memory');
    expect(result).toContain('## Overview');
    expect(result).toContain('## Content Metrics');
    expect(result).toContain('## Section Breakdown');
    expect(result).toContain('## Most Active Sections');
  });

  it('should include correct dates and time calculations', () => {
    const result = generateSummaryText(baseSummaryData);
    
    expect(result).toContain('**Created**: 7/30/2025 (1 days ago)');
    expect(result).toContain('**Last Updated**: 7/31/2025 (0 days ago)');
  });

  it('should include status information', () => {
    const result = generateSummaryText(baseSummaryData);
    expect(result).toContain('**Status**: active');
  });

  it('should include tags when present', () => {
    const result = generateSummaryText(baseSummaryData);
    expect(result).toContain('**Tags**: work, important');
  });

  it('should not include tags section when no tags', () => {
    const dataWithoutTags = {
      ...baseSummaryData,
      memory: {
        ...mockMemory,
        metadata: {
          ...mockMemory.metadata,
          tags: []
        }
      }
    };
    
    const result = generateSummaryText(dataWithoutTags);
    expect(result).not.toContain('**Tags**');
  });

  it('should include correct content metrics', () => {
    const result = generateSummaryText(baseSummaryData);
    
    expect(result).toContain('**Total Sections**: 3 (2 with content)');
    expect(result).toContain('**List Sections**: 1');
    expect(result).toContain('**Total Items**: 5');
    expect(result).toContain('**Word Count**: 100 words');
    expect(result).toContain('**Character Count**: 500 characters');
  });

  it('should show section breakdown with word counts', () => {
    const result = generateSummaryText(baseSummaryData);
    
    expect(result).toContain('- **Notes**: 3 words');
    expect(result).toContain('- **Tasks**: 6 words'); // "- Task 1\n- Task 2" = 6 words
    expect(result).toContain('- **Empty**: Empty');
  });

  it('should handle no sections case', () => {
    const dataWithNoSections = {
      ...baseSummaryData,
      sections: []
    };
    
    const result = generateSummaryText(dataWithNoSections);
    expect(result).toContain('No sections found.');
  });

  it('should list active sections in order', () => {
    const result = generateSummaryText(baseSummaryData);
    
    expect(result).toContain('1. Notes');
    expect(result).toContain('2. Tasks');
    expect(result).toContain('3. Ideas');
  });

  it('should not show active sections when none exist', () => {
    const dataWithNoActiveSections = {
      ...baseSummaryData,
      activeSections: []
    };
    
    const result = generateSummaryText(dataWithNoActiveSections);
    expect(result).not.toContain('## Most Active Sections');
  });

  it('should use default status when none provided', () => {
    const dataWithoutStatus = {
      ...baseSummaryData,
      memory: {
        ...mockMemory,
        metadata: {
          ...mockMemory.metadata,
          status: undefined as any
        }
      }
    };
    
    const result = generateSummaryText(dataWithoutStatus);
    expect(result).toContain('**Status**: active');
  });

  it('should handle sections with only whitespace as empty', () => {
    const dataWithWhitespaceSection = {
      ...baseSummaryData,
      sections: [
        { name: 'Whitespace', content: '   \n\t  ' },
        { name: 'RealContent', content: 'Actual content here' }
      ]
    };
    
    const result = generateSummaryText(dataWithWhitespaceSection);
    expect(result).toContain('- **Whitespace**: Empty');
    expect(result).toContain('- **RealContent**: 3 words');
  });
});