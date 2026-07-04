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
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
      <h2 className="booking-title" style={{ marginBottom: '0.5rem' }}>¡Turno confirmado!</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Tu reserva fue registrada exitosamente
      </p>

      <div className="card" style={{ textAlign: 'left', marginBottom: '2rem', background: 'var(--color-beige)' }}>
        <h3 style={{ marginBottom: '0.75rem', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Resumen de tu turno</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
          {clientSession && <p><strong>👤 Cliente:</strong> {clientSession.name}</p>}
          <p><strong>💆 Servicio:</strong> {service.name}</p>
          <p><strong>📅 Día:</strong> {formatDate(date)}</p>
          <p><strong>⏰ Horario:</strong> {slot.start} - {slot.end} hs</p>
          <p><strong>⏱ Duración:</strong> {service.duration_minutes} minutos</p>
          {Number(service.price) > 0 && <p><strong>💰 Precio:</strong> ${Number(service.price).toLocaleString()}</p>}
          <p><strong>📍 Dirección:</strong> Calle 30 N°416, entre calle 9 y 11</p>
          <p><strong>📱 WhatsApp:</strong> 3388-403225</p>
        </div>
      </div>

      <div className="cancel-notice" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
        ⚠️ Si no podés asistir, avisanos con anticipación por WhatsApp al 3388-403225 para cancelar y dar lugar a otra persona.
      </div>

      <button className="btn btn-primary" onClick={handleNewBooking} style={{ width: '100%' }}>
        Volver al inicio
      </button>
    </div>
  );
}

export default Confirmation;
