import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'

const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function verifyAdminToken(): Promise<{ id: string; email: string; nome: string } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, secret)
    
    return {
      id: payload.id as string,
      email: payload.email as string,
      nome: payload.nome as string,
    }
  } catch (error) {
    return null
  }
}

export async function requireAdmin() {
  const admin = await verifyAdminToken()
  
  if (!admin) {
    return NextResponse.redirect(new URL('/administracaosecr/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
  }
  
  return admin
}





