# Abrir o app no simulador (e NÃO o Safari)

Se você vê uma **barra em baixo** com seta de voltar, **endereço (192.168.100.57)** e ícone de atualizar, isso é o **Safari**. O app PLENIPAY instalado pelo Xcode **não tem essa barra** — a tela é toda do app.

## Passo a passo para abrir o app de verdade

### 1. No Mac (Terminal)

```bash
cd "/Users/charlin/Downloads/SISTEMA DE CONTAS"
npm run dev
```

Deixe esse terminal aberto e rodando.

### 2. Abrir o Xcode

No **mesmo projeto**, em outro terminal ou pelo Spotlight:

```bash
npx cap open ios
```

Vai abrir o Xcode com o projeto **App** (pasta `ios/App`).

### 3. No Xcode

- No **topo**, no meio, onde está escrito o nome do app e o dispositivo: clique ali e escolha um **simulador** (ex.: **iPhone 16** ou **iPhone 15**). Não escolha "My Mac" nem um dispositivo físico por enquanto.
- Clique no botão **▶️ Run** (ou Cmd+R).

### 4. No simulador

- O simulador vai ligar (se ainda não estiver) e a tela pode ficar na **home** do iPhone (ícones).
- Procure o ícone do **PLENIPAY** (nome embaixo do ícone). **Toque só nesse ícone.**
- **Não** abra o ícone do **Safari** (compassinho) e **não** digite nenhum endereço na barra.

### 5. Como saber se está no app certo

- **App PLENIPAY (certo):** tela cheia, fundo azul escuro, logo e botão "Continuar" — **sem barra em baixo** com endereço.
- **Safari (errado):** em baixo aparece a barra com seta, quadradinho, **192.168.100.57** (ou outro IP), atualizar e "…".

Se aparecer a barra com o IP, você está no Safari. Feche essa tela (subir o app), vá na home do simulador e toque **só** no ícone **PLENIPAY**.

## Se ainda abrir o Safari

1. **Feche o Safari no simulador:** suba o app (gesto de home) e feche.
2. **Na home do simulador:** toque **só** no ícone **PLENIPAY** (o que o Xcode instalou). Não toque em Safari, nem em "Add to Home Screen" se tiver algum.
3. **Apague o conteúdo do simulador (opcional):** no Xcode, menu **Device** → **Erase All Content and Settings…** no simulador. Depois dê **Run** de novo e toque só no ícone PLENIPAY.

O app que o Xcode instala **nunca** mostra a barra de endereço. Essa barra é só do Safari.
