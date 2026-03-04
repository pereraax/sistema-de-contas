# Desenvolver o app sem depender do Google

Para você **testar o fluxo do app** (onboarding, quiz, home) sem precisar do login com Google funcionando no localhost.

## 1. Ativar login anônimo no Supabase (uma vez)

1. Abra **Supabase** → **Authentication** → **Providers**.
2. Encontre **Anonymous** e **ative** (Enable).
3. Salve.

## 2. Usar o botão "Entrar como dev" no app

1. Rode `npm run dev`.
2. Abra no navegador **ou** no simulador:
   - `http://localhost:3000?platform=app`  
   - ou `http://192.168.100.57:3000?platform=app` (simulador)
3. Na tela do app (Criar conta / Já tenho conta), aparece o botão:
   - **🔧 Entrar como dev (pula Google, só local)**
4. Clique nele. Você entra **sem Google** e é redirecionado para **/onboarding** (bem-vindo + quiz).

Esse botão **só aparece** em localhost ou em 192.168.x.x (não aparece em plenipay.com).

Assim você consegue desenvolver e testar todo o fluxo do app (onboarding, quiz, planos, home) sem depender do redirect do Google.
