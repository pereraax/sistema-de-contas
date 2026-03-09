'use client'

import { useState, useEffect } from 'react'
import type { Node } from '@xyflow/react'
import type { FlowNodeData, FlowNodeType } from './FlowNode'

const VARIABLES = ['{nome}', '{telefone}', '{valor}', '{categoria}', '{dashboardUrl}']

export function ConfigPanel({
  node,
  onUpdate,
  onRemove,
  onClose,
  onMessage,
}: {
  node: Node<FlowNodeData> | null
  onUpdate: (nodeId: string, data: Partial<FlowNodeData>) => void
  onRemove?: (nodeId: string) => void
  onClose: () => void
  onMessage?: (message: string, type: 'success' | 'error') => void
}) {
  const [label, setLabel] = useState('')
  const [texto, setTexto] = useState('')
  const [delayMin, setDelayMin] = useState(0)
  const [delayMax, setDelayMax] = useState(5)
  const [condicaoCampo, setCondicaoCampo] = useState('mensagem_contem')
  const [condicaoValor, setCondicaoValor] = useState('')
  const [inicioTipo, setInicioTipo] = useState('mensagem_recebida')
  const [frasesGatilho, setFrasesGatilho] = useState('')
  const [menuIntro, setMenuIntro] = useState('')
  const [menuOpcoes, setMenuOpcoes] = useState('')
  const [iaPrompt, setIaPrompt] = useState('')
  const [iaGenerating, setIaGenerating] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookMetodo, setWebhookMetodo] = useState('POST')
  const [lembreteDescricao, setLembreteDescricao] = useState('')
  const [lembreteDias, setLembreteDias] = useState('')
  const [registrarMsgConfirmacao, setRegistrarMsgConfirmacao] = useState('')
  const [comandosAoEnviar, setComandosAoEnviar] = useState('')
  type BotaoConfig = { titulo: string; link: string }
  const [botoes, setBotoes] = useState<BotaoConfig[]>([])

  useEffect(() => {
    if (!node?.data) return
    setLabel(node.data.label || '')
    setTexto((node.data.config?.texto as string) || '')
    setDelayMin((node.data.config?.delayMin as number) ?? 0)
    setDelayMax((node.data.config?.delayMax as number) ?? 5)
    setCondicaoCampo((node.data.config?.condicaoCampo as string) || 'mensagem_contem')
    setCondicaoValor((node.data.config?.condicaoValor as string) || '')
    setInicioTipo((node.data.config?.inicioTipo as string) || 'mensagem_recebida')
    const fg = node.data.config?.frasesGatilho
    const frasesArr = Array.isArray(fg) ? (fg as string[]) : typeof fg === 'string' ? [fg] : []
    setFrasesGatilho(frasesArr.map((f) => (f && f.trim() ? `(${f.trim()})` : '')).filter(Boolean).join('\n'))
    setMenuIntro((node.data.config?.menuIntro as string) || '')
    setMenuOpcoes((node.data.config?.menuOpcoes as string) || '')
    setIaPrompt((node.data.config?.iaPrompt as string) || '')
    setWebhookUrl((node.data.config?.webhookUrl as string) || '')
    setWebhookMetodo((node.data.config?.webhookMetodo as string) || 'POST')
    setLembreteDescricao((node.data.config?.lembreteDescricao as string) || '')
    setLembreteDias((node.data.config?.lembreteDias as string) || '')
    setRegistrarMsgConfirmacao((node.data.config?.registrarMsgConfirmacao as string) || 'Registrado com sucesso!')
    const cmd = node.data.config?.comandosAoEnviar
    setComandosAoEnviar(Array.isArray(cmd) ? cmd.join('\n') : (typeof cmd === 'string' ? cmd : ''))
    const bt = node.data.config?.botoes
    const botoesArr = Array.isArray(bt)
      ? (bt as Array<{ titulo?: string; link?: string }>).map((b) => ({
          titulo: (b?.titulo ?? '').trim() || '',
          link: (b?.link ?? '').trim() || '',
        }))
      : []
    setBotoes(botoesArr)
  }, [node?.id, node?.data])

  if (!node) {
    return (
      <aside className="w-80 shrink-0 bg-zinc-900/95 border-l border-white/10 flex flex-col items-center justify-center text-zinc-500 p-8">
        <p className="text-sm text-center">Clique em um bloco para editar</p>
      </aside>
    )
  }

  const nodeType = node.data?.nodeType as FlowNodeType
  const handleSave = () => {
    const config: Record<string, unknown> = { ...(node.data?.config || {}) }
    if (nodeType === 'mensagem') {
      config.texto = texto
      const cmds = comandosAoEnviar.split('\n').map((s) => s.trim()).filter(Boolean)
      config.comandosAoEnviar = cmds.length > 0 ? cmds : undefined
      const botoesValidos = botoes.filter((b) => (b.titulo ?? '').trim().length > 0)
      config.botoes = botoesValidos.length > 0 ? botoesValidos.map((b) => ({ titulo: b.titulo.trim(), link: (b.link ?? '').trim() || undefined })) : undefined
      config.preview = texto.slice(0, 50)
    }
    if (nodeType === 'delay') {
      config.delayMin = delayMin
      config.delayMax = delayMax
      config.preview = `${delayMin}-${delayMax}s`
    }
    if (nodeType === 'condicao') {
      config.condicaoCampo = condicaoCampo
      config.condicaoValor = condicaoValor
      config.preview = `${condicaoCampo} = ${condicaoValor}`
    }
    if (nodeType === 'inicio') {
      config.inicioTipo = inicioTipo
      const frases = frasesGatilho
        .split('\n')
        .map((line) => {
          const t = line.trim()
          const m = t.match(/^\((.+)\)\s*$/)
          return m ? m[1].trim() : t
        })
        .filter(Boolean)
      config.frasesGatilho = frases.length > 0 ? frases : undefined
      config.preview = frases.length > 0 ? `${inicioTipo} (${frases.length} frases)` : inicioTipo
    }
    if (nodeType === 'menu') {
      config.menuIntro = menuIntro
      config.menuOpcoes = menuOpcoes
      const lines = menuOpcoes.split('\n').map((s) => s.trim()).filter(Boolean)
      config.preview = lines.length ? `${lines.length} opções` : 'Menu'
    }
    if (nodeType === 'ia') {
      config.iaPrompt = iaPrompt
      config.preview = iaPrompt.slice(0, 40) || 'Resposta com IA'
    }
    if (nodeType === 'webhook') {
      config.webhookUrl = webhookUrl
      config.webhookMetodo = webhookMetodo
      config.preview = webhookUrl ? `${webhookMetodo} ${webhookUrl.slice(0, 30)}…` : 'Webhook'
    }
    if (nodeType === 'lembrete') {
      config.lembreteDescricao = lembreteDescricao
      config.lembreteDias = lembreteDias
      config.preview = lembreteDescricao.slice(0, 30) || 'Lembrete'
    }
    if (nodeType === 'registrar_gasto' || nodeType === 'registrar_receita') {
      config.registrarMsgConfirmacao = registrarMsgConfirmacao
      config.preview = registrarMsgConfirmacao.slice(0, 30) || (nodeType === 'registrar_gasto' ? 'Gasto' : 'Receita')
    }
    onUpdate(node.id, { label: label || node.data?.label, config })
  }

  const help = (title: string, children: React.ReactNode) => (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-zinc-400 space-y-1">
      <p className="font-medium text-zinc-300">{title}</p>
      {children}
    </div>
  )

  const handleRemove = () => {
    if (onRemove && node?.id) {
      onRemove(node.id)
      onClose()
    }
  }

  return (
    <aside className="w-80 shrink-0 bg-zinc-900/95 border-l border-white/10 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Configurar bloco</h3>
        <div className="flex items-center gap-1">
          {onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1.5 rounded-lg text-xs font-medium"
              aria-label="Remover bloco"
              title="Remover bloco"
            >
              Remover
            </button>
          )}
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded" aria-label="Fechar">×</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Rótulo (nome do bloco)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSave}
            className="w-full rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm"
            placeholder="Ex.: Boas-vindas"
          />
        </div>

        {nodeType === 'mensagem' && (
          <>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Texto da mensagem</label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onBlur={handleSave}
                className="w-full min-h-[120px] rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm resize-y"
                placeholder="O que o bot deve enviar. Use {nome} para o nome do contato."
              />
              <p className="text-xs text-zinc-500 mt-1">Variáveis: {VARIABLES.join(', ')}. Use R$&#123;valor&#125; para valor em reais. Categoria e valor vêm do que o usuário escreveu (ex.: &quot;212 carro&quot;).</p>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Botões (opcional)</label>
              <p className="text-xs text-zinc-500 mb-2">Título obrigatório. Link opcional — se preenchido, o botão abre o link; senão, é botão de resposta.</p>
              {botoes.map((b, i) => (
                <div key={i} className="flex gap-2 mb-2 items-start">
                  <input
                    type="text"
                    value={b.titulo}
                    onChange={(e) => {
                      const next = [...botoes]
                      next[i] = { ...next[i], titulo: e.target.value }
                      setBotoes(next)
                    }}
                    onBlur={handleSave}
                    className="flex-1 min-w-0 rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm"
                    placeholder="Título do botão"
                  />
                  <input
                    type="text"
                    value={b.link}
                    onChange={(e) => {
                      const next = [...botoes]
                      next[i] = { ...next[i], link: e.target.value }
                      setBotoes(next)
                    }}
                    onBlur={handleSave}
                    className="flex-1 min-w-0 rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm font-mono"
                    placeholder="Link (opcional)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBotoes((prev) => prev.filter((_, j) => j !== i))
                      setTimeout(handleSave, 0)
                    }}
                    className="shrink-0 rounded-lg bg-red-500/20 text-red-400 px-2 py-2 text-sm hover:bg-red-500/30"
                    title="Remover botão"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {botoes.length < 3 && (
                <button
                  type="button"
                  onClick={() => {
                    setBotoes((prev) => [...prev, { titulo: '', link: '' }])
                  }}
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  + Adicionar botão
                </button>
              )}
              <p className="text-xs text-zinc-500 mt-1">Máx. 3 botões. Com link = abre URL; sem link = ao clicar envia o título como mensagem.</p>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Comandos ao enviar (opcional)</label>
              <textarea
                value={comandosAoEnviar}
                onChange={(e) => setComandosAoEnviar(e.target.value)}
                onBlur={handleSave}
                className="w-full min-h-[70px] rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm resize-y font-mono"
                placeholder={'Uma URL por linha. Ao enviar esta mensagem, o sistema chama cada URL.\nEx.: https://api.seudominio.com/webhook/msg-enviada'}
              />
              <p className="text-xs text-zinc-500 mt-1">Sempre que esta mensagem for enviada, as URLs acima são chamadas (GET). Uma por linha.</p>
            </div>
          </>
        )}

        {nodeType === 'inicio' && (
          <>
            {help('Bloco Início', <>Define <strong>quando</strong> o fluxo começa (gatilho). As respostas do bot ficam nos blocos <strong>Mensagem</strong> conectados depois.</>)}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Gatilho</label>
              <select
                value={inicioTipo}
                onChange={(e) => { setInicioTipo(e.target.value); setTimeout(handleSave, 0) }}
                className="w-full rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm"
              >
                <option value="mensagem_recebida">Qualquer mensagem</option>
                <option value="novo_lead">Só novo lead (primeira mensagem)</option>
                <option value="palavra_especifica">Mensagem contém uma destas frases</option>
                <option value="comando_menu">Comando &quot;menu&quot;</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Frases que disparam (uma por linha, entre parênteses)</label>
              <textarea
                value={frasesGatilho}
                onChange={(e) => setFrasesGatilho(e.target.value)}
                onBlur={handleSave}
                className="w-full min-h-[90px] rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm resize-y font-mono"
                placeholder={'(oi)\n(olá)\n(Olá! Quero utilizar a Plenipay.)'}
              />
              <p className="text-xs text-zinc-500 mt-1">Use (frase) em cada linha. O sistema reconhece o texto dentro dos parênteses. Vazio = qualquer mensagem.</p>
            </div>
          </>
        )}

        {nodeType === 'menu' && (
          <>
            <p className="text-xs text-zinc-400 mb-2 rounded bg-white/5 px-2 py-1.5">
              <strong>Como editar o menu:</strong> preencha o texto acima das opções e liste cada opção em uma linha. Conecte as saídas do nó na ordem (1ª conexão = 1ª opção). No WhatsApp saem como botões na mesma bolha.
            </p>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Texto antes das opções</label>
              <textarea
                value={menuIntro}
                onChange={(e) => setMenuIntro(e.target.value)}
                onBlur={handleSave}
                className="w-full min-h-[60px] rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm resize-y"
                placeholder="Olá! Sempre que precisar, envie MENU. Escolha uma opção:"
              />
              <p className="text-xs text-zinc-500 mt-1">Use {'{nome}'} para o nome do lead. Se vazio, aparece texto padrão explicando que pode enviar MENU.</p>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Botões / opções (uma por linha)</label>
              <textarea
                value={menuOpcoes}
                onChange={(e) => setMenuOpcoes(e.target.value)}
                onBlur={handleSave}
                className="w-full min-h-[140px] rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm resize-y font-mono"
                placeholder={'Falar com humano\nComo funciona\nAssinatura R$9,90\nFunções premium\nIndique e ganhe\nTotal / saldo'}
              />
              <p className="text-xs text-zinc-500 mt-1">A 1ª conexão saindo do nó = 1ª opção, 2ª = 2ª opção, etc. (até 6).</p>
              <p className="text-xs text-emerald-400/90 mt-2">No WhatsApp: uma bolha com seu texto + até 3 botões; se tiver mais opções, segunda bolha com mais 3 botões.</p>
            </div>
          </>
        )}

        {nodeType === 'condicao' && (
          <>
            {help('Condição', <>Conecte <strong>duas saídas</strong>: 1ª = quando der Sim, 2ª = quando der Não.</>)}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">O que verificar</label>
              <select
                value={condicaoCampo}
                onChange={(e) => setCondicaoCampo(e.target.value)}
                onBlur={handleSave}
                className="w-full rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm"
              >
                <option value="mensagem_contem">Mensagem contém o texto abaixo</option>
                <option value="mensagem_igual">Mensagem é exatamente</option>
                <option value="eh_numero">Mensagem é um número</option>
                <option value="tem_valor">Mensagem parece gasto/receita (tem valor)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Valor (texto ou número)</label>
              <input
                type="text"
                value={condicaoValor}
                onChange={(e) => setCondicaoValor(e.target.value)}
                onBlur={handleSave}
                className="w-full rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm"
                placeholder="Ex.: saldo ou 1"
              />
            </div>
          </>
        )}

        {nodeType === 'delay' && (
          <>
            {help('Delay', <>O bot espera esse tempo (em segundos) antes de enviar a próxima mensagem.</>)}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Mínimo (seg)</label>
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={delayMin}
                  onChange={(e) => setDelayMin(Number(e.target.value) || 0)}
                  onBlur={handleSave}
                  className="w-full rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Máximo (seg)</label>
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={delayMax}
                  onChange={(e) => setDelayMax(Number(e.target.value) || 0)}
                  onBlur={handleSave}
                  className="w-full rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500">Tempo aleatório entre min e max (resposta mais natural).</p>
          </>
        )}

        {nodeType === 'ia' && (
          <>
            {help('IA', <>A Plen usa inteligência artificial para responder à última mensagem do contato. Descreva abaixo o que a IA deve fazer e use o botão para gerar a instrução.</>)}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">O que a IA deve fazer (seu prompt)</label>
              <textarea
                value={iaPrompt}
                onChange={(e) => setIaPrompt(e.target.value)}
                onBlur={handleSave}
                className="w-full min-h-[100px] rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm resize-y"
                placeholder="Ex.: Quando o usuário disser olá, oi ou Quero utilizar a Plenipay, identifique e dê boas-vindas."
                disabled={iaGenerating}
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                const prompt = iaPrompt.trim()
                if (!prompt) {
                  onMessage?.('Digite o que a IA deve fazer e clique no botão.', 'error')
                  return
                }
                setIaGenerating(true)
                try {
                  const res = await fetch('/api/admin/plen/chatbot-flows/generate-ia-instruction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt }),
                  })
                  const data = await res.json()
                  if (data.instruction) {
                    setIaPrompt(data.instruction)
                    onUpdate(node.id, {
                      label: node.data?.label,
                      config: { ...(node.data?.config || {}), iaPrompt: data.instruction, preview: data.instruction.slice(0, 40) || 'Resposta com IA' },
                    })
                    onMessage?.('Comando criado! Revise a instrução e salve o fluxo.', 'success')
                  } else {
                    onMessage?.(data.error || 'Não foi possível gerar o comando.', 'error')
                  }
                } catch {
                  onMessage?.('Erro ao gerar. Tente de novo.', 'error')
                } finally {
                  setIaGenerating(false)
                }
              }}
              disabled={iaGenerating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white py-2.5 px-4 text-sm font-medium hover:bg-[#25D366]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {iaGenerating ? 'Gerando…' : 'Criar comando a partir do prompt'}
            </button>
            <p className="text-xs text-zinc-500">A IA analisa seu texto e gera a instrução para a automação. Deixe vazio no campo para usar o comportamento padrão.</p>
          </>
        )}

        {(nodeType === 'registrar_gasto' || nodeType === 'registrar_receita') && (
          <>
            {help(nodeType === 'registrar_gasto' ? 'Registrar gasto' : 'Registrar receita', <>Interpreta a mensagem do contato (ex.: &quot;café 12&quot;) e registra como gasto ou receita. Depois envia a confirmação abaixo.</>)}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Mensagem de confirmação</label>
              <input
                type="text"
                value={registrarMsgConfirmacao}
                onChange={(e) => setRegistrarMsgConfirmacao(e.target.value)}
                onBlur={handleSave}
                className="w-full rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm"
                placeholder="Registrado! Use {nome} e {valor}"
              />
            </div>
          </>
        )}

        {nodeType === 'lembrete' && (
          <>
            {help('Lembrete', <>Cria um lembrete para o contato. Use variáveis na descrição.</>)}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Descrição do lembrete</label>
              <input
                type="text"
                value={lembreteDescricao}
                onChange={(e) => setLembreteDescricao(e.target.value)}
                onBlur={handleSave}
                className="w-full rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm"
                placeholder="Ex.: Pagar cartão"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Dias a partir de hoje (opcional)</label>
              <input
                type="text"
                value={lembreteDias}
                onChange={(e) => setLembreteDias(e.target.value)}
                onBlur={handleSave}
                className="w-full rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm"
                placeholder="Ex.: 7 ou 15"
              />
              <p className="text-xs text-zinc-500 mt-1">Número de dias. Vazio = lembrete genérico.</p>
            </div>
          </>
        )}

        {nodeType === 'webhook' && (
          <>
            {help('Webhook', <>Chama uma URL externa (GET ou POST) com dados do contato e da mensagem. Depois segue para o próximo bloco.</>)}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">URL</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                onBlur={handleSave}
                className="w-full rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm font-mono"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Método</label>
              <select
                value={webhookMetodo}
                onChange={(e) => { setWebhookMetodo(e.target.value); handleSave() }}
                className="w-full rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>
          </>
        )}

        {nodeType === 'fim' && (
          help('Fim', <>Encerra este fluxo para o contato. Na próxima mensagem ele pode disparar o Início de novo (se bater no gatilho).</>)
        )}
      </div>
    </aside>
  )
}
