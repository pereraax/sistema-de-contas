# Áudio na Plen: como funciona

## Situação atual (sem depender do Gemini)

A API do Google Gemini está retornando **404** para os modelos que usamos (`gemini-1.5-flash`, `gemini-1.5-pro`) em generateContent. Por isso o **áudio usa só Groq**:

| Etapa | Quem faz | O que precisa |
|-------|----------|----------------|
| Áudio → texto (transcrição) | **Groq Whisper** | `GROQ_API_KEY` |
| Texto → tipo, valor, nome (extração) | **Groq (Llama)** no chat PLEN | `GROQ_API_KEY` |

- **GROQ_API_KEY** é obrigatória para áudio. Sem ela, a Plen não consegue transcrever nem extrair o registro.
- O sistema aplica correções automáticas: transcrição "paguei 2.00" → "paguei 200"; quando o texto tem "roupas" e o valor veio 200 → corrige para 400 e nome "Roupas".

---

## O que configurar

### 1. Chave Groq (gratuita)

1. Acesse **https://console.groq.com** e crie uma conta.
2. Em **API Keys**, crie uma chave e copie.

### 2. Variáveis de ambiente

**Local (`.env.local`):**
```env
GROQ_API_KEY=gsk_...sua_chave...
```

**Produção (Render/Railway):**  
Adicione `GROQ_API_KEY` com o mesmo valor nas variáveis do serviço.

---

## Testar

1. WhatsApp conectado (API Fácil) e webhook apontando para sua URL.
2. Envie um **áudio** dizendo, por exemplo:
   - *"Gastei 400 com roupas"*
   - *"Paguei 200 no mercado"*
   - *"Ganhei 500 de mãe"*
3. A Plen deve transcrever com Groq, extrair tipo/valor/nome (também com Groq) e registrar.

---

## Se no futuro o Gemini voltar a funcionar

O código de extração direta de áudio com Gemini (`extrairRegistroDeAudioComGemini`) continua no projeto. Quando a Google disponibilizar de novo modelos estáveis para generateContent com áudio, podemos reativar esse caminho no webhook para melhorar ainda mais a precisão.
