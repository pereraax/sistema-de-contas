# 📋 Como Ver os Logs do Servidor

## 🔍 Onde estão os logs?

Os logs do servidor Next.js aparecem **no terminal onde você executou `npm run dev`**.

## 📝 Passos para ver os logs:

### 1. Encontre o terminal onde o servidor está rodando
- Procure pela janela do terminal onde você executou `npm run dev`
- Os logs aparecem em tempo real nesse terminal

### 2. Envie um registro via WhatsApp
- Envie uma mensagem como "ganhei 30 reais" ou "paguei 50 reais"

### 3. Procure por estes logs no terminal:

**Logs que devem aparecer:**

```
🔍 [PLEN WhatsApp] VERIFICANDO SE DEVE APLICAR LIMITE
🔍 [PLEN WhatsApp] Plano detectado: teste
🔍 [PLEN WhatsApp] É plano teste? true
✅ [PLEN WhatsApp] PLANO É TESTE - APLICANDO LIMITE!
🔍 [PLEN WhatsApp] VERIFICANDO LIMITE DE ENVIOS WHATSAPP
📝 [PLEN WhatsApp] TENTANDO REGISTRAR ENVIO NA TABELA
🔄 [PLEN WhatsApp] Iniciando inserção na tabela whatsapp_envios...
🔄 [PLEN WhatsApp] Resposta da inserção: { ... }
```

**Se inseriu com sucesso:**
```
✅ [PLEN WhatsApp] ENVIO REGISTRADO COM SUCESSO!
✅ [PLEN WhatsApp] ID do envio: [UUID]
✅ [PLEN WhatsApp] Total de envios após inserção: X
```

**Se houve erro:**
```
❌ [PLEN WhatsApp] ERRO ao registrar envio na tabela whatsapp_envios!
❌ [PLEN WhatsApp] Código do erro: [código]
❌ [PLEN WhatsApp] Mensagem: [mensagem]
```

## 🔧 Se não encontrar o terminal:

### Opção 1: Ver processos Node.js
```bash
ps aux | grep "next dev"
```

### Opção 2: Reiniciar o servidor
1. Pare o servidor atual (Ctrl+C)
2. Inicie novamente: `npm run dev`
3. Os logs aparecerão no terminal

## 📤 O que me enviar:

Copie e cole os logs que aparecem quando você envia um registro via WhatsApp, especialmente:
- Logs que começam com `🔍 [PLEN WhatsApp]`
- Logs que começam com `📝 [PLEN WhatsApp]`
- Logs que começam com `✅` ou `❌`
- Qualquer erro relacionado a `whatsapp_envios`

