# O que fazer quando tomar restrição (spam) no WhatsApp

Quando o WhatsApp Business (ou a Z-API) restringe a conta por “spam” (ex.: várias horas sem poder enviar mensagens), siga estes passos.

## 1. Pausar a assistente

- Acesse **Admin → WhatsApp**.
- Clique em **“Pausar assistente para todos”**.
- Assim a IA para de enviar qualquer mensagem e a conta deixa de gerar novo envio até você retomar.

## 2. Registrar que houve restrição

- Na mesma página, na seção **“Quando tomar restrição (spam)”**, clique em **“Registrar restrição agora”**.
- O sistema grava a **data e hora** desse registro (em `platform_config`).
- Isso serve para você saber **quando** ocorreu a última restrição e, se quiser, analisar depois (ex.: intervalo entre restrições).

## 3. Esperar a liberação

- O tempo varia (geralmente de **5h a 24h**); o WhatsApp (ou o painel da Z-API) costuma indicar quando a conta foi liberada.
- Enquanto isso, **não retome a assistente** para evitar novo pico de envios.

## 4. Retomar a assistente

- Quando a conta estiver normal de novo, em **Admin → WhatsApp** clique em **“Retomar assistente para todos”**.
- A assistente volta a responder com os **delays aleatórios** (0–5 s antes da primeira mensagem e 1–5 s entre a primeira e a segunda) para reduzir risco de novo padrão de spam.

## O que o sistema já faz para evitar restrição

- **Delays aleatórios** antes e entre as duas primeiras mensagens de boas-vindas (cada contato em um tempo diferente).
- **Nome do contato** na mensagem de boas-vindas (“Oi! 👋 [nome]! …”) para personalizar e parecer menos automático.
- **Rate limit** de 25 respostas por número por hora.
- **Pausar assistente** no admin para parar tudo na hora, quando necessário.

## Resumo

| Ação              | Onde                         |
|-------------------|------------------------------|
| Pausar assistente | Admin → WhatsApp → botão     |
| Registrar restrição | Admin → WhatsApp → “Registrar restrição agora” |
| Ver última restrição | Mesma seção: “Última restrição registrada: …” |
| Retomar assistente | Admin → WhatsApp → “Retomar assistente para todos” |
