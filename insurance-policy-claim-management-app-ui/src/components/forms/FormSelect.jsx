import ModernSelect from "./ModernSelect";

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  placeholder = "Select an option",
  ...props
}) => {
  return (
    <ModernSelect
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      options={options}
      error={error}
      required={required}
      placeholder={placeholder}
      {...props}
    />
  );
};

export default FormSelect;
