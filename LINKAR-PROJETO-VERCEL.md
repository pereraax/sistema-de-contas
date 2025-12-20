# 🔗 LINKAR PROJETO NO VERCEL - PASSO A PASSO

## ✅ SITUAÇÃO ATUAL:

O projeto existe no Vercel, mas o link local está quebrado. Vamos reconfigurar!

---

## 🎯 SOLUÇÃO RÁPIDA:

### **OPÇÃO 1: Linkar com projeto existente (RECOMENDADO)**

```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
vercel link
```

**O Vercel vai perguntar:**
1. **"Set up and deploy?"** → Digite `Y`
2. **"Which scope?"** → Escolha: `contacomerciaal01-8972's projects`
3. **"Link to existing project?"** → Digite `Y`
4. **Escolha o projeto da lista:**
   - Procure por: `plenipay` ou `contacomerciaal` ou `sistema-de-contas`
   - Use as setas para navegar
   - Pressione Enter para selecionar
5. **"In which directory is your code located?"** → Apenas pressione Enter

**Depois rode:**
```bash
vercel --prod
```

---

### **OPÇÃO 2: Criar novo projeto (SE NÃO ENCONTRAR O EXISTENTE)**

```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
vercel link
```

**O Vercel vai perguntar:**
1. **"Set up and deploy?"** → Digite `Y`
2. **"Which scope?"** → Escolha: `contacomerciaal01-8972's projects`
3. **"Link to existing project?"** → Digite `N`
4. **"What's your project's name?"** → Digite: `plenipay` (ou o nome que quiser)
5. **"In which directory is your code located?"** → Apenas pressione Enter

**Depois rode:**
```bash
vercel --prod
```

---

## 🚀 DEPLOY DIRETO (SEM LINKAR ANTES):

Se quiser fazer deploy direto sem linkar:

```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
vercel --prod
```

**E responda as perguntas:**
1. **"Set up and deploy?"** → `Y`
2. **"Which scope?"** → `contacomerciaal01-8972's projects`
3. **"Link to existing project?"** → `Y` (para usar projeto existente) ou `N` (para criar novo)
4. **Nome do projeto** → Digite o nome
5. **Diretório** → Apenas Enter

---

## ✅ DEPOIS DO LINK/DEPLOY:

O Vercel vai:
1. ✅ Fazer upload dos arquivos
2. ✅ Fazer build
3. ✅ Fazer deploy
4. ✅ Te dar a URL

**Tempo:** 2-5 minutos

---

## 🎯 RECOMENDAÇÃO:

**Use a OPÇÃO 1** (`vercel link`) primeiro para linkar o projeto, depois faça `vercel --prod`.

Isso garante que o projeto fique linkado corretamente para próximos deploys.

---

## 📝 COMANDOS RÁPIDOS:

```bash
# 1. Linkar projeto
vercel link

# 2. Fazer deploy
vercel --prod
```

**Pronto!** 🚀
