import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { addToListTool } from './addToList.js'
import { StorageManager } from '../storage/StorageManager.js'
import { Memory, MemorySection } from '../types/memory.js'

// Mock the StorageManager
vi.mock('../storage/StorageManager.js', () => {
  class StorageManager {
    readMemory = vi.fn()
    findSection = vi.fn()
    updateSection = vi.fn()
  }
  return { StorageManager }
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

## Must-Visit Destinations
- Boundary Waters - 3 day canoe trip
- Split Rock Lighthouse - Morning visit

## Ruled Out Destinations
- Voyageurs National Park - Too far for this trip

## Restaurant Reservations
- Matt's Bar - Jucy Lucy

## Daily Itinerary
- Day 1 - Minneapolis arrival`,
      filePath: '/test/path/test-memory.md'
    }

    mockSection = {
      name: 'Must-Visit Destinations',
      content: '- Boundary Waters - 3 day canoe trip\n- Split Rock Lighthouse - Morning visit',
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

    it('should throw error when memory document not found', async () => {
      vi.mocked(storageManager.readMemory).mockResolvedValue(null)

      await expect(
        addToListTool(storageManager, { memory_id: 'nonexistent', section: 'test', item: { name: 'test' } })
      ).rejects.toThrow("Memory document 'nonexistent' not found")
    })

    it('should throw error when section not found', async () => {
      vi.mocked(storageManager.findSection).mockReturnValue(null)

      await expect(
        addToListTool(storageManager, { memory_id: 'test-memory', section: 'nonexistent', item: { name: 'test' } })
      ).rejects.toThrow("Section 'nonexistent' not found in memory document 'test-memory'")
    })
  })

  describe('Generic Item Formatting', () => {
    it('should format object with name field as heading', async () => {
      const item = {
        name: 'Split Rock Lighthouse',
        location: 'Two Harbors',
        duration: '2 hours',
        rating: 5
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Must-Visit Destinations',
        item
      })

      expect(vi.mocked(storageManager.updateSection)).toHaveBeenCalledWith(
        'test-memory',
        'Must-Visit Destinations',
        expect.stringContaining('### Split Rock Lighthouse ⭐⭐⭐⭐⭐'),
        'append'
      )

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('- **Location**: Two Harbors')
      expect(calledWith).toContain('- **Duration**: 2 hours')
    })

    it('should format object with title field as heading', async () => {
      const item = {
        title: 'Boundary Waters Canoe Trip',
        duration: '3 days',
        difficulty: 'Moderate'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Must-Visit Destinations',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Boundary Waters Canoe Trip')
      expect(calledWith).toContain('- **Duration**: 3 days')
      expect(calledWith).toContain('- **Difficulty**: Moderate')
    })

    it('should format object with destination field as heading', async () => {
      const item = {
        destination: 'Duluth',
        activities: 'Shopping, dining',
        stay: '1 night'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Must-Visit Destinations',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Duluth')
      expect(calledWith).toContain('- **Activities**: Shopping, dining')
      expect(calledWith).toContain('- **Stay**: 1 night')
    })

    it('should format string item as bullet point', async () => {
      const item = 'Visit the Guthrie Theater'

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Must-Visit Destinations',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toBe('- Visit the Guthrie Theater')
    })

    it('should format object without title fields as key-value list', async () => {
      const item = {
        time: '2:00 PM',
        duration: '90 minutes',
        cost: '$25'
      }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Must-Visit Destinations',
        item
      })

      const calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('- **Time**: 2:00 PM')
      expect(calledWith).toContain('- **Duration**: 90 minutes')
      expect(calledWith).toContain('- **Cost**: $25')
      expect(calledWith).not.toContain('###') // No heading
    })

    it('should handle star ratings for various rating fields', async () => {
      const item1 = { name: 'Test 1', rating: 3 }
      const item2 = { name: 'Test 2', stars: 4 }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Must-Visit Destinations',
        item: item1
      })

      let calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Test 1 ⭐⭐⭐')

      vi.clearAllMocks()
      vi.mocked(storageManager.readMemory).mockResolvedValue(mockMemory)
      vi.mocked(storageManager.findSection).mockReturnValue(mockSection)

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Must-Visit Destinations',
        item: item2
      })

      calledWith = vi.mocked(storageManager.updateSection).mock.calls[0][2]
      expect(calledWith).toContain('### Test 2 ⭐⭐⭐⭐')
    })
  })

  describe('Storage Manager Integration', () => {
    it('should call updateSection with correct parameters', async () => {
      const item = { name: 'Test Destination', type: 'Museum' }

      await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Must-Visit Destinations',
        item
      })

      expect(storageManager.updateSection).toHaveBeenCalledWith(
        'test-memory',
        'Must-Visit Destinations',
        expect.stringContaining('### Test Destination'),
        'append'
      )
    })

    it('should return success message', async () => {
      const item = { name: 'Test Location' }

      const result = await addToListTool(storageManager, {
        memory_id: 'test-memory',
        section: 'Must-Visit Destinations',
        item
      })

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: expect.stringContaining('Successfully added item to Must-Visit Destinations')
        }]
      })
    })
  })
})