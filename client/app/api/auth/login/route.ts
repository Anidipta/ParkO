import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'
import { verifyPassword, createSessionToken, isValidEmail } from '@/lib/auth'
import { setSessionCookie } from '@/lib/session'

/**
 * POST /api/auth/login
 * Authenticate user and create session
 * 
 * Body: {
 *   email: string
 *   password: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('user_id, email, password_hash, full_name, user_type, is_active')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if account is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session token
    const sessionToken = createSessionToken({
      userId: user.user_id,
      email: user.email,
      userType: user.user_type,
      fullName: user.full_name,
    })

    // Return user data (without password_hash) and set session cookie
    const { password_hash, ...userData } = user

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: userData,
      },
      { status: 200 }
    )

    // Set session cookie
    return setSessionCookie(sessionToken, response)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    )
  }
}
