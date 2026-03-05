// ============================================
// models/Cliente.js
// Define a estrutura de um cliente no MongoDB
// ============================================
const mongoose = require('mongoose')

const ClienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  telefone: {
    type: String,
    trim: true,
    default: ''
  },
  endereco: {
    type: String,
    default: ''
  },
  medidas: {
    tamanho: { type: String, default: '' },   // P, M, G, GG, 38, 40...
    altura:  { type: String, default: '' },   // ex: 1.65m
    cintura: { type: String, default: '' },
    quadril: { type: String, default: '' },
    obs:     { type: String, default: '' },   // observações extras de medida
  },
  notasInternas: {
    type: String,
    default: ''   // ex: "prefere bainha invisível", "paga na entrega"
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true   // cria createdAt e updatedAt automaticamente
})

module.exports = mongoose.model('Cliente', ClienteSchema)
