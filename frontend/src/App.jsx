import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Gerenciamento from './pages/Gerenciamento'
import NovoPedido   from './pages/NovoPedido'
import EditarPedido from './pages/EditarPedido'
import Cliente      from './pages/Cliente'
import Clientes     from './pages/Clientes'
import Historico    from './pages/Historico'

function RotaProtegida({ children }) {
  const logado = localStorage.getItem('costura-auth')
  return logado ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pedido/:id" element={<Cliente />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/"           element={<RotaProtegida><Dashboard /></RotaProtegida>} />
        <Route path="/gerenciamento" element={<RotaProtegida><Gerenciamento /></RotaProtegida>} />
        <Route path="/clientes"   element={<RotaProtegida><Clientes /></RotaProtegida>} />
        <Route path="/historico"  element={<RotaProtegida><Historico /></RotaProtegida>} />
        <Route path="/novo-pedido"    element={<RotaProtegida><NovoPedido /></RotaProtegida>} />
        <Route path="/editar-pedido/:id" element={<RotaProtegida><EditarPedido /></RotaProtegida>} />
      </Routes>
    </BrowserRouter>
  )
}
