import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin_token')
  
  if (adminToken) {
    redirect('/administracaosecr/dashboard')
  } else {
    redirect('/administracaosecr/login')
  }
}

