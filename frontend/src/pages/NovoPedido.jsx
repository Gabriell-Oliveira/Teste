import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './FormPedido.css'

function mascararTelefone(valor) {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length === 0) return ''
  if (nums.length <= 2) return `(${nums}`
  if (nums.length <= 3) return `(${nums.slice(0,2)}) ${nums.slice(2)}`
  if (nums.length <= 7) return `(${nums.slice(0,2)}) ${nums.slice(2,3)}.${nums.slice(3)}`
  if (nums.length <= 11) return `(${nums.slice(0,2)}) ${nums.slice(2,3)}.${nums.slice(3,7)}-${nums.slice(7)}`
  return valor
}

function criarPeca() { return { nome: '', servicos: [], urgente: false } }

export default function NovoPedido() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [servicos, setServicos] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [sugestoes, setSugestoes] = useState([])
  const [mostrarSug, setMostrarSug] = useState(false)
  const [chavePix, setChavePix] = useState('')   // chave global do sistema
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
    desconto:       0,
    // chavePix no pedido fica vazia por padrão (usa a global)
    pagamento: { chavePix: '' },
  })

  const [pecas, setPecas] = useState([criarPeca()])

  useEffect(() => {
    api.get('/servicos').then(r => setServicos(r.data))
    api.get('/config').then(r => setChavePix(r.data.chavePix || ''))
  }, [])

  // Sincroniza array de peças com quantidade
  useEffect(() => {
    const qtd = Number(form.quantidadePecas) || 1
    setPecas(prev =>
      qtd > prev.length
        ? [...prev, ...Array(qtd - prev.length).fill(null).map(criarPeca)]
        : prev.slice(0, qtd)
    )
  }, [form.quantidadePecas])

  // Recalcula subtotal quando peças mudam
  useEffect(() => {
    const subtotal = pecas.reduce((acc, p) =>
      acc + (p.servicos || []).reduce((s, srv) => s + (srv.preco || 0), 0), 0)
    setForm(f => ({ ...f, valorOriginal: subtotal, valorTotal: Math.max(0, subtotal - (f.desconto || 0)) }))
  }, [pecas]) // eslint-disable-line

  // Recalcula valorTotal quando desconto muda
  useEffect(() => {
    setForm(f => ({ ...f, valorTotal: Math.max(0, (f.valorOriginal || 0) - (f.desconto || 0)) }))
  }, [form?.desconto]) // eslint-disable-line

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

          {/* Dados da cliente */}
          <section className="form-section">
            <h2>👤 Dados da Cliente</h2>
            <div className="form-row">
              <div className="form-group" style={{ position: 'relative' }}>
                <label>
                  Nome *{' '}
                  {form.clienteId && <span className="badge-cadastrada">✓ Cadastrada</span>}
                </label>
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
                <input
                  value={form.telefone}
                  onChange={e => setForm(f => ({ ...f, telefone: mascararTelefone(e.target.value) }))}
                  placeholder="(85) 9.9999-9999"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Qtd. de Peças *</label>
                <input type="number" min="1" max="20" required
                  value={form.quantidadePecas}
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
                  <div className="peca-nome-wrap">
                    <span className="peca-num">🧥 Peça {idx + 1}</span>
                    <input
                      className="peca-nome-input"
                      placeholder="Nome opcional (ex: calça, blusa...)"
                      value={peca.nome || ''}
                      onChange={e => setPecas(prev => prev.map((p, i) =>
                        i === idx ? { ...p, nome: e.target.value } : p
                      ))}
                    />
                  </div>
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

          {/* Valor */}
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
                <label>Desconto (R$)</label>
                <input type="number" step="0.01" min="0"
                  value={form.desconto || 0}
                  onChange={e => setForm(f => ({ ...f, desconto: Number(e.target.value) }))}
                  placeholder="0.00" />
                <small className="hint">Deixe 0 para sem desconto.</small>
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

          {/* Pix por pedido (opcional — substitui o global) */}
          <section className="form-section">
            <h2>💳 Chave Pix (opcional)</h2>
            <p className="hint" style={{ marginBottom: '0.75rem' }}>
              {chavePix
                ? `Chave global cadastrada: "${chavePix}". Preencha abaixo só se quiser usar uma chave diferente neste pedido.`
                : 'Nenhuma chave Pix global configurada. Cadastre em Serviços & Configurações ou preencha abaixo.'}
            </p>
            <div className="form-group">
              <label>Chave Pix do pedido</label>
              <input
                value={form.pagamento?.chavePix || ''}
                onChange={e => setForm(f => ({
                  ...f,
                  pagamento: { chavePix: e.target.value }
                }))}
                placeholder="Deixe em branco para usar a chave global"
              />
            </div>
          </section>

          <div className="resumo">
            <strong>Resumo:</strong> {form.nomeCliente || '—'} · {form.quantidadePecas} peça(s) ·{' '}
            {totalServicos} serviço(s) · <strong>R$ {Number(form.valorTotal).toFixed(2)}</strong>
            {form.prioridade && ' · ⚡ Urgente'}
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
