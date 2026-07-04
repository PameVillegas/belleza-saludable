import { useLocation } from 'react-router-dom';

function WhatsAppButton() {
  const location = useLocation();

  // No mostrar en la pantalla de login
  if (location.pathname === '/') return null;

  return (
    <a
      href="https://wa.me/543388403225?text=Hola!%20Quiero%20consultar%20por%20un%20turno"
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Contactar por WhatsApp"
    >
      💬
    </a>
  );
}

export default WhatsAppButton;
