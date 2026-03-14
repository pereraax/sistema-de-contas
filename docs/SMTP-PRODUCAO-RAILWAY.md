# SMTP em produção (Railway / Hostinger)

Se o cadastro por WhatsApp funcionava em **localhost** mas em **produção** o email não é enviado (Plen mostra "Não foi possível reenviar agora" ou "Não foi possível enviar o código agora"):

---

## Causa: Railway libera SMTP só no plano Pro (não no Hobby)

Nos logs aparece **`[SMTP] Erro ao enviar email: Connection timeout`** e **`Código: ETIMEDOUT`**. No **Railway**, as portas **465** e **587** (SMTP) estão **bloqueadas** nos planos Free, Trial e **Hobby**. Mesmo o **Hobby sendo pago**, ele **não** inclui SMTP. Apenas o plano **Pro** libera as portas 465 e 587.

**Se você já tem um plano ativado (ex.: Hobby):**

1. Confirme qual plano está ativo: [railway.app](https://railway.app) → seu projeto → **Settings** → **Billing**. O nome deve ser **Pro**, não Hobby.
2. Se estiver no **Hobby**, faça **upgrade para Pro** (Settings → Billing → Pro). Só o Pro libera SMTP.
3. Depois de estar no **Pro**, faça um **Redeploy** do serviço: **Deployments** → ⋮ no último deploy → **Redeploy**. Sem o redeploy, a liberação das portas não entra em efeito.
4. Mantenha as variáveis de SMTP iguais ao localhost: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` (e `SUPABASE_SERVICE_ROLE_KEY` para a Plen).

**Testar se as portas estão acessíveis (apenas no Pro):** use o Railway CLI para SSH no serviço e rode o comando de diagnóstico da [documentação do Railway](https://docs.railway.com/reference/outbound-networking#debugging-smtp-issues) (substitua pelo seu `SMTP_HOST`, ex.: `smtp.hostinger.com`). Se 465/587 aparecerem como "reachable", o SMTP do app deve funcionar.

---

## Igualar produção ao localhost (checklist)

O **código de envio é o mesmo** em localhost e produção. Para produção se comportar igual:

1. **Copie as mesmas variáveis do `.env.local` para o Railway** (Variables do projeto):

   | Variável no Railway | Obrigatório para email | Exemplo (não colar valores reais aqui) |
   |---------------------|------------------------|----------------------------------------|
   | `SMTP_HOST`         | Sim                    | `smtp.hostinger.com`                    |
   | `SMTP_PORT`         | Sim                    | `587` (localhost) ou `465` (recomendado em produção) |
   | `SMTP_USER`         | Sim                    | Email completo, ex.: `comercial@plenipay.com` |
   | `SMTP_PASSWORD`     | Sim                    | Senha do email (ou senha de app se tiver 2FA) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Sim            | A mesma chave do Supabase (Dashboard → Settings → API) |

2. **Não use variáveis diferentes** – se no `.env.local` está `SMTP_USER=comercial@plenipay.com`, no Railway deve ser o **mesmo** valor (sem espaços, aspas só se precisar).

3. **Porta:** No localhost a porta **587** costuma funcionar. No Railway a **587** pode dar timeout; use **465** no Railway. O código já tenta 465 primeiro quando você configura 587 em produção.

4. Depois de salvar as variáveis, faça um **novo deploy** (ou Redeploy no Railway) para carregar as variáveis.

## 1. Ver o erro real nos logs

Após o deploy, quando um lead pedir o código ou clicar em "Reenviar código":

1. Abra o **Railway** → seu projeto → **Deployments** → último deploy → **View Logs**.
2. Procure por linhas como:
   - `[SMTP] Tentando envio para smtp.hostinger.com:465 (SSL)` → confirma que está tentando.
   - `[SMTP] Erro ao enviar email:` e `[SMTP] Código:` → mostra o erro (ex.: `ETIMEDOUT`, `EAUTH`).
   - `[plen/email] Falha SMTP:` → confirma que o envio falhou e qual mensagem/código.

Com isso você sabe se é **conexão** (timeout, porta bloqueada) ou **autenticação** (usuário/senha).

## 2. Testar SMTP direto da produção

Chame a API de teste **no mesmo ambiente** onde o app está rodando (produção):

```bash
curl -X POST https://SEU-DOMINIO-RAILWAY.up.railway.app/api/teste-smtp \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com"}'
```

- Se der **200** e você receber o email → SMTP está ok; o problema pode ser outra parte do fluxo.
- Se der **500** → a resposta traz `error` e `code` (ex.: `ETIMEDOUT`, `EAUTH`). Use isso e os logs para corrigir.

## 3. Checklist das variáveis (Railway)

No Railway → projeto → **Variables**:

| Variável | Obrigatório | Exemplo / Observação |
|----------|-------------|----------------------|
| `SMTP_HOST` | Sim | `smtp.hostinger.com` |
| `SMTP_PORT` | Sim | `465` (SSL) ou `587` (STARTTLS). Em produção costuma funcionar melhor **465**. |
| `SMTP_USER` | Sim | **Email completo** da caixa (ex.: `contato@seudominio.com`). Na Hostinger é o email da conta. |
| `SMTP_PASSWORD` | Sim | Senha do email. Se a conta tiver **2FA**, use uma **Senha de app** (Hostinger: Email → Configurações → Senha de app). |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim (para Plen) | Sem isso o app não consegue criar usuário nem enviar código quando SMTP está configurado. |

## 4. Porta 465 vs 587

- **465 (SSL):** o app já usa por padrão quando você define `SMTP_PORT=465`. Se falhar (ex.: Railway bloqueia 465), o código tenta **587** automaticamente.
- **587 (STARTTLS):** se você definir `SMTP_PORT=587`, em produção o app tenta **465** primeiro e, se falhar, tenta 587.

Se mesmo com 465 os logs mostrarem **ETIMEDOUT** ou **ECONNREFUSED**, pode ser:

- **Firewall / rede do Railway** bloqueando saída SMTP. Nesse caso você pode precisar de um serviço de email por **API HTTP** (ex.: Resend, SendGrid) em vez de SMTP.
- **Hostinger** exige que o envio seja do mesmo domínio do email (ex.: enviar de `contato@seudominio.com` com `SMTP_USER=contato@seudominio.com`).

## 5. App diz que enviou, mas o email não chega (porta 465 ok)

Se a Plen mostra **"Enviei um código de confirmação no seu email"** e o email **não aparece** na caixa de entrada:

- O servidor SMTP **aceitou** a mensagem (por isso não há erro). O problema está na **entrega** ou na **visibilidade**.

**O que fazer:**

1. **Spam / Lixo eletrônico**  
   Peça ao destinatário para verificar a pasta de **spam** e **promoções** (Gmail). Aguarde alguns minutos; às vezes há atraso.

2. **Remetente (SMTP_USER) na Hostinger**  
   O email de envio (`SMTP_USER` / `SMTP_FROM`) deve ser uma **caixa real** criada na Hostinger, no domínio que você usa (ex.: `comercial@plenipay.com` com domínio `plenipay.com` configurado na conta). Se o domínio ou a caixa não existirem na Hostinger, eles podem aceitar a conexão mas **não entregar** o email.

3. **Conferir destinatário nos logs**  
   Nos logs do Railway, procure por:  
   `[SMTP] Tentando envio para smtp.hostinger.com:465 (SSL) destino: xxx@...`  
   Confirme se o **destino** é exatamente o email que o lead informou (sem espaço, sem typo). Ex.: `contacomerciaal01@gmail.com` (com dois "a" em "comerciaal").

4. **Teste manual pela Hostinger**  
   Envie um email de teste pelo **webmail da Hostinger** (mesmo remetente e mesmo destinatário).  
   - Se **não chegar** nem pelo webmail → problema na Hostinger ou no destinatário (spam, bloqueio).  
   - Se **chegar** pelo webmail → pode ser diferença de cabeçalhos/conteúdo; nesse caso vale testar **POST /api/teste-smtp** em produção com esse mesmo email e ver se esse email de teste chega.

5. **Domínio e reputação**  
   Envio para **Gmail/Outlook** exige que o domínio do remetente tenha **SPF/DKIM** configurado no DNS. Na Hostinger, em **Email → Configurações do domínio**, verifique se SPF/DKIM estão ativos para o domínio do `SMTP_USER`. Sem isso, o Gmail pode aceitar e mandar direto para spam ou rejeitar silenciosamente.

## 6. Resumo rápido

1. **ETIMEDOUT em produção no Railway?** Só o **plano Pro** libera SMTP (o Hobby, mesmo pago, não). Confira em Settings → Billing que está em Pro e faça **Redeploy**.
2. Confira **logs** no Railway ao tentar enviar o código (e o **destino** no log).
3. Teste com **POST /api/teste-smtp** em produção.
4. Confira **SMTP_USER** = email completo da caixa Hostinger, **SMTP_PASSWORD** = senha ou senha de app (2FA), **SUPABASE_SERVICE_ROLE_KEY** definida.
5. Se o app diz que enviou mas não chega: verificar spam, remetente válido na Hostinger, SPF/DKIM do domínio e teste pelo webmail.
