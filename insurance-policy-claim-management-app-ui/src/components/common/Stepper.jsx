import React from 'react';

const Stepper = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="d-flex align-items-center justify-content-center mb-4">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isClickable = index < currentStep;

        return (
          <React.Fragment key={index}>
            {/* Step Circle */}
            <div
              className="d-flex flex-column align-items-center"
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
              onClick={() => isClickable && onStepClick && onStepClick(index)}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-circle mb-2"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: isCompleted
                    ? '#10b981'
                    : isActive
                    ? '#3b82f6'
                    : '#e5e7eb',
                  color: isCompleted || isActive ? '#fff' : '#9ca3af',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                {isCompleted ? (
                  <i className="bi bi-check-lg"></i>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className="small text-center"
                style={{
                  color: isActive
                    ? '#3b82f6'
                    : isCompleted
                    ? '#10b981'
                    : '#9ca3af',
                  fontWeight: isActive ? 600 : 400,
                  maxWidth: 80,
                }}
              >
                {step}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className="flex-grow-1 mx-2"
                style={{
                  height: 2,
                  backgroundColor: index < currentStep ? '#10b981' : '#e5e7eb',
                  marginBottom: 24,
                  transition: 'background-color 0.2s ease',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;
