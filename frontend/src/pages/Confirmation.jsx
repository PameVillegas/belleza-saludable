import { useNavigate } from 'react-router-dom';

function Confirmation() {
  const navigate = useNavigate();
  const service = JSON.parse(sessionStorage.getItem('selectedService') || 'null');
  const date = sessionStorage.getItem('selectedDate');
  const slot = JSON.parse(sessionStorage.getItem('selectedSlot') || 'null');
  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');

  if (!service || !date || !slot) {
    navigate('/inicio');
    return null;
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleNewBooking = () => {
    sessionStorage.removeItem('selectedService');
    sessionStorage.removeItem('selectedDate');
    sessionStorage.removeItem('selectedSlot');
    navigate('/inicio');
  };

  return (
    <div className="booking-container fade-up" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} role="img" aria-label="Turno confirmado">✅</div>
      <h1 className="booking-title" style={{ marginBottom: '0.5rem' }}>¡Turno confirmado!</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Tu reserva fue registrada exitosamente
      </p>

      <section aria-label="Resumen de tu turno" className="card" style={{ textAlign: 'left', marginBottom: '2rem', background: 'var(--color-beige)' }}>
        <h2 style={{ marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Resumen de tu turno</h2>
        <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
          {clientSession && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <dt><strong><span aria-hidden="true">👤</span> Cliente:</strong></dt>
              <dd>{clientSession.name}</dd>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <dt><strong><span aria-hidden="true">💆</span> Servicio:</strong></dt>
            <dd>{service.name}</dd>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <dt><strong><span aria-hidden="true">📅</span> Día:</strong></dt>
            <dd>{formatDate(date)}</dd>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <dt><strong><span aria-hidden="true">⏰</span> Horario:</strong></dt>
            <dd>{slot.start} - {slot.end} hs</dd>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <dt><strong><span aria-hidden="true">⏱</span> Duración:</strong></dt>
            <dd>{service.duration_minutes} minutos</dd>
          </div>
          {Number(service.price) > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <dt><strong><span aria-hidden="true">💰</span> Precio:</strong></dt>
              <dd>${Number(service.price).toLocaleString()}</dd>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <dt><strong><span aria-hidden="true">📍</span> Dirección:</strong></dt>
            <dd>Calle 30 N°416, entre calle 9 y 11</dd>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <dt><strong><span aria-hidden="true">📱</span> WhatsApp:</strong></dt>
            <dd>3388-403225</dd>
          </div>
        </dl>
      </section>

      <div className="cancel-notice" style={{ marginTop: 0, marginBottom: '1.5rem' }} role="note">
        <span aria-hidden="true">⚠️</span> Si no podés asistir, avisanos con anticipación por WhatsApp al 3388-403225 para cancelar y dar lugar a otra persona.
      </div>

      <button className="btn btn-primary" onClick={handleNewBooking} style={{ width: '100%' }}>
        Volver al inicio
      </button>
    </div>
  );
}

export default Confirmation;
