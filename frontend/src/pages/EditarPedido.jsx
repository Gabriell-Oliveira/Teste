import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import './FormPedido.css'

// Cole esta função no topo de cada arquivo que precisar (abaixo dos imports)
function mascararTelefone(valor) {
  // Remove tudo que não for dígito
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length === 0) return ''
  if (nums.length <= 2) return `(${nums}`
  if (nums.length <= 3) return `(${nums.slice(0,2)}) ${nums.slice(2)}`
  if (nums.length <= 7) return `(${nums.slice(0,2)}) ${nums.slice(2,3)}.${nums.slice(3)}`
  if (nums.length <= 11) return `(${nums.slice(0,2)}) ${nums.slice(2,3)}.${nums.slice(3,7)}-${nums.slice(7)}`
  return valor
}

function criarPeca() { return { servicos: [], urgente: false } }

// Helper: retorna o id do serviço independente do formato
function getServicoId(s) { return s._id || s.id || s.servicoId }

export default function EditarPedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [servicos, setServicos] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState(null)
  const [pecas, setPecas] = useState([criarPeca()])

  useEffect(() => {
    if (!id || id === 'undefined') {
      navigate('/')
      return
    }
    Promise.all([
      api.get('/servicos'),
      api.get(`/pedidos/${id}`)
    ]).then(([sRes, pRes]) => {
      setServicos(sRes.data)
      const pedido = pRes.data

      // Reconstrói array de peças — suporta formato novo e antigo
      if (pedido.pecas && pedido.pecas.length > 0) {
        setPecas(pedido.pecas)
      } else if (pedido.servicos && pedido.servicos.length > 0) {
        // Formato antigo: coloca todos os serviços na peça 1
        setPecas([{ servicos: pedido.servicos, urgente: false }])
      } else {
        setPecas(Array(pedido.quantidadePecas || 1).fill(null).map(criarPeca))
      }

      setForm({
        nomeCliente: pedido.nomeCliente || '',
        telefone: pedido.telefone || '',
        quantidadePecas: pedido.quantidadePecas || 1,
        observacoes: pedido.observacoes || '',
        dataEntrega: pedido.dataEntrega ? new Date(pedido.dataEntrega).toISOString().slice(0, 16) : '',
        prioridade: pedido.prioridade || false,
        status: pedido.status || 'pendente',
        valorTotal: pedido.valorTotal || 0,
        desconto: 0,   // ← ADICIONAR
        pagamento: {
          chavePix: pedido.pagamento?.chavePix || '',
          linkMercadoPago: pedido.pagamento?.linkMercadoPago || '',
        },
      })
      setCarregando(false)
    }).catch(() => navigate('/'))
  }, [id])

  // Sincroniza quantidade de peças com array
  useEffect(() => {
    if (!form) return
    const qtd = Number(form.quantidadePecas) || 1
    setPecas(prev =>
      qtd > prev.length
        ? [...prev, ...Array(qtd - prev.length).fill(null).map(criarPeca)]
        : prev.slice(0, qtd)
    )
  }, [form?.quantidadePecas])

  // // Recalcula valor total
  // // useEffect 1: recalcula subtotal quando pecas mudam
  // useEffect(() => {
  //   const subtotal = pecas.reduce((acc, p) =>
  //     acc + (p.servicos || []).reduce((s, srv) => s + (srv.preco || 0), 0), 0)
  //   setForm(f => ({ ...f, valorOriginal: subtotal, valorTotal: Math.max(0, subtotal - (f.desconto || 0)) }))
  // }, [pecas])

  // // useEffect 2: recalcula valorTotal quando desconto muda
  // useEffect(() => {
  //   setForm(f => ({ ...f, valorTotal: Math.max(0, (f.valorOriginal || 0) - (f.desconto || 0)) }))
  // }, [form?.desconto])
  // // Aqui o lint vai reclamar de dependência — é aceitável neste caso,
  // // ou use useRef para guardar o valorOriginal fora do form.

  // useEffect 1: recalcula subtotal quando pecas mudam
  useEffect(() => {
    if (!form) return  // ← guard contra null
    const subtotal = pecas.reduce((acc, p) =>
      acc + (p.servicos || []).reduce((s, srv) => s + (srv.preco || 0), 0), 0)
    setForm(f => ({ ...f, valorOriginal: subtotal, valorTotal: Math.max(0, subtotal - (f.desconto || 0)) }))
  }, [pecas]) // eslint-disable-line

