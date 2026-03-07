/**
 * PLEN — Respostas curtas para perguntas durante o cadastro
 * Responde brevemente e repete o passo do fluxo (estado).
 */

import type { PlenState } from '../state/user-state-manager'

const MENSAGENS_PERGUNTA: Record<PlenState, string> = {
  NEW_LEAD:
    'A Plen registra seus gastos automaticamente quando você envia mensagens como:\n\nCafé 12\n\nAntes disso, vamos fazer um teste rápido. Envie um gasto para eu registrar. Exemplo: Café 12',
  TEST_EXPENSE:
    'Envie um gasto no formato: descrição e valor.\nExemplo: Café 12',
  WAITING_NAME:
    'A Plen registra seus gastos quando você manda mensagens como "Café 12". Mas primeiro precisamos finalizar seu cadastro. Qual é o seu nome?',
  WAITING_EMAIL:
    'A Plen registra seus gastos no WhatsApp. Para salvar seus registros, precisamos criar sua conta. Qual é o seu email?',
  WAITING_CODE:
    'Digite o código de 6 dígitos que enviamos para seu email.',
  USER_ACTIVE:
    'Você pode registrar gastos enviando mensagens como: Almoço 35 ou Café 12.',
}

/**
 * Retorna mensagem curta para "pergunta" no estado atual, mantendo o fluxo.
 */
export function getQuestionReply(state: PlenState): string {
  return MENSAGENS_PERGUNTA[state] ?? MENSAGENS_PERGUNTA.NEW_LEAD
}
