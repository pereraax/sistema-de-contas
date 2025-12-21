// Tipos de notificação permitidos
export type NotificationType = 'novo_registro' | 'divida_quitada' | 'aviso_admin'

// Função para criar aviso do administrador (pode ser chamada do servidor)
export async function criarAvisoAdmin(mensagem: string) {
  // Esta função pode ser expandida para salvar no banco e notificar usuários
  // Por enquanto, apenas retorna a mensagem formatada
  return `🔔 ${mensagem}`
}

