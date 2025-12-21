# 🔍 VERIFICAR SMTP CONFIGURADO - Troubleshooting

## ✅ SUA CONFIGURAÇÃO ATUAL

Vejo que você já configurou:
- ✅ **Enable custom SMTP:** HABILITADO
- ✅ **Sender email:** `comercial@plenipay.com`
- ✅ **Sender name:** `PLENIPAY`
- ✅ **Host:** `smtp.hostinger.com`
- ✅ **Port:** `465`
- ✅ **Username:** `comercial@plenipay.com`
- ✅ **Minimum interval:** 60 segundos

---

## 🚨 PROBLEMA: Ainda não consegue criar contas

Mesmo com o SMTP configurado, o erro "Error sending confirmation email" pode aparecer por alguns motivos:

---

## 🔧 SOLUÇÃO 1: Verificar Email na Hostinger

### Passo 1: Confirmar que o email existe
1. Acesse o painel da Hostinger
2. Vá em: **Email** → **Gerenciar Emails**
3. Verifique se o email `comercial@plenipay.com` existe
4. Se não existir, **crie agora**

### Passo 2: Testar Login no Webmail
1. Acesse o webmail da Hostinger
2. Tente fazer login com:
   - **Email:** `comercial@plenipay.com`
   - **Senha:** A mesma que você colocou no campo Password do SMTP
3. **Se não conseguir fazer login:** A senha está errada ou o email não existe

---

## 🔧 SOLUÇÃO 2: Verificar Senha do SMTP

### O que verificar:
1. A senha no campo **Password** deve ser **EXATAMENTE** a mesma senha do email na Hostinger
2. **Sem espaços extras** no início ou fim
3. **Case-sensitive** (maiúsculas/minúsculas importam)

### Se a senha estiver errada:
1. Vá em: **Project Settings** → **Auth** → **SMTP Settings**
2. Clique no campo **Password**
3. Digite a senha correta novamente
4. **Salve**

---

## 🔧 SOLUÇÃO 3: Testar Porta Diferente

A porta `465` pode estar bloqueada. Vamos tentar a `587`:

### Passo 1: Alterar Porta
1. Vá em: **Project Settings** → **Auth** → **SMTP Settings**
2. No campo **Port number**, mude de `465` para `587`
3. **Salve**

### Passo 2: Testar
1. Tente criar uma nova conta
2. Se não funcionar, volte para `465` e continue troubleshooting

---

## 🔧 SOLUÇÃO 4: Verificar Logs do Supabase

### Passo 1: Acessar Logs
1. Vá em: **Authentication** → **Logs**
2. Procure por eventos recentes de "signup"
3. Clique no evento mais recente para ver detalhes

### Passo 2: Interpretar Erro
Procure por mensagens como:
- ❌ "Authentication failed" → Username ou Password incorretos
- ❌ "Connection timeout" → Porta ou Host incorretos
- ❌ "Host not found" → Host incorreto
- ❌ "SMTP error" → Problema geral de configuração

---

## 🔧 SOLUÇÃO 5: Desabilitar Confirmação de Email Temporariamente

Se você precisa criar contas **AGORA** enquanto corrige o SMTP:

### Passo 1: Desabilitar Confirmação
1. Vá em: **Authentication** → **URL Configuration**
2. Procure por: **"Enable email confirmations"**
3. **DESABILITE** (deixe desmarcado)
4. **Salve**

### Passo 2: Testar
1. Tente criar uma conta
2. Deve funcionar imediatamente!

**Depois você pode:**
- Corrigir o SMTP
- Reabilitar a confirmação de email

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Marque cada item após verificar:

- [ ] O email `comercial@plenipay.com` existe na Hostinger
- [ ] Consigo fazer login no webmail da Hostinger com as mesmas credenciais
- [ ] A senha no campo Password está correta (sem espaços extras)
- [ ] Testei trocar a porta de `465` para `587` (ou vice-versa)
- [ ] Verifiquei os logs do Supabase para ver o erro exato
- [ ] Se nada funcionar, desabilitei a confirmação de email temporariamente

---

## 🎯 TESTE RÁPIDO

### Teste 1: Verificar Email na Hostinger
1. Acesse: Painel Hostinger → Email → Gerenciar Emails
2. Confirme que `comercial@plenipay.com` existe
3. Se não existir, **crie agora**

### Teste 2: Testar Login no Webmail
1. Acesse o webmail da Hostinger
2. Email: `comercial@plenipay.com`
3. Senha: A mesma do campo Password do SMTP
4. **Se não conseguir:** Senha está errada ou email não existe

### Teste 3: Alterar Porta
1. Mude a porta de `465` para `587`
2. Salve
3. Tente criar conta novamente

### Teste 4: Verificar Logs
1. Authentication → Logs
2. Veja qual é o erro exato
3. Me mostre o erro

---

## 💡 DICA IMPORTANTE

**O problema mais comum é:**
1. ❌ Email não existe na Hostinger
2. ❌ Senha incorreta
3. ❌ Porta bloqueada

**Solução mais rápida:**
- Desabilite a confirmação de email temporariamente
- Crie suas contas
- Corrija o SMTP depois

---

## 📞 PRÓXIMOS PASSOS

1. **Teste fazer login no webmail da Hostinger** com `comercial@plenipay.com`
   - Se não conseguir → Email não existe ou senha está errada
   
2. **Verifique os logs do Supabase** (Authentication → Logs)
   - Veja qual é o erro exato do SMTP
   - Me mostre o erro

3. **Se precisar criar contas agora:**
   - Desabilite a confirmação de email
   - Crie as contas
   - Corrija o SMTP depois

---

## 🚀 SOLUÇÃO IMEDIATA

Se você precisa criar contas **AGORA**:

1. **Desabilite a confirmação de email:**
   - Authentication → URL Configuration
   - Desmarque "Enable email confirmations"
   - Salve

2. **Teste criar conta:**
   - Deve funcionar imediatamente!

3. **Depois, corrija o SMTP:**
   - Verifique se o email existe na Hostinger
   - Teste fazer login no webmail
   - Corrija a senha se necessário
   - Reabilite a confirmação de email

















