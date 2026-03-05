import { useState } from 'react'
import { STATUS_CONFIG, ETAPAS } from '../pages/Dashboard'
import api from '../api'
import './PostIt.css'

function formatarData(dataISO) {
  if (!dataISO) return null
  return new Date(dataISO).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
}

function linkWhatsApp(telefone, nomeCliente, pedidoId) {
  const msg = encodeURIComponent(
    `Olá ${nomeCliente}! Seu conserto já está sendo feito. 🧵\n` +
    `Acompanhe o status aqui: ${window.location.origin}/pedido/${pedidoId}`
  )
  return `https://wa.me/55${telefone.replace(/\D/g,'')}?text=${msg}`
}

function getNavStatus(statusAtual) {
  if (statusAtual === 'atrasado') return { anterior: 'fazendo', proximo: 'concluido' }
  if (statusAtual === 'concluido') return { anterior: 'fazendo', proximo: null, entregue: true }
  const idx = ETAPAS.indexOf(statusAtual)
  return { anterior: idx > 0 ? ETAPAS[idx-1] : null, proximo: idx < ETAPAS.length-1 ? ETAPAS[idx+1] : null }
}

const NAV_LABELS = {
  pendente: { emoji:'🟡', label:'Pendente' },
  fazendo:  { emoji:'🔵', label:'Fazendo'  },
  concluido:{ emoji:'🟢', label:'Pronto'   },
  entregue: { emoji:'📦', label:'Entregue' },
}

export default function PostIt({ pedido, onAtualizarStatus, onEditar }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [expandido, setExpandido]   = useState(false)
  const config = STATUS_CONFIG[pedido.status] || STATUS_CONFIG.pendente
  const { anterior, proximo, entregue } = getNavStatus(pedido.status)
  const temPecas = pedido.pecas && pedido.pecas.length > 0

  // Rastreamento: link enviado
  async function copiarLink() {
    const link = `${window.location.origin}/pedido/${pedido._id || pedido.id}`
    navigator.clipboard.writeText(link)
    await api.post(`/pedidos/${pedido._id || pedido.id}/link-enviado`).catch(()=>{})
    alert('Link copiado! Cole no WhatsApp para a cliente.')
    setMenuAberto(false)
  }

  const id = pedido._id || pedido.id
  const rastr = pedido.rastreamento || {}

  return (
    <div className={`postit ${pedido.prioridade ? 'prioridade' : ''} ${pedido.status === 'atrasado' ? 'atrasado-pulse' : ''}`}
      style={{ background: config.cor }}>

      {/* Cabeçalho */}
      <div className="postit-header">
        <div className="postit-nome">
          {pedido.prioridade && <span className="badge-prioridade">⚡ Urgente</span>}
          <strong>{pedido.nomeCliente}</strong>
          <small>{pedido.telefone || ''}</small>
        </div>
        <div className="postit-acoes-topo">
          <button className="postit-editar-btn" onClick={onEditar} title="Editar">✏️</button>
          <button className="postit-menu-btn" onClick={() => setMenuAberto(!menuAberto)}>⋮</button>
        </div>
      </div>

      {/* Menu */}
      {menuAberto && (
        <div className="postit-menu">
          <button onClick={() => { onEditar(); setMenuAberto(false) }}>✏️ Editar pedido</button>
          {pedido.telefone && (
            <a href={linkWhatsApp(pedido.telefone, pedido.nomeCliente, id)}
              target="_blank" rel="noreferrer" className="whatsapp-link"
              onClick={() => setMenuAberto(false)}>
              📱 Notificar no WhatsApp
            </a>
          )}
          <button onClick={copiarLink}>🔗 Copiar link do cliente</button>
          <hr />
          <button onClick={() => { onAtualizarStatus(id, 'entregue'); setMenuAberto(false) }}>
            📦 Marcar como entregue
          </button>
        </div>
      )}

      {/* Info */}
      <div className="postit-info">
        <div className="postit-resumo">
          <span>👗 {pedido.quantidadePecas} {pedido.quantidadePecas===1?'peça':'peças'}</span>
          <span className="postit-valor">💰 R$ {Number(pedido.valorTotal||0).toFixed(2)}</span>
        </div>

        {pedido.dataEntrega && (
          <p className={`postit-data ${pedido.status==='atrasado'?'atrasado':''}`}>
            🗓️ {formatarData(pedido.dataEntrega)}
            {pedido.status==='atrasado' && ' ⚠️'}
          </p>
        )}

        {/* Rastreamento do link — simplificado */}
        <div className="postit-rastr">
          {rastr.linkEnviadoEm
            ? <span className="rastr-ok">✉️ Link enviado</span>
            : <span className="rastr-no">✉️ Não enviado</span>}
          {rastr.totalVisualizacoes > 0
            ? <span className="rastr-ok">👁️ Visualizou</span>
            : <span className="rastr-no">👁️ Não viu</span>}
        </div>

        {/* Peças ou serviços */}
        {temPecas ? (
          <div className="pecas-lista">
            {pedido.pecas.slice(0, expandido ? undefined : 2).map((peca, i) => (
              <div key={i} className={`peca-item ${peca.urgente ? 'urgente' : ''}`}>
                <div className="peca-header">
                  <span>🧥 {peca.nome ? peca.nome : `Peça ${i + 1}`}</span>
                  {peca.urgente && <span className="badge-urgente-peca">⚡</span>}
                </div>
                <div className="peca-servicos">
                  {(peca.servicos||[]).map((s,j) => <span key={j} className="tag-servico">{s.nome}</span>)}
                </div>
              </div>
            ))}
            {pedido.pecas.length > 2 && (
              <button className="btn-expandir" onClick={() => setExpandido(!expandido)}>
                {expandido ? '▲ Menos' : `▼ +${pedido.pecas.length-2} peças`}
              </button>
            )}
          </div>
        ) : (pedido.servicos||[]).length > 0 ? (
          <div className="postit-servicos">
            {pedido.servicos.map((s,i) => <span key={i} className="tag-servico">{s.nome}</span>)}
          </div>
        ) : null}

        {pedido.observacoes && <p className="postit-obs">📝 {pedido.observacoes}</p>}
      </div>

      {/* Botões de navegação */}
      <div className="postit-nav">
        {anterior
          ? <button className="btn-status btn-anterior" onClick={() => onAtualizarStatus(id, anterior)}>
              ← {NAV_LABELS[anterior].emoji} {NAV_LABELS[anterior].label}
            </button>
          : <div />}

        {proximo && (
          <button className="btn-status btn-proximo" onClick={() => onAtualizarStatus(id, proximo)}>
            {NAV_LABELS[proximo].emoji} {NAV_LABELS[proximo].label} →
          </button>
        )}

        {entregue && (
          <button className="btn-status btn-entregue" onClick={() => onAtualizarStatus(id, 'entregue')}>
            📦 Entregue →
          </button>
        )}
      </div>
    </div>
  )
}
