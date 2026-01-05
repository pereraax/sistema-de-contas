# 🔍 Como Verificar no Console do Render

## 🎯 Passo a Passo:

1. **Acesse:** https://dashboard.render.com
2. **Clique no seu serviço** (provavelmente "sistema-de-contas" ou similar)
3. **Vá na aba "Logs"** (ou "Logs" no menu lateral)
4. **Envie uma mensagem via WhatsApp** (ex: "ganhei 30 reais")
5. **Observe os logs aparecerem em tempo real**

## 🔍 O Que Procurar:

### **Logs que DEVEM aparecer no console do Render:**

1. **`🚀🚀🚀 [PLEN WhatsApp] ENDPOINT CHAMADO!`**
   - Se aparecer → O endpoint está sendo chamado ✅
   - Se NÃO aparecer → O endpoint não está sendo chamado ❌

2. **`👤 [PLEN WhatsApp] Profile encontrado - Email: ..., Plano: ...`**
   - Anote qual plano aparece aqui
   - Se aparecer `Plano: teste` → OK
   - Se aparecer `Plano: basico` ou outro → Problema

3. **`🔍 [PLEN WhatsApp] DETECÇÃO DE PLANO - DEBUG COMPLETO`**
   - Veja os valores de `Profile.plano (raw)`, `Plano normalizado`, e `É teste?`

4. **`🔥🔥🔥 PLANO TESTE - VERIFICANDO LIMITE 🔥🔥🔥`**
   - Se aparecer → O código está entrando no bloco ✅
   - Se NÃO aparecer → O código não está entrando ❌

5. **`📝 Inserindo envio: entrada`**
   - Se aparecer → A inserção está sendo tentada ✅

6. **`✅ ENVIO REGISTRADO! ID: ...`** ou **`❌ ERRO AO INSERIR! ...`**
   - Se aparecer sucesso → A inserção funcionou ✅
   - Se aparecer erro → Copie o erro completo ❌

## 🚀 Ação Imediata:

1. **Abra o console do Render** (dashboard > seu serviço > Logs)
2. **Envie uma mensagem via WhatsApp**
3. **Observe os logs aparecerem**
4. **Me diga:**
   - Apareceu `🚀🚀🚀 [PLEN WhatsApp] ENDPOINT CHAMADO!`? (SIM ou NÃO)
   - Apareceu `👤 [PLEN WhatsApp] Profile encontrado`? Qual plano?
   - Apareceu `🔥🔥🔥 PLANO TESTE - VERIFICANDO LIMITE 🔥🔥🔥`? (SIM ou NÃO)
   - Apareceu `📝 Inserindo envio: entrada`? (SIM ou NÃO)
   - Apareceu `✅ ENVIO REGISTRADO!` ou `❌ ERRO AO INSERIR!`? (Qual?)

Com essas informações, vou conseguir identificar exatamente onde está o problema!

