# Deploy direto do seu computador (sem depender do GitHub)

Assim o Railway usa **o código que está na sua pasta** — sem push, sem branch.

**Railway CLI já está instalado.**

- **Quem não consegue fazer sozinho:** o `railway login` e o `railway link` precisam de você (abrem o navegador e pedem para escolher projeto/serviço). Só esses dois comandos — leva menos de 1 minuto.
- **Depois disso:** você pode pedir "faz o deploy" e eu rodo o `railway up` por você, ou rodar o script `./deploy-railway.sh`.

---

## Primeira vez: configurar

Abra o terminal, entre na pasta do projeto e rode **na ordem**:

### 1. Entrar na pasta do projeto

```bash
cd "/Users/charlin/Downloads/SISTEMA DE CONTAS"
```

### 2. Login no Railway

```bash
railway login
```

Vai abrir o navegador para você logar na conta do Railway. Quando terminar, volte ao terminal.

### 3. Ligar esta pasta ao projeto no Railway

```bash
railway link
```

- **Project**: escolha o projeto do PleniPay
- **Environment**: Production (ou o ambiente que você usa)
- **Service**: o serviço do app (não o banco de dados)

### 4. Fazer o deploy

```bash
railway up
```

O CLI envia os arquivos da sua pasta, o Railway faz o build (usa seu Dockerfile) e coloca no ar. Pode levar alguns minutos. Quando terminar, teste:

**https://sistema-de-contas-1-production.up.railway.app/api/build-info**

Deve aparecer `"source": "railway"` (sem `buildTime`, `_debug`).

---

## Próximos deploys (já configurado)

Sempre na pasta do projeto:

```bash
cd "/Users/charlin/Downloads/SISTEMA DE CONTAS"
railway up
```

Só isso. Sem git push, sem redeploy no painel.
