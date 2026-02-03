# 🔍 Diagnosticar Erro "Client-Side Exception"

## ✅ Correção Aplicada

Modifiquei o código para usar valores padrão como fallback se as variáveis do Supabase não estiverem configuradas. Isso deve fazer a aplicação funcionar mesmo se as variáveis não estiverem no build.

**O commit foi feito e está sendo deployado no Railway agora.**

## 🔄 Próximos Passos

### 1. Aguardar o Deploy (2-3 minutos)

O Railway está fazendo um novo deploy com a correção. Aguarde alguns minutos e teste novamente.

### 2. Verificar Variáveis no Railway

Mesmo com o fallback, você DEVE configurar as variáveis corretamente:

1. Vá em **Railway → Variables**
2. Verifique se TODAS estas variáveis estão configuradas:

```
✅ NODE_ENV = production
✅ NEXT_PUBLIC_SUPABASE_URL = https://frhxqgcqmxpjpnghsvoe.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ NEXT_PUBLIC_SITE_URL = https://plenipay.com
❌ NEXT_PUBLIC_APP_URL = https://plenipay.com ← ADICIONAR SE FALTAR
✅ PORT = 3000
```

### 3. Fazer Redeploy Após Adicionar Variáveis

**IMPORTANTE:** Se você adicionar ou modificar variáveis `NEXT_PUBLIC_*`, você DEVE fazer um redeploy:

1. Vá em **Railway → Deployments**
2. Clique nos **3 pontinhos** (⋯) no deployment mais recente
3. Selecione **"Redeploy"**

### 4. Verificar Console do Navegador

Se ainda der erro após o deploy:

1. Abra o site no navegador
2. Pressione **F12** para abrir o DevTools
3. Vá na aba **Console**
4. Procure por erros em vermelho
5. Me envie uma captura de tela dos erros

### 5. Verificar Build Logs no Railway

1. Vá em **Railway → Deployments**
2. Clique no deployment mais recente
3. Vá na aba **"Build Logs"**
4. Verifique se há erros durante o build
5. Procure por mensagens sobre variáveis de ambiente

## 🐛 Se Ainda Não Funcionar

Se após o deploy ainda der erro:

1. **Verifique os Build Logs** - veja se há erros durante o build
2. **Verifique os Deploy Logs** - veja se a aplicação está iniciando corretamente
3. **Abra o Console do Navegador** - veja o erro específico do JavaScript
4. **Me envie:**
   - Captura de tela do erro no navegador
   - Captura de tela do Console (F12)
   - Captura de tela dos Build Logs
   - Captura de tela dos Deploy Logs

## 📝 Nota sobre Variáveis NEXT_PUBLIC_*

Variáveis que começam com `NEXT_PUBLIC_` são **incluídas no build** do Next.js. Isso significa:

- Elas são "embutidas" no JavaScript durante o build
- Se você adicionar uma variável `NEXT_PUBLIC_*` sem fazer redeploy, ela não estará disponível
- Você **SEMPRE** precisa fazer redeploy após adicionar/modificar variáveis `NEXT_PUBLIC_*`

## ✅ Status Atual

- ✅ Código corrigido com fallback
- ✅ Commit feito e push para GitHub
- ⏳ Aguardando deploy no Railway
- ⏳ Aguardando você verificar/adicionar variáveis no Railway
