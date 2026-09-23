import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const CARE_TIPS = [
  {
    match: /limpieza/i,
    text: 'Después de tu limpieza facial, cuidá tu piel con una buena hidratación y recordá utilizar protector solar.',
  },
  {
    match: /pesta|lifting/i,
    text: 'Disfrutá de tu mirada. Durante las primeras horas evitá mojar o frotar tus pestañas para conservar mejor el resultado.',
  },
  {
    match: /depilaci[oó]n definitiva|depilacion definitiva/i,
    text: 'Luego de tu sesión, protegé la zona tratada del sol y seguí las indicaciones de tu profesional.',
  },
  {
    match: /depil/i,
    text: 'Después de tu sesión, evitá la exposición directa al sol y utilizá productos suaves para cuidar tu piel.',
  },
  {
    match: /ondas rusas|presoterapia|lipol[áa]ser|lipol[áa]|corporal/i,
    text: 'Tu cuerpo también merece cuidados. Mantené una buena hidratación y acompañá tu tratamiento con hábitos saludables.',
  },
  {
    match: /peel|microdermo|dermapen|dermabrasio|dermaplaning|exosom|dermocosmia/i,
    text: 'Cada piel necesita cuidados diferentes. Seguí las recomendaciones de tu profesional para mantener los resultados de tu tratamiento.',
  },
  {
    match: /facial|ceja|cabina|hidrataci[oó]n/i,
    text: 'Después de tu tratamiento, dale a tu piel el cuidado que necesita: hidratación, productos adecuados y protección solar.',
  },
];

function getCareTip(serviceName) {
  const n = String(serviceName || '').toLowerCase();
  for (const tip of CARE_TIPS) {
    if (tip.match.test(n)) return tip.text;
  }
  return 'Recordá seguir las recomendaciones de tu profesional para prolongar y cuidar los resultados de tu tratamiento.';
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function isUpcoming(appt) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const nowTime = `${pad(today.getHours())}:${pad(today.getMinutes())}`;
  const dateStr = String(appt.date || '').split('T')[0];
  if (!dateStr) return false;
  if (dateStr > todayStr) return true;
  if (dateStr === todayStr) return String(appt.start_time || '').slice(0, 5) > nowTime;
  return false;
}

function computeNext(list) {
  return (Array.isArray(list) ? list : [])
    .filter((a) => a.status === 'confirmed')
    .filter(isUpcoming)
    .sort((a, b) => {
      const dA = String(a.date || '').split('T')[0];
      const dB = String(b.date || '').split('T')[0];
      return dA.localeCompare(dB) || String(a.start_time || '').localeCompare(String(b.start_time || ''));
    })[0] || null;
}

function formatNiceDate(dateStr) {
  const d = new Date(String(dateStr).split('T')[0] + 'T12:00:00');
  if (isNaN(d.getTime())) return String(dateStr).split('T')[0];
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

function ClientCareCards() {
  const navigate = useNavigate();
  const clientSession = JSON.parse(sessionStorage.getItem('clientSession') || 'null');
  const [appointments, setAppointments] = useState([]);
  const [checked, setChecked] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const searchValue = clientSession?.phone || clientSession?.email;
    if (!clientSession || !searchValue) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    const load = () => {
      fetch(`/api/appointments/my?search=${encodeURIComponent(searchValue)}`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          setAppointments(Array.isArray(data) ? data : []);
          setChecked(true);
        })
        .catch(() => {
          if (!cancelled) setChecked(true);
        });
    };
    load();
    const intervalId = setInterval(() => {
      setNowTick(Date.now());
      load();
    }, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const next = useMemo(() => computeNext(appointments), [appointments, nowTick]);

  if (!checked || dismissed) return null;

  const storedDismiss = sessionStorage.getItem('nextApptCardDismissed');
  if (next && storedDismiss === String(next.id)) return null;
  if (!next && storedDismiss === 'none') return null;

  const handleDismiss = () => {
    sessionStorage.setItem('nextApptCardDismissed', next ? String(next.id) : 'none');
    setDismissed(true);
  };

  return (
    <section className="client-cards" aria-label="Tu próxima cita">
      {next ? (
        <>
          <div className="care-card care-card-next">
            <button type="button" className="care-card-close" onClick={handleDismiss} aria-label="Cerrar tarjeta de próxima cita">✕</button>
            <p className="care-card-eyebrow">Tu próxima cita</p>
            <h2 className="care-card-service">{next.service_name}</h2>
            <p className="care-card-when">
              {formatNiceDate(next.date)} · {String(next.start_time).slice(0, 5)} hs
            </p>
            <button type="button" className="care-card-btn" onClick={() => navigate('/mis-turnos')}>
              Ver turno
            </button>
          </div>
          <div className="care-card care-card-tip">
            <p className="care-card-eyebrow">Tip de autocuidado</p>
            <p className="care-card-tip-text">{getCareTip(next.service_name)}</p>
          </div>
        </>
      ) : (
        <div className="care-card care-card-empty">
          <button type="button" className="care-card-close" onClick={handleDismiss} aria-label="Cerrar tarjeta">✕</button>
          <p className="care-card-eyebrow">Tu próxima cita</p>
          <h2 className="care-card-empty-title">¿Todavía no tenés tu próximo turno?</h2>
          <p className="care-card-empty-text">Reservá tu próxima cita y seguí cuidándote.</p>
          <button type="button" className="care-card-btn" onClick={() => navigate('/reservar')}>
            Reservar turno
          </button>
        </div>
      )}
    </section>
  );
}

export default ClientCareCards;