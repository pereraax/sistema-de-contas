# ✅ DEPENDÊNCIAS INSTALADAS - PRÓXIMOS PASSOS

## 🎉 TUDO CERTO ATÉ AGORA!

- ✅ **Pasta correta encontrada:** `/var/www/plenipay`
- ✅ **Node.js instalado:** v20.19.6
- ✅ **npm instalado:** v10.8.2
- ✅ **Dependências instaladas:** `npm install` completou

---

## 📋 PRÓXIMOS PASSOS (EXECUTE NA ORDEM):

### **1. Verificar/Criar Variáveis de Ambiente:**

```bash
# Ver se já existe .env.production
ls -la .env.production

# Se não existir, criar
nano .env.production
```

**Cole estas variáveis (substitua pelos seus valores reais):**

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
ASAAS_API_KEY=sua_chave_asaas
APIFACIL_INSTANCE_ID=seu_id_apifacil
APIFACIL_TOKEN=seu_token_apifacil
NEXT_PUBLIC_SITE_URL=https://plenipay.com
```

**Para salvar:**
1. Pressione **Ctrl+X**
2. Depois pressione **Y**
3. Depois pressione **Enter**

---

### **2. Fazer Build:**

```bash
npm run build
```

**Isso vai demorar alguns minutos.** Aguarde terminar.

**Se der algum erro, me avise!**

---

### **3. Instalar PM2 (para manter servidor rodando):**

```bash
npm install -g pm2
```

---

### **4. Iniciar Servidor:**

```bash
pm2 start npm --name "sistema-contas" -- start
```

---

### **5. Salvar Configuração PM2:**

```bash
pm2 save
```

---

### **6. Configurar PM2 para Iniciar Automaticamente:**

```bash
pm2 startup
```

**Siga as instruções que aparecerem** (pode pedir para executar um comando com `sudo`).

---

### **7. Ver Status do Servidor:**

```bash
pm2 status
```

**Você deve ver o servidor rodando!** ✅

---

### **8. Ver Logs (opcional):**

```bash
pm2 logs sistema-contas
```

**Pressione Ctrl+C para sair dos logs.**

---

## 📝 SEQUÊNCIA COMPLETA (COPIE E COLE):

Execute no terminal SSH (um comando por vez):

```bash
# 1. Verificar se está na pasta correta
pwd
# Deve mostrar: /var/www/plenipay

# 2. Criar/editar variáveis de ambiente
nano .env.production
# (Cole variáveis e salve: Ctrl+X, Y, Enter)

# 3. Fazer build
npm run build

# 4. Instalar PM2
npm install -g pm2

# 5. Iniciar servidor
pm2 start npm --name "sistema-contas" -- start

# 6. Salvar configuração
pm2 save

# 7. Configurar startup automático
pm2 startup
# (Siga as instruções)

# 8. Ver status
pm2 status

# 9. Ver logs
pm2 logs sistema-contas
```

---

## ⚠️ SOBRE A VULNERABILIDADE:

Você viu: **"1 critical severity vulnerability"**

**Isso não impede o funcionamento**, mas você pode corrigir depois:

```bash
npm audit fix
```

**Ou ignore por enquanto** e corrija depois.

---

## ✅ DEPOIS DE INICIAR O SERVIDOR:

### **Verificar se está acessível:**

1. Acesse seu domínio no navegador: `https://plenipay.com`
2. Ou teste localmente: `http://localhost:3000` (se configurado)

### **Comandos úteis PM2:**

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs sistema-contas

# Reiniciar servidor
pm2 restart sistema-contas

# Parar servidor
pm2 stop sistema-contas

# Ver informações detalhadas
pm2 info sistema-contas
```

---

## 🚨 SE DER ERRO NO BUILD:

### **Erro comum: Variáveis de ambiente faltando**

**Solução:** Certifique-se de que criou `.env.production` com todas as variáveis.

### **Erro comum: Memória insuficiente**

**Solução:**
```bash
# Aumentar memória do Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

## ✅ CHECKLIST:

- [x] Pasta correta encontrada (`/var/www/plenipay`)
- [x] Node.js instalado (v20.19.6)
- [x] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas (`.env.production`)
- [ ] Build feito (`npm run build`)
- [ ] PM2 instalado
- [ ] Servidor iniciado (`pm2 start`)
- [ ] Configuração salva (`pm2 save`)
- [ ] Servidor rodando (`pm2 status` mostra online)
- [ ] Testado no navegador

---

## 🎯 RESUMO:

1. ✅ **Criar `.env.production`** com variáveis
2. ✅ **Fazer build:** `npm run build`
3. ✅ **Instalar PM2:** `npm install -g pm2`
4. ✅ **Iniciar servidor:** `pm2 start npm --name "sistema-contas" -- start`
5. ✅ **Salvar:** `pm2 save`
6. ✅ **Verificar:** `pm2 status`

---

**Agora execute os comandos acima na ordem!** 🚀

Comece criando o arquivo `.env.production` com `nano .env.production`!


