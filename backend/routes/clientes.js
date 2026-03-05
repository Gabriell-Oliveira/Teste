// routes/clientes.js
const express = require('express')
const router = express.Router()
const Cliente = require('../models/Cliente')
const Pedido  = require('../models/Pedido')

// GET /api/clientes — lista todos (com busca por nome/telefone)
router.get('/', async (req, res) => {
  try {
    const { busca } = req.query
    let filtro = { ativo: true }

    if (busca) {
      filtro.$or = [
        { nome:     { $regex: busca, $options: 'i' } },
        { telefone: { $regex: busca, $options: 'i' } },
      ]
    }

    const clientes = await Cliente.find(filtro).sort('nome')
    res.json(clientes)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// GET /api/clientes/:id — busca um cliente com histórico de pedidos
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id)
    if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrada' })

    // Busca pedidos desse cliente ordenados do mais recente
    const pedidos = await Pedido.find({ clienteId: req.params.id })
      .sort({ createdAt: -1 })

    // Estatísticas rápidas
    const totalGasto    = pedidos.reduce((a, p) => a + (p.valorTotal || 0), 0)
    const totalPedidos  = pedidos.length
    const ultimoPedido  = pedidos[0] || null

    res.json({ cliente, pedidos, stats: { totalGasto, totalPedidos, ultimoPedido } })
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// POST /api/clientes — cria cliente
router.post('/', async (req, res) => {
  try {
    const c = await Cliente.create(req.body)
    res.status(201).json(c)
  } catch (err) {
    res.status(400).json({ erro: err.message })
  }
})

// PUT /api/clientes/:id — atualiza cliente
router.put('/:id', async (req, res) => {
  try {
    const c = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!c) return res.status(404).json({ erro: 'Cliente não encontrada' })
    res.json(c)
  } catch (err) {
    res.status(400).json({ erro: err.message })
  }
})

// DELETE /api/clientes/:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    await Cliente.findByIdAndUpdate(req.params.id, { ativo: false })
    res.json({ mensagem: 'Cliente removida' })
  } catch (err) {
    res.status(400).json({ erro: err.message })
  }
})

module.exports = router
