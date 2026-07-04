import { Outlet } from 'react-router-dom';

function Layout() {
  const handleAdminClick = () => {
    window.location.href = '/panel.html';
  };

  return (
    <div className="app-wrapper">
      <div className="container">
        <header className="app-header">
          <img src="/logobelleza.jpg" alt="Belleza Saludable" className="app-logo" />
          <h1 className="app-title">Belleza Saludable</h1>
          <p className="app-subtitle">Cosmetología · Cosmiatría · Dermatocosmiatría</p>
          <p className="app-info">
            📍 Calle 30 N°416 &nbsp;|&nbsp; 📱 3388-403225
          </p>
          <p className="app-info">
            🕐 Lun a Vie: 9 a 12hs y 14 a 19hs
          </p>
        </header>
        <main>
          <Outlet />
        </main>
        <footer className="app-footer">
          <p className="cancel-notice">
            ⚠️ Si no podés asistir, por favor cancelá tu turno con anticipación para que otra persona pueda tomarlo.
          </p>
          <button className="btn btn-admin" onClick={handleAdminClick}>
            🔒 Admin
          </button>
        </footer>
      </div>
    </div>
  );
}

export default Layout;
