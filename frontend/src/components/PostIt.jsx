import { useState } from 'react'
import { STATUS_CONFIG, ETAPAS } from '../pages/Dashboard'
import api from '../api'
import './PostIt.css'

function formatarData(dataISO) {
  if (!dataISO) return null
  // Corrige fuso horário — MongoDB salva em UTC, Brasil é UTC-3
  return new Date(dataISO).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Fortaleza'
  })
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
          {pedido.telefone && (
            <a
              href={linkWhatsApp(pedido.telefone, pedido.nomeCliente, id)}
              target="_blank"
              rel="noreferrer"
              className="postit-whatsapp-btn"
              title="Notificar no WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          )}
          <button className="postit-link-btn" onClick={copiarLink} title="Copiar link do cliente">🔗</button>
          {/* <button className="postit-menu-btn" onClick={() => setMenuAberto(!menuAberto)}>⋮</button> */}
        </div>
      </div>

      {/* Menu
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
      )} */}

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
