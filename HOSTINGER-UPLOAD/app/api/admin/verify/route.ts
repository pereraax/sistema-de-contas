import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    
    return NextResponse.json({ valid: true, admin: payload })
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }
}





