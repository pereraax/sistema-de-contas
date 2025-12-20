# 📋 Como Criar a Tabela de Lembretes no Supabase

## ⚠️ Problema
A tabela `lembretes` ainda não foi criada no Supabase, então a funcionalidade de lembretes não funciona.

## ✅ Solução

### Passo 1: Acessar o Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto do PLEN

### Passo 2: Abrir o SQL Editor
1. No menu lateral, clique em **"SQL Editor"** (ícone de código `</>`)
2. Clique em **"New query"** (Nova consulta)

### Passo 3: Copiar e Colar o Script SQL
1. Abra o arquivo `CRIAR-TABELA-LEMBRETES.sql` neste projeto
2. **Copie TODO o conteúdo** do arquivo (Ctrl+C / Cmd+C)
3. **Cole no SQL Editor** do Supabase (Ctrl+V / Cmd+V)

### Passo 4: Executar o Script
1. Clique no botão **"Run"** (ou pressione Ctrl+Enter / Cmd+Enter)
2. Aguarde a execução (deve levar alguns segundos)
3. Você deve ver: **"Success. No rows returned"** ou similar

### Passo 5: Verificar se Funcionou
1. No menu lateral, clique em **"Table Editor"**
2. Procure pela tabela **"lembretes"**
3. Se aparecer, está tudo certo! ✅

## 🎯 Após Criar a Tabela

1. **Teste no WhatsApp:**
   - Envie: "me lembre de pagar o cartão amanhã 10 horas"
   - A assistente deve responder confirmando o lembrete

2. **Verifique na Interface Web:**
   - Acesse: https://plenipay.com/lembretes
   - Você deve ver os lembretes criados

## ❌ Se Der Erro

### Erro: "relation already exists"
- A tabela já existe, está tudo certo! ✅
- Pode ignorar este erro

### Erro: "permission denied"
- Verifique se você está logado como administrador do projeto
- Verifique se o projeto está ativo

### Erro: "syntax error"
- Verifique se copiou TODO o conteúdo do arquivo
- Verifique se não há caracteres estranhos

## 📞 Precisa de Ajuda?

Se ainda tiver problemas:
1. Copie a mensagem de erro completa
2. Verifique os logs do servidor
3. Verifique se o Supabase está acessível






