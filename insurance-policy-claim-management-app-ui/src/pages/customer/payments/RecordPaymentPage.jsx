import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { notify } from "../../../utils/notificationService";
import { recordPayment } from "../../../services/paymentService";
import { getMyPolicies } from "../../../services/policyService";
import PageHeader from "../../../components/common/PageHeader";
import { Wallet } from "lucide-react";
import ModernSelect from "../../../components/forms/ModernSelect";
import { PAYMENT_MODE_OPTIONS } from "../../../utils/options";

const RecordPaymentPage = () => {
  const navigate = useNavigate();
  const { policyId } = useParams();

  const [formData, setFormData] = useState({
    policyId: policyId || "",
    amount: "",
    paymentMode: "UPI",
    paymentStatus: "SUCCESS",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await getMyPolicies();
        const list = response.content || response.data || (Array.isArray(response) ? response : []);
        setPolicies(list);
        
        // If policyId is pre-selected, find and set the default premium amount
        if (policyId && list.length > 0) {
          const selected = list.find(p => String(p.id || p.policyId) === String(policyId));
          if (selected) {
            setFormData(prev => ({
              ...prev,
              amount: selected.calculatedPremium || selected.premium || ""
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch policies:", err);
      } finally {
        setIsLoadingPolicies(false);
      }
    };
    fetchPolicies();
  }, [policyId]);

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.policyId) {
      errs.policyId = "Policy is required";
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = "Amount must be greater than zero";
    }
    return errs;
  };

  const clientErrors = validate();
  const errors = { ...clientErrors, ...serverErrors };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "policyId") {
      const selected = policies.find(p => String(p.id || p.policyId) === String(value));
      setFormData(prev => ({
        ...prev,
        policyId: value,
        amount: selected ? (selected.calculatedPremium || selected.premium || "") : ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    if (serverErrors[name]) {
      setServerErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (Object.keys(clientErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };
      const res = await recordPayment(payload);
      notify.success(res, "Payment Recorded Successfully");
      navigate("/customer/payments");
    } catch (error) {
      console.error(error);
      if (error.fieldErrors) {
        setServerErrors(error.fieldErrors);
        notify.error("Please correct the highlighted fields.");
      } else {
        notify.error(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Make Payment"
        subtitle="Securely pay your policy premium"
        action={
          <button onClick={() => navigate(-1)} className="btn btn-outline-secondary d-inline-flex align-items-center gap-1" style={{ borderRadius: '8px' }}>
            <i className="bi bi-arrow-left"></i> Back
          </button>
        }
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
                  <p className="card-text text-muted small mb-0">Enter your payment information</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <label className="form-label fw-medium">Select Policy <span className="text-danger">*</span></label>
                  {isLoadingPolicies ? (
                    <div className="form-control form-control-lg bg-light text-muted">Loading policies...</div>
                  ) : (
                    <ModernSelect
                      name="policyId"
                      value={formData.policyId}
                      onChange={handleChange}
                      required={true}
                      isDisabled={!!policyId}
                      error={(submitAttempted) ? errors.policyId : ''}
                      options={policies.map(policy => ({
                        value: policy.id || policy.policyId,
                        label: policy.planName ? `${policy.planName} (No: ${policy.policyNumber})` : `Policy No: ${policy.policyNumber}`
                      }))}
                      placeholder="-- Select a Policy --"
                    />
                  )}
                  {errors.policyId && submitAttempted && <div className="invalid-feedback d-block">{errors.policyId}</div>}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Amount (₹) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="amount"
                    className={`form-control form-control-lg ${(errors.amount && (submitAttempted || formData.amount)) ? 'is-invalid' : ''}`}
                    value={formData.amount}
                    required
                    min="1"
                    placeholder="Amount auto-filled"
                    readOnly
                  />
                  {errors.amount && (submitAttempted || formData.amount) && <div className="invalid-feedback">{errors.amount}</div>}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="d-flex align-items-center justify-content-center">
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </span>
                  ) : (
                    "Pay Premium"
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

export default RecordPaymentPage;
