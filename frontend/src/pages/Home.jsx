import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');
  const firstName = clientSession?.name?.split(' ')[0] || '';

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const sections = [
    { bg: '/portadatrata.png', label: 'Tratamientos', path: '/turnos' },
    { bg: '/portadaturno.png', label: 'Reservar Turno', path: '/reservar', highlighted: true },
    { bg: '/portadaproduc.png', label: 'Productos', path: '/productos' },
    { bg: '/portadaprofes.png', label: 'Profesional', path: '/profesional' },
    { bg: '/portadareseñas.png', label: 'Reseñas', path: '/resenas' },
    { bg: '/portadamisturnos.png', label: 'Mis Turnos', path: '/mis-turnos' },
    { bg: '/portadabases.png', label: 'Bases y Condiciones', path: '/bases-condiciones' },
    { bg: '/portadagift.png', label: 'Voucher / Gift Card', path: '/voucher' },
  ];

  return (
    <div className="home-page fade-in">
      {/* Skip to main content */}
      <a href="#main-content" className="skip-link">Ir al contenido principal</a>

      {/* Header */}
      <header className="home-header" role="banner">
        <button
          className="home-header-left"
          onClick={() => navigate('/inicio')}
          aria-label="Ir a inicio - Belleza Saludable"
          style={{ cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
        >
          <img src="/logobelleza.jpg" alt="" role="presentation" className="home-header-logo" />
          <div>
            <span className="home-header-name">Belleza Saludable</span>
            <span className="home-header-tagline">Cosmiatría · Estética · Bienestar</span>
          </div>
        </button>
        <button className="home-logout-btn" onClick={handleLogout} aria-label="Cerrar sesión">
          Cerrar sesión
        </button>
      </header>

      {/* Banner con saludo */}
      <div className="home-banner" role="img" aria-label={`Bienvenida${firstName ? `, ${firstName}` : ''} a Belleza Saludable`}>
        <img src="/fotoportada2.png" alt="" role="presentation" className="home-banner-img" />
        <div className="home-banner-overlay">
          <div className="home-banner-text">
            <h1 className="home-greeting-title">Bienvenida{firstName ? `, ${firstName}` : ''} ✨</h1>
            <p className="home-greeting-subtitle">Un espacio pensado para vos</p>
          </div>
        </div>
      </div>

      {/* Grid de secciones */}
      <main id="main-content">
        <nav aria-label="Secciones principales">
          <div className="home-grid">
            {sections.map((item) => (
              <button
                key={item.label}
                className={`home-grid-item ${item.highlighted ? 'highlighted' : ''}`}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                style={item.bg ? { backgroundImage: `url(${item.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              >
                <div className="home-grid-overlay" aria-hidden="true"></div>
                <span className="home-grid-label" aria-hidden="true">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Info rápida */}
        <div className="home-info-bar" aria-label="Información de contacto">
          <span><span aria-hidden="true">📍</span> Calle 30 N°416</span>
          <span><span aria-hidden="true">🕐</span> Lun a Vie: 9-12 y 14-19hs</span>
        </div>

        {/* Redes */}
        <div className="home-social">
          <a href="https://www.instagram.com/bellezasaludableameghino?igsh=MTduOHVqNGRoNjRuZw==" target="_blank" rel="noopener noreferrer" className="social-btn instagram" aria-label="Seguinos en Instagram (abre en nueva pestaña)">
            <span aria-hidden="true">📷</span> Instagram
          </a>
          <a href="https://wa.me/543388403225" target="_blank" rel="noopener noreferrer" className="social-btn whatsapp" aria-label="Contactar por WhatsApp (abre en nueva pestaña)">
            <span aria-hidden="true">💬</span> WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}

export default Home;
