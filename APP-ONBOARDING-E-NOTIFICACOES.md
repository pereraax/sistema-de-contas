# Onboarding do app (iPhone) e notificações push

## Onde isso é feito

Tudo é feito **neste mesmo projeto** (Next.js + Capacitor). O app iPhone é o site carregado no WebView; as telas de onboarding são páginas Next.js que só aparecem quando o usuário está no app (`platform=app`).

## Fluxo após login com Google (primeira vez no app)

1. Usuário clica em **Continuar com Google** no app e autoriza.
2. Callback OAuth redireciona para **`/home?platform=app`** → middleware seta cookie `platform=app`.
3. Na **`/home`**, o componente **`AppOnboardingGate`** verifica: está no app e ainda não completou onboarding? → redireciona para **`/onboarding`**.
4. **`/onboarding`** (só no app):
   - **Passo 1:** Tela de bem-vindo → "Continuar".
   - **Passo 2:** Pedido para **ativar notificações** no iPhone (com botão "Agora não").
   - **Passo 3:** **Quiz** (4 perguntas: vida financeira, por que não guarda, 5 meses, é isso que quer?).
   - **Passo 4:** "Tudo certo! Agora escolha seu plano" → botão **Ver planos**.
5. Ao clicar em **Ver planos**, o sistema grava em **user_metadata** que o onboarding foi concluído (`app_onboarding_completed_at`) e redireciona para **`/planos?from=app`**.
6. Nas próximas vezes que o usuário abrir o app e for para `/home`, o gate não redireciona mais para `/onboarding`.

## Onde editar

- **Telas e textos do onboarding:** `app/onboarding/page.tsx`  
  - Steps: `welcome` → `notifications` → `quiz` → `done`.  
  - Perguntas do quiz: array `QUIZ_STEPS`.
- **Redirecionar só no app / primeira vez:** `components/AppOnboardingGate.tsx` (usa `user_metadata.app_onboarding_completed_at`).
- **Inserir o gate na home:** `app/home/page.tsx` (conteúdo da home está dentro de `<AppOnboardingGate>`).

## Notificações push no iPhone

O onboarding já chama o plugin de notificações **se existir** no projeto Capacitor:

- No **código web** (`app/onboarding/page.tsx`), é usado `Capacitor.Plugins.PushNotifications` para pedir permissão e registrar.
- Para funcionar de verdade no iPhone você precisa:
  1. **Instalar o plugin** no projeto (na pasta do app iOS, ex.: `ios/App/App`):
     ```bash
     npm install @capacitor/push-notifications
     npx cap sync
     ```
  2. **Configurar no Xcode**: capacidades **Push Notifications** e **Background Modes** (Remote notifications).
  3. **Configurar APNs** (Apple Push Notification service) e, se quiser, um backend para enviar as notificações (por exemplo Supabase ou um servidor seu).

Enquanto o plugin não estiver instalado/configurado, o botão "Ativar notificações" só pede permissão no navegador (se disponível) e segue para o quiz; no app nativo, ao adicionar o plugin e o APNs, o mesmo botão passará a pedir permissão no iPhone.

## Resumo

| O quê | Onde |
|-------|------|
| Criar/alterar app iPhone | Este repositório (Next.js + Capacitor). Build do app: `npx cap sync`, abrir `ios/App` no Xcode, arquivar e enviar para a App Store. |
| Telas de onboarding (bem-vindo, notificações, quiz, planos) | `app/onboarding/page.tsx` e redirecionamento em `AppOnboardingGate` + home. |
| Lógica “primeira vez” | `user_metadata.app_onboarding_completed_at` (Supabase Auth). |
| Notificações push | Plugin `@capacitor/push-notifications` no projeto iOS + APNs; a UI de pedido já está em `app/onboarding/page.tsx`. |
