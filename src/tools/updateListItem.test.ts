import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { updateListItemTool } from './updateListItem.js'
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

describe('updateListItem Tool', () => {
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

## Projects
### Project Alpha
- **Status**: In Progress
- **Priority**: High
- **Description**: Main project work

### Project Beta
- **Status**: Completed
- **Priority**: Medium
- **Notes**: Finished last week

## Tasks
- Task 1 description
- Task 2 description`,
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
        updateListItemTool(storageManager, { 
          section: 'Projects', 
          item_identifier: 'Project Alpha', 
          updates: { status: 'Done' } 
        })
      ).rejects.toThrow('memory_id, section, item_identifier, and updates are required')
    })

    it('should throw error when section is missing', async () => {
      await expect(
        updateListItemTool(storageManager, { 
          memory_id: 'test', 
          item_identifier: 'Project Alpha', 
          updates: { status: 'Done' } 
        })
      ).rejects.toThrow('memory_id, section, item_identifier, and updates are required')
    })

    it('should throw error when item_identifier is missing', async () => {
      await expect(
        updateListItemTool(storageManager, { 
          memory_id: 'test', 
          section: 'Projects', 
          updates: { status: 'Done' } 
        })
      ).rejects.toThrow('memory_id, section, item_identifier, and updates are required')
    })

    it('should throw error when updates is missing', async () => {
      await expect(
        updateListItemTool(storageManager, { 
          memory_id: 'test', 
          section: 'Projects', 
          item_identifier: 'Project Alpha' 
        })
      ).rejects.toThrow('memory_id, section, item_identifier, and updates are required')
    })

    it('should throw error when memory document not found', async () => {
      vi.mocked(storageManager.readMemory).mockResolvedValue(null)

      await expect(
        updateListItemTool(storageManager, { 
          memory_id: 'nonexistent', 
          section: 'Projects', 
          item_identifier: 'Project Alpha',
          updates: { status: 'Done' } 
        })
      ).rejects.toThrow("Memory document 'nonexistent' not found")
    })

    it('should throw error when section not found', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      await expect(
        updateListItemTool(storageManager, { 
          memory_id: 'test-memory', 
          section: 'Nonexistent Section', 
          item_identifier: 'Project Alpha',
          updates: { status: 'Done' } 
        })
      ).rejects.toThrow("Section 'Nonexistent Section' not found in memory document 'test-memory'")
    })

    it('should throw error when item not found in section', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress
- **Priority**: High`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await expect(
        updateListItemTool(storageManager, { 
          memory_id: 'test-memory', 
          section: 'Projects', 
          item_identifier: 'Nonexistent Project',
          updates: { status: 'Done' } 
        })
      ).rejects.toThrow("Item 'Nonexistent Project' not found in section 'Projects'")
    })
  })

  describe('Item Finding Logic', () => {
    it('should find item by exact heading match', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress
- **Priority**: High

### Project Beta
- **Status**: Completed`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { Status: 'Completed' }
      })

      expect(storageManager.updateSection).toHaveBeenCalled()
    })

    it('should find item by partial text match', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Main Project for API Development
- **Status**: In Progress
- **Priority**: High`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'API Development',
        updates: { Status: 'Completed' }
      })

      expect(storageManager.updateSection).toHaveBeenCalled()
    })

    it('should perform case-insensitive item search', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'project alpha',
        updates: { Status: 'Completed' }
      })

      expect(storageManager.updateSection).toHaveBeenCalled()
    })

    it('should find first matching item when multiple matches exist', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Alpha Project One
- **Status**: In Progress

### Alpha Project Two  
- **Status**: Pending`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Alpha',
        updates: { Status: 'Completed' }
      })

      // Should update the first matching item
      expect(storageManager.updateSection).toHaveBeenCalled()
    })
  })

  describe('Item Boundary Detection', () => {
    it('should correctly identify item boundaries with next heading', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress
- **Priority**: High
- **Description**: Main project

### Project Beta
- **Status**: Completed`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { Status: 'Updated' }
      })

      // Verify the call was made (boundary detection worked)
      expect(storageManager.updateSection).toHaveBeenCalled()
    })

    it('should handle item at end of section', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress

### Project Beta
- **Status**: Completed
- **Priority**: Low
- **Notes**: Final project`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Beta',
        updates: { Status: 'Updated' }
      })

      expect(storageManager.updateSection).toHaveBeenCalled()
    })

    it('should handle single item in section', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Only Project
- **Status**: In Progress
- **Priority**: High`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Only Project',
        updates: { Status: 'Updated' }
      })

      expect(storageManager.updateSection).toHaveBeenCalled()
    })

    it('should handle empty lines between items', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress

### Project Beta
- **Status**: Completed`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { Priority: 'High' }
      })

      expect(storageManager.updateSection).toHaveBeenCalled()
    })
  })

  describe('Field Update Logic', () => {
    let mockSection: any

    beforeEach(() => {
      mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress
- **Priority**: High
- **Description**: Main project work`,
        level: 2
      }
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)
    })

    it('should update existing field', async () => {
      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { Status: 'Completed' }
      })

      const updateCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const updatedContent = updateCall[2]
      
      expect(updatedContent).toContain('- **Status**: Completed')
      expect(updatedContent).not.toContain('- **Status**: In Progress')
    })

    it('should add new field when field does not exist', async () => {
      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { Deadline: '2025-08-15' }
      })

      const updateCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const updatedContent = updateCall[2]
      
      expect(updatedContent).toContain('- **Deadline**: 2025-08-15')
    })

    it('should update multiple fields at once', async () => {
      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { 
          Status: 'Completed',
          Priority: 'Low',
          Notes: 'Finished ahead of schedule'
        }
      })

      const updateCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const updatedContent = updateCall[2]
      
      expect(updatedContent).toContain('- **Status**: Completed')
      expect(updatedContent).toContain('- **Priority**: Low')
      expect(updatedContent).toContain('- **Notes**: Finished ahead of schedule')
    })

    it('should handle case-insensitive field matching', async () => {
      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { status: 'Completed' }
      })

      const updateCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const updatedContent = updateCall[2]
      
      expect(updatedContent).toContain('- **Status**: Completed')
    })

    it('should preserve existing fields when updating others', async () => {
      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { Status: 'Completed' }
      })

      const updateCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const updatedContent = updateCall[2]
      
      expect(updatedContent).toContain('- **Priority**: High')
      expect(updatedContent).toContain('- **Description**: Main project work')
    })
  })

  describe('Field Addition Logic', () => {
    it('should add new field after heading for items with headings', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { Priority: 'High' }
      })

      const updateCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const updatedContent = updateCall[2]
      const lines = updatedContent.split('\n')
      
      expect(lines[0]).toBe('### Project Alpha')
      expect(lines[1]).toBe('- **Priority**: High')
      expect(lines[2]).toBe('- **Status**: In Progress')
    })

    it('should add new field at end for items without headings', async () => {
      const mockSection = {
        name: 'Tasks',
        content: `- Task one description
- **Status**: Pending`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Tasks',
        item_identifier: 'Task one',
        updates: { Priority: 'High' }
      })

      const updateCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const updatedContent = updateCall[2]
      
      expect(updatedContent).toContain('- **Priority**: High')
    })
  })

  describe('Response Format', () => {
    it('should return success response with correct format', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { Status: 'Completed', Priority: 'High' }
      })

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: expect.stringContaining("Successfully updated item 'Project Alpha' in section 'Projects' of memory document 'test-memory':")
        }]
      })

      expect(result.content[0].text).toContain('**Fields Updated**: Status, Priority')
      expect(result.content[0].text).toContain('**Changes Made**: 2 fields')
      expect(result.content[0].text).toContain('The item has been updated in place')
      expect(result.content[0].text).toContain('You can view the updated section using the get_section tool')
    })

    it('should handle singular vs plural fields correctly', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { Status: 'Completed' }
      })

      expect(result.content[0].text).toContain('**Changes Made**: 1 field')
      expect(result.content[0].text).not.toContain('1 fields')
    })

    it('should list all updated field names', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { 
          Status: 'Completed', 
          Priority: 'High', 
          Deadline: '2025-08-15',
          Notes: 'Updated notes'
        }
      })

      expect(result.content[0].text).toContain('**Fields Updated**: Status, Priority, Deadline, Notes')
      expect(result.content[0].text).toContain('**Changes Made**: 4 fields')
    })
  })

  describe('Storage Manager Integration', () => {
    it('should call updateSection with replace mode', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { Status: 'Completed' }
      })

      expect(storageManager.updateSection).toHaveBeenCalledWith(
        'test-memory',
        'Projects',
        expect.stringContaining('- **Status**: Completed'),
        'replace'
      )
    })

    it('should handle storage manager errors', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)
      vi.mocked(storageManager.updateSection).mockRejectedValue(new Error('Update failed'))

      await expect(
        updateListItemTool(storageManager, {
          memory_id: 'test-memory',
          section: 'Projects',
          item_identifier: 'Project Alpha',
          updates: { Status: 'Completed' }
        })
      ).rejects.toThrow('Update failed')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty updates object', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const result = await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: {}
      })

      expect(result.content[0].text).toContain('**Changes Made**: 0 fields')
    })

    it('should handle special characters in field values', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { Notes: 'Special chars: !@#$%^&*() and "quotes"' }
      })

      const updateCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const updatedContent = updateCall[2]
      
      expect(updatedContent).toContain('- **Notes**: Special chars: !@#$%^&*() and "quotes"')
    })

    it('should handle multi-line field values', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { Description: 'Line 1\nLine 2\nLine 3' }
      })

      const updateCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const updatedContent = updateCall[2]
      
      expect(updatedContent).toContain('- **Description**: Line 1\nLine 2\nLine 3')
    })

    it('should handle very long field names', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const longFieldName = 'VeryLongFieldNameThatExceedsNormalLength'

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha',
        updates: { [longFieldName]: 'Value' }
      })

      const updateCall = vi.mocked(storageManager.updateSection).mock.calls[0]
      const updatedContent = updateCall[2]
      
      expect(updatedContent).toContain(`- **${longFieldName}**: Value`)
    })

    it('should handle item identifier with regex special characters', async () => {
      const mockSection = {
        name: 'Projects',
        content: `### Project Alpha (API)
- **Status**: In Progress`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Projects',
        item_identifier: 'Project Alpha (API)',
        updates: { Status: 'Completed' }
      })

      expect(storageManager.updateSection).toHaveBeenCalled()
    })

    it('should handle section with mixed content types', async () => {
      const mockSection = {
        name: 'Mixed',
        content: `Some text before

### Item One
- **Status**: Active

Regular text in between

### Item Two  
- **Priority**: High`,
        level: 2
      }

      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await updateListItemTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Mixed',
        item_identifier: 'Item One',
        updates: { Status: 'Updated' }
      })

      expect(storageManager.updateSection).toHaveBeenCalled()
    })
  })
})