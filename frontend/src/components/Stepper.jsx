function Stepper({ currentStep }) {
  const steps = [1, 2, 3];

  return (
    <nav className="stepper" aria-label="Pasos de la reserva">
      {steps.map((step) => (
        <div
          key={step}
          className={`stepper-step ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
          aria-current={step === currentStep ? 'step' : undefined}
          aria-label={`Paso ${step}${step === currentStep ? ' (actual)' : ''}`}
        >
          {step < currentStep ? '✓' : step}
        </div>
      ))}
    </nav>
  );
}

export default Stepper;
