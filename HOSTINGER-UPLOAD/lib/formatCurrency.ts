/**
 * Função para formatar valor em tempo real durante a digitação
 * Formato brasileiro: 1.234.567,89
 * Limite: 1.000.000,00
 */

export function formatarValorEmTempoReal(value: string): string {
  try {
    // Se o valor estiver vazio ou for apenas espaços, retornar vazio
    if (!value || value.trim() === '') return ''
    
    // Remover tudo exceto números
    let numeros = value.replace(/\D/g, '')
    
    // Se não houver números, retornar vazio
    if (!numeros) return ''
    
    // Limitar a 1 milhão (8 dígitos: 10000000 = 1.000.000,00)
    if (numeros.length > 8) {
      numeros = numeros.slice(0, 8)
    }
    
    // Converter para número e dividir por 100 para ter centavos
    const valorNumerico = parseInt(numeros, 10)
    
    // Verificar se é um número válido
    if (isNaN(valorNumerico) || !isFinite(valorNumerico)) {
      return ''
    }
    
    const valor = valorNumerico / 100
    
    // Limitar a 1.000.000,00
    if (valor > 1000000) {
      return '1.000.000,00'
    }
    
    // Formatar em formato brasileiro
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(valor)
  } catch (error) {
    // Em caso de erro, retornar string vazia para não quebrar
    console.error('Erro ao formatar valor:', error)
    return ''
  }
}

export function converterValorFormatadoParaNumero(value: string): number {
  // Remover pontos e converter vírgula para ponto
  const valorLimpo = value.replace(/\./g, '').replace(',', '.')
  return parseFloat(valorLimpo) || 0
}

