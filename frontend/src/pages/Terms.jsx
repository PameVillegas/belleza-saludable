import { useNavigate } from 'react-router-dom';

function Terms() {
  const navigate = useNavigate();

  const rules = [
    {
      icon: '⏰',
      title: 'Puntualidad y Compromiso',
      text: 'Te recomendamos llegar a la hora acordada. Tu turno es un espacio reservado exclusivamente para vos, y la puntualidad nos permite cumplir con el protocolo completo de tu tratamiento.'
    },
    {
      icon: '⚠️',
      title: 'Tolerancia de Espera',
      text: 'Contamos con una tolerancia de 10-15 minutos. Pasado ese lapso, el turno podrá verse reducido en su duración o deberá ser reprogramado para no afectar el horario de la siguiente paciente.'
    },
    {
      icon: '❌',
      title: 'Cancelaciones y Reprogramaciones',
      text: 'El compromiso es mutuo. Si necesitás cancelar o modificar tu cita, te pedimos que lo hagas con al menos 24 horas de anticipación. Esto nos permite reasignar el espacio a otra persona que lo necesite.'
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
