import Select from "react-select";

const ModernSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select...",
  error,
  required = false,
  isSearchable = false,
  isLoading = false,
  isDisabled = false,
  styles: propStyles,
  ...props
}) => {
  // Find the selected option object from the value, comparing as strings to handle numeric IDs vs route params
  const selectedOption =
    options.find((opt) => String(opt.value) === String(value)) || null;

  const handleChange = (selected) => {
    // Mimic standard e.target structure for seamless drop-in replacement
    const event = {
      target: {
        name: name,
        value: selected ? selected.value : "",
      },
    };
    onChange(event);
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: "8px",
      borderColor: error
        ? "var(--bs-form-invalid-border-color, #dc3545)"
        : state.isFocused
          ? "var(--ip-primary, #0d6efd)"
          : "#e2e8f0",
      boxShadow: state.isFocused
        ? error
          ? "0 0 0 0.25rem rgba(220, 53, 69, 0.25)"
          : "0 0 0 3px rgba(13, 110, 253, 0.15)"
        : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      minHeight: "44px",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        borderColor: error
          ? "var(--bs-form-invalid-border-color, #dc3545)"
          : state.isFocused
            ? "var(--ip-primary, #0d6efd)"
            : "#cbd5e1",
      },
      backgroundColor: isDisabled ? "#f8f9fa" : "white",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "var(--ip-primary, #0d6efd)"
        : state.isFocused
          ? "#f1f5f9"
          : "white",
      color: state.isSelected ? "white" : "#334155",
      cursor: "pointer",
      padding: "10px 14px",
      fontSize: "0.9rem",
      transition: "background-color 0.15s ease-in-out",
      "&:active": {
        backgroundColor: "var(--ip-primary, #0d6efd)",
        color: "white",
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "8px",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      zIndex: 9999,
      overflow: "hidden",
      marginTop: "4px",
      border: "1px solid #e2e8f0",
    }),
    menuList: (base) => ({
      ...base,
      padding: 0,
    }),
    singleValue: (base) => ({
      ...base,
      color: isDisabled ? "#6c757d" : "#1e293b",
      fontSize: "0.95rem",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#94a3b8",
      fontSize: "0.95rem",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 99999,
    }),
  };

  return (
    <div className="mb-3">
      {label && (
        <label
          htmlFor={name}
          className="form-label"
          style={{ fontSize: "0.85rem", fontWeight: 600 }}
        >
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <Select
        inputId={name}
        name={name}
        value={selectedOption}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        styles={{
          ...customStyles,
          ...propStyles,
        }}
        isSearchable={isSearchable}
        isLoading={isLoading}
        isDisabled={isDisabled}
        isClearable={false}
        classNamePrefix="modern-select"
        menuPortalTarget={document.body}
        menuPosition="fixed"
        {...props}
      />
      {error && (
        <div className="text-danger mt-1" style={{ fontSize: "0.875em" }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default ModernSelect;
