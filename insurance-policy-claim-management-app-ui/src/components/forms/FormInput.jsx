import ModernDatePicker from './ModernDatePicker';

const FormInput = ({ label, type = 'text', name, value, onChange, placeholder, error, required = false, ...props }) => {
  if (type === 'date') {
    return (
      <ModernDatePicker
        label={label}
        name={name}
        selectedDate={value}
        onChange={onChange}
        error={error}
        required={required}
        placeholder={placeholder}
        {...props}
      />
    );
  }

  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        {...props}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

export default FormInput;
