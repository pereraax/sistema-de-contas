# 🔐 SEU COMANDO SSH - HOSTINGER

## ✅ SUAS CREDENCIAIS SSH:

```
IP: 185.239.210.34
Porta: 65002
Usuário: u596588143
Senha: (clique em "Alterar" para ver/definir)
```

---

## 🚀 PASSO A PASSO COMPLETO:

### **PASSO 1: Obter/Definir Senha**

1. Na tela que você está vendo, clique no link **"Alterar"** ao lado de "Senha"
2. Se já tiver senha, ela será mostrada
3. Se não tiver, defina uma senha nova
4. **Anote a senha!** Você vai precisar dela

---

### **PASSO 2: Abrir Terminal no Mac**

1. Pressione **Cmd + Espaço** (abre busca)
2. Digite: `Terminal`
3. Pressione **Enter**

O Terminal vai abrir (tela preta com texto branco).

---

### **PASSO 3: Conectar via SSH**

No Terminal, digite exatamente este comando:

```bash
ssh u596588143@185.239.210.34 -p 65002
```

**OU** se preferir usar o hostname:

```bash
ssh u596588143@ssh.hostinger.com -p 65002
```

Pressione **Enter**.

---

### **PASSO 4: Inserir Senha**

Você verá uma mensagem como:

```
The authenticity of host '185.239.210.34' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

Digite: `yes` e pressione Enter.

Depois, você verá:

```
u596588143@185.239.210.34's password:
```

**Digite a senha** que você anotou no Passo 1.

⚠️ **IMPORTANTE:** A senha **NÃO aparece** enquanto você digita (é normal por segurança!)

Pressione **Enter** após digitar a senha.

---

### **PASSO 5: Verificar Conexão**

Se tudo der certo, você verá algo como:

```
Welcome to Hostinger!
[u596588143@hostinger ~]$
```

**✅ Pronto! Você está conectado!**

---

## 📋 DEPOIS DE CONECTAR:

Agora você pode executar os comandos para fazer deploy:

```bash
# 1. Ir para pasta do domínio
cd public_html

# 2. Ver arquivos
ls -la

# 3. Instalar dependências
npm install

# 4. Criar arquivo de variáveis
nano .env.production
# (Cole as variáveis e salve com Ctrl+X, Y, Enter)

# 5. Fazer build
npm run build

# 6. Instalar PM2
npm install -g pm2

# 7. Iniciar servidor
pm2 start npm --name "sistema-contas" -- start

# 8. Salvar configuração
pm2 save
```

---

## 🔄 COMANDO COMPLETO (COPIE E COLE):

```bash
ssh u596588143@185.239.210.34 -p 65002
```

---

## ⚠️ PROBLEMAS COMUNS:

### **Erro: "Permission denied"**

**Causa:** Senha incorreta

**Solução:**
1. Verifique se copiou a senha corretamente
2. Tente clicar em "Alterar" e definir uma senha nova
3. Tente conectar novamente

### **Erro: "Connection refused"**

**Causa:** Porta ou IP incorreto

**Solução:**
1. Verifique se copiou o IP corretamente: `185.239.210.34`
2. Verifique se a porta está correta: `65002`
3. Tente novamente

### **Não aparece nada ao digitar senha**

**Isso é normal!** Por segurança, a senha não aparece na tela. Apenas digite e pressione Enter.

---

## ✅ CHECKLIST:

- [ ] Cliquei em "Alterar" e anotei/defini a senha
- [ ] Abri Terminal no Mac
- [ ] Digitei o comando SSH
- [ ] Digitei `yes` quando perguntou
- [ ] Digitei a senha (não aparece na tela - normal!)
- [ ] Conectei com sucesso!
- [ ] Vejo o prompt `[u596588143@hostinger ~]$`

---

## 📝 RESUMO RÁPIDO:

1. ✅ **Senha:** Clique em "Alterar" e anote/defina
2. ✅ **Terminal:** Cmd+Espaço → Terminal
3. ✅ **Comando:** `ssh u596588143@185.239.210.34 -p 65002`
4. ✅ **Senha:** Digite (não aparece - normal!)
5. ✅ **Pronto!** Você está conectado

---

**Agora siga os passos acima e conecte!** 🚀

Me avise quando conseguir conectar!
