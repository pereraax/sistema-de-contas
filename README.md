# 💰 PLENIPAY - Sistema de Contas

Sistema completo de controle financeiro pessoal e de dívidas.

## 🚀 Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Banco de dados e autenticação
- **Asaas** - Pagamentos
- **WhatsApp API** - Integração via API Fácil

## 📦 Instalação

```bash
npm install
```

## 🔧 Configuração

1. Copie `.env.example` para `.env.local`
2. Configure as variáveis de ambiente:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ASAAS_API_KEY`
   - `APIFACIL_INSTANCE_ID`
   - `APIFACIL_TOKEN`

## 🏃 Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🏗️ Build

```bash
npm run build
npm start
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa linter

## 🌐 Deploy

### Hostinger

1. Faça upload dos arquivos (exceto `node_modules` e `.next`)
2. Instale dependências: `npm install`
3. Configure variáveis de ambiente
4. Faça build: `npm run build`
5. Inicie servidor: `npm start` ou use PM2

### PM2 (Recomendado)

```bash
npm install -g pm2
pm2 start npm --name "sistema-contas" -- start
pm2 save
```

## 📄 Licença

Privado - Todos os direitos reservados
