import { useNavigate } from 'react-router-dom';

function Terms() {
  const navigate = useNavigate();

  const rules = [
    {
      icon: '❌',
      title: 'Cancelación de turnos',
      text: 'Si no podés asistir a tu turno, recordá cancelarlo con antelación avisando por WhatsApp al 3388-403225. Esto nos permite reorganizar la agenda y darle lugar a otra persona interesada.'
    },
    {
      icon: '⏰',
      title: 'Puntualidad',
      text: 'Te pedimos que asistas 10 minutos antes del horario de tu turno para poder comenzar a tiempo y aprovechar al máximo la sesión.'
    },
    {
      icon: '⚠️',
      title: 'Tolerancia de espera',
      text: 'Se espera un máximo de 10 minutos de tolerancia. Pasado ese tiempo, el turno se dará por perdido y no podrá ser reprogramado automáticamente.'
    },
    {
      icon: '🤝',
      title: 'Compromiso mutuo',
      text: 'Estas condiciones nos ayudan a brindar un mejor servicio a todas nuestras clientas. Agradecemos tu comprensión y colaboración.'
    },
  ];

  return (
    <div className="professional-page fade-up">
      {/* Header */}
      <div className="prof-header" style={{ marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📜</span>
        <h2 className="prof-name">Bases y Condiciones</h2>
        <p className="prof-specialty">Información importante sobre nuestros turnos</p>
      </div>

      {/* Reglas */}
      {rules.map((rule, i) => (
        <div key={i} className="prof-section">
          <div className="prof-section-header">
            <span className="prof-section-icon">{rule.icon}</span>
            <h3 className="prof-section-title">{rule.title}</h3>
          </div>
          <p className="prof-section-text">{rule.text}</p>
        </div>
      ))}

      <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/inicio')}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default Terms;
