import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Environment variables - ensure these are set in .env.local
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d' // Token expires in 7 days

export interface SessionData {
  userId: string
  email: string
  userType: 'driver' | 'owner' | 'manager'
  fullName: string
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Create a JWT session token
 * @param data - Session data to encode in the token
 * @returns JWT token string
 */
export function createSessionToken(data: SessionData): string {
  return jwt.sign(data, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Verify and decode a JWT session token
 * @param token - JWT token string
 * @returns Decoded session data or null if invalid
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionData
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns True if email is valid format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Requires: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
 * @param password - Password string to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' }
  }
  return { isValid: true }
}

/**
 * Validate phone number format (basic validation)
 * @param phone - Phone number string
 * @returns True if phone appears valid
 */
export function isValidPhone(phone: string): boolean {
  // Basic validation: 10-15 digits, may start with +
  const phoneRegex = /^\+?[0-9]{10,15}$/
  return phoneRegex.test(phone.replace(/[\s()-]/g, ''))
}
