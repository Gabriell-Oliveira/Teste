require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')
const Servico = require('../models/Servico')

const NOVOS_SERVICOS = [
  { nome: 'Botão',               preco:  5 },
  { nome: 'Rasgo',               preco: 10 },
  { nome: 'Remendo',             preco: 15 },
  { nome: 'Refazer peça',        preco: 15 },
  { nome: 'Cós',                 preco: 20 },
  { nome: 'Forro',               preco: 20 },
  { nome: 'Zíper calça',         preco: 15 }, 
  { nome: 'Zíper vestido',       preco: 20 },
  { nome: 'Bainha simples',      preco: 15 },
  { nome: 'Bainha original',     preco: 20 },
  { nome: 'Bainha de cortina',   preco: 25 },
  { nome: 'Elástico na cintura', preco: 15 },  
]

async function atualizar() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅ Conectado ao MongoDB')
  await Servico.deleteMany({})
  console.log('🗑️  Serviços antigos removidos')
  await Servico.insertMany(NOVOS_SERVICOS)
  console.log('✅ Novos serviços inseridos:')
  NOVOS_SERVICOS.forEach(s => console.log(`   • ${s.nome}: R$ ${s.preco.toFixed(2)}`))
  await mongoose.disconnect()
  console.log('\n✅ Pronto! Reinicie o servidor para aplicar.')
}

atualizar().catch(err => { console.error(err); process.exit(1) })
