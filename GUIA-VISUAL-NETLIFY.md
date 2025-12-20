# 🎯 GUIA VISUAL PASSO A PASSO - NETLIFY

## 📍 COMO NAVEGAR NO NETLIFY

### **PASSO 1: Encontrar o Menu Lateral**

Quando você abre o Netlify, você deve ver no **lado esquerdo** um menu com várias opções:

```
┌─────────────────┐
│ 🏠 Overview     │
│ 📦 Sites        │
│ ⚙️ Site settings│ ← CLIQUE AQUI!
│ 📊 Deploys      │
│ 🔧 Functions    │
│ 📝 Forms        │
└─────────────────┘
```

**Se você NÃO vê esse menu:**
- Procure por um **ícone de 3 linhas** (☰) no canto superior esquerdo
- Clique nele para abrir o menu

---

### **PASSO 2: Abrir Site Settings**

1. **Clique em "Site settings"** (ou "Site configuration" ou "Settings")
2. Se não aparecer, procure por:
   - **"⚙️ Settings"**
   - **"Configuration"**
   - **"Site configuration"**
   - **"Project settings"**

---

### **PASSO 3: Encontrar Build & Deploy**

Depois de clicar em "Site settings", você verá várias abas ou seções:

```
┌─────────────────────────────┐
│ General                     │
│ Build & deploy        ← AQUI!│
│ Environment variables       │
│ Domain management           │
│ Functions                   │
│ Plugins                     │
└─────────────────────────────┘
```

**Clique em "Build & deploy"** (ou "Build settings" ou "Deploy settings")

---

### **PASSO 4: Encontrar Build Settings**

Dentro de "Build & deploy", você verá:

```
┌─────────────────────────────┐
│ Build settings        ← AQUI!│
│ Continuous deployment        │
│ Post processing              │
└─────────────────────────────┘
```

**Clique em "Build settings"**

---

### **PASSO 5: Configurar Publish Directory**

Agora você deve ver a tela que você mostrou antes:

```
Runtime: Next.js
Base directory: /
Package directory: Not set
Build command: Not set
Publish directory: .next  ← EDITAR AQUI!
Functions directory: netlify/functions
```

**O que fazer:**
1. **Procure pelo botão "Configure"** (no final da página)
2. **OU** procure por um **ícone de lápis** (✏️) ao lado de "Publish directory"
3. **OU** clique diretamente no campo "Publish directory" (se for clicável)

**Se encontrar o botão "Configure":**
- Clique nele
- Procure por "Publish directory" ou "Publish dir"
- Certifique-se que está como `.next` (não vazio)
- Salve

**Se encontrar um ícone de lápis:**
- Clique no ícone
- Edite o valor para `.next`
- Salve

**Se o campo for clicável:**
- Clique diretamente nele
- Digite `.next`
- Pressione Enter ou clique em "Save"

---

## 🔍 SE VOCÊ NÃO ENCONTROU AS OPÇÕES:

### **Alternativa 1: Usar a Busca**

1. **Procure por uma barra de busca** no topo do Netlify
2. **Digite:** "build settings" ou "publish directory"
3. **Clique no resultado**

### **Alternativa 2: Ir Direto pela URL**

1. **Copie o nome do seu site** (exemplo: `stalwart-fox-7b94f1`)
2. **Acesse diretamente:**
   ```
   https://app.netlify.com/sites/SEU-SITE-NAME/configuration/deploys
   ```
   (Substitua `SEU-SITE-NAME` pelo nome do seu site)

### **Alternativa 3: Menu de 3 Pontos**

1. **Procure por um menu de 3 pontos** (⋯) no card do seu site
2. **Clique nele**
3. **Procure por:** "Settings" ou "Configure" ou "Edit"

---

## 📱 SE ESTIVER NO CELULAR:

1. **Toque no ícone de menu** (☰) no canto superior esquerdo
2. **Toque em "Site settings"**
3. **Toque em "Build & deploy"**
4. **Toque em "Build settings"**
5. **Toque em "Configure"** ou no campo "Publish directory"

---

## 🆘 SE AINDA NÃO CONSEGUIR:

### **Me diga:**

1. **O que você vê na tela principal do Netlify?**
   - Há um menu lateral?
   - Há um card com o nome do seu site?
   - O que aparece quando você clica no nome do site?

2. **Você consegue ver "Deploys" no menu?**
   - Se sim, clique em "Deploys"
   - Depois procure por "Site settings" ou "Settings"

3. **Você vê o nome do seu site em algum lugar?**
   - Clique nele
   - Isso deve abrir as opções do site

---

## 🎯 CAMINHO MAIS SIMPLES:

1. **Clique no nome do seu site** (em qualquer lugar que aparecer)
2. **Procure por "Settings"** ou "⚙️" (ícone de engrenagem)
3. **Clique**
4. **Procure por "Build"** ou "Deploy"
5. **Clique**
6. **Procure por "Configure"** ou edite "Publish directory"

---

## 💡 DICA:

**Tire uma captura de tela** da tela principal do Netlify e me mostre. Assim posso te guiar exatamente onde clicar!

---

## ✅ RESUMO DO QUE PRECISA FAZER:

1. **Encontrar "Site settings"** (ou "Settings")
2. **Clicar em "Build & deploy"** (ou "Build settings")
3. **Clicar em "Configure"** (ou editar "Publish directory")
4. **Garantir que "Publish directory" está como `.next`**
5. **Salvar**
6. **Limpar cache e fazer deploy**

**O mais importante:** Garantir que "Publish directory" não está vazio - deve ter `.next` como valor!
