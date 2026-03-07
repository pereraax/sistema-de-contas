'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  Panel,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Bot, Save, FolderOpen, Trash2, Unlink, FileStack } from 'lucide-react'
import { FlowNode, type FlowNodeData, type FlowNodeType } from '@/components/plen/chatbot-builder/FlowNode'
import { Sidebar } from '@/components/plen/chatbot-builder/Sidebar'
import { ConfigPanel } from '@/components/plen/chatbot-builder/ConfigPanel'
import { getDefaultPlenFlow, DEFAULT_FLOW_NAME } from '@/lib/plen/chatbot-default-flow'

const nodeTypes = { flowNode: FlowNode }

const initialNodes: Node<FlowNodeData>[] = [
  {
    id: 'inicio-1',
    type: 'flowNode',
    position: { x: 280, y: 40 },
    data: { label: 'Início', nodeType: 'inicio', config: { inicioTipo: 'mensagem_recebida' } },
  },
]
const initialEdges: Edge[] = []

export default function ChatbotBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node<FlowNodeData> | null>(null)
  const [flowName, setFlowName] = useState('Novo fluxo')
  const [flowId, setFlowId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: Node<FlowNodeData> } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 3500)
  }, [])

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
  }, [])

  // Ao montar: carregar fluxo ativo ou montar fluxo padrão
  useEffect(() => {
    if (initialLoadDone) return
    setInitialLoadDone(true)
    fetch('/api/admin/plen/chatbot-flows?ativo=true')
      .then((r) => r.json())
      .then((data) => {
        const flow = data?.flow
        if (flow?.estrutura_json?.nodes?.length) {
          setFlowId(flow.id)
          setFlowName(flow.nome || 'Novo fluxo')
          setNodes(flow.estrutura_json.nodes)
          setEdges(flow.estrutura_json.edges || [])
        } else {
          const { nodes: defaultNodes, edges: defaultEdges } = getDefaultPlenFlow()
          setFlowId(null)
          setFlowName(DEFAULT_FLOW_NAME)
          setNodes(defaultNodes as Node<FlowNodeData>[])
          setEdges(defaultEdges)
        }
      })
      .catch(() => {
        const { nodes: defaultNodes, edges: defaultEdges } = getDefaultPlenFlow()
        setFlowName(DEFAULT_FLOW_NAME)
        setNodes(defaultNodes as Node<FlowNodeData>[])
        setEdges(defaultEdges)
      })
  }, [initialLoadDone, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const json = event.dataTransfer.getData('application/reactflow')
      if (!json) return
      const { type, label } = JSON.parse(json) as { type: FlowNodeType; label: string }
      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!bounds) return
      const position = {
        x: event.clientX - bounds.left - 80,
        y: event.clientY - bounds.top - 20,
      }
      const id = `${type}-${Date.now()}`
      const newNode: Node<FlowNodeData> = {
        id,
        type: 'flowNode',
        position,
        data: { label, nodeType: type, config: {} },
      }
      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onNodeClick = useCallback((_e: React.MouseEvent, node: Node<FlowNodeData>) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setContextMenu(null)
  }, [])

  const onUpdateNode = useCallback(
    (nodeId: string, data: Partial<FlowNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
      )
      setSelectedNode((prev) =>
        prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev
      )
    },
    [setNodes]
  )

  const onRemoveNode = useCallback(
    (nodeId: string) => {
      if (!confirm('Remover este bloco? As conexões ligadas a ele serão removidas.')) return
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
      setSelectedNode((prev) => (prev?.id === nodeId ? null : prev))
      setContextMenu(null)
    },
    [setNodes, setEdges]
  )

  const onDisconnectNode = useCallback(
    (nodeId: string) => {
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
      setContextMenu(null)
    },
    [setEdges]
  )

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node<FlowNodeData>) => {
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY, node })
  }, [])

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu(null)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const body: { nome: string; estrutura_json: { nodes: Node<FlowNodeData>[]; edges: Edge[] }; id?: string } = {
        nome: flowName,
        estrutura_json: { nodes, edges },
      }
      if (flowId) body.id = flowId
      const res = await fetch('/api/admin/plen/chatbot-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data?.id) {
        setFlowId(data.id)
        setFlowName(data.nome || flowName)
        showToast('Fluxo salvo com sucesso.')
      } else {
        showToast(data?.error || 'Erro ao salvar.', 'error')
      }
    } finally {
      setSaving(false)
    }
  }, [flowName, flowId, nodes, edges])

  const handleCreateDefaultFlow = useCallback(() => {
    if (!confirm('Substituir o fluxo atual pelo Fluxo principal Plen? O que está no canvas será perdido.')) return
    const { nodes: defaultNodes, edges: defaultEdges } = getDefaultPlenFlow()
    setFlowId(null)
    setFlowName(DEFAULT_FLOW_NAME)
    setNodes(defaultNodes as Node<FlowNodeData>[])
    setEdges(defaultEdges)
    setSelectedNode(null)
    showToast('Fluxo padrão carregado. Edite e salve para ativar.')
  }, [setNodes, setEdges, showToast])

  const handleLoadList = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/plen/chatbot-flows')
      .then((r) => r.json())
      .then((data) => {
        const flows = data?.flows ?? []
        if (flows.length === 0) {
          alert('Nenhum fluxo salvo ainda.')
          return
        }
        const ativo = flows.find((f: { ativo?: boolean }) => f.ativo)
        const toLoad = ativo ?? flows[0]
        return fetch(`/api/admin/plen/chatbot-flows?id=${toLoad.id}`)
          .then((r2) => r2.json())
          .then((d2) => {
            const flow = d2?.flow
            if (flow?.estrutura_json?.nodes?.length) {
              setFlowId(flow.id)
              setFlowName(flow.nome || 'Novo fluxo')
              setNodes(flow.estrutura_json.nodes)
              setEdges(flow.estrutura_json.edges || [])
              showToast(`Carregado: ${flow.nome}`)
            } else {
              alert('Fluxo sem nós. Edite e salve no canvas.')
            }
          })
      })
      .catch(() => alert('Erro ao carregar.'))
      .finally(() => setLoading(false))
  }, [setNodes, setEdges, showToast])

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-white/10">
      <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/95">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Chatbot Builder</h1>
            <p className="text-xs text-zinc-500">Construtor visual da assistente Plen</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm w-48"
            placeholder="Nome do fluxo"
          />
          <button
            type="button"
            onClick={handleCreateDefaultFlow}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 text-sm font-medium"
          >
            <FileStack size={18} />
            Fluxo padrão
          </button>
          <button
            type="button"
            onClick={handleLoadList}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 text-sm font-medium"
          >
            <FolderOpen size={18} />
            Carregar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white hover:bg-[#25D366]/90 text-sm font-medium disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Salvando…' : 'Salvar fluxo'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <Sidebar onDragStart={() => {}} />
        <div ref={reactFlowWrapper} className="flex-1 flex flex-col">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange as (changes: NodeChange[]) => void}
            onEdgesChange={onEdgesChange as (changes: EdgeChange[]) => void}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            onPaneContextMenu={onPaneContextMenu}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="bg-zinc-950"
            colorMode="dark"
            defaultEdgeOptions={{ animated: true }}
          >
            <Background color="#333" gap={16} size={0.5} />
            <Controls className="!bg-zinc-800 !border-white/10 !rounded-xl" />
            <Panel position="top-left" className="text-xs text-zinc-500 m-2">
              Arraste blocos da esquerda e conecte as setas
            </Panel>
          </ReactFlow>
        </div>
        <ConfigPanel
          node={selectedNode}
          onUpdate={onUpdateNode}
          onRemove={onRemoveNode}
          onClose={() => setSelectedNode(null)}
          onMessage={showToast}
        />
      </div>

      {/* Menu de contexto (botão direito no bloco) */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 min-w-[180px] rounded-xl border border-white/20 bg-zinc-800 py-1 shadow-xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              onClick={() => {
                onDisconnectNode(contextMenu.node.id)
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
            >
              <Unlink size={16} className="text-zinc-400" />
              Desconectar
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Remover este bloco? As conexões serão removidas.')) {
                  onRemoveNode(contextMenu.node.id)
                }
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/20"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        </>
      )}

      {/* Toast no canto da tela */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{
            backgroundColor: toast.type === 'success' ? 'rgb(34 197 94 / 0.95)' : 'rgb(239 68 68 / 0.95)',
            borderColor: toast.type === 'success' ? 'rgb(34 197 94)' : 'rgb(239 68 68)',
            color: '#fff',
          }}
        >
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  )
}
