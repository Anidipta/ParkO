import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/session'

/**
 * POST /api/auth/logout
 * Clear session and logout user
 */
export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    )

    // Clear session cookie
    return clearSessionCookie(response)
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error during logout' },
      { status: 500 }
    )
  }
}
