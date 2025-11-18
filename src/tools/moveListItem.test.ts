import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { moveListItemTool } from './moveListItem.js'
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

describe('moveListItem Tool', () => {
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

## Active Projects
### Project Alpha
- **Status**: In Progress
- **Priority**: High
- **Description**: Main project work

### Project Beta
- **Status**: Review
- **Priority**: Medium

## Completed Projects
### Project Gamma
- **Status**: Done
- **Completed**: 2025-07-20

## Archive
Old completed items go here.`,
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
        moveListItemTool(storageManager, { 
          from_section: 'Active Projects', 
          to_section: 'Completed Projects',
          item_identifier: 'Project Alpha'
        })
      ).rejects.toThrow('memory_id, from_section, to_section, and item_identifier are required')
    })

    it('should throw error when from_section is missing', async () => {
      await expect(
        moveListItemTool(storageManager, { 
          memory_id: 'test',
          to_section: 'Completed Projects',
          item_identifier: 'Project Alpha'
        })
      ).rejects.toThrow('memory_id, from_section, to_section, and item_identifier are required')
    })

    it('should throw error when to_section is missing', async () => {
      await expect(
        moveListItemTool(storageManager, { 
          memory_id: 'test',
          from_section: 'Active Projects',
          item_identifier: 'Project Alpha'
        })
      ).rejects.toThrow('memory_id, from_section, to_section, and item_identifier are required')
    })

    it('should throw error when item_identifier is missing', async () => {
      await expect(
        moveListItemTool(storageManager, { 
          memory_id: 'test',
          from_section: 'Active Projects',
          to_section: 'Completed Projects'
        })
      ).rejects.toThrow('memory_id, from_section, to_section, and item_identifier are required')
    })

    it('should throw error when memory document not found', async () => {
      vi.mocked(storageManager.readMemory).mockResolvedValue(null)

      await expect(
        moveListItemTool(storageManager, { 
          memory_id: 'nonexistent', 
          from_section: 'Active Projects',
          to_section: 'Completed Projects',
          item_identifier: 'Project Alpha'
        })
      ).rejects.toThrow("Memory document 'nonexistent' not found")
    })

    it('should throw error when from_section not found', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      await expect(
        moveListItemTool(storageManager, { 
          memory_id: 'test-memory', 
          from_section: 'Nonexistent Section',
          to_section: 'Completed Projects',
          item_identifier: 'Project Alpha'
        })
      ).rejects.toThrow("Source section 'Nonexistent Section' not found in memory document 'test-memory'")
    })

    it('should throw error when item not found in from_section', async () => {
      const mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValueOnce(mockFromSection)

      await expect(
        moveListItemTool(storageManager, { 
          memory_id: 'test-memory', 
          from_section: 'Active Projects',
          to_section: 'Completed Projects',
          item_identifier: 'Nonexistent Project'
        })
      ).rejects.toThrow("Item 'Nonexistent Project' not found in section 'Active Projects'")
    })
  })

  describe('Section Existence Handling', () => {
    let mockFromSection: any

    beforeEach(() => {
      mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress
- **Priority**: High

### Project Beta
- **Status**: Review`,
        level: 2
      }
    })

    it('should handle moving to existing section', async () => {
      const mockToSection = {
        name: 'Completed Projects',
        content: `### Project Gamma
- **Status**: Done`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(mockToSection)

      const result = await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      expect(result.content[0].text).toContain('**Destination Section**: Updated existing section')
    })

    it('should handle moving to new section', async () => {
      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null) // to_section doesn't exist

      const result = await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'New Section',
        item_identifier: 'Project Alpha'
      })

      expect(result.content[0].text).toContain('**Destination Section**: Created new section')
    })
  })

  describe('Item Extraction Logic', () => {
    it('should extract item by exact heading match', async () => {
      const mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress
- **Priority**: High

### Project Beta
- **Status**: Review`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      expect(storageManager.updateSection).toHaveBeenCalledTimes(2)
    })

    it('should extract item by partial text match', async () => {
      const mockFromSection = {
        name: 'Active Projects',
        content: `### Main API Development Project
- **Status**: In Progress
- **Priority**: High`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'API Development'
      })

      expect(storageManager.updateSection).toHaveBeenCalledTimes(2)
    })

    it('should perform case-insensitive item search', async () => {
      const mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'project alpha'
      })

      expect(storageManager.updateSection).toHaveBeenCalledTimes(2)
    })

    it('should extract complete item including all associated content', async () => {
      const mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress
- **Priority**: High
- **Description**: Main project work
- **Notes**: Additional details

### Project Beta
- **Status**: Review`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      // Check that the destination section gets the complete item
      const destinationCall = vi.mocked(storageManager.updateSection).mock.calls[1]
      const destinationContent = destinationCall[2]
      
      expect(destinationContent).toContain('### Project Alpha')
      expect(destinationContent).toContain('- **Status**: In Progress')
      expect(destinationContent).toContain('- **Priority**: High')
      expect(destinationContent).toContain('- **Description**: Main project work')
      expect(destinationContent).toContain('- **Notes**: Additional details')
    })
  })

  describe('Item Boundary Detection', () => {
    it('should correctly identify item boundaries with next heading', async () => {
      const mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress
- **Priority**: High

### Project Beta
- **Status**: Review
- **Priority**: Low`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      // Check that source section still has Project Beta
      const sourceCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const sourceContent = sourceCall[2]
      
      expect(sourceContent).toContain('### Project Beta')
      expect(sourceContent).not.toContain('### Project Alpha')
    })

    it('should handle item at end of section', async () => {
      const mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress

### Project Beta
- **Status**: Review
- **Priority**: Low
- **Notes**: Final project in section`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Beta'
      })

      // Check that source section still has Project Alpha
      const sourceCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const sourceContent = sourceCall[2]
      
      expect(sourceContent).toContain('### Project Alpha')
      expect(sourceContent).not.toContain('### Project Beta')
    })

    it('should handle single item in section', async () => {
      const mockFromSection = {
        name: 'Active Projects',
        content: `### Only Project
- **Status**: In Progress
- **Priority**: High`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Only Project'
      })

      // Check that source section is now empty (or nearly empty)
      const sourceCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const sourceContent = sourceCall[2]
      
      expect(sourceContent).not.toContain('### Only Project')
    })

    it('should handle empty lines between items', async () => {
      const mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress


### Project Beta
- **Status**: Review`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      expect(storageManager.updateSection).toHaveBeenCalledTimes(2)
    })
  })

  describe('Reason Handling', () => {
    let mockFromSection: any

    beforeEach(() => {
      mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)
    })

    it('should add reason as comment when provided', async () => {
      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha',
        reason: 'Project completed successfully'
      })

      const destinationCall = vi.mocked(storageManager.updateSection).mock.calls[1]
      const destinationContent = destinationCall[2]
      
      expect(destinationContent).toContain('<!-- Moved from Active Projects: Project completed successfully -->')
    })

    it('should not add comment when reason not provided', async () => {
      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      const destinationCall = vi.mocked(storageManager.updateSection).mock.calls[1]
      const destinationContent = destinationCall[2]
      
      expect(destinationContent).not.toContain('<!-- Moved from')
    })

    it('should handle empty reason string', async () => {
      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha',
        reason: ''
      })

      const destinationCall = vi.mocked(storageManager.updateSection).mock.calls[1]
      const destinationContent = destinationCall[2]
      
      expect(destinationContent).not.toContain('<!-- Moved from')
    })

    it('should handle reason with special characters', async () => {
      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha',
        reason: 'Completed early & under budget! (Great work)'
      })

      const destinationCall = vi.mocked(storageManager.updateSection).mock.calls[1]
      const destinationContent = destinationCall[2]
      
      expect(destinationContent).toContain('<!-- Moved from Active Projects: Completed early & under budget! (Great work) -->')
    })
  })

  describe('Destination Section Handling', () => {
    let mockFromSection: any

    beforeEach(() => {
      mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }
    })

    it('should append to existing destination section', async () => {
      const mockToSection = {
        name: 'Completed Projects',
        content: `### Existing Project
- **Status**: Done`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(mockToSection)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      const destinationCall = vi.mocked(storageManager.updateSection).mock.calls[1]
      const destinationContent = destinationCall[2]
      
      expect(destinationContent).toContain('### Existing Project')
      expect(destinationContent).toContain('### Project Alpha')
    })

    it('should create new destination section when it does not exist', async () => {
      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Brand New Section',
        item_identifier: 'Project Alpha'
      })

      const destinationCall = vi.mocked(storageManager.updateSection).mock.calls[1]
      const destinationContent = destinationCall[2]
      
      expect(destinationContent).toContain('### Project Alpha')
      expect(destinationContent).not.toContain('### Existing Project')
    })

    it('should add empty line before appended item in existing section', async () => {
      const mockToSection = {
        name: 'Completed Projects',
        content: `### Existing Project
- **Status**: Done`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(mockToSection)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      const destinationCall = vi.mocked(storageManager.updateSection).mock.calls[1]
      const destinationContent = destinationCall[2]
      const lines = destinationContent.split('\n')
      
      // Should have an empty line before the moved item
      expect(lines).toContain('')
    })
  })

  describe('Response Format', () => {
    let mockFromSection: any

    beforeEach(() => {
      mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)
    })

    it('should return success response with correct format', async () => {
      const result = await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: expect.stringContaining("Successfully moved item 'Project Alpha' from 'Active Projects' to 'Completed Projects' in memory document 'test-memory':")
        }]
      })

      expect(result.content[0].text).toContain('**Item**: Project Alpha')
      expect(result.content[0].text).toContain('**From**: Active Projects')
      expect(result.content[0].text).toContain('**To**: Completed Projects')
      expect(result.content[0].text).toContain('**Destination Section**: Created new section')
      expect(result.content[0].text).toContain('The item has been moved successfully')
      expect(result.content[0].text).toContain('You can view both sections using the get_section tool')
    })

    it('should include reason in response when provided', async () => {
      const result = await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha',
        reason: 'Project completed successfully'
      })

      expect(result.content[0].text).toContain('**Reason**: Project completed successfully')
    })

    it('should not include reason in response when not provided', async () => {
      const result = await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      expect(result.content[0].text).not.toContain('**Reason**:')
    })

    it('should indicate correct destination section status for new section', async () => {
      const testFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      // Mock to return null for destination section (doesn't exist)
      vi.mocked(storageManager.readMemory).mockResolvedValue(mockMemory)
      vi.mocked(storageManager.updateSection).mockResolvedValue(undefined)
      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(testFromSection)
        .mockReturnValueOnce(null)

      const result = await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'New Completed Projects',
        item_identifier: 'Project Alpha'
      })

      expect(result.content[0].text).toContain('**Destination Section**: Created new section')
    })
  })

  describe('Storage Manager Integration', () => {
    let mockFromSection: any

    beforeEach(() => {
      mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress

### Project Beta
- **Status**: Review`,
        level: 2
      }
    })

    it('should call updateSection twice with correct parameters', async () => {
      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      expect(storageManager.updateSection).toHaveBeenCalledTimes(2)
      
      // First call should update source section (remove item)
      expect(storageManager.updateSection).toHaveBeenNthCalledWith(1,
        'test-memory',
        'Active Projects',
        expect.stringContaining('### Project Beta'),
        'replace'
      )

      // Second call should update destination section (add item)
      expect(storageManager.updateSection).toHaveBeenNthCalledWith(2,
        'test-memory',
        'Completed Projects',
        expect.stringContaining('### Project Alpha'),
        'replace'
      )
    })

    it('should handle storage manager errors gracefully', async () => {
      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)
      vi.mocked(storageManager.updateSection).mockRejectedValue(new Error('Update failed'))

      await expect(
        moveListItemTool(storageManager, {
          memory_id: 'test-memory',
          from_section: 'Active Projects',
          to_section: 'Completed Projects',
          item_identifier: 'Project Alpha'
        })
      ).rejects.toThrow('Update failed')
    })
  })

  describe('Edge Cases', () => {
    it('should handle moving item to same section', async () => {
      const mockSection = {
        name: 'Active Projects',
        content: `### Project Alpha
- **Status**: In Progress

### Project Beta
- **Status**: Review`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockSection)
        .mockReturnValueOnce(mockSection)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Active Projects',
        item_identifier: 'Project Alpha'
      })

      expect(storageManager.updateSection).toHaveBeenCalledTimes(2)
    })

    it('should handle special characters in item identifier', async () => {
      const mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha (API & Database)
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha (API & Database)'
      })

      expect(storageManager.updateSection).toHaveBeenCalledTimes(2)
    })

    it('should handle very long section names', async () => {
      const longSectionName = 'A'.repeat(200)
      const mockFromSection = {
        name: longSectionName,
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: longSectionName,
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      expect(storageManager.updateSection).toHaveBeenCalledTimes(2)
    })

    it('should handle item with no fields (just heading)', async () => {
      const mockFromSection = {
        name: 'Active Projects',
        content: `### Project Alpha

### Project Beta
- **Status**: Review`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)  
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      const destinationCall = vi.mocked(storageManager.updateSection).mock.calls[1]
      const destinationContent = destinationCall[2]
      
      expect(destinationContent).toContain('### Project Alpha')
    })

    it('should handle section with mixed content and formatting', async () => {
      const mockFromSection = {
        name: 'Active Projects',
        content: `Some introductory text

### Project Alpha
- **Status**: In Progress
- **Priority**: High

Some text between projects

### Project Beta
- **Status**: Review`,
        level: 2
      }

      vi.mocked(storageManager.findSection)
        .mockReturnValueOnce(mockFromSection)
        .mockReturnValueOnce(null)

      await moveListItemTool(storageManager, {
        memory_id: 'test-memory',
        from_section: 'Active Projects',
        to_section: 'Completed Projects',
        item_identifier: 'Project Alpha'
      })

      expect(storageManager.updateSection).toHaveBeenCalledTimes(2)
      
      // Verify the moved item retains its structure
      const destinationCall = vi.mocked(storageManager.updateSection).mock.calls[1]
      const destinationContent = destinationCall[2]
      
      expect(destinationContent).toContain('### Project Alpha')
      expect(destinationContent).toContain('- **Status**: In Progress')
      expect(destinationContent).toContain('- **Priority**: High')
    })
  })
})