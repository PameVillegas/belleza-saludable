import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: '1rem' }}>
        <h1>Belleza Saludable</h1>
        <p style={{ color: 'var(--color-text-light)' }}>Reservá tu turno online</p>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
