# 🔧 CORREÇÃO: Erro de Build - Dynamic Server Usage

## ❌ PROBLEMA IDENTIFICADO:

O build está falhando com erro:
```
Dynamic server usage: Page couldn't be rendered statically because it used `cookies`
```

**Arquivos afetados:**
- `/app/minhas-metas/page.tsx`
- `/app/api/admin/avisos/route.ts`

---

## ✅ CORREÇÃO APLICADA:

### **1. Arquivo `/app/minhas-metas/page.tsx`:**

**Problema:** Tinha `export const revalidate = 60` junto com `export const dynamic = 'force-dynamic'`, causando conflito.

**Solução:** Removido `export const revalidate = 60` (não pode usar revalidate com force-dynamic).

**Arquivo corrigido:**
```typescript
export const dynamic = 'force-dynamic'
// Removido: export const revalidate = 60
```

### **2. Arquivo `/app/api/admin/avisos/route.ts`:**

**Status:** ✅ Já estava correto com `export const dynamic = 'force-dynamic'`

---

## 🚀 PRÓXIMOS PASSOS NO SERVIDOR:

Execute no SSH:

```bash
# 1. Ir para pasta do projeto
cd /var/www/plenipay

# 2. Fazer build novamente
npm run build

# 3. Reiniciar aplicação
pm2 restart sistema-contas

# 4. Verificar logs
pm2 logs sistema-contas --lines 20
```

---

## ✅ VERIFICAÇÃO:

Depois do build, verifique:
- ✅ Build deve completar sem erros de "Dynamic server usage"
- ✅ Aplicação deve iniciar normalmente
- ✅ Página `/minhas-metas` deve funcionar

---

**Execute o build novamente no servidor!** 🔧
