import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from 'react-hot-toast';
import useAuth from "../../hooks/useAuth";
import { login as loginService } from "../../services/authService";
import { ROLE_HOME } from "../../utils/roles";
import logoSrc from "../../assets/logo/insurance-heart-vector.png";
import ResendOtp from "../../components/auth/ResendOtp";
import LoadingButton from "../../components/ui/LoadingButton";
import "../css/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: { email: "", password: "" },
    mode: "onTouched"
  });

  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showUnverifiedModal, setShowUnverifiedModal] = useState(false);

  // Watch email for the OTP modal
  // eslint-disable-next-line react-hooks/incompatible-library
  const emailValue = watch("email");

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const { token, user } = await loginService(data);
      login(token, user);
      toast.success("Logged in successfully!");
      const from = location.state?.from?.pathname;
      navigate(from || ROLE_HOME[user.role] || "/", { replace: true });
    } catch (err) {
      const msg =
        err.message ||
        err.response?.data?.error ||
        "Invalid email or password. Please try again.";
      
      if (msg.toLowerCase().includes("verif")) {
        setShowUnverifiedModal(true);
      } else {
        toast.error(msg);
      }
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
                <h1 className="form-display-title">Login</h1>
              </div>



              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="mb-3 text-start">
                  <label htmlFor="login-email" className="custom-field-label">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    className={`form-control pristine-input ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="username@gmail.com"
                    disabled={loading}
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    {...register("email", {
                      required: "Email is required.",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email."
                      }
                    })}
                  />
                  {errors.email && (
                    <div id="email-error" className="input-error-tip text-danger mt-1" aria-live="polite">
                      <i className="bi bi-x-circle-fill" /> {errors.email.message}
                    </div>
                  )}
                </div>

                <div className="mb-3 text-start">
                  <label
                    htmlFor="login-password"
                    className="custom-field-label"
                  >
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-embedded-wrapper">
                    <input
                      id="login-password"
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      className={`form-control pristine-input ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="Password"
                      disabled={loading}
                      aria-invalid={errors.password ? "true" : "false"}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      {...register("password", { 
                        required: "Password is required.",
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{6,15}$/,
                          message: "Password must be 6-15 characters and contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@#$%^&+=!)."
                        }
                      })}
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
                  {errors.password && (
                    <div id="password-error" className="input-error-tip text-danger mt-1" aria-live="polite">
                      <i className="bi bi-x-circle-fill" /> {errors.password.message}
                    </div>
                  )}
                </div>
                
                <div className="text-end mt-1 mb-3">
                  <Link to="/forgot-password" className="login-footer-link" style={{ fontSize: "0.85rem", textDecoration: "none" }}>Forgot Password?</Link>
                </div>

                <LoadingButton
                  id="login-submit-btn"
                  type="submit"
                  className="login-submit-btn w-100 mt-2 mb-3"
                  isLoading={loading}
                  loadingText="Signing in..."
                >
                  Sign In
                </LoadingButton>
              </form>

              <p className="text-center mb-0 login-footer-text">
                Don't have an account yet?{" "}
                <Link to="/register" className="login-footer-link">
                  Register for free
                </Link>
              </p>
            </div>
          </div>

          <div className="col-lg-6 character-canvas-panel">
            <img
              src={logoSrc}
              className="floating-brand-character"
              alt="InsuranceFlow dynamic brand character"
            />
          </div>
        </div>
      </div>

      <ResendOtp
        email={emailValue}
        triggerButton={false}
        isOpenProp={showUnverifiedModal}
        onClose={() => setShowUnverifiedModal(false)}
        onSuccess={() => {
          setShowUnverifiedModal(false);
          navigate("/verify-otp", { state: { email: emailValue } });
        }}
      />
    </div>
  );
};

export default Login;
