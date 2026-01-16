# ⚠️ PROPOSTA ATUALIZADA - Ver PROPOSAL-FACEBOOK-PIXEL-ADMIN.md

**Esta proposta foi atualizada!** 

O Pixel do Facebook será configurado no **Painel Admin** (não nas configurações do usuário).

Ver arquivo: `PROPOSAL-FACEBOOK-PIXEL-ADMIN.md` para a proposta correta.

---

# Proposta: Implementação do Facebook Pixel - Versão Segura (ANTIGA)

## 📋 Análise do Código Atual

O código já tem um padrão estabelecido para componentes de tracking:
- **VisitorTrackingWrapper**: Componente client-side simples que retorna `null`
- Importado dinamicamente com `ssr: false` no layout
- Usa um hook customizado para a lógica

## ✅ Solução Proposta (Seguindo o Padrão Existente)

### Estrutura Segura:

```
1. Hook: hooks/useFacebookPixel.ts
   - Lógica isolada em um hook
   - Tratamento de erros robusto
   - Não quebra se a coluna não existir

2. Componente: components/FacebookPixelWrapper.tsx
   - Componente simples que retorna null
   - Usa o hook useFacebookPixel
   - Segue o mesmo padrão do VisitorTrackingWrapper

3. Integração no Layout:
   - Import dinâmico com ssr: false
   - Mesmo padrão dos outros componentes
   - Não afeta SSR/SSG
```

## 🔒 Garantias de Segurança

1. **Isolamento Total**: 
   - Componente retorna `null` (não renderiza nada)
   - Erros são capturados e silenciados
   - Não afeta o fluxo principal da aplicação

2. **Tratamento de Erros**:
   - Se a coluna não existir no banco → silencioso
   - Se o usuário não estiver autenticado → silencioso
   - Se houver erro no script → silencioso

3. **Performance**:
   - Carregado apenas no cliente (ssr: false)
   - Lazy loading (só carrega quando necessário)
   - Não bloqueia renderização

4. **Compatibilidade**:
   - Funciona mesmo se a coluna não existir
   - Não quebra build
   - Não quebra SSR

## 📝 Implementação Proposta

### Arquivo 1: `hooks/useFacebookPixel.ts`
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useFacebookPixel() {
  const [pixelId, setPixelId] = useState<string | null>(null)

  useEffect(() => {
    // Só executa no cliente
    if (typeof window === 'undefined') return

    const carregarPixel = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('facebook_pixel_id')
          .eq('id', user.id)
          .single()

        // Silenciar erro se coluna não existir (PGRST116 = não encontrado)
        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar Pixel ID:', error)
          return
        }

        if (profile?.facebook_pixel_id) {
          setPixelId(profile.facebook_pixel_id)
        }
      } catch (error) {
        // Silenciar todos os erros para não quebrar a aplicação
        console.error('Erro ao carregar Pixel ID:', error)
      }
    }

    carregarPixel()
  }, [])

  useEffect(() => {
    if (!pixelId || typeof window === 'undefined') return

    try {
      // Verificar se fbq já existe
      if (window.fbq) {
        window.fbq('init', pixelId)
        window.fbq('track', 'PageView')
        return
      }

      // Carregar script do Facebook Pixel
      const script = document.createElement('script')
      script.id = 'facebook-pixel-script'
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      
      script.onload = () => {
        if (!window.fbq) {
          window.fbq = function() {
            (window.fbq.q = window.fbq.q || []).push(arguments)
          }
          window.fbq.l = +new Date()
          window.fbq.version = '2.0'
        }
        window.fbq('init', pixelId)
        window.fbq('track', 'PageView')
      }

      script.onerror = () => {
        // Silenciar erro de carregamento
        console.error('Erro ao carregar script do Facebook Pixel')
      }

      document.head.appendChild(script)
    } catch (error) {
      // Silenciar erros para não quebrar a aplicação
      console.error('Erro ao inicializar Facebook Pixel:', error)
    }
  }, [pixelId])
}

