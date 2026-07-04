import { useNavigate } from 'react-router-dom';

function Confirmation() {
  const navigate = useNavigate();
  const service = JSON.parse(sessionStorage.getItem('selectedService') || 'null');
  const date = sessionStorage.getItem('selectedDate');
  const slot = JSON.parse(sessionStorage.getItem('selectedSlot') || 'null');

  if (!service || !date || !slot) {
    navigate('/');
    return null;
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleNewBooking = () => {
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
      <h2 style={{ marginBottom: '0.5rem' }}>¡Turno confirmado!</h2>
      <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
        Tu reserva fue registrada exitosamente.
      </p>

      <div className="card" style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Resumen de tu turno</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
          <p><strong>Servicio:</strong> {service.name}</p>
          <p><strong>Fecha:</strong> {formatDate(date)}</p>
          <p><strong>Horario:</strong> {slot.start} hs</p>
          <p><strong>Duración:</strong> {service.duration_minutes} minutos</p>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleNewBooking}>
        Reservar otro turno
      </button>
    </div>
  );
}

export default Confirmation;
