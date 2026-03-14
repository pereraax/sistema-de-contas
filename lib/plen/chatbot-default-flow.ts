/**
 * Fluxo padrão "Fluxo principal Plen" para o Chatbot Builder.
 * Monta automaticamente o canvas com todos os blocos conectados.
 */

const DX = 280
const DY = 120

function pos(x: number, y: number) {
  return { x: x * DX, y: y * DY }
}

export const DEFAULT_FLOW_NAME = 'Fluxo principal Plen'

export interface DefaultFlowNode {
  id: string
  type: 'flowNode'
  position: { x: number; y: number }
  data: {
    label: string
    nodeType: string
    config?: Record<string, unknown>
  }
}

export interface DefaultFlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
}

export function getDefaultPlenFlow(): { nodes: DefaultFlowNode[]; edges: DefaultFlowEdge[] } {
  const nodes: DefaultFlowNode[] = [
    // 1. Início — mensagem recebida, novo contato, mensagem de anúncio (qualquer mensagem)
    {
      id: 'plen-inicio',
      type: 'flowNode',
      position: pos(1, 0),
      data: {
        label: 'Início',
        nodeType: 'inicio',
        config: {
          inicioTipo: 'mensagem_recebida',
          frasesGatilho: [], // vazio = qualquer mensagem (inclui novo contato e anúncio)
          preview: 'mensagem_recebida (qualquer mensagem)',
        },
      },
    },
    // 2. Mensagem boas-vindas
    {
      id: 'plen-boas-vindas',
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

Café 12 ☕`,
          preview: 'Olá {nome}! Eu sou a Plen...',
        },
      },
    },
    // 3. Condição: mensagem parece gasto/receita? (tem valor = dígito) — sim -> registrar, não -> pedir de novo
    {
      id: 'plen-cond-gasto',
      type: 'flowNode',
      position: pos(1, 2),
      data: {
        label: 'É um gasto?',
        nodeType: 'condicao',
        config: {
          condicaoCampo: 'tem_valor',
          condicaoValor: '',
          preview: 'mensagem tem valor (gasto/receita)',
        },
      },
    },
    // 4. Registrar gasto teste
    {
      id: 'plen-reg-gasto',
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
    // 5. Mensagem "pedir gasto de novo" (saída Não da condição)
    {
      id: 'plen-msg-pede-gasto',
      type: 'flowNode',
      position: pos(1.5, 3),
      data: {
        label: 'Pedir gasto de novo',
        nodeType: 'mensagem',
        config: {
          texto: 'Ops {nome}, me envie um gasto simples para eu registrar.\n\nExemplo:\nCafé 12',
          preview: 'Ops {nome}, me envie um gasto...',
        },
      },
    },
    // 6. Mensagem resultado teste (sem pedir nome aqui)
    {
      id: 'plen-msg-resultado',
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

✨ Continue assim {nome}! ✨

Ta vendo como é rápido registrar? Posso registrar todos seus gastos e entradas…

Vamos criar sua conta? É bem rápido, prometo!`,
          preview: 'Gasto registrado! Vamos criar sua conta?',
        },
      },
    },
    // 7. Cadastro nome — mensagem separada pedindo o nome
    {
      id: 'plen-msg-pede-nome',
      type: 'flowNode',
      position: pos(1, 5),
      data: {
        label: 'Cadastro nome',
        nodeType: 'mensagem',
        config: {
          texto: 'Qual é o seu nome?',
          preview: 'Qual é o seu nome?',
        },
      },
    },
    // 8. IA confirma nome e pede email
    {
      id: 'plen-ia-nome',
      type: 'flowNode',
      position: pos(1, 6),
      data: {
        label: 'Confirma nome',
        nodeType: 'ia',
        config: {
          iaPrompt:
            'A última mensagem do usuário é o nome dele. Responda: "Prazer [nome]! 😊 Agora me diga qual é o seu email." substituindo [nome] pelo nome que ele enviou.',
          preview: 'Prazer {nome}! Agora me diga seu email.',
        },
      },
    },
    // 9. Cadastro email — mensagem pedindo email
    {
      id: 'plen-msg-pede-email',
      type: 'flowNode',
      position: pos(1, 7),
      data: {
        label: 'Cadastro email',
        nodeType: 'mensagem',
        config: {
          texto: 'Agora me diga qual é o seu email.',
          preview: 'Qual é o seu email?',
        },
      },
    },
    // 10. Verificação — condição email válido (contém @)
    {
      id: 'plen-cond-email',
      type: 'flowNode',
      position: pos(1, 8),
      data: {
        label: 'Email válido?',
        nodeType: 'condicao',
        config: {
          condicaoCampo: 'mensagem_contem',
          condicaoValor: '@',
          preview: 'mensagem contém @',
        },
      },
    },
    // 11. Mensagem código (sim)
    {
      id: 'plen-msg-codigo',
      type: 'flowNode',
      position: pos(0.5, 9),
      data: {
        label: 'Mensagem código',
        nodeType: 'mensagem',
        config: {
          texto: `Enviei um código de verificação para seu email.

Digite o código aqui para finalizar seu cadastro.`,
          preview: 'Enviei um código...',
        },
      },
    },
    // 12. Email inválido (não)
    {
      id: 'plen-msg-email-invalido',
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
    // 13. Tutorial inicial
    {
      id: 'plen-tutorial',
      type: 'flowNode',
      position: pos(1, 10),
      data: {
        label: 'Tutorial inicial',
        nodeType: 'mensagem',
        config: {
          texto: `Pronto {nome}! Sua conta foi criada com sucesso 🎉

Agora você pode registrar seus gastos assim:

gastei 50 com mercado
recebi 2000 salário
oficina 300

Você também pode enviar:

🎤 áudio
📸 foto
📄 comprovante

Eu consigo registrar tudo.

Se quiser mais opções digite:

menu`,
          preview: 'Pronto! Sua conta foi criada...',
        },
      },
    },
    // 14. Estado ativo
    {
      id: 'plen-estado-ativo',
      type: 'flowNode',
      position: pos(1, 11),
      data: {
        label: 'Estado ativo',
        nodeType: 'mensagem',
        config: {
          texto: 'A partir daqui você pode usar "menu" ou registrar gastos e receitas a qualquer momento.',
          preview: 'Estado ativo',
        },
      },
    },
    // 15. IA + regras
    {
      id: 'plen-ia-regras',
      type: 'flowNode',
      position: pos(1, 12),
      data: {
        label: 'IA interpretar mensagens',
        nodeType: 'ia',
        config: {
          iaPrompt: `Você é a Plen, assistente financeira. Interprete a mensagem do usuário e responda de forma curta e útil.

Detecte e responda para:
- Registrar gasto (ex.: "café 12", "almoço 50") → confirme o registro
- Registrar receita (ex.: "salário 5000", "recebi 200") → confirme
- Saldo, gastos do mês → informe de forma simples
- "menu" → diga que as opções aparecerão abaixo
- Perguntas gerais → responda com educação e objetividade

Use o nome do contato quando possível.`,
          preview: 'IA registrar gasto, receita, saldo, menu',
        },
      },
    },
    // 16. Menu global
    {
      id: 'plen-menu-global',
      type: 'flowNode',
      position: pos(1, 13),
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
    // 17. Delay humano (1.5–5 s)
    {
      id: 'plen-delay-humano',
      type: 'flowNode',
      position: pos(0.3, 14),
      data: {
        label: 'Delay humano',
        nodeType: 'delay',
        config: { delayMin: 1.5, delayMax: 5, preview: '1.5-5s' },
      },
    },
    // 18. Mensagem Falar com humano (após delay)
    {
      id: 'plen-msg-falar-humano',
      type: 'flowNode',
      position: pos(0.3, 15),
      data: {
        label: 'Falar com humano',
        nodeType: 'mensagem',
        config: {
          texto: 'Em breve um atendente vai te responder. Enquanto isso, posso te ajudar com gastos e receitas! 💙',
          preview: 'Em breve um atendente...',
          botoes: [{ titulo: 'Chamar atendente', link: '' }],
        },
      },
    },
    // 19–24. Opções 2–6 do menu (mensagens)
    {
      id: 'plen-msg-como-funciona',
      type: 'flowNode',
      position: pos(0.8, 14),
      data: {
        label: 'Como funciona',
        nodeType: 'mensagem',
        config: {
          texto: 'A Plen registra seus gastos e receitas pelo WhatsApp. Envie "café 12" ou "recebi 2000" e eu organizo tudo para você. Digite "menu" para mais opções.',
          preview: 'Como funciona',
        },
      },
    },
    {
      id: 'plen-msg-assinatura',
      type: 'flowNode',
      position: pos(1.2, 14),
      data: {
        label: 'Assinatura',
        nodeType: 'mensagem',
        config: {
          texto:
            '💙 *Plano Básico — R$ 9,90/mês*\n\n' +
            'Com a assinatura você desbloqueia tudo que a PLEN oferece:\n\n' +
            '• *Controle ilimitado* de gastos e receitas\n' +
            '• *Lembretes* para não esquecer de registrar\n' +
            '• *Relatórios e visão do seu dinheiro* na plataforma\n' +
            '• *Metas* para guardar e planejar\n' +
            '• Acesso pelo celular e pelo computador, quando quiser\n\n' +
            'Por menos de R$ 0,35 por dia você organiza suas contas de forma simples e segura. Quer assinar? Use o botão abaixo para ir direto à plataforma.',
          preview: 'Plano R$9,90 — vantagens e botão',
          botoes: [
            { titulo: 'Ver plano e assinar na plataforma', link: '{dashboardUrl}/upgrade' },
          ],
        },
      },
    },
    {
      id: 'plen-msg-premium',
      type: 'flowNode',
      position: pos(1.6, 14),
      data: {
        label: 'Funções premium',
        nodeType: 'mensagem',
        config: {
          texto: 'Funções premium: relatórios, metas, lembretes e mais. Assine o plano por R$9,90 e desbloqueie tudo. Digite "menu" para voltar.',
          preview: 'Funções premium',
        },
      },
    },
    {
      id: 'plen-msg-indique',
      type: 'flowNode',
      position: pos(2, 14),
      data: {
        label: 'Indique e ganhe',
        nodeType: 'mensagem',
        config: {
          texto: 'Indique a Plen para amigos e ganhe benefícios! Compartilhe seu link de indicação. Digite "menu" para outras opções.',
          preview: 'Indique e ganhe',
        },
      },
    },
    {
      id: 'plen-msg-saldo',
      type: 'flowNode',
      position: pos(2.4, 14),
      data: {
        label: 'Ver saldo',
        nodeType: 'mensagem',
        config: {
          texto: 'Para ver seu saldo e resumos, acesse o app ou digite "gastos do mês" que eu te ajudo por aqui. 💙',
          preview: 'Ver saldo',
        },
      },
    },
    // 25. Regras plano gratuito (condição placeholder)
    {
      id: 'plen-cond-plano',
      type: 'flowNode',
      position: pos(1, 16),
      data: {
        label: 'Regras plano gratuito',
        nodeType: 'condicao',
        config: {
          condicaoCampo: 'mensagem_contem',
          condicaoValor: 'limite', // placeholder; backend pode usar total_gastos
          preview: '> 10 gastos',
        },
      },
    },
    // 26. Mensagem upgrade
    {
      id: 'plen-msg-upgrade',
      type: 'flowNode',
      position: pos(0.5, 17),
      data: {
        label: 'Mensagem upgrade',
        nodeType: 'mensagem',
        config: {
          texto: '{nome}, você já usou todos os registros do plano gratuito 💙\n\nTenho um presente para você 🎁\n\nPlano básico que custa R$49,90 está disponível por apenas R$9,90.',
          preview: 'Upgrade R$9,90',
        },
      },
    },
    // 27. Lembretes automáticos
    {
      id: 'plen-lembretes',
      type: 'flowNode',
      position: pos(1.5, 17),
      data: {
        label: 'Lembretes automáticos',
        nodeType: 'lembrete',
        config: {
          lembreteDescricao: 'Lembrete criado para você',
          lembreteDias: '1',
          preview: 'Lembrete',
        },
      },
    },
    // 28. Reengajamento
    {
      id: 'plen-msg-reengajamento',
      type: 'flowNode',
      position: pos(1, 18),
      data: {
        label: 'Reengajamento',
        nodeType: 'mensagem',
        config: {
          texto: 'Ei {nome} 💬\n\nPosso continuar te ajudando a organizar seus gastos?',
          preview: 'Ei {nome}, posso ajudar?',
        },
      },
    },
    // Fins (para fechar ramos)
    { id: 'plen-fim-1', type: 'flowNode', position: pos(0.3, 16), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'plen-fim-2', type: 'flowNode', position: pos(0.8, 15), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'plen-fim-3', type: 'flowNode', position: pos(1.2, 15), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'plen-fim-4', type: 'flowNode', position: pos(1.6, 15), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'plen-fim-5', type: 'flowNode', position: pos(2, 15), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'plen-fim-6', type: 'flowNode', position: pos(2.4, 15), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'plen-fim-7', type: 'flowNode', position: pos(0.5, 18), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'plen-fim-8', type: 'flowNode', position: pos(1.5, 18), data: { label: 'Fim', nodeType: 'fim' } },
    { id: 'plen-fim-9', type: 'flowNode', position: pos(1, 19), data: { label: 'Fim', nodeType: 'fim' } },
  ]

  const edges: DefaultFlowEdge[] = [
    { id: 'e-inicio-boas', source: 'plen-inicio', target: 'plen-boas-vindas' },
    { id: 'e-boas-cond', source: 'plen-boas-vindas', target: 'plen-cond-gasto' },
    { id: 'e-cond-reg', source: 'plen-cond-gasto', target: 'plen-reg-gasto', sourceHandle: 'sim' },
    { id: 'e-cond-pede', source: 'plen-cond-gasto', target: 'plen-msg-pede-gasto', sourceHandle: 'nao' },
    { id: 'e-reg-resultado', source: 'plen-reg-gasto', target: 'plen-msg-resultado' },
    { id: 'e-pede-cond', source: 'plen-msg-pede-gasto', target: 'plen-cond-gasto' }, // volta para condição
    { id: 'e-resultado-nome', source: 'plen-msg-resultado', target: 'plen-msg-pede-nome' },
    { id: 'e-nome-ia', source: 'plen-msg-pede-nome', target: 'plen-ia-nome' },
    { id: 'e-ia-email', source: 'plen-ia-nome', target: 'plen-msg-pede-email' },
    { id: 'e-email-cond', source: 'plen-msg-pede-email', target: 'plen-cond-email' },
    { id: 'e-cond-codigo', source: 'plen-cond-email', target: 'plen-msg-codigo', sourceHandle: 'sim' },
    { id: 'e-cond-invalido', source: 'plen-cond-email', target: 'plen-msg-email-invalido', sourceHandle: 'nao' },
    { id: 'e-codigo-tutorial', source: 'plen-msg-codigo', target: 'plen-tutorial' },
    { id: 'e-invalido-email', source: 'plen-msg-email-invalido', target: 'plen-msg-pede-email' },
    { id: 'e-tutorial-ativo', source: 'plen-tutorial', target: 'plen-estado-ativo' },
    { id: 'e-ativo-ia', source: 'plen-estado-ativo', target: 'plen-ia-regras' },
    { id: 'e-ia-menu', source: 'plen-ia-regras', target: 'plen-menu-global' },
    // Menu: 6 opções (ordem das conexões = opção 1, 2, 3, 4, 5, 6)
    { id: 'e-menu-1', source: 'plen-menu-global', target: 'plen-delay-humano' },
    { id: 'e-menu-2', source: 'plen-menu-global', target: 'plen-msg-como-funciona' },
    { id: 'e-menu-3', source: 'plen-menu-global', target: 'plen-msg-assinatura' },
    { id: 'e-menu-4', source: 'plen-menu-global', target: 'plen-msg-premium' },
    { id: 'e-menu-5', source: 'plen-menu-global', target: 'plen-msg-indique' },
    { id: 'e-menu-6', source: 'plen-menu-global', target: 'plen-msg-saldo' },
    { id: 'e-delay-humano', source: 'plen-delay-humano', target: 'plen-msg-falar-humano' },
    { id: 'e-falar-fim', source: 'plen-msg-falar-humano', target: 'plen-fim-1' },
    { id: 'e-como-fim', source: 'plen-msg-como-funciona', target: 'plen-fim-2' },
    { id: 'e-assin-fim', source: 'plen-msg-assinatura', target: 'plen-fim-3' },
    { id: 'e-prem-fim', source: 'plen-msg-premium', target: 'plen-fim-4' },
    { id: 'e-indique-fim', source: 'plen-msg-indique', target: 'plen-fim-5' },
    { id: 'e-saldo-fim', source: 'plen-msg-saldo', target: 'plen-fim-6' },
    // Regras e reengajamento (conectar ao fluxo conforme desejado; aqui soltos)
    { id: 'e-plano-sim', source: 'plen-cond-plano', target: 'plen-msg-upgrade', sourceHandle: 'sim' },
    { id: 'e-plano-nao', source: 'plen-cond-plano', target: 'plen-lembretes', sourceHandle: 'nao' },
    { id: 'e-upgrade-fim', source: 'plen-msg-upgrade', target: 'plen-fim-7' },
    { id: 'e-lembretes-fim', source: 'plen-lembretes', target: 'plen-fim-8' },
    { id: 'e-reeng-fim', source: 'plen-msg-reengajamento', target: 'plen-fim-9' },
  ]

  return { nodes, edges }
}
