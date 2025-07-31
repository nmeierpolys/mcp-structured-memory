import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMemoryTool } from './createMemory.js'
import { StorageManager } from '../storage/StorageManager.js'
import { Memory } from '../types/memory.js'

// Mock the StorageManager
vi.mock('../storage/StorageManager.js', () => {
  return {
    StorageManager: vi.fn().mockImplementation(() => ({
      readMemory: vi.fn(),
      writeMemory: vi.fn()
    }))
  }
})

describe('createMemory Tool', () => {
  let storageManager: StorageManager

  beforeEach(() => {
    storageManager = new StorageManager()
    vi.mocked(storageManager.readMemory).mockResolvedValue(null)
    vi.mocked(storageManager.writeMemory).mockResolvedValue(undefined)
    
    // Reset environment variable
    delete process.env.MEMORY_STORAGE_PATH
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Input Validation', () => {
    it('should throw error when name is missing', async () => {
      await expect(
        createMemoryTool(storageManager, {})
      ).rejects.toThrow('Memory document name is required')
    })

    it('should throw error when name is empty string', async () => {
      await expect(
        createMemoryTool(storageManager, { name: '' })
      ).rejects.toThrow('Memory document name is required')
    })

    it('should throw error when name contains only special characters', async () => {
      await expect(
        createMemoryTool(storageManager, { name: '!@#$%^&*()' })
      ).rejects.toThrow('Name must contain at least some alphanumeric characters')
    })

    it('should create memory with dash ID when name contains only whitespace', async () => {
      await createMemoryTool(storageManager, { name: '   ' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            id: '-'
          })
        })
      )
    })

    it('should throw error when memory already exists', async () => {
      const existingMemory: Memory = {
        metadata: {
          id: 'test-memory',
          created: '2025-07-30T12:00:00Z',
          updated: '2025-07-31T10:00:00Z',
          status: 'active',
          tags: []
        },
        content: '# Test Memory',
        filePath: '/test/path/test-memory.md'
      }

      vi.mocked(storageManager.readMemory).mockResolvedValue(existingMemory)

      await expect(
        createMemoryTool(storageManager, { name: 'Test Memory' })
      ).rejects.toThrow("Memory document with ID 'test-memory' already exists")
    })
  })

  describe('Memory ID Generation', () => {
    it('should generate correct ID from simple name', async () => {
      await createMemoryTool(storageManager, { name: 'My Project' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            id: 'my-project'
          })
        })
      )
    })

    it('should sanitize special characters from name', async () => {
      await createMemoryTool(storageManager, { name: 'Project #1: API & Database!' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            id: 'project-1-api-database'
          })
        })
      )
    })

    it('should handle multiple consecutive spaces and dashes', async () => {
      await createMemoryTool(storageManager, { name: 'My   Project---Notes' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            id: 'my-project-notes'
          })
        })
      )
    })

    it('should handle leading and trailing whitespace', async () => {
      await createMemoryTool(storageManager, { name: '  Test Memory  ' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            id: '-test-memory-'
          })
        })
      )
    })

    it('should convert uppercase to lowercase', async () => {
      await createMemoryTool(storageManager, { name: 'PROJECT NOTES' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            id: 'project-notes'
          })
        })
      )
    })

    it('should preserve valid alphanumeric characters and numbers', async () => {
      await createMemoryTool(storageManager, { name: 'Project123 Notes456' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            id: 'project123-notes456'
          })
        })
      )
    })
  })

  describe('Memory Content Generation', () => {
    it('should create memory without initial context', async () => {
      const result = await createMemoryTool(storageManager, { name: 'Test Memory' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          content: `# Test Memory

## Notes

[Add your notes and organize into sections as needed]`
        })
      )
    })

    it('should create memory with initial context', async () => {
      const result = await createMemoryTool(storageManager, {
        name: 'Project Notes',
        initial_context: 'This is a project about API development.'
      })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          content: `# Project Notes

## Context

This is a project about API development.

## Notes

[Add your notes and organize into sections as needed]`
        })
      )
    })

    it('should handle multi-line initial context', async () => {
      const context = `This is line 1
This is line 2
This is line 3`

      await createMemoryTool(storageManager, {
        name: 'Multi Line Test',
        initial_context: context
      })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          content: `# Multi Line Test

## Context

${context}

## Notes

[Add your notes and organize into sections as needed]`
        })
      )
    })

    it('should handle empty initial context', async () => {
      await createMemoryTool(storageManager, {
        name: 'Test',
        initial_context: ''
      })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          content: `# Test

## Notes

[Add your notes and organize into sections as needed]`
        })
      )
    })
  })

  describe('Memory Metadata Generation', () => {
    it('should generate correct metadata structure', async () => {
      const beforeTime = new Date().toISOString()
      
      await createMemoryTool(storageManager, { name: 'Test Memory' })
      
      const afterTime = new Date().toISOString()

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            id: 'test-memory',
            created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
            updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
            tags: [],
            status: 'active'
          }
        })
      )

      const call = vi.mocked(storageManager.writeMemory).mock.calls[0][0]
      const createdTime = call.metadata.created
      const updatedTime = call.metadata.updated
      
      expect(createdTime).toEqual(updatedTime)
      expect(createdTime >= beforeTime).toBe(true)
      expect(createdTime <= afterTime).toBe(true)
    })

    it('should set empty file path initially', async () => {
      await createMemoryTool(storageManager, { name: 'Test' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          filePath: ''
        })
      )
    })

    it('should initialize with empty tags array', async () => {
      await createMemoryTool(storageManager, { name: 'Test' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            tags: []
          })
        })
      )
    })

    it('should set status to active', async () => {
      await createMemoryTool(storageManager, { name: 'Test' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            status: 'active'
          })
        })
      )
    })
  })

  describe('Response Format', () => {
    it('should return success response without initial context', async () => {
      const result = await createMemoryTool(storageManager, { name: 'Test Memory' })

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: expect.stringContaining('Successfully created memory document: "Test Memory"')
        }]
      })

      expect(result.content[0].text).toContain('Memory ID: test-memory')
      expect(result.content[0].text).toContain('The memory document is ready for you to organize')
      expect(result.content[0].text).not.toContain('Initial context has been added')
    })

    it('should return success response with initial context', async () => {
      const result = await createMemoryTool(storageManager, {
        name: 'Project Notes',
        initial_context: 'Some context'
      })

      expect(result.content[0].text).toContain('Successfully created memory document: "Project Notes"')
      expect(result.content[0].text).toContain('Memory ID: project-notes')
      expect(result.content[0].text).toContain('Initial context has been added to get you started.')
    })

    it('should include usage instructions', async () => {
      const result = await createMemoryTool(storageManager, { name: 'Test' })

      expect(result.content[0].text).toContain('You can:')
      expect(result.content[0].text).toContain('Add items to any section using natural language')
      expect(result.content[0].text).toContain('Create new sections by adding content to them')
      expect(result.content[0].text).toContain('Edit the file directly in any text editor')
      expect(result.content[0].text).toContain('Start by saying something like "Add [item] to my [section name]"')
    })
  })

  describe('Storage Path Handling', () => {
    it('should use default macOS path when no environment variable set', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' })
      
      const result = await createMemoryTool(storageManager, { name: 'Test' })

      expect(result.content[0].text).toContain(
        'File location: ~/Library/Application Support/mcp-structured-memory/test.md'
      )
    })

    it('should use default Windows path when on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' })
      
      const result = await createMemoryTool(storageManager, { name: 'Test' })

      expect(result.content[0].text).toContain(
        'File location: %LOCALAPPDATA%\\mcp-structured-memory/test.md'
      )
    })

    it('should use default Linux path when on Linux', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' })
      
      const result = await createMemoryTool(storageManager, { name: 'Test' })

      expect(result.content[0].text).toContain(
        'File location: ~/.local/share/mcp-structured-memory/test.md'
      )
    })

    it('should use environment variable when set', async () => {
      process.env.MEMORY_STORAGE_PATH = '/custom/path'
      
      const result = await createMemoryTool(storageManager, { name: 'Test' })

      expect(result.content[0].text).toContain(
        'File location: /custom/path/test.md'
      )
    })
  })

  describe('Storage Manager Integration', () => {
    it('should check for existing memory before creating', async () => {
      await createMemoryTool(storageManager, { name: 'Test Memory' })

      expect(storageManager.readMemory).toHaveBeenCalledWith('test-memory')
    })

    it('should call writeMemory with correct parameters', async () => {
      await createMemoryTool(storageManager, { name: 'Test Memory' })

      expect(storageManager.writeMemory).toHaveBeenCalledTimes(1)
      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            id: 'test-memory'
          }),
          content: expect.stringContaining('# Test Memory'),
          filePath: ''
        })
      )
    })

    it('should handle storage manager errors gracefully', async () => {
      vi.mocked(storageManager.writeMemory).mockRejectedValue(new Error('Storage error'))

      await expect(
        createMemoryTool(storageManager, { name: 'Test' })
      ).rejects.toThrow('Storage error')
    })

    it('should handle read memory errors gracefully', async () => {
      vi.mocked(storageManager.readMemory).mockRejectedValue(new Error('Read error'))

      await expect(
        createMemoryTool(storageManager, { name: 'Test' })
      ).rejects.toThrow('Read error')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long names', async () => {
      const longName = 'A'.repeat(200)
      
      await createMemoryTool(storageManager, { name: longName })

      const expectedId = 'a'.repeat(200)
      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            id: expectedId
          })
        })
      )
    })

    it('should handle names with unicode characters', async () => {
      await createMemoryTool(storageManager, { name: 'Café Notes 🚀' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            id: 'caf-notes-'
          })
        })
      )
    })

    it('should handle names that result in single character after sanitization', async () => {
      await createMemoryTool(storageManager, { name: '!@#a$%^' })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            id: 'a'
          })
        })
      )
    })

    it('should handle very long initial context', async () => {
      const longContext = 'Context '.repeat(1000)
      
      await createMemoryTool(storageManager, {
        name: 'Test',
        initial_context: longContext.trim()
      })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining(longContext.trim())
        })
      )
    })

    it('should handle initial context with special markdown characters', async () => {
      const context = '# This is not a heading\n**Bold** and *italic* text\n- List item'
      
      await createMemoryTool(storageManager, {
        name: 'Test',
        initial_context: context
      })

      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining(context)
        })
      )
    })
  })
})