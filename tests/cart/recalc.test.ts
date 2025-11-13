import { describe, it, expect, beforeEach, vi } from 'vitest'
import { recalcCartPricesForUser } from '@/data/cart-recalc'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@/lib/auth'
import { getEffectivePriceCents } from '@/lib/pricing'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    cart: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  currentUser: vi.fn(),
}))

vi.mock('@/lib/pricing', () => ({
  getEffectivePriceCents: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('recalcCartPricesForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when user is not authenticated', async () => {
    vi.mocked(currentUser).mockResolvedValue(null)

    await expect(recalcCartPricesForUser()).rejects.toThrow('Unauthorized')
  })

  it('should throw error when user is not CLIENT role', async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: 'user1',
      email: 'agent@test.com',
      role: 'AGENT',
      clientId: null,
      name: 'Agent',
      agentCode: 'AGENT1',
      vendorId: null,
    })

    await expect(recalcCartPricesForUser()).rejects.toThrow(
      'Only CLIENT users can recalculate cart prices'
    )
  })

  it('should throw error when user has no clientId', async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: 'user1',
      email: 'client@test.com',
      role: 'CLIENT',
      clientId: null,
      name: 'Client',
      agentCode: null,
      vendorId: null,
    })

    await expect(recalcCartPricesForUser()).rejects.toThrow(
      'User does not have an associated client'
    )
  })

  it('should return empty diffs when cart is empty', async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: 'user1',
      email: 'client@test.com',
      role: 'CLIENT',
      clientId: 'client1',
      name: 'Client',
      agentCode: null,
      vendorId: null,
    })

    // Mock cart query with empty items
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: 'cart1',
      clientId: 'client1',
      createdByUserId: 'user1',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    } as any)

    const diffs = await recalcCartPricesForUser()

    expect(diffs).toEqual([])
  })

  it('should return empty diffs when no cart exists', async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: 'user1',
      email: 'client@test.com',
      role: 'CLIENT',
      clientId: 'client1',
      name: 'Client',
      agentCode: null,
      vendorId: null,
    })

    // Mock cart query to return null
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(null)

    const diffs = await recalcCartPricesForUser()

    expect(diffs).toEqual([])
  })

  it('should return diffs with unchanged prices', async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: 'user1',
      email: 'client@test.com',
      role: 'CLIENT',
      clientId: 'client1',
      name: 'Client',
      agentCode: null,
      vendorId: null,
    })

    vi.mocked(getEffectivePriceCents).mockResolvedValue(1000)

    const mockUpdate = vi.fn()

    // Mock cart query
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: 'cart1',
      clientId: 'client1',
      createdByUserId: 'user1',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item1',
          vendorProductId: 'vp1',
          unitPriceCents: 1000, // Same as current price
        },
      ],
    } as any)

    // Mock transaction
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        cartItem: {
          update: mockUpdate,
        },
      }
      return callback(tx)
    })

    const diffs = await recalcCartPricesForUser()

    expect(diffs).toHaveLength(1)
    expect(diffs[0]).toEqual({
      itemId: 'item1',
      oldPriceCents: 1000,
      newPriceCents: 1000,
    })

    // Should not update when price hasn't changed
    expect(mockUpdate).not.toHaveBeenCalled()

    // Verify getEffectivePriceCents was called with correct parameters
    expect(getEffectivePriceCents).toHaveBeenCalledWith({
      clientId: 'client1',
      vendorProductId: 'vp1',
    })
  })

  it('should return diffs with one price decrease', async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: 'user1',
      email: 'client@test.com',
      role: 'CLIENT',
      clientId: 'client1',
      name: 'Client',
      agentCode: null,
      vendorId: null,
    })

    vi.mocked(getEffectivePriceCents).mockResolvedValue(800) // Price decreased

    const mockUpdate = vi.fn()

    // Mock cart query
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: 'cart1',
      clientId: 'client1',
      createdByUserId: 'user1',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item1',
          vendorProductId: 'vp1',
          unitPriceCents: 1000, // Old price
        },
      ],
    } as any)

    // Mock transaction
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        cartItem: {
          update: mockUpdate,
        },
      }
      return callback(tx)
    })

    const diffs = await recalcCartPricesForUser()

    expect(diffs).toHaveLength(1)
    expect(diffs[0]).toEqual({
      itemId: 'item1',
      oldPriceCents: 1000,
      newPriceCents: 800,
    })

    // Should update the cart item with new price
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'item1' },
      data: {
        unitPriceCents: 800,
        updatedAt: expect.any(Date),
      },
    })

    // Verify getEffectivePriceCents was called with correct parameters
    expect(getEffectivePriceCents).toHaveBeenCalledWith({
      clientId: 'client1',
      vendorProductId: 'vp1',
    })
  })

  it('should return diffs with one price increase', async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: 'user1',
      email: 'client@test.com',
      role: 'CLIENT',
      clientId: 'client1',
      name: 'Client',
      agentCode: null,
      vendorId: null,
    })

    vi.mocked(getEffectivePriceCents).mockResolvedValue(1200) // Price increased

    const mockUpdate = vi.fn()

    // Mock cart query
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: 'cart1',
      clientId: 'client1',
      createdByUserId: 'user1',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item1',
          vendorProductId: 'vp1',
          unitPriceCents: 1000, // Old price
        },
      ],
    } as any)

    // Mock transaction
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        cartItem: {
          update: mockUpdate,
        },
      }
      return callback(tx)
    })

    const diffs = await recalcCartPricesForUser()

    expect(diffs).toHaveLength(1)
    expect(diffs[0]).toEqual({
      itemId: 'item1',
      oldPriceCents: 1000,
      newPriceCents: 1200,
    })

    // Should update the cart item with new price
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'item1' },
      data: {
        unitPriceCents: 1200,
        updatedAt: expect.any(Date),
      },
    })

    // Verify getEffectivePriceCents was called with correct parameters
    expect(getEffectivePriceCents).toHaveBeenCalledWith({
      clientId: 'client1',
      vendorProductId: 'vp1',
    })
  })

  it('should handle multiple items with mixed price changes', async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: 'user1',
      email: 'client@test.com',
      role: 'CLIENT',
      clientId: 'client1',
      name: 'Client',
      agentCode: null,
      vendorId: null,
    })

    // Mock different prices for different products
    vi.mocked(getEffectivePriceCents)
      .mockResolvedValueOnce(800) // item1: decreased
      .mockResolvedValueOnce(1500) // item2: increased
      .mockResolvedValueOnce(2000) // item3: unchanged

    const mockUpdate = vi.fn()

    // Mock cart query
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: 'cart1',
      clientId: 'client1',
      createdByUserId: 'user1',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item1',
          vendorProductId: 'vp1',
          unitPriceCents: 1000, // Will decrease to 800
        },
        {
          id: 'item2',
          vendorProductId: 'vp2',
          unitPriceCents: 1000, // Will increase to 1500
        },
        {
          id: 'item3',
          vendorProductId: 'vp3',
          unitPriceCents: 2000, // Will stay 2000
        },
      ],
    } as any)

    // Mock transaction
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        cartItem: {
          update: mockUpdate,
        },
      }
      return callback(tx)
    })

    const diffs = await recalcCartPricesForUser()

    expect(diffs).toHaveLength(3)
    expect(diffs[0]).toEqual({
      itemId: 'item1',
      oldPriceCents: 1000,
      newPriceCents: 800,
    })
    expect(diffs[1]).toEqual({
      itemId: 'item2',
      oldPriceCents: 1000,
      newPriceCents: 1500,
    })
    expect(diffs[2]).toEqual({
      itemId: 'item3',
      oldPriceCents: 2000,
      newPriceCents: 2000,
    })

    // Should update only items with changed prices (item1 and item2)
    expect(mockUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'item1' },
      data: {
        unitPriceCents: 800,
        updatedAt: expect.any(Date),
      },
    })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'item2' },
      data: {
        unitPriceCents: 1500,
        updatedAt: expect.any(Date),
      },
    })

    // Verify getEffectivePriceCents was called with correct parameters for each item
    expect(getEffectivePriceCents).toHaveBeenCalledWith({
      clientId: 'client1',
      vendorProductId: 'vp1',
    })
    expect(getEffectivePriceCents).toHaveBeenCalledWith({
      clientId: 'client1',
      vendorProductId: 'vp2',
    })
    expect(getEffectivePriceCents).toHaveBeenCalledWith({
      clientId: 'client1',
      vendorProductId: 'vp3',
    })
  })

  it('should correctly compute totals after recalculation', async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: 'user1',
      email: 'client@test.com',
      role: 'CLIENT',
      clientId: 'client1',
      name: 'Client',
      agentCode: null,
      vendorId: null,
    })

    // All prices decrease
    vi.mocked(getEffectivePriceCents)
      .mockResolvedValueOnce(900) // item1: 1000 -> 900
      .mockResolvedValueOnce(1800) // item2: 2000 -> 1800

    const mockUpdate = vi.fn()

    // Mock cart query
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: 'cart1',
      clientId: 'client1',
      createdByUserId: 'user1',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item1',
          vendorProductId: 'vp1',
          unitPriceCents: 1000,
        },
        {
          id: 'item2',
          vendorProductId: 'vp2',
          unitPriceCents: 2000,
        },
      ],
    } as any)

    // Mock transaction
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        cartItem: {
          update: mockUpdate,
        },
      }
      return callback(tx)
    })

    const diffs = await recalcCartPricesForUser()

    // Calculate total savings
    const totalOld = diffs.reduce((sum, diff) => sum + diff.oldPriceCents, 0)
    const totalNew = diffs.reduce((sum, diff) => sum + diff.newPriceCents, 0)
    const savings = totalOld - totalNew

    expect(totalOld).toBe(3000) // 1000 + 2000
    expect(totalNew).toBe(2700) // 900 + 1800
    expect(savings).toBe(300) // 10% average discount

    // Verify getEffectivePriceCents was called with correct parameters for each item
    expect(getEffectivePriceCents).toHaveBeenCalledWith({
      clientId: 'client1',
      vendorProductId: 'vp1',
    })
    expect(getEffectivePriceCents).toHaveBeenCalledWith({
      clientId: 'client1',
      vendorProductId: 'vp2',
    })
  })
})
