# Suporte a Mídia no WhatsApp (Comprovantes e Áudios)

## ✅ Funcionalidades Implementadas

### 1. **Processamento de Imagens (Comprovantes)**
- ✅ Detecta imagens enviadas pelo WhatsApp
- ✅ Baixa a imagem do apifacil.dev
- ✅ Usa IA (Groq/Gemini/OpenAI) para extrair informações:
  - Tipo de comprovante (PIX, boleto, comprovante de compra)
  - Valor
  - Data
  - Descrição
  - Nome do beneficiário
  - Observações

### 2. **Transcrição de Áudios**
- ✅ Detecta áudios enviados pelo WhatsApp
- ✅ Transcreve áudio para texto usando OpenAI Whisper
- ✅ Processa o texto transcrito como mensagem normal

## 🔧 Configuração Necessária

### Para Processar Comprovantes (Imagens):
Você precisa de **pelo menos uma** das seguintes APIs configuradas:

1. **Groq (Recomendado - Gratuito e Rápido)**
   ```env
   GROQ_API_KEY=sua_chave_aqui
   ```
   - Modelo usado: `llama-3.2-11b-vision-preview`
   - Gratuito e rápido

2. **Google Gemini (Gratuito)**
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```
   - Modelo usado: `gemini-1.5-flash`
   - Gratuito e tem visão

3. **OpenAI (Pago)**
   ```env
   OPENAI_API_KEY=sua_chave_aqui
   ```
   - Modelo usado: `gpt-4o-mini`
   - Pago, mas alta qualidade

### Para Transcrever Áudios:
Você precisa de:

1. **OpenAI Whisper (Recomendado)**
   ```env
   OPENAI_API_KEY=sua_chave_aqui
   ```
   - Modelo usado: `whisper-1`
   - Melhor qualidade de transcrição

## 📝 Como Funciona

### Processamento de Comprovantes:

1. **Usuário envia imagem** de comprovante pelo WhatsApp
2. **Sistema detecta** que é uma imagem
3. **Baixa a imagem** do apifacil.dev
4. **Envia para IA** (Groq/Gemini/OpenAI) com prompt especializado
5. **IA extrai informações** em formato JSON:
   ```json
   {
     "tipo": "pix",
     "valor": 150.50,
     "data": "2025-01-15",
     "descricao": "Pagamento de conta",
     "nome_beneficiario": "João Silva",
     "observacoes": "PIX recebido"
   }
   ```
6. **Sistema formata** e envia resposta ao usuário
7. **Usuário confirma** se deseja registrar o pagamento

### Transcrição de Áudios:

1. **Usuário envia áudio** pelo WhatsApp
2. **Sistema detecta** que é um áudio
3. **Baixa o áudio** do apifacil.dev
4. **Transcreve** usando OpenAI Whisper
5. **Processa o texto** transcrito como mensagem normal
6. **Assistente responde** normalmente

## 🎯 Exemplos de Uso

### Enviar Comprovante de PIX:
1. Usuário envia foto do comprovante de PIX
2. Sistema responde:
   ```
   📄 Comprovante identificado:
   
   💸 Tipo: pix
   💰 Valor: R$ 150.50
   📅 Data: 2025-01-15
   📝 Descrição: Pagamento de conta
   👤 Beneficiário: João Silva
   
   💡 Deseja registrar este pagamento? Responda "sim" para confirmar.
   ```
3. Usuário responde "sim"
4. Sistema registra automaticamente

### Enviar Áudio:
1. Usuário envia áudio: "gastei 50 reais no mercado"
2. Sistema transcreve: "[Áudio transcrito]: gastei 50 reais no mercado"
3. Sistema processa normalmente e registra o gasto

## ⚠️ Limitações

1. **Qualidade da Imagem**: Imagens muito borradas ou de baixa qualidade podem não ser processadas corretamente
2. **Idioma**: Transcrição de áudio funciona melhor em português
3. **Custos**: OpenAI Whisper tem custos (mas baixos)
4. **Tempo**: Processamento de imagens pode levar alguns segundos

## 🔄 Próximas Melhorias

- [ ] Suporte para múltiplos comprovantes em uma imagem
- [ ] Validação automática de dados extraídos
- [ ] Registro automático após confirmação
- [ ] Suporte para documentos PDF
- [ ] Cache de comprovantes processados










