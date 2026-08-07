import React from 'react';
import Select, { components } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import * as LucideIcons from 'lucide-react';

const DynamicIcon = ({ name, size = 16, className = "", style = {} }) => {
  if (!name) return null;
  const Icon = LucideIcons[name];
  return Icon ? <Icon size={size} className={className} style={style} /> : null;
};

// ─── CUSTOM COMPONENTS ──────────────────────────────────────

const CustomOption = (props) => {
  const { data, isSelected, isFocused } = props;
  
  return (
    <components.Option {...props}>
      <div className="d-flex align-items-center justify-content-between w-100" style={{ gap: '12px' }}>
        <div className="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden">
          {data.icon && (
            <div
              className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: isSelected 
                  ? 'rgba(255,255,255,0.2)' 
                  : (isFocused ? '#fff' : 'var(--ip-surface-raised, #f8fafc)'),
                color: isSelected ? '#fff' : 'var(--ip-brand, #4f46e5)',
                border: isSelected ? 'none' : '1px solid var(--ip-border, #e2e8f0)',
                transition: 'all 0.2s ease'
              }}
            >
              {typeof data.icon === 'string' ? (
                <DynamicIcon name={data.icon} size={16} />
              ) : (
                data.icon
              )}
            </div>
          )}
          <div className="text-truncate">
            <div style={{ 
              fontWeight: 600, 
              fontSize: '0.85rem', 
              color: isSelected ? '#fff' : 'var(--ip-text-primary, #1e293b)',
              transition: 'color 0.2s ease'
            }}>
              {data.label}
            </div>
            {data.subtitle && (
              <div 
                className="text-truncate"
                style={{ 
                  fontSize: '0.72rem', 
                  color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--ip-text-muted, #64748b)',
                  marginTop: '1px'
                }}
              >
                {data.subtitle}
              </div>
            )}
          </div>
        </div>
        
        {data.badge && (
          <span
            className="flex-shrink-0"
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: isSelected 
                ? 'rgba(255,255,255,0.2)' 
                : `var(--ip-${data.statusColor || 'brand'}-bg, #eef2ff)`,
              color: isSelected ? '#fff' : `var(--ip-${data.statusColor || 'brand'}, #4f46e5)`,
            }}
          >
            {data.badge}
          </span>
        )}
      </div>
    </components.Option>
  );
};

const CustomSingleValue = (props) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <div className="d-flex align-items-center gap-2">
        {data.icon && (
          <span style={{ color: 'var(--ip-brand, #4f46e5)', display: 'flex' }}>
            {typeof data.icon === 'string' ? <DynamicIcon name={data.icon} size={15} /> : data.icon}
          </span>
        )}
        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ip-text-primary, #1e293b)' }}>
          {data.label}
        </span>
        {data.badge && (
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--ip-text-muted)', marginLeft: '4px' }}>
            ({data.badge})
          </span>
        )}
      </div>
    </components.SingleValue>
  );
};

const CustomMultiValue = (props) => {
  const { data, removeProps } = props;
  return (
    <div 
      className="d-flex align-items-center m-1" 
      style={{
        backgroundColor: 'var(--ip-surface-raised, #f8fafc)',
        border: '1px solid var(--ip-border, #e2e8f0)',
        borderRadius: '6px',
        padding: '2px 4px 2px 8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      <div className="d-flex align-items-center gap-2 me-2">
        {data.icon && (
           <span style={{ color: 'var(--ip-brand, #4f46e5)', display: 'flex' }}>
             {typeof data.icon === 'string' ? <DynamicIcon name={data.icon} size={13} /> : data.icon}
           </span>
        )}
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ip-text-primary, #1e293b)' }}>
          {data.label}
        </span>
      </div>
      <div 
        {...removeProps}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: '4px',
          padding: '2px',
          color: 'var(--ip-text-muted, #64748b)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ip-text-muted, #64748b)'; }}
      >
        <LucideIcons.X size={13} strokeWidth={2.5} />
      </div>
    </div>
  );
};

const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <LucideIcons.ChevronDown size={16} strokeWidth={2.5} style={{ color: 'var(--ip-text-muted, #94a3b8)' }} />
    </components.DropdownIndicator>
  );
};

