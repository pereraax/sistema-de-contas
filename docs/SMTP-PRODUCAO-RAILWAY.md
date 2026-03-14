# SMTP em produção (Railway / Hostinger)

Se o cadastro por WhatsApp funcionava em **localhost** mas em **produção** o email não é enviado (Plen mostra "Não foi possível reenviar agora"):

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

## 5. Resumo rápido

1. Confira **logs** no Railway ao tentar enviar o código.
2. Teste com **POST /api/teste-smtp** em produção.
3. Confira **SMTP_USER** = email completo, **SMTP_PASSWORD** = senha ou senha de app (2FA), **SUPABASE_SERVICE_ROLE_KEY** definida.
4. Se continuar falha de conexão com 465, troque para **587** ou avalie usar um provedor de email por API.
