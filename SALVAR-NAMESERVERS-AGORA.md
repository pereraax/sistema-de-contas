# ✅ Salvar Nameservers - Passo a Passo

## 🎯 O Que Você Precisa Fazer AGORA

Na tela que você está vendo:

### Passo 1: Confirmar Seleção ✅
- A opção **"Usar nameservers da Hostinger (recomendado)"** já está selecionada (bolinha roxa preenchida)
- Isso está correto! ✅

### Passo 2: Salvar (IMPORTANTE!)
1. **Role a página até o final** (se necessário)
2. **Clique no botão "Salvar"** (botão cinza escuro na parte inferior)
3. **Aguarde a confirmação** de que foi salvo

### Passo 3: Aguardar Propagação
- Após salvar, aguarde **1-2 horas** para os nameservers propagarem
- Você pode verificar se propagaram executando:
  ```bash
  dig plenipay.com NS +noall +answer
  ```

## 📋 Checklist

- [x] Opção "Usar nameservers da Hostinger" está selecionada
- [ ] **CLICOU em "Salvar"** ← FAÇA ISSO AGORA!
- [ ] Aguardou confirmação de que foi salvo
- [ ] Aguardará 1-2 horas para propagação

## ⚠️ IMPORTANTE

- **Você PRECISA clicar em "Salvar"** para que a alteração seja aplicada
- **Apenas selecionar a opção não é suficiente** - precisa salvar!
- **Após salvar**, os nameservers vão mudar de `dns-parking.com` para os da Hostinger

## 🔍 Como Saber se Funcionou

Após clicar em "Salvar" e aguardar 1-2 horas:

1. Execute no terminal:
   ```bash
   dig plenipay.com NS +noall +answer
   ```

2. Você deve ver nameservers da Hostinger (não mais `dns-parking.com`)

3. Depois disso, você poderá configurar o DNS na Hostinger

## ⏰ Próximos Passos (Após Salvar)

1. **Agora:** Clique em "Salvar" ✅
2. **1-2 horas depois:** Nameservers propagam
3. **Depois:** Configure DNS na Hostinger (ALIAS para Railway)
4. **15-30 min depois:** DNS propaga
5. **Depois:** Clique "Try Again" no Railway

## 🎯 Ação Imediata

**CLIQUE NO BOTÃO "SALVAR" AGORA!**

O botão está na parte inferior da tela, ao lado de "Cancelar".
