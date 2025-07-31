import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { analyzeContent, calculateDaysSince, findActiveSections } from './getMemorySummary.js'

describe('Helper Functions', () => {
  describe('analyzeContent', () => {
    it('should count bullet points correctly', () => {
      const content = `- First bullet
- Second bullet
* Third bullet
+ Fourth bullet`;
      
      const result = analyzeContent(content);
      expect(result.bulletCount).toBe(4);
      expect(result.numberedCount).toBe(0);
      expect(result.headingCount).toBe(0);
      expect(result.totalItems).toBe(4);
    });

    it('should count numbered items correctly', () => {
      const content = `1. First item
2. Second item
3. Third item`;
      
      const result = analyzeContent(content);
      expect(result.bulletCount).toBe(0);
      expect(result.numberedCount).toBe(3);
      expect(result.headingCount).toBe(0);
      expect(result.totalItems).toBe(3);
    });

    it('should count headings correctly', () => {
      const content = `### Heading 1
#### Heading 2
##### Heading 3`;
      
      const result = analyzeContent(content);
      expect(result.bulletCount).toBe(0);
      expect(result.numberedCount).toBe(0);
      expect(result.headingCount).toBe(3);
      expect(result.totalItems).toBe(3);
    });

    it('should count mixed content correctly', () => {
      const content = `- Bullet item
1. Numbered item
### Heading
* Another bullet
2. Another number`;
      
      const result = analyzeContent(content);
      expect(result.bulletCount).toBe(2);
      expect(result.numberedCount).toBe(2);
      expect(result.headingCount).toBe(1);
      expect(result.totalItems).toBe(5);
    });

    it('should handle empty content', () => {
      const result = analyzeContent('');
      expect(result.bulletCount).toBe(0);
      expect(result.numberedCount).toBe(0);
      expect(result.headingCount).toBe(0);
      expect(result.totalItems).toBe(0);
    });

    it('should handle content with no items', () => {
      const content = `This is just regular text
with multiple lines
but no bullets or numbers`;
      
      const result = analyzeContent(content);
      expect(result.bulletCount).toBe(0);
      expect(result.numberedCount).toBe(0);
      expect(result.headingCount).toBe(0);
      expect(result.totalItems).toBe(0);
    });

    it('should handle indented items', () => {
      const content = `  - Indented bullet
    1. Indented number
      ### Indented heading`;
      
      const result = analyzeContent(content);
      expect(result.bulletCount).toBe(1);
      expect(result.numberedCount).toBe(1);
      expect(result.headingCount).toBe(1);
      expect(result.totalItems).toBe(3);
    });
  });

  describe('calculateDaysSince', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should calculate days correctly', () => {
      const now = new Date('2025-07-31T12:00:00Z').getTime();
      vi.setSystemTime(now);
      
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const result = calculateDaysSince(oneDayAgo);
      expect(result).toBe(1);
    });

    it('should handle same day correctly', () => {
      const now = new Date('2025-07-31T12:00:00Z').getTime();
      vi.setSystemTime(now);
      
      const result = calculateDaysSince(now);
      expect(result).toBe(0);
    });

    it('should handle multiple days correctly', () => {
      const now = new Date('2025-07-31T12:00:00Z').getTime();
      vi.setSystemTime(now);
      
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      const result = calculateDaysSince(sevenDaysAgo);
      expect(result).toBe(7);
    });

    it('should handle partial days correctly', () => {
      const now = new Date('2025-07-31T12:00:00Z').getTime();
      vi.setSystemTime(now);
      
      const almostOneDayAgo = now - (23 * 60 * 60 * 1000); // 23 hours ago
      const result = calculateDaysSince(almostOneDayAgo);
      expect(result).toBe(0); // Should round down
    });
  });

  describe('findActiveSections', () => {
    it('should return most active sections by content length', () => {
      const sections = [
        { name: 'Short', content: 'Short content' },
        { name: 'Long', content: 'This is a much longer content with many more words and characters' },
        { name: 'Medium', content: 'Medium length content here' },
        { name: 'Empty', content: '' },
        { name: 'Another', content: 'Another section with some content' }
      ];
      
      const result = findActiveSections(sections);
      expect(result).toEqual(['Long', 'Another', 'Medium']);
    });

    it('should filter out empty sections', () => {
      const sections = [
        { name: 'Content1', content: 'Some content' }, // 12 chars
        { name: 'Empty1', content: '' },
        { name: 'Content2', content: 'Much longer content here' }, // 24 chars
        { name: 'Empty2', content: '   ' }, // whitespace only
      ];
      
      const result = findActiveSections(sections);
      expect(result).toEqual(['Content2', 'Content1']); // Longer content comes first
    });

    it('should limit to 3 sections maximum', () => {
      const sections = [
        { name: 'Section1', content: 'a'.repeat(100) },
        { name: 'Section2', content: 'b'.repeat(90) },
        { name: 'Section3', content: 'c'.repeat(80) },
        { name: 'Section4', content: 'd'.repeat(70) },
        { name: 'Section5', content: 'e'.repeat(60) }
      ];
      
      const result = findActiveSections(sections);
      expect(result).toHaveLength(3);
      expect(result).toEqual(['Section1', 'Section2', 'Section3']);
    });

    it('should handle empty array', () => {
      const result = findActiveSections([]);
      expect(result).toEqual([]);
    });

    it('should handle all empty sections', () => {
      const sections = [
        { name: 'Empty1', content: '' },
        { name: 'Empty2', content: '   ' },
        { name: 'Empty3', content: '\n\t' }
      ];
      
      const result = findActiveSections(sections);
      expect(result).toEqual([]);
    });
  });
});