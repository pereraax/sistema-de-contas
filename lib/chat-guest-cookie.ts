import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'guest_chat'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 dias
const SECRET = process.env.CHAT_GUEST_SECRET || process.env.NEXTAUTH_SECRET || 'dev-guest-chat-secret'

function sign(email: string): string {
  const payload = Buffer.from(email, 'utf8').toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

function verify(value: string): string | null {
  const i = value.lastIndexOf('.')
  if (i <= 0) return null
  const payload = value.slice(0, i)
  const sig = value.slice(i + 1)
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  if (sig !== expected) return null
  try {
    return Buffer.from(payload, 'base64url').toString('utf8')
  } catch {
    return null
  }
}

export async function setGuestChatCookie(email: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, sign(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/'
  })
}

export async function getGuestEmailFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(COOKIE_NAME)?.value
  if (!value) return null
  return verify(value)
}

export async function clearGuestChatCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
