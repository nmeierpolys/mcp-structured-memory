import { describe, it, expect } from 'vitest'
import { 
  formatGenericItem,
  formatFieldList, 
  formatKeyName
} from './addToListHelpers.js'

describe('addToList Helper Functions', () => {
  describe('formatGenericItem', () => {
    it('should format string items as bullet points', () => {
      expect(formatGenericItem('Simple text item')).toBe('- Simple text item')
    })

    it('should format objects with name field as headings', () => {
      const item = {
        name: 'Split Rock Lighthouse',
        location: 'Two Harbors',
        duration: '2 hours'
      }
      
      const result = formatGenericItem(item)
      expect(result).toContain('### Split Rock Lighthouse')
      expect(result).toContain('- **Location**: Two Harbors')
      expect(result).toContain('- **Duration**: 2 hours')
    })

    it('should format objects with title field as headings', () => {
      const item = {
        title: 'Museum Visit',
        cost: '$15',
        duration: '3 hours'
      }
      
      const result = formatGenericItem(item)
      expect(result).toContain('### Museum Visit')
      expect(result).toContain('- **Cost**: $15')
      expect(result).toContain('- **Duration**: 3 hours')
    })

    it('should format objects with destination field as headings', () => {
      const item = {
        destination: 'Duluth',
        activities: 'Shopping',
        stay: '1 night'
      }
      
      const result = formatGenericItem(item)
      expect(result).toContain('### Duluth')
      expect(result).toContain('- **Activities**: Shopping')
      expect(result).toContain('- **Stay**: 1 night')
    })

    it('should format objects with company field as headings', () => {
      const item = {
        company: 'Acme Corp',
        role: 'Engineer',
        status: 'Applied'
      }
      
      const result = formatGenericItem(item)
      expect(result).toContain('### Acme Corp')
      expect(result).toContain('- **Role**: Engineer')
      expect(result).toContain('- **Status**: Applied')
    })

    it('should add star ratings when rating field is present', () => {
      const item = {
        name: 'Great Restaurant',
        rating: 4,
        cuisine: 'Italian'
      }
      
      const result = formatGenericItem(item)
      expect(result).toContain('### Great Restaurant ⭐⭐⭐⭐')
      expect(result).toContain('- **Cuisine**: Italian')
    })

    it('should add star ratings when stars field is present', () => {
      const item = {
        name: 'Good Hotel',
        stars: 3,
        location: 'Downtown'
      }
      
      const result = formatGenericItem(item)
      expect(result).toContain('### Good Hotel ⭐⭐⭐')
      expect(result).toContain('- **Location**: Downtown')
    })

    it('should format objects without title fields as key-value lists', () => {
      const item = {
        time: '2:00 PM',
        duration: '90 minutes',
        cost: '$25'
      }
      
      const result = formatGenericItem(item)
      expect(result).toContain('- **Time**: 2:00 PM')
      expect(result).toContain('- **Duration**: 90 minutes')
      expect(result).toContain('- **Cost**: $25')
      expect(result).not.toContain('###')
    })

    it('should handle empty values by excluding them', () => {
      const item = {
        name: 'Test Item',
        description: 'Valid description',
        emptyField: '',
        nullField: null,
        undefinedField: undefined
      }
      
      const result = formatGenericItem(item)
      expect(result).toContain('### Test Item')
      expect(result).toContain('- **Description**: Valid description')
      expect(result).not.toContain('emptyField')
      expect(result).not.toContain('nullField')
      expect(result).not.toContain('undefinedField')
    })

    it('should handle non-string, non-object values', () => {
      expect(formatGenericItem(123)).toBe('- 123')
      expect(formatGenericItem(true)).toBe('- true')
    })
  })

  describe('formatFieldList', () => {
    it('should format basic field list', () => {
      const fields = {
        name: 'John Doe',
        role: 'Engineer',
        company: 'Tech Corp'
      }
      
      const result = formatFieldList(fields)
      expect(result).toBe('- **Name**: John Doe\n- **Role**: Engineer\n- **Company**: Tech Corp\n')
    })

    it('should skip empty optional fields', () => {
      const fields = {
        name: 'John Doe',
        role: 'Engineer',
        emptyField: '',
        company: 'Tech Corp'
      }
      
      const result = formatFieldList(fields)
      expect(result).toBe('- **Name**: John Doe\n- **Role**: Engineer\n- **Company**: Tech Corp\n')
      expect(result).not.toContain('emptyField')
    })

    it('should format field names properly', () => {
      const fields = {
        first_name: 'John',
        last_name: 'Doe',
        contact_email: 'john@example.com'
      }
      
      const result = formatFieldList(fields)
      expect(result).toContain('- **First Name**: John')
      expect(result).toContain('- **Last Name**: Doe')
      expect(result).toContain('- **Contact Email**: john@example.com')
    })

    it('should handle empty fields object', () => {
      const result = formatFieldList({})
      expect(result).toBe('')
    })
  })

  describe('formatKeyName', () => {
    it('should convert snake_case to Title Case', () => {
      expect(formatKeyName('first_name')).toBe('First Name')
      expect(formatKeyName('contact_email')).toBe('Contact Email')
      expect(formatKeyName('phone_number')).toBe('Phone Number')
    })

    it('should handle single words', () => {
      expect(formatKeyName('name')).toBe('Name')
      expect(formatKeyName('role')).toBe('Role')
      expect(formatKeyName('company')).toBe('Company')
    })

    it('should handle already formatted names', () => {
      expect(formatKeyName('Name')).toBe('Name')
      expect(formatKeyName('First Name')).toBe('First Name')
    })

    it('should handle mixed formats', () => {
      expect(formatKeyName('firstName')).toBe('FirstName')
      expect(formatKeyName('first-name')).toBe('First Name')
    })

    it('should handle edge cases', () => {
      expect(formatKeyName('')).toBe('')
      expect(formatKeyName('a')).toBe('A')
      expect(formatKeyName('_')).toBe(' ')
    })
  })
})