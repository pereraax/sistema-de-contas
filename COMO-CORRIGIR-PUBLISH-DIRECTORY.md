# 🎯 COMO CORRIGIR O PUBLISH DIRECTORY NO NETLIFY

## ✅ SIM, É AQUI MESMO!

Você está na tela correta: **"Build settings"**

## 🔴 PROBLEMA IDENTIFICADO:

Na sua tela, vejo:
- **Publish directory:** `.next` ❌ **ESTE É O PROBLEMA!**

## ✅ O QUE FAZER:

### **OPÇÃO 1: Clicar em "Configure" (Recomendado)**

1. **Clique no botão "Configure"** (no final da página)
2. Isso vai abrir uma tela de edição
3. **Procure pelo campo "Publish directory"**
4. **APAGUE o valor `.next`** e deixe o campo **VAZIO**
5. **Salve as alterações**

### **OPÇÃO 2: Editar Diretamente (Se possível)**

1. **Clique no campo "Publish directory"** (se for clicável)
2. **Apague o valor `.next`**
3. **Deixe o campo completamente vazio**
4. **Salve**

---

## 📋 CONFIGURAÇÃO CORRETA:

Depois de corrigir, deve ficar assim:

- **Runtime:** Next.js ✅
- **Base directory:** `/` ✅
- **Package directory:** Not set ✅
- **Build command:** Not set ✅ (correto - o plugin gerencia)
- **Publish directory:** **(VAZIO)** ✅ **CORRIGIR AQUI!**
- **Functions directory:** `netlify/functions` ✅
- **Deploy log visibility:** Logs are public ✅
- **Build status:** Active ✅

---

## ⚠️ IMPORTANTE:

**Por que deixar vazio?**

O plugin `@netlify/plugin-nextjs` gerencia automaticamente:
- O build do Next.js
- O diretório de publicação
- As funções serverless

Se você especificar `.next` manualmente, causa conflito e o deploy falha!

---

## 🚀 DEPOIS DE CORRIGIR:

1. **Salve as alterações**
2. **Vá em:** `Deploys` (no menu lateral)
3. **Clique em:** `Trigger deploy` → `Deploy site`
4. **OU** faça um commit vazio:
   ```bash
   git commit --allow-empty -m "Fix publish directory"
   git push origin main
   ```

---

## ✅ RESUMO:

1. ✅ Você está na tela correta
2. ✅ Clique em **"Configure"**
3. ✅ **Remova o valor `.next`** do campo "Publish directory"
4. ✅ **Deixe vazio**
5. ✅ **Salve**
6. ✅ **Faça um novo deploy**

**É isso! Depois disso, o deploy deve funcionar!** 🎉
