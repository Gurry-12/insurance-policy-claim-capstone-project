import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { register as registerService } from "../../services/authService";
import logoSrc from "../../assets/logo/insurance-heart-vector.png";
import LoadingButton from "../../components/ui/LoadingButton";
import "../css/Login.css";

const INIT = {
  fullName: "",
  email: "",
  mobileNumber: "",
  password: "",
  confirmPassword: "",
};

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INIT);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Digits-only enforcement for mobile number, max 10 digits
    if (name === 'mobileNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, mobileNumber: digitsOnly }));
      if (serverErrors.mobileNumber) setServerErrors((prev) => ({ ...prev, mobileNumber: '' }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (serverErrors[name]) setServerErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = "Full name is required.";
    }
    if (!formData.mobileNumber.trim()) {
      errs.mobileNumber = "Mobile number is required.";
    } else if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
      errs.mobileNumber = "Enter a valid 10-digit mobile number.";
    }
    if (!formData.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Enter a valid email.";
    }
    if (!formData.password) {
      errs.password = "Password is required.";
    } else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(formData.password)) {
      errs.password = "Password must be 8-64 characters and contain at least one letter and one digit.";
    }
    if (!formData.confirmPassword) {
      errs.confirmPassword = "Confirm password is required.";
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    return errs;
  };

  const clientErrors = validate();
  const errors = { ...clientErrors, ...serverErrors };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    if (Object.keys(clientErrors).length) {
      return;
    }

    try {
      setLoading(true);

      // Always send +91 prefix with strictly 10-digit number
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        mobileNumber: "+91" + formData.mobileNumber.trim(),
        password: formData.password,
      };

      await registerService(payload);
      toast.success("Account created! Redirecting to verify email and phone...");
      setTimeout(
        () => navigate("/verify-otp", { state: { registered: true, email: payload.email } }),
        2200,
      );
    } catch (err) {
      toast.error(
        err.message ||
          err.response?.data?.error ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport d-flex align-items-center justify-content-center p-3 p-md-4">
      <img
        src={logoSrc}
        aria-hidden="true"
        className="bg-watermark-blur"
        alt=""
      />

      {/* Main Container Layer */}
      <div className="master-glass-card p-3 p-md-5">
        <div className="row g-0 align-items-center">
          {/* Left Brand Graphic Presentation Frame */}
          <div className="col-lg-6 character-canvas-panel">
            <img
              src={logoSrc}
              className="floating-brand-character"
              alt="InsuranceFlow dynamic brand character"
            />
          </div>

          {/* Right Form View Container */}
          <div className="col-lg-6 d-flex justify-content-center justify-content-lg-start pe-lg-4">
            <div className="inner-form-card">
              {/* Header Context Elements */}
              <div className="mb-2 text-start">
                <h1 className="form-display-title">Register</h1>
              </div>



              {/* Clean Single-View 4-Field Form */}
              <form onSubmit={handleSubmit} noValidate>
                {/* Full Name field */}
                <div className="mb-3 text-start">
                  <label htmlFor="reg-fullName" className="custom-field-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="reg-fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    className={`form-control pristine-input ${(errors.fullName && (submitAttempted || formData.fullName.length > 0)) ? 'is-invalid' : ''}`}
                    placeholder="Shyam Verma"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={loading}
                    aria-invalid={errors.fullName ? "true" : "false"}
                    aria-describedby={errors.fullName ? "fullname-error" : undefined}
                  />
                  {errors.fullName && (submitAttempted || formData.fullName.length > 0) && (
                    <div id="fullname-error" className="input-error-tip text-danger mt-1" aria-live="polite">
                      <i className="bi bi-x-circle-fill" /> {errors.fullName}
                    </div>
                  )}
                </div>

                {/* Mobile Number field */}
                <div className="mb-3 text-start">
                  <label htmlFor="reg-mobile" className="custom-field-label">
                    Mobile Number <span className="text-danger">*</span>
                  </label>
                  <div
                    className={`d-flex align-items-center rounded overflow-hidden ${
                      (errors.mobileNumber && (submitAttempted || formData.mobileNumber.length > 0))
                        ? 'border border-danger'
                        : formData.mobileNumber.length === 10 && !errors.mobileNumber
                        ? 'border border-success'
                        : 'border'
                    }`}
                    style={{ background: 'var(--ip-surface-raised)', transition: 'border-color 0.2s' }}
                  >
                    <span
                      className="px-3 py-2 fw-semibold flex-shrink-0"
                      style={{
                        borderRight: '1px solid var(--ip-border)',
                        color: (errors.mobileNumber && (submitAttempted || formData.mobileNumber.length > 0)) ? '#dc3545' : formData.mobileNumber.length === 10 && !errors.mobileNumber ? '#198754' : 'var(--ip-brand)',
                        fontSize: '0.9rem',
                        background: 'var(--ip-surface-subtle)',
                        userSelect: 'none',
                      }}
                    >+91</span>
                    <input
                      id="reg-mobile"
                      name="mobileNumber"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      className="form-control border-0 ps-2"
                      placeholder="9876543210"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
                        if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) { e.preventDefault(); return; }
                        if (/^\d$/.test(e.key) && formData.mobileNumber.length >= 10) { e.preventDefault(); }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10);
                        setFormData(prev => ({ ...prev, mobileNumber: pasted }));
                      }}
                      disabled={loading}
                      aria-invalid={errors.mobileNumber ? "true" : "false"}
                      aria-describedby={errors.mobileNumber ? "mobile-error" : undefined}
                      style={{ boxShadow: 'none', outline: 'none' }}
                    />
                    <span
                      className={`pe-2 flex-shrink-0 small ${formData.mobileNumber.length === 10 ? 'text-success fw-semibold' : 'text-muted'}`}
                      style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                    >
                      {formData.mobileNumber.length}/10
                    </span>
                  </div>
                  {errors.mobileNumber && (submitAttempted || formData.mobileNumber.length > 0) && (
                    <div id="mobile-error" className="input-error-tip text-danger mt-1" aria-live="polite" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-x-circle-fill me-1" />{errors.mobileNumber}
                    </div>
                  )}
                  {!errors.mobileNumber && formData.mobileNumber.length === 10 && (
                    <div className="text-success mt-1" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-check-circle-fill me-1" />Looks good!
                    </div>
                  )}
                </div>

                {/* Email Address field */}
                <div className="mb-3 text-start">
                  <label htmlFor="reg-email" className="custom-field-label">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={`form-control pristine-input ${(errors.email && (submitAttempted || formData.email.length > 0)) ? 'is-invalid' : ''}`}
                    placeholder="shyam.verma@yopmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (submitAttempted || formData.email.length > 0) && (
                    <div id="email-error" className="input-error-tip text-danger mt-1" aria-live="polite">
                      <i className="bi bi-x-circle-fill" /> {errors.email}
                    </div>
                  )}
                </div>

                {/* Password field */}
                <div className="mb-4 text-start">
                  <label htmlFor="reg-password" className="custom-field-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-embedded-wrapper">
                    <input
                      id="reg-password"
                      name="password"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      className={`form-control pristine-input ${(errors.password && (submitAttempted || formData.password.length > 0)) ? 'is-invalid' : ''}`}
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      aria-invalid={errors.password ? "true" : "false"}
                      aria-describedby={errors.password ? "password-error" : undefined}
                    />
                    <button
                      type="button"
                      className="input-embedded-trigger"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      <i
                        className={`bi ${showPw ? "bi-eye-slash" : "bi-eye"}`}
                      />
                    </button>
                  </div>
                  {errors.password && (submitAttempted || formData.password.length > 0) && (
                    <div id="password-error" className="input-error-tip text-danger mt-1" aria-live="polite">
                      <i className="bi bi-x-circle-fill" /> {errors.password}
                    </div>
                  )}
                  {formData.password && (
                    <PasswordStrength password={formData.password} />
                  )}
                </div>

                {/* Confirm Password field */}
                <div className="mb-4 text-start">
                  <label htmlFor="reg-confirm-password" className="custom-field-label">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-embedded-wrapper">
                    <input
                      id="reg-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPw ? "text" : "password"}
                      autoComplete="new-password"
                      className={`form-control pristine-input ${
                        (errors.confirmPassword && (submitAttempted || formData.confirmPassword.length > 0))
                          ? 'is-invalid'
                          : formData.confirmPassword && formData.password === formData.confirmPassword
                          ? 'is-valid'
                          : ''
                      }`}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      aria-invalid={errors.confirmPassword ? "true" : "false"}
                      aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                    />
                    <button
                      type="button"
                      className="input-embedded-trigger"
                      onClick={() => setShowConfirmPw((v) => !v)}
                      aria-label={showConfirmPw ? "Hide password" : "Show password"}
                    >
                      <i
                        className={`bi ${showConfirmPw ? "bi-eye-slash" : "bi-eye"}`}
                      />
                    </button>
                  </div>
                  {errors.confirmPassword && (submitAttempted || formData.confirmPassword.length > 0) && (
                    <div id="confirm-password-error" className="input-error-tip text-danger mt-1" aria-live="polite">
                      <i className="bi bi-x-circle-fill" /> {errors.confirmPassword}
                    </div>
                  )}
                  {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="input-error-tip text-success mt-1" aria-live="polite">
                      <i className="bi bi-check-circle-fill" /> Passwords match!
                    </div>
                  )}
                </div>

                {/* Execution CTA Switch */}
                <LoadingButton
                  id="reg-submit-btn"
                  type="submit"
                  className="login-submit-btn w-100 mt-2 mb-3"
                  isLoading={loading}
                  loadingText="Creating account…"
                >
                  Register for free
                </LoadingButton>
              </form>

              {/* Traversal Redirection Option */}
              <p className="text-center mb-0 login-footer-text">
                Already have an account?{" "}
                <Link to="/login" className="login-footer-link">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Real-Time Password Analytics Component */
const PasswordStrength = ({ password }) => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Very Weak", color: "#ef4444" },
    { label: "Weak", color: "#f97316" },
    { label: "Fair", color: "#eab308" },
    { label: "Good", color: "#22c55e" },
    { label: "Strong", color: "#10b981" },
  ];
  const current = levels[Math.min(score - 1, 4)] ?? levels[0];

  return (
    <div className="mt-2 text-start">
      <div className="d-flex gap-1">
        {levels.map((l, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              background: i < score ? current.color : "rgba(0,0,0,0.06)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: "0.72rem",
          color: current.color,
          fontWeight: 600,
          marginTop: 2,
          display: "block",
        }}
      >
        {current.label}
      </span>
    </div>
  );
};

export default Register;
