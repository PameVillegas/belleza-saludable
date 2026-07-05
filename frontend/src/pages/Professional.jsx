import { useNavigate } from 'react-router-dom';

function Professional() {
  const navigate = useNavigate();

  return (
    <div className="booking-container fade-up">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img src="/profesional.png" alt="Mariana Farias" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '3px solid white', marginBottom: '1rem' }} />
        <h2 className="booking-title">Mariana Farias</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-sage-dark)', fontWeight: 500 }}>Cosmetóloga · Cosmiatra · Dermatocosmiatría</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>MP 1234 · Certificada en Dermapen y Peelings Avanzados</p>
      </div>

      <div className="card" style={{ marginBottom: '1rem', background: 'var(--color-beige)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.5rem' }}>Experiencia</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
          Más de 8 años dedicada al cuidado de la piel, con formación continua en las últimas tecnologías y técnicas de la cosmiatría.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1rem', background: 'var(--color-beige)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.5rem' }}>Formación</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
          Cosmetología · Cosmiatría · Dermatocosmiatría · Microneedling avanzado · Peelings químicos · Aparatología corporal · Bioregeneración con Exosomas
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1rem', background: 'var(--color-beige)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.5rem' }}>Filosofía de trabajo</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
          Cada piel es única y merece un tratamiento personalizado. Trabajo con los mejores productos cosmecéuticos de laboratorios como ONCE, Le Lab Beauté, Idraet y Miradror para lograr resultados reales y duraderos.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--color-beige)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.5rem' }}>Consultorio</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
          📍 Calle 30 N°416, entre calle 9 y 11<br />
          📱 3388-403225 (Solo WhatsApp)<br />
          🕐 Lunes a Viernes: 9 a 12hs y 14 a 19hs
        </p>
      </div>

      <button className="btn btn-secondary" onClick={() => navigate('/inicio')} style={{ width: '100%' }}>
        ← Volver al inicio
      </button>
    </div>
  );
}

export default Professional;
