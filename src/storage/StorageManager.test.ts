import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StorageManager } from './StorageManager.js'
import { Memory } from '../types/memory.js'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

// Mock the fs module
vi.mock('fs/promises', () => ({
  access: vi.fn(),
  mkdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readdir: vi.fn()
}))

// Mock path and os modules for platform testing
vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...actual,
    join: vi.fn((...args: string[]) => args.join('/')),
    resolve: vi.fn((p: string) => p),
    basename: vi.fn((p: string, ext?: string) => {
      const parts = p.split('/')
      const filename = parts[parts.length - 1]
      if (ext && filename.endsWith(ext)) {
        return filename.slice(0, -ext.length)
      }
      return filename
    })
  }
})

vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/user'),
  platform: 'linux'
}))

// Mock gray-matter
vi.mock('gray-matter', () => {
  const matterMock = vi.fn((content: string) => {
    // Simple mock implementation that extracts frontmatter-like content
    const lines = content.split('\n')
    if (lines[0] === '---') {
      const endIndex = lines.findIndex((line, i) => i > 0 && line === '---')
      if (endIndex > 0) {
        const frontmatterLines = lines.slice(1, endIndex)
        const data: any = {}
        frontmatterLines.forEach(line => {
          const [key, ...valueParts] = line.split(': ')
          if (key && valueParts.length > 0) {
            const value = valueParts.join(': ')
            // Handle arrays
            if (value.startsWith('[') && value.endsWith(']')) {
              data[key] = JSON.parse(value)
            } else if (value.startsWith('"') && value.endsWith('"')) {
              data[key] = value.slice(1, -1)
            } else {
              data[key] = value
            }
          }
        })
        return {
          data,
          content: lines.slice(endIndex + 1).join('\n')
        }
      }
    }
    return { data: {}, content }
  })
  
  matterMock.stringify = vi.fn((content: string, frontmatter: any) => {
    const frontmatterLines = Object.entries(frontmatter).map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${JSON.stringify(value)}`
      } else if (typeof value === 'string') {
        return `${key}: "${value}"`
      } else {
        return `${key}: ${value}`
      }
    })
    return `---\n${frontmatterLines.join('\n')}\n---\n${content}`
  })
  
  return { default: matterMock }
})

describe('StorageManager', () => {
  let storageManager: StorageManager
  let mockFs: any
  let mockPath: any
  let mockOs: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockFs = vi.mocked(fs)
    mockPath = vi.mocked(path)
    mockOs = vi.mocked(os)
    
    // Reset environment
    delete process.env.MEMORY_STORAGE_PATH
    
    // Default OS platform
    Object.defineProperty(process, 'platform', {
      value: 'linux',
      configurable: true
    })
    
    storageManager = new StorageManager()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Platform-specific Path Generation', () => {
    it('should use custom path from environment variable', () => {
      process.env.MEMORY_STORAGE_PATH = '~/custom/memory/path'
      mockOs.homedir.mockReturnValue('/home/user')
      mockPath.resolve.mockReturnValue('/home/user/custom/memory/path')
      
      const manager = new StorageManager()
      
      expect(mockPath.resolve).toHaveBeenCalledWith('/home/user/custom/memory/path')
    })

    it('should generate macOS specific path', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
      })
      mockOs.homedir.mockReturnValue('/Users/testuser')
      
      const manager = new StorageManager()
      
      expect(mockPath.join).toHaveBeenCalledWith(
        '/Users/testuser',
        'Library',
        'Application Support',
        'mcp-structured-memory'
      )
    })

    it('should generate Windows specific path', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      })
      mockOs.homedir.mockReturnValue('C:\\Users\\testuser')
      
      const manager = new StorageManager()
      
      expect(mockPath.join).toHaveBeenCalledWith(
        'C:\\Users\\testuser',
        'AppData',
        'Local',
        'mcp-structured-memory'
      )
    })

    it('should generate Linux/default path', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
      mockOs.homedir.mockReturnValue('/home/testuser')
      
      const manager = new StorageManager()
      
      expect(mockPath.join).toHaveBeenCalledWith(
        '/home/testuser',
        '.local',
        'share',
        'mcp-structured-memory'
      )
    })

    it('should handle tilde expansion in custom path', () => {
      process.env.MEMORY_STORAGE_PATH = '~/Documents/memories'
      mockOs.homedir.mockReturnValue('/home/user')
      mockPath.resolve.mockReturnValue('/home/user/Documents/memories')
      
      const manager = new StorageManager()
      
      expect(mockPath.resolve).toHaveBeenCalledWith('/home/user/Documents/memories')
    })
  })

  describe('Directory Management', () => {
    it('should create storage directory if it does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('Directory does not exist'))
      mockFs.mkdir.mockResolvedValue(undefined)
      
      await storageManager.ensureStorageDirectory()
      
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      )
      expect(mockFs.mkdir).toHaveBeenCalledTimes(2) // Main dir + backups dir
    })

    it('should not create directory if it already exists', async () => {
      mockFs.access.mockResolvedValue(undefined)
      
      await storageManager.ensureStorageDirectory()
      
      expect(mockFs.mkdir).not.toHaveBeenCalled()
    })

    it('should create backups directory along with main directory', async () => {
      mockFs.access.mockRejectedValue(new Error('Directory does not exist'))
      mockFs.mkdir.mockResolvedValue(undefined)
      mockPath.join.mockImplementation((...args) => args.join('/'))
      
      await storageManager.ensureStorageDirectory()
      
      expect(mockFs.mkdir).toHaveBeenCalledTimes(2)
      expect(mockFs.mkdir).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('.backups'),
        { recursive: true }
      )
    })
  })

  describe('Memory Creation and Writing', () => {
    const mockMemory: Memory = {
      metadata: {
        id: 'test-memory',
        created: '2025-01-01T00:00:00.000Z',
        updated: '2025-01-01T00:00:00.000Z',
        tags: ['test', 'memory'],
        status: 'active'
      },
      content: '# Test Memory\n\nThis is test content.',
      filePath: '/test/path/test-memory.md'
    }

    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined) // Directory exists
      mockFs.writeFile.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue('existing content')
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-02T00:00:00.000Z')
    })

    it('should write memory with correct frontmatter', async () => {
      await storageManager.writeMemory(mockMemory)
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-memory.md'),
        expect.any(String),
        'utf-8'
      )
      
      // Verify matter.stringify was called with correct parameters
      const matter = await import('gray-matter')
      expect(matter.default.stringify).toHaveBeenCalledWith(
        mockMemory.content,
        expect.objectContaining({
          id: 'test-memory',
          tags: ['test', 'memory'],
          status: 'active',
          updated: '2025-01-02T00:00:00.000Z'
        })
      )
    })

    it('should create backup before writing', async () => {
      const backupSpy = vi.spyOn(storageManager, 'createBackup')
      backupSpy.mockResolvedValue(undefined)
      
      await storageManager.writeMemory(mockMemory)
      
      expect(backupSpy).toHaveBeenCalledWith('test-memory')
    })

    it('should ensure storage directory exists before writing', async () => {
      const ensureSpy = vi.spyOn(storageManager, 'ensureStorageDirectory')
      ensureSpy.mockResolvedValue(undefined)
      
      await storageManager.writeMemory(mockMemory)
      
      expect(ensureSpy).toHaveBeenCalled()
    })

    it('should handle memory without status field', async () => {
      const memoryWithoutStatus = {
        ...mockMemory,
        metadata: { ...mockMemory.metadata, status: undefined }
      }
      
      await storageManager.writeMemory(memoryWithoutStatus)
      
      const [, content] = mockFs.writeFile.mock.calls[0]
      expect(content).not.toContain('status:')
    })
  })

  describe('Memory Reading', () => {
    const sampleFileContent = `---
id: "test-memory"
created: "2025-01-01T00:00:00.000Z"
updated: "2025-01-02T00:00:00.000Z"
tags: ["test","memory"]
status: active
---
# Test Memory

This is test content.`

    it('should read and parse memory correctly', async () => {
      mockFs.readFile.mockResolvedValue(sampleFileContent)
      
      const result = await storageManager.readMemory('test-memory')
      
      expect(result).not.toBeNull()
      expect(result?.metadata.id).toBe('test-memory')
      expect(result?.metadata.tags).toEqual(['test', 'memory'])
      expect(result?.metadata.status).toBe('active')
      expect(result?.content).toBe('# Test Memory\n\nThis is test content.')
    })

    it('should return null for non-existent memory', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockFs.readFile.mockRejectedValue(error)
      
      const result = await storageManager.readMemory('non-existent')
      
      expect(result).toBeNull()
    })

    it('should throw error for other file system errors', async () => {
      const error = new Error('Permission denied')
      mockFs.readFile.mockRejectedValue(error)
      
      await expect(storageManager.readMemory('test-memory'))
        .rejects.toThrow('Permission denied')
    })

    it('should handle missing frontmatter fields with defaults', async () => {
      const contentWithoutFields = `---
id: "minimal-memory"
---
# Minimal Memory

Content here.`
      
      mockFs.readFile.mockResolvedValue(contentWithoutFields)
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-02T00:00:00.000Z')
      
      const result = await storageManager.readMemory('minimal-memory')
      
      expect(result?.metadata.created).toBe('2025-01-02T00:00:00.000Z')
      expect(result?.metadata.updated).toBe('2025-01-02T00:00:00.000Z')
      expect(result?.metadata.tags).toEqual([])
      expect(result?.metadata.status).toBeUndefined()
    })

    it('should use memory ID as fallback for missing ID in frontmatter', async () => {
      const contentWithoutId = `---
created: "2025-01-01T00:00:00.000Z"
---
Content here.`
      
      mockFs.readFile.mockResolvedValue(contentWithoutId)
      
      const result = await storageManager.readMemory('fallback-id')
      
      expect(result?.metadata.id).toBe('fallback-id')
    })
  })

  describe('Memory Listing', () => {
    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined) // Directory exists
    })

    it('should list all memory files and return summaries', async () => {
      const files = ['memory1.md', 'memory2.md', '.hidden.md', 'not-memory.txt']
      mockFs.readdir.mockResolvedValue(files)
      
      const fileContents = [
        `---
id: "memory1"
created: "2025-01-01T00:00:00.000Z"
updated: "2025-01-02T00:00:00.000Z"
tags: ["tag1"]
---
# Section 1
Content 1
## Section 2
Content 2`,
        `---
id: "memory2"
created: "2025-01-01T00:00:00.000Z"
updated: "2025-01-01T12:00:00.000Z"
tags: ["tag2"]
status: inactive
---
# Only Section
Content here`
      ]
      
      mockFs.readFile
        .mockResolvedValueOnce(fileContents[0])
        .mockResolvedValueOnce(fileContents[1])
      
      mockPath.basename
        .mockReturnValueOnce('memory1')
        .mockReturnValueOnce('memory2')
      
      const result = await storageManager.listMemories()
      
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('memory1') // Should be first due to newer update date
      expect(result[0].sectionCount).toBe(2)
      expect(result[1].id).toBe('memory2')
      expect(result[1].sectionCount).toBe(1)
      expect(result[1].status).toBe('inactive')
    })

    it('should filter out hidden files and non-markdown files', async () => {
      const files = ['.hidden.md', 'backup.txt', 'memory.md']
      mockFs.readdir.mockResolvedValue(files)
      mockFs.readFile.mockResolvedValue(`---
id: "memory"
---
Content`)
      mockPath.basename.mockReturnValue('memory')
      
      await storageManager.listMemories()
      
      expect(mockFs.readFile).toHaveBeenCalledTimes(1)
    })

    it('should sort memories by updated date (newest first)', async () => {
      const files = ['old.md', 'new.md', 'middle.md']
      mockFs.readdir.mockResolvedValue(files)
      
      const fileContents = [
        `---
id: "old"
updated: "2025-01-01T00:00:00.000Z"
---
Content`,
        `---
id: "new"
updated: "2025-01-03T00:00:00.000Z"
---
Content`,
        `---
id: "middle"
updated: "2025-01-02T00:00:00.000Z"
---
Content`
      ]
      
      mockFs.readFile
        .mockResolvedValueOnce(fileContents[0])
        .mockResolvedValueOnce(fileContents[1])
        .mockResolvedValueOnce(fileContents[2])
      
      mockPath.basename
        .mockReturnValueOnce('old')
        .mockReturnValueOnce('new')
        .mockReturnValueOnce('middle')
      
      const result = await storageManager.listMemories()
      
      expect(result[0].id).toBe('new')
      expect(result[1].id).toBe('middle')
      expect(result[2].id).toBe('old')
    })

    it('should return empty array if directory read fails', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'))
      
      const result = await storageManager.listMemories()
      
      expect(result).toEqual([])
    })

    it('should ensure storage directory exists before listing', async () => {
      const ensureSpy = vi.spyOn(storageManager, 'ensureStorageDirectory')
      ensureSpy.mockResolvedValue(undefined)
      mockFs.readdir.mockResolvedValue([])
      
      await storageManager.listMemories()
      
      expect(ensureSpy).toHaveBeenCalled()
    })
  })

  describe('Backup Functionality', () => {
    beforeEach(() => {
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-02T10-30-45-123Z')
    })

    it('should create backup of existing file', async () => {
      mockFs.access.mockResolvedValue(undefined) // File exists
      mockFs.readFile.mockResolvedValue('original content')
      mockFs.writeFile.mockResolvedValue(undefined)
      
      await storageManager.createBackup('test-memory')
      
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('test-memory.md'),
        'utf-8'
      )
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-memory-2025-01-02T10-30-45-123Z.md'),
        'original content',
        'utf-8'
      )
    })

    it('should not create backup if file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'))
      
      await storageManager.createBackup('non-existent')
      
      expect(mockFs.readFile).not.toHaveBeenCalled()
      expect(mockFs.writeFile).not.toHaveBeenCalled()
    })

    it('should sanitize timestamp for filename', async () => {
      mockFs.access.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue('content')
      mockFs.writeFile.mockResolvedValue(undefined)
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-02T10:30:45.123Z')
      
      await storageManager.createBackup('test-memory')
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-memory-2025-01-02T10-30-45-123Z.md'),
        'content',
        'utf-8'
      )
    })
  })

  describe('Section Parsing', () => {
    it('should parse sections with different heading levels', () => {
      const content = `# Level 1 Heading
Content for level 1

## Level 2 Heading
Content for level 2
More content

### Level 3 Heading
Content for level 3

#### Level 4 Heading
Content for level 4`

      const sections = storageManager.parseSections(content)
      
      expect(sections).toHaveLength(4)
      expect(sections[0]).toEqual({
        name: 'Level 1 Heading',
        content: 'Content for level 1',
        level: 1
      })
      expect(sections[1]).toEqual({
        name: 'Level 2 Heading',
        content: 'Content for level 2\nMore content',
        level: 2
      })
      expect(sections[2]).toEqual({
        name: 'Level 3 Heading',
        content: 'Content for level 3',
        level: 3
      })
      expect(sections[3]).toEqual({
        name: 'Level 4 Heading',
        content: 'Content for level 4',
        level: 4
      })
    })

    it('should handle content before first heading', () => {
      const content = `This is content before any heading

## First Heading
Content under heading`

      const sections = storageManager.parseSections(content)
      
      expect(sections).toHaveLength(1)
      expect(sections[0].name).toBe('First Heading')
    })

    it('should handle empty sections', () => {
      const content = `## Empty Section

## Section with Content
Some content here

## Another Empty Section`

      const sections = storageManager.parseSections(content)
      
      expect(sections).toHaveLength(3)
      expect(sections[0]).toEqual({
        name: 'Empty Section',
        content: '',
        level: 2
      })
      expect(sections[1]).toEqual({
        name: 'Section with Content',
        content: 'Some content here',
        level: 2
      })
      expect(sections[2]).toEqual({
        name: 'Another Empty Section',
        content: '',
        level: 2
      })
    })

    it('should trim whitespace from section content', () => {
      const content = `## Section with Whitespace
   
   Content with spaces   
   
## Another Section
   More content   `

      const sections = storageManager.parseSections(content)
      
      expect(sections[0].content).toBe('Content with spaces')
      expect(sections[1].content).toBe('More content')
    })

    it('should handle malformed headings', () => {
      const content = `##No space after hashes
This should not be a heading

## Proper Heading
This is proper content

###    Extra spaces   
Content here`

      const sections = storageManager.parseSections(content)
      
      expect(sections).toHaveLength(2)
      expect(sections[0].name).toBe('Proper Heading')
      expect(sections[1].name).toBe('Extra spaces')
    })

    it('should handle empty content', () => {
      const sections = storageManager.parseSections('')
      expect(sections).toEqual([])
    })

    it('should handle content with only whitespace', () => {
      const sections = storageManager.parseSections('   \n\n   ')
      expect(sections).toEqual([])
    })
  })

  describe('Section Finding', () => {
    const sampleContent = `# Introduction
Welcome to the document

## Active Pipeline
- Company A
- Company B

## ruled_out companies
- Company C
- Company D

## Contact Network
- Person 1
- Person 2`

    it('should find section by exact name match', () => {
      const section = storageManager.findSection(sampleContent, 'Active Pipeline')
      
      expect(section).not.toBeNull()
      expect(section?.name).toBe('Active Pipeline')
      expect(section?.content).toContain('Company A')
    })

    it('should find section by case-insensitive match', () => {
      const section = storageManager.findSection(sampleContent, 'active pipeline')
      
      expect(section).not.toBeNull()
      expect(section?.name).toBe('Active Pipeline')
    })

    it('should find section by normalized name (special characters to underscores)', () => {
      const section = storageManager.findSection(sampleContent, 'ruled_out_companies')
      
      expect(section).not.toBeNull()
      expect(section?.name).toBe('ruled_out companies')
    })

    it('should return null for non-existent section', () => {
      const section = storageManager.findSection(sampleContent, 'Non-existent Section')
      
      expect(section).toBeNull()
    })

    it('should handle empty content', () => {
      const section = storageManager.findSection('', 'Any Section')
      expect(section).toBeNull()
    })

    it('should prioritize exact matches over normalized matches', () => {
      const contentWithBothFormats = `## Contact_Network
Underscore version

## Contact Network
Space version`
      
      const section = storageManager.findSection(contentWithBothFormats, 'Contact Network')
      
      expect(section?.content).toBe('Space version')
    })
  })

  describe('Section Updating', () => {
    const sampleMemory: Memory = {
      metadata: {
        id: 'test-memory',
        created: '2025-01-01T00:00:00.000Z',
        updated: '2025-01-01T00:00:00.000Z',
        tags: [],
      },
      content: `## Existing Section
Original content

## Another Section
More content`,
      filePath: '/test/path/test-memory.md'
    }

    beforeEach(() => {
      // Create a fresh memory object for each test to avoid state pollution
      const freshMemory = {
        ...sampleMemory,
        content: `## Existing Section
Original content

## Another Section
More content`
      }
      vi.spyOn(storageManager, 'readMemory').mockResolvedValue(freshMemory)
      vi.spyOn(storageManager, 'writeMemory').mockResolvedValue(undefined)
    })

    it('should append content to existing section', async () => {
      await storageManager.updateSection('test-memory', 'Existing Section', 'New content', 'append')
      
      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Original content\n\nNew content')
        })
      )
    })

    it('should replace content in existing section', async () => {
      await storageManager.updateSection('test-memory', 'Existing Section', 'Replacement content', 'replace')
      
      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Replacement content')
        })
      )
      
      const writtenMemory = (storageManager.writeMemory as any).mock.calls[0][0]
      expect(writtenMemory.content).not.toContain('Original content')
    })

    it('should create new section if it does not exist', async () => {
      await storageManager.updateSection('test-memory', 'New Section', 'New section content')
      
      expect(storageManager.writeMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('## New Section')
        })
      )
    })

    it('should default to append mode', async () => {
      // Reset the mock to ensure clean state
      const freshMemory = {
        ...sampleMemory,
        content: `## Existing Section
Original content

## Another Section
More content`
      }
      vi.spyOn(storageManager, 'readMemory').mockResolvedValue(freshMemory)
      
      await storageManager.updateSection('test-memory', 'Existing Section', 'Appended content')
      
      const writtenMemory = (storageManager.writeMemory as any).mock.calls[0][0]
      expect(writtenMemory.content).toContain('Original content\n\nAppended content')
    })

    it('should handle appending to empty section', async () => {
      const memoryWithEmptySection = {
        ...sampleMemory,
        content: `## Empty Section

## Another Section
Content here`
      }
      vi.spyOn(storageManager, 'readMemory').mockResolvedValue(memoryWithEmptySection)
      
      await storageManager.updateSection('test-memory', 'Empty Section', 'New content', 'append')
      
      const writtenMemory = (storageManager.writeMemory as any).mock.calls[0][0]
      expect(writtenMemory.content).toContain('New content')
    })

    it('should throw error for non-existent memory', async () => {
      vi.spyOn(storageManager, 'readMemory').mockResolvedValue(null)
      
      await expect(
        storageManager.updateSection('non-existent', 'Section', 'Content')
      ).rejects.toThrow("Memory document 'non-existent' not found")
    })

    it('should handle case-insensitive section matching', async () => {
      await storageManager.updateSection('test-memory', 'existing section', 'Updated content', 'replace')
      
      expect(storageManager.writeMemory).toHaveBeenCalled()
    })
  })

  describe('Content Rebuilding', () => {
    it('should rebuild content from sections correctly', () => {
      const sections = [
        { name: 'Section 1', content: 'Content 1', level: 1 },
        { name: 'Section 2', content: 'Content 2\nWith multiple lines', level: 2 },
        { name: 'Section 3', content: '', level: 3 }
      ]
      
      // Access private method through type casting
      const rebuiltContent = (storageManager as any).rebuildContent(sections)
      
      expect(rebuiltContent).toBe(`# Section 1

Content 1

## Section 2

Content 2
With multiple lines

### Section 3`)
    })

    it('should handle sections with various heading levels', () => {
      const sections = [
        { name: 'Level 1', content: 'Content', level: 1 },
        { name: 'Level 4', content: 'Content', level: 4 },
        { name: 'Level 6', content: 'Content', level: 6 }
      ]
      
      const rebuiltContent = (storageManager as any).rebuildContent(sections)
      
      expect(rebuiltContent).toContain('# Level 1')
      expect(rebuiltContent).toContain('#### Level 4')
      expect(rebuiltContent).toContain('###### Level 6')
    })

    it('should handle empty sections array', () => {
      const rebuiltContent = (storageManager as any).rebuildContent([])
      expect(rebuiltContent).toBe('')
    })
  })

  describe('Error Handling', () => {
    it('should handle file system permission errors gracefully', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'))
      
      const memory: Memory = {
        metadata: { id: 'test', created: '2025-01-01T00:00:00.000Z', updated: '2025-01-01T00:00:00.000Z', tags: [] },
        content: 'test',
        filePath: '/test'
      }
      
      await expect(storageManager.writeMemory(memory)).rejects.toThrow('Permission denied')
    })

    it('should handle corrupted file content gracefully', async () => {
      mockFs.readFile.mockResolvedValue('corrupted frontmatter content')
      
      // Should not throw, should handle gracefully
      const result = await storageManager.readMemory('corrupted-memory')
      expect(result).not.toBeNull()
    })
  })
})