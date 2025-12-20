# 🔧 Corrigir Erro de Deploy no Netlify

## ❌ Erro Atual:
```
Error: Your publish directory was not found at: /opt/build/repo/.next
```

## 🔍 Causa do Problema:
O Netlify está configurado para usar `.next` como diretório de publicação, mas o plugin `@netlify/plugin-nextjs` gerencia isso automaticamente e não precisa (e não deve) ter um publish directory especificado.

## ✅ Solução:

### Passo 1: Remover Publish Directory no Netlify

1. **Acesse o Netlify Dashboard**
2. **Vá em:** `Site settings` → `Build & deploy` → `Build settings`
3. **Procure por:** `Publish directory` ou `Publish dir`
4. **DEIXE VAZIO** ou **REMOVA** qualquer valor (como `.next`)
5. **Salve as alterações**

### Passo 2: Verificar Build Command

1. **Na mesma página** (`Build & deploy` → `Build settings`)
2. **Verifique o Build command:**
   - Deve estar: `npm run build`
   - Ou pode estar vazio (o plugin gerencia automaticamente)
3. **Se estiver diferente, altere para:** `npm run build`

### Passo 3: Verificar Plugin Next.js

1. **Vá em:** `Site settings` → `Build & deploy` → `Plugins`
2. **Verifique se o plugin está instalado:**
   - `@netlify/plugin-nextjs`
3. **Se não estiver, adicione:**
   - Clique em `Add plugin`
   - Procure por `@netlify/plugin-nextjs`
   - Instale a versão mais recente

### Passo 4: Verificar Variáveis de Ambiente

1. **Vá em:** `Site settings` → `Environment variables`
2. **Verifique se todas as variáveis estão configuradas:**
   - Veja o arquivo `VARIAVEIS-AMBIENTE-NETLIFY.txt` para a lista completa

### Passo 5: Fazer Novo Deploy

1. **Após fazer as alterações acima:**
   - Vá em `Deploys`
   - Clique em `Trigger deploy` → `Deploy site`
   - Ou faça um commit vazio:
     ```bash
     git commit --allow-empty -m "Fix Netlify deploy config"
     git push origin main
     ```

## 📋 Configuração Correta:

### No Netlify Dashboard:
- **Build command:** `npm run build` (ou deixar vazio)
- **Publish directory:** **VAZIO** (deixar em branco)
- **Base directory:** (deixar vazio, a menos que o projeto esteja em subpasta)

### No arquivo `netlify.toml`:
✅ Já está configurado corretamente - o arquivo foi criado/atualizado

## ⚠️ Importante:

O plugin `@netlify/plugin-nextjs` **gerencia automaticamente**:
- O build do Next.js
- O diretório de publicação
- As funções serverless para rotas API
- As otimizações do Next.js

**NÃO** devemos especificar um publish directory manualmente quando usamos este plugin, pois isso causa conflito.

## 🔄 Se o Erro Persistir:

1. **Limpe o cache do Netlify:**
   - `Site settings` → `Build & deploy` → `Build settings`
   - Clique em `Clear cache and deploy site`

2. **Verifique os logs do build:**
   - Vá em `Deploys` → Clique no deploy que falhou
   - Veja os logs completos para identificar outros erros

3. **Verifique se o Node.js está na versão correta:**
   - O `netlify.toml` especifica Node 20
   - Verifique se o Netlify está usando essa versão
