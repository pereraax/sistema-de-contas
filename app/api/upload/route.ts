import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'
    const bucket = formData.get('bucket') as string || 'emprestimos' // Permitir especificar o bucket

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar tipo de arquivo para imagens de perfil
    const isImage = file.type.startsWith('image/')
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    
    if (bucket === 'avatares' || bucket === 'perfis') {
      if (!isImage) {
        return NextResponse.json({ error: 'Apenas imagens são permitidas para perfil' }, { status: 400 })
      }
      if (!allowedImageTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF' }, { status: 400 })
      }
      // Limite menor para imagens de perfil (2MB)
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Imagem muito grande. Máximo 2MB para perfil' }, { status: 400 })
      }
    } else {
      // Limite padrão para outros arquivos (10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB' }, { status: 400 })
      }
    }

    // Tentar usar admin client primeiro (bypassa RLS), se não disponível usa client normal
    const adminClient = createAdminClient()
    const supabase = adminClient || await createClient()

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Verificar se o bucket existe antes de fazer upload
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    let bucketToUse = bucket
    if (listError) {
      console.error('Erro ao listar buckets:', listError)
    } else {
      const bucketExists = buckets?.some(b => b.name === bucket)
      if (!bucketExists) {
        console.warn(`⚠️ Bucket "${bucket}" não encontrado. Buckets disponíveis:`, buckets?.map(b => b.name))
        
        // Se o bucket solicitado for "avatares" e não existir, tentar usar "emprestimos" como fallback
        if (bucket === 'avatares' || bucket === 'perfis') {
          const emprestimosExists = buckets?.some(b => b.name === 'emprestimos')
          if (emprestimosExists) {
            console.log('ℹ️ Usando bucket "emprestimos" como fallback para avatares')
            bucketToUse = 'emprestimos'
          } else {
            return NextResponse.json({ 
              error: `Bucket "${bucket}" não encontrado. Por favor, crie o bucket "avatares" no Supabase Storage (Dashboard > Storage > New bucket, nome: "avatares", público: sim).`,
              availableBuckets: buckets?.map(b => b.name) || [],
              details: 'O bucket "avatares" não existe. Crie-o no Supabase Dashboard.'
            }, { status: 404 })
          }
        } else {
          return NextResponse.json({ 
            error: `Bucket "${bucket}" não encontrado. Buckets disponíveis: ${buckets?.map(b => b.name).join(', ') || 'nenhum'}`,
            availableBuckets: buckets?.map(b => b.name) || []
          }, { status: 404 })
        }
      }
    }

    // Upload para Supabase Storage (usando bucketToUse que pode ser o fallback)
    const { data, error } = await supabase.storage
      .from(bucketToUse)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Erro no upload:', error)
      // Se o erro for "Bucket not found", dar mensagem mais clara
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        return NextResponse.json({ 
          error: `Bucket "${bucket}" não encontrado. Por favor, crie o bucket "avatares" no Supabase Storage (Dashboard > Storage > New bucket).`,
          details: error.message
        }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucketToUse)
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      url: publicUrl, 
      path: filePath,
      bucket: bucketToUse,
      ...(bucketToUse !== bucket && { warning: `Bucket "${bucket}" não encontrado, usando "${bucketToUse}" como fallback` })
    })
  } catch (error: any) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json({ error: error.message || 'Erro ao fazer upload' }, { status: 500 })
  }
}





