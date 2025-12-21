# ✅ SERVIDOR RODANDO - PRÓXIMOS PASSOS

## 🎉 SERVIDOR ESTÁ ONLINE!

Vejo que:
- ✅ PM2 está rodando
- ✅ Aplicação "sistema-contas" está **online**
- ✅ Node.js v20.19.6 está sendo usado
- ✅ Está na pasta correta: `/var/www/plenipay`

---

## 📋 PRÓXIMOS PASSOS:

### **1. Verificar se variáveis APIFACIL foram adicionadas:**

```bash
cat .env.production | grep APIFACIL
```

**Deve mostrar:**
```
APIFACIL_INSTANCE_ID=1041
APIFACIL_TOKEN=2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb
```

**Se não aparecer, adicione:**
```bash
nano .env.production
# (Adicione as variáveis APIFACIL no final e salve)
```

---

### **2. Verificar logs do servidor:**

```bash
pm2 logs sistema-contas
```

**Pressione Ctrl+C para sair dos logs.**

**Procure por:**
- ✅ Mensagens de sucesso
- ❌ Erros relacionados a variáveis de ambiente
- ❌ Erros de conexão

---

### **3. Verificar se build foi feito:**

```bash
ls -la .next
```

**Deve mostrar a pasta `.next` com arquivos dentro.**

**Se não existir, faça build:**
```bash
npm run build
```

**Depois reinicie o servidor:**
```bash
pm2 restart sistema-contas
```

---

### **4. Testar se servidor está respondendo:**

```bash
curl http://localhost:3000
```

**Ou teste no navegador:**
- Acesse: `https://plenipay.com` (seu domínio)
- Ou: `http://31.97.27.20:3000` (IP do servidor)

---

### **5. Verificar status detalhado:**

```bash
pm2 info sistema-contas
```

**Isso mostra informações detalhadas do processo.**

---

### **6. Configurar PM2 para iniciar automaticamente (se ainda não fez):**

```bash
pm2 startup
```

**Siga as instruções que aparecerem** (pode pedir para executar um comando com `sudo`).

---

## 🔍 VERIFICAÇÕES IMPORTANTES:

### **Verificar variáveis de ambiente:**

```bash
# Ver todas as variáveis
cat .env.production

# Verificar se APIFACIL está lá
cat .env.production | grep APIFACIL
```

---

### **Verificar se porta está aberta:**

```bash
netstat -tuln | grep 3000
```

**Ou:**

```bash
ss -tuln | grep 3000
```

**Deve mostrar que a porta 3000 está em uso.**

---

### **Verificar logs de erro:**

```bash
pm2 logs sistema-contas --err
```

**Isso mostra apenas erros.**

---

## 🚀 COMANDOS ÚTEIS PM2:

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs sistema-contas

# Ver logs apenas de erro
pm2 logs sistema-contas --err

# Reiniciar servidor
pm2 restart sistema-contas

# Parar servidor
pm2 stop sistema-contas

# Ver informações detalhadas
pm2 info sistema-contas

# Ver uso de recursos
pm2 monit
```

---

## 🌐 TESTAR NO NAVEGADOR:

### **Opção 1: Via domínio**

1. Acesse: **https://plenipay.com**
2. Verifique se a página carrega

### **Opção 2: Via IP**

1. Acesse: **http://31.97.27.20:3000**
2. Verifique se a página carrega

**⚠️ IMPORTANTE:** Se não funcionar via domínio, pode precisar configurar:
- DNS apontando para o servidor
- Proxy reverso (Nginx/Apache)
- Firewall liberando porta 3000

---

## ⚙️ CONFIGURAR NGINX (OPCIONAL - RECOMENDADO):

Se quiser usar o domínio sem porta (https://plenipay.com), configure Nginx:

```bash
# Instalar Nginx (se não tiver)
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
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Ativar:**
```bash
ln -s /etc/nginx/sites-available/plenipay /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## ✅ CHECKLIST FINAL:

- [x] Servidor rodando com PM2
- [ ] Variáveis APIFACIL adicionadas (verificar)
- [ ] Build feito (verificar pasta .next)
- [ ] Logs verificados (sem erros críticos)
- [ ] Servidor testado no navegador
- [ ] PM2 configurado para iniciar automaticamente
- [ ] Nginx configurado (opcional)

---

## 📝 RESUMO DOS PRÓXIMOS PASSOS:

1. ✅ **Verificar variáveis APIFACIL:** `cat .env.production | grep APIFACIL`
2. ✅ **Ver logs:** `pm2 logs sistema-contas`
3. ✅ **Verificar build:** `ls -la .next`
4. ✅ **Testar no navegador:** Acesse seu domínio
5. ✅ **Configurar startup automático:** `pm2 startup`

---

**Agora verifique se tudo está funcionando corretamente!** 🚀

Execute os comandos acima para verificar e me diga se encontrou algum problema!


