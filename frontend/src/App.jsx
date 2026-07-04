import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SelectService from './pages/SelectService';
import SelectDateTime from './pages/SelectDateTime';
import ClientData from './pages/ClientData';
import Confirmation from './pages/Confirmation';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SelectService />} />
          <Route path="fecha-hora" element={<SelectDateTime />} />
          <Route path="datos" element={<ClientData />} />
          <Route path="confirmacion" element={<Confirmation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
