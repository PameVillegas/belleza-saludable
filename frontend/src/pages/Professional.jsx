import { useNavigate } from 'react-router-dom';

function Professional() {
  const navigate = useNavigate();

  const stats = [
    { icon: '👥', value: '+150', label: 'Clientes' },
    { icon: '⏱', value: '8 años', label: 'Experiencia' },
    { icon: '💎', value: '100%', label: 'Personalizado' },
  ];

  const formations = [
    'Cosmetología',
    'Cosmiatría',
    'Dermatocosmiatría',
    'Microneedling avanzado',
    'Peelings químicos',
    'Aparatología corporal',
    'Bioregeneración con Exosomas',
    'Dermapen profesional',
  ];

  return (
    <div className="professional-page fade-up">
      {/* Header con foto */}
      <div className="prof-header">
        <img src="/mari.png" alt="Mariana Farias" className="prof-photo" />
        <h2 className="prof-name">Mariana Farias</h2>
        <p className="prof-specialty">Cosmetóloga · Cosmiatra · Dermatocosmiatría</p>
        <p className="prof-matricula">MP 1234 · Certificada en Dermapen y Peelings Avanzados</p>
      </div>

      {/* Estadísticas */}
      <div className="prof-stats">
        {stats.map((s, i) => (
          <div key={i} className="prof-stat">
            <span className="prof-stat-icon">{s.icon}</span>
            <span className="prof-stat-value">{s.value}</span>
            <span className="prof-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Experiencia */}
      <div className="prof-section">
        <div className="prof-section-header">
          <span className="prof-section-icon">🏆</span>
          <h3 className="prof-section-title">Experiencia</h3>
        </div>
        <p className="prof-section-text">
          Más de 8 años dedicada al cuidado de la piel, con formación continua en las últimas tecnologías y técnicas de la cosmiatría.
        </p>
      </div>

      {/* Formación */}
      <div className="prof-section">
        <div className="prof-section-header">
          <span className="prof-section-icon">🎓</span>
          <h3 className="prof-section-title">Formación</h3>
        </div>
        <div className="prof-formation-list">
          {formations.map((f, i) => (
            <span key={i} className="prof-formation-tag">{f}</span>
          ))}
        </div>
      </div>

      {/* Filosofía */}
      <div className="prof-section">
        <div className="prof-section-header">
          <span className="prof-section-icon">🌸</span>
          <h3 className="prof-section-title">Filosofía de trabajo</h3>
        </div>
        <p className="prof-section-text">
          Cada piel es única y merece un tratamiento personalizado. Trabajo con los mejores productos cosmecéuticos de laboratorios como ONCE, Le Lab Beauté, Idraet y Miradror para lograr resultados reales y duraderos.
        </p>
      </div>

      {/* Consultorio */}
      <div className="prof-section">
        <div className="prof-section-header">
          <span className="prof-section-icon">📍</span>
          <h3 className="prof-section-title">Consultorio</h3>
        </div>
        <div className="prof-info-list">
          <div className="prof-info-item">
            <span>📍</span>
            <span>Calle 30 N°416, entre calle 9 y 11</span>
          </div>
          <div className="prof-info-item">
            <span>📱</span>
            <span>3388-403225 (Solo WhatsApp)</span>
          </div>
          <div className="prof-info-item">
            <span>🕐</span>
            <span>Lunes a Viernes: 9 a 12hs y 14 a 19hs</span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/inicio')}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default Professional;
