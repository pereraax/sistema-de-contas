# Mensagem para enviar ao suporte da API Fácil

Cole a mensagem abaixo no chat ou e-mail do suporte (suporte@apifacil.dev):

---

**Assunto:** Ajuda com envio de botões no WhatsApp

Oi, tudo bem?

Estou integrando o envio de botões pelo WhatsApp na minha aplicação. No momento as mensagens estão saindo só como texto (em negrito), e gostaria que aparecessem os botões de verdade para o usuário clicar.

Conseguem me enviar um **exemplo de como deve ser o JSON** na requisição para o endpoint de botões? Assim eu ajusto o código do meu lado.

Seria ótimo saber:

1. **Qual é a URL exata** do endpoint? (ex.: POST /api/v1/whatsapp/enviar-botao)
2. **Como deve vir o corpo da requisição**, com os nomes dos campos que vocês utilizam:
   - Número de destino (`para`, `telefone`, `numero` ou outro?)
   - ID da instância (`instancia`, `id_instancia`?)
   - Texto da mensagem (`mensagem`, `texto`?)
   - Lista de botões: array de objetos com `id` e `titulo`, ou só os textos dos botões?

Hoje estou enviando assim (e não está dando certo):

```json
{
  "para": "5531999999999",
  "instancia": "1069",
  "mensagem": "Escolha abaixo:",
  "botoes": [
    { "id": "cadastrar", "titulo": "CADASTRAR" },
    { "id": "ja_cadastrei", "titulo": "JÁ CADASTREI" }
  ]
}
```

Com um exemplo que funcione aí do lado de vocês, consigo deixar tudo certinho aqui. 🙂

Obrigado pela ajuda!

---
