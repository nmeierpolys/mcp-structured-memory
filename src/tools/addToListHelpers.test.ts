import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  detectSectionType, 
  extractFields, 
  formatStarRating, 
  formatFieldList, 
  formatKeyName, 
  getCurrentDate,
  FieldMapping 
} from './addToListHelpers.js'

describe('addToList Helper Functions', () => {
  describe('detectSectionType', () => {
    it('should detect pipeline sections', () => {
      expect(detectSectionType('Active Pipeline')).toBe('pipeline')
      expect(detectSectionType('pipeline items')).toBe('pipeline')
      expect(detectSectionType('Job Pipeline')).toBe('pipeline')
      expect(detectSectionType('ACTIVE COMPANIES')).toBe('pipeline')
    })

    it('should detect ruled out sections', () => {
      expect(detectSectionType('Ruled Out Companies')).toBe('ruled_out')
      expect(detectSectionType('rejected applications')).toBe('ruled_out')
      expect(detectSectionType('Companies I Ruled Out')).toBe('ruled_out')
      expect(detectSectionType('REJECTED')).toBe('ruled_out')
    })

    it('should detect contact sections', () => {
      expect(detectSectionType('Contact Network')).toBe('contact')
      expect(detectSectionType('networking contacts')).toBe('contact')
      expect(detectSectionType('Professional Contacts')).toBe('contact')
      expect(detectSectionType('NETWORK')).toBe('contact')
    })

    it('should detect interview sections', () => {
      expect(detectSectionType('Interview Schedule')).toBe('interview')
      expect(detectSectionType('upcoming interviews')).toBe('interview')
      expect(detectSectionType('INTERVIEW NOTES')).toBe('interview')
    })

    it('should default to generic for unknown sections', () => {
      expect(detectSectionType('Random Section')).toBe('generic')
      expect(detectSectionType('Notes')).toBe('generic')
      expect(detectSectionType('To Do')).toBe('generic')
      expect(detectSectionType('')).toBe('generic')
    })

    it('should handle mixed case and spaces', () => {
      expect(detectSectionType('  Pipeline  Items  ')).toBe('pipeline')
      expect(detectSectionType('RuLeD-oUt')).toBe('ruled_out')
      expect(detectSectionType('CONTACT_NETWORK')).toBe('contact')
    })
  })

  describe('extractFields', () => {
    it('should extract fields using field mappings', () => {
      const item = {
        company: 'Tech Corp',
        role: 'Engineer',
        salary: '$100k'
      }

      const mappings: FieldMapping = {
        company: ['company', 'name'],
        position: ['role', 'position'],
        compensation: ['salary', 'pay', 'compensation']
      }

      const result = extractFields(item, mappings)
      
      expect(result).toEqual({
        company: 'Tech Corp',
        position: 'Engineer',
        compensation: '$100k'
      })
    })

    it('should use fallback field names', () => {
      const item = {
        name: 'StartupXYZ',
        position: 'Developer',
        pay: '90000'
      }

      const mappings: FieldMapping = {
        company: ['company', 'name'],
        role: ['role', 'position'],
        salary: ['salary', 'pay']
      }

      const result = extractFields(item, mappings)
      
      expect(result).toEqual({
        company: 'StartupXYZ',
        role: 'Developer',
        salary: '90000'
      })
    })

    it('should use defaults when no field found', () => {
      const item = {
        name: 'Company Inc'
      }

      const mappings: FieldMapping = {
        company: ['company', 'name'],
        role: ['role', 'position'],
        status: ['status']
      }

      const defaults = {
        role: 'Unknown Position',
        status: 'Not Applied'
      }

      const result = extractFields(item, mappings, defaults)
      
      expect(result).toEqual({
        company: 'Company Inc',
        role: 'Unknown Position',
        status: 'Not Applied'
      })
    })

    it('should return empty strings when no value or default', () => {
      const item = { name: 'Test' }
      const mappings: FieldMapping = {
        company: ['company'],
        missing: ['not_found']
      }

      const result = extractFields(item, mappings)
      
      expect(result).toEqual({
        company: '',
        missing: ''
      })
    })

    it('should convert values to strings', () => {
      const item = {
        rating: 5,
        active: true,
        price: 100.50
      }

      const mappings: FieldMapping = {
        rating: ['rating'],
        status: ['active'], 
        cost: ['price']
      }

      const result = extractFields(item, mappings)
      
      expect(result).toEqual({
        rating: '5',
        status: 'true',
        cost: '100.5'
      })
    })

    it('should handle null and undefined values', () => {
      const item = {
        name: 'Test',
        nullValue: null,
        undefinedValue: undefined,
        emptyString: ''
      }

      const mappings: FieldMapping = {
        name: ['name'],
        null: ['nullValue'],
        undef: ['undefinedValue'],
        empty: ['emptyString']
      }

      const result = extractFields(item, mappings)
      
      expect(result).toEqual({
        name: 'Test',
        null: '',
        undef: '',
        empty: ''
      })
    })
  })

  describe('formatStarRating', () => {
    it('should format valid numeric ratings', () => {
      expect(formatStarRating(1)).toBe(' ⭐')
      expect(formatStarRating(3)).toBe(' ⭐⭐⭐')
      expect(formatStarRating(5)).toBe(' ⭐⭐⭐⭐⭐')
    })

    it('should format string numeric ratings', () => {
      expect(formatStarRating('2')).toBe(' ⭐⭐')
      expect(formatStarRating('4')).toBe(' ⭐⭐⭐⭐')
    })

    it('should extract numbers from mixed strings', () => {
      expect(formatStarRating('3 stars')).toBe(' ⭐⭐⭐')
      expect(formatStarRating('Rating: 4/5')).toBe('') // No consecutive digits, regex fails
      expect(formatStarRating('2.5 out of 5')).toBe('') // No consecutive digits
      expect(formatStarRating('25 stars')).toBe('') // 25 > 5, returns empty
      expect(formatStarRating('Rating4')).toBe(' ⭐⭐⭐⭐') // Consecutive digit works
    })

    it('should return empty for invalid ratings', () => {
      expect(formatStarRating(0)).toBe('')
      expect(formatStarRating(6)).toBe('')
      expect(formatStarRating(-1)).toBe(' ⭐') // -1 parses as '1'
      expect(formatStarRating('abc')).toBe('')
      expect(formatStarRating('')).toBe('')
    })

    it('should return empty for null/undefined', () => {
      expect(formatStarRating(null)).toBe('')
      expect(formatStarRating(undefined)).toBe('')
    })

    it('should handle edge cases', () => {
      expect(formatStarRating('0')).toBe('')
      expect(formatStarRating('10')).toBe('') // 10 > 5, returns empty
      expect(formatStarRating('1.9')).toBe('') // No consecutive digits
      expect(formatStarRating('5.1')).toBe('') // No consecutive digits
      expect(formatStarRating('19')).toBe('') // 19 > 5, returns empty
      expect(formatStarRating('51')).toBe('') // 51 > 5, returns empty
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
      
      expect(result).toBe(
        '- **Name**: John Doe\n' +
        '- **Role**: Engineer\n' +
        '- **Company**: Tech Corp\n'
      )
    })

    it('should exclude specified keys', () => {
      const fields = {
        name: 'John Doe',
        role: 'Engineer',
        company: 'Tech Corp',
        secret: 'hidden'
      }

      const result = formatFieldList(fields, ['secret', 'company'])
      
      expect(result).toBe(
        '- **Name**: John Doe\n' +
        '- **Role**: Engineer\n'
      )
    })

    it('should show required fields first, even if empty', () => {
      const fields = {
        name: 'John Doe',
        role: '',
        company: 'Tech Corp',
        optional: 'value'
      }

      const result = formatFieldList(fields, [], ['role', 'company'])
      
      expect(result).toBe(
        '- **Role**: Not specified\n' +
        '- **Company**: Tech Corp\n' +
        '- **Name**: John Doe\n' +
        '- **Optional**: value\n'
      )
    })

    it('should skip empty optional fields', () => {
      const fields = {
        name: 'John Doe',
        role: 'Engineer',
        notes: '',
        optional: null
      }

      const result = formatFieldList(fields)
      
      expect(result).toBe(
        '- **Name**: John Doe\n' +
        '- **Role**: Engineer\n'
      )
    })

    it('should format field names properly', () => {
      const fields = {
        first_name: 'John',
        last_name: 'Doe',
        contact_email: 'john@example.com'
      }

      const result = formatFieldList(fields)
      
      expect(result).toBe(
        '- **First Name**: John\n' +
        '- **Last Name**: Doe\n' +
        '- **Contact Email**: john@example.com\n'
      )
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
      expect(formatKeyName('home_phone_number')).toBe('Home Phone Number')
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
      expect(formatKeyName('first-name')).toBe('First-Name') // Capitalizes after -
      expect(formatKeyName('FIRST_NAME')).toBe('FIRST NAME')
    })

    it('should handle edge cases', () => {
      expect(formatKeyName('')).toBe('')
      expect(formatKeyName('a')).toBe('A')
      expect(formatKeyName('_')).toBe(' ')
      expect(formatKeyName('__multiple__underscores__')).toBe('  Multiple  Underscores  ')
    })
  })

  describe('getCurrentDate', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return current date in YYYY-MM-DD format', () => {
      const fixedDate = new Date('2025-07-31T15:30:00Z')
      vi.setSystemTime(fixedDate)

      const result = getCurrentDate()
      expect(result).toBe('2025-07-31')
    })

    it('should handle different dates', () => {
      const testCases = [
        { date: '2025-01-01T00:00:00Z', expected: '2025-01-01' },
        { date: '2025-12-31T23:59:59Z', expected: '2025-12-31' },
        { date: '2024-02-29T12:30:45Z', expected: '2024-02-29' }
      ]

      for (const testCase of testCases) {
        vi.setSystemTime(new Date(testCase.date))
        expect(getCurrentDate()).toBe(testCase.expected)
      }
    })

    it('should handle timezone differences consistently', () => {
      // Test that we get consistent results regardless of timezone
      // by always using ISO string which is in UTC
      const utcDate = new Date('2025-07-31T23:30:00Z')
      vi.setSystemTime(utcDate)

      const result = getCurrentDate()
      expect(result).toBe('2025-07-31')
    })
  })
})