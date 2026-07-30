import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import "../css/Login.css";
import { verifyOtpApi } from "../../services/authService";
import ResendOtp from "../../components/auth/ResendOtp";
import logoSrc from "../../assets/logo/insurance-heart-vector.png";

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const targetEmail = location.state?.email || searchParams.get("email") || "";

  const [formData, setFormData] = useState({
    email: targetEmail,
    emailOtp: "",
    phoneOtp: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(1);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = name.includes("Otp")
      ? value.replace(/\D/g, "")
      : value;

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) errs.email = "Email is required.";
    if (!formData.emailOtp.trim()) {
      errs.emailOtp = "Email OTP is required.";
    } else if (formData.emailOtp.length !== 6) {
      errs.emailOtp = "OTP must be 6 digits.";
    }
    if (!formData.phoneOtp.trim()) {
      errs.phoneOtp = "Phone OTP is required.";
    } else if (formData.phoneOtp.length !== 6) {
      errs.phoneOtp = "OTP must be 6 digits.";
    }
    return errs;
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        email: formData.email.trim(),
        emailOtp: formData.emailOtp.trim(),
        phoneOtp: formData.phoneOtp.trim(),
      };

      if (await verifyOtpApi(payload)) {
        toast.success("Verification successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      toast.error(
        err.message ||
          err.response?.data?.error ||
          "Verification failed.",
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
      <div className="master-glass-card p-3 p-md-5 d-flex justify-content-center align-items-center">
        <div className="inner-form-card">
          {/* Header Context Elements */}
          <div className="mb-2 text-start">
            <span className="brand-logo-sub">Security Check</span>
            <h1 className="form-display-title" style={{ textAlign: "left" }}>
              Verify OTP
            </h1>
          </div>

          {/* Execution Form */}
          <form onSubmit={handleVerifySubmit} noValidate>
            <div className="mb-3 text-start">
              <label htmlFor="otp-email" className="custom-field-label">
                Target Email Address <span className="text-danger">*</span>
              </label>
              <input
                id="otp-email"
                name="email"
                type="email"
                className={`form-control pristine-input ${errors.email ? "is-invalid" : ""}`}
                placeholder="username@gmail.com"
                value={formData.email}
                onChange={handleChange}
                disabled={!!targetEmail}
              />
              {errors.email && (
                <div className="input-error-tip text-danger mt-1">
                  <i className="bi bi-x-circle-fill" /> {errors.email}
                </div>
              )}
            </div>

            <div className="mb-3 text-start">
              <label htmlFor="otp-emailOtp" className="custom-field-label">
                Email OTP Code <span className="text-danger">*</span>
              </label>
              <input
                id="otp-emailOtp"
                name="emailOtp"
                type="text"
                maxLength={6}
                className={`form-control pristine-input otp-input-field ${errors.emailOtp ? "is-invalid" : ""}`}
                placeholder="------"
                value={formData.emailOtp}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.emailOtp && (
                <div className="input-error-tip text-danger mt-1">
                  <i className="bi bi-x-circle-fill" /> {errors.emailOtp}
                </div>
              )}
            </div>

            <div className="mb-3 text-start">
              <label htmlFor="otp-phoneOtp" className="custom-field-label">
                Phone OTP Code <span className="text-danger">*</span>
              </label>
              <input
                id="otp-phoneOtp"
                name="phoneOtp"
                type="text"
                maxLength={6}
                className={`form-control pristine-input otp-input-field ${errors.phoneOtp ? "is-invalid" : ""}`}
                placeholder="------"
                value={formData.phoneOtp}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.phoneOtp && (
                <div className="input-error-tip text-danger mt-1">
                  <i className="bi bi-x-circle-fill" /> {errors.phoneOtp}
                </div>
              )}
            </div>

            <button
              id="otp-submit-btn"
              type="submit"
              className="btn login-submit-btn w-100 mt-2 mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Validating...
                </>
              ) : (
                "Validate Codes"
              )}
            </button>
          </form>

          {/* Centered Resend Footer Panel */}
          <div className="text-center mt-3 login-footer-text d-flex align-items-center justify-content-center gap-1">
            {timer > 0 ? (
              <span className="resend-timer-text">
                Resend codes available in{" "}
                <strong className="text-dark">{timer}s</strong>
              </span>
            ) : (
              <>
                <span>Didn't receive code?</span>
                <ResendOtp email={formData.email} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
