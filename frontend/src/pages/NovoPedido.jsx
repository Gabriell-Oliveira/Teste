import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './FormPedido.css'

function criarPeca() { return { servicos: [], urgente: false } }

export default function NovoPedido() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [servicos, setServicos]     = useState([])
  const [salvando, setSalvando]     = useState(false)
  const [sugestoes, setSugestoes]   = useState([])
  const [mostrarSug, setMostrarSug] = useState(false)
  const buscaRef = useRef(null)

  const [form, setForm] = useState({
    nomeCliente:    searchParams.get('nome') || '',
    telefone:       searchParams.get('tel')  || '',
    clienteId:      searchParams.get('clienteId') || null,
    quantidadePecas: 1,
    observacoes:    '',
    dataEntrega:    '',
    prioridade:     false,
    status:         'pendente',
    valorTotal:     0,
  })

  const [pecas, setPecas] = useState([criarPeca()])

  useEffect(() => { api.get('/servicos').then(r => setServicos(r.data)) }, [])

  // Sincroniza array de peças com quantidade
  useEffect(() => {
    const qtd = Number(form.quantidadePecas) || 1
    setPecas(prev =>
      qtd > prev.length
        ? [...prev, ...Array(qtd - prev.length).fill(null).map(criarPeca)]
        : prev.slice(0, qtd)
    )
  }, [form.quantidadePecas])

  // Recalcula valor total
  useEffect(() => {
    const total = pecas.reduce((acc, p) =>
      acc + p.servicos.reduce((s, srv) => s + (srv.preco || 0), 0), 0)
    setForm(f => ({ ...f, valorTotal: total }))
  }, [pecas])

  // Autocomplete de clientes
  async function buscarClientes(nome) {
    if (nome.length < 2) { setSugestoes([]); return }
    const res = await api.get('/clientes', { params: { busca: nome } })
    setSugestoes(res.data.slice(0, 5))
    setMostrarSug(true)
  }

  function selecionarCliente(c) {
    setForm(f => ({ ...f, nomeCliente: c.nome, telefone: c.telefone || '', clienteId: c._id }))
    setSugestoes([])
    setMostrarSug(false)
  }

  function toggleServicoPeca(idx, servico) {
    setPecas(prev => prev.map((p, i) => {
      if (i !== idx) return p
      const existe = p.servicos.find(s => s.id === servico._id || s.id === servico.id)
      return {
        ...p,
        servicos: existe
          ? p.servicos.filter(s => s.id !== servico._id && s.id !== servico.id)
          : [...p.servicos, { id: servico._id || servico.id, nome: servico.nome, preco: servico.preco }]
      }
    }))
  }

  function toggleUrgentePeca(idx) {
    setPecas(prev => prev.map((p, i) => i === idx ? { ...p, urgente: !p.urgente } : p))
    const temUrgente = pecas.some((p, i) => i === idx ? !p.urgente : p.urgente)
    setForm(f => ({ ...f, prioridade: temUrgente }))
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      const todosServicos = pecas.flatMap(p => p.servicos)
      const unicos = todosServicos.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)
      await api.post('/pedidos', { ...form, pecas, servicos: unicos })
      navigate('/')
    } finally {
      setSalvando(false)
    }
  }

  const totalServicos = pecas.reduce((a, p) => a + p.servicos.length, 0)

  return (
    <div className="form-pedido-page">
      <Navbar />
      <div className="form-container">
        <h1>✂️ Novo Pedido</h1>
        <form onSubmit={salvar}>

          <section className="form-section">
            <h2>👤 Dados da Cliente</h2>

            {/* Campo nome com autocomplete */}
            <div className="form-row">
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Nome * {form.clienteId && <span className="badge-cadastrada">✓ Cliente cadastrada</span>}</label>
                <input
                  ref={buscaRef}
                  required
                  value={form.nomeCliente}
                  onChange={e => {
                    setForm(f => ({ ...f, nomeCliente: e.target.value, clienteId: null }))
                    buscarClientes(e.target.value)
                  }}
                  onBlur={() => setTimeout(() => setMostrarSug(false), 150)}
                  placeholder="Nome da cliente"
                  autoComplete="off"
                />
                {/* Dropdown de sugestões */}
                {mostrarSug && sugestoes.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {sugestoes.map(c => (
                      <button key={c._id} type="button" onMouseDown={() => selecionarCliente(c)}>
                        <strong>{c.nome}</strong>
                        <small>{c.telefone || 'sem telefone'}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Telefone (WhatsApp)</label>
                <input value={form.telefone}
                  onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                  placeholder="(85) 99999-9999" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Qtd. de Peças *</label>
                <input type="number" min="1" max="20" required value={form.quantidadePecas}
                  onChange={e => setForm(f => ({ ...f, quantidadePecas: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label>Data/Hora de Entrega</label>
                <input type="datetime-local" value={form.dataEntrega}
                  onChange={e => setForm(f => ({ ...f, dataEntrega: e.target.value }))} />
              </div>
            </div>
          </section>

          {/* Serviços por peça */}
          <section className="form-section">
            <h2>🪡 Serviços por Peça</h2>
            <p className="hint">Selecione os serviços de cada peça. Use ⚡ para urgentes.</p>
            {pecas.map((peca, idx) => (
              <div key={idx} className={`peca-form ${peca.urgente ? 'peca-urgente' : ''}`}>
                <div className="peca-form-header">
                  <span>🧥 Peça {idx + 1}</span>
                  <button type="button"
                    className={`btn-urgente-toggle ${peca.urgente ? 'ativo' : ''}`}
                    onClick={() => toggleUrgentePeca(idx)}>
                    ⚡ {peca.urgente ? 'Urgente!' : 'Urgente?'}
                  </button>
                </div>
                <div className="servicos-grid">
                  {servicos.map(s => {
                    const sel = peca.servicos.find(x => x.id === s._id || x.id === s.id)
                    return (
                      <button key={s._id || s.id} type="button"
                        className={`servico-btn ${sel ? 'selecionado' : ''}`}
                        onClick={() => toggleServicoPeca(idx, s)}>
                        <span>{s.nome}</span>
                        <small>R$ {s.preco.toFixed(2)}</small>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>

          <section className="form-section">
            <h2>💰 Valor e Detalhes</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Valor Total (R$)</label>
                <input type="number" step="0.01" value={form.valorTotal}
                  onChange={e => setForm(f => ({ ...f, valorTotal: Number(e.target.value) }))} />
                <small className="hint">Calculado automaticamente. Pode editar.</small>
              </div>
              <div className="form-group">
                <label>Status inicial</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="pendente">🟡 Pendente</option>
                  <option value="fazendo">🔵 Fazendo</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Observações</label>
              <textarea value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                placeholder="Detalhes extras..." rows={3} />
            </div>
          </section>

          <div className="resumo">
            <strong>Resumo:</strong> {form.nomeCliente || '—'} · {form.quantidadePecas} peça(s) ·{' '}
            {totalServicos} serviço(s) · <strong>R$ {Number(form.valorTotal).toFixed(2)}</strong>
            {form.prioridade && ' · ⚡ Tem peça urgente'}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={() => navigate('/')}>Cancelar</button>
            <button type="submit" className="btn-salvar" disabled={salvando}>
              {salvando ? 'Salvando...' : '✅ Salvar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
