# 🔧 COMO RESOLVER O BUG DO SUPABASE

## ✅ SOLUÇÃO IMPLEMENTADA

O código agora **BLOQUEIA o envio de email** se detectar que o link terá URL incorreta (`0.0.0.0:10000`).

**Isso significa que:**
- ✅ O sistema detecta o problema **ANTES** de enviar o email
- ✅ Retorna erro claro com instruções passo a passo
- ✅ Evita enviar email com link incorreto

---

## 📋 PASSOS PARA RESOLVER

### **PASSO 1: Acessar Supabase Dashboard**

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Authentication** → **URL Configuration**

**Link direto:** `https://app.supabase.com/project/[SEU-PROJETO]/auth/url-configuration`

---

### **PASSO 2: Corrigir Site URL**

1. **Encontre o campo "Site URL"**
2. **Verifique o valor atual:**
   - ❌ Se estiver como `0.0.0.0:10000` → **MUDE**
   - ❌ Se estiver vazio → **COLOQUE**
   - ✅ Deve ser: `https://plenipay.com` (sem barra final)

3. **IMPORTANTE:**
   - ✅ Use `https://plenipay.com` (sem barra final)
   - ❌ NÃO use `https://plenipay.com/`
   - ❌ NÃO use `http://plenipay.com` (deve ser HTTPS)
   - ❌ NÃO use `0.0.0.0:10000`

4. **SALVE** as alterações

---

### **PASSO 3: Verificar Redirect URLs**

Na mesma página, verifique as **Redirect URLs**:

- ✅ Deve ter: `https://plenipay.com/**`
- ✅ Deve ter: `https://plenipay.com/auth/callback`
- ✅ Pode ter: `http://localhost:3000/**` (para desenvolvimento)

**Se não tiver, adicione e SALVE.**

---

### **PASSO 4: Verificar Template de Email (CRÍTICO)**

1. Acesse: **Authentication** → **Email Templates** → **"Confirm signup"**
2. Clique na aba **"Source"** (código HTML)
3. **PROCURE POR:**
   - ✅ `{{ .ConfirmationURL }}` = **CORRETO** (deve ter)
   - ❌ `{{ .SiteURL }}` = **ERRADO** (remove se encontrar)

**Se encontrar `{{ .SiteURL }}`:**
1. Abra o arquivo `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` no projeto
2. Copie **TODO** o conteúdo
3. Cole no campo "Source" do template
4. **SALVE**

---

### **PASSO 5: Aguardar e Testar**

1. **Aguarde 2-3 minutos** após salvar (Supabase precisa processar)
2. **Crie uma NOVA conta** para testar (não use link antigo)
3. **Verifique o email** de confirmação
4. **O link deve ter:** `https://plenipay.com/auth/callback...`

---

## 🔍 COMO VERIFICAR SE ESTÁ CORRETO

### **Método 1: Verificar no Código**

Quando você tentar criar uma conta, o sistema vai:
1. Gerar o link primeiro (sem enviar email)
2. Verificar se o link tem `plenipay.com`
3. Se tiver `0.0.0.0:10000`, **BLOQUEAR** e retornar erro

**Se você receber um erro dizendo "Link de confirmação está usando URL incorreta":**
- ✅ O sistema detectou o problema
- ✅ Siga as instruções no erro para corrigir
- ✅ Tente novamente após corrigir

### **Método 2: Verificar Logs do Servidor**

Procure nos logs por:
```
📧 Link gerado via Admin API: ...
```

Se o link contém `plenipay.com` → ✅ Está correto
Se o link contém `0.0.0.0:10000` → ❌ Precisa corrigir Site URL

---

## 🐛 POR QUE ISSO ACONTECE?

Há um **bug conhecido no Supabase** (issue #802) onde:
- O método `resend()` **ignora** o parâmetro `emailRedirectTo`
- Usa apenas a **Site URL** configurada no dashboard
- Se a Site URL estiver errada, o link será gerado com URL errada

**Workaround:**
- Configurar Site URL corretamente no Supabase Dashboard
- Usar `{{ .ConfirmationURL }}` no template de email

---

## ✅ CHECKLIST FINAL

Antes de tentar criar conta novamente, verifique:

- [ ] Site URL no Supabase = `https://plenipay.com` (sem barra final)
- [ ] Template de email usa `{{ .ConfirmationURL }}` (não `{{ .SiteURL }}`)
- [ ] Redirect URLs incluem `https://plenipay.com/**`
- [ ] Aguardou 2-3 minutos após salvar
- [ ] Criou uma NOVA conta para testar (não use link antigo)

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. **Limpe o cache do navegador**
2. **Aguarde mais tempo** (5-10 minutos) após salvar
3. **Tente apagar e recolocar** a Site URL:
   - Apague a Site URL (deixe vazio)
   - SALVE
   - Aguarde 1 minuto
   - Coloque `https://plenipay.com`
   - SALVE
4. **Verifique os logs do servidor** para ver qual URL está sendo gerada
5. **Teste manualmente no Supabase:**
   - Authentication → Users → Selecione usuário
   - Clique em "Send password recovery"
   - Veja qual URL é gerada no email

---

## 📝 RESUMO

- ✅ O código está **CORRETO** e detecta o problema antes de enviar
- ❌ Há um **bug conhecido** no Supabase onde `resend()` ignora `emailRedirectTo`
- 🔧 **Solução:** Configurar Site URL corretamente no Supabase Dashboard
- 🔧 **Solução:** Usar `{{ .ConfirmationURL }}` no template de email
- 🛡️ **Proteção:** O sistema agora **BLOQUEIA** envio se detectar URL incorreta

**O problema NÃO está no código, está no bug do Supabase. Mas agora o sistema detecta e bloqueia antes de enviar email com link incorreto.**
