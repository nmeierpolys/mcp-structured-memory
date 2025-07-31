import { describe, it, expect } from 'vitest'
import {
  findItemBoundaries,
  extractItemLines,
  removeItemFromLines,
  addReasonToItem,
  prepareDestinationContent,
  validateItemExists,
  countRemainingItems
} from './moveListItemHelpers.js'

describe('moveListItem Helper Functions', () => {
  const sampleLines = [
    '### Company A',
    '- **Role**: Engineer',
    '- **Status**: Applied',
    '- **Notes**: Great opportunity',
    '',
    '### Company B',
    '- **Role**: Designer',
    '- **Status**: Interview scheduled',
    '',
    '### Company C',
    '- **Role**: Manager',
    '- **Compensation**: $120k'
  ];

  describe('findItemBoundaries', () => {
    it('should find boundaries for first item', () => {
      const result = findItemBoundaries(sampleLines, 'Company A')
      
      expect(result).toEqual({
        startIndex: 0,
        endIndex: 3
      })
    })

    it('should find boundaries for middle item', () => {
      const result = findItemBoundaries(sampleLines, 'Company B')
      
      expect(result).toEqual({
        startIndex: 5,
        endIndex: 7
      })
    })

    it('should find boundaries for last item', () => {
      const result = findItemBoundaries(sampleLines, 'Company C')
      
      expect(result).toEqual({
        startIndex: 9,
        endIndex: 11
      })
    })

    it('should handle case-insensitive search', () => {
      const result = findItemBoundaries(sampleLines, 'company a')
      
      expect(result).toEqual({
        startIndex: 0,
        endIndex: 3
      })
    })

    it('should find item by partial identifier', () => {
      const result = findItemBoundaries(sampleLines, 'Engineer')
      
      expect(result).toEqual({
        startIndex: 1, // Finds first occurrence at line 1: "- **Role**: Engineer"
        endIndex: 3
      })
    })

    it('should return null when item not found', () => {
      const result = findItemBoundaries(sampleLines, 'Nonexistent Company')
      expect(result).toBeNull()
    })

    it('should handle empty lines array', () => {
      const result = findItemBoundaries([], 'anything')
      expect(result).toBeNull()
    })

    it('should handle item at very end without empty line', () => {
      const lines = [
        '### Company A',
        '- Details here'
      ]
      
      const result = findItemBoundaries(lines, 'Company A')
      
      expect(result).toEqual({
        startIndex: 0,
        endIndex: 1
      })
    })

    it('should handle item followed by empty line and EOF', () => {
      const lines = [
        '### Company A',
        '- Details here',
        ''
      ]
      
      const result = findItemBoundaries(lines, 'Company A')
      
      expect(result).toEqual({
        startIndex: 0,
        endIndex: 2
      })
    })

    it('should stop at next heading correctly', () => {
      const lines = [
        '### Company A',
        '- Role: Engineer',
        '- Notes: Good fit',
        '### Company B',
        '- Role: Designer'
      ]
      
      const result = findItemBoundaries(lines, 'Company A')
      
      expect(result).toEqual({
        startIndex: 0,
        endIndex: 2
      })
    })

    it('should handle empty line before heading', () => {
      const lines = [
        '### Company A',
        '- Role: Engineer',
        '',
        '### Company B',
        '- Role: Designer'
      ]
      
      const result = findItemBoundaries(lines, 'Company A')
      
      expect(result).toEqual({
        startIndex: 0,
        endIndex: 1
      })
    })
  })

  describe('extractItemLines', () => {
    it('should extract correct lines based on boundaries', () => {
      const boundaries = { startIndex: 0, endIndex: 3 }
      const result = extractItemLines(sampleLines, boundaries)
      
      expect(result).toEqual([
        '### Company A',
        '- **Role**: Engineer',
        '- **Status**: Applied',
        '- **Notes**: Great opportunity'
      ])
    })

    it('should extract single line item', () => {
      const boundaries = { startIndex: 5, endIndex: 5 }
      const result = extractItemLines(sampleLines, boundaries)
      
      expect(result).toEqual(['### Company B'])
    })

    it('should handle boundaries at edges', () => {
      const boundaries = { startIndex: 0, endIndex: sampleLines.length - 1 }
      const result = extractItemLines(sampleLines, boundaries)
      
      expect(result).toEqual(sampleLines)
    })
  })

  describe('removeItemFromLines', () => {
    it('should remove item from beginning', () => {
      const boundaries = { startIndex: 0, endIndex: 3 }
      const result = removeItemFromLines(sampleLines, boundaries)
      
      expect(result).toEqual([
        '',
        '### Company B',
        '- **Role**: Designer',
        '- **Status**: Interview scheduled',
        '',
        '### Company C',
        '- **Role**: Manager',
        '- **Compensation**: $120k'
      ])
    })

    it('should remove item from middle', () => {
      const boundaries = { startIndex: 5, endIndex: 7 }
      const result = removeItemFromLines(sampleLines, boundaries)
      
      expect(result).toEqual([
        '### Company A',
        '- **Role**: Engineer',
        '- **Status**: Applied',
        '- **Notes**: Great opportunity',
        '',
        '',
        '### Company C',
        '- **Role**: Manager',
        '- **Compensation**: $120k'
      ])
    })

    it('should remove item from end', () => {
      const boundaries = { startIndex: 9, endIndex: 11 }
      const result = removeItemFromLines(sampleLines, boundaries)
      
      expect(result).toEqual([
        '### Company A',
        '- **Role**: Engineer',
        '- **Status**: Applied',
        '- **Notes**: Great opportunity',
        '',
        '### Company B',
        '- **Role**: Designer',
        '- **Status**: Interview scheduled',
        ''
      ])
    })

    it('should handle removing entire content', () => {
      const lines = ['### Only Item']
      const boundaries = { startIndex: 0, endIndex: 0 }
      const result = removeItemFromLines(lines, boundaries)
      
      expect(result).toEqual([])
    })
  })

  describe('addReasonToItem', () => {
    it('should add reason as HTML comment', () => {
      const itemLines = [
        '### Company A',
        '- **Role**: Engineer'
      ]
      
      const result = addReasonToItem(itemLines, 'Better opportunity', 'Active Pipeline')
      
      expect(result).toEqual([
        '### Company A',
        '- **Role**: Engineer',
        '  <!-- Moved from Active Pipeline: Better opportunity -->'
      ])
    })

    it('should handle empty item lines', () => {
      const result = addReasonToItem([], 'Test reason', 'Source Section')
      
      expect(result).toEqual([
        '  <!-- Moved from Source Section: Test reason -->'
      ])
    })

    it('should handle special characters in reason', () => {
      const itemLines = ['### Test Item']
      const result = addReasonToItem(itemLines, 'Reason with "quotes" & symbols', 'Section')
      
      expect(result).toEqual([
        '### Test Item',
        '  <!-- Moved from Section: Reason with "quotes" & symbols -->'
      ])
    })

    it('should handle long reasons', () => {
      const itemLines = ['### Test Item']
      const longReason = 'A'.repeat(200)
      const result = addReasonToItem(itemLines, longReason, 'Section')
      
      expect(result).toEqual([
        '### Test Item',
        `  <!-- Moved from Section: ${longReason} -->`
      ])
    })
  })

  describe('prepareDestinationContent', () => {
    it('should append to existing content', () => {
      const itemLines = ['### New Item', '- Details here']
      const existingContent = '### Existing Item\n- Existing details'
      
      const result = prepareDestinationContent(itemLines, existingContent)
      
      expect(result).toBe(
        '### Existing Item\n- Existing details\n\n### New Item\n- Details here'
      )
    })

    it('should create new content when no existing content', () => {
      const itemLines = ['### New Item', '- Details here']
      
      const result = prepareDestinationContent(itemLines, null)
      
      expect(result).toBe('### New Item\n- Details here')
    })

    it('should handle empty existing content', () => {
      const itemLines = ['### New Item']
      const existingContent = ''
      
      const result = prepareDestinationContent(itemLines, existingContent)
      
      expect(result).toBe('\n\n### New Item')
    })

    it('should handle empty item lines', () => {
      const itemLines: string[] = []
      const existingContent = '### Existing'
      
      const result = prepareDestinationContent(itemLines, existingContent)
      
      expect(result).toBe('### Existing\n')
    })

    it('should handle both empty', () => {
      const result = prepareDestinationContent([], null)
      expect(result).toBe('')
    })
  })

  describe('validateItemExists', () => {
    it('should return true when item exists', () => {
      const result = validateItemExists(sampleLines, 'Company A')
      expect(result).toBe(true)
    })

    it('should return true for partial matches', () => {
      const result = validateItemExists(sampleLines, 'Engineer')
      expect(result).toBe(true)
    })

    it('should be case insensitive', () => {
      const result = validateItemExists(sampleLines, 'company a')
      expect(result).toBe(true)
    })

    it('should return false when item does not exist', () => {
      const result = validateItemExists(sampleLines, 'Nonexistent')
      expect(result).toBe(false)
    })

    it('should handle empty lines', () => {
      const result = validateItemExists([], 'anything')
      expect(result).toBe(false)
    })

    it('should handle whitespace', () => {
      const lines = ['  ### Company A  ', '  - Role: Engineer  ']
      const result = validateItemExists(lines, 'Company A')
      expect(result).toBe(true)
    })
  })

  describe('countRemainingItems', () => {
    it('should count heading lines correctly', () => {
      const result = countRemainingItems(sampleLines)
      expect(result).toBe(3) // Company A, B, and C
    })

    it('should return 0 for lines with no headings', () => {
      const lines = ['- Some bullet', '- Another bullet', 'Regular text']
      const result = countRemainingItems(lines)
      expect(result).toBe(0)
    })

    it('should handle empty lines array', () => {
      const result = countRemainingItems([])
      expect(result).toBe(0)
    })

    it('should only count level 3 headings', () => {
      const lines = [
        '# Level 1',
        '## Level 2', 
        '### Level 3',
        '#### Level 4',
        '### Another Level 3'
      ]
      const result = countRemainingItems(lines)
      expect(result).toBe(2) // Only the ### headings
    })

    it('should handle headings with extra spaces', () => {
      const lines = [
        '   ### Company A   ',
        '### Company B',
        '  ###Company C', // No space after ###
        '###  Company D'  // Extra space after ###
      ]
      const result = countRemainingItems(lines)
      expect(result).toBe(3) // Should count first three, last one has space after ###
    })
  })
})