# 🔑 VALORES CORRETOS DAS VARIÁVEIS DE AMBIENTE

## ⚠️ ATENÇÃO: Você precisa substituir os valores atuais

Atualmente todas as variáveis têm o valor `19JU23NF394R6HH` - isso está **ERRADO**!

Cada variável precisa do seu valor correto do arquivo `.env.local`.

## 📋 COMO CORRIGIR:

### Para cada variável na tela do Vercel:

1. **Clique no campo "Value"** da variável
2. **Apague o valor atual** (`19JU23NF394R6HH`)
3. **Cole o valor correto** (veja abaixo)
4. **Salve** (geralmente salva automaticamente)

## 🔑 VALORES CORRETOS (do seu .env.local):

**IMPORTANTE:** Os valores abaixo são exemplos. Use os valores do SEU arquivo `.env.local`!

### Variáveis Supabase:
```
NEXT_PUBLIC_SUPABASE_URL
Valor: https://seu-projeto.supabase.co
(Substitua pelo valor do seu .env.local)

NEXT_PUBLIC_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
(Substitua pelo valor do seu .env.local)

SUPABASE_SERVICE_ROLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
(Substitua pelo valor do seu .env.local)
```

### Variáveis de URL:
```
NEXT_PUBLIC_SITE_URL
Valor: https://seu-site.com
(Substitua pelo valor do seu .env.local)

NEXT_PUBLIC_APP_URL
Valor: https://seu-app.com
(Substitua pelo valor do seu .env.local)
```

### Variáveis de Ambiente:
```
NODE_ENV
Valor: production
(Deixe assim mesmo)
```

### Variáveis de Segurança:
```
ADMIN_JWT_SECRET
Valor: (seu secret do .env.local)
```

### Variáveis Asaas:
```
ASAAS_API_KEY
Valor: (sua chave da Asaas do .env.local)

ASAAS_API_URL
Valor: https://api.asaas.com/v3
```

### Variáveis APIFacil:
```
APIFACIL_INSTANCE_ID
Valor: (seu instance ID do .env.local)

APIFACIL_TOKEN
Valor: (seu token do .env.local)
```

### Variáveis de IA (se usar):
```
OPENAI_API_KEY
Valor: (sua chave OpenAI do .env.local)

GROQ_API_KEY
Valor: (sua chave Groq do .env.local)
```

## 📝 PASSO A PASSO PARA CORRIGIR:

1. **Abra seu arquivo `.env.local`** no computador
2. **Para cada variável na tela do Vercel:**
   - Encontre a mesma variável no `.env.local`
   - Copie o valor (parte depois do `=`)
   - Volte ao Vercel
   - Clique no campo "Value"
   - Apague o valor errado
   - Cole o valor correto
   - Aguarde salvar automaticamente

3. **Repita para TODAS as 12 variáveis**

4. **Verifique se todas estão corretas antes de fazer deploy**

## ✅ CHECKLIST:

Após corrigir, verifique:
- [ ] Nenhuma variável tem o valor `19JU23NF394R6HH`
- [ ] Cada variável tem seu valor único e correto
- [ ] Valores do Supabase estão corretos
- [ ] Valores das APIs estão corretos
- [ ] NODE_ENV = `production`

## 🚨 IMPORTANTE:

**NÃO faça deploy até corrigir todos os valores!**

Se fizer deploy com valores errados, o projeto não funcionará.

---

**Dica:** Se precisar, posso te ajudar a verificar os valores do seu `.env.local` (sem mostrar valores sensíveis).

