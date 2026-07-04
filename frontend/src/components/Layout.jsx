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
          <p className="app-subtitle">Reservá tu turno online</p>
        </header>
        <main>
          <Outlet />
        </main>
        <footer className="admin-footer">
          <button className="btn btn-admin" onClick={handleAdminClick}>
            🔒 Admin
          </button>
        </footer>
      </div>
    </div>
  );
}

export default Layout;