declare global {
  interface Window {
    fbq?: any
  }
}
```

### Arquivo 2: `components/FacebookPixelWrapper.tsx`
```typescript
'use client'

import { useFacebookPixel } from '@/hooks/useFacebookPixel'

export default function FacebookPixelWrapper() {
  useFacebookPixel()
  return null // Não renderiza nada, apenas executa o hook
}
```

### Modificação no Layout: `app/layout.tsx`
```typescript
// Adicionar junto com os outros imports dinâmicos
const FacebookPixelWrapper = dynamicImport(() => import('@/components/FacebookPixelWrapper'), {
  ssr: false,
  loading: () => null,
})

// No body, adicionar após NotificationPopup
<NotificationPopup />
<FacebookPixelWrapper />
```

## 🎯 Vantagens desta Abordagem

1. **Mesmo padrão do VisitorTrackingWrapper** → Consistência
2. **Isolamento total** → Não afeta outros componentes
3. **Tratamento de erros robusto** → Não quebra a aplicação
4. **Performance** → Lazy loading, não bloqueia renderização
5. **Compatibilidade** → Funciona mesmo sem a coluna no banco
6. **Manutenibilidade** → Código limpo e organizado

## 🎨 Interface de Configuração

### Onde ficará:
**Configurações → Nova aba "Pixel do Facebook"**

### Como funcionará:

1. **Localização**: 
   - Menu: `Configurações` (mesmo lugar onde está Perfil, Usuários, etc.)
   - Nova aba: "Pixel do Facebook" (com ícone BarChart3)
   - Cada usuário configura seu próprio Pixel ID

2. **Interface**:
   ```
   ┌─────────────────────────────────────┐
   │ Pixel do Facebook                   │
   ├─────────────────────────────────────┤
   │                                     │
   │ Pixel ID do Facebook:               │
   │ ┌─────────────────────────────┐   │
   │ │ 123456789012345  [Editar]   │   │
   │ └─────────────────────────────┘   │
   │                                     │
   │ ✓ Pixel do Facebook ativo           │
   │                                     │
   │ ┌─────────────────────────────────┐│
   │ │ 💡 Como encontrar seu Pixel ID  ││
   │ │ 1. Acesse o Gerenciador de      ││
   │ │    Eventos do Facebook          ││
   │ │ 2. Selecione seu Pixel          ││
   │ │ 3. Vá em Configurações          ││
   │ │ 4. Copie o ID do Pixel          ││
   │ └─────────────────────────────────┘│
   └─────────────────────────────────────┘
   ```

3. **Funcionalidades**:
   - Campo para inserir/editar Pixel ID
   - Validação (apenas números)
   - Botão "Salvar" e "Cancelar"
   - Indicador visual quando está ativo
   - Instruções de como encontrar o Pixel ID

4. **Fluxo Completo**:
   ```
   Usuário → Configurações → Pixel do Facebook
   ↓
   Insere Pixel ID → Salva
   ↓
   Sistema salva no banco (profiles.facebook_pixel_id)
   ↓
   Hook useFacebookPixel carrega o ID
   ↓
   Script do Facebook é carregado automaticamente
   ↓
   Pixel começa a rastrear conversões
   ```

## ⚠️ Pontos de Atenção

1. **Coluna no Banco**: Precisa executar o SQL para adicionar a coluna
2. **Script do Facebook**: Carregado apenas quando há Pixel ID configurado
3. **Erros Silenciados**: Não aparecem para o usuário, apenas no console
4. **Cada usuário tem seu Pixel**: Cada conta pode ter seu próprio Pixel ID

## 🧪 Teste Seguro

Antes de implementar, podemos:
1. Criar os arquivos
2. Testar o build
3. Verificar se não quebra nada
4. Só então adicionar no layout

---

**Esta abordagem é 100% segura porque:**
- Segue o padrão já estabelecido no código
- Tem tratamento de erros em todas as camadas
- Não afeta o fluxo principal da aplicação
- É opcional (não obrigatório para funcionamento)

