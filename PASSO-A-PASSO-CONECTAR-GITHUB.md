# 🔗 Passo a Passo: Conectar GitHub no Cloudflare

## 📋 O que fazer AGORA:

### 1. Clique no botão "Connect GitHub"
- É o botão azul com o ícone do GitHub (octocat)
- Está na parte inferior direita da tela

---

## 🔄 O que vai acontecer:

### Passo 1: Redirecionamento para GitHub
- Você será levado para uma página do GitHub
- Pode pedir login (se não estiver logado)

### Passo 2: Autorizar Cloudflare
- Você verá uma tela pedindo autorização
- Diz algo como: "Cloudflare Workers and Pages quer acessar seus repositórios"
- **Clique em "Authorize" ou "Autorizar"**

### Passo 3: Escolher Repositórios (IMPORTANTE!)
- GitHub vai perguntar: "Quais repositórios o Cloudflare pode acessar?"
- **Escolha: "Only select repositories"** (Apenas repositórios selecionados)
- **Selecione: `pereraax/plenipay`**
- **Clique em "Install" ou "Instalar"**

### Passo 4: Voltar ao Cloudflare
- Você será redirecionado de volta ao Cloudflare
- Agora a lista de repositórios deve aparecer
- Selecione: **`pereraax/plenipay`**
- Clique em **"Begin setup"** ou **"Começar configuração"**

---

## ⚠️ Se não aparecer a opção de escolher repositórios:

1. **No GitHub, após autorizar:**
   - Vá em: https://github.com/settings/installations
   - Clique em "Cloudflare Workers and Pages"
   - Clique em "Configure"
   - Mude para "Only select repositories"
   - Selecione `pereraax/plenipay`
   - Salve

2. **Volte ao Cloudflare:**
   - Atualize a página
   - Tente conectar novamente

---

## 🎯 Resumo Rápido:

1. ✅ Clique em **"Connect GitHub"** (botão azul)
2. ✅ Autorize no GitHub
3. ✅ Escolha **"Only select repositories"**
4. ✅ Selecione **`pereraax/plenipay`**
5. ✅ Instale/Authorize
6. ✅ Volte ao Cloudflare
7. ✅ Selecione o repositório na lista
8. ✅ Continue a configuração

---

## 💡 Dica:

Se você já autorizou antes e está dando problema:
- Vá em: https://github.com/settings/installations
- Revogue a autorização do Cloudflare
- Volte ao Cloudflare e tente conectar novamente

