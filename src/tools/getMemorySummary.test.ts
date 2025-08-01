// Integration tests for getMemorySummary tool using Vitest
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getMemorySummaryTool } from './getMemorySummary.js'
import { StorageManager } from '../storage/StorageManager.js'
import { Memory } from '../types/memory.js'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

describe('getMemorySummaryTool Integration Tests', () => {
  let storageManager: StorageManager;
  let testDir: string;
  
  beforeEach(async () => {
    // Create a temporary directory for test files
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'memory-test-'));
    
    // For this integration test, we need to work with actual files
    // Since we can't override the storage path, we'll need to mock the StorageManager
    storageManager = new StorageManager();
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (_error) {
      // Ignore cleanup errors
    }
  });

  it('should handle missing memory_id parameter', async () => {
    await expect(getMemorySummaryTool(storageManager, {}))
      .rejects.toThrow('memory_id is required');
  });

  it('should handle non-existent memory document', async () => {
    await expect(getMemorySummaryTool(storageManager, { memory_id: 'nonexistent' }))
      .rejects.toThrow("Memory document 'nonexistent' not found");
  });

  it('should generate summary for real memory document', async () => {
    // Create a test memory document
    const testMemory: Memory = {
      metadata: {
        id: 'test-minnesota-trip',
        created: '2024-01-15T10:00:00Z',
        updated: '2024-01-20T15:30:00Z',
        tags: ['travel', 'minnesota', 'fall-colors'],
        status: 'active'
      },
      content: `# Minnesota Trip 2024

## Trip Overview

- **Duration**: 7 days
- **Budget**: $1,800
- **Areas**: North Shore, Twin Cities, Boundary Waters
- **Focus**: Fall foliage, hiking, local culture

## Must-Visit Destinations

### Split Rock Lighthouse ⭐⭐⭐⭐⭐
- **Location**: Two Harbors
- **Best Time**: Morning for photos
- **Duration**: 2 hours
- **Notes**: Iconic Lake Superior landmark

### Boundary Waters ⭐⭐⭐⭐
- **Location**: Northern Minnesota
- **Best Time**: September for fall colors
- **Duration**: 3 days

## Ruled Out Destinations

### Okinawa
- **Reason**: Too far for this trip
- **Date ruled out**: 2024-01-16

## Empty Section

## Travel Tips

Cherry blossom season varies by location. Book accommodations early.
JR Pass provides great value for intercity travel.
This section has more content to test word counting.
`,
      filePath: path.join(testDir, 'test-minnesota-trip.md')
    };

    // Write the memory to disk
    await storageManager.writeMemory(testMemory);

    // Test the summary tool
    const result = await getMemorySummaryTool(storageManager, { memory_id: 'test-minnesota-trip' });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    
    const summaryText = result.content[0].text;
    
    // Verify basic structure
    expect(summaryText).toContain('# Memory Document Summary: test-minnesota-trip');
    expect(summaryText).toContain('## Overview');
    expect(summaryText).toContain('## Content Metrics');
    expect(summaryText).toContain('## Section Breakdown');
    
    // Verify metadata
    expect(summaryText).toContain('**Status**: active');
    expect(summaryText).toContain('**Tags**: travel, minnesota, fall-colors');
    
    // Verify metrics - parser sees more sections including individual headings
    expect(summaryText).toContain('**Total Sections**: 9');
    expect(summaryText).toContain('(5 with content)');
    
    // Verify section counting - sections with bullets/numbers  
    expect(summaryText).toContain('**List Sections**: 4'); // Includes individual company headings with bullets
    
    // Verify section breakdown shows empty section
    expect(summaryText).toContain('- **Empty Section**: Empty');
    
    // Verify some sections have word counts
    expect(summaryText).toMatch(/- \*\*[^*]+\*\*: \d+ words/);
    
    // Verify most active sections appears
    expect(summaryText).toContain('## Most Active Sections');
  });

  it('should handle empty memory document correctly', async () => {
    const emptyMemory: Memory = {
      metadata: {
        id: 'empty-test',
        created: '2024-01-15T10:00:00Z',
        updated: '2024-01-15T10:00:00Z',
        tags: [],
      },
      content: `# Empty Memory

`,
      filePath: path.join(testDir, 'empty-test.md')
    };

    await storageManager.writeMemory(emptyMemory);

    const result = await getMemorySummaryTool(storageManager, { memory_id: 'empty-test' });
    const summaryText = result.content[0].text;

    expect(summaryText).toContain('**Total Sections**: 1'); // The title becomes a section
    expect(summaryText).toContain('(0 with content)'); // But no content
    expect(summaryText).toContain('**List Sections**: 0');
    expect(summaryText).toContain('**Total Items**: 0');
  });

  it('should count different item types correctly', async () => {
    const countingMemory: Memory = {
      metadata: {
        id: 'counting-test',
        created: '2024-01-15T10:00:00Z',
        updated: '2024-01-15T10:00:00Z',
        tags: [],
      },
      content: `# Counting Test

## Bullets
- Item 1
- Item 2
- Item 3

## Numbers
1. First
2. Second

## Mixed
- Bullet
1. Number
### Subheading

## Plain Text
Just some text without special formatting.
`,
      filePath: path.join(testDir, 'counting-test.md')
    };

    await storageManager.writeMemory(countingMemory);

    const result = await getMemorySummaryTool(storageManager, { memory_id: 'counting-test' });
    const summaryText = result.content[0].text;

    // Should count 3 + 2 + 2 = 7 total items (bullets + numbers + mixed, subheading is separate section)
    expect(summaryText).toContain('**Total Items**: 7');
    
    // Should identify 3 list sections (sections with countable items)
    expect(summaryText).toContain('**List Sections**: 3');
  });
});
