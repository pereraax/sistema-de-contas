# 🔍 DIAGNÓSTICO COMPLETO - IP NÃO FUNCIONA CORRETAMENTE

## 🔴 PROBLEMAS IDENTIFICADOS:

1. ❌ **Domínio ainda aponta para Vercel** (erro 404)
2. ❌ **IP mostra conteúdo mas parece incompleto** (só HTML estático?)
3. ⏳ **DNS não propagou ainda** (2 horas é normal, pode levar até 48h)

---

## ✅ DIAGNÓSTICO PASSO A PASSO

Execute estes comandos **no SSH** para investigar:

### **1. Verificar se PM2 está rodando:**

```bash
pm2 status
pm2 list
```

**Verifique:**
- ✅ Aplicação está rodando?
- ✅ Qual porta está usando? (deve ser 3000)

---

### **2. Verificar se aplicação responde na porta 3000:**

```bash
curl http://localhost:3000
```

**Deve retornar HTML da aplicação.**

---

### **3. Verificar configuração do Nginx:**

```bash
cat /etc/nginx/sites-available/plenipay
```

**Verifique se tem:**
- ✅ `location /_next/static` configurado
- ✅ `proxy_pass http://localhost:3000` configurado
- ✅ Caminho correto: `/var/www/plenipay`

---

### **4. Verificar se Nginx está rodando:**

```bash
systemctl status nginx
```

**Deve estar "active (running)".**

---

### **5. Verificar logs do Nginx:**

```bash
tail -50 /var/log/nginx/error.log
```

**Procure por erros!**

---

### **6. Verificar logs da aplicação:**

```bash
pm2 logs sistema-contas --lines 50
```

**Procure por erros!**

---

### **7. Testar se arquivos estáticos estão acessíveis:**

```bash
# Testar se arquivos estáticos existem
ls -la /var/www/plenipay/.next/static/chunks
ls -la /var/www/plenipay/.next/static/css

# Testar acesso direto via curl
curl -I http://localhost:3000/_next/static/chunks/main-app.js
```

---

### **8. Verificar se porta 3000 está aberta:**

```bash
netstat -tlnp | grep 3000
```

**Deve mostrar que está escutando na porta 3000.**

---

### **9. Verificar DNS (para entender por que domínio não funciona):**

```bash
nslookup plenipay.com
dig plenipay.com
```

**Verifique para onde está apontando:**
- ❌ Se apontar para Vercel → DNS não propagou ainda
- ✅ Se apontar para `31.97.27.20` → DNS propagou

---

## 🔧 CORREÇÕES POSSÍVEIS

### **PROBLEMA 1: Nginx não está servindo assets estáticos**

**Solução:** Verificar e corrigir configuração do Nginx:

```bash
nano /etc/nginx/sites-available/plenipay
```

**Certifique-se que tem esta configuração:**

```nginx
server {
    listen 80;
    server_name plenipay.com www.plenipay.com 31.97.27.20;

    location /_next/static {
        alias /var/www/plenipay/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|css|js)$ {
        root /var/www/plenipay/public;
        expires 30d;
        add_header Cache-Control "public";
    }

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

**Depois:**
```bash
nginx -t
systemctl restart nginx
```

---

### **PROBLEMA 2: Aplicação não está rodando**

**Solução:** Reiniciar aplicação:

```bash
cd /var/www/plenipay
pm2 restart sistema-contas
pm2 logs sistema-contas --lines 20
```

---

### **PROBLEMA 3: Build não foi feito ou está desatualizado**

**Solução:** Fazer build novamente:

```bash
cd /var/www/plenipay
npm run build
pm2 restart sistema-contas
```

---

### **PROBLEMA 4: DNS ainda não propagou**

**Solução:** Verificar DNS no registrar:

1. Acesse o painel onde comprou o domínio
2. Verifique registros DNS:
   - **A record** para `plenipay.com` → `31.97.27.20`
   - **A record** para `www.plenipay.com` → `31.97.27.20`
3. **Remova** qualquer registro CNAME que aponte para Vercel

**Tempo de propagação:**
- Mínimo: 15-30 minutos
- Médio: 1-4 horas
- Máximo: 24-48 horas

**2 horas ainda é dentro do normal!**

---

## 📋 CHECKLIST DE DIAGNÓSTICO

Execute e me envie os resultados:

- [ ] `pm2 status` - Aplicação está rodando?
- [ ] `curl http://localhost:3000` - Aplicação responde?
- [ ] `cat /etc/nginx/sites-available/plenipay` - Nginx configurado?
- [ ] `systemctl status nginx` - Nginx rodando?
- [ ] `tail -50 /var/log/nginx/error.log` - Há erros no Nginx?
- [ ] `pm2 logs sistema-contas --lines 50` - Há erros na aplicação?
- [ ] `nslookup plenipay.com` - DNS aponta para onde?

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Execute os comandos de diagnóstico acima
2. ✅ Me envie os resultados
3. ✅ Vou identificar o problema específico
4. ✅ Vou dar a solução exata

---

**Execute os comandos de diagnóstico e me envie os resultados!** 🔍