const ClearIndicator = (props) => {
  return (
    <components.ClearIndicator {...props}>
      <div 
        style={{ 
          padding: '2px', 
          borderRadius: '4px', 
          color: 'var(--ip-text-muted, #94a3b8)',
          cursor: 'pointer',
          display: 'flex'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ip-text-muted, #94a3b8)'; }}
      >
         <LucideIcons.X size={15} strokeWidth={2.5} />
      </div>
    </components.ClearIndicator>
  );
};

const NoOptionsMessage = (props) => {
  return (
    <components.NoOptionsMessage {...props}>
      <div className="d-flex flex-column align-items-center py-3 text-center">
        <div 
          className="mb-2 d-flex align-items-center justify-content-center" 
          style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--ip-surface-raised, #f1f5f9)', color: 'var(--ip-text-muted, #94a3b8)' }}
        >
          <LucideIcons.SearchX size={20} />
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ip-text-secondary, #475569)' }}>No results found</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--ip-text-muted, #64748b)', marginTop: '2px' }}>Try a different search term</div>
      </div>
    </components.NoOptionsMessage>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────

const SearchSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  error,
  required = false,
  isSearchable = true,
  isClearable = true,
  isLoading = false,
  isDisabled = false,
  isMulti = false,
  isCreatable = false,
  ...props
}) => {

  // Map incoming value to react-select option object format
  const getSelectedOption = () => {
    if (isMulti) {
      if (!value || !Array.isArray(value)) return [];
      return value.map(v => {
        const found = options.find((opt) => String(opt.value) === String(v));
        return found || { value: v, label: String(v), icon: 'Tag' }; // Fallback for created options
      });
    }
    if (value === null || value === undefined || value === '') return null;
    const found = options.find((opt) => String(opt.value) === String(value));
    return found || (isCreatable ? { value, label: String(value) } : null);
  };

  const handleChange = (selected) => {
    let finalValue;
    if (isMulti) {
      finalValue = selected ? selected.map(s => s.value) : [];
    } else {
      finalValue = selected ? selected.value : "";
    }
    
    // Mimic standard e.target structure
    const event = {
      target: {
        name: name,
        value: finalValue,
      },
    };
    if (onChange) onChange(event);
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: "8px",
      borderColor: error
        ? "var(--ip-danger, #dc3545)"
        : state.isFocused
          ? "var(--ip-brand, #4f46e5)"
          : "var(--ip-border, #e2e8f0)",
      boxShadow: state.isFocused
        ? error
          ? "0 0 0 3px rgba(220, 53, 69, 0.15)"
          : "0 0 0 3px rgba(79, 70, 229, 0.15)"
        : "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
      minHeight: "44px",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        borderColor: error
          ? "var(--ip-danger, #dc3545)"
          : state.isFocused
            ? "var(--ip-brand, #4f46e5)"
            : "#cbd5e1",
      },
      backgroundColor: isDisabled ? "var(--ip-surface-raised, #f8fafc)" : "white",
      padding: "2px",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "var(--ip-brand, #4f46e5)"
        : state.isFocused
          ? "var(--ip-surface-raised, #f8fafc)"
          : "white",
      color: state.isSelected ? "white" : "var(--ip-text-primary, #1e293b)",
      cursor: "pointer",
      padding: "10px 14px",
      fontSize: "0.9rem",
      transition: "background-color 0.15s ease-in-out",
      "&:active": {
        backgroundColor: "var(--ip-brand, #4f46e5)",
        color: "white",
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "10px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      zIndex: 9999,
      overflow: "hidden",
      marginTop: "6px",
      border: "1px solid var(--ip-border, #e2e8f0)",
      padding: "4px",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menuList: (base) => ({
      ...base,
      padding: 0,
      gap: '2px',
      display: 'flex',
      flexDirection: 'column',
    }),
    singleValue: (base) => ({
      ...base,
      color: isDisabled ? "var(--ip-text-muted, #94a3b8)" : "var(--ip-text-primary, #1e293b)",
    }),
    placeholder: (base) => ({
      ...base,
      color: "var(--ip-text-muted, #94a3b8)",
      fontSize: "0.9rem",
      fontWeight: 500,
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'transparent',
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 8px",
    })
  };

  return (
    <div className="search-select-wrapper w-100">
      {label && (
        <label 
          className="form-label" 
          style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            color: 'var(--ip-text-muted, #64748b)',
            marginBottom: '0.35rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'block'
          }}
        >
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      
      {isCreatable ? (
        <CreatableSelect
          name={name}
          value={getSelectedOption()}
          onChange={handleChange}
          options={options}
          placeholder={placeholder}
          styles={customStyles}
          isDisabled={isDisabled}
          isLoading={isLoading}
          isClearable={isClearable}
          isSearchable={isSearchable}
          isMulti={isMulti}
          components={{
            Option: CustomOption,
            SingleValue: CustomSingleValue,
            MultiValue: CustomMultiValue,
            DropdownIndicator,
            ClearIndicator,
            NoOptionsMessage,
            IndicatorSeparator: () => null,
          }}
          formatCreateLabel={(val) => `Add custom: ${val}`}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          {...props}
        />
      ) : (
        <Select
          name={name}
          value={getSelectedOption()}
          onChange={handleChange}
          options={options}
          placeholder={placeholder}
          styles={customStyles}
          isDisabled={isDisabled}
          isLoading={isLoading}
          isClearable={isClearable}
          isSearchable={isSearchable}
          isMulti={isMulti}
          components={{
            Option: CustomOption,
            SingleValue: CustomSingleValue,
            MultiValue: CustomMultiValue,
            DropdownIndicator,
            ClearIndicator,
            NoOptionsMessage,
            IndicatorSeparator: () => null,
          }}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          {...props}
        />
      )}
      
      {error && (
        <div className="mt-1 d-flex align-items-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--ip-danger, #dc3545)', fontWeight: 600 }}>
          <LucideIcons.AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchSelect;
