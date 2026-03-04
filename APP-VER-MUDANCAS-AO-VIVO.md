# Ver as mudanças do app ao vivo

## Site vs App no localhost (separados)

- **`http://localhost:3000`** (sem parâmetro) = **sempre o SITE** (landing, login/cadastro do site). O cookie do app é limpo no localhost para você desenvolver o site sem confusão.
- **`http://localhost:3000?platform=app`** = **modo APP** (tela de bem-vindo, Google, onboarding). Use quando quiser testar o app no navegador.

Assim o site e o app ficam separados: no dia a dia você abre o localhost e mexe no site; quando precisar testar o app, abra com `?platform=app`.

## Opção 1: No navegador (mais rápido)

Assim você vê o **modo app** (tela de bem-vindo, Google, onboarding) enquanto desenvolve, com **live reload**.

1. **Suba o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Abra no navegador:** `http://localhost:3000?platform=app` (use a porta do terminal, em geral 3000). Não use só `localhost:3000` — sem o param o localhost mostra o **site**.

3. Você verá o **modo app**: tela de bem-vindo, "Continuar com Google" e, após o login, página de onboarding.

4. **Edite o que quiser** (por exemplo `app/globals.css` na seção “TEMA DO APP”). O Next recarrega sozinho e você vê as mudanças na hora.

**Para trabalhar no site:**
Abra **`http://localhost:3000`** (sem parâmetro). O localhost mostra o site por padrão. Para testar o app use **`http://localhost:3000/?platform=app`** (ou qualquer rota, ex.: `http://localhost:3000/login?platform=site`). O middleware remove o cookie do app e você volta para a versão **site** (landing, login/cadastro do site, etc.). Pode usar sempre que o localhost estiver “preso” no modo app.

---

## Opção 2: No simulador iOS (app de verdade)

Para ver no **iPhone simulador** usando seu **dev server** (mudanças ao vivo):

1. **Antes de abrir o app, deixe o dev rodando no Mac.** Se o app abrir com **tela branca**, é porque o WebView não conseguiu carregar a URL (ex.: `npm run dev` não estava rodando).
   ```bash
   npm run dev
   ```

2. **Aponte o Capacitor para o localhost** (só para desenvolvimento):
   - Abra `capacitor.config.ts`.
   - Troque temporariamente para:
     ```ts
     server: {
       url: 'http://localhost:3000?platform=app',
       cleartext: true,  // necessário para HTTP no simulador
     },
     ```
   - Salve.

3. **Sincronize e rode o app:**
   ```bash
   npx cap sync ios
   npx cap open ios
   ```
   No Xcode, escolha um simulador e clique em ▶️.

4. O app no simulador vai abrir **carregando do seu localhost**. As alterações no código (CSS, componentes) aparecem ao vivo ao recarregar a tela do app (por exemplo puxando para atualizar, se você tiver isso, ou fechando e abrindo de novo).

**Antes de fazer deploy ou testar produção:** volte o `capacitor.config.ts` para a URL de produção:
```ts
server: {
  url: 'https://plenipay.com?platform=app',
  cleartext: false,
},
```

---

## Por que está aparecendo Safari e não o app?

Se você vê a **barra em baixo** com seta de voltar, quadradinho, **endereço (ex.: 192.168.100.57)** e ícone de atualizar, isso é o **Safari** — não o app. O app PLENIPAY (Capacitor) abre **em tela cheia, sem essa barra**.

### Como abrir o app (e NÃO o Safari)

1. **No Mac:** deixe o servidor rodando: `npm run dev`
2. **No Mac:** abra o projeto iOS: `npx cap open ios`
3. **No Xcode:** no topo, escolha o simulador (ex.: iPhone 16) e clique no **▶️ Run**
4. **No simulador:** vai aparecer o ícone **PLENIPAY**. **Toque nesse ícone** — é o app
5. **Não** abra o Safari e **não** digite o IP (192.168.x.x ou localhost) na barra de endereço

Se você abrir o Safari e colar o endereço do servidor, a tela fica dentro do navegador (com a barra). O app de verdade é o ícone PLENIPAY que abre depois do Run no Xcode.

---

## "Ativar notificações" não mostra o popup do iPhone

O popup **"PleniPay gostaria de enviar notificações"** é do **sistema iOS** e só aparece quando:

1. **Você está no app nativo** (Capacitor), não no Safari. No Safari o código usa a API web de notificações, que no iOS não mostra esse mesmo popup.
2. **De preferência em um iPhone físico.** No **simulador** a permissão de notificações push muitas vezes **não aparece** ou não funciona; a Apple exige dispositivo real para testar push.

**Resumo:** para testar o popup de notificações, rode o **app** pelo Xcode no **simulador** (sem Safari) ou, melhor ainda, em um **iPhone real** conectado ao Xcode.

---

## Resumo

| Onde ver        | Comando / passo principal                          |
|-----------------|-----------------------------------------------------|
| **Navegador**   | `npm run dev` → abrir `http://localhost:3000?platform=app` |
| **Simulador**   | Colocar `localhost:3000?platform=app` no Capacitor, `npx cap open ios` → no Xcode ▶️ Run (não abrir a URL no Safari) |

Para o dia a dia, a **Opção 1 (navegador)** costuma ser a mais prática para ver as mudanças ao vivo do app.
