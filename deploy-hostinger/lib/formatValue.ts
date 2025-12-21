/**
 * Função helper para formatar valores monetários sem limitações
 * Suporta valores ilimitados usando manipulação de strings
 */

export function formatarValorParaExibicao(valor: string | number): string {
  if (!valor && valor !== 0) return ''
  
  // Converter para string se for número
  let valorStr = typeof valor === 'number' ? valor.toString() : valor
  
  // Remover formatação existente
  valorStr = valorStr.replace(/[^\d,.-]/g, '').replace(',', '.')
  
  // Tentar parsear como número
  const numValue = parseFloat(valorStr)
  
  if (isNaN(numValue)) {
    // Se não for um número válido, retornar string limpa
    return valorStr.replace(/[^\d,]/g, '')
  }
  
  // Formatar com Intl.NumberFormat
  try {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue)
  } catch (e) {
    // Se falhar na formatação, retornar valor original
    return valorStr
  }
}

export function parseValorParaNumero(valor: string): number {
  if (!valor) return 0
  
  // Remover formatação e converter para número
  const valorLimpo = valor.replace(/[^\d,.-]/g, '').replace(',', '.')
  const numValue = parseFloat(valorLimpo)
  
  return isNaN(numValue) ? 0 : numValue
}

export function validarValorInput(valor: string): boolean {
  if (!valor) return true // Permitir campo vazio
  
  // Remover formatação
  const valorLimpo = valor.replace(/[^\d,.-]/g, '').replace(',', '.')
  
  // Verificar se é um número válido
  const numValue = parseFloat(valorLimpo)
  
  // Permitir qualquer número válido (sem limite)
  return !isNaN(numValue) && isFinite(numValue)
}





