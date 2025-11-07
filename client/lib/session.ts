import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, type SessionData } from './auth'
// Re-export createSessionToken for compatibility with older imports
export { createSessionToken } from './auth'

/**
 * Extract session token from request cookies
 * @param req - Next.js request object
 * @returns Session token string or null
 */
export function getSessionTokenFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get('session_token')?.value
  return token || null
}

/**
 * Verify the current session from request cookies
 * @param req - Next.js request object
 * @returns SessionData if valid, null otherwise
 */
export function getSessionFromRequest(req: NextRequest): SessionData | null {
  const token = getSessionTokenFromRequest(req)
  if (!token) return null
  return verifySessionToken(token)
}

/**
 * Create a response with session cookie set
 * @param token - JWT session token
 * @param response - Optional response to add cookie to
 * @returns Response with session cookie
 */
export function setSessionCookie(token: string, response?: NextResponse): NextResponse {
  const res = response || NextResponse.json({ success: true })
  
  res.cookies.set('session_token', token, {
    httpOnly: true, // Prevent client-side JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  
  return res
}

/**
 * Create a response that clears the session cookie
 * @param response - Optional response to clear cookie from
 * @returns Response with cleared session cookie
 */
export function clearSessionCookie(response?: NextResponse): NextResponse {
  const res = response || NextResponse.json({ success: true })
  
  res.cookies.set('session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  
  return res
}

/**
 * Middleware helper to require authentication
 * Returns error response if not authenticated
 * @param req - Next.js request object
 * @param allowedTypes - Optional array of allowed user types
 * @returns SessionData if authenticated, error response otherwise
 */
export function requireAuth(
  req: NextRequest,
  allowedTypes?: Array<'driver' | 'owner' | 'manager'>
): SessionData | NextResponse {
  const session = getSessionFromRequest(req)
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - Please log in' },
      { status: 401 }
    )
  }
  
  if (allowedTypes && !allowedTypes.includes(session.userType)) {
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
      { status: 403 }
    )
  }
  
  return session
}
