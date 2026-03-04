# Alternativas à API Fácil que tenham botões e sejam fáceis de configurar

Provedores no mesmo estilo da API Fácil (conexão por **QR Code**, instância, webhook) e com suporte a **envio de botões** no WhatsApp.

---

## 1. Z-API (recomendado)

- **Site:** https://www.z-api.io  
- **Doc:** https://developer.z-api.io  

**Por que é parecido com a API Fácil:**  
- Você cria uma **instância**, pega o **QR Code** e escaneia com o WhatsApp (igual API Fácil).  
- Envio de mensagem por **REST** (POST com telefone, mensagem, etc.).  
- **Webhook** para mensagens recebidas (e para saber qual botão foi clicado).  
- Suporte em português e foco no Brasil.

**Botões:**  
- **Texto com botões (reply):** endpoint `POST /send-button-list`  
  - Body: `phone`, `message`, `buttonList`: `{ buttons: [ { id, label } ] }`  
  - Até 3 botões por mensagem (recomendado).  
- Também tem: botões de ação (link, ligação), lista de opções, carrossel, etc.

**Exemplo de envio de botões (Z-API):**
```json
POST https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/send-button-list

{
  "phone": "5511999999999",
  "message": "Escolha abaixo:",
  "buttonList": {
    "buttons": [
      { "id": "cadastrar", "label": "CADASTRAR" },
      { "id": "ja_cadastrei", "label": "JÁ CADASTREI" }
    ]
  }
}
```

**Configuração resumida:**  
1. Criar conta em z-api.io.  
2. Criar instância e pegar **instance ID** e **token**.  
3. Conectar o número escaneando o QR Code.  
4. Configurar a URL do webhook (onde você recebe as mensagens e o clique nos botões).  
5. No seu backend: trocar as chamadas da API Fácil pelas da Z-API (enviar texto e enviar botões).

**Preço:** conferir em https://www.z-api.io (há planos e trial).

---

## 2. Evolution API

- **Site / doc:** https://doc.evolution-api.com (open source)  
- **Cloud:** alguns provedores oferecem Evolution como serviço (ex.: evoapicloud.com).

**Por que é parecido:**  
- Também usa conceito de **instância** e conexão (QR ou número).  
- API REST para enviar mensagens, **incluindo botões** (endpoint “Send Buttons”).  
- Webhook para mensagens recebidas.

**Diferença:**  
- Pode ser **self-hosted** (você instala e mantém o servidor) ou usar um serviço que já ofereça Evolution.  
- Se for self-hosted, exige um pouco mais de configuração (servidor, domínio, etc.).  
- Se usar um provedor “Evolution as a service”, o fluxo fica mais parecido com API Fácil/Z-API.

**Botões:**  
- Endpoint documentado para enviar botões (reply buttons).  
- Consulte: https://doc.evolution-api.com (Message Controller → Send Buttons).

---

## 3. Resumo comparativo

| Recurso              | API Fácil (atual) | Z-API        | Evolution API   |
|----------------------|-------------------|-------------|-----------------|
| Conexão por QR       | Sim               | Sim         | Sim             |
| Configuração fácil   | Sim               | Sim         | Média (depende se cloud ou self-hosted) |
| Envio de texto       | Sim               | Sim         | Sim             |
| Envio de botões      | Não (na doc)      | **Sim**     | **Sim**         |
| Webhook              | Sim               | Sim         | Sim             |
| Foco Brasil / PT     | Sim               | Sim         | Comum (comunidade) |

---

## Próximo passo (se escolher Z-API)

1. Criar conta e instância na Z-API.  
2. Configurar webhook apontando para seu backend (ex.: `https://plenipay.com/api/whatsapp/zapi/webhook`).  
3. No projeto, criar um módulo `lib/whatsapp-zapi.ts` (enviar texto e enviar botões) e uma rota de webhook que receba o formato Z-API.  
4. Ajustar o fluxo “Quero utilizar a Plenipay” para chamar o endpoint de botões da Z-API em vez do envio só de texto.  
5. Quando o usuário clicar no botão, o webhook da Z-API envia o evento (ex.: `buttonId: "cadastrar"`); seu backend trata e responde com o link ou com “JÁ CADASTREI” (pedir e-mail).

Se quiser, posso te guiar passo a passo na integração com a Z-API (endpoints exatos e formato do webhook) usando o que você já tem no plenipay.
