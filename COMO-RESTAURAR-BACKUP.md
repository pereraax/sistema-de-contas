# 📦 Como Restaurar o Backup do Projeto

Este documento explica como restaurar o projeto para um estado anterior usando Git.

## 🔍 Verificar Backups Disponíveis

Para ver todos os backups (tags) criados:

```bash
git tag -l
```

Para ver informações detalhadas de um backup específico:

```bash
git show backup-YYYYMMDD-HHMMSS
```

## 🔄 Restaurar para um Backup Específico

### Opção 1: Criar uma Nova Branch a Partir do Backup (Recomendado)

Esta opção mantém o código atual e cria uma nova branch com o estado do backup:

```bash
# Ver os backups disponíveis
git tag -l

# Criar uma nova branch a partir de um backup específico
git checkout -b restaurar-backup-YYYYMMDD backup-YYYYMMDD-HHMMSS

# Agora você está na nova branch com o código do backup
# Para voltar ao código atual:
git checkout main  # ou git checkout master
```

### Opção 2: Restaurar Diretamente (Cuidado!)

⚠️ **ATENÇÃO:** Esta opção substitui o código atual pelo código do backup.

```bash
# Ver os backups disponíveis
git tag -l

# Restaurar para um backup específico
git checkout backup-YYYYMMDD-HHMMSS

# Se quiser criar um commit com este estado:
git checkout -b estado-backup-YYYYMMDD
```

### Opção 3: Ver o Código do Backup sem Modificar Nada

Para apenas visualizar como estava o código em um backup específico:

```bash
git show backup-YYYYMMDD-HHMMSS:app/lembretes/page.tsx
```

## 📝 Criar um Novo Backup

Para criar um novo backup no futuro:

```bash
# Adicionar todas as mudanças
git add -A

# Criar um commit
git commit -m "Descrição das mudanças"

# Criar uma tag de backup
git tag -a "backup-$(date +%Y%m%d-%H%M%S)" -m "Descrição do backup"

# Ver o backup criado
git tag -l | tail -1
```

## 💾 Backup Adicional (Arquivo ZIP)

Se quiser criar um backup físico adicional em formato ZIP:

```bash
# No diretório do projeto
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
cd ..
zip -r "SISTEMA-DE-CONTAS-BACKUP-$(date +%Y%m%d).zip" "SISTEMA DE CONTAS" -x "*.git/*" "node_modules/*" ".next/*"
```

## 📋 Lista de Backups Criados

Execute este comando para ver todos os backups:

```bash
git tag -l
```

## ⚠️ Importante

- Os backups são locais (no seu computador)
- Para backup na nuvem, considere usar GitHub, GitLab ou similar
- Sempre teste em uma branch separada antes de restaurar no código principal

