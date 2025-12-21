# 📋 Instruções para Configurar DNS do plenipay.com

## 🎯 Objetivo

Configurar o subdomínio `webhook.plenipay.com` para apontar para o Cloudflare Tunnel.

## 📝 Passo a Passo

### 1. Acesse o Cloudflare Dashboard

1. Acesse: https://dash.cloudflare.com
2. Faça login na sua conta
3. Selecione o domínio: **plenipay.com**

### 2. Vá para DNS

1. No menu lateral, clique em **DNS**
2. Clique em **Records** (Registros)

### 3. Adicionar Novo Registro CNAME

1. Clique no botão **Add record** (Adicionar registro)

2. Preencha os campos:
   - **Type**: Selecione **CNAME**
   - **Name**: Digite `webhook` (sem o .plenipay.com)
   - **Target**: Cole o ID do tunnel seguido de `.cfargotunnel.com`
     - Exemplo: `abc12345-6789-0123-4567-890abcdef123.cfargotunnel.com`
     - ⚠️ **O ID do tunnel será mostrado quando você executar o script**
   - **Proxy status**: **Desligado** (nuvem cinza) ⚠️ **MUITO IMPORTANTE!**
   - **TTL**: Deixe como **Auto**

3. Clique em **Save** (Salvar)

### 4. Verificar Configuração

Após salvar, você deve ver um registro assim:

```
Type    Name      Content                                    Proxy
CNAME   webhook   abc12345-...cfargotunnel.com              DNS only
```

⚠️ **IMPORTANTE**: O ícone da nuvem deve estar **cinza** (DNS only), não laranja (Proxied)!

## ⏱️ Propagação do DNS

- Geralmente leva **2-5 minutos** para propagar
- Pode levar até **24 horas** em casos raros
- Você pode verificar com: `nslookup webhook.plenipay.com`

## ✅ Testar

Após configurar, teste se está funcionando:

```bash
curl https://webhook.plenipay.com/api/whatsapp/apifacil/webhook
```

Se retornar algo (mesmo que seja erro 404 ou similar), significa que o DNS está funcionando!

## 🔗 URL Final do Webhook

Após configurar o DNS, sua URL do webhook será:

```
https://webhook.plenipay.com/api/whatsapp/apifacil/webhook
```

Esta URL é **100% fixa** e não mudará nunca!

## 🆘 Problemas Comuns

### DNS não está funcionando
- Verifique se o Proxy está **desligado** (nuvem cinza)
- Aguarde mais alguns minutos
- Verifique se o Target está correto (com .cfargotunnel.com no final)

### Tunnel não conecta
- Verifique se o tunnel está rodando: `ps aux | grep cloudflared`
- Verifique os logs: `tail -f logs/cloudflare-tunnel.log`
- Reinicie o tunnel: `cloudflared tunnel run plenipay-webhook`

### Erro 404
- Isso é normal! Significa que o DNS está funcionando
- O webhook funcionará quando o apifacil.dev chamar a URL








