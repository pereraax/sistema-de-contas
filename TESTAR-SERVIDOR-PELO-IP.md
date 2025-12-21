# 🔍 TESTAR SERVIDOR PELO IP - VERIFICAR SE ESTÁ FUNCIONANDO

## 🎯 TESTE IMEDIATO:

### **No navegador, acesse:**

```
http://31.97.27.20
```

**OU**

```
http://31.97.27.20:3000
```

---

## ✅ O QUE ESPERAR:

### **Se funcionar (mostra a aplicação):**
- ✅ Servidor está funcionando corretamente
- ✅ Nginx está redirecionando
- ✅ Aplicação está respondendo
- ❌ **Problema:** DNS ainda aponta para Vercel
- ✅ **Solução:** Configurar DNS para apontar ao IP

---

### **Se não funcionar (erro ou página em branco):**
- ❌ Servidor pode ter problema
- ✅ **Solução:** Verificar servidor (veja abaixo)

---

## 🔍 VERIFICAÇÕES NO SERVIDOR:

No terminal SSH, execute:

```bash
# 1. Verificar se aplicação está rodando
pm2 status

# Deve mostrar "sistema-contas" online

# 2. Verificar se Nginx está rodando
systemctl status nginx

# Deve mostrar "active (running)"

# 3. Testar aplicação diretamente
curl http://localhost:3000

# Deve retornar HTML

# 4. Testar via Nginx
curl http://localhost

# Deve retornar HTML (mesmo que acima)

# 5. Verificar portas
netstat -tuln | grep -E ":80|:3000"

# Deve mostrar ambas as portas em uso
```

---

## 🚨 SE NÃO FUNCIONAR PELO IP:

### **Problema 1: Aplicação não está rodando**

```bash
cd /var/www/plenipay
pm2 status

# Se não estiver rodando:
pm2 start npm --name "sistema-contas" -- start
pm2 save
pm2 status
```

---

### **Problema 2: Nginx não está configurado**

```bash
# Verificar configuração
cat /etc/nginx/sites-enabled/plenipay

# Se não existir ou estiver errado:
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

**Ativar:**
```bash
ln -s /etc/nginx/sites-available/plenipay /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

### **Problema 3: Firewall bloqueando**

```bash
# Verificar firewall
ufw status

# Se estiver ativo, liberar portas
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
```

---

## 📋 SEQUÊNCIA DE DIAGNÓSTICO:

```bash
# 1. Verificar PM2
pm2 status

# 2. Verificar Nginx
systemctl status nginx

# 3. Testar localmente
curl http://localhost:3000
curl http://localhost

# 4. Verificar portas
netstat -tuln | grep -E ":80|:3000"

# 5. Ver logs de erro
pm2 logs sistema-contas --err --lines 20
tail -20 /var/log/nginx/error.log
```

---

## ✅ DEPOIS DE VERIFICAR:

**Me diga:**
1. ✅ Funcionou pelo IP? (`http://31.97.27.20`)
2. ✅ O que apareceu?
3. ✅ PM2 está rodando? (`pm2 status`)
4. ✅ Nginx está rodando? (`systemctl status nginx`)

---

**Teste primeiro `http://31.97.27.20` no navegador e me diga o resultado!** 🔍


