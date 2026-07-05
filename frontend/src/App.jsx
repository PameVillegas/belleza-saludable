import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import SelectService from './pages/SelectService';
import ServiceDetail from './pages/ServiceDetail';
import SelectDateTime from './pages/SelectDateTime';
import ClientData from './pages/ClientData';
import Confirmation from './pages/Confirmation';
import MyAppointments from './pages/MyAppointments';
import Reviews from './pages/Reviews';
import Professional from './pages/Professional';
import Terms from './pages/Terms';
import Products from './pages/Products';
import BookAppointment from './pages/BookAppointment';
import BottomNav from './components/BottomNav';
import WhatsAppButton from './components/WhatsAppButton';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/inicio" element={<Home />} />
          <Route path="/turnos" element={<SelectService />} />
          <Route path="/servicio/:id" element={<ServiceDetail />} />
          <Route path="/fecha-hora" element={<SelectDateTime />} />
          <Route path="/datos" element={<ClientData />} />
          <Route path="/confirmacion" element={<Confirmation />} />
          <Route path="/mis-turnos" element={<MyAppointments />} />
          <Route path="/resenas" element={<Reviews />} />
          <Route path="/profesional" element={<Professional />} />
          <Route path="/bases-condiciones" element={<Terms />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/reservar" element={<BookAppointment />} />
        </Routes>
        <WhatsAppButton />
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
