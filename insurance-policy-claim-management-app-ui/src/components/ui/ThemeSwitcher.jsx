import { useTheme } from "../../context/ThemeContext";

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  const options = [
    { value: "light", icon: "bi-sun", label: "Light" },
    { value: "dark", icon: "bi-moon", label: "Dark" },
  ];

  return (
    <div
      className="d-flex align-items-center rounded-pill"
      style={{
        background: "var(--ip-surface-raised, #e5e7eb)",
        padding: "3px",
        position: "relative",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
      }}
      role="radiogroup"
      aria-label="Theme Switcher"
    >
      {options.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => toggleTheme(opt.value)}
            className="btn border-0 rounded-pill d-flex align-items-center justify-content-center"
            style={{
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: isActive
                ? "var(--ip-brand, #2563eb)"
                : "var(--ip-text-muted, #64748b)",
              background: isActive ? "var(--ip-surface, #ffffff)" : "transparent",
              boxShadow: isActive ? "var(--ip-shadow-sm)" : "none",
              transition: "all 0.25s ease",
              position: "relative",
              zIndex: isActive ? 2 : 1,
            }}
            title={`Switch to ${opt.label} Mode`}
          >
            <i className={`bi ${opt.icon} ${isActive ? 'fs-6' : ''}`} style={{ transition: "all 0.25s ease" }} />
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;
