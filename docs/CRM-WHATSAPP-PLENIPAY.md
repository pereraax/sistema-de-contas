# CRM WhatsApp Plenipay

CRM interno para organizar contatos, conversas e mensagens do WhatsApp (Z-API).

## Estrutura do banco

- **crm_contacts**: contatos (telefone, nome, email, status, data_primeiro_contato, ultima_interacao, etc.)
- **crm_conversations**: conversas por contato (status: aberta, em_atendimento, fechada)
- **crm_messages**: mensagens entrada/saída (tipo, origem whatsapp/sistema/automacao)
- **crm_interaction_logs**: log de atividades do sistema

## Status de contato

- `novo_lead` — Primeiro contato
- `aguardando_email` — Aguardando e-mail
- `aguardando_codigo` — Aguardando código
- `usuario_ativo` — Usuário ativo
- `cliente_pago` — Cliente pagante
- `inativo` — Inativo

## Webhook Z-API

**URL:** `POST {SITE}/api/whatsapp/zapi/webhook`

Fluxo:
1. Mensagem recebida → webhook chamado
2. Contato criado ou atualizado (por telefone)
3. Conversa criada ou reutilizada
4. Mensagem salva (entrada)
5. `ultima_interacao` do contato atualizada

Configurar na Z-API a URL do webhook e o método POST.

Variáveis de ambiente:
- `Z_API_INSTANCE_ID` — ID da instância
- `Z_API_TOKEN` — Token da instância

## Envio de mensagens

- **Apenas manual** pelo painel admin (CRM WhatsApp → Inbox).
- Não há envio em massa nem respostas automáticas sem interação.
- O envio é feito via Z-API (ou API Fácil se configurada em `lib/whatsapp-apifacil.ts`).

## Painel admin

- **Menu:** Admin → CRM WhatsApp
- **Inbox:** lista de conversas, filtro por status, busca
- **Chat:** histórico e envio manual
- **Painel lateral:** detalhes do contato (telefone, email, status, datas, observações)
- **Resolver:** marcar conversa como fechada

## Segurança

- Todas as rotas do CRM exigem admin logado (`verifyAdminToken`).
- Webhook é público (Z-API chama); validação por payload esperado.
- Não enviar mensagens automáticas em massa; não gerar spam.
