import { useNavigate } from 'react-router-dom';

function Professional() {
  const navigate = useNavigate();

  const stats = [
    { icon: '📅', value: 'Desde 2013', label: 'Trayectoria' },
    { icon: '👥', value: '+100', label: 'Clientes' },
    { icon: '💎', value: '100%', label: 'Personalizado' },
  ];

  const formations = [
    { title: 'Tecnicatura en Cosmetología Facial y Corporal', detail: 'Universidad del Gran Rosario (UGR) – Cursando actualmente' },
    { title: 'Formación Avanzada en Dermatocosmiatría', detail: 'Academia Iberoamericana de Dermatocosmiatría Aplicada (Ciclo 2026-2028)' },
    { title: 'Cosmiatría', detail: 'Graduada de la Escuela Latinoamericana de Dermatología (2024-2026). Pasantía clínica en Hospital Houssay, Vicente López, Buenos Aires.' },
    { title: 'Cosmetología & Cosmiatría', detail: 'Certificación profesional emitida por el Instituto ISCI (Buenos Aires, 2013)' },
  ];

  return (
    <main className="professional-page fade-up" id="main-content">
      {/* Header con foto */}
      <header className="prof-header">
        <img src="/Mari2.png" alt="Mariana Farias, cosmiatría clínica" className="prof-photo" />
        <h1 className="prof-name">Mariana Farias</h1>
        <p className="prof-specialty">Cosmiatría Clínica &amp; Estética Avanzada</p>
        <p className="prof-matricula">M.P. N° 6495 · Provincia de Buenos Aires</p>
      </header>

      {/* Estadísticas */}
      <div className="prof-stats" role="list" aria-label="Estadísticas profesionales">
        {stats.map((s, i) => (
          <div key={i} className="prof-stat" role="listitem">
            <span className="prof-stat-icon" aria-hidden="true">{s.icon}</span>
            <span className="prof-stat-value">{s.value}</span>
            <span className="prof-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Sobre mí */}
      <section className="prof-section" aria-labelledby="about-heading">
        <div className="prof-section-header">
          <span className="prof-section-icon" aria-hidden="true">🌸</span>
          <h2 id="about-heading" className="prof-section-title">Sobre mí</h2>
        </div>
        <p className="prof-section-text">
          Con una trayectoria sólida desde el año 2013, mi enfoque profesional integra la salud cutánea con la biotecnología aplicada. Soy propietaria de Belleza Saludable, un espacio dedicado a la estética de alta precisión bajo la M.P. N° 6495 (Prov. de Buenos Aires).
        </p>
      </section>

      {/* Formación */}
      <section className="prof-section" aria-labelledby="formation-heading">
        <div className="prof-section-header">
          <span className="prof-section-icon" aria-hidden="true">🎓</span>
          <h2 id="formation-heading" className="prof-section-title">Formación Académica y Clínica</h2>
        </div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none', padding: 0, margin: 0 }}>
          {formations.map((f, i) => (
            <li key={i} style={{ paddingLeft: '0.5rem', borderLeft: '3px solid #FCE7F3' }}>
              <p style={{ fontSize: '0.84rem', fontWeight: 600, color: '#DB2777', marginBottom: '0.15rem' }}>{f.title}</p>
              <p style={{ fontSize: '0.76rem', color: '#6B7280', lineHeight: '1.4' }}>{f.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Especialización y Práctica */}
      <section className="prof-section" aria-labelledby="specialization-heading">
        <div className="prof-section-header">
          <span className="prof-section-icon" aria-hidden="true">🏆</span>
          <h2 id="specialization-heading" className="prof-section-title">Especialización y Práctica</h2>
        </div>
        <p className="prof-section-text" style={{ marginBottom: '0.75rem' }}>
          Mi práctica profesional se caracteriza por la actualización permanente en cosmetología y cosmiatría clínica, incorporando protocolos basados en evidencia científica y activos biotecnológicos de última generación, como exosomas y otros bioactivos avanzados. Como Master en Peelings Químicos, desarrollo tratamientos personalizados orientados a mejorar la salud y la calidad de la piel con un enfoque seguro, ético y profesional.
        </p>
        <p className="prof-section-text">
          La atención comienza con una evaluación integral de cada paciente, permitiendo diseñar un plan de tratamiento acorde a sus necesidades y dentro de mi ámbito de competencia. Cuando durante la evaluación se identifican alteraciones o patologías cutáneas que requieren diagnóstico o tratamiento médico, se realiza la derivación correspondiente al especialista, promoviendo un abordaje interdisciplinario que prioriza la seguridad y el bienestar del paciente.
        </p>
      </section>

      {/* Consultorio */}
      <section className="prof-section" aria-labelledby="office-heading">
        <div className="prof-section-header">
          <span className="prof-section-icon" aria-hidden="true">📍</span>
          <h2 id="office-heading" className="prof-section-title">Consultorio</h2>
        </div>
        <address className="prof-info-list" style={{ fontStyle: 'normal' }}>
          <div className="prof-info-item">
            <span aria-hidden="true">📍</span>
            <span>Calle 30 N°416, entre calle 9 y 11</span>
          </div>
          <div className="prof-info-item">
            <span aria-hidden="true">📱</span>
            <span>3388-403225 (Solo WhatsApp)</span>
          </div>
          <div className="prof-info-item">
            <span aria-hidden="true">🕐</span>
            <span>Lunes a Viernes: 9 a 12hs y 14 a 19hs</span>
          </div>
        </address>
      </section>

      <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/inicio')}>
          ← Volver al inicio
        </button>
      </div>
    </main>
  );
}

export default Professional;
