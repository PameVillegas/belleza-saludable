import { useState } from 'react';

function MyAppointments() {
  const [search, setSearch] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/appointments/my?search=${encodeURIComponent(search.trim())}`);
      const data = await res.json();
      setAppointments(data);
    } catch {
      setError('Error al buscar tus turnos.');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="booking-container fade-up">
      <div className="booking-header">
        <h2 className="booking-title">Mis turnos</h2>
        <p className="booking-subtitle">Consultá tu historial de reservas</p>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
        <div className="form-group">
          <label htmlFor="search">Ingresá tu teléfono o email</label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej: 3388-123456 o tu@email.com"
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar mis turnos'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {searched && !loading && appointments.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>
          No se encontraron turnos con esos datos.
        </p>
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
