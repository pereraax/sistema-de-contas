import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPassword } from '@/lib/admin-auth'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Usar .maybeSingle() em vez de .single() para evitar erro quando não há resultado
    const { data: admins, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .limit(1)

    console.log('Admins encontrados:', admins?.length || 0)
    console.log('Erro ao buscar:', fetchError)

    if (fetchError) {
      console.error('Erro ao buscar admin:', fetchError)
      return NextResponse.json(
        { error: `Erro ao buscar usuário: ${fetchError.message}` },
        { status: 500 }
      )
    }

    // Verificar se encontrou algum admin
    if (!admins || admins.length === 0) {
      console.log('Admin não encontrado para email:', email)
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Pegar o primeiro admin (deve haver apenas um)
    const admin = admins[0]

    console.log('=== DEBUG LOGIN ===')
    console.log('Admin encontrado:', {
      id: admin.id,
      email: admin.email,
      hash_length: admin.password_hash?.length,
      hash_preview: admin.password_hash?.substring(0, 50) + '...',
      hash_full: admin.password_hash
    })

    console.log('Senha recebida:', password)
    console.log('Tipo da senha:', typeof password)
    console.log('Tamanho da senha:', password.length)
    
    // Verificar se o hash está vindo como Buffer ou string
    let hashToVerify = admin.password_hash
    if (Buffer.isBuffer(hashToVerify)) {
      hashToVerify = hashToVerify.toString('utf-8')
      console.log('Hash era Buffer, convertido para string')
    }
    
    // Limpar o hash (remover espaços, quebras de linha, etc)
    const cleanHash = hashToVerify.trim().replace(/\s+/g, '')
    console.log('Hash limpo:', cleanHash)
    console.log('Hash limpo length:', cleanHash.length)
    
    // Verificar se o hash está no formato correto (salt:hash)
    if (!cleanHash || !cleanHash.includes(':')) {
      console.error('Hash inválido no banco de dados')
      return NextResponse.json(
        { error: 'Erro na configuração do banco de dados' },
        { status: 500 }
      )
    }

    // Verificar manualmente primeiro
    const crypto = require('crypto')
    
    // Garantir que o hash está limpo (remover qualquer caractere não-hexadecimal exceto :)
    const sanitizedHash = cleanHash.replace(/[^a-f0-9:]/gi, '')
    const [salt, hash] = sanitizedHash.split(':')
    
    console.log('Hash sanitizado:', sanitizedHash)
    console.log('Salt extraído:', salt)
    console.log('Salt length:', salt.length)
    console.log('Hash extraído:', hash)
    console.log('Hash length:', hash.length)
    
    // Validar formato
    if (!salt || !hash || salt.length !== 32 || hash.length !== 128) {
      console.error('Hash em formato inválido:', { salt_length: salt?.length, hash_length: hash?.length })
      return NextResponse.json(
        { error: 'Erro na configuração do banco de dados' },
        { status: 500 }
      )
    }
    
    // Calcular hash
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    console.log('Hash calculado:', verifyHash)
    console.log('Hash calculado length:', verifyHash.length)
    console.log('Hashs são iguais?', hash === verifyHash)
    console.log('Primeiros 20 chars hash esperado:', hash.substring(0, 20))
    console.log('Primeiros 20 chars hash calculado:', verifyHash.substring(0, 20))
    
    const isValidPassword = hash === verifyHash
    
    if (!isValidPassword) {
      console.log('❌ SENHA INVÁLIDA')
      console.log('Comparação byte a byte:')
      for (let i = 0; i < Math.min(hash.length, verifyHash.length); i++) {
        if (hash[i] !== verifyHash[i]) {
          console.log(`Diferença na posição ${i}: esperado '${hash[i]}' (${hash.charCodeAt(i)}), recebido '${verifyHash[i]}' (${verifyHash.charCodeAt(i)})`)
          break
        }
      }
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }
    
    console.log('✅ SENHA VÁLIDA - Prosseguindo com criação do token...')

    // Criar JWT token
    const token = await new SignJWT({
      id: admin.id,
      email: admin.email,
      nome: admin.nome,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    // Retornar token (será salvo em cookie pelo cliente)
    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        nome: admin.nome,
      },
    })
  } catch (error: any) {
    console.error('Erro no login admin:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

