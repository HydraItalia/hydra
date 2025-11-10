import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calculateLineTotal, getEffectivePriceCents, getAvailability } from '../pricing'
import { prisma } from '../prisma'

// Mock prisma
vi.mock('../prisma', () => ({
  prisma: {
    vendorProduct: {
      findUnique: vi.fn(),
    },
    agreement: {
      findFirst: vi.fn(),
    },
  },
}))

describe('pricing utilities', () => {
  describe('calculateLineTotal', () => {
    it('should calculate correct line total', () => {
      expect(calculateLineTotal(5, 1000)).toBe(5000)
      expect(calculateLineTotal(10, 450)).toBe(4500)
      expect(calculateLineTotal(1, 9900)).toBe(9900)
    })

    it('should handle zero quantity', () => {
      expect(calculateLineTotal(0, 1000)).toBe(0)
    })

    it('should handle zero price', () => {
      expect(calculateLineTotal(5, 0)).toBe(0)
    })

    it('should reject negative quantity', () => {
      expect(() => calculateLineTotal(-1, 1000)).toThrow('Quantity cannot be negative')
    })

    it('should reject negative price', () => {
      expect(() => calculateLineTotal(5, -100)).toThrow('Unit price cannot be negative')
    })
  })

  describe('getEffectivePriceCents', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return base price when no agreement exists', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: 'vp1',
        vendorId: 'vendor1',
        productId: 'prod1',
        vendorSku: 'SKU-001',
        basePriceCents: 1000,
        currency: 'EUR',
        stockQty: 10,
        leadTimeDays: 2,
        minOrderQty: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue(null)

      const price = await getEffectivePriceCents({
        clientId: 'client1',
        vendorProductId: 'vp1',
      })

      expect(price).toBe(1000)
    })

    it('should return base price with BASE price mode', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: 'vp1',
        vendorId: 'vendor1',
        productId: 'prod1',
        vendorSku: 'SKU-001',
        basePriceCents: 1000,
        currency: 'EUR',
        stockQty: 10,
        leadTimeDays: 2,
        minOrderQty: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: 'agr1',
        clientId: 'client1',
        vendorId: 'vendor1',
        priceMode: 'BASE',
        discountPct: null,
        overridePriceCents: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      const price = await getEffectivePriceCents({
        clientId: 'client1',
        vendorProductId: 'vp1',
      })

      expect(price).toBe(1000)
    })

    it('should apply discount with DISCOUNT price mode', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: 'vp1',
        vendorId: 'vendor1',
        productId: 'prod1',
        vendorSku: 'SKU-001',
        basePriceCents: 1000,
        currency: 'EUR',
        stockQty: 10,
        leadTimeDays: 2,
        minOrderQty: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: 'agr1',
        clientId: 'client1',
        vendorId: 'vendor1',
        priceMode: 'DISCOUNT',
        discountPct: 0.10, // 10% discount
        overridePriceCents: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      const price = await getEffectivePriceCents({
        clientId: 'client1',
        vendorProductId: 'vp1',
      })

      expect(price).toBe(900) // 1000 - 10% = 900
    })

    it('should apply 25% discount correctly', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: 'vp1',
        vendorId: 'vendor1',
        productId: 'prod1',
        vendorSku: 'SKU-001',
        basePriceCents: 2000,
        currency: 'EUR',
        stockQty: 10,
        leadTimeDays: 2,
        minOrderQty: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: 'agr1',
        clientId: 'client1',
        vendorId: 'vendor1',
        priceMode: 'DISCOUNT',
        discountPct: 0.25, // 25% discount
        overridePriceCents: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      const price = await getEffectivePriceCents({
        clientId: 'client1',
        vendorProductId: 'vp1',
      })

      expect(price).toBe(1500) // 2000 - 25% = 1500
    })

    it('should use override price with OVERRIDE price mode', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: 'vp1',
        vendorId: 'vendor1',
        productId: 'prod1',
        vendorSku: 'SKU-001',
        basePriceCents: 1000,
        currency: 'EUR',
        stockQty: 10,
        leadTimeDays: 2,
        minOrderQty: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: 'agr1',
        clientId: 'client1',
        vendorId: 'vendor1',
        priceMode: 'OVERRIDE',
        discountPct: null,
        overridePriceCents: 750, // Fixed price
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      const price = await getEffectivePriceCents({
        clientId: 'client1',
        vendorProductId: 'vp1',
      })

      expect(price).toBe(750)
    })

    it('should throw error for DISCOUNT mode without discountPct', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: 'vp1',
        vendorId: 'vendor1',
        productId: 'prod1',
        vendorSku: 'SKU-001',
        basePriceCents: 1000,
        currency: 'EUR',
        stockQty: 10,
        leadTimeDays: 2,
        minOrderQty: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: 'agr1',
        clientId: 'client1',
        vendorId: 'vendor1',
        priceMode: 'DISCOUNT',
        discountPct: null, // Missing!
        overridePriceCents: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      await expect(
        getEffectivePriceCents({
          clientId: 'client1',
          vendorProductId: 'vp1',
        })
      ).rejects.toThrow('has DISCOUNT mode but no discountPct')
    })

    it('should throw error for OVERRIDE mode without overridePriceCents', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: 'vp1',
        vendorId: 'vendor1',
        productId: 'prod1',
        vendorSku: 'SKU-001',
        basePriceCents: 1000,
        currency: 'EUR',
        stockQty: 10,
        leadTimeDays: 2,
        minOrderQty: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: 'agr1',
        clientId: 'client1',
        vendorId: 'vendor1',
        priceMode: 'OVERRIDE',
        discountPct: null,
        overridePriceCents: null, // Missing!
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      await expect(
        getEffectivePriceCents({
          clientId: 'client1',
          vendorProductId: 'vp1',
        })
      ).rejects.toThrow('has OVERRIDE mode but no overridePriceCents')
    })

    it('should throw error for invalid discount percentage (> 50%)', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: 'vp1',
        vendorId: 'vendor1',
        productId: 'prod1',
        vendorSku: 'SKU-001',
        basePriceCents: 1000,
        currency: 'EUR',
        stockQty: 10,
        leadTimeDays: 2,
        minOrderQty: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: 'agr1',
        clientId: 'client1',
        vendorId: 'vendor1',
        priceMode: 'DISCOUNT',
        discountPct: 0.75, // 75% - too high!
        overridePriceCents: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      await expect(
        getEffectivePriceCents({
          clientId: 'client1',
          vendorProductId: 'vp1',
        })
      ).rejects.toThrow('invalid discountPct')
    })

    it('should throw error for negative override price', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: 'vp1',
        vendorId: 'vendor1',
        productId: 'prod1',
        vendorSku: 'SKU-001',
        basePriceCents: 1000,
        currency: 'EUR',
        stockQty: 10,
        leadTimeDays: 2,
        minOrderQty: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      vi.mocked(prisma.agreement.findFirst).mockResolvedValue({
        id: 'agr1',
        clientId: 'client1',
        vendorId: 'vendor1',
        priceMode: 'OVERRIDE',
        discountPct: null,
        overridePriceCents: -100, // Negative!
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      await expect(
        getEffectivePriceCents({
          clientId: 'client1',
          vendorProductId: 'vp1',
        })
      ).rejects.toThrow('invalid overridePriceCents')
    })

    it('should throw error when vendor product not found', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue(null)

      await expect(
        getEffectivePriceCents({
          clientId: 'client1',
          vendorProductId: 'nonexistent',
        })
      ).rejects.toThrow('VendorProduct nonexistent not found')
    })
  })

  describe('getAvailability', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return in stock when qty >= minOrderQty', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: 'vp1',
        vendorId: 'vendor1',
        productId: 'prod1',
        vendorSku: 'SKU-001',
        basePriceCents: 1000,
        currency: 'EUR',
        stockQty: 50,
        leadTimeDays: 2,
        minOrderQty: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      const availability = await getAvailability({ vendorProductId: 'vp1' })

      expect(availability).toEqual({
        inStock: true,
        stockQty: 50,
        leadTimeDays: 2,
      })
    })

    it('should return out of stock when qty < minOrderQty', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: 'vp1',
        vendorId: 'vendor1',
        productId: 'prod1',
        vendorSku: 'SKU-001',
        basePriceCents: 1000,
        currency: 'EUR',
        stockQty: 3,
        leadTimeDays: 2,
        minOrderQty: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      const availability = await getAvailability({ vendorProductId: 'vp1' })

      expect(availability).toEqual({
        inStock: false,
        stockQty: 3,
        leadTimeDays: 2,
      })
    })

    it('should default minOrderQty to 1 when null', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue({
        id: 'vp1',
        vendorId: 'vendor1',
        productId: 'prod1',
        vendorSku: 'SKU-001',
        basePriceCents: 1000,
        currency: 'EUR',
        stockQty: 5,
        leadTimeDays: 2,
        minOrderQty: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      const availability = await getAvailability({ vendorProductId: 'vp1' })

      expect(availability).toEqual({
        inStock: true,
        stockQty: 5,
        leadTimeDays: 2,
      })
    })

    it('should throw error when vendor product not found', async () => {
      vi.mocked(prisma.vendorProduct.findUnique).mockResolvedValue(null)

      await expect(
        getAvailability({ vendorProductId: 'nonexistent' })
      ).rejects.toThrow('VendorProduct nonexistent not found')
    })
  })
})
