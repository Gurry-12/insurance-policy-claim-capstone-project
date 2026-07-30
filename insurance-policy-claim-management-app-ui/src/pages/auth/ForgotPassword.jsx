import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { forgotPasswordApi, resetPasswordApi } from "../../services/authService";
import logoSrc from "../../assets/logo/insurance-heart-vector.png";
import "../css/Login.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
    const [showPw, setShowPw] = useState(false);
    
  // State Step 1
  const [email, setEmail] = useState("");
  // State Step 2
  const [resetData, setResetData] = useState({
    emailOtp: "",
    phoneOtp: "",
    newPassword: ""
  });
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    
    if (!email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      setLoading(true);
      await forgotPasswordApi({ email });
      toast.success("OTP sent to your registered email and phone number.");
      setStep(2);
    } catch (err) {
      toast.error(err.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!resetData.emailOtp.trim()) {
      errs.emailOtp = "Email OTP is required.";
    }
    if (!resetData.phoneOtp.trim()) {
      errs.phoneOtp = "Phone OTP is required.";
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{6,15}$/;
    if (!resetData.newPassword) {
      errs.newPassword = "New Password is required.";
    } else if (!passRegex.test(resetData.newPassword)) {
      errs.newPassword = "Password must be 6-15 characters and contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@#$%^&+=!).";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      setLoading(true);
      await resetPasswordApi({
        email,
        emailOtp: resetData.emailOtp,
        phoneOtp: resetData.phoneOtp,
        newPassword: resetData.newPassword
      });
      toast.success("Password has been reset successfully.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport d-flex align-items-center justify-content-center p-3 p-md-4">
      <div className="master-glass-card p-3 p-md-5">
        <div className="row g-0 align-items-center">
          <div className="col-lg-6 d-flex justify-content-center justify-content-lg-start pe-lg-4">
            <div className="inner-form-card">
              <div className="mb-2 text-start">
                <h1 className="form-display-title">
                  {step === 1 ? "Forgot Password" : "Reset Password"}
                </h1>
                <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                  {step === 1 
                    ? "Enter your email to receive an OTP." 
                    : "Enter the OTPs sent to your email and phone, along with your new password."}
                </p>
              </div>

              {step === 1 ? (
                <form onSubmit={handleForgotPasswordSubmit} noValidate>
                  <div className="mb-3 text-start">
                    <label htmlFor="fp-email" className="custom-field-label">Email <span className="text-danger">*</span></label>
                    <input
                      id="fp-email"
                      type="email"
                      className={`form-control pristine-input ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="username@gmail.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      disabled={loading}
                    />
                    {errors.email && (
                      <div className="input-error-tip text-danger mt-1">
                        <i className="bi bi-x-circle-fill" /> {errors.email}
                      </div>
                    )}
                  </div>
                  <button type="submit" className="btn login-submit-btn w-100 mt-2 mb-3" disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Sending...</>
                    ) : "Send Reset OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} noValidate>
                  <div className="mb-3 text-start">
                    <label htmlFor="emailOtp" className="custom-field-label">Email OTP <span className="text-danger">*</span></label>
                    <input
                      id="emailOtp"
                      name="emailOtp"
                      type="text"
                      className={`form-control pristine-input text-center fs-5 tracking-wider ${errors.emailOtp ? 'is-invalid' : ''}`}
                      placeholder="------"
                      maxLength="6"
                      value={resetData.emailOtp}
                      onChange={handleResetChange}
                      disabled={loading}
                    />
                    {errors.emailOtp && (
                      <div className="input-error-tip text-danger mt-1">
                        <i className="bi bi-x-circle-fill" /> {errors.emailOtp}
                      </div>
                    )}
                  </div>

                  <div className="mb-3 text-start">
                    <label htmlFor="phoneOtp" className="custom-field-label">Phone OTP <span className="text-danger">*</span></label>
                    <input
                      id="phoneOtp"
                      name="phoneOtp"
                      type="text"
                      className={`form-control pristine-input text-center fs-5 tracking-wider ${errors.phoneOtp ? 'is-invalid' : ''}`}
                      placeholder="------"
                      maxLength="6"
                      value={resetData.phoneOtp}
                      onChange={handleResetChange}
                      disabled={loading}
                    />
                    {errors.phoneOtp && (
                      <div className="input-error-tip text-danger mt-1">
                        <i className="bi bi-x-circle-fill" /> {errors.phoneOtp}
                      </div>
                    )}
                  </div>

                  <div className="mb-3 text-start">
                    <label htmlFor="newPassword" className="custom-field-label">New Password <span className="text-danger">*</span></label>
                    <div className="input-embedded-wrapper">
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPw ? "text" : "password"}
                        autoComplete="new-password"
                        className={`form-control pristine-input ${errors.newPassword ? 'is-invalid' : ''}`}
                        placeholder="New Password"
                        value={resetData.newPassword}
                        onChange={handleResetChange}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="input-embedded-trigger"
                        onClick={() => setShowPw(v => !v)}
                        tabIndex="-1"
                      >
                        <i className={`bi ${showPw ? "bi-eye-slash" : "bi-eye"}`} />
                      </button>
                    </div>
                    {errors.newPassword && (
                      <div className="input-error-tip text-danger mt-1">
                        <i className="bi bi-x-circle-fill" /> {errors.newPassword}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn login-submit-btn w-100 mt-2 mb-3" disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Resetting...</>
                    ) : "Reset Password"}
                  </button>
                </form>
              )}

              <p className="text-center mb-0 login-footer-text">
                Remember your password?{" "}
                <Link to="/login" className="login-footer-link">
                  Back to Login
                </Link>
              </p>
            </div>
          </div>

          <div className="col-lg-6 character-canvas-panel">
            <img src={logoSrc} className="floating-brand-character" alt="InsuranceFlow dynamic brand character" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
