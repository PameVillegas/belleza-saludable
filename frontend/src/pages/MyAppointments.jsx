import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();

  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');

  useEffect(() => {
    if (!clientSession) {
      navigate('/');
      return;
    }
    loadAppointments();
  }, []);

  const loadAppointments = () => {
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
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr.split('T')[0] + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusLabel = (status) => {
    if (status === 'confirmed') return { text: 'Confirmado', color: 'var(--color-success)' };
    if (status === 'cancelled') return { text: 'Cancelado', color: 'var(--color-error)' };
    return { text: 'Completado', color: 'var(--color-sage)' };
  };

  const canModify = (appt) => {
    if (appt.status !== 'confirmed') return false;
    const apptDate = new Date(appt.date.split('T')[0] + 'T' + appt.start_time);
    return apptDate > new Date();
  };

  const handleCancel = async (appt) => {
    if (!confirm(`¿Cancelar tu turno de ${appt.service_name} el ${formatDate(appt.date)}?`)) return;
    setProcessing(appt.id);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${appt.id}/cancel-client`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clientSession.phone })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo cancelar el turno.');
        setProcessing(null);
        return;
      }
      setSuccess('Turno cancelado correctamente.');
      loadAppointments();
    } catch {
      setError('Error de conexión.');
    }
    setProcessing(null);
  };

  const openReschedule = (appt) => {
    setRescheduleAppt(appt);
    setNewDate('');
    setNewTime('');
    setAvailableSlots([]);
    setError(null);
  };

  const handleDateChange = async (date) => {
    setNewDate(date);
    setNewTime('');
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/availability/${rescheduleAppt.service_id}/${date}`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch {
      setAvailableSlots([]);
    }
    setLoadingSlots(false);
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      setError('Seleccioná una fecha y horario.');
      return;
    }
    setProcessing(rescheduleAppt.id);
    setError(null);
    try {
      const slot = availableSlots.find(s => s.start === newTime);
      const res = await fetch(`/api/appointments/${rescheduleAppt.id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clientSession.phone, date: newDate, start_time: newTime })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo reprogramar el turno.');
        setProcessing(null);
        return;
      }
      setSuccess('Turno reprogramado correctamente.');
      setRescheduleAppt(null);
      loadAppointments();
    } catch {
      setError('Error de conexión.');
    }
    setProcessing(null);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (loading) return <div className="loading">Cargando tus turnos...</div>;

  return (
    <div className="booking-container fade-up">
      <header className="booking-header">
        <h1 className="booking-title">Mis turnos</h1>
        <p className="booking-subtitle">Hola {clientSession?.name?.split(' ')[0]}, acá está tu historial</p>
      </header>

      {error && <div className="error-message" role="alert">{error}</div>}
      {success && <div className="success-message" role="status">{success}
        <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: 'inherit', float: 'right', cursor: 'pointer', fontWeight: 700 }}>✕</button>
      </div>}

      {appointments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }} role="status">
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Todavía no tenés turnos reservados.</p>
          <button className="btn btn-primary" onClick={() => navigate('/turnos')}>
            Reservar mi primer turno
          </button>
        </div>
      )}

      {appointments.length > 0 && (
        <ol style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none', padding: 0, margin: 0 }} aria-label="Historial de turnos">
          {appointments.map((appt, i) => {
            const status = getStatusLabel(appt.status);
            const modify = canModify(appt);
            return (
              <li key={i} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{appt.service_name}</strong>
                  <span
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '20px', background: status.color + '1a', color: status.color, fontWeight: 500 }}
                    aria-label={`Estado: ${status.text}`}
                  >
                    {status.text}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span><span aria-hidden="true">📅</span> {formatDate(appt.date)}</span>
                  <span><span aria-hidden="true">⏰</span> {appt.start_time.slice(0,5)} - {appt.end_time.slice(0,5)} ({appt.duration_minutes} min)</span>
                  {Number(appt.service_price) > 0 && <span><span aria-hidden="true">💰</span> ${Number(appt.service_price).toLocaleString()}</span>}
                </div>
                {modify && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                    <button
                      className="btn btn-sm"
                      disabled={processing === appt.id}
                      onClick={() => openReschedule(appt)}
                      style={{ flex: 1, fontSize: '0.78rem', background: 'var(--color-beige)', border: '1px solid var(--color-border)' }}
                    >
                      🔄 Reprogramar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      disabled={processing === appt.id}
                      onClick={() => handleCancel(appt)}
                      style={{ flex: 1, fontSize: '0.78rem' }}
                    >
                      {processing === appt.id ? 'Procesando...' : '✕ Cancelar'}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {rescheduleAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setRescheduleAppt(null); }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', background: 'var(--color-bg, #fff)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', fontSize: '1.05rem' }}>Reprogramar turno</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              {rescheduleAppt.service_name} — actualmente: {formatDate(rescheduleAppt.date)} a las {rescheduleAppt.start_time.slice(0,5)} hs
            </p>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Nueva fecha</label>
              <input
                type="date"
                min={getMinDate()}
                value={newDate}
                onChange={(e) => handleDateChange(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
              />
            </div>

            {newDate && (
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Horario disponible</label>
                {loadingSlots ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Cargando horarios...</p>
                ) : availableSlots.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-error)' }}>No hay horarios disponibles para esa fecha.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {availableSlots.map((slot, j) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() => setNewTime(slot.start)}
                        style={{
                          padding: '0.4rem 0.7rem',
                          borderRadius: '20px',
                          border: newTime === slot.start ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          background: newTime === slot.start ? 'var(--color-primary)' : 'transparent',
                          color: newTime === slot.start ? '#fff' : 'var(--color-text)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          fontWeight: newTime === slot.start ? 600 : 400
                        }}
                      >
                        {slot.start.slice(0, 5)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn" onClick={() => setRescheduleAppt(null)} style={{ flex: 1 }}>Cancelar</button>
              <button
                className="btn btn-primary"
                disabled={!newDate || !newTime || processing === rescheduleAppt.id}
                onClick={handleReschedule}
                style={{ flex: 1 }}
              >
                {processing === rescheduleAppt.id ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAppointments;
