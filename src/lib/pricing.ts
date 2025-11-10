import { prisma } from './prisma'

/**
 * Get the effective price for a client and vendor product
 * Considers agreements and pricing modes:
 * - BASE: Use vendor's base price
 * - DISCOUNT: Apply percentage discount to base price
 * - OVERRIDE: Use custom override price
 */
export async function getEffectivePriceCents({
  clientId,
  vendorProductId,
}: {
  clientId: string
  vendorProductId: string
}): Promise<number> {
  // Fetch the vendor product
  const vendorProduct = await prisma.vendorProduct.findUnique({
    where: { id: vendorProductId },
    select: {
      basePriceCents: true,
      vendorId: true,
    },
  })

  if (!vendorProduct) {
    throw new Error(`VendorProduct ${vendorProductId} not found`)
  }

  // Check for agreement
  const agreement = await prisma.agreement.findFirst({
    where: {
      clientId,
      vendorId: vendorProduct.vendorId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'desc', // Most recent agreement takes precedence
    },
  })

  // No agreement = use base price
  if (!agreement) {
    return vendorProduct.basePriceCents
  }

  // Apply pricing mode
  switch (agreement.priceMode) {
    case 'BASE':
      return vendorProduct.basePriceCents

    case 'DISCOUNT':
      if (agreement.discountPct === null || agreement.discountPct === undefined) {
        throw new Error(
          `Agreement ${agreement.id} has DISCOUNT mode but no discountPct`
        )
      }
      // Validate discount is in valid range
      if (agreement.discountPct < 0 || agreement.discountPct > 0.5) {
        throw new Error(
          `Agreement ${agreement.id} has invalid discountPct: ${agreement.discountPct}`
        )
      }
      return Math.round(
        vendorProduct.basePriceCents * (1 - agreement.discountPct)
      )

    case 'OVERRIDE':
      if (
        agreement.overridePriceCents === null ||
        agreement.overridePriceCents === undefined
      ) {
        throw new Error(
          `Agreement ${agreement.id} has OVERRIDE mode but no overridePriceCents`
        )
      }
      if (agreement.overridePriceCents <= 0) {
        throw new Error(
          `Agreement ${agreement.id} has invalid overridePriceCents: ${agreement.overridePriceCents}`
        )
      }
      return agreement.overridePriceCents

    default:
      // Should never happen due to enum
      return vendorProduct.basePriceCents
  }
}

/**
 * Get availability information for a vendor product
 */
export async function getAvailability({
  vendorProductId,
}: {
  vendorProductId: string
}): Promise<{
  inStock: boolean
  stockQty: number
  leadTimeDays: number
}> {
  const vendorProduct = await prisma.vendorProduct.findUnique({
    where: { id: vendorProductId },
    select: {
      stockQty: true,
      leadTimeDays: true,
      minOrderQty: true,
    },
  })

  if (!vendorProduct) {
    throw new Error(`VendorProduct ${vendorProductId} not found`)
  }

  const minQty = vendorProduct.minOrderQty ?? 1

  return {
    inStock: vendorProduct.stockQty >= minQty,
    stockQty: vendorProduct.stockQty,
    leadTimeDays: vendorProduct.leadTimeDays,
  }
}

/**
 * Calculate line total for an order item
 */
export function calculateLineTotal(qty: number, unitPriceCents: number): number {
  if (qty < 0) {
    throw new Error('Quantity cannot be negative')
  }
  if (unitPriceCents < 0) {
    throw new Error('Unit price cannot be negative')
  }
  return qty * unitPriceCents
}
