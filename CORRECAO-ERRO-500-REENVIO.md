# 🔧 Correção: Erro 500 no Reenvio de Email

## ⚠️ Problema

O endpoint `/api/auth/enviar-link-confirmacao` estava retornando erro 500 mesmo com SMTP próprio configurado.

## ✅ Correções Aplicadas

### **1. Verificação Robusta de Admin Client e SMTP**

**Antes:**
```typescript
const supabaseAdmin = createAdminClient()
const { isSmtpConfigured, sendMail } = await import('@/lib/mailer')
```

**Agora:**
```typescript
// Verificar Admin Client com try-catch
let supabaseAdmin: any = null
try {
  supabaseAdmin = createAdminClient()
  console.error(`📧 Admin disponível: ${!!supabaseAdmin}`)
} catch (adminErr: any) {
  console.error('❌ Erro ao criar Admin client:', adminErr.message)
  supabaseAdmin = null
}

// Verificar SMTP com try-catch
let isSmtpConfigured = false
let sendMail: any = null
try {
  const mailer = await import('@/lib/mailer')
  isSmtpConfigured = mailer.isSmtpConfigured()
  sendMail = mailer.sendMail
} catch (mailerErr: any) {
  console.error('❌ Erro ao importar mailer:', mailerErr.message)
  isSmtpConfigured = false
}
```

**Por quê:**
- Se `createAdminClient()` lançar exceção, não quebra o fluxo
- Se importar `mailer` falhar, não quebra o fluxo
- Logs claros indicam qual parte falhou

---

### **2. Logs Detalhados em Cada Etapa**

**Adicionado:**
- ✅ Log quando Admin client é criado (ou falha)
- ✅ Log quando SMTP é verificado (ou falha)
- ✅ Log quando template é lido
- ✅ Log quando `sendMail` é chamado
- ✅ Log detalhado de erros (código, stack, erro original)

**Exemplo de logs no terminal:**
```
📧 ========== REENVIAR LINK ==========
📧 Email: usuario@email.com
📧 Admin disponível: true
📧 SMTP configurado: true
📤 Tentativa 1: Admin API + SMTP próprio...
🔗 Gerando link via Admin API...
✅ Link gerado: https://plenipay.com/auth/callback?...
📄 Lendo template HTML...
📄 Template path: /path/to/TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html
✅ Template lido com sucesso
✅ Template processado, link inserido
📤 Chamando sendMail...
📤 [SMTP] Preparando para enviar email...
✅ Email enviado via SMTP próprio
```

---

### **3. Tratamento de Erro Melhorado**

**Antes:**
```typescript
} catch (e: any) {
  logError(`❌ SMTP próprio falhou: ${msg}`, 'EMAIL_CONFIRMATION')
  // Segue para tentativa 2
}
```

**Agora:**
```typescript
} catch (e: any) {
  const msg = e?.message || String(e)
  const code = e?.code
  logError(`❌ SMTP próprio falhou: ${msg}`, 'EMAIL_CONFIRMATION')
  console.error(`❌ SMTP próprio falhou: ${msg}`)
  console.error(`❌ Código: ${code || 'N/A'}`)
  if (e?.stack) console.error(`❌ Stack: ${e.stack.substring(0, 300)}`)
  if (e?.originalError) {
    console.error(`❌ Erro original: ${e.originalError.message}`)
    console.error(`❌ Código original: ${e.originalError.code || 'N/A'}`)
  }
  // Segue para tentativa 2 (resend)
}
```

---

### **4. Verificação de Template**

**Adicionado:**
```typescript
let templateHtml: string
try {
  templateHtml = readFileSync(templatePath, 'utf-8')
  console.error('✅ Template lido com sucesso')
} catch (fileErr: any) {
  console.error(`❌ Erro ao ler template: ${fileErr.message}`)
  throw new Error(`Template não encontrado: ${templatePath}`)
}
```

**Por quê:**
- Se o template não existir, o erro é claro
- Log mostra o caminho completo do template

---

## 🧪 Como Verificar se Está Funcionando

### **1. Verifique o Terminal**

Quando clicar em "Reenviar link", você deve ver no terminal:

```
📧 ========== REENVIAR LINK ==========
📧 Email: seu@email.com
📧 Admin disponível: true
📧 SMTP configurado: true
📤 Tentativa 1: Admin API + SMTP próprio...
```

**Se aparecer:**
- `Admin disponível: false` → Verifique `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
- `SMTP configurado: false` → Verifique variáveis `SMTP_*` no `.env.local`
- `❌ Erro ao criar Admin client` → Veja a mensagem de erro específica
- `❌ Erro ao importar mailer` → Veja a mensagem de erro específica

### **2. Se Aparecer Erro SMTP**

Procure por:
```
❌ [SMTP] Erro ao enviar email: ...
❌ [SMTP] Código: EAUTH (ou ECONNECTION, etc.)
```

**Códigos comuns:**
- `EAUTH` → Credenciais SMTP incorretas (usuário/senha)
- `ECONNECTION` → Não consegue conectar ao servidor SMTP
- `ETIMEDOUT` → Timeout na conexão
- `ECERT` → Problema com certificado SSL

---

## 📋 Checklist de Verificação

- [ ] `SUPABASE_SERVICE_ROLE_KEY` existe no `.env.local`
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` existem no `.env.local`
- [ ] Servidor foi reiniciado após mudanças no `.env.local`
- [ ] Terminal mostra `Admin disponível: true`
- [ ] Terminal mostra `SMTP configurado: true`
- [ ] Terminal mostra `Tentativa 1: Admin API + SMTP próprio...`
- [ ] Se aparecer erro, veja o código do erro no terminal

---

## 🆘 Se Ainda Der Erro 500

1. **Abra o terminal** onde `npm run dev` está rodando
2. **Clique em "Reenviar link"** no modal
3. **Copie TODOS os logs** que aparecem no terminal (especialmente os que começam com `❌`)
4. **Me envie os logs** para eu identificar o problema específico

Os logs agora são muito mais detalhados e vão mostrar exatamente onde está falhando!

---

**Correções aplicadas! Teste novamente e veja os logs no terminal.** 🔍
