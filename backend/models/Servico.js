// ============================================
// models/Servico.js
// Tabela de serviços e preços da costureira
// ============================================
const mongoose = require('mongoose')

const ServicoSchema = new mongoose.Schema({
  nome:  { type: String, required: true },
  preco: { type: Number, required: true },
  ativo: { type: Boolean, default: true }
}, { timestamps: true })

module.exports = mongoose.model('Servico', ServicoSchema)
