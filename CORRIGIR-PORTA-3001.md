# 🔧 CORRIGIR PORTA 3001 vs 3000

## 🐛 PROBLEMA IDENTIFICADO

- ✅ Servidor está rodando na **porta 3000**
- ❌ Navegador está acessando na **porta 3001**
- ❌ Requisições API falham porque estão indo para porta errada

---

## ✅ SOLUÇÃO

### **Opção 1: Parar servidor na porta 3001 e usar apenas 3000**

1. **Parar servidor na porta 3001:**
   ```bash
   # Encontrar processo na porta 3001
   lsof -ti:3001
   
   # Matar processo (substitua [PID] pelo número retornado)
   kill -9 [PID]
   ```

2. **Acessar aplicação na porta correta:**
   - Use: `http://localhost:3000` (não 3001!)

---

### **Opção 2: Reiniciar servidor na porta 3000**

1. **Parar TODOS os servidores:**
   ```bash
   # Parar processo na porta 3000
   lsof -ti:3000 | xargs kill -9
   
   # Parar processo na porta 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **Reiniciar servidor:**
   ```bash
   npm run dev
   ```

3. **Aguardar** até ver:
   ```
   ✓ Ready in X seconds
   ○ Local: http://localhost:3000
   ```

4. **Acessar na porta correta:**
   - Use: `http://localhost:3000` (não 3001!)

---

## 🔍 VERIFICAÇÃO

### **Verificar qual porta está em uso:**
```bash
lsof -i :3000
lsof -i :3001
```

### **Verificar qual porta o servidor está usando:**
Olhe o terminal onde `npm run dev` está rodando. Deve mostrar:
```
○ Local: http://localhost:3000
```

---

## ⚠️ IMPORTANTE

**O navegador DEVE acessar na mesma porta que o servidor está rodando!**

- Se servidor está em **3000** → Acesse `http://localhost:3000`
- Se servidor está em **3001** → Acesse `http://localhost:3001`

**Mas o recomendado é usar sempre a porta 3000 (padrão do Next.js).**

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Pare o servidor na porta 3001**
2. ✅ **Acesse a aplicação em `http://localhost:3000`**
3. ✅ **Teste o botão "Pagar Agora"**
4. ✅ **Me avise se funcionou!**

---

**Corrija a porta e teste novamente!** 🎯













