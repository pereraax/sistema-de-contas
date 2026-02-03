# Configurar Git para push automático (Cursor → GitHub → Railway)

Assim o Cursor consegue rodar `git push` daqui e o Railway atualiza sozinho. Escolha **uma** das opções.

---

## Opção 1: SSH (recomendado no Mac)

O push usa uma chave SSH; não pede senha depois de configurado.

### 1. Ver se já existe chave SSH

No terminal:

```bash
ls -la ~/.ssh/id_ed25519.pub
# ou
ls -la ~/.ssh/id_rsa.pub
```

Se aparecer o arquivo, você já tem chave. Vá para o passo 3.

### 2. Criar chave SSH (se não existir)

```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com" -f ~/.ssh/id_ed25519 -N ""
```

### 3. Adicionar a chave no GitHub

1. Copie o conteúdo da chave pública:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   (ou `cat ~/.ssh/id_rsa.pub` se for RSA)

2. No GitHub: **Settings** → **SSH and GPG keys** → **New SSH key**  
   Cole o conteúdo e salve.

### 4. Trocar o remote do projeto para SSH

Na pasta do projeto (SISTEMA DE CONTAS):

```bash
cd "/Users/charlin/Downloads/SISTEMA DE CONTAS"
git remote set-url origin git@github.com:pereraax/sistema-de-contas.git
git remote -v
```

Deve aparecer `origin  git@github.com:pereraax/sistema-de-contas.git`.

### 5. Testar

```bash
git push
```

Se pedir confirmação do host na primeira vez, digite `yes`. Depois disso, o push deve funcionar sem senha e o Cursor poderá usar `git push` daqui.

---

## Opção 2: HTTPS com token salvo

O Git guarda usuário e token; depois do primeiro login, não pede de novo.

### 1. Criar um Personal Access Token no GitHub

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
2. **Generate new token (classic)**.
3. Marque pelo menos **repo**.
4. Gere e **copie o token** (só aparece uma vez).

### 2. Dizer ao Git para guardar a senha

No terminal:

```bash
git config --global credential.helper osxkeychain
```

No Mac isso usa o Keychain para guardar o token.

### 3. Fazer um push manual (uma vez)

Na pasta do projeto:

```bash
cd "/Users/charlin/Downloads/SISTEMA DE CONTAS"
git push
```

Quando pedir:
- **Username:** seu usuário do GitHub (ex.: `pereraax`)
- **Password:** cole o **token** (não a senha da conta).

O Mac vai guardar no Keychain. Depois disso, quando o Cursor rodar `git push`, deve funcionar sem perguntar de novo.

---

## Resumo

| Opção | Vantagem |
|-------|----------|
| **SSH** | Depois de configurar, não pede mais nada; o Cursor pode fazer `git push` daqui. |
| **HTTPS + token** | Só precisa fazer um `git push` manual uma vez com o token; depois fica salvo. |

Depois de uma das opções funcionando, sempre que fizermos alterações no projeto e eu rodar `git add`, `git commit` e `git push`, o código sobe para o GitHub e o Railway faz o deploy automático.
