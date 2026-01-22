# ⚠️ PROBLEMA: DOMÍNIO plenipay.com.br NÃO ESTÁ ACESSÍVEL

## 🔍 DIAGNÓSTICO

O link de confirmação está **CORRETO** agora (apontando para `plenipay.com.br`), mas o **domínio não está resolvendo** (erro DNS).

**Erro:** `ERR_NAME_NOT_RESOLVED` - O endereço IP do servidor não foi encontrado.

---

## ✅ O QUE ESTÁ FUNCIONANDO:

1. ✅ Código está correto - link aponta para `plenipay.com.br`
2. ✅ Supabase está configurado corretamente
3. ✅ Link de confirmação está sendo gerado corretamente

---

## ❌ O QUE NÃO ESTÁ FUNCIONANDO:

1. ❌ **Domínio `plenipay.com.br` não está acessível**
   - DNS não está configurado
   - Ou domínio não está apontando para o servidor correto

---

## 🔧 SOLUÇÕES:

### **OPÇÃO 1: Usar URL do Render (Temporário)**

Se o domínio `plenipay.com.br` não está configurado ainda, você pode usar a URL do Render:

1. **No Supabase Dashboard:**
   - Authentication → URL Configuration
   - **Site URL:** `https://sistema-de-contas-1.onrender.com` (ou a URL do seu Render)
   - **Redirect URLs:** Adicione:
     - `https://sistema-de-contas-1.onrender.com/**`
     - `https://sistema-de-contas-1.onrender.com/auth/callback`

2. **No código (`lib/auth.ts`):**
   - A função `getSiteUrl()` já detecta automaticamente a URL do Render
   - Ou você pode configurar `NEXT_PUBLIC_SITE_URL` no Render

---

### **OPÇÃO 2: Configurar DNS do Domínio**

Se você quer usar `plenipay.com.br`, precisa:

1. **Configurar DNS:**
   - Acesse o painel do seu provedor de domínio
   - Configure um registro A ou CNAME apontando para o IP do Render
   - Ou configure um registro CNAME apontando para a URL do Render

2. **No Render:**
   - Vá em Settings → Custom Domains
   - Adicione o domínio `plenipay.com.br`
   - Siga as instruções para configurar DNS

3. **Aguardar propagação DNS:**
   - Pode levar de alguns minutos a 48 horas
   - Verifique com: `nslookup plenipay.com.br` ou `dig plenipay.com.br`

---

### **OPÇÃO 3: Usar localhost para Testes (Desenvolvimento)**

Para testar localmente enquanto o domínio não está configurado:

1. **No Supabase Dashboard:**
   - Authentication → URL Configuration
   - **Site URL:** `http://localhost:3000` (temporário para testes)
   - **Redirect URLs:** `http://localhost:3000/**`

2. **No código:**
   - A função `getSiteUrl()` já retorna `https://plenipay.com.br` por padrão
   - Mas você pode temporariamente mudar para retornar `http://localhost:3000` em desenvolvimento

---

## 🎯 RECOMENDAÇÃO:

**Para agora (testes):**
- Use a URL do Render: `https://sistema-de-contas-1.onrender.com`
- Configure no Supabase Dashboard
- Configure `NEXT_PUBLIC_SITE_URL` no Render

**Para produção:**
- Configure o DNS do domínio `plenipay.com.br`
- Aponte para o Render
- Aguarde propagação DNS

---

## 📋 CHECKLIST:

- [ ] Servidor Next.js foi reiniciado
- [ ] Site URL no Supabase está configurada (Render ou domínio)
- [ ] Redirect URLs no Supabase incluem a URL correta
- [ ] DNS do domínio está configurado (se usando domínio próprio)
- [ ] Testar criando uma nova conta

---

## 🆘 VERIFICAR STATUS DO DOMÍNIO:

Execute no terminal:
```bash
nslookup plenipay.com.br
```

Ou acesse: https://www.whatsmydns.net/#A/plenipay.com.br

Se não retornar um IP, o DNS não está configurado.
