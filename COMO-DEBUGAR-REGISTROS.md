# Como Debugar Problema de Registros Não Aparecendo

## Método 1: Usar o Endpoint de Debug (Mais Fácil!)

1. **Abra o navegador** e vá para o painel admin
2. **Abra o console do navegador** (F12 ou Cmd+Option+I no Mac)
3. **Abra o modal de detalhes do usuário** que não está mostrando registros
4. **Clique no botão de refresh** (ícone circular) ao lado de "Registros"
5. **Veja o console** - você deve ver logs começando com `🔍 [Modal]`, `📥 [Modal]`, `✅ [Modal]`

## Método 2: Endpoint de Debug Direto

1. **No navegador**, vá para:
   ```
   http://localhost:3000/api/admin/debug-registros?email=EMAIL_DO_USUARIO
   ```
   
   Ou na produção:
   ```
   https://seu-dominio.com/api/admin/debug-registros?email=EMAIL_DO_USUARIO
   ```

2. **Substitua `EMAIL_DO_USUARIO`** pelo email do usuário que você quer verificar

3. **Você verá um JSON** com todas as informações:
   - Perfil do usuário
   - Usuários na tabela `users`
   - Contagens de registros
   - Lista dos últimos registros do mês

## Método 3: Query SQL por Email

1. **Abra o Supabase SQL Editor**
2. **Abra o arquivo** `VERIFICAR-REGISTROS-POR-EMAIL.sql`
3. **Substitua** `'seu-email@exemplo.com'` pelo email do usuário
4. **Execute a query** (pressione "Run")

## O que verificar nos logs:

1. **Se não há usuários na tabela `users`**:
   - O endpoint retornará `usuarios: []`
   - Isso significa que quando um registro foi criado via WhatsApp, não foi criado um usuário na tabela `users`
   - **Solução**: Verificar se `obterOuCriarUsuarioPadrao` está funcionando

2. **Se há usuários mas não há registros**:
   - O endpoint retornará `usuarios: [...]` mas `registrosDoMes: []`
   - Isso significa que os registros não estão sendo associados ao `user_id` correto
   - **Solução**: Verificar se o `user_id` usado na criação do registro corresponde ao `id` dos usuários

3. **Se há registros mas não são do mês atual**:
   - O endpoint retornará registros mas `registrosMes: 0`
   - Verifique se `created_at` está correto nos registros
   - **Solução**: Verificar se `created_at` está sendo salvo corretamente

## Exemplo de resposta do endpoint de debug:

```json
{
  "perfil": {
    "id": "uuid-do-usuario",
    "email": "usuario@email.com",
    "nome": "Nome do Usuário",
    "plano": "teste"
  },
  "usuarios": [
    {
      "id": "uuid-do-user",
      "nome": "Usuário Principal",
      "account_owner_id": "uuid-do-usuario",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "contagens": {
    "totalRegistros": 5,
    "registrosMes": 2,
    "registrosEntrada": 1,
    "registrosSaida": 3,
    "registrosDivida": 1
  },
  "registrosDoMes": [...]
}
```

