# ⚙️ CONFIGURAR .ENV.PRODUCTION - O QUE FAZER AGORA

## ✅ ARQUIVO JÁ EXISTE!

Vejo que o arquivo `.env.production` já tem algumas variáveis configuradas.

---

## 📋 VERIFICAR VARIÁVEIS NECESSÁRIAS:

### **Variáveis que JÁ estão no arquivo:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `ASAAS_API_KEY`
- ✅ `ASAAS_API_URL`
- ✅ `NEXT_PUBLIC_SITE_URL`
- ✅ `NEXT_PUBLIC_APP_URL`
- ✅ `NODE_ENV=production`
- ✅ `ADMIN_JWT_SECRET`

---

## 🔍 VERIFICAR SE FALTAM VARIÁVEIS:

### **Variáveis que podem faltar:**

Verifique se tem estas (adicione se não tiver):

```env
APIFACIL_INSTANCE_ID=seu_id_apifacil
APIFACIL_TOKEN=seu_token_apifacil
```

---

## ✅ O QUE FAZER AGORA:

### **OPÇÃO 1: Se todas as variáveis estão corretas**

1. **Salvar o arquivo:**
   - Pressione **Ctrl+X**
   - Depois pressione **Y** (para confirmar)
   - Depois pressione **Enter** (para salvar)

2. **Continuar com build:**
   ```bash
   npm run build
   ```

---

### **OPÇÃO 2: Se precisa adicionar variáveis**

1. **Navegue até o final do arquivo** (use setas do teclado)

2. **Adicione as variáveis que faltam:**
   ```env
   APIFACIL_INSTANCE_ID=seu_id_apifacil
   APIFACIL_TOKEN=seu_token_apifacil
   ```

3. **Salvar:**
   - Pressione **Ctrl+X**
   - Depois pressione **Y**
   - Depois pressione **Enter**

---

## 📝 COMANDOS DO NANO:

- **Ctrl+X** = Sair
- **Ctrl+O** = Salvar (Write Out)
- **Ctrl+W** = Buscar
- **Ctrl+K** = Cortar linha
- **Ctrl+U** = Colar
- **Setas** = Navegar

---

## ✅ SEQUÊNCIA APÓS SALVAR:

Depois de salvar o arquivo (Ctrl+X, Y, Enter), execute:

```bash
# 1. Verificar se arquivo foi salvo
ls -la .env.production

# 2. Fazer build
npm run build

# 3. Instalar PM2
npm install -g pm2

# 4. Iniciar servidor
pm2 start npm --name "sistema-contas" -- start
pm2 save
pm2 status
```

---

## ⚠️ IMPORTANTE:

### **Verificar valores:**

Certifique-se de que:
- ✅ Todas as URLs estão corretas
- ✅ Todas as chaves estão completas (não cortadas)
- ✅ Não há espaços extras antes/depois dos valores
- ✅ Não há aspas desnecessárias

---

## 🎯 RESUMO:

1. ✅ **Verifique** se todas as variáveis estão lá
2. ✅ **Adicione** as que faltam (se necessário)
3. ✅ **Salve:** Ctrl+X, depois Y, depois Enter
4. ✅ **Continue:** `npm run build`

---

## 📋 CHECKLIST:

- [ ] Verifiquei todas as variáveis no arquivo
- [ ] Adicionei as que faltavam (se necessário)
- [ ] Salvei o arquivo (Ctrl+X, Y, Enter)
- [ ] Verifiquei se arquivo foi salvo (`ls -la .env.production`)
- [ ] Pronto para fazer build

---

**Salve o arquivo (Ctrl+X, Y, Enter) e depois execute `npm run build`!** 🚀


