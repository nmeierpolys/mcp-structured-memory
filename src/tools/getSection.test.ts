import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getSectionTool } from './getSection.js'
import { StorageManager } from '../storage/StorageManager.js'
import { Memory, MemorySection } from '../types/memory.js'

// Mock the StorageManager
vi.mock('../storage/StorageManager.js', () => {
  class StorageManager {
    readMemory = vi.fn()
    findSection = vi.fn()
    parseSections = vi.fn()
  }
  return { StorageManager }
})

describe('getSection Tool', () => {
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
        tags: ['work', 'project']
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
Focus on user authentication flow.

## Empty Section

## Another Section
This section has some content.`,
      filePath: '/test/path/test-memory.md'
    }

    vi.mocked(storageManager.readMemory).mockResolvedValue(mockMemory)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Input Validation', () => {
    it('should throw error when memory_id is missing', async () => {
      await expect(
        getSectionTool(storageManager, { section: 'Work Projects' })
      ).rejects.toThrow('Both memory_id and section are required')
    })

    it('should throw error when section is missing', async () => {
      await expect(
        getSectionTool(storageManager, { memory_id: 'test-memory' })
      ).rejects.toThrow('Both memory_id and section are required')
    })

    it('should throw error when both parameters are missing', async () => {
      await expect(
        getSectionTool(storageManager, {})
      ).rejects.toThrow('Both memory_id and section are required')
    })

    it('should throw error when memory_id is empty string', async () => {
      await expect(
        getSectionTool(storageManager, { memory_id: '', section: 'Work Projects' })  
      ).rejects.toThrow('Both memory_id and section are required')
    })

    it('should throw error when section is empty string', async () => {
      await expect(
        getSectionTool(storageManager, { memory_id: 'test-memory', section: '' })
      ).rejects.toThrow('Both memory_id and section are required')
    })

    it('should throw error when memory_id is null', async () => {
      await expect(
        getSectionTool(storageManager, { memory_id: null, section: 'Work Projects' })
      ).rejects.toThrow('Both memory_id and section are required')
    })

    it('should throw error when section is null', async () => {
      await expect(
        getSectionTool(storageManager, { memory_id: 'test-memory', section: null })
      ).rejects.toThrow('Both memory_id and section are required')
    })

    it('should throw error when memory document not found', async () => {
      vi.mocked(storageManager.readMemory).mockResolvedValue(null)

      await expect(
        getSectionTool(storageManager, { 
          memory_id: 'nonexistent', 
          section: 'Work Projects' 
        })
      ).rejects.toThrow("Memory document 'nonexistent' not found")
    })
  })

  describe('Section Retrieval', () => {
    it('should successfully retrieve existing section with content', async () => {
      const mockSection: MemorySection = {
        name: 'Work Projects',
        content: '- Complete the API integration task\n- Review code for the authentication module\n- Update documentation for new features',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Work Projects'
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('## Work Projects')
      expect(result.content[0].text).toContain('- Complete the API integration task')
      expect(result.content[0].text).toContain('- Review code for the authentication module')
      expect(result.content[0].text).toContain('- Update documentation for new features')
      expect(result.content[0].text).toContain('---')
      expect(result.content[0].text).toContain('*From memory document: test-memory*')
      expect(result.content[0].text).toContain('*Last updated: 2025-07-31T10:00:00Z*')
    })

    it('should handle section with empty content', async () => {
      const mockSection: MemorySection = {
        name: 'Empty Section',
        content: '',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Empty Section'
      })

      expect(result.content[0].text).toContain('## Empty Section')
      expect(result.content[0].text).toContain('(This section is empty)')
      expect(result.content[0].text).toContain('*From memory document: test-memory*')
    })

    it('should handle section with null content', async () => {
      const mockSection: MemorySection = {
        name: 'Null Content Section',
        content: null as any,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Null Content Section'
      })

      expect(result.content[0].text).toContain('## Null Content Section')
      expect(result.content[0].text).toContain('(This section is empty)')
    })

    it('should handle section with undefined content', async () => {
      const mockSection: MemorySection = {
        name: 'Undefined Content Section',
        content: undefined as any,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Undefined Content Section'
      })

      expect(result.content[0].text).toContain('## Undefined Content Section')
      expect(result.content[0].text).toContain('(This section is empty)')
    })

    it('should handle section with whitespace-only content', async () => {
      const mockSection: MemorySection = {
        name: 'Whitespace Section',
        content: '   \n\t  \n   ',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Whitespace Section'
      })

      expect(result.content[0].text).toContain('## Whitespace Section')
      expect(result.content[0].text).toContain('   \n\t  \n   ')
      expect(result.content[0].text).not.toContain('(This section is empty)')
    })

    it('should handle multi-line section content', async () => {
      const mockSection: MemorySection = {
        name: 'Personal Notes',
        content: 'The integration work is challenging but rewarding.\nNeed to focus on error handling and edge cases.\n\nAdditional thoughts on the project.',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Personal Notes'
      })

      expect(result.content[0].text).toContain('## Personal Notes')
      expect(result.content[0].text).toContain('The integration work is challenging but rewarding.')
      expect(result.content[0].text).toContain('Need to focus on error handling and edge cases.')
      expect(result.content[0].text).toContain('Additional thoughts on the project.')
    })

    it('should handle section with special characters in name', async () => {
      const mockSection: MemorySection = {
        name: 'Section & Special <Characters> "Quotes"',
        content: 'Content with special characters & symbols',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Section & Special <Characters> "Quotes"'
      })

      expect(result.content[0].text).toContain('## Section & Special <Characters> "Quotes"')
      expect(result.content[0].text).toContain('Content with special characters & symbols')
    })

    it('should handle section with markdown formatting in content', async () => {
      const mockSection: MemorySection = {
        name: 'Formatted Section',
        content: '**Bold text** and *italic text*\n\n- Bullet point\n- Another bullet\n\n`Code snippet`\n\n[Link](https://example.com)',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Formatted Section'
      })

      expect(result.content[0].text).toContain('## Formatted Section')
      expect(result.content[0].text).toContain('**Bold text** and *italic text*')
      expect(result.content[0].text).toContain('- Bullet point')
      expect(result.content[0].text).toContain('`Code snippet`')
      expect(result.content[0].text).toContain('[Link](https://example.com)')
    })
  })

  describe('Section Not Found Error Handling', () => {
    it('should throw error with available sections when section not found', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)
      
      const mockSections: MemorySection[] = [
        { name: 'Work Projects', content: 'content1', level: 2 },
        { name: 'Personal Notes', content: 'content2', level: 2 },
        { name: 'Meeting Notes', content: 'content3', level: 2 }
      ]
      
      vi.mocked(storageManager.parseSections).mockReturnValue(mockSections)

      await expect(
        getSectionTool(storageManager, { 
          memory_id: 'test-memory', 
          section: 'nonexistent-section' 
        })
      ).rejects.toThrow(
        "Section 'nonexistent-section' not found in memory document 'test-memory'. " +
        "Available sections: Work Projects, Personal Notes, Meeting Notes"
      )
    })

    it('should throw error with no available sections when memory has no sections', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)
      vi.mocked(storageManager.parseSections).mockReturnValue([])

      await expect(
        getSectionTool(storageManager, { 
          memory_id: 'test-memory', 
          section: 'any-section' 
        })
      ).rejects.toThrow(
        "Section 'any-section' not found in memory document 'test-memory'. " +
        "Available sections: "
      )
    })

    it('should throw error with single available section', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)
      
      const mockSections: MemorySection[] = [
        { name: 'Only Section', content: 'content', level: 2 }
      ]
      
      vi.mocked(storageManager.parseSections).mockReturnValue(mockSections)

      await expect(
        getSectionTool(storageManager, { 
          memory_id: 'test-memory', 
          section: 'wrong-section' 
        })
      ).rejects.toThrow(
        "Section 'wrong-section' not found in memory document 'test-memory'. " +
        "Available sections: Only Section"
      )
    })

    it('should handle sections with special characters in available sections list', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)
      
      const mockSections: MemorySection[] = [
        { name: 'Section & One', content: 'content1', level: 2 },
        { name: 'Section "Two"', content: 'content2', level: 2 },
        { name: 'Section <Three>', content: 'content3', level: 2 }
      ]
      
      vi.mocked(storageManager.parseSections).mockReturnValue(mockSections)

      await expect(
        getSectionTool(storageManager, { 
          memory_id: 'test-memory', 
          section: 'missing' 
        })
      ).rejects.toThrow(
        "Section 'missing' not found in memory document 'test-memory'. " +
        'Available sections: Section & One, Section "Two", Section <Three>'
      )
    })
  })

  describe('Storage Manager Integration', () => {
    it('should call readMemory with correct memory_id', async () => {
      const mockSection: MemorySection = {
        name: 'Test Section',
        content: 'test content',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await getSectionTool(storageManager, {
        memory_id: 'specific-memory-id',
        section: 'Test Section'
      })

      expect(vi.mocked(storageManager.readMemory)).toHaveBeenCalledWith('specific-memory-id')
      expect(vi.mocked(storageManager.readMemory)).toHaveBeenCalledTimes(1)
    })

    it('should call findSection with memory content and section name', async () => {
      const mockSection: MemorySection = {
        name: 'Test Section',
        content: 'test content',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section'
      })

      expect(vi.mocked(storageManager.findSection)).toHaveBeenCalledWith(
        mockMemory.content,
        'Test Section'
      )
      expect(vi.mocked(storageManager.findSection)).toHaveBeenCalledTimes(1)
    })

    it('should call parseSections only when section not found', async () => {
      const mockSection: MemorySection = {
        name: 'Found Section',
        content: 'content',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Found Section'
      })

      expect(vi.mocked(storageManager.parseSections)).not.toHaveBeenCalled()
    })

    it('should call parseSections when section not found for error message', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)
      
      const mockSections: MemorySection[] = [
        { name: 'Available Section', content: 'content', level: 2 }
      ]
      
      vi.mocked(storageManager.parseSections).mockReturnValue(mockSections)

      await expect(
        getSectionTool(storageManager, {
          memory_id: 'test-memory',
          section: 'Missing Section'
        })
      ).rejects.toThrow()

      expect(vi.mocked(storageManager.parseSections)).toHaveBeenCalledWith(mockMemory.content)
      expect(vi.mocked(storageManager.parseSections)).toHaveBeenCalledTimes(1)
    })

    it('should handle readMemory throwing error', async () => {
      vi.mocked(storageManager.readMemory).mockRejectedValue(new Error('Read failed'))

      await expect(
        getSectionTool(storageManager, {
          memory_id: 'test-memory',
          section: 'Test Section'
        })
      ).rejects.toThrow('Read failed')
    })

    it('should handle findSection throwing error', async () => {
      vi.mocked(storageManager.findSection).mockImplementation(() => {
        throw new Error('Find section failed')
      })

      await expect(
        getSectionTool(storageManager, {
          memory_id: 'test-memory',
          section: 'Test Section'
        })
      ).rejects.toThrow('Find section failed')
    })

    it('should handle parseSections throwing error', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)
      vi.mocked(storageManager.parseSections).mockImplementation(() => {
        throw new Error('Parse sections failed')
      })

      await expect(
        getSectionTool(storageManager, {
          memory_id: 'test-memory',
          section: 'Missing Section'
        })
      ).rejects.toThrow('Parse sections failed')
    })
  })

  describe('Return Value Format', () => {
    it('should return correct structure with content array', async () => {
      const mockSection: MemorySection = {
        name: 'Test Section',
        content: 'test content',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section'
      })

      expect(result).toHaveProperty('content')
      expect(Array.isArray(result.content)).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0]).toHaveProperty('type', 'text')
      expect(result.content[0]).toHaveProperty('text')
      expect(typeof result.content[0].text).toBe('string')
    })

    it('should format header with section name', async () => {
      const mockSection: MemorySection = {
        name: 'Formatted Section Name',
        content: 'some content',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Formatted Section Name'
      })

      expect(result.content[0].text).toMatch(/^## Formatted Section Name\n/)
    })

    it('should include content followed by footer with metadata', async () => {
      const mockSection: MemorySection = {
        name: 'Content Section',
        content: 'This is the section content',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Content Section'
      })

      const text = result.content[0].text
      const lines = text.split('\n')
      
      expect(lines[0]).toBe('## Content Section')
      expect(lines[1]).toBe('')
      expect(lines[2]).toBe('This is the section content')
      expect(lines[3]).toBe('')
      expect(lines[4]).toBe('---')
      expect(lines[5]).toBe('*From memory document: test-memory*')
      expect(lines[6]).toBe('*Last updated: 2025-07-31T10:00:00Z*')
    })

    it('should handle different memory metadata', async () => {
      const differentMemory: Memory = {
        metadata: {
          id: 'different-id',
          created: '2025-01-01T00:00:00Z',
          updated: '2025-07-30T15:30:45Z',
          status: 'archived',
          tags: ['personal']
        },
        content: 'content',
        filePath: '/different/path.md'
      }

      const mockSection: MemorySection = {
        name: 'Section',
        content: 'content',
        level: 2
      }

      vi.mocked(storageManager.readMemory).mockResolvedValue(differentMemory)
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'different-id',
        section: 'Section'
      })

      expect(result.content[0].text).toContain('*From memory document: different-id*')
      expect(result.content[0].text).toContain('*Last updated: 2025-07-30T15:30:45Z*')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long section content', async () => {
      const longContent = 'A'.repeat(10000)
      const mockSection: MemorySection = {
        name: 'Long Section',
        content: longContent,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Long Section'
      })

      expect(result.content[0].text).toContain(longContent)
      expect(result.content[0].text).toContain('## Long Section')
    })

    it('should handle section name with leading/trailing whitespace', async () => {
      const mockSection: MemorySection = {
        name: '  Trimmed Section  ',
        content: 'content',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: '  Trimmed Section  '
      })

      expect(result.content[0].text).toContain('##   Trimmed Section  ')
    })

    it('should handle content with only newlines', async () => {
      const mockSection: MemorySection = {
        name: 'Newline Section',
        content: '\n\n\n',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Newline Section'
      })

      expect(result.content[0].text).toContain('## Newline Section')
      expect(result.content[0].text).toContain('\n\n\n')
      expect(result.content[0].text).not.toContain('(This section is empty)')
    })

    it('should handle Unicode characters in section name and content', async () => {
      const mockSection: MemorySection = {
        name: 'Sección Españ0la 🚀',
        content: 'Contenido con émojis 💫 y caracteres especiales àáâãäå',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Sección Españ0la 🚀'
      })

      expect(result.content[0].text).toContain('## Sección Españ0la 🚀')
      expect(result.content[0].text).toContain('Contenido con émojis 💫 y caracteres especiales àáâãäå')
    })

    it('should handle memory with missing metadata fields', async () => {
      const incompleteMemory: Memory = {
        metadata: {
          id: 'incomplete',
          created: '2025-07-30T12:00:00Z',
          updated: '2025-07-31T10:00:00Z',
          tags: []
          // status is optional and missing
        },
        content: 'content',
        filePath: '/path.md'
      }

      const mockSection: MemorySection = {
        name: 'Section',
        content: 'content',
        level: 2
      }

      vi.mocked(storageManager.readMemory).mockResolvedValue(incompleteMemory)
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'incomplete',
        section: 'Section'
      })

      expect(result.content[0].text).toContain('*From memory document: incomplete*')
      expect(result.content[0].text).toContain('*Last updated: 2025-07-31T10:00:00Z*')
    })

    it('should handle section with different heading levels', async () => {
      const mockSection: MemorySection = {
        name: 'Level 3 Section',
        content: 'content for level 3',
        level: 3
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Level 3 Section'
      })

      // The tool always formats as level 2 (##) regardless of original level
      expect(result.content[0].text).toContain('## Level 3 Section')
      expect(result.content[0].text).not.toContain('### Level 3 Section')
    })

    it('should handle case-sensitive section matching', async () => {
      // This tests that the tool uses the exact section name as returned by findSection
      const mockSection: MemorySection = {
        name: 'CaseSensitive Section',
        content: 'content',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'casesensitive section' // Different case
      })

      // Should use the exact name from the found section
      expect(result.content[0].text).toContain('## CaseSensitive Section')
    })

    it('should handle sections with numeric names', async () => {
      const mockSection: MemorySection = {
        name: '2025 Goals',
        content: 'Goals for the year 2025',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await getSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: '2025 Goals'
      })

      expect(result.content[0].text).toContain('## 2025 Goals')
      expect(result.content[0].text).toContain('Goals for the year 2025')
    })
  })

  describe('Parameter Types', () => {
    it('should handle GetSectionParams interface correctly', async () => {
      const mockSection: MemorySection = {
        name: 'Valid Section',
        content: 'valid content',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      // Test with explicit GetSectionParams structure
      const params = {
        memory_id: 'test-memory',
        section: 'Valid Section'
      }

      const result = await getSectionTool(storageManager, params)

      expect(result.content[0].text).toContain('## Valid Section')
      expect(result.content[0].text).toContain('valid content')
    })

    it('should handle extra properties in args object', async () => {
      const mockSection: MemorySection = {
        name: 'Test Section',
        content: 'content',
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      // Args with extra properties
      const argsWithExtra = {
        memory_id: 'test-memory',
        section: 'Test Section',
        extraProperty: 'should be ignored',
        anotherExtra: 42
      }

      const result = await getSectionTool(storageManager, argsWithExtra)

      expect(result.content[0].text).toContain('## Test Section')
      // Should work despite extra properties
    })
  })
})