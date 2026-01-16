# 📊 Resumo: Facebook Pixel no Painel Admin

## 🎯 Como Funcionará

### 1. **Onde o Admin Configura**
```
Painel Admin → Menu Lateral → "Pixel do Facebook"
  └─> /administracaosecr/pixel
  └─> Interface para inserir Pixel ID
  └─> Botão "Salvar"
```

### 2. **Onde Fica Salvo**
```
Banco de Dados → Tabela: platform_config
  └─> key: 'facebook_pixel_id'
  └─> value: '123456789012345'
  └─> Apenas admin pode modificar
```

### 3. **Como Carrega Automaticamente**
```
Layout Principal → FacebookPixelWrapper
  └─> Hook: useFacebookPixel
      └─> Busca platform_config
      └─> Se encontrar Pixel ID
          └─> Carrega script do Facebook
          └─> Inicializa Pixel
```

## 🔒 Segurança

- ✅ Rota `/administracaosecr/pixel` protegida por middleware admin
- ✅ API `/api/admin/platform-config` protegida
- ✅ Usuários normais NÃO veem essa opção
- ✅ Pixel ID salvo em tabela separada (não em profiles)

## 📋 Estrutura de Arquivos

```
✅ CRIAR:
- CRIAR-TABELA-PLATFORM-CONFIG.sql
- app/administracaosecr/pixel/page.tsx
- app/api/admin/platform-config/route.ts
- hooks/useFacebookPixel.ts
- components/FacebookPixelWrapper.tsx

✏️ MODIFICAR:
- components/admin/AdminSidebar.tsx (adicionar item menu)
- app/layout.tsx (adicionar FacebookPixelWrapper)
```

## 🎨 Visual da Interface Admin

```
┌─────────────────────────────────────────────┐
│ Pixel do Facebook                           │
├─────────────────────────────────────────────┤
│                                             │
│ Pixel ID:                                   │
│ ┌───────────────────────────────────────┐   │
│ │ 123456789012345            [Editar]   │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ ✓ Pixel ativo                               │
│                                             │
│ 💡 Instruções de como encontrar o ID       │
│                                             │
│ [Salvar]                                    │
└─────────────────────────────────────────────┘
```

## ✅ Garantias

1. **Não quebra código** - Isolado, tratamento de erros
2. **Apenas admin** - Protegido por middleware
3. **Global** - Uma config para toda plataforma
4. **Automático** - Carrega após salvar
5. **Seguro** - Erros não afetam aplicação

---

**Pronto para implementar seguindo este padrão!**

