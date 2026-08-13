import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import FormInput from '../../../components/forms/FormInput';
import AlertModal from '../../../components/modals/AlertModal';
import ModernSelect from '../../../components/forms/ModernSelect';
import FormGuidelines from '../../../components/ui/FormGuidelines';
import { createStaff } from '../../../services/userService';
import { notify } from '../../../utils/notificationService';
import { SPECIALITY_OPTIONS } from "../../../utils/options";

const CreateStaffPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    productSpeciality: 'HEALTH',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const validate = () => {
    const errs = {};
    const nameRegex = /^[a-zA-Z\s]+$/;
    
    if (!formData.firstName.trim()) {
      errs.firstName = 'First Name is required.';
    } else if (!nameRegex.test(formData.firstName.trim())) {
      errs.firstName = 'Only letters and spaces are allowed.';
    } else if (formData.firstName.trim().length < 2 || formData.firstName.trim().length > 50) {
      errs.firstName = 'First Name should be between 2 and 50 characters.';
    }

    if (!formData.lastName.trim()) {
      errs.lastName = 'Last Name is required.';
    } else if (!nameRegex.test(formData.lastName.trim())) {
      errs.lastName = 'Only letters and spaces are allowed.';
    } else if (formData.lastName.trim().length < 2 || formData.lastName.trim().length > 50) {
      errs.lastName = 'Last Name should be between 2 and 50 characters.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errs.email = 'Enter a valid email address.';
      }
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else {
      const passRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
      if (!passRegex.test(formData.password)) {
        errs.password = 'Password must be 8-64 characters and contain at least one letter and one digit.';
      }
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errs.phone = 'Enter a valid 10-digit mobile number.';
    }
    
    if (!formData.productSpeciality) {
      errs.productSpeciality = 'Product Speciality is required.';
    }

    return errs;
  };

  const clientErrors = validate();
  const errors = { ...clientErrors, ...serverErrors };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Digits-only enforcement for phone, max 10 digits
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digitsOnly }));
      if (serverErrors.phone) setServerErrors(prev => ({ ...prev, phone: '' }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (serverErrors[name]) setServerErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'firstName' || name === 'lastName') {
      if (serverErrors.fullName) setServerErrors(prev => ({ ...prev, fullName: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setSubmitting(true);
    
    if (Object.keys(clientErrors).length > 0) {
      setSubmitting(false);
      return;
    }

    const payload = {
      fullName: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      password: formData.password,
      mobileNumber: "+91" + formData.phone.trim(),
      productSpeciality: formData.productSpeciality
    };

    createStaff(payload)
      .then((res) => {
        notify.success(res, 'Staff registered successfully! An email/SMS with the verification link has been sent.');
        navigate('/admin/users');
      })
      .catch((err) => {
        if (err.fieldErrors) {
          setServerErrors(err.fieldErrors);
          notify.error("Please correct the highlighted fields.");
        } else {
          notify.error(err);
        }
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <PageHeader
        title="Create New Staff"
        subtitle="Register a new insurance Staff into the system"
        onBack={() => navigate("/admin/users")}
      />

      <FormGuidelines
        title="Rules for Adding Staff"
        rules={[
          "Staff First and Last Name can only contain letters and spaces (2-100 characters).",
          "Phone must be a valid 10-digit number.",
          "Password must be 8-64 characters and contain at least one letter and one digit.",
          "A Product Speciality must be selected."
        ]}
      />

      <div
        className="card border-0"
        style={{ borderRadius: 16, boxShadow: "var(--ip-shadow-md)" }}
      >
        <div className="card-body p-4 p-md-5">
          <form onSubmit={handleSubmit} noValidate>
            <h5
              className="mb-4 fw-bold"
              style={{ color: "var(--ip-text-primary)" }}
            >
              Staff Information
            </h5>

            <div className="row">
              <div className="col-md-6">
                <FormInput
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. John"
                  error={(submitAttempted || formData.firstName.length > 0) ? errors.firstName : ''}
                />
              </div>
              <div className="col-md-6">
                <FormInput
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Doe"
                  error={(submitAttempted || formData.lastName.length > 0) ? errors.lastName : ''}
                />
              </div>
            </div>

            <div className="row mt-2">
              <div className="col-md-6">
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john.doe@example.com"
                  error={(submitAttempted || formData.email.length > 0) ? errors.email : ''}
                />
              </div>
              <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="phone" className="form-label" style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                  Phone Number <span className="text-danger">*</span>
                </label>
                <div
                  className={`d-flex align-items-center rounded overflow-hidden ${
                    (errors.phone && (submitAttempted || formData.phone.length > 0))
                      ? 'border border-danger'
                      : formData.phone.length === 10 && !errors.phone
                      ? 'border border-success'
                      : 'border'
                  }`}
                  style={{ background: '#fff', transition: 'border-color 0.2s' }}
                >
                  <span
                    className="px-3 py-2 fw-semibold flex-shrink-0"
                    style={{
                      borderRight: '1px solid #dee2e6',
                      color: (errors.phone && (submitAttempted || formData.phone.length > 0)) ? '#dc3545' : formData.phone.length === 10 && !errors.phone ? '#198754' : 'var(--ip-primary)',
                      fontSize: '0.9rem',
                      background: '#f8f9fa',
                      userSelect: 'none',
                    }}
                  >+91</span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className="form-control border-0 ps-2"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
                      if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) { e.preventDefault(); return; }
                      if (/^\d$/.test(e.key) && formData.phone.length >= 10) { e.preventDefault(); }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10);
                      setFormData(prev => ({ ...prev, phone: pasted }));
                    }}
                    style={{ boxShadow: 'none', outline: 'none' }}
                  />
                  <span
                    className={`pe-2 flex-shrink-0 small ${formData.phone.length === 10 ? 'text-success fw-semibold' : 'text-muted'}`}
                    style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                  >
                    {formData.phone.length}/10
                  </span>
                </div>
                {errors.phone && (submitAttempted || formData.phone.length > 0) && (
                  <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>
                    <i className="bi bi-x-circle-fill me-1" />{errors.phone}
                  </div>
                )}
                {!errors.phone && formData.phone.length === 10 && (
                  <div className="text-success mt-1" style={{ fontSize: '0.8rem' }}>
                    <i className="bi bi-check-circle-fill me-1" />Looks good!
                  </div>
                )}
              </div>
              </div>
            </div>

            <div className="row mt-2">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label className="fw-bold mb-1" style={{ fontSize: "0.85rem" }}>
                    Temporary Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-embedded-wrapper">
                    <input
                      id="staff-password"
                      name="password"
                      type={showPw ? "text" : "password"}
                      className={`form-control pristine-input${(errors.password && (submitAttempted || formData.password.length > 0)) ? ' is-invalid' : ''}`}
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="input-embedded-trigger"
                      onClick={() => setShowPw(v => !v)}
                      tabIndex="-1"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                  {errors.password && (submitAttempted || formData.password.length > 0) && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-x-circle-fill" /> {errors.password}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                  <ModernSelect
                    label="Product Speciality"
                    name="productSpeciality"
                    value={formData.productSpeciality}
                    onChange={handleChange}
                    required={true}
                    options={SPECIALITY_OPTIONS}
                    error={(submitAttempted) ? errors.productSpeciality : ''}
                  />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-3 mt-5">
              <button
                type="button"
                className="btn btn-light px-4"
                style={{ borderRadius: "8px" }}
                onClick={() => navigate("/admin/users")}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4"
                style={{ borderRadius: "8px" }}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Staff"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AlertModal
        isOpen={showSuccess}
        type="success"
        title="Staff Created!"
        message="The new Staff has been successfully registered in the system."
        onClose={() => {
          setShowSuccess(false);
          navigate("/admin/users");
        }}
      />
    </div>
  );
};

export default CreateStaffPage;

