# Abrir o projeto atual (SISTEMA DE CONTAS) e rodar

Esta pasta é o **projeto atual** (ex.: baixado do Render). Use ela no lugar do backup antigo.

---

## 1. Abrir no Cursor

- **File → Open Folder** (ou Cmd+O)
- Navegue até **Downloads** → **SISTEMA DE CONTAS**
- Selecione a pasta **SISTEMA DE CONTAS** e clique em **Abrir**

---

## 2. Instalar dependências e rodar

No terminal do Cursor (ou Terminal do macOS):

```bash
cd "/Users/charlin/Downloads/SISTEMA DE CONTAS"
npm install
npm run dev
```

Depois acesse **http://localhost:3000**.

---

## 3. (Opcional) Substituir o projeto antigo na home

Se quiser que o projeto fique em `~/sistema-de-contas` (sem espaços) e **substituir** o backup antigo, rode no **Terminal do macOS**:

```bash
mv ~/sistema-de-contas ~/sistema-de-contas-backup-antigo
cp -R ~/Downloads/SISTEMA\ DE\ CONTAS ~/sistema-de-contas
cd ~/sistema-de-contas && npm install
```

Depois abra **File → Open Folder** → `~/sistema-de-contas` e use `npm run dev` ali.

---

## 4. Variáveis de ambiente

O **.env.local** já foi criado com base no **.env.production** (Supabase, Asaas, etc.). Para localhost, `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL` estão como `http://localhost:3000`.

Se você tiver variáveis **atuais do Render** (Dashboard → Environment), atualize o `.env.local` com esses valores.
