# 🔧 CORRIGIR SERVIDOR LOCAL - ASSETS NÃO CARREGAM

## ❌ PROBLEMA:

Os assets `/_next/static/...` estão dando 404 no `localhost:3000`.

**Causa:** Servidor Next.js não está servindo os arquivos estáticos corretamente.

---

## ✅ SOLUÇÃO RÁPIDA:

### **OPÇÃO 1: Usar Script Automático**

Execute no terminal:

```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
./corrigir-servidor-local.sh
```

Este script vai:
1. ✅ Parar processos na porta 3000
2. ✅ Limpar build anterior
3. ✅ Fazer build completo
4. ✅ Verificar se arquivos foram gerados
5. ✅ Iniciar servidor de desenvolvimento

---

### **OPÇÃO 2: Comandos Manuais**

Execute estes comandos **um por vez**:

```bash
# 1. Ir para o diretório
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"

# 2. Parar processos na porta 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# 3. Limpar build anterior
rm -rf .next
rm -rf .next/cache 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null

# 4. Fazer build completo
npm run build

# 5. Verificar se arquivos foram gerados
ls -la .next/static/chunks | head -5
ls -la .next/static/css | head -5

# 6. Iniciar servidor de desenvolvimento
npm run dev
```

---

## 🔍 VERIFICAÇÕES:

### **Verificar se build foi bem-sucedido:**

```bash
npm run build 2>&1 | tail -20
```

**Deve terminar com:** `✓ Compiled successfully`

---

### **Verificar se arquivos estáticos existem:**

```bash
# Verificar chunks
ls -la .next/static/chunks | head -10

# Verificar CSS
ls -la .next/static/css | head -10
```

**Deve mostrar vários arquivos!**

---

### **Testar se servidor está servindo assets:**

```bash
# Com servidor rodando, em outro terminal:
curl -I http://localhost:3000/_next/static/chunks/main-app.js
```

**Deve retornar status 200 (não 404)!**

---

## 🚨 SE AINDA NÃO FUNCIONAR:

### **Problema 1: Build falha**

**Solução:** Verificar erros no build:

```bash
npm run build 2>&1 | tee build.log
cat build.log | grep -i error
```

---

### **Problema 2: Porta 3000 em uso**

**Solução:** Usar outra porta:

```bash
# Editar package.json e mudar:
# "dev": "next dev -p 3001"

# Ou iniciar diretamente:
npx next dev -p 3001
```

---

### **Problema 3: Cache do navegador**

**Solução:** Limpar cache completamente:

1. **Abrir DevTools (F12)**
2. **Clicar com botão direito no botão de Recarregar**
3. **Selecionar "Limpar cache e recarregar forçado"**
4. **OU usar janela anônima/privada**

---

### **Problema 4: Node.js versão incorreta**

**Solução:** Verificar versão:

```bash
node -v
```

**Deve ser:** v18.x ou v20.x

**Se não for:**
```bash
# Instalar Node 20 via nvm
nvm install 20
nvm use 20
```

---

## ✅ CHECKLIST:

- [ ] Processos na porta 3000 foram parados
- [ ] Build anterior foi limpo (`.next` removido)
- [ ] Build foi feito com sucesso (`npm run build`)
- [ ] Arquivos estáticos existem (`.next/static/chunks` e `.next/static/css`)
- [ ] Servidor está rodando (`npm run dev`)
- [ ] Cache do navegador foi limpo
- [ ] Testou em janela anônima

---

## 🎯 TESTE FINAL:

1. **Limpar cache do navegador** (Ctrl+Shift+Delete ou janela anônima)
2. **Acessar:** `http://localhost:3000`
3. **Abrir DevTools (F12):**
   - Aba "Network"
   - Recarregar página (Ctrl+Shift+R)
   - Verificar se arquivos `/_next/static/...` carregam com status 200

---

**Execute o script `./corrigir-servidor-local.sh` ou os comandos manuais acima!** 🔧

