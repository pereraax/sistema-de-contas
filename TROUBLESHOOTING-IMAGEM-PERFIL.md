# Troubleshooting - Imagem de Perfil Não Aparece

## Problemas Comuns e Soluções

### 1. Campo `imagem_url` não existe na tabela `users`

**Solução:**
Execute o script SQL `ADICIONAR-IMAGEM-PERFIL-USERS.sql` no Supabase:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS imagem_url TEXT;
```

### 2. Bucket `avatares` não existe no Supabase Storage

**Solução:**
1. Acesse o Supabase Dashboard
2. Vá em **Storage**
3. Clique em **New bucket**
4. Configure:
   - **Name:** `avatares`
   - **Public bucket:** ✅ Sim (marcado)
   - **File size limit:** `2097152` (2MB em bytes)
   - **Allowed MIME types:** `image/jpeg,image/jpg,image/png,image/webp,image/gif`
5. Clique em **Create bucket**

### 3. Verificar se a imagem foi salva no banco

Execute o script `VERIFICAR-IMAGEM-PERFIL.sql` no Supabase para verificar:
- Se a coluna existe
- Se há dados salvos
- Qual é a URL salva

### 4. Verificar logs no console do navegador

Abra o Console do navegador (F12) e procure por:
- `📤 [Upload] Upload concluído, URL recebida:`
- `✅ [Upload] Imagem atualizada no banco:`
- `✅ [Imagem] Imagem carregada com sucesso:`
- `❌ [Imagem] Erro ao carregar imagem:`

### 5. Verificar se a URL está correta

A URL deve ser algo como:
```
https://[seu-projeto].supabase.co/storage/v1/object/public/avatares/perfis/[nome-arquivo].jpg
```

### 6. Problema de CORS ou permissões

Se a imagem não carregar, pode ser problema de CORS. Verifique:
1. O bucket está marcado como **público**?
2. As políticas RLS do Storage estão configuradas corretamente?

### 7. Verificar se o campo está sendo retornado na query

O campo `imagem_url` deve estar incluído no `SELECT` da query `obterUsuarios()`.

## Passos para Debug

1. **Verificar se o campo existe:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'imagem_url';
   ```

2. **Verificar se há dados:**
   ```sql
   SELECT id, nome, imagem_url FROM users WHERE imagem_url IS NOT NULL;
   ```

3. **Verificar logs no console do navegador** após fazer upload

4. **Verificar se o bucket existe** no Supabase Dashboard > Storage

5. **Testar a URL diretamente** no navegador para ver se a imagem carrega

