import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { addToListTool } from './addToList.js'
import { StorageManager } from '../storage/StorageManager.js'
import { Memory, MemorySection } from '../types/memory.js'

// Mock the StorageManager
vi.mock('../storage/StorageManager.js', () => {
  return {
    StorageManager: vi.fn().mockImplementation(() => ({
      readMemory: vi.fn(),
      findSection: vi.fn(),
      updateSection: vi.fn()
    }))
  }
})

describe('addToList Tool', () => {
  let storageManager: StorageManager
  let mockMemory: Memory
  let mockSection: MemorySection

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

## Active Pipeline
- Company A - Software Engineer
- Company B - Frontend Developer

## Ruled Out Companies
- Company C - Not a good fit

## Contacts
- John Doe - Company A

## Interview Schedule
- Company A - Technical Round`,
      filePath: '/test/path/test-memory.md'
    }

    mockSection = {
      name: 'Active Pipeline',
      content: '- Company A - Software Engineer\n- Company B - Frontend Developer',
      level: 2
    }

    vi.mocked(storageManager.readMemory).mockResolvedValue(mockMemory)
    vi.mocked(storageManager.findSection).mockReturnValue(mockSection)
    vi.mocked(storageManager.updateSection).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Input Validation', () => {
    it('should throw error when memory_id is missing', async () => {
      await expect(
        addToListTool(storageManager, { section: 'test', item: { name: 'test' } })
      ).rejects.toThrow('memory_id, section, and item are required')
    })

    it('should throw error when section is missing', async () => {
      await expect(
        addToListTool(storageManager, { memory_id: 'test', item: { name: 'test' } })
      ).rejects.toThrow('memory_id, section, and item are required')
    })

    it('should throw error when item is missing', async () => {
      await expect(
        addToListTool(storageManager, { memory_id: 'test', section: 'test' })
      ).rejects.toThrow('memory_id, section, and item are required')
    })

    it('should throw error when all parameters are missing', async () => {
      await expect(
        addToListTool(storageManager, {})
      ).rejects.toThrow('memory_id, section, and item are required')
    })

    it('should throw error when memory document not found', async () => {
      vi.mocked(storageManager.readMemory).mockResolvedValue(null)

      await expect(
        addToListTool(storageManager, { 
          memory_id: 'nonexistent', 
          section: 'test',
          item: { name: 'test' }
        })
      ).rejects.toThrow("Memory document 'nonexistent' not found")
    })

    it('should throw error when section not found', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      await expect(
        addToListTool(storageManager, { 
          memory_id: 'test-memory', 
          section: 'nonexistent',
          item: { name: 'test' }
        })
      ).rejects.toThrow("Section 'nonexistent' not found in memory document 'test-memory'")
    })
  })

  describe('Pipeline Item Formatting', () => {
    beforeEach(() => {
      mockSection.name = 'Active Pipeline'
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)
    })

    it('should format pipeline item with all fields', async () => {
      const item = {
        company: 'Tech Corp',
        role: 'Senior Engineer',
        compensation: '$150k',
        status: 'Applied',
        rating: '4',
        notes: 'Great opportunity',
        applied_date: '2025-07-31',
        next_steps: 'Wait for response'
      }

      const result = await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Active Pipeline',
        item
      })

      expect(vi.mocked(storageManager.updateSection)).toHaveBeenCalledWith(
        'test-memory',
        'Active Pipeline',
        expect.stringContaining('### Tech Corp ⭐⭐⭐⭐'),
        'append'
      )

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('- **Role**: Senior Engineer')
      expect(calledWith).toContain('- **Compensation**: $150k')
      expect(calledWith).toContain('- **Status**: Applied')
      expect(calledWith).toContain('- **Applied**: 2025-07-31')
      expect(calledWith).toContain('- **Next Steps**: Wait for response')
      expect(calledWith).toContain('- **Notes**: Great opportunity')

      expect(result.content[0].text).toContain('Successfully added item to Active Pipeline')
      expect(result.content[0].text).toContain('Tech Corp ⭐⭐⭐⭐')
    })

    it('should format pipeline item with minimal fields', async () => {
      const item = {
        company: 'Minimal Corp'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Active Pipeline',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Minimal Corp')
      expect(calledWith).toContain('- **Role**: Unknown Role')
      expect(calledWith).toContain('- **Compensation**: Not specified')
      expect(calledWith).toContain('- **Status**: Not applied')
      expect(calledWith).not.toContain('⭐')
    })

    it('should handle alternative field names for pipeline items', async () => {
      const item = {
        name: 'Alt Corp',
        position: 'Developer',
        salary: '$120k',
        stars: '3',
        note: 'Alternative fields',
        date: '2025-07-30'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Active Pipeline',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Alt Corp ⭐⭐⭐')
      expect(calledWith).toContain('- **Role**: Developer')
      expect(calledWith).toContain('- **Compensation**: $120k')
      expect(calledWith).toContain('- **Applied**: 2025-07-30')
      expect(calledWith).toContain('- **Notes**: Alternative fields')
    })

    it('should handle invalid rating values', async () => {
      const item = {
        company: 'Test Corp',
        rating: 'invalid'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Active Pipeline',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Test Corp')
      expect(calledWith).not.toContain('⭐')
    })

    it('should handle rating out of range', async () => {
      const item = {
        company: 'Test Corp',
        rating: '6'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Active Pipeline',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).not.toContain('⭐')
    })

    it('should detect pipeline section by name containing "pipeline"', async () => {
      mockSection.name = 'Job Pipeline'
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const item = { company: 'Test Corp' }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Job Pipeline',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Test Corp')
      expect(calledWith).toContain('- **Role**: Unknown Role')
    })

    it('should detect pipeline section by name containing "active"', async () => {
      mockSection.name = 'Active Applications'
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const item = { company: 'Test Corp' }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Active Applications',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Test Corp')
      expect(calledWith).toContain('- **Role**: Unknown Role')
    })
  })

  describe('Ruled Out Item Formatting', () => {
    beforeEach(() => {
      mockSection.name = 'Ruled Out Companies'
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)
    })

    it('should format ruled out item with all fields', async () => {
      const item = {
        company: 'Rejected Corp',
        reason: 'Poor culture fit',
        date: '2025-07-30',
        notes: 'Not a good match'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Ruled Out Companies',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Rejected Corp')
      expect(calledWith).toContain('- **Reason**: Poor culture fit')
      expect(calledWith).toContain('- **Date ruled out**: 2025-07-30')
      expect(calledWith).toContain('- **Notes**: Not a good match')
    })

    it('should format ruled out item with minimal fields and default date', async () => {
      const item = {
        company: 'Minimal Reject'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Ruled Out Companies',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Minimal Reject')
      expect(calledWith).toContain('- **Reason**: Not specified')
      expect(calledWith).toContain('- **Date ruled out**: 2025-07-31') // Today's date
    })

    it('should handle alternative field names for ruled out items', async () => {
      const item = {
        name: 'Alt Reject',
        ruled_out_date: '2025-07-29',
        note: 'Alternative note field'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Ruled Out Companies',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Alt Reject')
      expect(calledWith).toContain('- **Date ruled out**: 2025-07-29')
      expect(calledWith).toContain('- **Notes**: Alternative note field')
    })

    it('should detect ruled out section by name containing "ruled"', async () => {
      mockSection.name = 'Ruled Out'
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const item = { company: 'Test Corp' }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Ruled Out',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Test Corp')
      expect(calledWith).toContain('- **Reason**: Not specified')
    })

    it('should detect ruled out section by name containing "rejected"', async () => {
      mockSection.name = 'Rejected Applications'
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const item = { company: 'Test Corp' }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Rejected Applications',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Test Corp')
      expect(calledWith).toContain('- **Reason**: Not specified')
    })
  })

  describe('Contact Item Formatting', () => {
    beforeEach(() => {
      mockSection.name = 'Contacts'
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)
    })

    it('should format contact item with all fields', async () => {
      const item = {
        name: 'Jane Smith',
        company: 'Tech Corp',
        relationship: 'Senior Engineer',
        contact_date: '2025-07-31',
        status: 'Responded',
        notes: 'Very helpful'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Contacts',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Jane Smith')
      expect(calledWith).toContain('- **Company**: Tech Corp')
      expect(calledWith).toContain('- **Relationship**: Senior Engineer')
      expect(calledWith).toContain('- **Contact Date**: 2025-07-31')
      expect(calledWith).toContain('- **Status**: Responded')
      expect(calledWith).toContain('- **Notes**: Very helpful')
    })

    it('should format contact item with minimal fields and defaults', async () => {
      const item = {
        name: 'John Doe'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Contacts',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### John Doe')
      expect(calledWith).toContain('- **Company**: Unknown Company')
      expect(calledWith).toContain('- **Relationship**: Unknown')
      expect(calledWith).toContain('- **Contact Date**: 2025-07-31')
      expect(calledWith).toContain('- **Status**: Contacted')
    })

    it('should handle alternative field names for contact items', async () => {
      const item = {
        contact: 'Alt Contact',
        relation: 'Manager',
        date: '2025-07-30',
        note: 'Alternative note'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Contacts',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Alt Contact')
      expect(calledWith).toContain('- **Relationship**: Manager')
      expect(calledWith).toContain('- **Contact Date**: 2025-07-30')
      expect(calledWith).toContain('- **Notes**: Alternative note')
    })

    it('should detect contact section by name containing "contact"', async () => {
      mockSection.name = 'Contact List'
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const item = { name: 'Test Contact' }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Contact List',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Test Contact')
      expect(calledWith).toContain('- **Company**: Unknown Company')
    })

    it('should detect contact section by name containing "network"', async () => {
      mockSection.name = 'Professional Network'
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      const item = { name: 'Test Contact' }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Professional Network',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Test Contact')
      expect(calledWith).toContain('- **Company**: Unknown Company')
    })
  })

  describe('Interview Item Formatting', () => {
    beforeEach(() => {
      mockSection.name = 'Interview Schedule'
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)
    })

    it('should format interview item with all fields', async () => {
      const item = {
        company: 'Tech Corp',
        round: 'Technical Round',
        date: '2025-08-01',
        interviewer: 'John Smith, Jane Doe',
        format: 'Video call',
        questions: 'System design, coding challenges',
        performance: 'Went well',
        next_steps: 'Wait for decision',
        notes: 'Challenging but fair'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Interview Schedule',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Tech Corp - Technical Round')
      expect(calledWith).toContain('- **Date**: 2025-08-01')
      expect(calledWith).toContain('- **Interviewer(s)**: John Smith, Jane Doe')
      expect(calledWith).toContain('- **Format**: Video call')
      expect(calledWith).toContain('- **Questions Asked**: System design, coding challenges')
      expect(calledWith).toContain('- **My Performance**: Went well')
      expect(calledWith).toContain('- **Next Steps**: Wait for decision')
      expect(calledWith).toContain('- **Notes**: Challenging but fair')
    })

    it('should format interview item with minimal fields and defaults', async () => {
      const item = {
        company: 'Minimal Corp'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Interview Schedule',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Minimal Corp - Interview')
      expect(calledWith).toContain('- **Date**: 2025-07-31')
      expect(calledWith).toContain('- **Interviewer(s)**: Not specified')
      expect(calledWith).toContain('- **Format**: Not specified')
    })

    it('should handle alternative field names for interview items', async () => {
      const item = {
        company: 'Alt Corp',
        type: 'Final Round',
        interview_date: '2025-08-02',
        interviewers: 'CEO, CTO',
        note: 'Important interview'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Interview Schedule',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Alt Corp - Final Round')
      expect(calledWith).toContain('- **Date**: 2025-08-02')
      expect(calledWith).toContain('- **Interviewer(s)**: CEO, CTO')
      expect(calledWith).toContain('- **Notes**: Important interview')
    })
  })

  describe('Generic Item Formatting', () => {
    beforeEach(() => {
      mockSection.name = 'General List'
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)
    })

    it('should format string item as simple bullet point', async () => {
      const item = 'Simple string item'

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'General List',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toBe('- Simple string item')
    })

    it('should format object with name as heading', async () => {
      const item = {
        name: 'Test Item',
        description: 'A test item',
        priority: 'High',
        due_date: '2025-08-01'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'General List',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Test Item')
      expect(calledWith).toContain('- **Description**: A test item')
      expect(calledWith).toContain('- **Priority**: High')
      expect(calledWith).toContain('- **Due Date**: 2025-08-01')
    })

    it('should format object with title as heading', async () => {
      const item = {
        title: 'Test Title',
        content: 'Some content'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'General List',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Test Title')
      expect(calledWith).toContain('- **Content**: Some content')
    })

    it('should format object without name/title as key-value pairs', async () => {
      const item = {
        description: 'No name item',
        status: 'Active',
        category: 'Work'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'General List',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('- **Description**: No name item')
      expect(calledWith).toContain('- **Status**: Active')
      expect(calledWith).toContain('- **Category**: Work')
      expect(calledWith).not.toContain('###')
    })

    it('should handle empty object', async () => {
      const item = {}

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'General List',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toBe('')
    })

    it('should handle null values in object', async () => {
      const item = {
        name: 'Test Item',
        description: null,
        valid_field: 'Valid value',
        empty_field: ''
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'General List',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Test Item')
      expect(calledWith).toContain('- **Valid Field**: Valid value')
      expect(calledWith).not.toContain('description')
      expect(calledWith).not.toContain('empty_field')
    })

    it('should format key names properly', async () => {
      const item = {
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john@example.com',
        phone_number: '123-456-7890'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'General List',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('- **First Name**: John')
      expect(calledWith).toContain('- **Last Name**: Doe')
      expect(calledWith).toContain('- **Email Address**: john@example.com')
      expect(calledWith).toContain('- **Phone Number**: 123-456-7890')
    })

    it('should handle non-object, non-string values', async () => {
      const item = 42

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'General List',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toBe('- 42')
    })

    it('should handle boolean values', async () => {
      const item = true

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'General List',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toBe('- true')
    })

    it('should handle null item by throwing error', async () => {
      const item = null

      await expect(
        addToListTool(storageManager, {
          memory_id: 'test-memory',
          section: 'General List',
          item
        })
      ).rejects.toThrow('memory_id, section, and item are required')
    })
  })

  describe('Section Detection', () => {
    it('should use case-insensitive matching for section detection', async () => {
      const testCases = [
        { section: 'ACTIVE PIPELINE', expected: 'pipeline' },
        { section: 'job pipeline', expected: 'pipeline' },
        { section: 'Active Applications', expected: 'pipeline' },
        { section: 'RULED OUT COMPANIES', expected: 'ruled out' },
        { section: 'rejected applications', expected: 'ruled out' },
        { section: 'CONTACT LIST', expected: 'contact' },
        { section: 'professional network', expected: 'contact' },
        { section: 'INTERVIEW SCHEDULE', expected: 'interview' },
        { section: 'upcoming interviews', expected: 'interview' }
      ]

      for (const { section, expected } of testCases) {
        mockSection.name = section
        vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

        const item = expected === 'contact' ? { name: 'Test Name', company: 'Test Corp' } : { company: 'Test Corp' }

        await addToListTool(storageManager, {
          memory_id: 'test-memory',
          section,
          item
        })

        const calledWith = vi.mocked(storageManager.updateSection).mock.calls[vi.mocked(storageManager.updateSection).mock.calls.length - 1][2]
        
        if (expected === 'pipeline') {
          expect(calledWith).toContain('- **Role**: Unknown Role')
        } else if (expected === 'ruled out') {
          expect(calledWith).toContain('- **Reason**: Not specified')
        } else if (expected === 'contact') {
          expect(calledWith).toContain('- **Company**: Test Corp')
        } else if (expected === 'interview') {
          expect(calledWith).toContain('- **Date**: 2025-07-31')
        }

        vi.clearAllMocks()
        vi.mocked(storageManager.readMemory).mockResolvedValue(mockMemory)
        vi.mocked(storageManager.updateSection).mockResolvedValue(undefined)
      }
    })
  })

  describe('Storage Manager Integration', () => {
    it('should call readMemory with correct memory_id', async () => {
      await addToListTool(storageManager, {
        memory_id: 'test-memory-123',
        section: 'test-section',
        item: { name: 'test' }
      })

      expect(vi.mocked(storageManager.readMemory)).toHaveBeenCalledWith('test-memory-123')
    })

    it('should call findSection with memory content and section name', async () => {
      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'test-section',
        item: { name: 'test' }
      })

      expect(vi.mocked(storageManager.findSection)).toHaveBeenCalledWith(
        mockMemory.content,
        'test-section'
      )
    })

    it('should call updateSection with correct parameters', async () => {
      const item = { name: 'Test Item' }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'test-section',
        item
      })

      expect(vi.mocked(storageManager.updateSection)).toHaveBeenCalledWith(
        'test-memory',
        'test-section',
        expect.stringContaining('### Test Item'),
        'append'
      )
    })

    it('should handle updateSection failure', async () => {
      vi.mocked(storageManager.updateSection).mockRejectedValue(new Error('Update failed'))

      await expect(
        addToListTool(storageManager, {
          memory_id: 'test-memory',
          section: 'test-section',
          item: { name: 'test' }
        })
      ).rejects.toThrow('Update failed')
    })
  })

  describe('Return Value', () => {
    it('should return success message with correct format', async () => {
      const item = { company: 'Success Corp' }

      const result = await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Active Pipeline',
        item
      })

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: expect.stringContaining('Successfully added item to Active Pipeline in memory document \'test-memory\'')
        }]
      })

      expect(result.content[0].text).toContain('### Success Corp')
      expect(result.content[0].text).toContain('The item has been appended to the section')
      expect(result.content[0].text).toContain('You can view the updated section using the get_section tool')
    })

    it('should include formatted item in return message', async () => {
      const item = {
        company: 'Display Corp',
        role: 'Engineer',
        compensation: '$130k',
        rating: '5'
      }

      const result = await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Active Pipeline',
        item
      })

      const returnText = result.content[0].text
      expect(returnText).toContain('### Display Corp ⭐⭐⭐⭐⭐')
      expect(returnText).toContain('- **Role**: Engineer')
      expect(returnText).toContain('- **Compensation**: $130k')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long field values', async () => {
      const longText = 'A'.repeat(1000)
      const item = {
        company: 'Long Corp',
        notes: longText
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Active Pipeline',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain(`- **Notes**: ${longText}`)
    })

    it('should handle special characters in field values', async () => {
      const item = {
        company: 'Special & Corp <Test>',
        notes: 'Notes with "quotes" and \'apostrophes\' and *asterisks*'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Active Pipeline',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Special & Corp <Test>')
      expect(calledWith).toContain('Notes with "quotes" and \'apostrophes\' and *asterisks*')
    })

    it('should handle nested objects in item fields', async () => {
      const item = {
        name: 'Nested Corp',
        details: {
          location: 'San Francisco',
          team_size: 50
        }
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'General List',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Nested Corp')
      expect(calledWith).toContain('- **Details**: [object Object]')
    })

    it('should handle array values in item fields', async () => {
      const item = {
        name: 'Array Corp',
        technologies: ['React', 'Node.js', 'TypeScript']
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'General List',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Array Corp')
      expect(calledWith).toContain('- **Technologies**: React,Node.js,TypeScript')
    })
  })
})