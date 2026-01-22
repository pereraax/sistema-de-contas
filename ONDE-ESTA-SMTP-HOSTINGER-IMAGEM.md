# ✅ VOCÊ JÁ ESTÁ NA PÁGINA CERTA! AS INFORMAÇÕES ESTÃO AÍ

## 🎯 OLHE PARA A SEÇÃO "CONFIGURAÇÕES"

Na tela que você está vendo agora, há uma seção chamada:

### **"Configure seu cliente de e-mail usando o servidor de e-mail"**

Dentro dessa seção há uma **TABELA** com as informações:

---

## 📋 ONDE ESTÁ O SMTP:

Na tabela, procure pela linha que diz:

```
Protocolo: Servidor de saída (SMTP)
Nome do host: smtp.hostinger.com  [📋 ícone de copiar]
Porta: 465
SSL/TLS: ✓ (marcado)
```

---

## ✅ INFORMAÇÕES QUE VOCÊ PRECISA:

**Da tabela na tela:**

```
SMTP Host: smtp.hostinger.com
SMTP Port: 465
SSL/TLS: Habilitado
```

---

## 🔍 ONDE ESTÁ NA TELA:

```
┌─────────────────────────────────────────┐
│ Conectar apps e dispositivos            │
├─────────────────────────────────────────┤
│                                         │
│ [Card: Conecte apps e dispositivos]    │
│                                         │
│ ▼ Configurações  ← AQUI! (expandido)   │
│                                         │
│   Configure seu cliente de e-mail...   │
│   ┌───────────────────────────────────┐ │
│   │ Protocolo    │ Host       │ Porta │ │
│   ├───────────────────────────────────┤ │
│   │ Servidor...  │ smtp.      │ 465   │ │ ← SMTP AQUI!
│   │ (SMTP)       │ hostinger  │       │ │
│   │              │ .com       │       │ │
│   └───────────────────────────────────┘ │
│                                         │
│ ▼ Configure usando CNAME...            │
└─────────────────────────────────────────┘
```

---

## 📝 USE ESTAS INFORMAÇÕES NO SUPABASE:

1. **Vá no Supabase:** Authentication → Settings → SMTP Settings
2. **Preencha:**
   - Host: `smtp.hostinger.com`
   - Port: `465`
   - User: `seu-email@plenipay.com` (o email que você criou)
   - Password: Senha do email
   - SSL: Sim (já está na porta 465)
   - Sender email: `seu-email@plenipay.com`
   - Sender name: `PLENIPAY`
3. **Salve**

---

**As informações estão na tabela "Configurações" que já está aberta na sua tela!**
