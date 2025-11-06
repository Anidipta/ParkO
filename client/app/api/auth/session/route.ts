import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'

/**
 * GET /api/auth/session
 * Get current session information
 * Returns user data if authenticated, error otherwise
 */
export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req)

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user: session,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
