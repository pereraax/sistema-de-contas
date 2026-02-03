# Vincular o projeto ao Railway e deploy automático

## O que você precisa fazer (uma vez)

### 1. Conectar o repositório ao Railway

O vínculo é feito **no painel do Railway**, não no código:

1. Acesse [railway.app](https://railway.app) e entre no seu projeto **sistema-de-contas-1**.
2. Se o projeto ainda **não** está ligado ao GitHub:
   - **New** → **Deploy from GitHub repo**.
   - Autorize o Railway no GitHub (se pedir).
   - Escolha o repositório onde está este projeto (ex.: `seu-usuario/SISTEMA-DE-CONTAS` ou o nome que for).
   - Escolha o **branch** (geralmente `main`).
3. Se o projeto **já** foi criado a partir do GitHub, ele já está vinculado. Confira em **Settings** → **Source** se o repositório e o branch estão corretos.

Depois disso, **cada push nesse branch** dispara um novo deploy no Railway (atualização automática).

---

### 2. Garantir que o `git push` funcione da sua máquina

O deploy só atualiza quando o código novo **chega no GitHub**. Ou seja, alguém precisa dar **push**:

- **No seu computador:** abra o terminal na pasta do projeto e use:
  ```bash
  git add .
  git commit -m "sua mensagem"
  git push
  ```
- Se o Git pedir usuário/senha para o GitHub, use um **Personal Access Token** (em vez da senha) ou configure **SSH** para o repositório.

Assim, sempre que você (ou alguém) fizer push após as alterações que fizemos aqui, o Railway vai **atualizar sozinho**.

---

## O que o Cursor (assistente) consegue e não consegue fazer

| O que o Cursor faz | O que o Cursor não faz |
|---------------------|-------------------------|
| Editar arquivos do projeto | Fazer login na sua conta GitHub |
| Rodar `git add` e `git commit` | Fazer `git push` (depende das suas credenciais) |
| Sugerir comandos para você rodar | Acessar o painel do Railway ou conectar o repo por você |

Ou seja: **vincular o projeto no Railway** e **fazer o push** dependem de você (uma vez a conexão, depois sempre que quiser subir alterações). O Cursor pode deixar o código pronto e committado; o push e o deploy automático acontecem quando você der push a partir da sua máquina.

---

## Resumo do fluxo

1. **Uma vez:** no Railway, projeto conectado ao GitHub (branch `main` ou o que você usar).
2. **Sempre que houver mudança:** você roda `git push` (ou alguém com acesso ao repo faz o push).
3. O Railway detecta o push e faz o deploy automático.

Não é preciso clicar em “Redeploy” no Railway se o push já tiver sido feito; o próprio push dispara o deploy.
