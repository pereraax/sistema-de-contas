# Como ter botões de verdade no WhatsApp (Plenipay)

Os botões que você viu (ex.: "Quero contratar" / "Saber mais detalhes") são **mensagens interativas** da API oficial do WhatsApp. Hoje o projeto usa **API Fácil**, que **não** oferece envio de botões na documentação pública — apenas texto.

---

## Opção 1: Pedir suporte à API Fácil (recomendado primeiro)

Vale **perguntar ao suporte da API Fácil** se existe ou está previsto:

- Envio de mensagens com **botões de resposta** (reply buttons)
- Ou algum endpoint tipo “enviar mensagem interativa”

- **Site:** https://apifacil.dev  
- **Contato:** use o chat ou e-mail de suporte deles.

Se eles tiverem um endpoint (ex.: `enviar-mensagem-botoes` ou parâmetro `botoes` em `enviar-mensagem`), dá para manter o mesmo número e só adaptar o código para chamar esse endpoint quando for o fluxo “Quero utilizar” / CADASTRAR.

---

## Opção 2: Usar WhatsApp Business API (Meta – Cloud API)

Para ter **botões oficiais** garantidos, é preciso usar a **API oficial do WhatsApp** (Meta):

1. **Conta Business (Meta)**  
   - Acesse https://business.whatsapp.com e crie/vinculando uma conta Business.

2. **Número e API**  
   - O número precisa ser **verificado pela Meta** (não é mais “conectar por QR” como na API Fácil).  
   - Você usa um **BSP** (provedor da API), por exemplo:
     - **360dialog** (https://www.360dialog.com)
     - **Twilio** (https://www.twilio.com/whatsapp)
     - **MessageBird**
     - Ou a própria **Meta** (via Facebook Developers).

3. **No código**  
   - Em vez de chamar só a API Fácil para “enviar mensagem”, você chamaria a **Cloud API** para enviar uma mensagem do tipo **interactive** com **reply buttons** (até 3 botões).  
   - O formato é algo assim (exemplo conceitual):
     - `type: "interactive"`, `body: { text: "Escolha abaixo:" }`, `action: { buttons: [ { type: "reply", id: "cadastrar", title: "CADASTRAR" }, { type: "reply", id: "ja_cadastrei", title: "JÁ CADASTREI" } ] }`.

4. **Custo e migração**  
   - A Meta cobra por conversa (modelo de negócio deles).  
   - Você precisaria:
     - Manter ou migrar o número para a conta Business;
     - Trocar “quem envia as mensagens” no seu backend (de API Fácil para Cloud API);
     - Ajustar o webhook para o formato que o provedor (360dialog, Twilio, etc.) envia quando o usuário **clica** no botão (geralmente chega como mensagem com o `id` do botão).

---

## Resumo

| Caminho | O que fazer | Botões |
|--------|-------------|--------|
| **1. API Fácil** | Perguntar ao suporte se têm envio de botões / mensagem interativa | Só se eles implementarem |
| **2. Meta Cloud API** | Conta Business + BSP (360dialog, Twilio, etc.) + integrar no backend | Sim, oficiais |

**No código:** Já existe a função `sendReplyButtons` em `lib/whatsapp-apifacil.ts` e o fluxo “Quero utilizar a Plenipay” envia a segunda mensagem como “com botões”. Hoje a API Fácil não atende, então cai no **fallback**: a mesma mensagem é enviada em texto com as opções em negrito (*CADASTRAR* / *JÁ CADASTREI*). Quando a API Fácil tiver endpoint ou parâmetro para botões, basta ajustar o body em `sendReplyButtons` (ou a URL) e os botões passam a aparecer de verdade.
