# 🔐 COMO ACESSAR TERMINAL SSH - GUIA RÁPIDO

## 🚀 PASSO A PASSO SIMPLES:

---

## 📋 PASSO 1: ABRIR TERMINAL NO MAC

1. Pressione **Cmd + Espaço** (Command + Barra de Espaço)
2. Digite: `Terminal`
3. Pressione **Enter**

O Terminal do Mac vai abrir.

---

## 📋 PASSO 2: CONECTAR VIA SSH

No Terminal que abriu, execute este comando:

```bash
ssh u596588143@185.239.210.34 -p 65002
```

**OU usando o hostname:**

```bash
ssh u596588143@ssh.hostinger.com -p 65002
```

---

## 📋 PASSO 3: INSERIR SENHA

Quando aparecer:

```
u596588143@185.239.210.34's password:
```

1. Digite a senha SSH (ela não aparece enquanto você digita - é normal!)
2. Pressione **Enter**

---

## 📋 PASSO 4: CONFIRMAR CONEXÃO

Se conectou com sucesso, você verá algo como:

```
Welcome to Hostinger!
[u596588143@br-asc-web818 ~]$
```

**✅ Pronto! Você está conectado ao servidor!**

---

## 🔍 SE DER ERRO "PERMISSION DENIED":

A senha está incorreta. Faça isso:

1. Acesse: https://hpanel.hostinger.com
2. Vá em **"Advanced"** → **"SSH Access"**
3. Clique em **"Alterar"** ao lado de "Senha"
4. Gere/veja a senha e copie
5. Tente conectar novamente

---

## 📝 COMANDO COMPLETO (COPIE E COLE):

```bash
ssh u596588143@185.239.210.34 -p 65002
```

Depois digite a senha quando pedir.

---

## ✅ DEPOIS DE CONECTAR:

Você pode executar comandos como:

```bash
# Ver onde está
pwd

# Ver arquivos
ls -la

# Ir para pasta do site
cd public_html

# Ver arquivos do site
ls -la
```

---

## 🆘 PROBLEMAS COMUNS:

### **Erro: "command not found: ssh"**

**Solução:** SSH já vem instalado no Mac. Se der erro, tente:
```bash
/usr/bin/ssh u596588143@185.239.210.34 -p 65002
```

### **Erro: "Connection refused"**

**Solução:**
- Verifique se a porta está correta: `65002`
- Verifique se SSH está habilitado no painel Hostinger

### **Erro: "Permission denied"**

**Solução:**
- Senha incorreta
- Gere nova senha no painel Hostinger
- Tente novamente

---

## 📋 RESUMO RÁPIDO:

1. ✅ Abra Terminal no Mac (Cmd + Espaço → Terminal)
2. ✅ Execute: `ssh u596588143@185.239.210.34 -p 65002`
3. ✅ Digite a senha quando pedir
4. ✅ Pronto! Você está conectado!

---

## 🔗 SUAS CREDENCIAIS SSH:

```
IP: 185.239.210.34
Porta: 65002
Usuário: u596588143
Senha: [Veja no painel Hostinger → SSH Access → Alterar]
```

---

**Agora você sabe como acessar o terminal SSH!** 🚀

Abra o Terminal e execute o comando acima!


