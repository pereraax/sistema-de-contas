# 🔗 Como Configurar URL Fixa Permanente no Cloudflare

## 📋 Pré-requisitos

1. Conta no Cloudflare (gratuita): https://dash.cloudflare.com/sign-up
2. Um domínio configurado no Cloudflare (ou você pode usar um subdomínio)

## 🚀 Opção 1: Cloudflare Tunnel com Domínio Próprio (URL 100% Fixa)

### Passo 1: Instalar Cloudflare Tunnel

```bash
# macOS
brew install cloudflared

# Ou baixar diretamente
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

### Passo 2: Fazer Login no Cloudflare

```bash
cloudflared tunnel login
```

Isso abrirá o navegador para você fazer login e autorizar.

### Passo 3: Criar um Tunnel

```bash
cloudflared tunnel create plen-webhook
```

Isso criará um tunnel chamado "plen-webhook" e mostrará o ID do tunnel.

### Passo 4: Criar Arquivo de Configuração

Crie o arquivo `~/.cloudflared/config.yml`:

```yaml
tunnel: SEU_TUNNEL_ID_AQUI
credentials-file: /Users/SEU_USUARIO/.cloudflared/SEU_TUNNEL_ID.json

ingress:
  - hostname: webhook.seudominio.com
    service: http://localhost:3000
  - service: http_status:404
```

**Substitua:**
- `SEU_TUNNEL_ID_AQUI` pelo ID do tunnel criado
- `SEU_USUARIO` pelo seu usuário do macOS
- `webhook.seudominio.com` pelo subdomínio que você quer usar

### Passo 5: Configurar DNS no Cloudflare

1. Acesse: https://dash.cloudflare.com
2. Selecione seu domínio
3. Vá em **DNS** > **Records**
4. Adicione um registro:
   - **Type**: CNAME
   - **Name**: webhook (ou o subdomínio que você escolheu)
   - **Target**: SEU_TUNNEL_ID.cfargotunnel.com
   - **Proxy**: Desligado (nuvem cinza)
   - Clique em **Save**

### Passo 6: Iniciar o Tunnel

```bash
cloudflared tunnel run plen-webhook
```

Ou para rodar em background:

```bash
cloudflared tunnel run plen-webhook > cloudflare-tunnel.log 2>&1 &
```

### Passo 7: Usar a URL Fixa

Sua URL será:
```
https://webhook.seudominio.com/api/whatsapp/apifacil/webhook
```

Esta URL será **100% fixa** e não mudará nunca!

---

## 🚀 Opção 2: Cloudflare Tunnel com Nome Fixo (Mais Simples)

Se você não tem um domínio próprio, pode usar um nome fixo no trycloudflare.com:

### Passo 1: Instalar Cloudflare Tunnel

```bash
brew install cloudflared
```

### Passo 2: Criar um Tunnel com Nome

```bash
cloudflared tunnel --url http://localhost:3000 --name plen-webhook
```

Isso criará um tunnel com o nome "plen-webhook" e uma URL como:
```
https://plen-webhook-xxxxx.trycloudflare.com
```

### Passo 3: Usar a URL

A URL será fixa enquanto você usar o mesmo nome. Se precisar manter sempre a mesma, use a Opção 1.

---

## 🚀 Opção 3: Script Automatizado (Recomendado)

Criei um script que facilita tudo:

### 1. Execute o script:

```bash
./configurar-cloudflare-url-fixa.sh
```

O script irá:
- Verificar se cloudflared está instalado
- Fazer login (se necessário)
- Criar o tunnel
- Configurar tudo automaticamente

---

## 📝 Script de Inicialização Automática

Para iniciar automaticamente quando o servidor iniciar, crie um arquivo `iniciar-cloudflare-fixo.sh`:

```bash
#!/bin/bash

# Verificar se servidor está rodando
if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️ Servidor não está rodando. Iniciando..."
    npm run dev > /dev/null 2>&1 &
    sleep 5
fi

# Iniciar tunnel
echo "🚀 Iniciando Cloudflare Tunnel..."
cloudflared tunnel run plen-webhook > logs/cloudflare-tunnel.log 2>&1 &

echo "✅ Tunnel iniciado!"
echo "🔗 URL: https://webhook.seudominio.com/api/whatsapp/apifacil/webhook"
```

---

## 🔧 Troubleshooting

### Problema: "tunnel not found"
**Solução**: Certifique-se de que o tunnel foi criado:
```bash
cloudflared tunnel list
```

### Problema: "DNS not configured"
**Solução**: Verifique se o registro CNAME está configurado corretamente no Cloudflare.

### Problema: "credentials not found"
**Solução**: Faça login novamente:
```bash
cloudflared tunnel login
```

---

## 💡 Dicas

1. **Para manter sempre rodando**: Use `pm2` ou `launchd` (macOS)
2. **Para ver logs**: `tail -f logs/cloudflare-tunnel.log`
3. **Para parar**: `pkill -f cloudflared`
4. **Para reiniciar**: Pare e inicie novamente com o mesmo nome

---

## 🎯 Resumo Rápido

**Opção Mais Simples (sem domínio próprio):**
```bash
cloudflared tunnel --url http://localhost:3000 --name plen-webhook
```

**Opção Profissional (com domínio próprio):**
1. `cloudflared tunnel login`
2. `cloudflared tunnel create plen-webhook`
3. Configurar DNS no Cloudflare
4. `cloudflared tunnel run plen-webhook`

Qual opção você prefere usar?






