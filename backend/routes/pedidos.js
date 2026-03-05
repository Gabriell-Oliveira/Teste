// routes/pedidos.js
const express = require('express')
const router  = express.Router()
const Pedido  = require('../models/Pedido')

// GET /api/pedidos — lista pedidos (com filtros opcionais)
router.get('/', async (req, res) => {
  try {
    const { status, clienteId, historico } = req.query
    let filtro = {}

    // historico=true → mostra entregues | padrão → só ativos
    if (historico === 'true') {
      filtro.status = 'entregue'
    } else if (status) {
      filtro.status = status
    } else {
      // Mural: tudo menos entregue
      filtro.status = { $ne: 'entregue' }
    }

    if (clienteId) filtro.clienteId = clienteId

    const pedidos = await Pedido.find(filtro)
      .populate('clienteId', 'nome telefone medidas notasInternas')
      .sort({ createdAt: -1 })

    res.json(pedidos)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// GET /api/pedidos/:id — busca pedido pelo ID (usado pelo link do cliente)
router.get('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate('clienteId', 'nome telefone')
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' })
    res.json(pedido)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// POST /api/pedidos — cria pedido
router.post('/', async (req, res) => {
  try {
    const pedido = await Pedido.create(req.body)
    res.status(201).json(pedido)
  } catch (err) {
    res.status(400).json({ erro: err.message })
  }
})

// PUT /api/pedidos/:id — atualiza pedido
router.put('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' })
    res.json(pedido)
  } catch (err) {
    res.status(400).json({ erro: err.message })
  }
})

// DELETE /api/pedidos/:id
router.delete('/:id', async (req, res) => {
  try {
    await Pedido.findByIdAndDelete(req.params.id)
    res.json({ mensagem: 'Pedido removido' })
  } catch (err) {
    res.status(400).json({ erro: err.message })
  }
})

// ── Rastreamento ─────────────────────────────────────────────

// POST /api/pedidos/:id/visualizado
// Chamado quando o cliente abre o link pela primeira vez
router.post('/:id/visualizado', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
    if (!pedido) return res.status(404).json({ erro: 'Não encontrado' })

    const update = {
      'rastreamento.totalVisualizacoes': (pedido.rastreamento?.totalVisualizacoes || 0) + 1
    }

    // Registra primeira visualização
    if (!pedido.rastreamento?.primeiraVistEm) {
      update['rastreamento.primeiraVistEm'] = new Date()
    }

    await Pedido.findByIdAndUpdate(req.params.id, { $set: update })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// POST /api/pedidos/:id/link-enviado
// Chamado quando costureira copia o link para enviar no WhatsApp
router.post('/:id/link-enviado', async (req, res) => {
  try {
    await Pedido.findByIdAndUpdate(req.params.id, {
      $set: { 'rastreamento.linkEnviadoEm': new Date() }
    })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// POST /api/pedidos/:id/recebido
// Cliente clica em "Recebi minha roupa!" na página dele
router.post('/:id/recebido', async (req, res) => {
  try {
    await Pedido.findByIdAndUpdate(req.params.id, {
      $set: {
        status: 'entregue',
        'rastreamento.recebidoPeloClienteEm': new Date()
      }
    })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

module.exports = router
