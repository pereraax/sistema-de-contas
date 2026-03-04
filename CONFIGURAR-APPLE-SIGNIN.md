# Como configurar o cadastro com Apple (Sign in with Apple)

Para o botão **"Cadastrar com Apple"** funcionar, é preciso configurar no **Apple Developer** e no **Supabase**. O fluxo é OAuth (igual ao do Google).

---

## 1. Apple Developer (developer.apple.com)

Você precisa de uma conta **Apple Developer** (paga, ~US$ 99/ano).

### 1.1 App ID (identificador do app)

1. Acesse [Identifiers](https://developer.apple.com/account/resources/identifiers/list/bundleId).
2. Clique em **+** para criar um novo.
3. Escolha **App IDs** → Continue.
4. Descrição: ex. `PleniPay`.
5. **Bundle ID**: ex. `com.plenipay.app` (ou o que você já usa no app).
6. Em **Capabilities**, marque **Sign in with Apple**.
7. Salve.

### 1.2 Services ID (para login na web)

1. Acesse [Identifiers](https://developer.apple.com/account/resources/identifiers/list/serviceId) e use o filtro **Services ID**.
2. Clique em **+** para criar.
3. **Description**: ex. `PleniPay Web`.
4. **Identifier**: ex. `com.plenipay.app.service` (reverse domain).
5. Marque **Sign in with Apple** e clique em **Configure**:
   - **Primary App ID**: selecione o App ID que você criou acima.
   - **Domains and Subdomains**: adicione o domínio do **Supabase** do seu projeto, ex. `frhxqgcqmxpjpnghsvoe.supabase.co` (encontre em Supabase → Settings → API → Project URL).
   - **Return URLs**: adicione exatamente:  
     `https://frhxqgcqmxpjpnghsvoe.supabase.co/auth/v1/callback`  
     (troque pelo *ref* do seu projeto Supabase).
6. Salve.

### 1.3 Chave .p8 (Signing Key)

1. Acesse [Keys](https://developer.apple.com/account/resources/authkeys/list).
2. Clique em **+** para criar uma nova chave.
3. **Key Name**: ex. `PleniPay Apple Sign In`.
4. Marque **Sign in with Apple** e clique em **Configure** → selecione o App ID → Salvar.
5. **Register** e depois **Download** o arquivo `.p8`.  
   **Importante:** você só pode baixar uma vez. Guarde o arquivo em local seguro.
6. Anote o **Key ID** que aparece na lista (ex.: `ABC123XYZ`).

### 1.4 Dados que você precisa anotar

- **Team ID**: canto superior direito do Apple Developer (ex.: `ABCD123456`).
- **Services ID**: o Identifier do Services ID (ex.: `com.plenipay.app.service`).
- **Key ID**: o ID da chave que você criou.
- **Arquivo .p8**: o arquivo baixado (ex.: `AuthKey_ABC123XYZ.p8`).

### 1.5 Gerar o Secret (client secret) a partir do .p8

A Apple exige um **client secret** gerado com a chave .p8. O Supabase usa isso para falar com a Apple.

1. Use o gerador oficial (não envia a chave para servidor):  
   **https://supabase.com/docs/guides/auth/social-login/auth-apple** (procure por “Use this tool to generate” / “generate a new Apple client secret” na doc).
2. Ou use um gerador que rode no seu computador (ex.: script que gera JWT com o .p8).
3. Você vai precisar informar:
   - **Team ID**
   - **Services ID** (Client ID)
   - **Key ID**
   - **Arquivo .p8** (conteúdo do arquivo)
   - **Validade** (ex.: 6 meses — a Apple exige renovar o secret a cada 6 meses).

O resultado é um **Secret Key** (texto longo). Esse valor será colado no Supabase.

---

## 2. Supabase (Dashboard)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto.
2. **Authentication** → **Providers** → **Apple**.
3. Ative **Enable**.
4. Preencha:
   - **Services ID (Client ID)**: o mesmo do Services ID (ex.: `com.plenipay.app.service`).
   - **Secret Key**: o secret que você gerou no passo 1.5 (ou o que o Supabase pedir como “Apple Secret”).
   - Se o formulário pedir **Key ID**, **Team ID** e **Bundle ID**, use os valores anotados no passo 1.4; **Bundle ID** = App ID (ex.: `com.plenipay.app`).
5. Salve.

---

## 3. Redirect URLs no Supabase

Em **Authentication** → **URL Configuration**:

- **Redirect URLs** (uma por linha):
  - `https://plenipay.com/auth/callback`
  - `http://localhost:3000/auth/callback`
  - Se usar www: `https://www.plenipay.com/auth/callback`

Assim, depois de o usuário autorizar na Apple, o Supabase redireciona para o seu site (ex.: `/auth/callback`) e o login/cadastro conclui.

---

## 4. Renovação do secret (a cada 6 meses)

Para fluxo **web (OAuth)**, a Apple exige que o **client secret** seja renovado **a cada 6 meses**:

- Gere um novo secret com o mesmo .p8 (ou uma nova chave, se precisar).
- Atualize o **Secret Key** do provedor Apple no Supabase.
- Coloque um lembrete no calendário para não deixar vencer.

---

## 5. Testar

1. Abra o site (ou localhost) na página de cadastro/login.
2. Clique em **Cadastrar com Apple** (ou “Continuar com Apple”).
3. Deve abrir a tela da Apple para autorizar; depois o usuário volta para o seu site e deve estar logado.

Se aparecer erro do tipo **“Unsupported provider”** ou **“provider is not enabled”**, confira se o provedor Apple está **Enable** no Supabase e se o **Services ID** e **Secret Key** estão corretos.

---

## Resumo rápido

| Onde           | O quê |
|----------------|--------|
| Apple Developer | App ID com “Sign in with Apple”, Services ID com domínio/Return URL do Supabase, chave .p8, Key ID, Team ID. |
| Ferramenta/script | Gerar **Secret Key** (client secret) a partir do .p8. |
| Supabase       | Provider Apple ativado, Services ID = Client ID, Secret Key preenchido, Redirect URLs com `plenipay.com/auth/callback` e `localhost:3000/auth/callback`. |

Depois disso, o cadastro com Apple no seu projeto fica configurado.
