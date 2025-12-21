# ✅ NGINX INSTALADO - PRÓXIMOS PASSOS

## 🎉 NGINX ESTÁ RODANDO!

Vejo que:
- ✅ Nginx instalado (versão 1.18.0)
- ✅ Configuração testada com sucesso
- ✅ Nginx reiniciado
- ✅ Status: `active (running)`

---

## 📋 PRÓXIMOS PASSOS:

### **1. Verificar se servidor Node.js está rodando:**

```bash
pm2 status
```

**Deve mostrar "sistema-contas" online.**

**Se não estiver rodando:**
```bash
cd /var/www/plenipay
pm2 start npm --name "sistema-contas" -- start
pm2 save
```

---

### **2. Testar se Nginx está redirecionando corretamente:**

```bash
# Testar localmente
curl http://localhost

# Deve retornar HTML da aplicação (mesmo que http://localhost:3000)
```

---

### **3. Verificar se porta 80 está aberta:**

```bash
netstat -tuln | grep :80
```

**Ou:**

```bash
ss -tuln | grep :80
```

**Deve mostrar que Nginx está ouvindo na porta 80.**

---

### **4. Testar pelo IP do servidor:**

No navegador, acesse:
- `http://31.97.27.20`

**Deve mostrar a aplicação!** (sem precisar da porta 3000)

---

### **5. Verificar logs do Nginx:**

```bash
# Ver logs de acesso
tail -f /var/log/nginx/access.log

# Ver logs de erro
tail -f /var/log/nginx/error.log
```

**Pressione Ctrl+C para sair.**

---

### **6. Configurar DNS (se ainda não fez):**

1. **Acesse o painel do registro do domínio** (Registro.br ou onde registrou)
2. **Configure registros A:**

   ```
   Tipo: A
   Nome: @
   Valor: 31.97.27.20
   TTL: 3600
   ```

   ```
   Tipo: A
   Nome: www
   Valor: 31.97.27.20
   TTL: 3600
   ```

3. **Remova CNAME do Vercel** (se existir)
4. **Salve e aguarde propagação DNS** (1-24 horas)

---

### **7. Testar domínio (após DNS propagar):**

No navegador, acesse:
- `http://plenipay.com`

**Deve mostrar a aplicação!**

---

## 🔍 VERIFICAÇÕES IMPORTANTES:

### **Verificar configuração do Nginx:**

```bash
# Ver configuração ativa
cat /etc/nginx/sites-enabled/plenipay

# Deve mostrar a configuração que você criou
```

---

### **Verificar se proxy está funcionando:**

```bash
# Testar se redireciona para localhost:3000
curl -I http://localhost

# Deve mostrar headers HTTP com status 200 ou 302
```

---

### **Verificar se aplicação está respondendo:**

```bash
# Testar aplicação diretamente
curl http://localhost:3000

# Deve retornar HTML
```

---

## 🚨 SE NÃO FUNCIONAR:

### **Erro: "502 Bad Gateway"**

**Causa:** Aplicação não está rodando na porta 3000

**Solução:**
```bash
# Verificar se está rodando
pm2 status

# Se não estiver, iniciar
cd /var/www/plenipay
pm2 start npm --name "sistema-contas" -- start
pm2 save
```

---

### **Erro: "Connection refused"**

**Causa:** Porta 3000 não está acessível

**Solução:**
```bash
# Verificar se porta está aberta
netstat -tuln | grep 3000

# Verificar firewall
ufw status
ufw allow 3000/tcp
```

---

### **Erro: "404 Not Found"**

**Causa:** DNS ainda não propagou ou está apontando para outro lugar

**Solução:**
- Verificar DNS: `nslookup plenipay.com`
- Aguardar propagação (pode levar horas)
- Testar pelo IP: `http://31.97.27.20`

---

## 📋 SEQUÊNCIA COMPLETA DE VERIFICAÇÃO:

```bash
# 1. Verificar PM2
pm2 status

# 2. Verificar Nginx
systemctl status nginx

# 3. Testar localmente
curl http://localhost

# 4. Verificar portas
netstat -tuln | grep -E ":80|:3000"

# 5. Ver logs
tail -20 /var/log/nginx/error.log
```

---

## ✅ CHECKLIST:

- [x] Nginx instalado e rodando
- [ ] Servidor Node.js rodando (`pm2 status`)
- [ ] Nginx redirecionando corretamente (`curl http://localhost`)
- [ ] Porta 80 aberta
- [ ] Testado pelo IP: `http://31.97.27.20`
- [ ] DNS configurado (apontando para 31.97.27.20)
- [ ] Aguardado propagação DNS
- [ ] Testado domínio: `http://plenipay.com`

---

## 🎯 RESUMO DOS PRÓXIMOS PASSOS:

1. ✅ **Verificar PM2:** `pm2 status`
2. ✅ **Testar Nginx:** `curl http://localhost`
3. ✅ **Testar pelo IP:** `http://31.97.27.20` (no navegador)
4. ✅ **Configurar DNS:** Aponte `plenipay.com` → `31.97.27.20`
5. ✅ **Aguardar DNS:** Propagação (1-24h)
6. ✅ **Testar domínio:** `http://plenipay.com`

---

**Agora verifique se o servidor Node.js está rodando e teste pelo IP!** 🚀

Execute `pm2 status` e depois teste `http://31.97.27.20` no navegador!


