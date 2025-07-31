import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { listMemoriesTool } from './listMemories.js'
import { StorageManager } from '../storage/StorageManager.js'
import { MemorySummary } from '../types/memory.js'

// Mock the StorageManager
vi.mock('../storage/StorageManager.js', () => {
  return {
    StorageManager: vi.fn().mockImplementation(() => ({
      listMemories: vi.fn()
    }))
  }
})

describe('listMemories Tool', () => {
  let storageManager: StorageManager

  beforeEach(() => {
    storageManager = new StorageManager()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Empty Memory List', () => {
    it('should return helpful message when no memories exist', async () => {
      vi.mocked(storageManager.listMemories).mockResolvedValue([])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('No memory documents found.')
      expect(result.content[0].text).toContain('To create your first memory document, use the create_memory tool')
      expect(result.content[0].text).toContain('Examples:')
      expect(result.content[0].text).toContain('"Create a memory document called \'job search 2025\'"')
      expect(result.content[0].text).toContain('"Create a memory document for \'my research project\' with context about climate change"')
      expect(result.content[0].text).toContain('"Create a memory document called \'house hunting\' with context about looking in Seattle"')
    })

    it('should return correct response structure when no memories exist', async () => {
      vi.mocked(storageManager.listMemories).mockResolvedValue([])

      const result = await listMemoriesTool(storageManager, {})

      expect(result).toHaveProperty('content')
      expect(result.content).toHaveLength(1)
      expect(result.content[0]).toHaveProperty('type', 'text')
      expect(result.content[0]).toHaveProperty('text')
      expect(typeof result.content[0].text).toBe('string')
    })
  })

  describe('Single Memory Document', () => {
    it('should display single memory with singular language', async () => {
      const mockMemory: MemorySummary = {
        id: 'test-memory',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: ['work'],
        filePath: '/test/path/test-memory.md',
        sectionCount: 3
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('Found 1 memory document:')
      expect(result.content[0].text).not.toContain('documents')
    })

    it('should display memory with all metadata fields', async () => {
      const mockMemory: MemorySummary = {
        id: 'project-notes',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: ['work', 'important'],
        filePath: '/test/path/project-notes.md',
        sectionCount: 5
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('## project-notes (active)')
      expect(result.content[0].text).toContain('- **Created**: 2025-07-30')
      expect(result.content[0].text).toContain('- **Updated**: 2025-07-31')
      expect(result.content[0].text).toContain('- **Sections**: 5')
      expect(result.content[0].text).toContain('- **Tags**: work, important')
      expect(result.content[0].text).toContain('- **File**: /test/path/project-notes.md')
    })

    it('should display memory without status when status is undefined', async () => {
      const mockMemory: MemorySummary = {
        id: 'no-status-memory',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        tags: [],
        filePath: '/test/path/no-status-memory.md',
        sectionCount: 2
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('## no-status-memory')
      expect(result.content[0].text).not.toContain('(active)')
      expect(result.content[0].text).not.toContain('()')
    })

    it('should not display tags line when tags array is empty', async () => {
      const mockMemory: MemorySummary = {
        id: 'no-tags-memory',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: [],
        filePath: '/test/path/no-tags-memory.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).not.toContain('- **Tags**:')
      expect(result.content[0].text).toContain('- **Sections**: 1')
      expect(result.content[0].text).toContain('- **File**: /test/path/no-tags-memory.md')
    })

    it('should handle memory with zero sections', async () => {
      const mockMemory: MemorySummary = {
        id: 'empty-memory',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'draft',
        tags: ['empty'],
        filePath: '/test/path/empty-memory.md',
        sectionCount: 0
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('- **Sections**: 0')
    })
  })

  describe('Multiple Memory Documents', () => {
    it('should display multiple memories with plural language', async () => {
      const mockMemories: MemorySummary[] = [
        {
          id: 'memory-1',
          created: '2025-07-30T12:00:00Z',
          updated: '2025-07-31T10:00:00Z',
          status: 'active',
          tags: ['work'],
          filePath: '/test/path/memory-1.md',
          sectionCount: 2
        },
        {
          id: 'memory-2',
          created: '2025-07-29T14:00:00Z',
          updated: '2025-07-30T16:00:00Z',
          status: 'archived',
          tags: ['personal'],
          filePath: '/test/path/memory-2.md',
          sectionCount: 4
        }
      ]

      vi.mocked(storageManager.listMemories).mockResolvedValue(mockMemories)

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('Found 2 memory documents:')
      expect(result.content[0].text).not.toContain('document:')
    })

    it('should display all memories with their respective data', async () => {
      const mockMemories: MemorySummary[] = [
        {
          id: 'first-memory',
          created: '2025-07-30T12:00:00Z',
          updated: '2025-07-31T10:00:00Z',
          status: 'active',
          tags: ['work', 'urgent'],
          filePath: '/test/path/first-memory.md',
          sectionCount: 3
        },
        {
          id: 'second-memory',
          created: '2025-07-29T14:00:00Z',
          updated: '2025-07-30T16:00:00Z',
          tags: ['personal', 'hobby'],
          filePath: '/test/path/second-memory.md',
          sectionCount: 1
        }
      ]

      vi.mocked(storageManager.listMemories).mockResolvedValue(mockMemories)

      const result = await listMemoriesTool(storageManager, {})

      // Check first memory
      expect(result.content[0].text).toContain('## first-memory (active)')
      expect(result.content[0].text).toContain('- **Created**: 2025-07-30')
      expect(result.content[0].text).toContain('- **Updated**: 2025-07-31')
      expect(result.content[0].text).toContain('- **Sections**: 3')
      expect(result.content[0].text).toContain('- **Tags**: work, urgent')
      expect(result.content[0].text).toContain('- **File**: /test/path/first-memory.md')

      // Check second memory
      expect(result.content[0].text).toContain('## second-memory')
      expect(result.content[0].text).toContain('- **Created**: 2025-07-29')
      expect(result.content[0].text).toContain('- **Updated**: 2025-07-30')
      expect(result.content[0].text).toContain('- **Sections**: 1')
      expect(result.content[0].text).toContain('- **Tags**: personal, hobby')
      expect(result.content[0].text).toContain('- **File**: /test/path/second-memory.md')
    })

    it('should handle mixed memories with and without status/tags', async () => {
      const mockMemories: MemorySummary[] = [
        {
          id: 'with-status',
          created: '2025-07-30T12:00:00Z',
          updated: '2025-07-31T10:00:00Z',
          status: 'active',
          tags: ['work'],
          filePath: '/test/path/with-status.md',
          sectionCount: 2
        },
        {
          id: 'without-status',
          created: '2025-07-29T14:00:00Z',
          updated: '2025-07-30T16:00:00Z',
          tags: [],
          filePath: '/test/path/without-status.md',
          sectionCount: 3
        }
      ]

      vi.mocked(storageManager.listMemories).mockResolvedValue(mockMemories)

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('## with-status (active)')
      expect(result.content[0].text).toContain('- **Tags**: work')
      expect(result.content[0].text).toContain('## without-status')
      expect(result.content[0].text).not.toContain('without-status (')
      // Should not contain empty tags line for second memory
      const lines = result.content[0].text.split('\n')
      const withoutStatusSection = lines.slice(lines.findIndex(line => line.includes('## without-status')))
      expect(withoutStatusSection.some(line => line.includes('- **Tags**:'))).toBe(false)
    })
  })

  describe('Date Formatting', () => {
    it('should extract date part from ISO timestamp for created date', async () => {
      const mockMemory: MemorySummary = {
        id: 'date-test',
        created: '2025-12-25T23:59:59.999Z',
        updated: '2025-12-26T01:30:45.123Z',
        status: 'active',
        tags: [],
        filePath: '/test/path/date-test.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('- **Created**: 2025-12-25')
      expect(result.content[0].text).toContain('- **Updated**: 2025-12-26')
    })

    it('should handle various ISO timestamp formats', async () => {
      const mockMemory: MemorySummary = {
        id: 'iso-test',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-02-14T12:30:45.678Z',
        status: 'active',
        tags: [],
        filePath: '/test/path/iso-test.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('- **Created**: 2025-01-01')
      expect(result.content[0].text).toContain('- **Updated**: 2025-02-14')
    })

    it('should handle same created and updated dates', async () => {
      const mockMemory: MemorySummary = {
        id: 'same-date-test',
        created: '2025-07-31T10:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: [],
        filePath: '/test/path/same-date-test.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('- **Created**: 2025-07-31')
      expect(result.content[0].text).toContain('- **Updated**: 2025-07-31')
    })
  })

  describe('Tags Handling', () => {
    it('should display single tag correctly', async () => {
      const mockMemory: MemorySummary = {
        id: 'single-tag',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: ['important'],
        filePath: '/test/path/single-tag.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('- **Tags**: important')
    })

    it('should display multiple tags separated by commas', async () => {
      const mockMemory: MemorySummary = {
        id: 'multi-tag',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: ['work', 'project', 'urgent', 'client'],
        filePath: '/test/path/multi-tag.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('- **Tags**: work, project, urgent, client')
    })

    it('should handle tags with special characters', async () => {
      const mockMemory: MemorySummary = {
        id: 'special-tags',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: ['work-project', 'client_meeting', 'phase-1', 'team@work'],
        filePath: '/test/path/special-tags.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('- **Tags**: work-project, client_meeting, phase-1, team@work')
    })
  })

  describe('Footer and Usage Instructions', () => {
    it('should include usage instructions footer when memories exist', async () => {
      const mockMemory: MemorySummary = {
        id: 'test-memory',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: [],
        filePath: '/test/path/test-memory.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('---')
      expect(result.content[0].text).toContain('*Use get_section to read specific sections, or add_to_list to add items to any memory document.*')
    })

    it('should not include usage instructions footer when no memories exist', async () => {
      vi.mocked(storageManager.listMemories).mockResolvedValue([])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).not.toContain('---')
      expect(result.content[0].text).not.toContain('*Use get_section to read specific sections')
    })
  })

  describe('Response Structure and Format', () => {
    it('should return correct response structure', async () => {
      const mockMemory: MemorySummary = {
        id: 'structure-test',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: [],
        filePath: '/test/path/structure-test.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result).toHaveProperty('content')
      expect(result.content).toHaveLength(1)
      expect(result.content[0]).toHaveProperty('type', 'text')
      expect(result.content[0]).toHaveProperty('text')
      expect(typeof result.content[0].text).toBe('string')
    })

    it('should format memory sections with proper markdown headers', async () => {
      const mockMemories: MemorySummary[] = [
        {
          id: 'format-test-1',
          created: '2025-07-30T12:00:00Z',
          updated: '2025-07-31T10:00:00Z',
          status: 'active',
          tags: [],
          filePath: '/test/path/format-test-1.md',
          sectionCount: 1
        },
        {
          id: 'format-test-2',
          created: '2025-07-29T12:00:00Z',
          updated: '2025-07-30T10:00:00Z',
          tags: [],
          filePath: '/test/path/format-test-2.md',
          sectionCount: 2
        }
      ]

      vi.mocked(storageManager.listMemories).mockResolvedValue(mockMemories)

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('## format-test-1 (active)')
      expect(result.content[0].text).toContain('## format-test-2')
      expect(result.content[0].text).toMatch(/## format-test-1.*\n.*## format-test-2/s)
    })

    it('should maintain consistent formatting with proper spacing', async () => {
      const mockMemory: MemorySummary = {
        id: 'spacing-test',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: ['test'],
        filePath: '/test/path/spacing-test.md',
        sectionCount: 5
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      const text = result.content[0].text
      // Check that each metadata line starts with "- **" and ends properly
      expect(text).toMatch(/- \*\*Created\*\*: 2025-07-30/)
      expect(text).toMatch(/- \*\*Updated\*\*: 2025-07-31/)
      expect(text).toMatch(/- \*\*Sections\*\*: 5/)
      expect(text).toMatch(/- \*\*Tags\*\*: test/)
      expect(text).toMatch(/- \*\*File\*\*: \/test\/path\/spacing-test\.md/)
      
      // Check proper spacing between sections
      expect(text).toMatch(/\.md\n\n---/)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle StorageManager listMemories errors', async () => {
      vi.mocked(storageManager.listMemories).mockRejectedValue(new Error('Storage error'))

      await expect(
        listMemoriesTool(storageManager, {})
      ).rejects.toThrow('Storage error')
    })

    it('should handle undefined StorageManager', async () => {
      await expect(
        listMemoriesTool(undefined as any, {})
      ).rejects.toThrow()
    })

    it('should handle null StorageManager', async () => {
      await expect(
        listMemoriesTool(null as any, {})
      ).rejects.toThrow()
    })

    it('should handle memories with missing required fields gracefully', async () => {
      const mockMemories: any[] = [
        {
          id: 'incomplete-memory',
          created: '2025-07-30T12:00:00Z',
          updated: '2025-07-31T10:00:00Z',
          tags: [], // Must provide empty tags array to avoid error
          filePath: '/test/path/incomplete.md',
          sectionCount: 0
          // Missing status is fine
        }
      ]

      vi.mocked(storageManager.listMemories).mockResolvedValue(mockMemories)

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('## incomplete-memory')
      expect(result.content[0].text).toContain('- **Created**: 2025-07-30')
      expect(result.content[0].text).toContain('- **Updated**: 2025-07-31')
      expect(result.content[0].text).toContain('- **Sections**: 0')
      expect(result.content[0].text).toContain('- **File**: /test/path/incomplete.md')
    })

    it('should throw error when tags array is null', async () => {
      const mockMemory: any = {
        id: 'null-tags',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: null,
        filePath: '/test/path/null-tags.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      // Current implementation doesn't handle null tags gracefully
      await expect(listMemoriesTool(storageManager, {})).rejects.toThrow()
    })

    it('should handle memories with very long file paths', async () => {
      const longPath = '/very/long/path/'.repeat(20) + 'memory.md'
      const mockMemory: MemorySummary = {
        id: 'long-path',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: [],
        filePath: longPath,
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain(`- **File**: ${longPath}`)
    })

    it('should handle memories with very high section counts', async () => {
      const mockMemory: MemorySummary = {
        id: 'high-sections',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: [],
        filePath: '/test/path/high-sections.md',
        sectionCount: 999999
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('- **Sections**: 999999')
    })

    it('should handle memories with negative section counts', async () => {
      const mockMemory: any = {
        id: 'negative-sections',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: [],
        filePath: '/test/path/negative-sections.md',
        sectionCount: -1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('- **Sections**: -1')
    })

    it('should handle very long memory IDs', async () => {
      const longId = 'very-long-memory-id-'.repeat(10) + 'end'
      const mockMemory: MemorySummary = {
        id: longId,
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: [],
        filePath: '/test/path/long-id.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain(`## ${longId} (active)`)
    })

    it('should handle memories with special characters in IDs', async () => {
      const specialId = 'memory-with-special-chars_123@domain.com'
      const mockMemory: MemorySummary = {
        id: specialId,
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: [],
        filePath: '/test/path/special-chars.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain(`## ${specialId} (active)`)
    })
  })

  describe('Input Parameter Handling', () => {
    it('should work with empty args object', async () => {
      vi.mocked(storageManager.listMemories).mockResolvedValue([])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('No memory documents found.')
    })

    it('should work with null args', async () => {
      vi.mocked(storageManager.listMemories).mockResolvedValue([])

      const result = await listMemoriesTool(storageManager, null)

      expect(result.content[0].text).toContain('No memory documents found.')
    })

    it('should work with undefined args', async () => {
      vi.mocked(storageManager.listMemories).mockResolvedValue([])

      const result = await listMemoriesTool(storageManager, undefined)

      expect(result.content[0].text).toContain('No memory documents found.')
    })

    it('should ignore any additional arguments in args', async () => {
      vi.mocked(storageManager.listMemories).mockResolvedValue([])

      const result = await listMemoriesTool(storageManager, { 
        someProperty: 'ignored',
        anotherProperty: 123,
        nested: { object: true }
      })

      expect(result.content[0].text).toContain('No memory documents found.')
      expect(storageManager.listMemories).toHaveBeenCalledTimes(1)
    })
  })

  describe('Large Dataset Handling', () => {
    it('should handle large number of memories efficiently', async () => {
      const largeMemorySet: MemorySummary[] = Array.from({ length: 100 }, (_, i) => ({
        id: `memory-${i}`,
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: [`tag-${i}`],
        filePath: `/test/path/memory-${i}.md`,
        sectionCount: i + 1
      }))

      vi.mocked(storageManager.listMemories).mockResolvedValue(largeMemorySet)

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('Found 100 memory documents:')
      expect(result.content[0].text).toContain('## memory-0 (active)')
      expect(result.content[0].text).toContain('## memory-99 (active)')
      expect(result.content[0].text).toContain('- **Sections**: 1')
      expect(result.content[0].text).toContain('- **Sections**: 100')
    })

    it('should handle memories with very long tag lists', async () => {
      const manyTags = Array.from({ length: 50 }, (_, i) => `tag-${i}`)
      const mockMemory: MemorySummary = {
        id: 'many-tags',
        created: '2025-07-30T12:00:00Z',
        updated: '2025-07-31T10:00:00Z',
        status: 'active',
        tags: manyTags,
        filePath: '/test/path/many-tags.md',
        sectionCount: 1
      }

      vi.mocked(storageManager.listMemories).mockResolvedValue([mockMemory])

      const result = await listMemoriesTool(storageManager, {})

      expect(result.content[0].text).toContain('- **Tags**: ' + manyTags.join(', '))
    })
  })
})