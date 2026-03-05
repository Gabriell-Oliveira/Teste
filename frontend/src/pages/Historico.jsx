import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './Historico.css'

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function Historico() {
  const [pedidos, setPedidos]         = useState([])
  const [busca, setBusca]             = useState('')
  const [periodo, setPeriodo]         = useState('todos')
  const [carregando, setCarregando]   = useState(true)
  const [modalCliente, setModalCliente] = useState(null)
  const [salvandoCliente, setSalvandoCliente] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    try {
      const res = await api.get('/pedidos', { params: { historico: 'true' } })
      // FIX: filtra pedidos com dados inválidos para não quebrar o map
      setPedidos(res.data.filter(p => p && p._id))
    } finally {
      setCarregando(false)
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir este pedido do histórico?')) return
    await api.delete(`/pedidos/${id}`)
    carregar()
  }

  async function tornarClienteRegular(pedido) {
    setSalvandoCliente(true)
    try {
      if (pedido.telefone) {
        const res = await api.get('/clientes', { params: { busca: pedido.telefone } })
        if (res.data.length > 0) {
          alert(`Esta cliente já está cadastrada como "${res.data[0].nome}"!`)
          setModalCliente(null)
          return
        }
      }
      await api.post('/clientes', {
        nome: pedido.nomeCliente || 'Sem nome',
        telefone: pedido.telefone || '',
      })
      alert(`✅ ${pedido.nomeCliente} adicionada às clientes regulares!`)
      setModalCliente(null)
    } finally {
      setSalvandoCliente(false)
    }
  }

  function filtrarPeriodo(p) {
    if (periodo === 'todos') return true
    const d = new Date(p.createdAt)
    const agora = new Date()
    if (periodo === 'semana') {
      const semana = new Date(); semana.setDate(agora.getDate() - 7)
      return d >= semana
    }
    if (periodo === 'mes') {
      return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear()
    }
    return true
  }

  const filtrados = pedidos
    .filter(filtrarPeriodo)
    .filter(p => (p.nomeCliente || '').toLowerCase().includes(busca.toLowerCase()))

  const totalFaturado = filtrados.reduce((a, p) => a + (p.valorTotal || 0), 0)

  return (
    <div className="historico-page">
      <Navbar />
      <div className="historico-content">
        <h1>📦 Histórico de Pedidos Entregues</h1>

        <div className="hist-filtros">
          <input className="busca-hist" placeholder="🔍 Buscar cliente..."
            value={busca} onChange={e => setBusca(e.target.value)} />
          <div className="periodo-btns">
            {[['todos','Todos'],['semana','Esta semana'],['mes','Este mês']].map(([v,l]) => (
              <button key={v} className={periodo === v ? 'ativo' : ''} onClick={() => setPeriodo(v)}>{l}</button>
            ))}
          </div>
        </div>

        {/* Resumo — FIX: <value> virou <strong> */}
        <div className="hist-resumo">
          <div className="resumo-stat">
            <strong className="stat-value">{filtrados.length}</strong>
            <span className="stat-label">pedidos entregues</span>
          </div>
          <div className="resumo-stat destaque">
            <strong className="stat-value">R$ {totalFaturado.toFixed(2)}</strong>
            <span className="stat-label">faturado no período</span>
          </div>
        </div>

        {carregando ? (
          <div className="carregando">Carregando histórico...</div>
        ) : filtrados.length === 0 ? (
          <div className="vazio-hist">Nenhum pedido entregue encontrado.</div>
        ) : (
          <div className="hist-tabela-container">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Peças</th>
                  <th>Serviços</th>
                  <th>Valor</th>
                  <th>Criado em</th>
                  <th>Visualizou link</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => (
                  <tr key={p._id}>
                    <td>
                      {/* FIX: || '—' para evitar null */}
                      <strong>{p.nomeCliente || '—'}</strong>
                      {p.telefone && <small style={{display:'block',color:'#888'}}>{p.telefone}</small>}
                    </td>
                    <td style={{textAlign:'center'}}>{p.quantidadePecas || 1}</td>
                    <td>
                      <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                        {(p.servicos || []).slice(0,3).map((s,i) => (
                          <span key={i} className="tag-hist">{s?.nome || '?'}</span>
                        ))}
                        {(p.servicos || []).length > 3 &&
                          <span className="tag-hist">+{p.servicos.length - 3}</span>}
                      </div>
                    </td>
                    <td><strong>R$ {Number(p.valorTotal || 0).toFixed(2)}</strong></td>
                    <td>{fmt(p.createdAt)}</td>
                    <td>
                      {p.rastreamento?.totalVisualizacoes > 0
                        ? <span className="badge-visto">👁️ Sim</span>
                        : <span className="badge-naovisto">Não</span>}
                    </td>
                    <td>
                      <div className="hist-acoes">
                        <button title="Editar" onClick={() => navigate(`/editar-pedido/${p._id}`)}>✏️</button>
                        <button title="Tornar cliente regular" onClick={() => setModalCliente(p)}>👤+</button>
                        <button title="Excluir" className="btn-excluir" onClick={() => excluir(p._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal tornar cliente regular */}
      {modalCliente && (
        <div className="modal-overlay" onClick={() => setModalCliente(null)}>
          <div className="modal-confirm" onClick={e => e.stopPropagation()}>
            <h3>👤 Tornar cliente regular?</h3>
            <p>Isso vai cadastrar <strong>{modalCliente.nomeCliente}</strong> na lista de clientes fixas
              {modalCliente.telefone && <> com o telefone <strong>{modalCliente.telefone}</strong></>}.
            </p>
            <p style={{fontSize:'0.85rem',color:'#888'}}>Você poderá adicionar medidas e notas depois na página de Clientes.</p>
            <div className="modal-confirm-btns">
              <button className="btn-cancelar" onClick={() => setModalCliente(null)}>Cancelar</button>
              <button className="btn-salvar" onClick={() => tornarClienteRegular(modalCliente)} disabled={salvandoCliente}>
                {salvandoCliente ? 'Salvando...' : '✅ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
