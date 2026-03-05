import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './Clientes.css'

export default function Clientes() {
  const [clientes, setClientes]   = useState([])
  const [busca, setBusca]         = useState('')
  const [selecionada, setSelecionada] = useState(null)  // cliente aberta no painel lateral
  const [detalhe, setDetalhe]     = useState(null)      // { cliente, pedidos, stats }
  const [modal, setModal]         = useState(false)     // modal de criar/editar
  const [form, setForm]           = useState(formVazio())
  const [salvando, setSalvando]   = useState(false)
  const navigate = useNavigate()

  function formVazio() {
    return {
      nome: '', telefone: '', endereco: '',
      medidas: { tamanho: '', altura: '', cintura: '', quadril: '', obs: '' },
      notasInternas: ''
    }
  }

  useEffect(() => { carregar() }, [])

  async function carregar(b = busca) {
    const res = await api.get('/clientes', { params: { busca: b } })
    setClientes(res.data)
  }

  async function abrirDetalhe(cliente) {
    setSelecionada(cliente._id)
    const res = await api.get(`/clientes/${cliente._id}`)
    setDetalhe(res.data)
  }

  function abrirModal(cliente = null) {
    if (cliente) {
      setForm({
        nome: cliente.nome || '',
        telefone: cliente.telefone || '',
        endereco: cliente.endereco || '',
        medidas: { ...formVazio().medidas, ...cliente.medidas },
        notasInternas: cliente.notasInternas || ''
      })
    } else {
      setForm(formVazio())
    }
    setModal(true)
  }

  async function salvar() {
    setSalvando(true)
    try {
      if (detalhe && selecionada) {
        await api.put(`/clientes/${selecionada}`, form)
      } else {
        await api.post('/clientes', form)
      }
      setModal(false)
      carregar()
      if (selecionada) {
        const res = await api.get(`/clientes/${selecionada}`)
        setDetalhe(res.data)
      }
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id) {
    if (!confirm('Remover esta cliente?')) return
    await api.delete(`/clientes/${id}`)
    setSelecionada(null)
    setDetalhe(null)
    carregar()
  }

  function setMedida(campo, valor) {
    setForm(f => ({ ...f, medidas: { ...f.medidas, [campo]: valor } }))
  }

  const STATUS_COR = {
    pendente: '#fef08a', fazendo: '#93c5fd',
    concluido: '#86efac', atrasado: '#fca5a5', entregue: '#d1d5db'
  }

  return (
    <div className="clientes-page">
      <Navbar />
      <div className="clientes-layout">

        {/* ── Coluna esquerda: lista ── */}
        <div className="clientes-lista">
          <div className="clientes-header">
            <h1>👥 Clientes</h1>
            <button className="btn-nova" onClick={() => { setDetalhe(null); setSelecionada(null); abrirModal() }}>
              + Nova Cliente
            </button>
          </div>

          <input
            className="busca-input"
            placeholder="🔍 Buscar por nome ou telefone..."
            value={busca}
            onChange={e => { setBusca(e.target.value); carregar(e.target.value) }}
          />

          <div className="clientes-cards">
            {clientes.length === 0 && (
              <div className="vazio">Nenhuma cliente cadastrada ainda.</div>
            )}
            {clientes.map(c => (
              <div
                key={c._id}
                className={`cliente-card ${selecionada === c._id ? 'ativo' : ''}`}
                onClick={() => abrirDetalhe(c)}
              >
                <div className="cliente-avatar">{c.nome[0].toUpperCase()}</div>
                <div className="cliente-info">
                  <strong>{c.nome}</strong>
                  <small>{c.telefone || 'Sem telefone'}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Coluna direita: detalhe ── */}
        <div className="clientes-detalhe">
          {!detalhe ? (
            <div className="detalhe-vazio">
              <span>👆</span>
              <p>Selecione uma cliente para ver os detalhes</p>
            </div>
          ) : (
            <>
              <div className="detalhe-header">
                <div className="detalhe-avatar">{detalhe.cliente.nome[0].toUpperCase()}</div>
                <div>
                  <h2>{detalhe.cliente.nome}</h2>
                  <p>{detalhe.cliente.telefone || '—'}</p>
                  {detalhe.cliente.endereco && <p>📍 {detalhe.cliente.endereco}</p>}
                </div>
                <div className="detalhe-acoes">
                  <button onClick={() => abrirModal(detalhe.cliente)}>✏️ Editar</button>
                  <button className="btn-excluir" onClick={() => excluir(selecionada)}>🗑️</button>
                </div>
              </div>

              {/* Stats */}
              <div className="stats-row">
                <div className="stat">
                  <strong className="stat-value">{detalhe.stats.totalPedidos}</strong>
                  <span className="stat-label">pedidos</span>
                </div>
                <div className="stat">
                  <strong className="stat-value">R$ {detalhe.stats.totalGasto.toFixed(2)}</strong>
                  <span className="stat-label">total gasto</span>
                </div>
                <div className="stat">
                  <strong className="stat-value">{detalhe.stats.ultimoPedido
                    ? new Date(detalhe.stats.ultimoPedido.createdAt).toLocaleDateString('pt-BR')
                    : '—'}</strong>
                  <span className="stat-label">último pedido</span>
                </div>
              </div>

              {/* Medidas */}
              {(detalhe.cliente.medidas?.tamanho || detalhe.cliente.medidas?.altura) && (
                <div className="medidas-box">
                  <h3>📏 Medidas</h3>
                  <div className="medidas-grid">
                    {detalhe.cliente.medidas.tamanho && <span><b>Tam:</b> {detalhe.cliente.medidas.tamanho}</span>}
                    {detalhe.cliente.medidas.altura   && <span><b>Alt:</b> {detalhe.cliente.medidas.altura}</span>}
                    {detalhe.cliente.medidas.cintura  && <span><b>Cin:</b> {detalhe.cliente.medidas.cintura}</span>}
                    {detalhe.cliente.medidas.quadril  && <span><b>Qua:</b> {detalhe.cliente.medidas.quadril}</span>}
                    {detalhe.cliente.medidas.obs      && <span className="col-full">📝 {detalhe.cliente.medidas.obs}</span>}
                  </div>
                </div>
              )}

              {/* Notas internas */}
              {detalhe.cliente.notasInternas && (
                <div className="notas-box">
                  <h3>🔒 Notas internas</h3>
                  <p>{detalhe.cliente.notasInternas}</p>
                </div>
              )}

              {/* Botão novo pedido para essa cliente */}
              <button
                className="btn-novo-pedido-cliente"
                onClick={() => navigate(`/novo-pedido?clienteId=${selecionada}&nome=${encodeURIComponent(detalhe.cliente.nome)}&tel=${encodeURIComponent(detalhe.cliente.telefone || '')}`)}
              >
                ✂️ Novo pedido para {detalhe.cliente.nome.split(' ')[0]}
              </button>

              {/* Histórico de pedidos */}
              <h3 className="hist-titulo">📋 Histórico de pedidos</h3>
              {detalhe.pedidos.length === 0 ? (
                <p className="vazio">Nenhum pedido ainda.</p>
              ) : (
                <div className="hist-lista">
                  {detalhe.pedidos.map(p => (
                    <div key={p._id} className="hist-item">
                      <div className="hist-item-left">
                        <span
                          className="hist-status"
                          style={{ background: STATUS_COR[p.status] || '#eee' }}
                        >
                          {p.status}
                        </span>
                        <span>{p.quantidadePecas} peça(s)</span>
                        {p.servicos?.slice(0,2).map((s,i) => (
                          <span key={i} className="hist-tag">{s.nome}</span>
                        ))}
                        {p.servicos?.length > 2 && <span className="hist-tag">+{p.servicos.length - 2}</span>}
                      </div>
                      <div className="hist-item-right">
                        <strong>R$ {Number(p.valorTotal || 0).toFixed(2)}</strong>
                        <small>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modal criar/editar ── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selecionada && detalhe ? '✏️ Editar Cliente' : '➕ Nova Cliente'}</h2>
              <button onClick={() => setModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Nome *</label>
                  <input required value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} placeholder="Nome completo" />
                </div>
                <div className="form-group">
                  <label>Telefone (WhatsApp)</label>
                  <input value={form.telefone} onChange={e => setForm(f => ({...f, telefone: e.target.value}))} placeholder="(85) 99999-9999" />
                </div>
              </div>

              <div className="form-group">
                <label>Endereço</label>
                <input value={form.endereco} onChange={e => setForm(f => ({...f, endereco: e.target.value}))} placeholder="Rua, número, bairro..." />
              </div>

              <h3 className="modal-section">📏 Medidas</h3>
              <div className="form-row quad">
                <div className="form-group">
                  <label>Tamanho</label>
                  <input value={form.medidas.tamanho} onChange={e => setMedida('tamanho', e.target.value)} placeholder="M, 40, GG..." />
                </div>
                <div className="form-group">
                  <label>Altura</label>
                  <input value={form.medidas.altura} onChange={e => setMedida('altura', e.target.value)} placeholder="1.65m" />
                </div>
                <div className="form-group">
                  <label>Cintura</label>
                  <input value={form.medidas.cintura} onChange={e => setMedida('cintura', e.target.value)} placeholder="68cm" />
                </div>
                <div className="form-group">
                  <label>Quadril</label>
                  <input value={form.medidas.quadril} onChange={e => setMedida('quadril', e.target.value)} placeholder="92cm" />
                </div>
              </div>
              <div className="form-group">
                <label>Obs. de medidas</label>
                <input value={form.medidas.obs} onChange={e => setMedida('obs', e.target.value)} placeholder="Ex: ombro largo, perna curta..." />
              </div>

              <h3 className="modal-section">🔒 Notas internas</h3>
              <div className="form-group">
                <textarea
                  value={form.notasInternas}
                  onChange={e => setForm(f => ({...f, notasInternas: e.target.value}))}
                  placeholder="Preferências, forma de pagamento, observações que só a costureira vê..."
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-salvar" onClick={salvar} disabled={salvando || !form.nome}>
                {salvando ? 'Salvando...' : '✅ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
