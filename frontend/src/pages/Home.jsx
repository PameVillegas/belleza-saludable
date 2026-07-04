import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Home() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');
  const firstName = clientSession?.name?.split(' ')[0] || '';

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <div className="home-page">
      {/* Top Nav */}
      <nav className="top-nav">
        <div className="top-nav-logo">
          <img src="/logobelleza.jpg" alt="Belleza Saludable" />
          <span>Belleza Saludable</span>
        </div>
        <div className="top-nav-links">
          <button onClick={() => navigate('/turnos')}>Servicios</button>
          <button onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })}>Sobre mí</button>
          <button onClick={() => navigate('/resenas')}>Testimonios</button>
          <button onClick={() => navigate('/mis-turnos')} className="top-nav-outline">Mis Turnos</button>
          <button onClick={() => navigate('/turnos')} className="top-nav-primary">Reservar Turno</button>
        </div>
      </nav>

      {firstName && (
        <div className="greeting-bar">✨ Bienvenida, <strong>{firstName}</strong></div>
      )}

      {/* Hero - Imagen full width */}
      <section className="hero-full">
        <img src="/fotoportada.png" alt="Tratamiento facial profesional" className="hero-full-img" />
        <div className="hero-full-overlay">
          <p className="hero-label">BIENVENIDA A BELLEZA SALUDABLE</p>
          <h1 className="hero-full-title">Realzá tu belleza con tratamientos personalizados</h1>
          <p className="hero-full-sub">Cosmiatría · Limpiezas faciales · Dermaplaning · Turnos online</p>
          <button className="hero-btn" onClick={() => navigate('/turnos')}>
            📅 Reservar Turno
          </button>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="trust-badges">
        <div className="trust-badge"><span className="trust-icon">🎯</span><div><strong>Atención Personalizada</strong></div></div>
        <div className="trust-badge"><span className="trust-icon">✅</span><div><strong>Productos Profesionales</strong></div></div>
        <div className="trust-badge"><span className="trust-icon">⭐</span><div><strong>Resultados Comprobados</strong></div></div>
      </section>

      {/* Servicios */}
      <section className="section" style={{ background: 'var(--color-white)' }}>
        <h2 className="section-title">Nuestros Tratamientos</h2>
        <p className="section-subtitle">Cada servicio diseñado para tu bienestar</p>
        <div className="services-cards-grid">
          {services.map(service => (
            <div key={service.id} className="service-card-v2">
              <div className="service-card-v2-body">
                <h3 className="service-card-v2-name">{service.name}</h3>
                <p className="service-card-v2-desc">{service.description?.slice(0, 90)}{service.description?.length > 90 ? '...' : ''}</p>
                <div className="service-card-v2-meta">
                  <span>⏱ {service.duration_minutes} min</span>
                  <span>{Number(service.price) > 0 ? `$${Number(service.price).toLocaleString()}` : 'Consultar'}</span>
                </div>
              </div>
              <button className="service-card-v2-btn" onClick={() => navigate(`/servicio/${service.id}`)}>
                Más información →
              </button>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="btn btn-primary" onClick={() => navigate('/turnos')}>
            Ver todos los tratamientos
          </button>
        </div>
      </section>

      {/* Sobre la profesional */}
      <section className="section section-beige" id="about-section">
        <div className="about-grid">
          <div className="about-image">
            <img src="/logobelleza.jpg" alt="Mariana Farias" />
          </div>
          <div className="about-text">
            <h2 className="section-title" style={{ textAlign: 'left' }}>Sobre la profesional</h2>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--color-text)' }}>Mariana Farias</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: '1.7', marginBottom: '0.75rem' }}>
              Cosmetóloga, Cosmiatra y especialista en Dermatocosmiatría con más de 8 años de experiencia en el cuidado de la piel.
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: '1.7', marginBottom: '0.75rem' }}>
              Mi filosofía es que cada piel es única y merece un tratamiento personalizado. Trabajo con los mejores productos cosmecéuticos para lograr resultados reales y duraderos.
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: '1.7' }}>
              <strong>Formación:</strong> Cosmetología | Cosmiatría | Dermatocosmiatría | Microneedling avanzado | Peelings químicos
            </p>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="section">
        <h2 className="section-title">Lo que dicen nuestras clientas</h2>
        <p className="section-subtitle">Experiencias reales de quienes confían en nosotras</p>
        <div className="testimonials-grid">
          <div className="testimonial-card-v2">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">"Excelente atención, mi piel cambió muchísimo. Se nota la dedicación y el profesionalismo en cada sesión."</p>
            <p className="testimonial-author"><strong>María L.</strong> · Limpieza Facial</p>
          </div>
          <div className="testimonial-card-v2">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">"Los tratamientos faciales son increíbles. Mariana te explica todo y te hace sentir muy cómoda."</p>
            <p className="testimonial-author"><strong>Carolina P.</strong> · Peelings Químicos</p>
          </div>
          <div className="testimonial-card-v2">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">"Las ondas rusas y presoterapia cambiaron mi cuerpo. Los resultados son notorios. Super recomendable."</p>
            <p className="testimonial-author"><strong>Luciana M.</strong> · Ondas Rusas</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/resenas')}>Ver todas las reseñas</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-v2">
        <div className="footer-v2-stats">
          <div className="footer-stat-v2"><span>⭐</span><strong>+8 años de experiencia</strong></div>
          <div className="footer-stat-v2"><span>❤️</span><strong>Miles de clientas satisfechas</strong></div>
          <div className="footer-stat-v2"><span>✅</span><strong>Higiene y seguridad garantizadas</strong></div>
        </div>
        <div className="footer-v2-content">
          <div className="footer-v2-info">
            <h4>Belleza Saludable</h4>
            <p>📍 Calle 30 N°416, entre calle 9 y 11</p>
            <p>📱 3388-403225 (Solo WhatsApp)</p>
            <p>🕐 Lun a Vie: 9 a 12hs y 14 a 19hs</p>
            <p>🚫 Sáb, Dom y Feriados: cerrado</p>
          </div>
          <div className="footer-v2-social">
            <p>Seguinos en</p>
            <div className="footer-social">
              <a href="https://www.instagram.com/bellezasaludableameghino?igsh=MTduOHVqNGRoNjRuZw==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">📷</a>
              <a href="https://wa.me/543388403225" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">💬</a>
            </div>
          </div>
        </div>
        <div className="footer-v2-copy">
          <p>© 2026 Belleza Saludable. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
