/**
 * Fluxo oficial da assistente PLEN para o Chatbot Builder.
 * Ordem: Lead → Teste gasto → Registro teste → Copy cadastro → Cadastro → Email → Código → Conta confirmada → Tutorial → Estado ativo → Menu → IA + Regras.
 * Todas as mensagens editáveis no painel.
 */

const DX = 280
const DY = 120
function pos(x: number, y: number) {
  return { x: x * DX, y: y * DY }
}

export const OFFICIAL_FLOW_NAME = 'Fluxo oficial Plen'

export interface OfficialFlowNode {
  id: string
  type: 'flowNode'
  position: { x: number; y: number }
  data: {
    label: string
    nodeType: string
    config?: Record<string, unknown>
  }
}

export interface OfficialFlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
}

export function getOfficialPlenFlow(): { nodes: OfficialFlowNode[]; edges: OfficialFlowEdge[] } {
  const nodes: OfficialFlowNode[] = [
    // BLOCO 1 — INÍCIO: mensagem recebida, novo contato, mensagem de anúncio
    {
      id: 'oficial-inicio',
      type: 'flowNode',
      position: pos(1, 0),
      data: {
        label: 'Início',
        nodeType: 'inicio',
        config: {
          inicioTipo: 'mensagem_recebida',
          frasesGatilho: ['Olá! Quero utilizar a Plenipay.', 'quero utilizar', 'plenipay'],
          preview: 'mensagem recebida / novo contato / anúncio',
        },
      },
    },
    // BLOCO 2 — MENSAGEM BOAS-VINDAS
    {
      id: 'oficial-boas-vindas',
      type: 'flowNode',
      position: pos(1, 1),
      data: {
        label: 'Boas-vindas',
        nodeType: 'mensagem',
        config: {
          texto: `Olá {nome}! 💙

Eu sou a Plen, sua assistente financeira.

Vou te ajudar a controlar seus gastos direto pelo WhatsApp.

Vamos fazer um teste rápido.

Envie um gasto para eu registrar.

Exemplo:

Gastei 40 roupas
Café 12`,
          preview: 'Olá {nome}! Eu sou a Plen...',
        },
      },
    },
    // BLOCO 3 — IA INTERPRETAR GASTO TESTE (condição: tem valor = gasto)
    {
      id: 'oficial-cond-gasto',
      type: 'flowNode',
      position: pos(1, 2),
      data: {
        label: 'É um gasto?',
        nodeType: 'condicao',
        config: {
          condicaoCampo: 'tem_valor',
          condicaoValor: '',
          preview: 'mensagem tem valor (gasto)',
        },
      },
    },
    // BLOCO 4 — REGISTRAR GASTO TESTE
    {
      id: 'oficial-reg-gasto',
      type: 'flowNode',
      position: pos(0.5, 3),
      data: {
        label: 'Registrar gasto teste',
        nodeType: 'registrar_gasto',
        config: {
          registrarMsgConfirmacao: 'Registrado!',
          preview: 'Registrar gasto',
        },
      },
    },
    // Pedir gasto de novo (não detectou gasto)
    {
      id: 'oficial-pede-gasto',
      type: 'flowNode',
      position: pos(1.5, 3),
      data: {
        label: 'Pedir gasto de novo',
        nodeType: 'mensagem',
        config: {
          texto: 'Ops {nome}, envie um gasto simples para eu registrar.\n\nExemplo:\nCafé 12',
          preview: 'Ops {nome}, envie um gasto...',
        },
      },
    },
    // BLOCO 5 — MENSAGEM RESULTADO TESTE
    {
      id: 'oficial-msg-resultado',
      type: 'flowNode',
      position: pos(1, 4),
      data: {
        label: 'Resultado teste',
        nodeType: 'mensagem',
        config: {
          texto: `💙 Gasto registrado!

📂 Categoria: {categoria}
💰 Valor: R\${valor}
📅 Hoje

✨ Continue assim {nome}! ✨`,
          preview: 'Gasto registrado!',
        },
      },
    },
    // BLOCO 6 — COPY CADASTRO
    {
      id: 'oficial-copy-cadastro',
      type: 'flowNode',
      position: pos(1, 5),
      data: {
        label: 'Copy cadastro',
        nodeType: 'mensagem',
        config: {
          texto: `Viu como é rápido registrar seus gastos? 😄

Para continuar usando a Plen e salvar tudo no seu histórico vamos criar sua conta agora.

Prometo que é bem rápido! ✨`,
          preview: 'Viu como é rápido...',
        },
      },
    },
    // BLOCO 7 — PEDIR NOME (salvar como nome_usuario no contato)
    {
      id: 'oficial-pedir-nome',
      type: 'flowNode',
      position: pos(1, 6),
      data: {
        label: 'Pedir nome',
        nodeType: 'mensagem',
        config: {
          texto: 'Qual é o seu nome?',
          preview: 'Qual é o seu nome?',
        },
      },
    },
    // BLOCO 8 — PEDIR EMAIL
    {
      id: 'oficial-pedir-email',
      type: 'flowNode',
      position: pos(1, 7),
      data: {
        label: 'Pedir email',
        nodeType: 'mensagem',
        config: {
          texto: 'Agora me diga seu email para criar sua conta.',
          preview: 'Me diga seu email',
        },
      },
    },
    // BLOCO 9/10 — Condição email válido; criar conta + enviar email (runner)
    {
      id: 'oficial-cond-email',
      type: 'flowNode',
      position: pos(1, 8),
      data: {
        label: 'Email válido?',
        nodeType: 'condicao',
        config: {
          condicaoCampo: 'mensagem_contem',
          condicaoValor: '@',
          preview: 'email contém @',
        },
      },
    },
    // BLOCO 11 — PEDIR CÓDIGO (após criar conta e enviar email)
    {
      id: 'oficial-pedir-codigo',
      type: 'flowNode',
      position: pos(0.5, 9),
      data: {
        label: 'Pedir código',
        nodeType: 'mensagem',
        config: {
          texto: `Perfeito {nome}!

Enviei um código de confirmação no seu email.

Envie ele aqui para ativar sua conta.`,
          preview: 'Enviei um código...',
        },
      },
    },
    // Email inválido
    {
      id: 'oficial-email-invalido',
      type: 'flowNode',
      position: pos(1.5, 9),
      data: {
        label: 'Email inválido',
        nodeType: 'mensagem',
        config: {
          texto: 'Esse email não parece válido. Me diga seu email novamente.',
          preview: 'Email inválido',
        },
      },
    },
    // BLOCO 12 — Tratamento "email não chegou" (runner em aguardando_codigo)
    // BLOCO 13 — Validar código (runner)
    // BLOCO 14 — CONTA CONFIRMADA
    {
      id: 'oficial-conta-confirmada',
      type: 'flowNode',
      position: pos(1, 10),
      data: {
        label: 'Conta confirmada',
        nodeType: 'mensagem',
        config: {
          texto: 'Conta confirmada {nome}! 🎉\n\nAgora você já pode registrar seus gastos.\n\nDigite MENU a qualquer momento para acessar as opções.',
          preview: 'Conta confirmada! 🎉',
        },
      },
    },
    // BLOCO 15 — MENU GLOBAL
    {
      id: 'oficial-menu-global',
      type: 'flowNode',
      position: pos(1, 11),
      data: {
        label: 'Menu global',
        nodeType: 'menu',
        config: {
          menuIntro: 'Olá, {nome}! 💙 Selecione abaixo como posso te ajudar: atendimento humanizado, dúvidas sobre a Plen, planos, recursos premium ou consulta de saldo.',
          menuOpcoes: `Atendimento humano
Como funciona
Plano R$9,90/mês
Recursos premium
Indique e ganhe
Consultar saldo`,
          preview: '6 opções',
        },
      },
    },
    // BLOCO 16 — TUTORIAL
    {
      id: 'oficial-tutorial',
      type: 'flowNode',
      position: pos(1, 12),
      data: {
        label: 'Tutorial',
        nodeType: 'mensagem',
        config: {
          texto: `Agora você pode registrar assim:

gastei 50 mercado
recebi 2000 salário
oficina 300

Você também pode enviar:

áudio
foto
comprovante

Se eu não entender algo envio instruções para você.`,
          preview: 'Agora você pode registrar...',
        },
      },
    },
    // BLOCO 17 — ESTADO ATIVO
    {
      id: 'oficial-estado-ativo',
      type: 'flowNode',
      position: pos(1, 13),
      data: {
        label: 'Estado ativo',
        nodeType: 'mensagem',
        config: {
          texto: 'A partir daqui você pode usar "menu" ou registrar gastos e receitas a qualquer momento.',
          preview: 'Estado ativo',
        },
      },
    },
    // BLOCO 18 — IA DETECTAR INTENÇÕES
    {
      id: 'oficial-ia-intencoes',
      type: 'flowNode',
      position: pos(1, 14),
      data: {
        label: 'IA detectar intenções',
        nodeType: 'ia',
        config: {
          iaPrompt: `Você é a Plen, assistente financeira. Interprete a mensagem do usuário.

Detecte e responda para:
- Registrar gasto (ex.: "café 12", "gastei 40 roupas") → confirme o registro
- Registrar receita (ex.: "recebi 2000 salário") → confirme
- Consultar saldo, gastos do mês → informe de forma simples
- "menu" → mostre as opções (1 Falar com humano, 2 Como funciona, 3 Assinatura R$9,90, 4 Funções premium, 5 Indique e ganhe, 6 Total/saldo)
- Perguntas gerais → responda com educação e objetividade

Use o nome do contato quando possível.`,
          preview: 'IA registrar gasto, receita, saldo, menu',
        },
      },
    },
    // BLOCO 19 — REGRA PLANO GRATUITO
    {
      id: 'oficial-regra-plano',
      type: 'flowNode',
      position: pos(0.5, 15),
      data: {
        label: 'Regra plano gratuito',
        nodeType: 'condicao',
        config: {
          condicaoCampo: 'mensagem_contem',
          condicaoValor: 'limite',
          preview: '> 10 registros',
        },
      },
    },
    {
      id: 'oficial-msg-upgrade',
      type: 'flowNode',
      position: pos(0.5, 16),
      data: {
        label: 'Mensagem upgrade',
        nodeType: 'mensagem',
        config: {
          texto: '{nome}, você atingiu o limite do plano gratuito 💙\n\nTenho um presente para você 🎁\n\nPlano básico que custa R$49,90 está disponível para você por apenas R$9,90.',
          preview: 'Upgrade R$9,90',
        },
      },
    },
    // BLOCO 20 — REGRA DÍVIDAS (mensagem quando plano gratuito)
    {
      id: 'oficial-msg-dividas',
      type: 'flowNode',
      position: pos(1.5, 15),
      data: {
        label: 'Regra dívidas',
        nodeType: 'mensagem',
        config: {
          texto: 'Ops {nome}, registro de dívidas está disponível apenas no plano básico.',
          preview: 'Dívidas no plano básico',
        },
      },
    },
    // BLOCO 21 — LEMBRETES
    {
      id: 'oficial-lembretes',
      type: 'flowNode',
      position: pos(1, 16),
      data: {
        label: 'Lembretes',
        nodeType: 'lembrete',
        config: {
          lembreteDescricao: 'Lembrete criado',
          lembreteDias: '1',
          preview: 'Lembrete automático',
        },
      },
    },
    // Fins (fechar ramos do menu e regras)
    { id: 'oficial-fim-1', type: 'flowNode', position: pos(0, 17), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'oficial-fim-2', type: 'flowNode', position: pos(0.5, 17), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'oficial-fim-3', type: 'flowNode', position: pos(1, 17), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'oficial-fim-4', type: 'flowNode', position: pos(1.5, 17), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'oficial-fim-5', type: 'flowNode', position: pos(0.3, 14), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'oficial-fim-6', type: 'flowNode', position: pos(0.8, 14), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'oficial-fim-7', type: 'flowNode', position: pos(1.2, 14), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'oficial-fim-8', type: 'flowNode', position: pos(1.6, 14), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'oficial-fim-9', type: 'flowNode', position: pos(2, 14), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'oficial-fim-10', type: 'flowNode', position: pos(2.4, 14), data: { label: 'Fim', nodeType: 'fim' } },
  ]

  // Opções do menu (conectadas ao menu global na ordem 1–6)
  const menuNodes: OfficialFlowNode[] = [
    {
      id: 'oficial-msg-falar-humano',
      type: 'flowNode',
      position: pos(0.3, 13),
      data: {
        label: 'Falar com humano',
        nodeType: 'mensagem',
        config: {
          texto: 'Em breve um atendente vai te responder. Enquanto isso, posso te ajudar com gastos e receitas! 💙',
          preview: 'Em breve um atendente...',
        },
      },
    },
    {
      id: 'oficial-msg-como-funciona',
      type: 'flowNode',
      position: pos(0.8, 13),
      data: {
        label: 'Como funciona',
        nodeType: 'mensagem',
        config: {
          texto: 'A Plen registra seus gastos e receitas pelo WhatsApp. Envie "café 12" ou "recebi 2000" e eu organizo tudo. Digite "menu" para mais opções.',
          preview: 'Como funciona',
        },
      },
    },
    {
      id: 'oficial-msg-assinatura',
      type: 'flowNode',
      position: pos(1.2, 13),
      data: {
        label: 'Assinatura R$9,90',
        nodeType: 'mensagem',
        config: {
          texto: 'Plano básico por apenas R$9,90/mês. Controle ilimitado. Quer ativar? Responda "sim" ou fale com um atendente (opção 1).',
          preview: 'R$9,90/mês',
        },
      },
    },
    {
      id: 'oficial-msg-premium',
      type: 'flowNode',
      position: pos(1.6, 13),
      data: {
        label: 'Funções premium',
        nodeType: 'mensagem',
        config: {
          texto: 'Funções premium: relatórios, metas, lembretes. Assine o plano por R$9,90 e desbloqueie tudo. Digite "menu" para voltar.',
          preview: 'Funções premium',
        },
      },
    },
    {
      id: 'oficial-msg-indique',
      type: 'flowNode',
      position: pos(2, 13),
      data: {
        label: 'Indique e ganhe',
        nodeType: 'mensagem',
        config: {
          texto: 'Indique a Plen para amigos e ganhe benefícios! Compartilhe seu link. Digite "menu" para outras opções.',
          preview: 'Indique e ganhe',
        },
      },
    },
    {
      id: 'oficial-msg-saldo',
      type: 'flowNode',
      position: pos(2.4, 13),
      data: {
        label: 'Total / saldo',
        nodeType: 'mensagem',
        config: {
          texto: `📊 Total / saldo

💰 Resumo do seu dinheiro

Você pode pedir assim:
- meu saldo total
- quanto eu tenho
- relatório dessa semana
- relatório do mês
- relatório do ano

Se você quer ver mais detalhes acesse o painel completo.`,
          botoes: [{ titulo: 'Ver no painel', link: '{dashboardUrl}' }],
          preview: 'Ver saldo',
        },
      },
    },
  ]
  nodes.push(...menuNodes)

  const edges: OfficialFlowEdge[] = [
    // Fluxo principal
    { id: 'e1', source: 'oficial-inicio', target: 'oficial-boas-vindas' },
    { id: 'e2', source: 'oficial-boas-vindas', target: 'oficial-cond-gasto' },
    { id: 'e3', source: 'oficial-cond-gasto', target: 'oficial-reg-gasto', sourceHandle: 'sim' },
    { id: 'e4', source: 'oficial-cond-gasto', target: 'oficial-pede-gasto', sourceHandle: 'nao' },
    { id: 'e5', source: 'oficial-pede-gasto', target: 'oficial-cond-gasto' },
    { id: 'e6', source: 'oficial-reg-gasto', target: 'oficial-msg-resultado' },
    { id: 'e7', source: 'oficial-msg-resultado', target: 'oficial-copy-cadastro' },
    { id: 'e8', source: 'oficial-copy-cadastro', target: 'oficial-pedir-nome' },
    { id: 'e9', source: 'oficial-pedir-nome', target: 'oficial-pedir-email' },
    { id: 'e10', source: 'oficial-pedir-email', target: 'oficial-cond-email' },
    { id: 'e11', source: 'oficial-cond-email', target: 'oficial-pedir-codigo', sourceHandle: 'sim' },
    { id: 'e12', source: 'oficial-cond-email', target: 'oficial-email-invalido', sourceHandle: 'nao' },
    { id: 'e13', source: 'oficial-email-invalido', target: 'oficial-pedir-email' },
    { id: 'e14', source: 'oficial-pedir-codigo', target: 'oficial-conta-confirmada' },
    { id: 'e15', source: 'oficial-conta-confirmada', target: 'oficial-menu-global' },
    { id: 'e16', source: 'oficial-menu-global', target: 'oficial-msg-falar-humano' },
    { id: 'e17', source: 'oficial-menu-global', target: 'oficial-msg-como-funciona' },
    { id: 'e18', source: 'oficial-menu-global', target: 'oficial-msg-assinatura' },
    { id: 'e19', source: 'oficial-menu-global', target: 'oficial-msg-premium' },
    { id: 'e20', source: 'oficial-menu-global', target: 'oficial-msg-indique' },
    { id: 'e21', source: 'oficial-menu-global', target: 'oficial-msg-saldo' },
    { id: 'e22', source: 'oficial-msg-falar-humano', target: 'oficial-tutorial' },
    { id: 'e23', source: 'oficial-msg-como-funciona', target: 'oficial-tutorial' },
    { id: 'e24', source: 'oficial-msg-assinatura', target: 'oficial-tutorial' },
    { id: 'e25', source: 'oficial-msg-premium', target: 'oficial-tutorial' },
    { id: 'e26', source: 'oficial-msg-indique', target: 'oficial-tutorial' },
    { id: 'e27', source: 'oficial-msg-saldo', target: 'oficial-tutorial' },
    { id: 'e28', source: 'oficial-tutorial', target: 'oficial-estado-ativo' },
    { id: 'e29', source: 'oficial-estado-ativo', target: 'oficial-ia-intencoes' },
    { id: 'e30', source: 'oficial-ia-intencoes', target: 'oficial-ia-intencoes' },
    // Regras
    { id: 'e31', source: 'oficial-regra-plano', target: 'oficial-msg-upgrade', sourceHandle: 'sim' },
    { id: 'e32', source: 'oficial-regra-plano', target: 'oficial-lembretes', sourceHandle: 'nao' },
    { id: 'e33', source: 'oficial-msg-upgrade', target: 'oficial-fim-1' },
    { id: 'e34', source: 'oficial-lembretes', target: 'oficial-fim-2' },
    { id: 'e35', source: 'oficial-msg-dividas', target: 'oficial-fim-3' },
  ]

  return { nodes, edges }
}
