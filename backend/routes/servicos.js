// routes/servicos.js
const express = require('express')
const router = express.Router()
const Servico = require('../models/Servico')

// Serviços padrão para popular o banco na primeira vez
const SERVICOS_PADRAO = [
  { nome: 'Bainha simples',      preco: 15.00 },
  { nome: 'Bainha invisível',    preco: 20.00 },
  { nome: 'Zíper calça',         preco: 25.00 },
  { nome: 'Zíper vestido',       preco: 30.00 },
  { nome: 'Costurar rasgo',      preco: 12.00 },
  { nome: 'Ponto em calça',      preco: 18.00 },
  { nome: 'Ajuste de cós',       preco: 22.00 },
  { nome: 'Ajuste de cintura',   preco: 28.00 },
  { nome: 'Colocar botão',       preco:  8.00 },
  { nome: 'Corte e ajuste',      preco: 35.00 },
  { nome: 'Remendo',             preco: 14.00 },
  { nome: 'Elástico na cintura', preco: 20.00 },
]

// GET /api/servicos — lista todos ativos
router.get('/', async (req, res) => {
  try {
    let servicos = await Servico.find({ ativo: true }).sort('nome')

    // Se banco vazio, popula com padrões
    if (servicos.length === 0) {
      servicos = await Servico.insertMany(SERVICOS_PADRAO)
    }

    res.json(servicos)
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
})

// POST /api/servicos — cria novo serviço
router.post('/', async (req, res) => {
  try {
    const s = await Servico.create(req.body)
    res.status(201).json(s)
  } catch (err) {
    res.status(400).json({ erro: err.message })
  }
})

// PUT /api/servicos/:id — atualiza preço/nome
router.put('/:id', async (req, res) => {
  try {
    const s = await Servico.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!s) return res.status(404).json({ erro: 'Serviço não encontrado' })
    res.json(s)
  } catch (err) {
    res.status(400).json({ erro: err.message })
  }
})

// DELETE /api/servicos/:id — desativa (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await Servico.findByIdAndUpdate(req.params.id, { ativo: false })
    res.json({ mensagem: 'Serviço desativado' })
  } catch (err) {
    res.status(400).json({ erro: err.message })
  }
})

module.exports = router
