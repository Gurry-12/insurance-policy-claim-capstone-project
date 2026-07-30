import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

// Custom input component that looks like our standard Bootstrap 5 inputs
const CustomInput = forwardRef(({ value, onClick, onChange, placeholder, className, disabled, error, id, name }, ref) => (
  <div className="position-relative">
    <input
      id={id}
      name={name}
      className={`${className} ${error ? 'is-invalid' : ''}`}
      style={{
        paddingRight: '2.5rem',
        borderRadius: '8px',
        minHeight: '44px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled ? '#e9ecef' : '#fff'
      }}
      onClick={onClick}
      onChange={onChange}
      value={value}
      ref={ref}
      placeholder={placeholder}
      disabled={disabled}
      readOnly // Prevents mobile keyboard from popping up, forces calendar usage
    />
    <i 
      className="bi bi-calendar3 position-absolute" 
      style={{
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#6c757d',
        pointerEvents: 'none'
      }}
    />
  </div>
));
CustomInput.displayName = 'CustomInput';

const ModernDatePicker = ({
  label,
  name,
  selectedDate,
  onChange,
  placeholder = "Select Date",
  error,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  showMonthDropdown = true,
  showYearDropdown = true,
  ...props
}) => {
  return (
    <div className="mb-3 modern-datepicker-wrapper">
      {label && (
        <label htmlFor={name} className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <DatePicker
        id={name}
        name={name}
        selected={selectedDate ? new Date(selectedDate) : null}
        onChange={(date) => {
          // Wrap it in a standard event object so handleChange doesn't break
          onChange({
            target: {
              name,
              value: date ? format(date, 'yyyy-MM-dd') : ''
            }
          });
        }}
        customInput={<CustomInput className="form-control" error={error} />}
        placeholderText={placeholder}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        showMonthDropdown={showMonthDropdown}
        showYearDropdown={showYearDropdown}
        dropdownMode="select"
        dateFormat="yyyy-MM-dd"
        wrapperClassName="w-100"
        {...props}
      />
      {error && <div className="text-danger mt-1" style={{ fontSize: '0.875em' }}>{error}</div>}
    </div>
  );
};

export default ModernDatePicker;
