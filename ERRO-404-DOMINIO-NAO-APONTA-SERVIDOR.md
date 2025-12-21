# ❌ ERRO 404 - DOMÍNIO NÃO APONTA PARA SERVIDOR

## 🔍 PROBLEMA IDENTIFICADO:

O erro `404: DEPLOYMENT_NOT_FOUND` significa que:
- ❌ O domínio `plenipay.com` está apontando para **Vercel** (ou outro serviço)
- ❌ **NÃO está apontando** para o servidor Hostinger onde você fez deploy

---

## ✅ SOLUÇÃO: CONFIGURAR DNS PARA APONTAR AO SERVIDOR

### **Passo 1: Verificar IP do Servidor**

No terminal SSH, execute:

```bash
# Ver IP do servidor
hostname -I
# Ou
ip addr show eth0 | grep "inet "
```

**Anote o IP** (provavelmente: `31.97.27.20`)

---

### **Passo 2: Configurar DNS no Registro.br (ou onde registrou o domínio)**

1. **Acesse o painel do registro do domínio:**
   - Se for Registro.br: https://registro.br
   - Ou o painel onde você registrou o domínio

2. **Vá em "DNS" ou "Zona DNS"**

3. **Configure os registros:**

   **Registro A:**
   ```
   Tipo: A
   Nome: @ (ou plenipay.com)
   Valor: 31.97.27.20
   TTL: 3600
   ```

   **Registro A (www):**
   ```
   Tipo: A
   Nome: www
   Valor: 31.97.27.20
   TTL: 3600
   ```

4. **Salve as alterações**

5. **Aguarde propagação DNS** (pode levar até 24 horas, geralmente 1-2 horas)

---

### **Passo 3: Configurar Nginx no Servidor (Recomendado)**

Para que o domínio funcione sem porta (https://plenipay.com), configure Nginx:

```bash
# Instalar Nginx (se não tiver)
apt update
apt install nginx -y

# Criar configuração
nano /etc/nginx/sites-available/plenipay
```

**Cole esta configuração:**

```nginx
server {
    listen 80;
    server_name plenipay.com www.plenipay.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Ativar configuração:**

```bash
# Criar link simbólico
ln -s /etc/nginx/sites-available/plenipay /etc/nginx/sites-enabled/

# Remover configuração padrão (se existir)
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx

# Verificar status
systemctl status nginx
```

---

### **Passo 4: Configurar Firewall (se necessário)**

```bash
# Verificar se firewall está ativo
ufw status

# Se estiver ativo, liberar portas
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
```

---

## 🔍 VERIFICAR SE SERVIDOR ESTÁ ACESSÍVEL:

### **Testar diretamente pelo IP:**

No navegador, acesse:
- `http://31.97.27.20:3000`

**Se funcionar:** O servidor está OK, só precisa configurar DNS e Nginx.

**Se não funcionar:** Verifique se o servidor está rodando.

---

## 📋 VERIFICAÇÕES NO SERVIDOR:

### **1. Verificar se servidor está rodando:**

```bash
pm2 status
```

**Deve mostrar "sistema-contas" online.**

---

### **2. Verificar se porta 3000 está aberta:**

```bash
netstat -tuln | grep 3000
```

**Ou:**

```bash
ss -tuln | grep 3000
```

**Deve mostrar que a porta 3000 está em uso.**

---

### **3. Testar localmente no servidor:**

```bash
curl http://localhost:3000
```

**Deve retornar HTML da aplicação.**

---

## 🌐 CONFIGURAR SSL/HTTPS (OPCIONAL - RECOMENDADO):

Para usar HTTPS (https://plenipay.com), instale Certbot:

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
certbot --nginx -d plenipay.com -d www.plenipay.com

# Seguir instruções (email, aceitar termos, etc.)
```

---

## ⚠️ IMPORTANTE:

### **Se o domínio estava no Vercel:**

1. **Remova o domínio do Vercel:**
   - Acesse: https://vercel.com
   - Vá em Settings → Domains
   - Remova `plenipay.com`

2. **Configure DNS para apontar ao servidor Hostinger**

3. **Aguarde propagação DNS** (1-24 horas)

---

## ✅ CHECKLIST:

- [ ] Verifiquei IP do servidor (`hostname -I`)
- [ ] Configurei DNS para apontar ao IP do servidor
- [ ] Instalei e configurei Nginx
- [ ] Testei servidor pelo IP: `http://31.97.27.20:3000`
- [ ] Verifiquei que servidor está rodando (`pm2 status`)
- [ ] Aguardei propagação DNS
- [ ] Testei domínio no navegador

---

## 🚀 RESUMO RÁPIDO:

1. ✅ **Configure DNS:** Aponte `plenipay.com` para `31.97.27.20`
2. ✅ **Configure Nginx:** Para servir na porta 80
3. ✅ **Teste pelo IP:** `http://31.97.27.20:3000`
4. ✅ **Aguarde DNS:** Pode levar 1-24 horas
5. ✅ **Teste domínio:** `https://plenipay.com`

---

**O problema é que o DNS está apontando para Vercel, não para o servidor Hostinger!** 🔧

Configure o DNS para apontar ao IP do servidor (`31.97.27.20`) e configure Nginx!


