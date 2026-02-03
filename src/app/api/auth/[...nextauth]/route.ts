// Force Node.js runtime — Prisma (used in auth callbacks + demo credentials
// provider) cannot run in Edge Runtime.
export const runtime = "nodejs";

export { GET, POST } from '../../../../../auth'
