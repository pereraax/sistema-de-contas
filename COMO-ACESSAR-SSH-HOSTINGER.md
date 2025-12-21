# 🔐 COMO ACESSAR TERMINAL SSH DA HOSTINGER

## 📋 PASSO A PASSO COMPLETO

---

## 🔹 MÉTODO 1: VIA PAINEL HOSTINGER (RECOMENDADO)

### **Passo 1: Acessar Hostinger**

1. Abra seu navegador
2. Acesse: **https://hpanel.hostinger.com**
3. Faça **login** na sua conta

### **Passo 2: Encontrar SSH Access**

1. No painel, procure por **"Advanced"** (Avançado)
2. Clique em **"Advanced"**
3. Procure por **"SSH Access"** ou **"Acesso SSH"**
4. Clique em **"SSH Access"**

### **Passo 3: Ver Credenciais SSH**

Você verá informações como:

```
Host: ssh.hostinger.com
Port: 65002
Username: u123456789
Password: sua_senha_aqui
```

**Anote essas informações!** Você vai precisar delas.

### **Passo 4: Conectar via Terminal (Mac)**

1. Abra o **Terminal** no Mac:
   - Pressione **Cmd + Espaço**
   - Digite: `Terminal`
   - Pressione Enter

2. No Terminal, execute:

```bash
ssh usuario@ssh.hostinger.com -p 65002
```

**Substitua:**
- `usuario` pelo seu **Username** (ex: `u123456789`)
- `65002` pela porta (pode ser diferente)
- `ssh.hostinger.com` pelo Host (pode ser diferente)

**Exemplo:**
```bash
ssh u123456789@ssh.hostinger.com -p 65002
```

3. Quando pedir senha, digite a **Password** que você anotou
4. Pressione Enter

**✅ Pronto! Você está conectado!**

---

## 🔹 MÉTODO 2: VIA TERMINAL DO MAC DIRETO

### **Passo 1: Abrir Terminal**

1. Pressione **Cmd + Espaço**
2. Digite: `Terminal`
3. Pressione Enter

### **Passo 2: Conectar SSH**

Execute o comando:

```bash
ssh usuario@ssh.hostinger.com -p PORTA
```

**Onde encontrar os dados:**
- Acesse: **https://hpanel.hostinger.com**
- Vá em **"Advanced"** → **"SSH Access"**
- Copie as credenciais

### **Passo 3: Inserir Senha**

Quando pedir senha, digite a senha SSH (ela não aparece enquanto você digita - é normal!)

Pressione Enter após digitar.

---

## 🔹 MÉTODO 3: VIA FILE MANAGER (TERMINAL INTEGRADO)

Algumas versões do painel Hostinger têm terminal integrado:

1. Acesse: **https://hpanel.hostinger.com**
2. Vá em **"Files"** → **"File Manager"**
3. Procure por um botão **"Terminal"** ou **"SSH"** no topo
4. Clique nele
5. Um terminal abrirá no navegador

---

## ⚠️ PROBLEMAS COMUNS

### **Erro: "Permission denied"**

**Causa:** Senha incorreta ou usuário errado

**Solução:**
1. Verifique se copiou o usuário corretamente
2. Verifique se a senha está correta
3. Tente copiar e colar a senha (pode ter espaços extras)

### **Erro: "Connection refused"**

**Causa:** Porta incorreta ou SSH desabilitado

**Solução:**
1. Verifique a porta no painel (pode ser `65002`, `22`, ou outra)
2. Verifique se SSH está habilitado no seu plano
3. Contate suporte da Hostinger se necessário

### **Erro: "Host key verification failed"**

**Solução:**
```bash
ssh-keygen -R ssh.hostinger.com
```

Depois tente conectar novamente.

---

## 📋 DEPOIS DE CONECTAR

Quando você estiver conectado, verá algo como:

```
[usuario@hostinger ~]$
```

Agora você pode executar comandos:

```bash
# Ver onde está
pwd

# Navegar para pasta do domínio
cd public_html

# Listar arquivos
ls -la

# Instalar dependências
npm install
```

---

## 🔐 SEGURANÇA

### **Dica: Usar Chave SSH (Opcional - Mais Seguro)**

Se quiser evitar digitar senha toda vez:

1. No Terminal do Mac, gere uma chave:
```bash
ssh-keygen -t rsa -b 4096
```

2. Copie a chave pública:
```bash
cat ~/.ssh/id_rsa.pub
```

3. No painel Hostinger, vá em **"SSH Access"** → **"Add SSH Key"**
4. Cole a chave pública
5. Agora você pode conectar sem senha!

---

## ✅ CHECKLIST:

- [ ] Acessei o painel Hostinger
- [ ] Encontrei "Advanced" → "SSH Access"
- [ ] Anotei Host, Port, Username e Password
- [ ] Abri Terminal no Mac
- [ ] Executei comando SSH
- [ ] Digitei senha
- [ ] Conectei com sucesso!

---

## 📝 COMANDO COMPLETO (EXEMPLO):

```bash
ssh u123456789@ssh.hostinger.com -p 65002
```

**Substitua pelos seus dados reais!**

---

## 🆘 PRECISA DE AJUDA?

Se não conseguir encontrar "SSH Access":

1. **Verifique seu plano:** SSH só funciona em planos VPS/Cloud
2. **Procure por:** "Terminal", "Shell", "Command Line"
3. **Contate suporte:** Hostinger pode habilitar SSH para você

---

**Agora você sabe como acessar o Terminal SSH!** 🚀

Siga os passos acima e me avise se tiver alguma dúvida!


