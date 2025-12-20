# ✅ Configurar Groq (IA Gratuita)

## 🎯 Por Que Groq?

- ✅ **100% Gratuito** (com limites generosos)
- ✅ **Muito Rápido** (inferência ultra-rápida)
- ✅ **Suporta Visão** (análise de imagens)
- ✅ **Fácil de Configurar**

---

## 🔧 Como Configurar

### 1. **Obter API Key do Groq**

1. Acesse: https://console.groq.com/
2. Crie uma conta (gratuita)
3. Vá em **API Keys**
4. Clique em **Create API Key**
5. Copie a chave gerada

### 2. **Adicionar ao .env.local**

Abra o arquivo `.env.local` e adicione:

```bash
GROQ_API_KEY=sua_chave_aqui
```

**Exemplo:**
```bash
GROQ_API_KEY=gsk_abc123xyz456...
```

### 3. **Reiniciar o Servidor**

```bash
npx pm2 restart plen-server
```

---

## ✅ O Que Foi Melhorado

### 1. **Múltiplos Modelos**
- ✅ Tenta `llama-3.2-90b-vision-preview` primeiro
- ✅ Se falhar, tenta `llama-3.2-11b-vision-preview`
- ✅ Se falhar, tenta `llama-3.1-70b-versatile`
- ✅ Se falhar, tenta `llama-3.1-8b-instant`

### 2. **Ordem de Prioridade**
1. **Groq** (gratuito e rápido) ← **PRIMEIRO**
2. Gemini (se Groq falhar)
3. OpenAI (se ambos falharem)

### 3. **Tratamento de Erros Melhorado**
- ✅ Tenta cada modelo automaticamente
- ✅ Logs detalhados de qual modelo funcionou
- ✅ Fallback automático para próximo provedor

---

## 🧪 Como Testar

### 1. **Configurar Groq API Key**
Adicione `GROQ_API_KEY` no `.env.local`

### 2. **Reiniciar Servidor**
```bash
npx pm2 restart plen-server
```

### 3. **Enviar uma Imagem pelo WhatsApp**
Envie uma foto de comprovante de PIX ou compra.

### 4. **Verificar os Logs**
```bash
npx pm2 logs plen-server
```

Procure por:
```
🔍 [Media Processor] Tentando processar com Groq...
🔍 [Media Processor] Tentando modelo Groq: llama-3.2-90b-vision-preview
✅ [Media Processor] Groq modelo llama-3.2-90b-vision-preview funcionou!
✅ [Apifacil Webhook] Imagem processada com sucesso!
```

---

## 📋 Vantagens do Groq

1. **Gratuito**: Sem custos, apenas limites de uso
2. **Rápido**: Inferência em milissegundos
3. **Confiável**: Infraestrutura robusta
4. **Suporta Visão**: Análise de imagens nativa

---

## 🔗 Links Úteis

- **Console Groq**: https://console.groq.com/
- **Documentação**: https://console.groq.com/docs
- **API Keys**: https://console.groq.com/keys

---

## 💡 Próximos Passos

1. **Obter API Key do Groq**
2. **Adicionar ao .env.local**
3. **Reiniciar servidor**
4. **Testar enviando uma imagem**

**Groq é gratuito e muito rápido! Configure agora!**








