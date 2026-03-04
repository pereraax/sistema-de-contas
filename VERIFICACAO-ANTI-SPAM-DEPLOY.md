# Verificação anti-spam antes do deploy (WhatsApp)

**Data da verificação:** fevereiro 2025

## Timer aleatório ativado

| Onde | Comportamento |
|------|----------------|
| **Intro "Quero utilizar" (webhook)** | Antes de enviar a primeira mensagem: `delay(0–5 s)` aleatório (`Math.random() * 5001` ms) em todos os 3 fluxos que enviam o intro. |
| **Entre as 2 mensagens de boas-vindas** | `entreMensagensMs = 1000 + Math.random() * 4000` (1–5 s) entre intro e botões (em `sendBoasVindasViaZapi`). |
| **Modo teste (gasto registrado)** | `delay(800)` entre confirmação do gasto, follow-up e "Qual seu nome?". |
| **Respostas PLEN (várias mensagens)** | `delay(280)` entre cada mensagem da sequência. |
| **Cron / enviar todos pendentes** | Delay aleatório **3–12 s** entre cada contato (evita pico ao processar vários pendentes). |

Cada contato recebe a resposta em um momento ligeiramente diferente (0–5 s após a mensagem), evitando padrão de bot.

---

## Nome do contato específico

| Mensagem | Uso do nome |
|----------|-------------|
| **Intro modo teste** | `getMensagemInicialModoTeste(contactName)` → "Oiii **{nome}** 👋!!✨" (ou "Oiii 👋!!✨" se sem nome). |
| **Fallback boas-vindas** | `getIntroBoasVindas(contactName)` → "Oi! 👋 **{nome}**! 💙✨ Sou a Plen...". |
| **Rate limit** | "Oi **{nome}**! 💙 Estamos recebendo muitas mensagens. Aguarde alguns minutos.". |
| **Fallback sem resposta** | "Em que posso ajudar**, {nome}**? 😊". |

O `contactName` vem do payload Z-API: `pushName`, `contactName`, `senderName` ou `chatName` (e equivalente em `data`). Números puros no nome são ignorados (só exibido se parecer nome, não telefone).

---

## Proteções contra spam e duplicidade

| Mecanismo | Descrição |
|-----------|-----------|
| **Rate limit** | Máximo **25 respostas** por número **por hora**. Acima disso: "Oi {nome}! Estamos recebendo muitas mensagens. Aguarde alguns minutos.". |
| **Dedup por messageId** | Mesmo `messageId` não é processado de novo em **90 s** (evita duplicata quando a Z-API envia 2 eventos). |
| **Dedup por número + texto** | Mesma combinação número+texto não gera segunda resposta em **60 s**. |
| **Cooldown pós-boas-vindas** | Por **10 s** após enviar intro+botões, eventos duplicados (ex.: "Olá") são ignorados. |
| **Mensagem bloqueada** | "Em que posso ajudar? 😊" não é reenviada (evita loop). |

---

## Resumo

- Timer aleatório: **sim** (0–5 s antes do intro; 1–5 s entre mensagens de boas-vindas; 3–12 s entre contatos no cron).
- Respostas em tempos diferentes por contato: **sim** (delay aleatório antes do primeiro envio).
- Nome de cada contato nas mensagens: **sim** (intro modo teste, fallback boas-vindas, rate limit e fallback de ajuda).
- Anti-spam: **sim** (rate limit, dedup, cooldown).

Sistema preparado para deploy e para voltar com o anúncio e receber novos clientes.
