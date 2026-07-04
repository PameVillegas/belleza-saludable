import { useNavigate } from 'react-router-dom';

function Terms() {
  const navigate = useNavigate();

  return (
    <div className="booking-container fade-up">
      <div className="booking-header">
        <h2 className="booking-title">📜 Bases y Condiciones</h2>
        <p className="booking-subtitle">Información importante sobre nuestros turnos</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', background: 'var(--color-beige)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ❌ Cancelación de turnos
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.7' }}>
            Si no podés asistir a tu turno, recordá <strong>cancelarlo con antelación</strong> avisando por WhatsApp al 3388-403225. Esto nos permite reorganizar la agenda y darle lugar a otra persona interesada.
          </p>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: 'var(--color-beige)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⏰ Puntualidad
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.7' }}>
            Te pedimos que <strong>asistas 10 minutos antes</strong> del horario de tu turno para poder comenzar a tiempo y aprovechar al máximo la sesión.
          </p>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: 'var(--color-beige)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Tolerancia de espera
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.7' }}>
            Se espera un máximo de <strong>10 minutos</strong> de tolerancia. Pasado ese tiempo, el turno se dará por perdido y no podrá ser reprogramado automáticamente.
          </p>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: 'var(--color-beige)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🤝 Compromiso mutuo
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.7' }}>
            Estas condiciones nos ayudan a brindar un mejor servicio a todas nuestras clientas. Agradecemos tu comprensión y colaboración.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/inicio')}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default Terms;
