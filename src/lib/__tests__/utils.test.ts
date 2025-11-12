import { describe, it, expect } from 'vitest'
import { cn, formatCurrency } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', { active: true, inactive: false })).toBe('base active')
    })

    it('should handle tailwind conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })
  })

  describe('formatCurrency', () => {
    it('should format cents to EUR', () => {
      expect(formatCurrency(1000)).toContain('10')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toContain('0')
    })

    it('should handle large amounts', () => {
      const formatted = formatCurrency(123456)
      // Italian locale: 1.234,56 € (123456 cents = 1234.56 EUR)
      expect(formatted).toMatch(/1[.,]234[.,]56/)
      expect(formatted).toContain('€')
    })
  })
})
