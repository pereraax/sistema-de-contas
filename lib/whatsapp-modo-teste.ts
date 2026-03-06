/**
 * Modo de teste inicial no WhatsApp da Plen: usuário registra um gasto antes de criar conta.
 * Fluxo: (1) Mensagem inicial pedindo um gasto; (2) Usuário envia "50 mercado"; (3) Resposta com categoria e valor; (4) "Viu como é rápido? Vamos criar sua conta?"
 */

import { extrairValor, categoriaInteligente } from '@/lib/plen-registro'

/** Mensagem do modo teste: saudação + pedir um gasto do dia (ex.: 50 mercado). Usada quando o lead clica CADASTRAR ou em fluxos de boas-vindas. */
export function getMensagemInicialModoTeste(contactName?: string | null): string {
  const raw = (contactName ?? '').trim().slice(0, 50)
  const nome = raw && raw.toLowerCase() !== 'nome' && raw.toLowerCase() !== 'pessoa' ? raw : ''
  const saudacao = nome ? `Oiii ${nome} 👋✨!!!` : 'Oiii 👋✨!!!'
  return `${saudacao}

💙 Eu sou a Plen, sua assistente financeira 😊

✨ Antes de criar sua conta, vamos testar rapidinho.

aaah eu só funciono quando você salva meu contato, então salva pra não ocorrer erro em reconhecer sua conversa! 😊

👉 Me diga algo que você gastou hoje.

Exemplo:
* 50 mercado
* 20 uber`
}

/** Mensagem de intro Plenipay (oi, quero usar, quero registrar): texto fixo. Sem botão — o lead digita CADASTRAR. */
export function getMensagemIntroPlenipay(contactName?: string | null): string {
  const raw = (contactName ?? '').trim().slice(0, 50)
  const nome = raw && raw.toLowerCase() !== 'nome' && raw.toLowerCase() !== 'pessoa' ? raw : ''
  const saudacao = nome ? `Olá ${nome} 😊!` : 'Olá! 😊'
  return `${saudacao} Estou aqui para te ajudar!

A Plenipay é uma ferramenta que ajuda a controlar suas finanças de forma fácil!

registrando gastos, receitas e dívidas.

Quer começar a usar a Plenipay?

Digite *CADASTRAR* para começar. 😊`
}

/** Quando o lead envia algo que não é gasto/entrada: convite para testar antes. */
export const MSG_TESTAR_ANTES = `Vamos testar antes? 😊 Me diga um gasto ou uma entrada do dia (ex.: 50 mercado ou recebi 100) e seguimos a partir daí. 💙`

/** Quando o lead diz que não gastou nada / ainda não gastou: convite a testar com valor fictício. */
export const MSG_NADA_VAMOS_TESTAR = `Vamos testar pra você ver como funciona! 😊 Pode dizer um valor fictício por enquanto.\n\nExemplo:\n* 50 mercado\n* 20 uber`

/** Resultado do parse de um gasto simples (ex.: "50 mercado", "20 uber"). */
export type GastoSimples = { valor: number; categoria: string; descricao: string }

/**
 * Tenta extrair um gasto simples do texto: valor + descrição (ex.: "50 mercado", "20 uber", "30 carros", "gastei 20 pão", "30,50 lanche").
 * Retorna null se não parecer um gasto.
 */
export function parseGastoSimples(texto: string): GastoSimples | null {
  const t = (texto || '').trim().replace(/\s+/g, ' ')
  if (!t || t.length > 500) return null
  let valor = extrairValor(t)
  let semValor = t
    .replace(/^[\d.,]+\s*(reais?|r\$|r\b)?\s*/i, '')
    .trim()
  if (semValor === t && /^(gastei|paguei)\s+/i.test(t)) {
    semValor = t.replace(new RegExp(`^(gastei|paguei)\\s+[\\d.,]+\\s*(reais?|r\\$|r\\b)?\\s*`, 'i'), '').trim()
  }
  // Fallback: "N coisa" ou "N coisas" (ex.: 30 carros, 50 mercado) quando extrairValor falha ou descrição ficou vazia
  if (valor == null || valor <= 0 || valor > 999_999 || !semValor || semValor.length < 2) {
    const simpleMatch = t.match(/^\s*(\d+(?:[.,]\d+)?)\s+([\wà-úÀ-Ú\s]+)\s*$/i)
    if (simpleMatch) {
      const v = parseFloat(simpleMatch[1].replace(',', '.'))
      const desc = (simpleMatch[2] || '').trim().slice(0, 100) || 'Gasto'
      if (!isNaN(v) && v > 0 && v <= 999_999 && desc) {
        valor = v
        semValor = desc
      }
    }
  }
  if (valor == null || valor <= 0 || valor > 999_999) return null
  const descricao = semValor.slice(0, 100) || 'Gasto'
  const categoria = categoriaInteligente(descricao, 'saida')
  return { valor, categoria, descricao }
}

/** Mensagem de confirmação do gasto registrado no modo teste (nome, data do dia, categoria, valor). */
export function getMsgGastoRegistradoModoTeste(
  categoria: string,
  valor: number,
  data?: Date,
  nome?: string | null
): string {
  const valorStr = typeof valor === 'number' && valor >= 0
    ? valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(valor)
  const d = data ?? new Date()
  const dataDoDia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const hoje = new Date()
  const isHoje = d.toDateString() === hoje.toDateString()
  const dataStr = isHoje ? `Hoje (${dataDoDia})` : dataDoDia
  const linhaNome = nome && nome.trim() && nome.toLowerCase() !== 'nome' && nome.toLowerCase() !== 'pessoa'
    ? `${nome.trim().slice(0, 50)}\n\n`
    : ''
  return `${linhaNome}💙 Gasto registrado!

📂 Categoria: ${categoria}
💰 Valor: R$ ${valorStr}
📅 ${dataStr}

Continue assim! ✨`
}

/** Mensagem de follow-up após registrar o gasto no modo teste. */
export const MSG_FOLLOW_UP_CRIAR_CONTA = `Viu como é rápido? 😄

Posso organizar todos os seus gastos automaticamente.

Vamos criar sua conta?`
