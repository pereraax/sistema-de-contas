# Guia: publicar o PLENIPAY na App Store (iOS)

Seu app é **Next.js** (web) com backend (APIs, Supabase, Render). Para aparecer na **App Store** você precisa empacotar em um app nativo iOS. A forma mais prática é usar **Capacitor** (Ionic) e abrir o site em um WebView.

---

## O que você vai precisar

| Item | Detalhe |
|------|--------|
| **Mac** | Com Xcode instalado (obrigatório para gerar o app iOS) |
| **Apple Developer** | Conta paga **Apple Developer Program** (US$ 99/ano) – [developer.apple.com](https://developer.apple.com) |
| **Site no ar** | O app vai abrir sua URL de produção (ex.: `https://www.plenipay.com`) |

---

## Duas formas de publicar

### Opção A – App abre o site ao vivo (recomendada para você)

- O app iOS é um “wrapper”: abre sua URL em tela cheia.
- **Vantagem:** não precisa mudar o Next.js, não precisa de build estático nem CORS.
- **Desvantagem:** usuário precisa de internet; a Apple às vezes exige “valor agregado” (ex.: push, gestos nativos). Muitos apps assim são aprovados.

### Opção B – Build estático dentro do app

- Next.js com `output: 'export'` → gera HTML/JS estático; o app carrega esses arquivos.
- **Problema no seu caso:** você usa API routes, Server Actions, auth, etc. Tudo isso depende de servidor. Para funcionar, o front estático teria que chamar o backend na URL de produção e o backend precisaria liberar CORS para o app. Mais trabalho e mais pontos de falha.

**Recomendação:** usar **Opção A** (abrir a URL do site no app).

---

## Passo a passo – Opção A (abrir site no app)

### 1. Conta Apple Developer

1. Acesse [developer.apple.com](https://developer.apple.com) e entre com seu Apple ID.
2. Inscreva-se no **Apple Developer Program** (US$ 99/ano).
3. Após aprovação, você poderá criar **App IDs**, **Certificates** e **Provisioning Profiles** no [App Store Connect](https://appstoreconnect.apple.com).

### 2. Instalar Capacitor no projeto

No diretório do projeto (onde está o `package.json`):

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
```

### 3. Inicializar o Capacitor

```bash
npx cap init "PLENIPAY" "com.plenipay.app"
```

- **PLENIPAY** = nome do app (pode mudar depois no Xcode).
- **com.plenipay.app** = Bundle ID (deve ser único; use o domínio invertido).

Como o app vai carregar a URL e não arquivos locais, o `webDir` não precisa ser o build do Next. Pode usar a pasta `public` só para o Capacitor ter um `index.html` mínimo, ou criar uma pasta `www` com um único `index.html` que redireciona. O que importa é a configuração do **server.url** no próximo passo.

### 4. Criar um `webDir` mínimo

O Capacitor exige um `webDir`. Crie uma pasta e um `index.html` que só redireciona para o site:

```bash
mkdir -p www
```

Crie `www/index.html` com algo assim (substitua pela sua URL real):

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=https://www.plenipay.com">
  <title>PLENIPAY</title>
</head>
<body>
  <p>Carregando...</p>
  <script>window.location.href = 'https://www.plenipay.com';</script>
</body>
</html>
```

Assim, quando o Capacitor não estiver usando `server.url`, ainda há um fallback. O comportamento principal virá do `capacitor.config`.

### 5. Configurar `capacitor.config.ts` para carregar a URL

Na raiz do projeto, crie (ou edite) `capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plenipay.app',
  appName: 'PLENIPAY',
  webDir: 'www',
  server: {
    url: 'https://www.plenipay.com',  // URL do seu site em produção
    cleartext: false,
  },
};

export default config;
```

- Troque `https://www.plenipay.com` pela URL real do seu app (com HTTPS).
- Assim que o app abrir, o WebView carrega essa URL em tela cheia.

### 6. Adicionar a plataforma iOS

```bash
npx cap add ios
```

Isso gera a pasta `ios/` com o projeto Xcode.

### 7. Abrir no Xcode e configurar assinatura

```bash
npx cap open ios
```

No Xcode:

1. Selecione o projeto **App** no painel esquerdo.
2. Aba **Signing & Capabilities**:
   - Marque **Automatically manage signing**.
   - **Team:** selecione sua conta Apple Developer.
   - **Bundle Identifier:** deve ser exatamente o `appId` (ex.: `com.plenipay.app`). Crie o App ID no [developer.apple.com](https://developer.apple.com) → Certificates, Identifiers & Profiles → Identifiers se ainda não existir.
3. Conecte um iPhone ou escolha um simulador e rode (▶️) para testar.

### 8. Ajustes para a App Store

- **Ícone:** em `ios/App/App/Assets.xcassets/AppIcon.appiconset` coloque os ícones nas resoluções que o Xcode pede (ele mostra os “slots” vazios). Você pode usar o mesmo ícone do PWA (`public/app_icon.png`) e gerar os tamanhos com [appicon.co](https://appicon.co) ou similar.
- **Nome e versão:** no Xcode, target **App** → General → **Display Name** (nome que aparece no iPhone) e **Version** / **Build**.
- **Privacidade:** se o app usar câmera, microfone ou localização no site, pode ser necessário declarar no Xcode (capabilities) e na página de privacidade da App Store.

### 9. Gerar o arquivo para a App Store

1. No Xcode: **Product → Archive**.
2. Quando o archive terminar, abre o **Organizer**. Clique em **Distribute App**.
3. Escolha **App Store Connect** → **Upload**.
4. Siga o assistente (assinatura automática, etc.). No fim o Xcode envia o build para a Apple.

### 10. App Store Connect

1. Acesse [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. **My Apps** → **+** → **New App** (plataforma iOS).
3. Preencha:
   - Nome do app
   - Idioma primário
   - Bundle ID (o mesmo do projeto: `com.plenipay.app`)
   - SKU (ex.: `plenipay-ios-001`)
4. Depois que o upload do Xcode aparecer em **TestFlight** (pode levar alguns minutos), vá em **App Store** (aba do app) e preencha:
   - Descrição, palavras-chave, capturas de tela (iPhone 6,7” e 5,5” pelo menos), categoria (ex.: Finanças), etc.
   - Versão e “O que há de novo”.
5. Envie para revisão. A Apple costuma levar 24–48 h (às vezes mais).

---

## Modo app vs site: modificar a interface só no app (sem afetar o site)

O app abre a URL com **`?platform=app`**. O middleware grava um cookie e redireciona; quem acessa pelo **navegador** nunca recebe esse cookie, então o **site continua igual** para todos.

- **No navegador:** ninguém usa `?platform=app` → sem cookie → layout e estilos atuais (zero impacto).
- **No app (Capacitor):** a URL inicial é `https://plenipay.com?platform=app` → cookie `platform=app` é setado → o `<body>` ganha a classe **`platform-app`** e o atributo **`data-platform="app"`**.

### Como usar no código

1. **CSS:** para mudar só no app, use a classe no `body`:
   ```css
   /* globals.css ou qualquer CSS */
   body.platform-app .algum-elemento { ... }
   ```

2. **React (client):** para mostrar conteúdo diferente no app:
   ```tsx
   import { useAppPlatform } from '@/components/AppPlatformProvider'
   // ...
   const isApp = useAppPlatform()
   return isApp ? <LayoutApp /> : <LayoutWeb />
   ```

Assim você pode deixar o app “mais moderno e clean” (novo layout, cores, componentes) **sem alterar** o que o usuário vê no site no navegador.

---

## Dicas importantes

- **Apple e “wrapper”:** apps que são só um WebView podem ser questionados. Se pedirem “mais valor nativo”, você pode adicionar depois, por exemplo:
  - **Push Notifications** (Capacitor tem plugin; configurar no Apple Developer e no backend).
  - Pequenos gestos nativos (compartilhar, abrir links externos no Safari, etc.).
- **HTTPS:** a URL em `server.url` **tem** que ser HTTPS em produção.
- **Atualizações:** como o app só abre o site, qualquer mudança no site já vale para quem usa o app; você só precisa gerar novo build no Xcode quando mudar ícone, nome, permissões ou Bundle ID.

---

## Resumo dos comandos (opção A)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "PLENIPAY" "com.plenipay.app"
# Criar www/index.html (redirecionamento) e configurar capacitor.config.ts com server.url
npx cap add ios
npx cap open ios
# No Xcode: assinatura, ícone, Archive → Distribute → App Store Connect
```

Se quiser, no próximo passo podemos: (1) criar o `www/index.html` e o `capacitor.config.ts` exatamente no seu repo, ou (2) esboçar como adicionar Push Notifications com Capacitor para fortalecer a submissão na App Store.
