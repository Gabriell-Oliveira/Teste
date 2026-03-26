// ============================================
// models/Pedido.js
// Define a estrutura de um pedido no MongoDB
// ============================================
const mongoose = require('mongoose')

// Sub-schema de serviço dentro de uma peça
const ServicoSchema = new mongoose.Schema({
  id:    String,
  nome:  String,
  preco: Number
}, { _id: false })

// Sub-schema de peça (cada pedido pode ter N peças)
const PecaSchema = new mongoose.Schema({
  urgente:  { type: Boolean, default: false },
  servicos: [ServicoSchema]
}, { _id: false })

// Sub-schema de rastreamento do link
const RastreamentoSchema = new mongoose.Schema({
  linkEnviadoEm:    { type: Date, default: null },
  primeiraVistEm:   { type: Date, default: null },
  totalVisualizacoes: { type: Number, default: 0 },
  recebidoPeloClienteEm: { type: Date, default: null },
}, { _id: false })

const PedidoSchema = new mongoose.Schema({
  // Referência ao cliente (pode ser null para clientes avulsos)
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    default: null
  },

  // Dados básicos (copiados do cliente ou digitados na hora)
  nomeCliente:      { type: String, required: true },
  telefone:         { type: String, default: '' },

  // Peças e serviços
  quantidadePecas:  { type: Number, default: 1 },
  pecas:            [PecaSchema],
  servicos:         [ServicoSchema],  // lista plana (compatibilidade)

  // Valor e prazo
  valorTotal:       { type: Number, default: 0 },
  valorOriginal: { type: Number, default: 0 },   // ← ADICIONAR
  desconto:      { type: Number, default: 0 },   // ← ADICIONAR (valor em R$)
  pagamento: {
  chavePix:       { type: String, default: '' },
  linkMercadoPago:{ type: String, default: '' },
  },
  dataEntrega:      { type: Date, default: null },


  // Status
  // pendente → fazendo → concluido → entregue
  // atrasado é detectado automaticamente
  status: {
    type: String,
    enum: ['pendente', 'fazendo', 'concluido', 'atrasado', 'entregue'],
    default: 'pendente'
  },

  prioridade:    { type: Boolean, default: false },
  observacoes:   { type: String, default: '' },

  // Rastreamento do link do cliente
  rastreamento:  { type: RastreamentoSchema, default: () => ({}) },

}, {
  timestamps: true
})

module.exports = mongoose.model('Pedido', PedidoSchema)
