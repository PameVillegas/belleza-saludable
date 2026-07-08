import { useNavigate } from 'react-router-dom';

function Professional() {
  const navigate = useNavigate();

  const stats = [
    { icon: '📅', value: 'Desde 2013', label: 'Trayectoria' },
    { icon: '🎓', value: 'M.P. 6495', label: 'Matrícula' },
    { icon: '💎', value: '100%', label: 'Personalizado' },
  ];

  const formations = [
    { title: 'Tecnicatura en Cosmetología Facial y Corporal', detail: 'Universidad del Gran Rosario (UGR) – Cursando actualmente' },
    { title: 'Formación Avanzada en Dermatocosmiatría', detail: 'Academia Iberoamericana de Dermatocosmiatría Aplicada (2026-2028)' },
    { title: 'Cosmiatría', detail: 'Escuela Latinoamericana de Dermatología (2024-2026). Pasantía clínica en Hospital Houssay, Vicente López, Bs. As.' },
    { title: 'Cosmetología & Cosmiatría', detail: 'Instituto ISCI, Buenos Aires (2013)' },
  ];

  const specializations = [
    'Exosomas y biotecnología avanzada',
    'Master en Peelings Químicos',
    'Protocolos de última generación',
    'Activos cosmecéuticos de alta gama',
  ];

  return (
    <div className="professional-page fade-up">
      {/* Header con foto */}
      <div className="prof-header">
        <img src="/Mari2.png" alt="Mariana Farias" className="prof-photo" />
        <h2 className="prof-name">Mariana Farias</h2>
        <p className="prof-specialty">Cosmiatría Clínica & Estética Avanzada</p>
        <p className="prof-matricula">M.P. N° 6495 · Provincia de Buenos Aires</p>
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

      {/* Sobre mí */}
      <div className="prof-section">
        <div className="prof-section-header">
          <span className="prof-section-icon">🌸</span>
          <h3 className="prof-section-title">Sobre mí</h3>
        </div>
        <p className="prof-section-text">
          Con una trayectoria sólida desde el año 2013, mi enfoque profesional integra la salud cutánea con la biotecnología aplicada. Soy propietaria de Belleza Saludable, un espacio dedicado a la estética de alta precisión.
        </p>
      </div>

      {/* Formación */}
      <div className="prof-section">
        <div className="prof-section-header">
          <span className="prof-section-icon">🎓</span>
          <h3 className="prof-section-title">Formación Académica</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {formations.map((f, i) => (
            <div key={i} style={{ paddingLeft: '0.5rem', borderLeft: '3px solid #FCE7F3' }}>
              <p style={{ fontSize: '0.84rem', fontWeight: 600, color: '#DB2777', marginBottom: '0.15rem' }}>{f.title}</p>
              <p style={{ fontSize: '0.76rem', color: '#6B7280', lineHeight: '1.4' }}>{f.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Especialización */}
      <div className="prof-section">
        <div className="prof-section-header">
          <span className="prof-section-icon">🏆</span>
          <h3 className="prof-section-title">Especialización</h3>
        </div>
        <p className="prof-section-text" style={{ marginBottom: '0.75rem' }}>
          Mi práctica profesional se distingue por la actualización constante en protocolos y el uso de activos de última generación, garantizando tratamientos avalados por el rigor académico y la vasta experiencia en gabinete.
        </p>
        <div className="prof-formation-list">
          {specializations.map((s, i) => (
            <span key={i} className="prof-formation-tag">{s}</span>
          ))}
        </div>
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
