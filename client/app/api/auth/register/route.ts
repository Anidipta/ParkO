import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'
import { hashPassword, isValidEmail, validatePasswordStrength, isValidPhone, createSessionToken } from '@/lib/auth'
import { setSessionCookie } from '@/lib/session'

/**
 * POST /api/auth/register
 * Register a new user (driver or owner)
 * 
 * Body: {
 *   email: string
 *   password: string
 *   fullName: string
 *   phone?: string
 *   userType: 'driver' | 'owner'
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, fullName, phone, userType, licenseNumber, plateNumber, panNumber } = body

    // Validation
    if (!email || !password || !fullName || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, fullName, userType' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    if (!['driver', 'owner'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type. Must be "driver" or "owner"' },
        { status: 400 }
      )
    }

    // For drivers, require all 3 documents
    if (userType === 'driver') {
      if (!licenseNumber || !plateNumber || !panNumber) {
        return NextResponse.json(
          { error: 'Drivers must provide license number, plate number, and PAN ID' },
          { status: 400 }
        )
      }
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone: phone || null,
        user_type: userType,
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // If driver, create driver profile with documents
    if (userType === 'driver') {
      const { error: profileError } = await supabaseAdmin
        .from('driver_profiles')
        .insert({ 
          user_id: newUser.user_id,
          license_number: licenseNumber || null,
          plate_number: plateNumber || null,
          pan_card_number: panNumber || null,
        })

      if (profileError) {
        console.error('Error creating driver profile:', profileError)
        // Don't fail the request, profile can be created later
      }
    }

    // Return user data (without password_hash) and set session cookie
    const { password_hash, ...userData } = newUser

    // Create session token (automatically log in the user after registration)
    const sessionToken = createSessionToken({
      userId: newUser.user_id,
      email: newUser.email,
      userType: newUser.user_type,
      fullName: newUser.full_name,
    })

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: userData,
      },
      { status: 201 }
    )

    // Set session cookie
    return setSessionCookie(sessionToken, response)
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    )
  }
}
