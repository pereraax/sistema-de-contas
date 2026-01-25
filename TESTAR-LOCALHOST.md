# 🧪 TESTAR APLICAÇÃO NO LOCALHOST

## 🎯 Objetivo

Testar a aplicação localmente antes de fazer deploy no Railway, garantindo que:
- ✅ A rota `/auth/callback` funciona
- ✅ O build funciona corretamente
- ✅ O Dockerfile funciona (simula Railway)

---

## 🚀 Método 1: Teste Rápido (Sem Docker)

### **Passo 1: Instalar Dependências**

```bash
npm install
```

### **Passo 2: Fazer Build**

```bash
npm run build
```

### **Passo 3: Iniciar Servidor**

```bash
npm start
```

### **Passo 4: Testar Rota**

Abra no navegador:
```
http://localhost:3000/auth/callback?token_hash=test&type=magiclink&next=/home
```

**O que verificar:**
- ✅ A página carrega (não dá "Not Found")
- ✅ Não há erros no console do servidor
- ✅ A rota responde (mesmo que com erro de token inválido, isso é esperado)

---

## 🐳 Método 2: Teste com Docker (Simula Railway)

### **Passo 1: Executar Script**

```bash
./testar-docker-local.sh
```

**Ou manualmente:**

```bash
# Construir imagem
docker build -t sistema-de-contas-test .

# Executar container
docker run -d \
  --name sistema-de-contas-test \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  sistema-de-contas-test

# Ver logs
docker logs -f sistema-de-contas-test
```

### **Passo 2: Testar Rota**

Abra no navegador:
```
http://localhost:3000/auth/callback?token_hash=test&type=magiclink&next=/home
```

### **Passo 3: Parar Container**

```bash
docker stop sistema-de-contas-test
docker rm sistema-de-contas-test
```

---

## 🔍 Verificar se Está Funcionando

### **✅ Sinais de Sucesso:**

1. **Servidor inicia sem erros:**
   ```
   > Ready on http://0.0.0.0:3000
   ```

2. **Rota `/auth/callback` responde:**
   - Não dá "Not Found"
   - Mostra logs no console: `[Callback] ========== CALLBACK INICIADO ==========`

3. **Outras rotas funcionam:**
   - `http://localhost:3000/` - Página inicial
   - `http://localhost:3000/login` - Página de login
   - `http://localhost:3000/home` - Página home (pode pedir login)

---

## ❌ Problemas Comuns

### **1. Erro: "Cannot find module"**

**Solução:**
```bash
npm install
npm run build
```

### **2. Erro: "Port 3000 already in use"**

**Solução:**
```bash
# Encontrar processo usando a porta
lsof -ti:3000

# Matar processo
kill -9 $(lsof -ti:3000)

# Ou usar outra porta
PORT=3001 npm start
```

### **3. Erro: "Not Found" na rota `/auth/callback`**

**Possíveis causas:**
- Build não foi feito: `npm run build`
- Arquivos não foram copiados corretamente
- Problema com o Next.js App Router

**Solução:**
1. Verificar se `app/auth/callback/route.ts` existe
2. Fazer build novamente: `npm run build`
3. Verificar logs do servidor para erros

### **4. Erro no Docker: "Cannot find module"**

**Solução:**
1. Verificar se o Dockerfile está copiando todos os arquivos
2. Reconstruir imagem: `docker build --no-cache -t sistema-de-contas-test .`

---

## 📋 Checklist de Verificação

Antes de fazer deploy no Railway:

- [ ] `npm install` executado sem erros
- [ ] `npm run build` executado sem erros
- [ ] `npm start` inicia o servidor
- [ ] Rota `/auth/callback` responde (não dá "Not Found")
- [ ] Logs mostram `[Callback] ========== CALLBACK INICIADO ==========`
- [ ] Docker build funciona (se usando Docker)
- [ ] Docker container inicia sem erros

---

## 🎯 Próximos Passos

Após testar localmente e confirmar que funciona:

1. ✅ Fazer commit das alterações
2. ✅ Fazer push para GitHub
3. ✅ Railway fará deploy automaticamente
4. ✅ Testar no Railway: `https://mlvqeal2.up.railway.app/auth/callback`
5. ✅ Testar no domínio: `https://plenipay.com/auth/callback`

---

## 💡 Dica

Use o script `testar-localhost.sh` para teste rápido:

```bash
./testar-localhost.sh
```

Ele faz tudo automaticamente: instala dependências, faz build e inicia o servidor.
