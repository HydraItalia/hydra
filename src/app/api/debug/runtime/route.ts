/**
 * Runtime Detection Debug Endpoint
 *
 * Use this to verify which runtime the API route is using.
 * Can be safely deleted after RDS migration is confirmed working.
 */

// Force Node.js runtime for this debug endpoint
export const runtime = 'nodejs'

export async function GET() {
  try {
    // Check runtime environment
    const isNode = typeof process !== 'undefined'
    const isEdge = typeof (globalThis as any).EdgeRuntime !== 'undefined'

    // Attempt to import Node-specific module
    let canAccessNet = false
    try {
      await import('net')
      canAccessNet = true
    } catch {
      canAccessNet = false
    }

    // Test Prisma connection to RDS
    let prismaWorks = false
    let prismaError = null
    try {
      const { prisma } = await import('@/lib/prisma')
      const count = await prisma.user.count()
      prismaWorks = true

      return Response.json({
        runtime: isNode ? 'nodejs' : isEdge ? 'edge' : 'unknown',
        checks: {
          isNode,
          isEdge,
          canAccessNet,
          prismaWorks,
          userCount: count,
        },
        nodeVersion: isNode ? process.version : null,
        environment: isNode ? process.env.VERCEL_ENV : null,
        status: 'OK - RDS connection works!',
      })
    } catch (error: any) {
      prismaError = error.message

      return Response.json({
        runtime: isNode ? 'nodejs' : isEdge ? 'edge' : 'unknown',
        checks: {
          isNode,
          isEdge,
          canAccessNet,
          prismaWorks,
        },
        error: prismaError,
        status: 'ERROR - Cannot connect to RDS',
      }, { status: 500 })
    }
  } catch (error: any) {
    return Response.json({
      error: error.message,
      status: 'CRITICAL ERROR',
    }, { status: 500 })
  }
}
