import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { API_BASE_URL } from './config/api';
import './index.css';
import './theme.css';
import Login from './components/Login';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminDespesas from './components/Admin/AdminDespesas';
import AdminCategoriasDespesa from './components/Admin/AdminCategoriasDespesa';
import AdminVouchers from './components/Admin/AdminVouchers';
import AdminRelatorios from './components/Admin/AdminRelatorios';
import TecnicoDashboard from './components/Technician/TecnicoDashboard';
import TecnicoAgenda from './components/Technician/TecnicoAgenda';
import TecnicoOS from './components/Technician/TecnicoOS';
import TecnicoDespesas from './components/Technician/TecnicoDespesas';
import TecnicoRelatorios from './components/Technician/TecnicoRelatorios';
import TecnicoVouchers from './components/Technician/TecnicoVouchers';
import TecnicoPerfil from './components/Technician/TecnicoPerfil';
import TecnicoManuais from './components/Technician/TecnicoManuais';
import ClienteDashboard from './components/Client/ClienteDashboard';
import ClientePerfil from './components/Client/ClientePerfil';
import ClienteSolicitacoes from './components/Client/ClienteSolicitacoes';
import ClienteNovaSolicitacao from './components/Client/ClienteNovaSolicitacao';
import ClienteRelatorios from './components/Client/ClienteRelatorios';
import ClienteHistorico from './components/Client/ClienteHistorico';
import ClienteContatoSuporte from './components/Client/ClienteContatoSuporte';
import ClienteFAQ from './components/Client/ClienteFAQ';
import Lojas from './components/Admin/Lojas';
import Clientes from './components/Admin/Clientes';
import Tecnicos from './components/Admin/Tecnicos';
import Agendamentos from './components/Admin/Agendamentos';
import Usuarios from './components/Admin/Usuarios';
import Franquias from './components/Admin/Franquias';
import Manuais from './components/Admin/Manuais';
import ListaChecklistsObra from './components/ListaChecklistsObra';
import Notificacoes from './components/Notificacoes';

function App() {
  useEffect(() => {
    console.log('🚀 App iniciado');
    console.log('🌐 API Base URL:', API_BASE_URL);
    console.log('🖥️ Hostname:', window.location.hostname);
    console.log('🔗 Full URL:', window.location.href);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/lojas" element={<Lojas />} />
        <Route path="/admin/clientes" element={<Clientes />} />
        <Route path="/admin/tecnicos" element={<Tecnicos />} />
        <Route path="/admin/agendamentos" element={<Agendamentos />} />
        <Route path="/admin/usuarios" element={<Usuarios />} />
        <Route path="/admin/franquias" element={<Franquias />} />
        <Route path="/admin/manuais" element={<Manuais />} />
        <Route path="/admin/despesas" element={<AdminDespesas />} />
        <Route path="/admin/categorias-despesa" element={<AdminCategoriasDespesa />} />
        <Route path="/admin/vouchers" element={<AdminVouchers />} />
        <Route path="/admin/relatorios" element={<AdminRelatorios />} />
        <Route path="/admin/checklists-obra" element={<ListaChecklistsObra />} />
        <Route path="/admin/notificacoes" element={<Notificacoes />} />
        <Route path="/tecnico/dashboard" element={<TecnicoDashboard />} />
        <Route path="/tecnico/os" element={<TecnicoOS />} />
        <Route path="/tecnico/agenda" element={<TecnicoAgenda />} />
        <Route path="/tecnico/despesas" element={<TecnicoDespesas />} />
        <Route path="/tecnico/relatorios" element={<TecnicoRelatorios />} />
        <Route path="/tecnico/vouchers" element={<TecnicoVouchers />} />
        <Route path="/tecnico/manuais" element={<TecnicoManuais />} />
        <Route path="/tecnico/perfil" element={<TecnicoPerfil />} />
        <Route path="/tecnico/notificacoes" element={<Notificacoes />} />
        <Route path="/cliente/dashboard" element={<ClienteDashboard />} />
        <Route path="/cliente/perfil" element={<ClientePerfil />} />
        <Route path="/cliente/solicitacoes" element={<ClienteSolicitacoes />} />
        <Route path="/cliente/nova-solicitacao" element={<ClienteNovaSolicitacao />} />
        <Route path="/cliente/relatorios" element={<ClienteRelatorios />} />
        <Route path="/cliente/historico" element={<ClienteHistorico />} />
        <Route path="/cliente/contato" element={<ClienteContatoSuporte />} />
        <Route path="/cliente/faq" element={<ClienteFAQ />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
