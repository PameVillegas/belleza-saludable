import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');

  useEffect(() => {
    if (!clientSession) {
      navigate('/');
      return;
    }

    // Buscar turnos por teléfono o email del cliente logueado
    const searchValue = clientSession.phone || clientSession.email;

    fetch(`/api/appointments/my?search=${encodeURIComponent(searchValue)}`)
      .then(res => res.json())
      .then(data => {
        setAppointments(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar tus turnos.');
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr.split('T')[0] + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusLabel = (status) => {
    if (status === 'confirmed') return { text: 'Confirmado', color: 'var(--color-success)' };
    if (status === 'cancelled') return { text: 'Cancelado', color: 'var(--color-error)' };
    return { text: 'Completado', color: 'var(--color-sage)' };
  };

  if (loading) return <div className="loading">Cargando tus turnos...</div>;

  return (
    <div className="booking-container fade-up">
      <div className="booking-header">
        <h2 className="booking-title">Mis turnos</h2>
        <p className="booking-subtitle">Hola {clientSession?.name?.split(' ')[0]}, acá está tu historial</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {appointments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Todavía no tenés turnos reservados.</p>
          <button className="btn btn-primary" onClick={() => navigate('/turnos')}>
            Reservar mi primer turno
          </button>
        </div>
      )}

      {appointments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {appointments.map((appt, i) => {
            const status = getStatusLabel(appt.status);
            return (
              <div key={i} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{appt.service_name}</strong>
                  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '20px', background: status.color + '1a', color: status.color, fontWeight: 500 }}>
                    {status.text}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span>📅 {formatDate(appt.date)}</span>
                  <span>⏰ {appt.start_time.slice(0,5)} - {appt.end_time.slice(0,5)} ({appt.duration_minutes} min)</span>
                  {Number(appt.service_price) > 0 && <span>💰 ${Number(appt.service_price).toLocaleString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyAppointments;
