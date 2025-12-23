# ✅ ESCOLHER DNS NA HOSTINGER - GUIA RÁPIDO

## 🎯 RESPOSTA RÁPIDA:

**Escolha:** `A` (já está selecionado na imagem)

---

## 📋 COMO PREENCHER:

### **1. Tipo:**
- ✅ Selecione: **`A`** (já está selecionado)

### **2. Nome/Host:**
- Digite: **`@`** 
- OU deixe em **branco** (para domínio raiz `plenipay.com`)

### **3. Valor/IP:**
- Digite: **`216.24.57.1`**
- (Este é o IP fornecido pelo Render)

### **4. TTL:**
- Deixe o padrão (geralmente `3600`)
- OU digite: **`3600`**

### **5. Salvar:**
- Clique em **"Salvar"** ou **"Adicionar"**

---

## 📝 RESUMO VISUAL:

```
Tipo: A
Nome: @
Valor: 216.24.57.1
TTL: 3600
```

---

## ⚠️ IMPORTANTE:

### **Se já existir um registro A para `@`:**

1. **Edite o registro existente:**
   - Clique no registro A existente
   - Altere o valor para: `216.24.57.1`
   - Salve

2. **OU delete e crie novo:**
   - Delete o registro A antigo
   - Crie um novo conforme acima

---

## ✅ PRÓXIMOS PASSOS:

1. ✅ Preencha conforme acima
2. ✅ Salve
3. ✅ Aguarde 15-30 minutos (propagação DNS)
4. ✅ Volte ao Render e clique em **"Verify"**

---

## 🔍 VERIFICAÇÃO:

Após salvar, você pode verificar se está correto:

- O registro deve aparecer na lista como:
  ```
  Tipo: A
  Nome: @
  Valor: 216.24.57.1
  ```

---

## 💡 POR QUE USAR A?

- A Hostinger não tem `ANAME` ou `ALIAS` nas opções
- O registro `A` funciona perfeitamente
- O IP `216.24.57.1` é fornecido pelo Render especificamente para isso

---

## ✅ PRONTO!

Preencha conforme acima e salve. Depois aguarde a propagação DNS e verifique no Render!
