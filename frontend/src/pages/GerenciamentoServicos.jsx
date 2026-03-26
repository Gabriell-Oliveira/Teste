import { useEffect, useState } from 'react'
import api from '../api'
import Navbar from '../components/Navbar'

const estilos = {
  page:    { minHeight: '100vh', background: '#faf7f4' },
  content: { maxWidth: 700, margin: '0 auto', padding: '1.5rem' },
  h1:      { fontFamily: 'Georgia, serif', color: '#3d2b1f', marginBottom: '1.5rem' },
  card:    { background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  cabecalho: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 1.25rem', borderBottom: '1px solid #f0e4d4',
  },
  cabTitulo: { margin: 0, fontSize: '0.95rem', color: '#5a3e2b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  btnNovo: {
    background: '#c0855a', color: 'white', border: 'none',
    padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600,
    cursor: 'pointer', fontSize: '0.85rem',
  },
  linha: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.75rem 1.25rem', borderTop: '1px solid #f0e4d4',
    gap: '0.75rem',
  },
  nome:   { fontSize: '0.9rem', color: '#3d2b1f', fontWeight: 500, flex: 1 },
  preco:  { fontSize: '0.9rem', color: '#5a3e2b', fontWeight: 700, minWidth: 80, textAlign: 'right' },
  badge:  (ativo) => ({
    padding: '2px 10px', borderRadius: 10, fontSize: '0.75rem',
    fontWeight: 700, background: ativo ? '#86efac' : '#f0e4d4',
    color: ativo ? '#166534' : '#888', minWidth: 70, textAlign: 'center',
  }),
  acoes:  { display: 'flex', gap: 4 },
  btnIcone: {
    background: 'none', border: '1px solid #e8d5c0', borderRadius: 6,
    padding: '4px 8px', cursor: 'pointer', fontSize: '0.85rem',
    transition: 'background 0.15s',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 500, padding: '1rem',
  },
  modal: {
    background: 'white', borderRadius: 14, width: '100%',
    maxWidth: 420, padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  modalH2: { margin: '0 0 1rem', color: '#3d2b1f', fontSize: '1.1rem' },
  label:   { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#5a3e2b', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 4 },
  input: {
    width: '100%', padding: '0.6rem 0.8rem', border: '2px solid #e8d5c0',
    borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', color: '#3d2b1f', marginBottom: '0.75rem',
  },
  rodapeModal: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' },
  btnCancelar: { padding: '0.6rem 1.2rem', border: '2px solid #e8d5c0', borderRadius: 8, background: 'white', cursor: 'pointer', fontFamily: 'inherit' },
  btnSalvar:   { padding: '0.6rem 1.2rem', background: '#c0855a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  vazio: { textAlign: 'center', padding: '2rem', color: '#aaa', fontSize: '0.9rem' },
}

const formVazio = () => ({ nome: '', preco: '' })

export default function GerenciamentoServicos() {
  const [servicos, setServicos] = useState([])
  const [modal, setModal]       = useState(false)
  const [editando, setEditando] = useState(null)  // null = novo, objeto = editar
  const [form, setForm]         = useState(formVazio())
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    // Busca todos — ativos e inativos — para o painel de gestão
    // O backend já retorna só os ativos; para mostrar inativos aqui,
    // vamos buscar todos e filtrar no frontend.
    // ATENÇÃO: o endpoint atual só retorna ativo:true.
    // Veja a nota no backend abaixo sobre como ajustar isso.
    const res = await api.get('/servicos', { params: { todos: 'true' } })
    setServicos(res.data)
  }

  function abrirNovo() {
    setEditando(null)
    setForm(formVazio())
    setModal(true)
  }

  function abrirEditar(s) {
    setEditando(s)
    setForm({ nome: s.nome, preco: String(s.preco) })
    setModal(true)
  }

  async function salvar() {
    if (!form.nome.trim() || !form.preco) return
    setSalvando(true)
    try {
      const dados = { nome: form.nome.trim(), preco: parseFloat(form.preco) }
      if (editando) {
        await api.put(`/servicos/${editando._id}`, dados)
      } else {
        await api.post('/servicos', dados)
      }
      setModal(false)
      carregar()
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo(s) {
    // Chama PUT com ativo invertido
    await api.put(`/servicos/${s._id}`, { ativo: !s.ativo })
    // Atualiza local sem re-buscar (o backend retorna só ativos, então atualizamos local)
    setServicos(prev => prev.map(x => x._id === s._id ? { ...x, ativo: !x.ativo } : x))
  }

  async function excluir(id) {
    if (!confirm('Desativar este serviço permanentemente?')) return
    await api.delete(`/servicos/${id}`)
    setServicos(prev => prev.filter(x => x._id !== id))
  }

  return (
    <div style={estilos.page}>
      <Navbar />
      <div style={estilos.content}>
        <h1 style={estilos.h1}>✂️ Gerenciamento de Serviços</h1>

        <div style={estilos.card}>
          <div style={estilos.cabecalho}>
            <h2 style={estilos.cabTitulo}>
              Serviços cadastrados ({servicos.length})
            </h2>
            <button style={estilos.btnNovo} onClick={abrirNovo}>+ Novo Serviço</button>
          </div>

          {servicos.length === 0 && (
            <div style={estilos.vazio}>Nenhum serviço cadastrado ainda.</div>
          )}

          {servicos.map(s => (
            <div key={s._id} style={estilos.linha}>
              <span style={estilos.nome}>{s.nome}</span>
              <span style={estilos.preco}>R$ {Number(s.preco).toFixed(2)}</span>
              <span style={estilos.badge(s.ativo)}>{s.ativo ? 'Ativo' : 'Inativo'}</span>
              <div style={estilos.acoes}>
                <button style={estilos.btnIcone} onClick={() => abrirEditar(s)} title="Editar">✏️</button>
                <button
                  style={estilos.btnIcone}
                  onClick={() => toggleAtivo(s)}
                  title={s.ativo ? 'Desativar' : 'Ativar'}
                >
                  {s.ativo ? '🔴' : '🟢'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <div style={estilos.overlay} onClick={() => setModal(false)}>
          <div style={estilos.modal} onClick={e => e.stopPropagation()}>
            <h2 style={estilos.modalH2}>
              {editando ? '✏️ Editar Serviço' : '➕ Novo Serviço'}
            </h2>

            <label style={estilos.label}>Nome do serviço *</label>
            <input
              style={estilos.input}
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Bainha simples"
              autoFocus
            />

            <label style={estilos.label}>Preço (R$) *</label>
            <input
              style={estilos.input}
              type="number"
              step="0.01"
              min="0"
              value={form.preco}
              onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
              placeholder="15.00"
            />

            <div style={estilos.rodapeModal}>
              <button style={estilos.btnCancelar} onClick={() => setModal(false)}>Cancelar</button>
              <button
                style={estilos.btnSalvar}
                onClick={salvar}
                disabled={salvando || !form.nome.trim() || !form.preco}
              >
                {salvando ? 'Salvando...' : '✅ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