// useEffect 2: recalcula valorTotal quando desconto muda
  useEffect(() => {
    if (!form) return  // ← guard contra null
    setForm(f => ({ ...f, valorTotal: Math.max(0, (f.valorOriginal || 0) - (f.desconto || 0)) }))
  }, [form?.desconto]) // eslint-disable-line

  function toggleServicoPeca(pecaIdx, servico) {
    const sid = getServicoId(servico)
    setPecas(prev => prev.map((p, i) => {
      if (i !== pecaIdx) return p
      const existe = p.servicos.find(s => getServicoId(s) === sid)
      return {
        ...p,
        servicos: existe
          ? p.servicos.filter(s => getServicoId(s) !== sid)
          : [...p.servicos, { id: sid, nome: servico.nome, preco: servico.preco }]
      }
    }))
  }

  function toggleUrgentePeca(idx) {
    setPecas(prev => prev.map((p, i) => i === idx ? { ...p, urgente: !p.urgente } : p))
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      const todosServicos = pecas.flatMap(p => p.servicos)
      const unicos = todosServicos.filter((s, i, arr) =>
        arr.findIndex(x => getServicoId(x) === getServicoId(s)) === i)
      await api.put(`/pedidos/${id}`, { ...form, pecas, servicos: unicos })
      navigate('/')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return (
    <div className="form-pedido-page">
      <Navbar />
      <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Carregando pedido...</div>
    </div>
  )

  return (
    <div className="form-pedido-page">
      <Navbar />
      <div className="form-container">
        <h1>✏️ Editar Pedido</h1>
        <form onSubmit={salvar}>

          {/* Dados do cliente */}
          <section className="form-section">
            <h2>👤 Dados da Cliente</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Nome *</label>
                <input required value={form.nomeCliente}
                  onChange={e => setForm(f => ({ ...f, nomeCliente: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Telefone</label>
                {/* <input value={form.telefone}
                  onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /> */}
                {/* Substitua o input de telefone por este: */}
                <input
                  value={form.telefone}
                  onChange={e => setForm(f => ({ ...f, telefone: mascararTelefone(e.target.value) }))}
                  placeholder="(85) 9.9999-9999"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Qtd. de Peças</label>
                <input type="number" min="1" max="20" value={form.quantidadePecas}
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
                    const sid = getServicoId(s)
                    const sel = peca.servicos.find(x => getServicoId(x) === sid)
                    return (
                      <button key={sid} type="button"
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

          {/* Valor e status */}
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
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.desconto || 0}
                  onChange={e => setForm(f => ({ ...f, desconto: Number(e.target.value) }))}
                  placeholder="0.00"
                />
                <small className="hint">Deixe 0 para sem desconto.</small>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="pendente">🟡 Pendente</option>
                  <option value="fazendo">🔵 Fazendo</option>
                  <option value="concluido">🟢 Concluído</option>
                  <option value="atrasado">🔴 Atrasado</option>
                  <option value="entregue">📦 Entregue</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Observações</label>
              <textarea value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                rows={3} />
            </div>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.prioridade}
                onChange={e => setForm(f => ({ ...f, prioridade: e.target.checked }))} />
              ⚡ Marcar como urgente/prioridade
            </label>
          </section>

          {/* Adicionar uma nova section no formulário, antes de form-actions: */}
          <section className="form-section">
            <h2>💳 Dados de Pagamento</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Chave Pix</label>
                <input
                  value={form.pagamento?.chavePix || ''}
                  onChange={e => setForm(f => ({
                    ...f,
                    pagamento: { ...f.pagamento, chavePix: e.target.value }
                  }))}
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                />
              </div>
              <div className="form-group">
                <label>Link Mercado Pago</label>
                <input
                  value={form.pagamento?.linkMercadoPago || ''}
                  onChange={e => setForm(f => ({
                    ...f,
                    pagamento: { ...f.pagamento, linkMercadoPago: e.target.value }
                  }))}
                  placeholder="https://mpago.la/..."
                />
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={() => navigate('/')}>
              Cancelar
            </button>
            <button type="submit" className="btn-salvar" disabled={salvando}>
              {salvando ? 'Salvando...' : '✅ Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
