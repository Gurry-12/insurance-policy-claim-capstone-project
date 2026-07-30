import { useState } from "react";
import { createPortal } from "react-dom";
import { notify } from "../../utils/notificationService";
import { resendOtpApi } from "../../services/authService";
import "../../pages/css/Otp.css";
import { handleApiError } from "../../utils/errorHandler";

const ResendOtp = ({ email = '', triggerButton = true, isOpenProp, onClose, onSuccess }) => {
  const [isInternalOpen, setIsInternalOpen] = useState(false);
  const [formData, setFormData] = useState({ email, phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isOpen = isOpenProp !== undefined ? isOpenProp : isInternalOpen;

  const handleClose = () => {
    if (onClose) onClose();
    setIsInternalOpen(false);
    setErrors({});
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phone') {
      value = value.replace(/\D/g, '');
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Enter a valid email.";
    }
    if (!formData.phone.trim()) {
      errs.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errs.phone = "Please enter a valid 10-digit mobile number";
    }
    return errs;
  };

  const handleResendSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      setLoading(true);

      const res = await resendOtpApi(
        formData.email.trim(),
        "+91" + formData.phone.trim()
      );

      if (res?.success) {
        notify.success(res, "New verification codes sent!");
        setTimeout(() => {
          handleClose();
          setFormData({ email: "", phone: "" });
          if (onSuccess) onSuccess();
        }, 1800);
      }
    } catch (err) {
      const { isValidationError, messages } = handleApiError(err, "Failed to resend OTP.");
      if (isValidationError) {
        setErrors(messages);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button styled seamlessly within the footer text */}
      {triggerButton && (
        <button
          type="button"
          className="vivid-text-link-btn ms-1"
          onClick={() => setIsInternalOpen(true)}
        >
          Resend OTP
        </button>
      )}

      {/* Pop-up Modal Window Overlay */}
      {isOpen && createPortal(
        <div className="otp-modal-backdrop">
          <div className="otp-modal-card p-4 text-start">
            {/* Modal Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5
                className="mb-0 fw-bold text-dark"
                style={{ fontSize: "1.1rem" }}
              >
                Request New OTP
              </h5>
              <button
                type="button"
                className="btn-close shadow-none"
                style={{ fontSize: "0.85rem" }}
                onClick={handleClose}
                disabled={loading}
              />
            </div>

            {/* Form Fields */}
            <form onSubmit={handleResendSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="resend-email" className="custom-field-label">
                  Email Address
                </label>
                <input
                  id="resend-email"
                  name="email"
                  type="email"
                  className={`form-control pristine-input ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="username@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.email && (
                  <div className="input-error-tip text-danger mt-1"><i className="bi bi-x-circle-fill" /> {errors.email}</div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="resend-phone" className="custom-field-label">
                  Phone Number
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">+91</span>
                  <input
                    id="resend-phone"
                    name="phone"
                    type="tel"
                    className={`form-control pristine-input border-start-0 ps-0 ${errors.phone ? 'is-invalid' : ''}`}
                    placeholder="9983710550"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                    maxLength="10"
                  />
                </div>
                {errors.phone && (
                  <div className="input-error-tip text-danger mt-1"><i className="bi bi-x-circle-fill" /> {errors.phone}</div>
                )}
              </div>

              <button
                type="submit"
                className="btn login-submit-btn w-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Requesting...
                  </>
                ) : (
                  "Send Code Request"
                )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ResendOtp;
