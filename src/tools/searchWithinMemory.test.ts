import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { searchWithinMemoryTool } from './searchWithinMemory.js'
import { StorageManager } from '../storage/StorageManager.js'
import { Memory } from '../types/memory.js'

// Mock the StorageManager
vi.mock('../storage/StorageManager.js', () => {
  class StorageManager {
    readMemory = vi.fn()
    parseSections = vi.fn()
  }
  return { StorageManager }
})

describe('searchWithinMemory Tool', () => {
  let storageManager: StorageManager
  let mockMemory: Memory

  beforeEach(() => {
    storageManager = new StorageManager()
    
    mockMemory = {
      metadata: {
        id: 'test-memory',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: ['work']
      },
      content: `# Test Memory

## Work Projects
- Complete the API integration task
- Review code for the authentication module
- Update documentation for new features

## Personal Notes
The integration work is challenging but rewarding.
Need to focus on error handling and edge cases.

## Meeting Notes
Discussed project timeline with team.
API endpoints need better documentation.
Focus on user authentication flow.`,
      filePath: '/test/path/test-memory.md'
    }

    const mockSections = [
      {
        name: 'Work Projects',
        content: `- Complete the API integration task
- Review code for the authentication module
- Update documentation for new features`,
        level: 2
      },
      {
        name: 'Personal Notes',
        content: `The integration work is challenging but rewarding.
Need to focus on error handling and edge cases.`,
        level: 2
      },
      {
        name: 'Meeting Notes',
        content: `Discussed project timeline with team.
API endpoints need better documentation.
Focus on user authentication flow.`,
        level: 2
      }
    ]

    vi.mocked(storageManager.readMemory).mockResolvedValue(mockMemory)
    vi.mocked(storageManager.parseSections).mockReturnValue(mockSections)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Input Validation', () => {
    it('should throw error when memory_id is missing', async () => {
      await expect(
        searchWithinMemoryTool(storageManager, { query: 'test' })
      ).rejects.toThrow('Both memory_id and query are required')
    })

    it('should throw error when query is missing', async () => {
      await expect(
        searchWithinMemoryTool(storageManager, { memory_id: 'test' })
      ).rejects.toThrow('Both memory_id and query are required')
    })

    it('should throw error when both are missing', async () => {
      await expect(
        searchWithinMemoryTool(storageManager, {})
      ).rejects.toThrow('Both memory_id and query are required')
    })

    it('should throw error when memory document not found', async () => {
      vi.mocked(storageManager.readMemory).mockResolvedValue(null)

      await expect(
        searchWithinMemoryTool(storageManager, { 
          memory_id: 'nonexistent', 
          query: 'test' 
        })
      ).rejects.toThrow("Memory document 'nonexistent' not found")
    })
  })

  describe('Search Logic', () => {
    it('should find exact phrase matches with highest score', async () => {
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'API integration'
      })

      expect(result.content[0].text).toContain('Found 3 sections') // All sections have individual terms
      expect(result.content[0].text).toContain('Work Projects')
      expect(result.content[0].text).toContain('**API** **integration**')
      expect(result.content[0].text).toContain('Complete the **API** **integration** task')
      
      // Work Projects should be first due to having the exact phrase
      const sections = result.content[0].text.split('## ').slice(1)
      expect(sections[0]).toContain('1. Work Projects')
    })

    it('should find individual term matches with lower scores', async () => {
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'authentication documentation'
      })

      expect(result.content[0].text).toContain('Found 2 sections')
      expect(result.content[0].text).toContain('Work Projects')
      expect(result.content[0].text).toContain('Meeting Notes')
    })

    it('should handle case-insensitive searches', async () => {
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'API'
      })

      expect(result.content[0].text).toContain('Found 2 sections')
      expect(result.content[0].text).toContain('**API**')
    })

    it('should return no results when no matches found', async () => {
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'nonexistent term'
      })

      expect(result.content[0].text).toContain('No matches found for "nonexistent term"')
      expect(result.content[0].text).not.toContain('Found')
    })

    it('should handle empty query terms after splitting', async () => {
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: '   '
      })

      expect(result.content[0].text).toContain('No matches found')
    })

    it('should limit matches per section for exact matches', async () => {
      // Create memory with many matching lines
      const manyMatchesMemory = {
        ...mockMemory,
        content: 'Multiple lines content'
      }
      
      const sectionsWithManyMatches = [
        {
          name: 'Test Section',
          content: `Line 1 with test word
Line 2 with test word  
Line 3 with test word
Line 4 with test word
Line 5 with test word`,
          level: 2
        }
      ]

      vi.mocked(storageManager.readMemory).mockResolvedValue(manyMatchesMemory)
      vi.mocked(storageManager.parseSections).mockReturnValue(sectionsWithManyMatches)

      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'test word'
      })

      // Should limit to 3 matches for exact phrase matches
      const matches = result.content[0].text.match(/Line \d+ with/g) || []
      expect(matches.length).toBeLessThanOrEqual(3)
    })

    it('should limit matches per section for partial matches', async () => {
      const sectionsWithManyMatches = [
        {
          name: 'Test Section',
          content: `Line 1 with first term
Line 2 with second term  
Line 3 with first term
Line 4 with second term
Line 5 with first term`,
          level: 2
        }
      ]

      vi.mocked(storageManager.parseSections).mockReturnValue(sectionsWithManyMatches)

      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'first second'
      })

      // Should limit to 2 matches for partial matches
      const matches = result.content[0].text.match(/Line \d+ with/g) || []
      expect(matches.length).toBeLessThanOrEqual(2)
    })
  })

  describe('Scoring and Sorting', () => {
    it('should score exact phrase matches higher than partial matches', async () => {
      // Use a query where only one section has the exact phrase
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'Complete the API'
      })

      const text = result.content[0].text
      
      // Work Projects should come first (has exact phrase "Complete the API")
      expect(text).toMatch(/## 1\. Work Projects/)
    })

    it('should sort by section name when scores are equal', async () => {
      // Create sections with equal scores
      const equalScoreSections = [
        {
          name: 'Z Section',
          content: 'Contains the search term',
          level: 2
        },
        {
          name: 'A Section', 
          content: 'Also contains the search term',
          level: 2
        }
      ]

      vi.mocked(storageManager.parseSections).mockReturnValue(equalScoreSections)

      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'search term'
      })

      const text = result.content[0].text
      const sections = text.split('##').slice(1)
      
      // A Section should come before Z Section alphabetically
      expect(sections[0]).toContain('A Section')
      expect(sections[1]).toContain('Z Section')
    })

    it('should calculate correct scores for partial matches', async () => {
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'API documentation authentication'
      })

      // Meeting Notes should score 2 (has "API" and "documentation")
      // Work Projects should score 1 (has "authentication")
      const text = result.content[0].text
      expect(text).toContain('Found 2 sections')
      
      // Higher scoring section should come first
      const sections = text.split('##').slice(1)
      expect(sections[0]).toContain('Meeting Notes')
      expect(sections[1]).toContain('Work Projects')
    })
  })

  describe('Result Formatting', () => {
    it('should format response with correct header structure', async () => {
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'API'
      })

      const text = result.content[0].text
      expect(text).toContain('# Search Results in "test-memory"')
      expect(text).toContain('**Query**: "API"')
    })

    it('should highlight matching terms in results', async () => {
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'API integration'
      })

      const text = result.content[0].text
      expect(text).toContain('**API**')
      expect(text).toContain('**integration**')
    })

    it('should handle case-insensitive highlighting', async () => {
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'api'
      })

      const text = result.content[0].text
      expect(text).toContain('**API**') // Should highlight the uppercase version
    })

    it('should skip empty/whitespace-only matches', async () => {
      const sectionsWithEmptyLines = [
        {
          name: 'Test Section',
          content: `Valid line with test
  
     
Another valid line with test`,
          level: 2
        }
      ]

      vi.mocked(storageManager.parseSections).mockReturnValue(sectionsWithEmptyLines)

      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'test'
      })

      const text = result.content[0].text
      // Should only show non-empty lines
      expect(text).toContain('Valid line with **test**')
      expect(text).toContain('Another valid line with **test**')
      // Should not contain empty bullet points (bullet followed immediately by newline)
      expect(text).not.toContain('- \n')
    })

    it('should include summary footer', async () => {
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'API'
      })

      const text = result.content[0].text
      expect(text).toContain('---')
      expect(text).toContain('*Search completed across 3 sections*')
    })

    it('should handle singular vs plural section count', async () => {
      const singleSectionMemory = [
        {
          name: 'Only Section',
          content: 'Contains the search term',
          level: 2
        }
      ]

      vi.mocked(storageManager.parseSections).mockReturnValue(singleSectionMemory)

      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'search'
      })

      const text = result.content[0].text
      expect(text).toContain('Found 1 section with matches') // Singular
      expect(text).not.toContain('sections with matches')
    })
  })

  describe('Edge Cases', () => {
    it('should handle memories with no sections', async () => {
      vi.mocked(storageManager.parseSections).mockReturnValue([])

      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'anything'
      })

      const text = result.content[0].text
      expect(text).toContain('No matches found')
      // The footer is only added when there are results, not for no matches
      expect(text).not.toContain('*Search completed')
    })

    it('should handle sections with empty content', async () => {
      const sectionsWithEmpty = [
        {
          name: 'Empty Section',
          content: '',
          level: 2
        },
        {
          name: 'Valid Section',
          content: 'Has some content with search term',
          level: 2
        }
      ]

      vi.mocked(storageManager.parseSections).mockReturnValue(sectionsWithEmpty)

      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'search'
      })

      const text = result.content[0].text
      expect(text).toContain('Found 1 section')
      expect(text).toContain('Valid Section')
      expect(text).not.toContain('Empty Section')
    })

    it('should handle special regex characters in search query', async () => {
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: 'API.'
      })

      // Should not throw regex error and should treat dot as literal
      expect(result.content[0].text).toContain('No matches found')
    })

    it('should handle very long queries', async () => {
      const longQuery = 'word '.repeat(50).trim()
      
      const result = await searchWithinMemoryTool(storageManager, {
        memory_id: 'test-memory',
        query: longQuery
      })

      expect(result.content[0].text).toContain(`**Query**: "${longQuery}"`)
    })
  })
})