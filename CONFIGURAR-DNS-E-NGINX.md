# 🔧 CONFIGURAR DNS E NGINX - PASSO A PASSO

## ❌ PROBLEMA:

O domínio `plenipay.com` está apontando para **Vercel**, não para o servidor Hostinger.

---

## ✅ SOLUÇÃO COMPLETA:

### **PARTE 1: CONFIGURAR DNS**

#### **1. Acessar Painel do Registro do Domínio:**

- **Registro.br:** https://registro.br
- Ou o painel onde você registrou o domínio

#### **2. Ir em "DNS" ou "Zona DNS"**

#### **3. Configurar Registros A:**

**Registro 1:**
```
Tipo: A
Nome: @ (ou deixe vazio)
Valor: 31.97.27.20
TTL: 3600
```

**Registro 2:**
```
Tipo: A
Nome: www
Valor: 31.97.27.20
TTL: 3600
```

#### **4. Remover Registros CNAME (se houver):**

- Se tiver CNAME apontando para Vercel, **remova**
- Exemplo: `plenipay.com` → `cname.vercel-dns.com` (REMOVER)

#### **5. Salvar e Aguardar:**

- Salve as alterações
- Aguarde propagação DNS (1-24 horas, geralmente 1-2 horas)

---

### **PARTE 2: CONFIGURAR NGINX NO SERVIDOR**

#### **1. Instalar Nginx:**

No terminal SSH do servidor:

```bash
apt update
apt install nginx -y
```

#### **2. Criar Configuração:**

```bash
nano /etc/nginx/sites-available/plenipay
```

#### **3. Cole esta Configuração:**

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

**Salvar:** Ctrl+X, Y, Enter

#### **4. Ativar Configuração:**

```bash
# Criar link simbólico
ln -s /etc/nginx/sites-available/plenipay /etc/nginx/sites-enabled/

# Remover default (se existir)
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Se der OK, reiniciar
systemctl restart nginx

# Verificar status
systemctl status nginx
```

---

### **PARTE 3: VERIFICAR SERVIDOR**

#### **1. Verificar se está rodando:**

```bash
pm2 status
```

#### **2. Testar localmente:**

```bash
curl http://localhost:3000
```

**Deve retornar HTML.**

#### **3. Testar pelo IP:**

No navegador, acesse:
- `http://31.97.27.20:3000`

**Se funcionar:** Servidor está OK!

---

### **PARTE 4: CONFIGURAR SSL/HTTPS (OPCIONAL)**

Para usar HTTPS:

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obter certificado
certbot --nginx -d plenipay.com -d www.plenipay.com

# Seguir instruções
```

---

## 📋 SEQUÊNCIA COMPLETA (TERMINAL SSH):

```bash
# 1. Verificar IP do servidor
hostname -I

# 2. Instalar Nginx
apt update
apt install nginx -y

# 3. Criar configuração
nano /etc/nginx/sites-available/plenipay
# (Cole a configuração acima e salve)

# 4. Ativar
ln -s /etc/nginx/sites-available/plenipay /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# 5. Verificar status
systemctl status nginx
pm2 status

# 6. Testar
curl http://localhost:3000
```

---

## 🔍 VERIFICAR PROPAGAÇÃO DNS:

Após configurar DNS, verifique se está propagado:

```bash
# No seu computador (não no servidor)
nslookup plenipay.com
# Ou
dig plenipay.com
```

**Deve mostrar o IP:** `31.97.27.20`

---

## ✅ CHECKLIST:

- [ ] Configurei DNS para apontar ao IP do servidor
- [ ] Removi CNAME do Vercel (se existia)
- [ ] Instalei Nginx no servidor
- [ ] Criei configuração do Nginx
- [ ] Ativei configuração
- [ ] Testei Nginx (`nginx -t`)
- [ ] Reiniciei Nginx
- [ ] Testei servidor pelo IP: `http://31.97.27.20:3000`
- [ ] Aguardei propagação DNS
- [ ] Testei domínio: `https://plenipay.com`

---

## 🚨 IMPORTANTE:

### **Se o domínio estava no Vercel:**

1. **Remova do Vercel:**
   - Acesse: https://vercel.com
   - Settings → Domains
   - Remova `plenipay.com`

2. **Configure DNS para Hostinger**

3. **Aguarde propagação** (pode levar horas)

---

## 📝 RESUMO:

1. ✅ **DNS:** Aponte `plenipay.com` → `31.97.27.20`
2. ✅ **Nginx:** Configure proxy para porta 3000
3. ✅ **Teste:** `http://31.97.27.20:3000`
4. ✅ **Aguarde:** Propagação DNS (1-24h)
5. ✅ **Teste:** `https://plenipay.com`

---

**Configure DNS e Nginx para o domínio funcionar!** 🚀


