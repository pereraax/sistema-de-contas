# ✅ PLEN: Botão "Assinar Plano" para Funcionalidades Bloqueadas

## 🎯 OBJETIVO

Quando o usuário tentar usar uma funcionalidade que não está disponível no seu plano atual, o PLEN deve:
1. Informar que a funcionalidade não está disponível
2. Mostrar um botão "Assinar Plano" que redireciona para a página de configurações

---

## ✅ IMPLEMENTAÇÃO

### **1. Função `verificarPermissoes()` Melhorada** ✅

**Adicionado:**
- Retorna informações sobre funcionalidades bloqueadas
- Campos adicionais: `upgradeRequired`, `featureName`, `requiredPlan`

**Exemplo de retorno quando bloqueado:**
```typescript
{
  permitido: false,
  motivo: "Infelizmente, você não tem acesso à funcionalidade de criar dívidas...",
  upgradeRequired: true,
  featureName: "Criar Dívidas",
  requiredPlan: "Básico ou Premium"
}
```

### **2. Resposta com `actionData`** ✅

Quando `upgradeRequired` é `true`, o PLEN retorna:
```json
{
  "response": "Mensagem informando que não tem acesso...",
  "actionData": {
    "action": "upgrade_required",
    "featureName": "Criar Dívidas",
    "requiredPlan": "Básico ou Premium",
    "buttonText": "Assinar Plano",
    "buttonUrl": "/configuracoes?tab=perfil"
  }
}
```

### **3. Frontend Renderiza Botão** ✅

O componente `PlenAssistant.tsx` agora:
- Detecta quando `actionData.action === 'upgrade_required'`
- Renderiza um botão "Assinar Plano" estilizado
- O botão redireciona para `/configuracoes?tab=perfil`

---

## 📋 FUNCIONALIDADES COBERTAS

### **1. Criar Dívidas** ✅
- Plano necessário: **Básico** ou **Premium**
- Mensagem: "Infelizmente, você não tem acesso à funcionalidade de criar dívidas no seu plano atual..."

### **2. Registrar Salários** ✅
- Plano necessário: **Básico** ou **Premium**
- Mensagem: "Infelizmente, você não tem acesso à funcionalidade de registrar salários..."

### **3. Criar Empréstimos** ✅
- Plano necessário: **Premium**
- Mensagem: "Infelizmente, você não tem acesso à funcionalidade de criar empréstimos..."

---

## 🔧 ARQUIVOS MODIFICADOS

**`app/api/plen/chat/route.ts`**
- Função `verificarPermissoes()` retorna informações de upgrade
- Mensagens mais profissionais e diretas
- Retorna `actionData` com botão quando `upgradeRequired = true`

**`components/PlenAssistant.tsx`**
- Renderiza botão "Assinar Plano" quando recebe `upgrade_required`
- Estilização do botão com cores da marca
- Link para página de configurações

---

## ✨ RESULTADO

- ✅ PLEN identifica quando funcionalidade não está disponível
- ✅ Mensagem profissional e clara
- ✅ Botão "Assinar Plano" aparece automaticamente
- ✅ Botão redireciona para página de assinatura
- ✅ Funciona para todas as funcionalidades bloqueadas por plano

---

## 🔍 COMO TESTAR

1. Faça login com um usuário no plano **Teste**
2. Tente registrar uma dívida via PLEN: "divida de 2000 sofá"
3. **Resultado esperado:**
   - Mensagem informando que não tem acesso
   - Botão "Assinar Plano" aparece abaixo da mensagem
   - Ao clicar, redireciona para `/configuracoes?tab=perfil`













