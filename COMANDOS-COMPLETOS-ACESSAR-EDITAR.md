# 🚀 COMANDOS COMPLETOS - ACESSAR E EDITAR .ENV.PRODUCTION

## 📋 SEQUÊNCIA COMPLETA DE COMANDOS:

---

## 🔐 PASSO 1: CONECTAR VIA SSH

No terminal do Mac, execute:

```bash
ssh root@31.97.27.20
```

Digite a senha root quando pedir.

---

## 📁 PASSO 2: IR PARA PASTA DO PROJETO

Depois de conectar, execute:

```bash
cd /var/www/plenipay
```

---

## ✅ PASSO 3: VERIFICAR ONDE ESTÁ

```bash
pwd
ls -la .env.production
```

---

## 📝 PASSO 4: EDITAR ARQUIVO .ENV.PRODUCTION

```bash
nano .env.production
```

---

## ➕ PASSO 5: ADICIONAR VARIÁVEIS APIFACIL

No editor nano:

1. **Navegue até o final do arquivo:**
   - Use a **seta para baixo** (↓) várias vezes
   - Ou pressione **Ctrl+V** várias vezes para ir avançando

2. **Quando estiver no final** (depois de `ADMIN_JWT_SECRET=...`):
   - Pressione **Enter** para criar nova linha
   - Digite as variáveis abaixo

3. **Adicione estas linhas:**

```env
APIFACIL_INSTANCE_ID=seu_id_apifacil
APIFACIL_TOKEN=seu_token_apifacil
```

**⚠️ IMPORTANTE:** Substitua `seu_id_apifacil` e `seu_token_apifacil` pelos valores reais da sua conta APIFACIL!

---

## 💾 PASSO 6: SALVAR ARQUIVO

No nano:

1. Pressione **Ctrl+X** (sair)
2. Pressione **Y** (confirmar salvar)
3. Pressione **Enter** (confirmar nome do arquivo)

---

## ✅ PASSO 7: VERIFICAR SE FOI SALVO

```bash
ls -la .env.production
cat .env.production | tail -3
```

Isso mostra as últimas 3 linhas do arquivo para confirmar que as variáveis foram adicionadas.

---

## 🏗️ PASSO 8: FAZER BUILD

```bash
npm run build
```

---

## 📋 TODOS OS COMANDOS EM SEQUÊNCIA (COPIE E COLE):

```bash
# 1. Conectar SSH
ssh root@31.97.27.20

# 2. Ir para pasta do projeto
cd /var/www/plenipay

# 3. Verificar onde está
pwd

# 4. Editar arquivo
nano .env.production

# 5. No nano: Adicione as variáveis no final e salve (Ctrl+X, Y, Enter)

# 6. Verificar se foi salvo
cat .env.production | tail -3

# 7. Fazer build
npm run build
```

---

## 📝 VARIÁVEIS APIFACIL PARA ADICIONAR:

**Adicione estas linhas no final do arquivo `.env.production`:**

```env
APIFACIL_INSTANCE_ID=seu_id_apifacil
APIFACIL_TOKEN=seu_token_apifacil
```

**Substitua pelos seus valores reais!**

---

## 🎯 RESUMO RÁPIDO:

1. ✅ `ssh root@31.97.27.20` (conectar)
2. ✅ `cd /var/www/plenipay` (ir para pasta)
3. ✅ `nano .env.production` (editar arquivo)
4. ✅ Adicionar variáveis APIFACIL no final
5. ✅ Salvar: Ctrl+X → Y → Enter
6. ✅ `npm run build` (fazer build)

---

**Execute os comandos acima na ordem!** 🚀
