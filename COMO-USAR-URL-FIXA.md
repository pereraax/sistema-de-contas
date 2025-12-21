# 🔗 Como Usar URL Fixa para o Webhook

## ✅ Solução: Cloudflare Tunnel (GRATUITA)

O Cloudflare Tunnel oferece uma URL fixa **gratuita** que permanece a mesma enquanto o processo estiver rodando.

## 🚀 Como Usar

### 1. Iniciar o Tunnel (URL Fixa)

```bash
npm run tunnel:fixo
```

Ou diretamente:

```bash
./iniciar-tunnel-fixo.sh
```

### 2. Copiar a URL do Webhook

O script mostrará a URL do webhook. Copie e cole no apifacil.dev:

```
🔗 URL do Webhook (copie e cole no apifacil.dev):
   https://xxxxx.trycloudflare.com/api/whatsapp/apifacil/webhook
```

### 3. Ver a URL a Qualquer Momento

```bash
npm run url:tunnel
```

Ou diretamente:

```bash
./ver-url-tunnel.sh
```

## 📋 Passo a Passo Completo

1. **Inicie o servidor** (se ainda não estiver rodando):
   ```bash
   npm run dev
   ```

2. **Inicie o tunnel**:
   ```bash
   npm run tunnel:fixo
   ```

3. **Copie a URL do webhook** que aparecer na tela

4. **Cole no apifacil.dev**:
   - Acesse: https://apifacil.dev
   - Vá nas configurações da sua instância
   - Cole a URL do webhook
   - Salve

5. **Pronto!** A URL ficará fixa enquanto o tunnel estiver rodando

## ⚠️ IMPORTANTE

- ✅ A URL é **FIXA** enquanto o processo estiver rodando
- ✅ Não precisa trocar no apifacil.dev enquanto não parar o tunnel
- ⚠️ Se parar o Cloudflare Tunnel, a URL mudará na próxima vez
- 💡 Para manter sempre a mesma URL, mantenha o tunnel rodando

## 🛑 Como Parar o Tunnel

```bash
pkill -f 'cloudflared tunnel'
```

## 📊 Ver Logs em Tempo Real

```bash
tail -f logs/cloudflare-tunnel.log
```

## 💡 Dicas

- A URL é salva em `.webhook-url.txt` para fácil acesso
- Use `npm run url:tunnel` para ver a URL a qualquer momento
- O tunnel funciona mesmo se o servidor reiniciar (desde que esteja na porta 3000)

## 🔄 Reiniciar o Tunnel

Se precisar reiniciar:

```bash
# Parar
pkill -f 'cloudflared tunnel'

# Iniciar novamente
npm run tunnel:fixo
```

**Nota:** A URL pode mudar ao reiniciar. Se isso acontecer, atualize no apifacil.dev.








