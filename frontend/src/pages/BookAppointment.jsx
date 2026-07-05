import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function BookAppointment() {
  const navigate = useNavigate();
  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudieron cargar los tratamientos.');
        setLoading(false);
      });
  }, []);

  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service || null);
    setSelectedDate('');
    setSlots([]);
    setSelectedSlot(null);
    setDates([]);

    if (service) {
      setLoadingDates(true);
      fetch(`/api/availability/${service.id}`)
        .then(res => res.json())
        .then(data => {
          setDates(data.dates || []);
          setLoadingDates(false);
        })
        .catch(() => {
          setError('Error al cargar fechas disponibles.');
          setLoadingDates(false);
        });
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlots([]);

    if (date && selectedService) {
      setLoadingSlots(true);
      fetch(`/api/availability/${selectedService.id}/${date}`)
        .then(res => res.json())
        .then(data => {
          setSlots(data.slots || []);
          setLoadingSlots(false);
        })
        .catch(() => {
          setError('Error al cargar horarios.');
          setLoadingSlots(false);
        });
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedSlot || !clientSession) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          date: selectedDate,
          start_time: selectedSlot.start,
          client_name: clientSession.name,
          client_phone: clientSession.phone,
          client_email: clientSession.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al reservar el turno.');
        setSubmitting(false);
        return;
      }

      // Alerta de confirmación
      alert(`✅ ¡Turno confirmado!\n\n💆 ${selectedService.name}\n📅 ${formatDate(selectedDate)}\n⏰ ${selectedSlot.start} - ${selectedSlot.end} hs\n\n¡Te esperamos!`);

      // Limpiar y volver al inicio
      navigate('/inicio');
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const formatDateShort = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="booking-container fade-up">
      <div className="booking-header">
        <h2 className="booking-title">📅 Reservar Turno</h2>
        <p className="booking-subtitle">Elegí tu tratamiento, fecha y horario</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Seleccionar tratamiento */}
      <div className="form-group">
        <label>Tratamiento</label>
        <select onChange={handleServiceChange} value={selectedService?.id || ''}>
          <option value="">— Seleccioná un tratamiento —</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Mostrar precio */}
      {selectedService && (
        <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--color-beige)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '0.9rem' }}>{selectedService.name}</strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                ⏱ {selectedService.duration_minutes} min
              </p>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-sage-dark)' }}>
              {Number(selectedService.price) > 0
                ? `$${Number(selectedService.price).toLocaleString()}`
                : 'Consultar'}
            </span>
          </div>
        </div>
      )}

      {/* Seleccionar fecha */}
      {selectedService && (
        <div className="form-group">
          <label>Fecha disponible</label>
          {loadingDates ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Cargando fechas...</p>
          ) : dates.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>No hay fechas disponibles.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {dates.slice(0, 14).map(date => (
                <button
                  key={date}
                  type="button"
                  className={`slot-btn ${selectedDate === date ? 'selected' : ''}`}
                  onClick={() => handleDateChange({ target: { value: date } })}
                >
                  {formatDateShort(date)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seleccionar horario */}
      {selectedDate && (
        <div className="form-group fade-in">
          <label>Horario disponible</label>
          {loadingSlots ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Cargando horarios...</p>
          ) : slots.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>No hay horarios disponibles para esta fecha.</p>
          ) : (
            <div className="slots-grid">
              {slots.map(slot => (
                <button
                  key={slot.start}
                  type="button"
                  className={`slot-btn ${selectedSlot?.start === slot.start ? 'selected' : ''}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot.start}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resumen y botón */}
      {selectedSlot && (
        <div className="fade-in" style={{ marginTop: '1.5rem' }}>
          <div className="card" style={{ padding: '1rem', marginBottom: '1rem', background: 'var(--color-beige)' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Resumen</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-light)' }}>
              💆 {selectedService.name}<br />
              📅 {formatDate(selectedDate)}<br />
              ⏰ {selectedSlot.start} - {selectedSlot.end} hs<br />
              👤 {clientSession?.name}
            </p>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Reservando...' : '✓ Solicitar turno'}
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/inicio')}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default BookAppointment;
