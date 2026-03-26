import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import './Cliente.css'

const STATUS_CONFIG = {
  pendente:  { cor: '#fef08a', label: 'Aguardando',    emoji: '⏳', desc: 'Seu pedido está aguardando para ser iniciado.' },
  fazendo:   { cor: '#93c5fd', label: 'Em andamento',  emoji: '🪡', desc: 'Sua roupa está sendo consertada agora!' },
  concluido: { cor: '#86efac', label: 'Pronto!',       emoji: '✅', desc: 'Seu conserto está pronto! Pode vir buscar.' },
  atrasado:  { cor: '#fca5a5', label: 'Atrasado',      emoji: '⚠️', desc: 'Houve um atraso. Entraremos em contato em breve.' },
  entregue:  { cor: '#d1d5db', label: 'Entregue',      emoji: '📦', desc: 'Pedido entregue. Obrigada pela preferência!' },
}

const ETAPAS = ['pendente', 'fazendo', 'concluido']

function formatarData(dataISO) {
  if (!dataISO) return null
  return new Date(dataISO).toLocaleString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
    timeZone: 'America/Fortaleza',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function Cliente() {
  const { id } = useParams()
  const [pedido, setPedido]       = useState(null)
  const [erro, setErro]           = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [recebido, setRecebido]   = useState(false)
  const [copiado, setCopiado]     = useState(false)
  const [chavePix, setChavePix]   = useState('')

  useEffect(() => {
    // Busca pedido e chave Pix global em paralelo
    Promise.all([
      api.get(`/pedidos/${id}`),
      api.get('/config')
    ])
      .then(([pRes, cfgRes]) => {
        setPedido(pRes.data)
        if (pRes.data.status === 'entregue') setRecebido(true)
        // Chave Pix: usa a do pedido se existir, senão a global
        setChavePix(pRes.data.pagamento?.chavePix || cfgRes.data.chavePix || '')
        api.post(`/pedidos/${id}/visualizado`).catch(() => {})
      })
      .catch(() => setErro(true))
  }, [id])

  async function confirmarRecebimento() {
    setConfirmando(true)
    try {
      await api.post(`/pedidos/${id}/recebido`)
      setRecebido(true)
      setPedido(p => ({ ...p, status: 'entregue' }))
    } finally {
      setConfirmando(false)
    }
  }

  function copiarPix() {
    navigator.clipboard.writeText(chavePix)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  if (erro) return (
    <div className="cpage">
      <div className="cpage-logo">🧵 Ateliê Mary Consertos</div>
      <div className="ccard">
        <div className="cerro">
          <span>😕</span>
          <h2>Pedido não encontrado</h2>
          <p>Verifique o link com a costureira.</p>
        </div>
      </div>
    </div>
  )

  if (!pedido) return (
    <div className="cpage">
      <div className="cpage-logo">🧵 Ateliê Mary Consertos</div>
      <div className="cloading">Carregando seu pedido...</div>
    </div>
  )

  const cfg = STATUS_CONFIG[pedido.status] || STATUS_CONFIG.pendente
  const etapaAtual = ETAPAS.indexOf(pedido.status)
  const mostrarTimeline = pedido.status !== 'atrasado' && pedido.status !== 'entregue'
  const mostrarPix = pedido.status === 'concluido' && !recebido && chavePix
  const mostrarBotaoRecebido = pedido.status === 'concluido' && !recebido

  return (
    <div className="cpage">
      <div className="cpage-logo">🧵 Ateliê Mary Consertos</div>

      <div className="ccard" style={{ borderTop: `5px solid ${cfg.cor}` }}>

        {/* Status */}
        <div className="cstatus" style={{ background: cfg.cor }}>
          <span className="cstatus-emoji">{cfg.emoji}</span>
          <div>
            <h2>{cfg.label}</h2>
            <p>{cfg.desc}</p>
          </div>
        </div>

        {/* Saudação */}
        <div className="cgreeting">
          <h3>Olá, {pedido.nomeCliente}! 👋</h3>
          <p>Aqui estão os detalhes do seu conserto:</p>
        </div>

        {/* Timeline */}
        {mostrarTimeline && (
          <div className="ctimeline">
            {ETAPAS.map((etapa, i) => {
              const cfgE = STATUS_CONFIG[etapa]
              const ativa = i <= etapaAtual
              const atual = i === etapaAtual
              return (
                <div key={etapa} className={`cstep ${ativa ? 'ativa' : ''} ${atual ? 'atual' : ''}`}>
                  {i > 0 && <div className={`clinha ${i <= etapaAtual ? 'ativa' : ''}`} />}
                  <div className="cdot" style={ativa ? { background: cfgE.cor, border: `2px solid ${cfgE.cor}` } : {}}>
                    {ativa ? cfgE.emoji : '·'}
                  </div>
                  <span>{cfgE.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Previsão de entrega */}
        {pedido.dataEntrega && (
          <div className="cdetalhes">
            <div className="cdetalhe full">
              <label>Previsão de entrega</label>
              <span className="cdetalhe-value">🗓️ {formatarData(pedido.dataEntrega)}</span>
            </div>
          </div>
        )}

        {/* Peças */}
        <div className="cdetalhes">
          <div className="cdetalhe full">
            <label>Peças</label>
            <span className="cdetalhe-value">
              👗 {pedido.quantidadePecas} {pedido.quantidadePecas === 1 ? 'peça' : 'peças'}
            </span>
          </div>
        </div>

        {/* Serviços */}
        {pedido.servicos && pedido.servicos.length > 0 && (
          <div className="cservicos">
            <h4>✂️ Serviços incluídos</h4>
            {pedido.servicos.map((s, i) => (
              <div key={i} className="cservico-item">
                <span>{s.nome}</span>
                <span>R$ {Number(s.preco || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Valor total */}
        <div className="cdetalhes">
          <div className="cdetalhe full" style={{ borderTop: '1px solid #f0e4d4' }}>
            <label><h3>Valor total</h3></label>
            <div className="cvalor-direita">
              {pedido.desconto > 0 ? (
                <>
                  <span className="cvalor-original">
                    R$ {Number(pedido.valorOriginal || (pedido.valorTotal + pedido.desconto)).toFixed(2)}
                  </span>
                  <span className="cvalor-final">
                    R$ {Number(pedido.valorTotal).toFixed(2)}
                  </span>
                  <span className="cvalor-desconto-msg">
                    🎉 {pedido.nomeCliente.split(' ')[0]} recebeu um desconto especial!
                  </span>
                </>
              ) : (
                <span className="cvalor-final">
                  R$ {Number(pedido.valorTotal || 0).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Observações */}
        {pedido.observacoes && (
          <div className="cobs">
            <h4>📝 Observações</h4>
            <p>{pedido.observacoes}</p>
          </div>
        )}

        {/* ── PAGAMENTO VIA PIX (só quando pronto) ── */}
        {mostrarPix && (
          <div className="cpagamento">
            <p>🎉 Peça pronta! Use a chave Pix abaixo para pagamento.</p>
            <div className="cpix-box">
              <span className="cpix-label">Chave Pix</span>
              <span className="cpix-chave">{chavePix}</span>
              <button className="btn-copiar-pix" onClick={copiarPix}>
                {copiado ? '✅ Copiado!' : '📋 Copiar chave Pix'}
              </button>
            </div>
          </div>
        )}

        {/* Botão confirmar recebimento
        {mostrarBotaoRecebido && (
          <div className="creceber">
            <p>Já buscou sua roupa?</p>
            <button onClick={confirmarRecebimento} disabled={confirmando}>
              {confirmando ? 'Confirmando...' : '📦 Confirmar que recebi'}
            </button>
          </div>
        )}  */}

        {recebido && (
          <div className="crecebido-ok">
            ✅ Recebimento confirmado! Obrigada pela preferência. 🧵
          </div>
        )}

        <p className="crodape">Dúvidas? Entre em contato com a costureira pelo WhatsApp.</p>
      </div>
    </div>
  )
}
