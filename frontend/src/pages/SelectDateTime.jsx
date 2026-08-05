import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from '../components/Stepper';

function SelectDateTime() {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const service = JSON.parse(sessionStorage.getItem('selectedService') || 'null');

  useEffect(() => {
    if (!service) {
      navigate('/turnos');
      return;
    }

    fetch(`/api/availability/${service.id}`)
      .then(res => res.json())
      .then(data => {
        setDates(data.dates || []);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudieron cargar las fechas disponibles.');
        setLoading(false);
      });
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);

    fetch(`/api/availability/${service.id}/${date}`)
      .then(res => res.json())
      .then(data => {
        setSlots(data.slots || []);
        setLoadingSlots(false);
      })
      .catch(() => {
        setError('No se pudieron cargar los horarios.');
        setLoadingSlots(false);
      });
  };

  const handleContinue = () => {
    sessionStorage.setItem('selectedDate', selectedDate);
    sessionStorage.setItem('selectedSlot', JSON.stringify(selectedSlot));
    navigate('/datos');
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  if (loading) return <div className="loading">Cargando fechas...</div>;
  if (error) return <div className="booking-container"><div className="error-message">{error}</div></div>;

  return (
    <div className="booking-container fade-up">
      <Stepper currentStep={2} />
      <header className="booking-header">
        <h1 className="booking-title">Elegí día y horario</h1>
        <p className="booking-subtitle">{service.name} · {service.duration_minutes} min</p>
      </header>

      {/* Fechas */}
      <div style={{ marginBottom: '1.5rem' }}>
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
            Fecha disponible:
          </legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} role="group" aria-label="Fechas disponibles">
            {dates.slice(0, 14).map(date => (
              <button
                key={date}
                className={`slot-btn ${selectedDate === date ? 'selected' : ''}`}
                onClick={() => handleDateSelect(date)}
                aria-pressed={selectedDate === date}
                aria-label={`Seleccionar fecha: ${formatDate(date)}`}
              >
                {formatDate(date)}
              </button>
            ))}
          </div>
          {dates.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }} role="status">
              No hay fechas disponibles en los próximos días.
            </p>
          )}
        </fieldset>
      </div>

      {/* Horarios */}
      {selectedDate && (
        <div className="fade-in">
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
              Horario disponible:
            </legend>
            {loadingSlots ? (
              <div className="loading" role="status" aria-live="polite">Cargando horarios...</div>
            ) : (
              <div className="slots-grid" role="group" aria-label="Horarios disponibles">
                {slots.map(slot => (
                  <button
                    key={slot.start}
                    className={`slot-btn ${selectedSlot?.start === slot.start ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                    aria-pressed={selectedSlot?.start === slot.start}
                    aria-label={`Horario ${slot.start} a ${slot.end}`}
                  >
                    {slot.start}
                  </button>
                ))}
              </div>
            )}
            {!loadingSlots && slots.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }} role="status">
                No hay horarios disponibles para esta fecha.
              </p>
            )}
          </fieldset>
        </div>
      )}

      {/* Navegación */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/turnos')} aria-label="Volver a selección de servicio">
          ← Atrás
        </button>
        <button className="btn btn-primary" disabled={!selectedSlot} onClick={handleContinue} aria-label={selectedSlot ? `Continuar con horario ${selectedSlot.start}` : 'Continuar (seleccioná un horario primero)'}>
          Continuar →
        </button>
      </div>
    </div>
  );
}

export default SelectDateTime;
