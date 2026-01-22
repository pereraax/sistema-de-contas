# 🔧 CORRIGIR VARIÁVEIS SMTP TRUNCADAS

## ⚠️ PROBLEMA IDENTIFICADO

As variáveis SMTP no seu `.env.local` estão **truncadas (cortadas)**:

```
SMTP_HOST=smtp.hostinger.c          ❌ Faltando "om"
SMTP_USER=comercial@plenip          ❌ Faltando "ay.com"
SMTP_FROM=Plenipay <comerc          ❌ Faltando "ial@plenipay.com>"
```

---

## ✅ CORREÇÃO NECESSÁRIA

### **PASSO 1: Abrir o arquivo .env.local**

1. Na raiz do projeto, abra o arquivo `.env.local`
2. Ou use o terminal: `code .env.local`

---

### **PASSO 2: Corrigir as Variáveis**

Substitua as linhas truncadas por estas versões completas:

#### **ANTES (Truncado):**
```env
SMTP_HOST=smtp.hostinger.c
SMTP_USER=comercial@plenip
SMTP_FROM=Plenipay <comerc
```

#### **DEPOIS (Correto):**
```env
SMTP_HOST=smtp.hostinger.com
SMTP_USER=comercial@plenipay.com
SMTP_FROM=Plenipay <comercial@plenipay.com>
```

---

### **PASSO 3: Verificar Todas as Variáveis SMTP**

Certifique-se de que todas estão completas:

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=comercial@plenipay.com
SMTP_PASSWORD=321@Vaca
SMTP_FROM=Plenipay <comercial@plenipay.com>
```

**⚠️ IMPORTANTE:**
- ✅ `SMTP_HOST` deve terminar com `.com`
- ✅ `SMTP_USER` deve ser um email completo (ex: `comercial@plenipay.com`)
- ✅ `SMTP_FROM` deve ter formato: `Nome <email@dominio.com>`

---

### **PASSO 4: Verificar NEXT_PUBLIC_APP_URL**

Também vi que esta variável está incompleta:

```env
NEXT_PUBLIC_APP_URL=http:/
```

**Corrija para:**
```env
NEXT_PUBLIC_APP_URL=https://plenipay.com
```

Ou se estiver em desenvolvimento local:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🔄 PASSO 5: Reiniciar o Servidor

**CRÍTICO:** Após corrigir as variáveis:

1. **Pare o servidor** (Ctrl+C no terminal)
2. **Inicie novamente:** `npm run dev`
3. **Tente criar conta novamente**

**⚠️ Variáveis de ambiente só são carregadas quando o servidor inicia!**

---

## ✅ VERIFICAR SE FUNCIONOU

Após reiniciar e tentar criar conta:

1. **Acesse:** `/administracaosecr/logs`
2. **Filtre por:** `SIGNUP` ou `SMTP`
3. **Procure por:**
   - `✅ [SMTP] Configuração SMTP válida!` - indica que SMTP está configurado
   - `✅ Email enviado` - indica que email foi enviado com sucesso

---

## 📝 RESUMO DAS CORREÇÕES

| Variável | Antes (Truncado) | Depois (Correto) |
|----------|------------------|------------------|
| `SMTP_HOST` | `smtp.hostinger.c` | `smtp.hostinger.com` |
| `SMTP_USER` | `comercial@plenip` | `comercial@plenipay.com` |
| `SMTP_FROM` | `Plenipay <comerc` | `Plenipay <comercial@plenipay.com>` |
| `NEXT_PUBLIC_APP_URL` | `http:/` | `https://plenipay.com` |

---

**Após corrigir e reiniciar, tente criar uma conta novamente!**
