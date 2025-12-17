/**
 * Auth Route Runtime Debug Endpoint
 *
 * Tests if Auth.js routes can access Prisma/RDS.
 * This simulates what /api/auth/[...nextauth] does.
 *
 * DELETE THIS FILE after migration is verified working.
 */

// Force Node.js runtime
export const runtime = 'nodejs'

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {} as Record<string, any>,
  }

  // Test 1: Runtime type
  results.tests.runtime = {
    isNode: typeof process !== 'undefined',
    isEdge: typeof (globalThis as any).EdgeRuntime !== 'undefined',
    nodeVersion: typeof process !== 'undefined' ? process.version : null,
  }

  // Test 2: Can import Prisma
  try {
    await import('@prisma/client')
    results.tests.prismaImport = { success: true }
  } catch (error: any) {
    results.tests.prismaImport = { success: false, error: error.message }
  }

  // Test 3: Can query database (what auth callback does)
  try {
    const { prisma } = await import('@/lib/prisma')

    const testUser = await prisma.user.findFirst({
      where: {
        email: 'admin@hydra.local',
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    results.tests.authCallback = {
      success: !!testUser,
      userFound: !!testUser,
      userRole: testUser?.role,
      message: testUser
        ? 'Auth callback can access RDS successfully'
        : 'No test user found',
    }
  } catch (error: any) {
    results.tests.authCallback = {
      success: false,
      error: error.message,
      message: 'Auth callback FAILED to access RDS',
    }
  }

  // Test 4: Check DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL || ''
  results.tests.databaseConfig = {
    hasUrl: !!dbUrl,
    isRDS: dbUrl.includes('rds.amazonaws.com'),
    hasSSL: dbUrl.includes('sslmode'),
    sslMode: dbUrl.match(/sslmode=([^&]+)/)?.[1] || 'not set',
  }

  // Overall status
  const allTestsPassed =
    results.tests.runtime.isNode &&
    results.tests.prismaImport?.success &&
    results.tests.authCallback?.success

  return Response.json(
    {
      ...results,
      status: allTestsPassed ? 'PASS' : 'FAIL',
      message: allTestsPassed
        ? '✅ Auth route CAN access RDS - ready for production'
        : '❌ Auth route CANNOT access RDS - check errors above',
    },
    { status: allTestsPassed ? 200 : 500 }
  )
}
