# ✅ Vamos lá – testar confirmação de email

**Estrutura de verificação de email criada e pronta para uso.**

## O que está pronto

- **SMTP próprio** no `.env.local` (Hostinger): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` (opcional)
- **SUPABASE_SERVICE_ROLE_KEY** no `.env.local` (obrigatório para Admin API + SMTP próprio)
- **Redirect** para `https://plenipay.com/auth/callback?next=/home`
- **Reenvio:** tenta **SMTP próprio primeiro** (Admin API + envio), depois resend do Supabase
- **Callback** em `app/auth/callback/route.ts` valida o token e redireciona para `/home`
- **Teste SMTP:** `POST /api/teste-smtp` com `{ "email": "seu@email.com" }`

---

## Configuração completa (.env.local)

Confira se todas estas variáveis existem (valores são exemplos):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# SMTP próprio (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=comercial@plenipay.com
SMTP_PASSWORD=sua_senha_do_email
SMTP_FROM=comercial@plenipay.com
```

- **Porta:** use `465` (SSL) ou `587` (STARTTLS). Deve bater com a do Supabase/Hostinger.
- **SMTP_FROM:** opcional; se omitir, usa `SMTP_USER`.
- Reinicie o servidor após alterar o `.env.local`.

---

## Como testar

### 1. Subir o servidor

```bash
npm run dev
```

### 2. Criar uma conta

- Acesse a página de cadastro (ex.: `http://localhost:3000/cadastro` ou sua URL)
- Preencha e envie o formulário
- O Supabase provavelmente falha ao enviar → o **fallback** envia via SMTP próprio

### 3. Verificar o email

- Confira a caixa de entrada (e spam) do email usado no cadastro
- Deve chegar o email “Confirme seu Cadastro - PLENIPAY”
- O link deve ser: `https://plenipay.com/auth/callback?token_hash=...&type=signup&next=/home`

### 4. Clicar no link

- O link aponta para **plenipay.com**
- O callback valida o token no Supabase e redireciona para `/home`
- **Importante:** o **cadastro** pode ser em localhost, mas o **link do email** leva para **plenipay.com**. O app precisa estar publicado em **plenipay.com** para o clique no link funcionar de ponta a ponta.

---

## Se algo der errado

### Email não chega

- Verifique o **terminal** (logs do SMTP)
- Confira **spam**
- Teste o SMTP: no console do navegador (F12):

```javascript
fetch('/api/teste-smtp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'seu-email@gmail.com' })
}).then(r => r.json()).then(console.log)
```

### Modal “Reenviar link”

- Se o email não foi enviado no cadastro, o modal abre
- Use **“Reenviar link”** → chama `/api/auth/enviar-link-confirmacao`
- O endpoint tenta **SMTP próprio primeiro** (Admin API + envio); se falhar, tenta **resend** do Supabase
- Se aparecer erro com `detail`, leia a dica (ex.: configurar `SUPABASE_SERVICE_ROLE_KEY` ou `SMTP_*`)

### Logs

- **Terminal:** onde roda `npm run dev`
- **Supabase:** Authentication → Logs
- **App:** `/administracaosecr/logs` (se existir)

---

## Checklist rápido

- [ ] Variáveis no `.env.local`: Supabase + `SUPABASE_SERVICE_ROLE_KEY` + SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`)
- [ ] `npm run dev` rodando (reiniciar depois de mudar .env)
- [ ] Testar SMTP: `fetch('/api/teste-smtp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'seu@email.com' }) }).then(r=>r.json()).then(console.log)` no console (F12)
- [ ] Criar conta na página de cadastro
- [ ] Ver email (inbox + spam)
- [ ] Clicar no link (em plenipay.com)
- [ ] Ser redirecionado para `/home`

---

## Resumo do fluxo

1. **Cadastro** → `signUp` cria usuário no Supabase. Se o Supabase falhar ao enviar email, o **fallback** usa Admin API + SMTP próprio.
2. **Reenviar link** (modal) → `POST /api/auth/enviar-link-confirmacao`. Tenta **SMTP próprio primeiro**, depois resend do Supabase.
3. **Clique no link** → `https://plenipay.com/auth/callback?token_hash=...&type=signup&next=/home` → Supabase valida token → redireciona para `/home`.

**Próximo passo:** rodar `npm run dev`, testar `/api/teste-smtp` e em seguida fazer um cadastro de teste.
