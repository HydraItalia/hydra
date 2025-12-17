/**
 * Auth.js Route Handler
 *
 * IMPORTANT: Must run on Node.js runtime (not Edge) because:
 * - Uses Prisma with AWS RDS PostgreSQL (requires TCP connections)
 * - Edge runtime cannot open TCP connections to RDS
 * - Neon worked on Edge because it supports HTTP/WebSocket
 */
export const runtime = 'nodejs'

export { GET, POST } from '../../../../../auth'
