# Automação WhatsApp: evitar banimento por spam

O número foi configurado com **intervalos longos** e **limites por execução** para reduzir o risco de banimento.

## O que foi alterado (anti-spam)

- **Intervalo entre cada mensagem automática:** 60–90 segundos (antes 8–12 s).
- **Máximo por execução do cron:**
  - Follow-up 10 min (leads no modo teste): **2** mensagens por run.
  - Lead recovery (5m, 10m, 15h, 24h, 48h): **2** mensagens por run.
  - Mensagens inteligentes (plen-smart): **2** mensagens por run.
- **Frequência dos crons:**
  - Boas-vindas + lead recovery: a cada **15 minutos** (antes 2 min).
  - Follow-up 10min + smart messages: a cada **30 minutos** (antes 10 min).

No pior caso, em uma execução são enviadas no máximo **6** mensagens (2+2+2), com **60–90 s** entre cada uma.

## Desativar toda a automação de vácuo

Se quiser **desligar** as mensagens automáticas de recuperação/vácuo (e manter só boas-vindas opcional):

No **Railway** (ou onde estiver o app), adicione:

```bash
WHATSAPP_CRON_VACUUM_DISABLED=true
```

Com isso:

- **Cron boas-vindas:** continua enviando boas-vindas a quem ficou de fora; **não** envia mais lead recovery (5m, 10m, …) nem revisão de vácuo.
- **Cron plen-smart:** não envia nada (retorna `vacuumDisabled: true`).

Assim você evita qualquer envio em massa por cron até resolver o número ou a política de uso.

## Reativar depois

Remova a variável `WHATSAPP_CRON_VACUUM_DISABLED` ou defina como `false` e faça redeploy. A automação volta a rodar com os limites acima.
