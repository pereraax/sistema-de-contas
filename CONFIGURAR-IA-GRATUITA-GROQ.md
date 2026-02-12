# Configurar IA gratuita (Groq) para o assistente PLEN

O assistente da Plenipay pode usar **Groq** (gratuito) para responder dúvidas no WhatsApp (preços, como funciona, etc.). Se você não tiver chave da OpenAI, basta configurar a Groq.

---

## Passo a passo

### 1. Criar conta e pegar a API Key na Groq

1. Acesse **https://console.groq.com**
2. Crie uma conta (login com Google ou e-mail).
3. No painel, vá em **API Keys** (ou **Create API Key**).
4. Crie uma chave e **copie** (ela só aparece uma vez).

### 2. Colocar a chave no projeto

No arquivo **`.env.local`** (na raiz do projeto), adicione:

```env
GROQ_API_KEY=gsk_sua_chave_aqui
```

Substitua `gsk_sua_chave_aqui` pela chave que você copiou.

### 3. Ordem de uso no código

- Se **GROQ_API_KEY** estiver definida → o assistente usa **Groq** (gratuito).
- Se não estiver, mas **OPENAI_API_KEY** estiver → usa **OpenAI** (pago).
- Se as duas estiverem definidas → **Groq tem prioridade** (para economizar uso da OpenAI).

Não é obrigatório ter OpenAI; só a Groq já basta para o chat funcionar.

---

## Resumo

| Variável         | Obrigatório? | Uso                    |
|------------------|--------------|-------------------------|
| `GROQ_API_KEY`   | Não (mas gratuito) | Respostas de IA no WhatsApp |
| `OPENAI_API_KEY` | Não         | Alternativa paga        |

Com **GROQ_API_KEY** configurada, o assistente já responde no WhatsApp usando IA gratuita.
