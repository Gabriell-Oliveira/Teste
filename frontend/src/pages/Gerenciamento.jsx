import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import { STATUS_CONFIG } from './Dashboard'
import './Gerenciamento.css'

function formatarData(dataISO) {
  if (!dataISO) return '—'
  return new Date(dataISO).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function Gerenciamento() {
  const [pedidos, setPedidos] = useState([])
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const res = await api.get('/pedidos')
    // MongoDB usa _id — ordena por createdAt que vem do Mongoose
    setPedidos(res.data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)))
  }

  async function excluir(id) {
    if (!confirm('Excluir este pedido?')) return
    await api.delete(`/pedidos/${id}`)
    carregar()
  }

  const filtrados = pedidos.filter(p =>
    p.nomeCliente?.toLowerCase().includes(busca.toLowerCase()) ||
    p.telefone?.includes(busca)
  )

  return (
    <div className="gerenciamento-page">
      <Navbar />
      <div className="gerenciamento-content">
        <div className="ger-header">
          <h1>📁 Gerenciamento de Pedidos</h1>
          <button className="btn-novo" onClick={() => navigate('/novo-pedido')}>+ Novo Pedido</button>
        </div>

        <input
          className="busca"
          placeholder="🔍 Buscar por nome ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />

        <div className="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Peças</th>
                <th>Serviços</th>
                <th>Valor</th>
                <th>Entrega</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} style={{textAlign:'center', padding:'2rem', color:'#888'}}>Nenhum pedido encontrado</td></tr>
              ) : filtrados.map(p => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pendente
                return (
                  <tr key={p._id} className={p.prioridade ? 'prioridade' : ''}>
                    <td>
                      <strong>{p.nomeCliente}</strong>
                      {p.prioridade && <span className="badge-urgente">⚡</span>}
                    </td>
                    <td>{p.telefone || '—'}</td>
                    <td style={{textAlign:'center'}}>{p.quantidadePecas}</td>
                    <td>
                      <div className="servicos-tags">
                        {(p.servicos || []).map((s,i) => <span key={i} className="tag">{s.nome}</span>)}
                        {(!p.servicos || p.servicos.length === 0) && '—'}
                      </div>
                    </td>
                    <td><strong>R$ {Number(p.valorTotal||0).toFixed(2)}</strong></td>
                    <td>{formatarData(p.dataEntrega)}</td>
                    <td>
                      <span className="status-badge" style={{background: cfg.cor}}>
                        {cfg.emoji} {cfg.label}
                      </span>
                    </td>
                    <td>
                      <div className="acoes">
                        <button onClick={() => navigate(`/editar-pedido/${p._id}`)}>✏️</button>
                        <button className="btn-excluir" onClick={() => excluir(p._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
