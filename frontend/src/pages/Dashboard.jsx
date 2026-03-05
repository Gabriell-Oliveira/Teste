import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import PostIt from '../components/PostIt'
import Navbar from '../components/Navbar'
import './Dashboard.css'

// ─────────────────────────────────────────────
// STATUS_CONFIG — exportado para outros arquivos
// ─────────────────────────────────────────────
export const STATUS_CONFIG = {
  pendente:  { cor: '#fef08a', label: 'Pendente',  emoji: '🟡' },
  fazendo:   { cor: '#93c5fd', label: 'Fazendo',   emoji: '🔵' },
  concluido: { cor: '#86efac', label: 'Concluído', emoji: '🟢' },
  atrasado:  { cor: '#fca5a5', label: 'Atrasado',  emoji: '🔴' },
}

// Ordem linear das etapas (atrasado é tratado separado)
export const ETAPAS = ['pendente', 'fazendo', 'concluido']

function verificarAtraso(pedido) {
  if (pedido.status === 'concluido') return pedido
  if (pedido.dataEntrega && new Date(pedido.dataEntrega) < new Date()) {
    return { ...pedido, status: 'atrasado' }
  }
  return pedido
}

export default function Dashboard() {
  const [pedidos, setPedidos] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  const carregarPedidos = useCallback(async () => {
    try {
      const res = await api.get('/pedidos')

      const processados = res.data.map(verificarAtraso)

      // Persiste no backend os que viraram "atrasado" automaticamente
      processados.forEach((p, i) => {
        if (p.status === 'atrasado' && res.data[i].status !== 'atrasado') {
          api.put(`/pedidos/${p.id}`, { status: 'atrasado' })
        }
      })

      // Ordena: urgentes primeiro, depois por data de entrega
      processados.sort((a, b) => {
        if (a.prioridade && !b.prioridade) return -1
        if (!a.prioridade && b.prioridade) return 1
        if (!a.dataEntrega) return 1
        if (!b.dataEntrega) return -1
        return new Date(a.dataEntrega) - new Date(b.dataEntrega)
      })

      setPedidos(processados)
    } finally {
      setCarregando(false)
    }
  }, [])

  // Carrega ao montar e re-verifica a cada minuto
  useEffect(() => {
    carregarPedidos()
    const intervalo = setInterval(carregarPedidos, 60_000)
    return () => clearInterval(intervalo)
  }, [carregarPedidos])

  async function atualizarStatus(id, novoStatus) {
    await api.put(`/pedidos/${id}`, { status: novoStatus })
    carregarPedidos()
  }

  // FIX: conta direto do array local — não usa .filter inline no JSX
  function contar(status) {
    return pedidos.filter(p => p.status === status).length
  }

  const pedidosFiltrados = filtroStatus === 'todos'
    ? pedidos
    : pedidos.filter(p => p.status === filtroStatus)

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-content">

        <div className="dashboard-header">
          <h1>📋 Mural de Pedidos</h1>
          <button className="btn-novo" onClick={() => navigate('/novo-pedido')}>
            + Novo Pedido
          </button>
        </div>

        {/* Filtros */}
        <div className="filtros">
          <button
            className={filtroStatus === 'todos' ? 'ativo' : ''}
            onClick={() => setFiltroStatus('todos')}
          >
            Todos ({pedidos.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <button
              key={key}
              className={filtroStatus === key ? 'ativo' : ''}
              style={filtroStatus === key ? { background: val.cor, borderColor: 'transparent' } : {}}
              onClick={() => setFiltroStatus(key)}
            >
              {val.emoji} {val.label} ({contar(key)})
            </button>
          ))}
        </div>

        {/* Grid de Post-its */}
        {carregando ? (
          <div className="carregando">Carregando pedidos...</div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="vazio">
            <p>
              Nenhum pedido{' '}
              {filtroStatus !== 'todos' ? STATUS_CONFIG[filtroStatus]?.label.toLowerCase() : ''}
              {' '}por aqui!
            </p>
            <button onClick={() => navigate('/novo-pedido')}>Criar primeiro pedido</button>
          </div>
        ) : (
          <div className="postits-grid">
            {pedidosFiltrados.map(pedido => (
              <PostIt
                key={pedido._id}
                pedido={pedido}
                onAtualizarStatus={atualizarStatus}
                onEditar={() => navigate(`/editar-pedido/${pedido._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
