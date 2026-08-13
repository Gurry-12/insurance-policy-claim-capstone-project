import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import { notify } from "../../../utils/notificationService";
import { Wallet } from "lucide-react";
import ModernSelect from "../../../components/forms/ModernSelect";
import { recordPayment } from "../../../services/paymentService";
import { getPolicyById } from "../../../services/policyService";
import { PAYMENT_MODE_OPTIONS } from "../../../utils/options";

const StaffRecordPaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { policyId } = useParams();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    policyId: policyId || "",
    amount: location.state?.amount || "",
    paymentMode: "CARD",
    paymentStatus: "SUCCESS",
  });

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [policyDetails, setPolicyDetails] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.policyId) {
      errs.policyId = "Policy is required.";
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = "Amount must be greater than zero.";
    }
    return errs;
  };

  const clientErrors = validate();
  const errors = { ...clientErrors, ...serverErrors };

  useEffect(() => {
    if (policyId) {
      getPolicyById(policyId)
        .then((res) => {
          setPolicyDetails(res);
          if (!formData.amount) {
            setFormData((prev) => ({
              ...prev,
              amount: res.calculatedPremium || "",
            }));
          }
        })
        .catch((err) => console.error(err));
    }
  }, [policyId, formData.amount]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (serverErrors[e.target.name]) {
      setServerErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (Object.keys(clientErrors).length > 0) {
      return;
    }
    
    setLoading(true);

    try {
      const res = await recordPayment(formData);
      notify.success(res, "Payment recorded successfully");

      setTimeout(() => navigate("/staff/payments"), 2000);
    } catch (err) {
      if (err.fieldErrors) {
        setServerErrors(err.fieldErrors);
        notify.error("Please correct the highlighted fields.");
      } else {
        notify.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Record Premium Payment"
        subtitle="Record payment for the selected policy"
        onBack={() => navigate("/staff/policies")}
      />

      <div className="row justify-content-center mt-4">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <div className="d-flex align-items-center mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <Wallet size={24} className="text-primary" />
                </div>
                <div>
                  <h5 className="card-title mb-1">Payment Details</h5>
                  <p className="card-text text-muted small mb-0">
                    Record premium payment information
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <label className="form-label fw-medium">
                    Policy <span className="text-danger">*</span>
                  </label>
                  <ModernSelect
                    name="policyId"
                    value={formData.policyId}
                    onChange={handleChange}
                    required={true}
                    isDisabled={true}
                    error={(submitAttempted) ? errors.policyId : ""}
                    options={
                      policyDetails
                        ? [
                            {
                              value: policyDetails.policyId || policyDetails.id,
                              label: policyDetails.planName
                                ? `${policyDetails.planName} (No: ${policyDetails.policyNumber})`
                                : `Policy No: ${policyDetails.policyNumber}`
                            }
                          ]
                        : [{ value: formData.policyId, label: 'Loading policy details...' }]
                    }
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">
                    Premium Amount (₹) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    className={`form-control form-control-lg ${(errors.amount && (submitAttempted || formData.amount)) ? "is-invalid" : ""}`}
                    value={formData.amount}
                    placeholder="Amount auto-filled"
                    required
                    readOnly
                  />
                  {errors.amount && (submitAttempted || formData.amount) && (
                    <div className="invalid-feedback">{errors.amount}</div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Payment Mode</label>
                  <ModernSelect
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleChange}
                    options={PAYMENT_MODE_OPTIONS}
                  />
                </div>

                <button
                  className="btn btn-primary btn-lg w-100 mt-2"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="d-flex align-items-center justify-content-center">
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Recording...
                    </span>
                  ) : (
                    "Record Payment"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffRecordPaymentPage;
