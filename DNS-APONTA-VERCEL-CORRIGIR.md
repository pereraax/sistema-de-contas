# ❌ DNS AINDA APONTA PARA VERCEL - CORRIGIR

## 🔍 PROBLEMA:

O domínio `plenipay.com` ainda está apontando para **Vercel**, não para o servidor Hostinger.

O erro `404: DEPLOYMENT_NOT_FOUND` confirma isso.

---

## ✅ SOLUÇÃO: CONFIGURAR DNS CORRETAMENTE

### **PASSO 1: Verificar DNS Atual**

No seu computador (não no servidor), execute:

```bash
# Ver para onde o DNS está apontando
nslookup plenipay.com

# Ou
dig plenipay.com
```

**Se mostrar IP do Vercel:** DNS precisa ser alterado.

**Se mostrar `31.97.27.20`:** DNS está correto, mas pode estar em cache.

---

### **PASSO 2: Configurar DNS no Registro.br (ou onde registrou)**

1. **Acesse o painel do registro:**
   - **Registro.br:** https://registro.br
   - Ou o painel onde você registrou o domínio

2. **Faça login**

3. **Vá em "DNS" ou "Zona DNS"**

4. **REMOVA todos os registros CNAME** que apontam para Vercel:
   - Exemplo: `plenipay.com` → `cname.vercel-dns.com` (REMOVER)

5. **ADICIONE registros A:**

   **Registro 1:**
   ```
   Tipo: A
   Nome: @ (ou deixe vazio)
   Valor: 31.97.27.20
   TTL: 3600
   Prioridade: (deixe vazio ou 0)
   ```

   **Registro 2:**
   ```
   Tipo: A
   Nome: www
   Valor: 31.97.27.20
   TTL: 3600
   Prioridade: (deixe vazio ou 0)
   ```

6. **Salve as alterações**

---

### **PASSO 3: Remover Domínio do Vercel**

1. **Acesse:** https://vercel.com
2. **Faça login**
3. **Vá em:** Settings → Domains
4. **Remova:** `plenipay.com` e `www.plenipay.com`
5. **Confirme a remoção**

---

### **PASSO 4: Aguardar Propagação DNS**

- **Tempo:** 1-24 horas (geralmente 1-2 horas)
- **Como verificar:** Execute `nslookup plenipay.com` periodicamente
- **Quando estiver correto:** Deve mostrar `31.97.27.20`

---

### **PASSO 5: Limpar Cache do Navegador**

Enquanto aguarda DNS, limpe o cache:

- **Chrome/Edge:** Ctrl+Shift+Delete → Limpar cache
- **Firefox:** Ctrl+Shift+Delete → Limpar cache
- **Ou use modo anônimo:** Ctrl+Shift+N

---

## 🔍 VERIFICAR SE SERVIDOR ESTÁ FUNCIONANDO:

### **Testar pelo IP diretamente:**

No navegador, acesse:
- `http://31.97.27.20`

**Se funcionar:** Servidor está OK, só falta DNS.

**Se não funcionar:** Verifique servidor.

---

## 📋 VERIFICAÇÕES NO SERVIDOR:

No terminal SSH do servidor, execute:

```bash
# 1. Verificar se servidor está rodando
pm2 status

# 2. Verificar se Nginx está rodando
systemctl status nginx

# 3. Testar localmente
curl http://localhost:3000

# 4. Testar via Nginx
curl http://localhost

# 5. Verificar configuração Nginx
nginx -t

# 6. Ver logs
tail -20 /var/log/nginx/error.log
```

---

## 🚨 SE SERVIDOR NÃO ESTÁ RESPONDENDO:

### **Verificar se aplicação está rodando:**

```bash
cd /var/www/plenipay
pm2 status

# Se não estiver rodando:
pm2 start npm --name "sistema-contas" -- start
pm2 save
```

---

### **Verificar se Nginx está configurado:**

```bash
# Ver configuração
cat /etc/nginx/sites-enabled/plenipay

# Deve mostrar a configuração correta
# Se não mostrar, recrie:
nano /etc/nginx/sites-available/plenipay
# (Cole configuração correta)
ln -s /etc/nginx/sites-available/plenipay /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## ✅ CHECKLIST:

- [ ] Verifiquei DNS atual (`nslookup plenipay.com`)
- [ ] Removi CNAME do Vercel no registro do domínio
- [ ] Adicionei registros A apontando para `31.97.27.20`
- [ ] Removi domínio do Vercel
- [ ] Testei servidor pelo IP: `http://31.97.27.20`
- [ ] Verifiquei que servidor está rodando (`pm2 status`)
- [ ] Verifiquei que Nginx está rodando
- [ ] Aguardei propagação DNS
- [ ] Limpei cache do navegador
- [ ] Testei domínio: `http://plenipay.com`

---

## 📝 RESUMO:

1. ✅ **Teste servidor pelo IP:** `http://31.97.27.20`
2. ✅ **Configure DNS:** Aponte `plenipay.com` → `31.97.27.20`
3. ✅ **Remova do Vercel:** Settings → Domains → Remover
4. ✅ **Aguarde DNS:** 1-24 horas
5. ✅ **Limpe cache:** Navegador
6. ✅ **Teste domínio:** `http://plenipay.com`

---

## 🎯 AÇÃO IMEDIATA:

**Teste primeiro pelo IP:**

No navegador, acesse: `http://31.97.27.20`

**Se funcionar:** Servidor está OK, só precisa configurar DNS.

**Se não funcionar:** Verifique servidor (PM2, Nginx).

---

**O problema é DNS apontando para Vercel! Configure DNS para apontar ao servidor Hostinger!** 🔧

Teste primeiro `http://31.97.27.20` e me diga se funcionou!


