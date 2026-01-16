# Proposta: Facebook Pixel - Configuração no Painel Admin

## 🎯 Entendimento Correto

- ✅ **Pixel é GLOBAL** - Uma única configuração para toda a plataforma
- ✅ **Apenas Admin** - Configuração fica no painel de admin (`/administracaosecr/`)
- ✅ **Escondido de usuários** - Usuários normais NÃO veem essa opção
- ✅ **Configuração única** - Não é por usuário, é da plataforma inteira

## 📍 Onde ficará a interface?

### Localização:
```
Painel Admin → /administracaosecr/pixel
```

### Menu na Sidebar Admin:
```
┌─────────────────────────────────────┐
│ Admin Panel                         │
├─────────────────────────────────────┤
│ Dashboard                           │
│ Todos os Usuários                   │
│ Usuários Assinantes                 │
│ Central de Avisos                   │
│ Banners                             │
│ Chat de Suporte                     │
│ Tutoriais                           │
│ WhatsApp PLEN                       │
│ Pixel do Facebook  ← NOVO ITEM      │
│ Sair                                │
└─────────────────────────────────────┘
```

## 🗄️ Estrutura do Banco de Dados

### Tabela: `platform_config` (configurações globais)
```sql
CREATE TABLE IF NOT EXISTS platform_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,  -- Ex: 'facebook_pixel_id'
  value TEXT,                 -- Ex: '123456789012345'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir registro inicial
INSERT INTO platform_config (key, value, description)
VALUES ('facebook_pixel_id', NULL, 'ID do Pixel do Facebook para rastreamento global')
ON CONFLICT (key) DO NOTHING;
```

**Vantagens desta abordagem:**
- ✅ Escalável (pode adicionar outras configurações globais depois)
- ✅ Seguro (apenas admin acessa)
- ✅ Simples (uma tabela para todas as configs globais)

## 🔄 Fluxo Completo

### 1. **Admin acessa o painel**
   - Login em `/administracaosecr/login`
   - Vê o menu com "Pixel do Facebook"

### 2. **Admin clica em "Pixel do Facebook"**
   - Vai para `/administracaosecr/pixel`
   - Vê interface para configurar o Pixel ID

### 3. **Admin insere o Pixel ID**
   - Digita o ID (ex: `123456789012345`)
   - Clica em "Salvar"
   - Sistema salva em `platform_config`

### 4. **Pixel carrega automaticamente**
   - Hook `useFacebookPixel` busca de `platform_config`
   - Carrega o script do Facebook
   - Todos os usuários passam a ter o Pixel ativo

## 🎨 Interface no Painel Admin

### Página: `/administracaosecr/pixel`

```
┌─────────────────────────────────────────────┐
│ Pixel do Facebook                           │
├─────────────────────────────────────────────┤
│                                             │
│ Configure o Pixel do Facebook para         │
│ rastrear conversões em toda a plataforma   │
│                                             │
│ Pixel ID do Facebook:                       │
│ ┌───────────────────────────────────────┐   │
│ │ 123456789012345            [Editar]   │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ ✓ Pixel do Facebook ativo                   │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ 💡 Como encontrar seu Pixel ID          ││
│ │                                         ││
│ │ 1. Acesse o Gerenciador de Eventos do  ││
│ │    Facebook                             ││
│ │ 2. Selecione seu Pixel ou crie um novo  ││
│ │ 3. Vá em Configurações                  ││
│ │ 4. Copie o ID do Pixel                  ││
│ │                                         ││
│ │ 📎 Link: business.facebook.com/events  ││
│ └─────────────────────────────────────────┘│
│                                             │
│ [Salvar Configuração]                       │
└─────────────────────────────────────────────┘
```

## 📝 Implementação Técnica

### Arquivos que serão criados/modificados:

1. **SQL: `CRIAR-TABELA-PLATFORM-CONFIG.sql`** (NOVO)
   - Cria tabela `platform_config`
   - Insere registro inicial para Pixel

2. **app/administracaosecr/pixel/page.tsx** (NOVO)
   - Página de configuração do Pixel
   - Apenas admin pode acessar

3. **components/admin/AdminSidebar.tsx** (MODIFICADO)
   - Adiciona item "Pixel do Facebook" no menu

4. **hooks/useFacebookPixel.ts** (NOVO)
   - Busca Pixel ID de `platform_config` (não de profiles)
   - Carrega script do Facebook

5. **components/FacebookPixelWrapper.tsx** (NOVO)
   - Componente wrapper que usa o hook
   - Adicionado no layout principal

6. **app/layout.tsx** (MODIFICADO)
   - Adiciona FacebookPixelWrapper dinamicamente

## 🔒 Segurança

1. **Acesso Restrito**: 
   - Rota protegida por `AdminProtected`
   - Apenas admins autenticados acessam

2. **Dados Globais**:
   - Pixel ID salvo em `platform_config`
   - Não fica no perfil do usuário
   - Uma única configuração para toda a plataforma

3. **Isolamento**:
   - Hook não quebra se não houver Pixel configurado
   - Erros são silenciados
   - Não afeta outros componentes

## ✅ Vantagens desta Abordagem

1. **Segurança**: Apenas admin configura
2. **Simplicidade**: Uma configuração global
3. **Escalabilidade**: Pode adicionar outras configs depois
4. **Isolamento**: Não afeta código existente
5. **Performance**: Carregado apenas quando necessário

## 🚀 Resumo

- **Onde**: Painel Admin → `/administracaosecr/pixel`
- **Quem**: Apenas administradores
- **O que**: Configuração GLOBAL do Pixel
- **Como**: Interface simples no painel admin
- **Quando**: Pixel carrega automaticamente após salvar

