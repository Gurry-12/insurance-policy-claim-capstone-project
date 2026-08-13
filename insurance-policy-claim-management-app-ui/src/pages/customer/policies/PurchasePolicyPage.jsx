import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { notify } from "../../../utils/notificationService";
import { purchasePolicy } from "../../../services/policyService";
import { getPlanById } from "../../../services/planService";
import { generateQuote } from "../../../services/quoteService";
import PageHeader from "../../../components/common/PageHeader";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Stepper from "../../../components/common/Stepper";
import ErrorAlert from "../../../components/ui/ErrorAlert";
import CoverageOptionCard from "../../../components/common/CoverageOptionCard";
import PremiumBreakdownCard from "../../../components/customer/PremiumBreakdownCard";
import QuoteCountdownTimer from "../../../components/customer/QuoteCountdownTimer";
import { Shield, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import {PREMIUM_TYPE_OPTIONS} from "../../../utils/options";


const STEPS = ["Coverage", "Duration", "Quote", "Payment", "Policy"];

const PurchasePolicyPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();

  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planDetails, setPlanDetails] = useState(null);
  const [globalError, setGlobalError] = useState('');

  // Step management
  const [currentStep, setCurrentStep] = useState(0);

  // Selection state
  const [selectedCoverage, setSelectedCoverage] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedPremiumType, setSelectedPremiumType] = useState("");

  // Quote state
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [quoteExpired, setQuoteExpired] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!acceptedTerms) {
      errs.acceptedTerms = "You must accept the terms and declarations.";
    }
    return errs;
  };

  const clientErrors = validate();
  const errors = { ...clientErrors, ...serverErrors };

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const data = await getPlanById(planId);
        const plan = data.data || data;
        setPlanDetails(plan);
        // Auto-set premium type since each plan supports exactly one type
        const type = plan.supportedPremiumType ||
          (Array.isArray(plan.supportedPremiumTypes) && plan.supportedPremiumTypes[0]) ||
          '';
        setSelectedPremiumType(type);
      } catch (error) {
        notify.error("Failed to load plan details");
      } finally {
        setLoadingPlan(false);
      }
    };
    fetchPlan();
  }, [planId]);

  // Invalidate quote when selections change
  useEffect(() => {
    if (quoteData) {
      setQuoteData(null);
      setQuoteExpired(false);
      setAcceptedTerms(false);
    }
    setGlobalError('');
  }, [selectedCoverage, selectedDuration, selectedPremiumType]);

  const handleGenerateQuote = async () => {
    setIsGeneratingQuote(true);
    setGlobalError('');
    try {
      const payload = {
        planId: Number(planId),
        coverageAmount: Number(selectedCoverage),
        duration: Number(selectedDuration),
        premiumType: selectedPremiumType,
      };
      const res = await generateQuote(payload);
      setQuoteData(res.data || res);
      setQuoteExpired(false);
      notify.success("Quote generated successfully!");
      setCurrentStep(2); // Move to Quote step
    } catch (error) {
      console.error(error);
      const msg = error.message || "Failed to generate quote.";
      setGlobalError(msg);
      notify.error(msg);
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setGlobalError('');
    
    if (Object.keys(clientErrors).length > 0) {
      return;
    }
    if (quoteExpired) {
      const msg = "Quote has expired. Please generate a new quote.";
      setGlobalError(msg);
      notify.error(msg);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        quoteId: quoteData.quoteId || quoteData.id,
        paymentReferenceId: `PAY_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      };

      await purchasePolicy(payload);
      notify.success("Policy Purchased Successfully!");
      setCurrentStep(4); // Move to Policy (success) step
    } catch (error) {
      console.error(error);
      const msg = error.message || "Failed to purchase policy.";
      setGlobalError(msg);
      notify.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return !!selectedCoverage;
      case 1:
        return !!selectedDuration && !!selectedPremiumType;
      case 2:
        return !!quoteData && !quoteExpired;
      case 3:
        return acceptedTerms && !quoteExpired;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && canProceedToNext()) {
      handleGenerateQuote();
    } else if (currentStep === 2 && canProceedToNext()) {
      setCurrentStep(3);
    } else if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (step) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  if (loadingPlan) {
    return (
      <div className="animate-fade-in text-center mt-5">
        <LoadingSpinner />
        <p className="mt-2 text-muted">Loading plan details...</p>
      </div>
    );
  }

  if (!planDetails) {
    return (
      <div className="alert alert-danger m-4">
        Plan details could not be loaded. Please go back and try again.
      </div>
    );
  }

  return (
    <div className="animate-fade-in mb-5">
      <PageHeader
        title={planDetails.planName || "Purchase Policy"}
        subtitle="Configure your coverage and complete your purchase"
        onBack={() => navigate(-1)}
      />

      {globalError && (
        <div className="row justify-content-center mt-3">
          <div className="col-md-10 col-lg-8">
            <ErrorAlert
              message={globalError}
              onClose={() => setGlobalError("")}
            />
          </div>
        </div>
      )}

      <div className="row justify-content-center mt-4">
        <div className="col-md-10 col-lg-8">
          {/* Stepper */}
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              {/* Step 0: Coverage Selection */}
              {currentStep === 0 && (
                <div className="animate-fade-in">
                  <h5 className="fw-bold mb-1">
                    <Shield size={20} className="text-primary me-2" />
                    Select Coverage Amount
                  </h5>
                  <p className="text-muted small mb-4">
                    Choose the coverage amount that best suits your needs.
                  </p>

                  {planDetails.coverageOptions?.filter(
                    (opt) => (opt.isActive ?? opt.active) !== false
                  ).length === 0 && (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-shield-exclamation mb-2 d-block fs-2" />
                      No coverage options available for this plan.
                    </div>
                  )}

                  <div className="row g-3">
                    {planDetails.coverageOptions
                      ?.filter((opt) => (opt.isActive ?? opt.active) !== false)
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((opt, idx) => (
                        <div key={opt.id ?? idx} className="col-md-6">
                          <CoverageOptionCard
                            option={opt}
                            mode="select"
                            isSelected={selectedCoverage === String(opt.coverageAmount)}
                            onSelect={(o) => setSelectedCoverage(String(o.coverageAmount))}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Step 1: Duration & Premium Type */}
              {currentStep === 1 && (
                <div className="animate-fade-in">
                  <h5 className="fw-bold mb-1">
                    Select Duration & Payment Type
                  </h5>
                  <p className="text-muted small mb-4">
                    Choose your policy term and premium payment frequency.
                  </p>

                  <div className="mb-4">
                    <label className="form-label fw-bold">
                      Policy Duration
                    </label>
                    <div className="d-flex flex-wrap gap-2">
                      {planDetails.allowedDurations?.map((dur, idx) => (
                        <button
                          key={idx}
                          className={`btn ${selectedDuration === String(dur) ? "btn-primary" : "btn-outline-primary"}`}
                          onClick={() => setSelectedDuration(String(dur))}
                        >
                          {dur} Year{dur > 1 ? "s" : ""}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-bold mb-0">
                        Premium Payment Type
                      </label>
                      {selectedDuration > 1 &&
                        (
                          planDetails.supportedPremiumType === 'ONE_TIME' ||
                          (Array.isArray(planDetails.supportedPremiumTypes) &&
                            planDetails.supportedPremiumTypes.includes('ONE_TIME'))
                        ) && (
                          <span className="badge bg-success-subtle text-success small py-1 px-2">
                            <i className="bi bi-tag-fill me-1" />
                            Up to 20% Duration Discount on One-Time Upfront Payment!
                          </span>
                        )}
                    </div>
                    {/* Display only — plan has exactly one premium type, no choice needed */}
                    <div
                      className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 border border-primary bg-primary bg-opacity-10"
                    >
                      <i className="bi bi-check-circle-fill text-primary" />
                      <span className="fw-semibold text-primary">
                        {selectedPremiumType.replace('_', ' ')}
                      </span>
                      <span className="text-muted small ms-1">
                        {selectedPremiumType === 'ANNUAL'
                          ? '— Pay every year'
                          : selectedPremiumType === 'ONE_TIME'
                          ? '— Pay once upfront'
                          : ''}
                      </span>
                    </div>
                  </div>

                  {/* Selection Summary */}
                  <div
                    className="p-3 rounded-3"
                    style={{
                      backgroundColor: "var(--ip-surface-raised, #f8fafc)",
                    }}
                  >
                    <small className="text-muted d-block mb-2 fw-bold">
                      Your Selection
                    </small>
                    <div className="d-flex gap-4">
                      <div>
                        <span className="text-muted small">Coverage: </span>
                        <span className="fw-bold">
                          ₹{Number(selectedCoverage).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted small">Duration: </span>
                        <span className="fw-bold">
                          {selectedDuration} Year(s)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted small">Payment: </span>
                        <span className="fw-bold">{selectedPremiumType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Quote Review */}
              {currentStep === 2 && (
                <div className="animate-fade-in">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">
                      <CheckCircle size={20} className="text-success me-2" />
                      Your Quote
                    </h5>
                    {quoteData?.expiresAt && (
                      <QuoteCountdownTimer
                        expiresAt={quoteData.expiresAt}
                        onExpire={() => setQuoteExpired(true)}
                      />
                    )}
                  </div>

                  {quoteExpired ? (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2" />
                      Quote has expired. Please go back and generate a new
                      quote.
                    </div>
                  ) : (
                    <>
                      <PremiumBreakdownCard quoteDetails={quoteData} />

                      <div
                        className="p-3 rounded-3 mt-3"
                        style={{
                          backgroundColor: "var(--ip-success-bg, #f0fdf4)",
                          border: "1px solid var(--ip-success-subtle, #bbf7d0)",
                        }}
                      >
                        <small className="text-success fw-bold d-block mb-2">
                          Quote Summary
                        </small>
                        <div className="row g-2 small">
                          <div className="col-6">
                            <span className="text-muted">Coverage: </span>
                            <span className="fw-bold">
                              ₹
                              {Number(selectedCoverage).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Duration: </span>
                            <span className="fw-bold">
                              {selectedDuration} Year(s)
                            </span>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Payment Type: </span>
                            <span className="fw-bold">
                              {selectedPremiumType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Payment & Confirmation */}
              {currentStep === 3 && (
                <div className="animate-fade-in">
                  <h5 className="fw-bold mb-1">
                    <i className="bi bi-credit-card text-primary me-2" />
                    Confirm & Purchase
                  </h5>
                  <p className="text-muted small mb-4">
                    Review your details and confirm your purchase.
                  </p>

                  {/* Final Summary */}
                  <div
                    className="p-4 rounded-3 mb-4"
                    style={{
                      backgroundColor: "var(--ip-surface-raised, #f8fafc)",
                    }}
                  >
                    <div className="row g-3">
                      <div className="col-6">
                        <small className="text-muted d-block">Plan</small>
                        <span className="fw-bold">{planDetails.planName}</span>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">Coverage</small>
                        <span className="fw-bold">
                          ₹{Number(selectedCoverage).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">Duration</small>
                        <span className="fw-bold">
                          {selectedDuration} Year(s)
                        </span>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">
                          Payment Type
                        </small>
                        <span className="fw-bold">{selectedPremiumType}</span>
                      </div>
                    </div>
                  </div>

                  <PremiumBreakdownCard quoteDetails={quoteData} />

                  <form onSubmit={handlePurchase} noValidate className="mt-4">
                    <div className="mb-4 form-check">
                      <input
                        type="checkbox"
                        className={`form-check-input ${(errors.acceptedTerms && submitAttempted) ? "is-invalid" : ""}`}
                        id="termsCheck"
                        checked={acceptedTerms}
                        disabled={quoteExpired}
                        onChange={(e) => {
                          setAcceptedTerms(e.target.checked);
                          if (serverErrors.acceptedTerms) setServerErrors({});
                        }}
                      />
                      <label
                        className="form-check-label text-muted small"
                        htmlFor="termsCheck"
                      >
                        I declare that the information provided is correct. I
                        agree to the terms and conditions and acknowledge that
                        my policy coverage will begin starting today. Note:
                        Cancellation policies apply as per standard terms.
                      </label>
                      {errors.acceptedTerms && submitAttempted && (
                        <div className="input-error-tip text-danger mt-1">
                          <i className="bi bi-x-circle-fill" />{" "}
                          {errors.acceptedTerms}
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* Step 4: Success */}
              {currentStep === 4 && (
                <div className="animate-fade-in text-center py-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                    style={{
                      width: 80,
                      height: 80,
                      backgroundColor: "var(--ip-success-subtle, #d1fae5)",
                      color: "var(--ip-success, #10b981)",
                    }}
                  >
                    <CheckCircle size={40} />
                  </div>
                  <h4 className="fw-bold text-success mb-2">
                    Policy Purchased Successfully!
                  </h4>
                  <p className="text-muted mb-4">
                    Your policy has been created. You can view your policy
                    details in the My Policies section.
                  </p>
                  <button
                    className="btn btn-primary px-4"
                    onClick={() => navigate("/customer/policies")}
                  >
                    View My Policies
                  </button>
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep < 4 && (
                <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft size={16} className="me-1" />
                    Back
                  </button>

                  {currentStep === 3 ? (
                    <button
                      className="btn btn-primary btn-lg px-5"
                      onClick={handlePurchase}
                      disabled={isSubmitting || !canProceedToNext()}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Confirm & Purchase
                          <CheckCircle size={16} className="ms-2" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={handleNext}
                      disabled={!canProceedToNext() || isGeneratingQuote}
                    >
                      {isGeneratingQuote ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Generating Quote...
                        </>
                      ) : currentStep === 1 ? (
                        <>
                          Generate Quote
                          <ArrowRight size={16} className="ms-1" />
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight size={16} className="ms-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasePolicyPage;
