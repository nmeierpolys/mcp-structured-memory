import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { updateSectionTool } from './updateSection.js'
import { StorageManager } from '../storage/StorageManager.js'
import { Memory } from '../types/memory.js'

// Mock the StorageManager
vi.mock('../storage/StorageManager.js', () => {
  class StorageManager {
    readMemory = vi.fn()
    findSection = vi.fn()
    updateSection = vi.fn()
  }
  return { StorageManager }
})

describe('updateSection Tool', () => {
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

## Existing Section
This is existing content.

## Another Section
More content here.`,
      filePath: '/test/path/test-memory.md'
    }

    vi.mocked(storageManager.readMemory).mockResolvedValue(mockMemory)
    vi.mocked(storageManager.updateSection).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Input Validation', () => {
    it('should throw error when memory_id is missing', async () => {
      await expect(
        updateSectionTool(storageManager, { section: 'test', content: 'content' })
      ).rejects.toThrow('memory_id, section, and content are required')
    })

    it('should throw error when section is missing', async () => {
      await expect(
        updateSectionTool(storageManager, { memory_id: 'test', content: 'content' })
      ).rejects.toThrow('memory_id, section, and content are required')
    })

    it('should throw error when content is missing', async () => {
      await expect(
        updateSectionTool(storageManager, { memory_id: 'test', section: 'test' })
      ).rejects.toThrow('memory_id, section, and content are required')
    })

    it('should allow empty string content', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue({
        name: 'Existing Section',
        content: 'existing content',
        level: 2
      })

      await updateSectionTool(storageManager, { 
        memory_id: 'test', 
        section: 'Existing Section', 
        content: '' 
      })

      expect(storageManager.updateSection).toHaveBeenCalledWith(
        'test', 'Existing Section', '', 'append'
      )
    })

    it('should throw error when memory document not found', async () => {
      vi.mocked(storageManager.readMemory).mockResolvedValue(null)

      await expect(
        updateSectionTool(storageManager, { 
          memory_id: 'nonexistent', 
          section: 'test', 
          content: 'content' 
        })
      ).rejects.toThrow("Memory document 'nonexistent' not found")
    })

    it('should validate mode parameter', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue({
        name: 'Test Section',
        content: 'existing content',
        level: 2
      })

      await expect(
        updateSectionTool(storageManager, { 
          memory_id: 'test', 
          section: 'Test Section', 
          content: 'content',
          mode: 'invalid' as any
        })
      ).rejects.toThrow('mode must be either "append" or "replace"')
    })
  })

  describe('Mode Handling', () => {
    beforeEach(() => {
      vi.mocked(storageManager.findSection).mockReturnValue({
        name: 'Test Section',
        content: 'existing content',
        level: 2
      })
    })

    it('should default to append mode when mode not specified', async () => {
      await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section',
        content: 'new content'
      })

      expect(storageManager.updateSection).toHaveBeenCalledWith(
        'test-memory', 'Test Section', 'new content', 'append'
      )
    })

    it('should use append mode when explicitly specified', async () => {
      await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section',
        content: 'new content',
        mode: 'append'
      })

      expect(storageManager.updateSection).toHaveBeenCalledWith(
        'test-memory', 'Test Section', 'new content', 'append'
      )
    })

    it('should use replace mode when specified', async () => {
      await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section',
        content: 'replacement content',
        mode: 'replace'
      })

      expect(storageManager.updateSection).toHaveBeenCalledWith(
        'test-memory', 'Test Section', 'replacement content', 'replace'
      )
    })
  })

  describe('Section Existence Detection', () => {
    it('should detect existing section', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue({
        name: 'Existing Section',
        content: 'current content',
        level: 2
      })

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Existing Section',
        content: 'new content'
      })

      expect(result.content[0].text).toContain('Appended content to section "Existing Section"')
    })

    it('should detect when section does not exist', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'New Section',
        content: 'new content'
      })

      expect(result.content[0].text).toContain('Created new section "New Section" with content')
    })

    it('should handle section name case sensitivity', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'EXISTING SECTION',
        content: 'content'
      })

      expect(storageManager.findSection).toHaveBeenCalledWith(
        mockMemory.content, 'EXISTING SECTION'
      )
    })
  })

  describe('Action Text Generation', () => {
    it('should generate correct action text for new section creation', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Brand New Section',
        content: 'some content'
      })

      expect(result.content[0].text).toContain('**Action**: Created new section "Brand New Section" with content')
    })

    it('should generate correct action text for appending to existing section', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue({
        name: 'Existing Section',
        content: 'old content',
        level: 2
      })

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Existing Section',
        content: 'additional content'
      })

      expect(result.content[0].text).toContain('**Action**: Appended content to section "Existing Section"')
    })

    it('should generate correct action text for replacing section content', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue({
        name: 'Existing Section',
        content: 'old content',
        level: 2
      })

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Existing Section',
        content: 'replacement content',
        mode: 'replace'
      })

      expect(result.content[0].text).toContain('**Action**: Replaced content in section "Existing Section"')
    })
  })

  describe('Content Statistics', () => {
    it('should count words correctly for simple content', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section',
        content: 'This is five words exactly'
      })

      expect(result.content[0].text).toContain('**Content Added**: 5 words, 1 lines')
    })

    it('should count words correctly for multi-line content', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const content = `Line one has four words
Line two has four words
Line three has four words`

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section',
        content: content
      })

      expect(result.content[0].text).toContain('**Content Added**: 15 words, 3 lines')
    })

    it('should handle empty content correctly', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section',
        content: ''
      })

      expect(result.content[0].text).toContain('**Content Added**: 0 words, 1 lines')
    })

    it('should handle content with only whitespace', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section',
        content: '   \n   \n   '
      })

      expect(result.content[0].text).toContain('**Content Added**: 0 words, 3 lines')
    })

    it('should filter out empty words when counting', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section',
        content: 'word1   word2    word3'
      })

      expect(result.content[0].text).toContain('**Content Added**: 3 words, 1 lines')
    })

    it('should count lines correctly for content with trailing newlines', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section',
        content: 'Line 1\nLine 2\n'
      })

      expect(result.content[0].text).toContain('**Content Added**: 4 words, 3 lines')
    })
  })

  describe('Response Format', () => {
    it('should include all required response fields', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue({
        name: 'Test Section',
        content: 'existing',
        level: 2
      })

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section',
        content: 'New content here',
        mode: 'replace'
      })

      expect(result.content[0].text).toContain("Successfully updated memory document 'test-memory':")
      expect(result.content[0].text).toContain('**Action**: Replaced content in section "Test Section"')
      expect(result.content[0].text).toContain('**Content Added**: 3 words, 1 lines')
      expect(result.content[0].text).toContain('**Mode**: replace')
      expect(result.content[0].text).toContain('The section has been updated')
      expect(result.content[0].text).toContain('You can view it using the get_section tool')
    })

    it('should have correct response structure', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'New Section',
        content: 'content'
      })

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: expect.stringContaining('Successfully updated memory document')
        }]
      })
    })

    it('should include usage hints in response', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test',
        content: 'content'
      })

      expect(result.content[0].text).toContain('get_section tool')
      expect(result.content[0].text).toContain('get_memory_summary')
    })
  })

  describe('Storage Manager Integration', () => {
    it('should call readMemory with correct memory_id', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      await updateSectionTool(storageManager, {
        memory_id: 'specific-memory-id',
        section: 'Test Section',
        content: 'content'
      })

      expect(storageManager.readMemory).toHaveBeenCalledWith('specific-memory-id')
    })

    it('should call findSection with correct parameters', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Target Section',
        content: 'content'
      })

      expect(storageManager.findSection).toHaveBeenCalledWith(
        mockMemory.content, 'Target Section'
      )
    })

    it('should call updateSection with correct parameters', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Target Section',
        content: 'new content',
        mode: 'replace'
      })

      expect(storageManager.updateSection).toHaveBeenCalledWith(
        'test-memory', 'Target Section', 'new content', 'replace'
      )
    })

    it('should handle storage manager read errors', async () => {
      vi.mocked(storageManager.readMemory).mockRejectedValue(new Error('Read failed'))

      await expect(
        updateSectionTool(storageManager, {
          memory_id: 'test-memory',
          section: 'section',
          content: 'content'
        })
      ).rejects.toThrow('Read failed')
    })

    it('should handle storage manager update errors', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)
      vi.mocked(storageManager.updateSection).mockRejectedValue(new Error('Update failed'))

      await expect(
        updateSectionTool(storageManager, {
          memory_id: 'test-memory',
          section: 'section',
          content: 'content'
        })
      ).rejects.toThrow('Update failed')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long section names', async () => {
      const longSectionName = 'A'.repeat(200)
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: longSectionName,
        content: 'content'
      })

      expect(storageManager.findSection).toHaveBeenCalledWith(
        mockMemory.content, longSectionName
      )
      expect(result.content[0].text).toContain(`Created new section "${longSectionName}" with content`)
    })

    it('should handle very long content', async () => {
      const longContent = 'word '.repeat(10000).trim()
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section',
        content: longContent
      })

      expect(storageManager.updateSection).toHaveBeenCalledWith(
        'test-memory', 'Test Section', longContent, 'append'
      )
      expect(result.content[0].text).toContain('**Content Added**: 10000 words, 1 lines')
    })

    it('should handle special characters in section names', async () => {
      const specialSectionName = 'Section: #1 (API & Database) - Notes!'
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: specialSectionName,
        content: 'content'
      })

      expect(storageManager.findSection).toHaveBeenCalledWith(
        mockMemory.content, specialSectionName
      )
    })

    it('should handle content with markdown formatting', async () => {
      const markdownContent = `# This is a heading
**Bold text** and *italic text*
- List item 1
- List item 2

> Blockquote
\`\`\`javascript
console.log('code block');
\`\`\``

      vi.mocked(storageManager.findSection).mockReturnValue(null)

      await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Markdown Section',
        content: markdownContent
      })

      expect(storageManager.updateSection).toHaveBeenCalledWith(
        'test-memory', 'Markdown Section', markdownContent, 'append'
      )
    })

    it('should handle content with unicode characters', async () => {
      const unicodeContent = 'Café ☕ Notes 🚀 with émojis and ñ characters'
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Unicode Section',
        content: unicodeContent
      })

      expect(storageManager.updateSection).toHaveBeenCalledWith(
        'test-memory', 'Unicode Section', unicodeContent, 'append'
      )
      expect(result.content[0].text).toContain('**Content Added**: 9 words, 1 lines')
    })

    it('should handle section names with leading/trailing whitespace', async () => {
      const sectionName = '  Test Section  '
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: sectionName,
        content: 'content'
      })

      expect(storageManager.findSection).toHaveBeenCalledWith(
        mockMemory.content, sectionName
      )
    })

    it('should handle content with only newlines', async () => {
      const newlineContent = '\n\n\n\n\n'
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      const result = await updateSectionTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Test Section',
        content: newlineContent
      })

      expect(result.content[0].text).toContain('**Content Added**: 0 words, 6 lines')
    })
  })
})
