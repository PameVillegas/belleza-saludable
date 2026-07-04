function Stepper({ currentStep }) {
  const steps = [1, 2, 3];

  return (
    <nav className="stepper" aria-label="Pasos de la reserva">
      {steps.map((step, index) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            className={`stepper-step ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
            aria-current={step === currentStep ? 'step' : undefined}
            aria-label={`Paso ${step}${step === currentStep ? ' (actual)' : ''}`}
          >
            {step < currentStep ? '✓' : step}
          </div>
          {index < steps.length - 1 && (
            <div className={`stepper-line ${step < currentStep ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </nav>
  );
}

export default Stepper;
