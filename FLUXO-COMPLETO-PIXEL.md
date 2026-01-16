# 📊 Fluxo Completo: Facebook Pixel na PLENIPAY

## 🎯 Visão Geral

O Pixel do Facebook será configurado **nas Configurações do Usuário** (não no painel admin), permitindo que cada usuário configure seu próprio Pixel ID.

## 📍 Onde ficará a interface?

### Localização:
```
Menu Principal → Configurações → Aba "Pixel do Facebook"
```

### Estrutura das Abas:
```
┌─────────────────────────────────────────────┐
│ [Usuários/Pessoas] [Perfil] [Pixel] [Baixar]│
└─────────────────────────────────────────────┘
```

## 🔄 Fluxo Completo Passo a Passo

### 1. **Usuário acessa Configurações**
   - Clica em "Configurações" no menu
   - Vê as abas: Usuários, Perfil, **Pixel do Facebook**, Baixar

### 2. **Usuário clica na aba "Pixel do Facebook"**
   - Interface mostra:
     - Campo para Pixel ID (vazio ou com valor atual)
     - Botão "Adicionar" ou "Editar"
     - Instruções de como encontrar o Pixel ID

### 3. **Usuário insere o Pixel ID**
   - Digita o ID (ex: `123456789012345`)
   - Sistema valida (apenas números)
   - Clica em "Salvar"

### 4. **Sistema salva no banco**
   - Atualiza `profiles.facebook_pixel_id` no Supabase
   - Mostra notificação de sucesso
   - Recarrega a página para aplicar

### 5. **Hook carrega automaticamente**
   - `useFacebookPixel` busca o ID do banco
   - Se encontrar, carrega o script do Facebook
   - Inicializa o Pixel automaticamente

### 6. **Pixel começa a rastrear**
   - Todas as páginas passam a ter o Pixel ativo
   - Conversões são rastreadas automaticamente
   - Dados vão para o Gerenciador de Eventos do Facebook

## 🎨 Interface Visual

### Estado Inicial (sem Pixel configurado):
```
┌─────────────────────────────────────────────┐
│ Pixel do Facebook                           │
├─────────────────────────────────────────────┤
│                                             │
│ Configure o Pixel do Facebook para          │
│ rastrear conversões e otimizar seus anúncios│
│                                             │
│ Pixel ID do Facebook:                       │
│ ┌───────────────────────────────────────┐   │
│ │ Nenhum Pixel ID configurado          │   │
│ └───────────────────────────────────────┘   │
│                    [Adicionar Pixel ID]      │
│                                             │
└─────────────────────────────────────────────┘
```

### Estado com Pixel configurado:
```
┌─────────────────────────────────────────────┐
│ Pixel do Facebook                           │
├─────────────────────────────────────────────┤
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
│ │ 2. Selecione seu Pixel ou crie um novo ││
│ │ 3. Vá em Configurações                  ││
│ │ 4. Copie o ID do Pixel (formato:       ││
│ │    apenas números)                      ││
│ │                                         ││
│ │ 📎 Link: business.facebook.com/events  ││
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### Modal de Edição:
```
┌─────────────────────────────────────────────┐
│ Editar Pixel ID                             │
├─────────────────────────────────────────────┤
│                                             │
│ Pixel ID do Facebook:                       │
│ ┌───────────────────────────────────────┐   │
│ │ 123456789012345                      │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Ex: 123456789012345                         │
│                                             │
│ [Cancelar]              [Salvar]            │
└─────────────────────────────────────────────┘
```

## 🔧 Implementação Técnica

### Arquivos que serão criados/modificados:

1. **hooks/useFacebookPixel.ts** (NOVO)
   - Hook que carrega e inicializa o Pixel
   - Busca o ID do banco automaticamente

2. **components/FacebookPixelWrapper.tsx** (NOVO)
   - Componente wrapper que usa o hook
   - Adicionado no layout

3. **components/ConfiguracoesView.tsx** (MODIFICADO)
   - Nova aba "Pixel do Facebook"
   - Interface para adicionar/editar Pixel ID
   - Validação e salvamento

4. **app/layout.tsx** (MODIFICADO)
   - Adiciona FacebookPixelWrapper dinamicamente

5. **ADICIONAR-COLUNA-FACEBOOK-PIXEL.sql** (NOVO)
   - Script SQL para adicionar a coluna no banco

## ✅ Vantagens desta Abordagem

1. **Cada usuário tem seu Pixel**: Permite múltiplos usuários com Pixels diferentes
2. **Interface simples**: Mesmo padrão das outras configurações
3. **Automático**: Após salvar, o Pixel é carregado automaticamente
4. **Seguro**: Não quebra se não houver Pixel configurado
5. **Flexível**: Usuário pode editar ou remover quando quiser

## 🚀 Resumo

- **Onde**: Configurações → Aba "Pixel do Facebook"
- **Quem**: Cada usuário configura seu próprio Pixel
- **Como**: Interface simples com campo de texto e botão salvar
- **Quando**: Pixel carrega automaticamente após salvar
- **Por quê**: Rastrear conversões e otimizar anúncios no Facebook

