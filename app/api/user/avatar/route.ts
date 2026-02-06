import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SIGNED_URL_EXPIRES = 60 * 60 // 1 hora

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new NextResponse(null, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('imagem_url')
      .eq('id', user.id)
      .single()

    const url = profile?.imagem_url?.trim()
    if (!url) {
      return new NextResponse(null, { status: 204 })
    }

    let imageUrl = url

    // Se a URL é do Supabase Storage, gerar signed URL (funciona com bucket público ou privado)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    if (url.startsWith(supabaseUrl) && url.includes('/storage/v1/object/')) {
      const admin = createAdminClient()
      if (admin) {
        const match = url.match(/\/storage\/v1\/object\/(?:public|authenticated)\/([^/]+)\/(.+)$/)
        if (match) {
          const [, bucket, path] = match
          const pathDecoded = decodeURIComponent(path)
          const { data: signed, error } = await admin.storage
            .from(bucket)
            .createSignedUrl(pathDecoded, SIGNED_URL_EXPIRES)
          const signedUrl = signed?.signedUrl ?? (signed as { signedURL?: string })?.signedURL
          if (!error && signedUrl) {
            imageUrl = signedUrl
          }
        }
      }
    }

    // Retornar a imagem em proxy (evita problemas de redirect em <img> e CORS)
    const res = await fetch(imageUrl, { cache: 'no-store' })
    if (!res.ok) {
      return new NextResponse(null, { status: 502 })
    }
    const blob = await res.blob()
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    console.error('[user/avatar] Erro:', err)
    return new NextResponse(null, { status: 500 })
  }
}
