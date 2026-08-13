import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { raiseClaim } from "../../../services/claimService";
import { getMyPolicies, getPolicyById } from "../../../services/policyService";
import PageHeader from "../../../components/common/PageHeader";
import { FilePlus, ArrowLeft, Save, ShieldCheck, AlertCircle, FileText, IndianRupee, FileUp, Info, X } from "lucide-react";
import ModernSelect from "../../../components/forms/ModernSelect";
import ModernDatePicker from "../../../components/forms/ModernDatePicker";
import { notify } from "../../../utils/notificationService";
import { PRODUCT_DOCUMENT_CATEGORIES } from "../../../utils/documentCategories";
import ErrorAlert from "../../../components/ui/ErrorAlert";
import { formatINR } from "../../../utils/formatters";

const RaiseClaimPage = () => {
  const navigate = useNavigate();

  const [claim, setClaim] = useState({
    policyId: "",
    claimAmount: "",
    claimReason: "",
    incidentDate: "",
  });

  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [policies, setPolicies] = useState([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);
  const [selectedPolicyDetails, setSelectedPolicyDetails] = useState(null);
  const [isLoadingPolicyDetails, setIsLoadingPolicyDetails] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await getMyPolicies();
        setPolicies(response.content || response.data || (Array.isArray(response) ? response : []));
      } catch (error) {
        console.error("Failed to fetch policies:", error);
      } finally {
        setIsLoadingPolicies(false);
      }
    };
    fetchPolicies();
  }, []);

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!claim.policyId) errs.policyId = 'Policy is required';
    
    if (!claim.claimAmount) {
      errs.claimAmount = 'Claim amount is required';
    } else {
      const amount = Number(claim.claimAmount);
      if (amount <= 0) {
        errs.claimAmount = 'Claim amount must be greater than 0';
      } else if (selectedPolicyDetails) {
        const remaining = selectedPolicyDetails.remainingClaimAmount ?? selectedPolicyDetails.selectedCoverage ?? 0;
        if (amount > remaining) {
          errs.claimAmount = `Cannot exceed remaining coverage (${formatINR(remaining)})`;
        }
      }
    }
    
    if (!claim.incidentDate) {
      errs.incidentDate = 'Incident date is required';
    } else if (selectedPolicyDetails && selectedPolicyDetails.startDate) {
      const incDate = new Date(claim.incidentDate);
      const startDate = new Date(selectedPolicyDetails.startDate);
      incDate.setHours(0,0,0,0);
      startDate.setHours(0,0,0,0);
      if (incDate < startDate) {
        errs.incidentDate = `Date cannot be before policy start date (${startDate.toLocaleDateString()})`;
      }
    }
    
    if (!claim.claimReason?.trim()) errs.claimReason = 'Claim reason is required';
    else if (claim.claimReason.length > 2000) errs.claimReason = 'Claim reason cannot exceed 2000 characters';
    if (files.length === 0) errs.files = 'Upload at least one document';
    
    return errs;
  };

  const clientErrors = validate();
  const errors = { ...clientErrors, ...serverErrors };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setClaim(prev => ({ ...prev, [name]: value }));
    
    if (name === "policyId") {
      if (value) {
        setIsLoadingPolicyDetails(true);
        try {
          const details = await getPolicyById(value);
          setSelectedPolicyDetails(details);
        } catch (err) {
          console.error("Failed to fetch policy details", err);
          setSelectedPolicyDetails(null);
        } finally {
          setIsLoadingPolicyDetails(false);
        }
      } else {
        setSelectedPolicyDetails(null);
      }
    }

    if (serverErrors[name]) {
      setServerErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    if (!selectedDocType) {
      notify.error("Please select a document category first");
      e.target.value = null;
      return;
    }
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = [];
      const invalidFiles = [];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (!allowedTypes.includes(file.type)) {
          invalidFiles.push(`${file.name} (invalid format)`);
        } else if (file.size > maxSize) {
          invalidFiles.push(`${file.name} (exceeds 5MB)`);
        } else {
          newFiles.push(file);
        }
      }

      if (invalidFiles.length > 0) {
        notify.error(`Some files could not be added: \n${invalidFiles.join('\n')}`);
      }

      if (newFiles.length > 0) {
        const categorizedFiles = newFiles.map(file => ({
          file: file,
          docType: selectedDocType
        }));
        setFiles((prev) => [...prev, ...categorizedFiles]);
        if (serverErrors.files) {
          setServerErrors((prev) => ({ ...prev, files: '' }));
        }
      }
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (Object.keys(clientErrors).length > 0) {
      setGlobalError('Please fill all required fields correctly.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();

      const claimBlob = new Blob([JSON.stringify(claim)], {
        type: "application/json",
      });

      formData.append("claim", claimBlob);

      files.forEach((fileObj) => {
        const originalFile = fileObj.file;
        const extension = originalFile.name.substring(originalFile.name.lastIndexOf('.'));
        const safeDocType = fileObj.docType.replace(/[^a-zA-Z0-9]/g, '_');
        const safeName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9]/g, '_');
        const newFileName = `${safeDocType}_${safeName}${extension}`;
        
        const renamedFile = new File([originalFile], newFileName, { type: originalFile.type });
        formData.append("files", renamedFile);
      });

      const res = await raiseClaim(formData);
      notify.success(res, "Claim Raised Successfully");
      navigate("/customer/claims");
    } catch (error) {
      console.error(error);
      if (error.fieldErrors) {
        setServerErrors(error.fieldErrors);
        setGlobalError("Please correct the highlighted fields.");
        notify.error("Please correct the highlighted fields.");
      } else {
        const msg = typeof error === 'string' ? error : (error.message || "Failed to submit claim.");
        setGlobalError(msg);
        notify.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in pb-5">
      <PageHeader
        title="Raise a Claim"
        subtitle="Submit a new insurance claim and track its progress."
        icon={FilePlus}
        action={
          <Link to="/customer/claims" className="btn btn-outline-secondary rounded-pill px-4 py-2">
            <ArrowLeft size={18} className="me-2" />
            Back to Claims
          </Link>
        }
      />

      {globalError && (
        <div className="mt-3">
          <ErrorAlert message={globalError} onClose={() => setGlobalError('')} />
        </div>
      )}

      <div className="row g-4 mt-2">
        {/* Left Column: Instructions & Tips */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', background: 'linear-gradient(145deg, #f0f7ff 0%, #ffffff 100%)' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <ShieldCheck size={28} className="text-primary me-2" />
                <h5 className="mb-0 fw-bold text-dark">Claim Process</h5>
              </div>
              <p className="text-muted small mb-4">
                We've made claiming simple. Fill out the details, attach your proof, and we'll handle the rest.
              </p>

              <div className="d-flex mb-3">
                <div className="me-3">
                  <div className="bg-white rounded-circle d-flex justify-content-center align-items-center shadow-sm" style={{ width: 36, height: 36 }}>
                    <span className="fw-bold text-primary">1</span>
                  </div>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Select Policy</h6>
                  <p className="text-muted small mb-0">Choose the active policy for your claim.</p>
                </div>
              </div>

              <div className="d-flex mb-3">
                <div className="me-3">
                  <div className="bg-white rounded-circle d-flex justify-content-center align-items-center shadow-sm" style={{ width: 36, height: 36 }}>
                    <span className="fw-bold text-primary">2</span>
                  </div>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Incident Details</h6>
                  <p className="text-muted small mb-0">Provide date, amount, and a clear reason.</p>
                </div>
              </div>

              <div className="d-flex">
                <div className="me-3">
                  <div className="bg-white rounded-circle d-flex justify-content-center align-items-center shadow-sm" style={{ width: 36, height: 36 }}>
                    <span className="fw-bold text-primary">3</span>
                  </div>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Upload Proof</h6>
                  <p className="text-muted small mb-0">Attach invoices, reports, or photos.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="alert alert-info border-0 shadow-sm d-flex" style={{ borderRadius: '16px' }}>
            <Info size={24} className="text-info me-3 flex-shrink-0 mt-1" />
            <div>
              <h6 className="fw-bold mb-1">Need Help?</h6>
              <p className="small mb-0">If you are unsure about what documents to upload, please contact our support team before submitting.</p>
            </div>
          </div>
        </div>

        {/* Right Column: The Form */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body p-4 p-md-5">
              <form onSubmit={handleSubmit} noValidate>
                <h5 className="fw-bold mb-4 border-bottom pb-3">Claim Information</h5>
                
                <div className="row g-4 mb-4">
                  <div className="col-md-12">
                    <ModernSelect
                      label="Select Policy"
                      name="policyId"
                      value={claim.policyId}
                      onChange={handleChange}
                      options={policies
                        .filter(policy => policy.policyStatus === 'ACTIVE')
                        .map(policy => ({
                          value: policy.id || policy.policyId,
                          label: policy.planName ? `${policy.planName} (No: ${policy.policyNumber})` : `Policy No: ${policy.policyNumber}`,
                          mainText: policy.planName || 'Policy',
                          subText: `No: ${policy.policyNumber}`
                        }))
                      }
                      placeholder={isLoadingPolicies ? "Loading policies..." : "Choose an active policy..."}
                      error={(submitAttempted) ? errors.policyId : ''}
                      required={true}
                      isDisabled={isLoadingPolicies}
                    />

                    {/* Real-time Coverage Display */}
                    {isLoadingPolicyDetails && (
                      <div className="mt-2 text-muted small"><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Fetching policy details...</div>
                    )}
                    {!isLoadingPolicyDetails && selectedPolicyDetails && (
                      <div className="mt-3 p-3 rounded-3 border d-flex align-items-center bg-white" style={{ borderColor: 'var(--ip-border)' }}>
                        <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                          <ShieldCheck size={24} className="text-success" />
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-muted small fw-medium mb-1">Available Claim Coverage</div>
                          <h4 className="mb-0 fw-bold text-success">
                            {formatINR(selectedPolicyDetails.remainingClaimAmount ?? selectedPolicyDetails.selectedCoverage ?? 0)}
                          </h4>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium text-secondary">
                      Claim Amount <span className="text-danger">*</span>
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light border-end-0">
                        <IndianRupee size={20} className="text-muted" />
                      </span>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        className={`form-control border-start-0 ps-0 bg-light ${(errors.claimAmount && (submitAttempted || String(claim.claimAmount).length > 0)) ? 'is-invalid' : ''}`}
                        name="claimAmount"
                        value={claim.claimAmount}
                        onChange={handleChange}
                        placeholder="e.g. 5000"
                        onKeyDown={(e) => { if (e.key === '.' || e.key === 'e') e.preventDefault(); }}
                      />
                      {errors.claimAmount && (submitAttempted || String(claim.claimAmount).length > 0) && <div className="invalid-feedback">{errors.claimAmount}</div>}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <ModernDatePicker
                      label="Incident Date"
                      name="incidentDate"
                      selectedDate={claim.incidentDate}
                      onChange={handleChange}
                      error={(submitAttempted || claim.incidentDate) ? errors.incidentDate : ''}
                      required={true}
                      minDate={selectedPolicyDetails?.startDate ? new Date(selectedPolicyDetails.startDate.split('T')[0]) : null}
                      maxDate={new Date()}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-medium text-secondary">
                      Reason for Claim <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 align-items-start pt-3">
                        <AlertCircle size={20} className="text-muted" />
                      </span>
                      <textarea
                        className={`form-control border-start-0 ps-0 bg-light ${(errors.claimReason && (submitAttempted || claim.claimReason.length > 0)) ? 'is-invalid' : ''}`}
                        rows="4"
                        name="claimReason"
                        value={claim.claimReason}
                        onChange={handleChange}
                        placeholder="Please describe what happened in detail..."
                        maxLength={2000}
                      />
                      {errors.claimReason && (submitAttempted || claim.claimReason.length > 0) && <div className="invalid-feedback">{errors.claimReason}</div>}
                      <small className={`d-block text-end mt-1 ${claim.claimReason.length > 1900 ? 'text-warning' : 'text-muted'}`}>
                        {claim.claimReason.length}/2000 characters
                      </small>
                    </div>
                  </div>
                </div>

                <h5 className="fw-bold mb-4 border-bottom pb-3 mt-5">Supporting Documents</h5>

                <div className="mb-4">
                  <div className="mb-3">
                    <ModernSelect
                      label="Document Category"
                      name="selectedDocType"
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      options={[
                        { value: '', label: 'Select a category...' },
                        ...(
                          selectedPolicyDetails?.productType && PRODUCT_DOCUMENT_CATEGORIES[selectedPolicyDetails.productType]
                            ? PRODUCT_DOCUMENT_CATEGORIES[selectedPolicyDetails.productType]
                            : PRODUCT_DOCUMENT_CATEGORIES.INSURANCE
                        ).map(doc => ({ value: doc, label: doc }))
                      ]}
                      required={true}
                    />
                    <div className="form-text mb-3">Select the type of document before uploading it below.</div>
                  </div>

                  <div className={`p-5 text-center border rounded-3 ${!selectedDocType ? 'bg-secondary bg-opacity-10' : 'bg-light'} position-relative ${errors.files ? 'border-danger' : 'border-dashed'}`} style={{ borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--ip-border)' }}>
                    <FileUp size={48} className="text-primary mb-3 opacity-75" />
                    <h6 className="fw-bold">Upload your files here</h6>
                    <p className="text-muted small mb-3">Supported formats: PDF, JPG, PNG. Max 5MB per file.</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="form-control position-absolute top-0 start-0 w-100 h-100 opacity-0"
                      onChange={handleFileChange}
                      onClick={(e) => {
                        if (!selectedDocType) {
                          e.preventDefault();
                          notify.error("Please select a document category first");
                        }
                      }}
                      style={{ cursor: !selectedDocType ? 'not-allowed' : 'pointer', zIndex: 10 }}
                    />
                    <button type="button" className="btn btn-outline-primary rounded-pill px-4 py-2" style={{ pointerEvents: 'none' }}>
                      Browse Files
                    </button>
                  </div>
                  
                  {files.length > 0 && (
                    <div className="mt-4">
                      <h6 className="fw-medium mb-3 text-secondary">Selected Files ({files.length})</h6>
                      <div className="row g-3">
                        {files.map((fileObj, index) => {
                          const isImage = fileObj.file.type.startsWith('image/');
                          const previewUrl = isImage ? URL.createObjectURL(fileObj.file) : null;
                          return (
                            <div key={index} className="col-md-6 col-lg-4">
                              <div className="border rounded-3 p-2 d-flex align-items-center bg-white shadow-sm position-relative h-100">
                                <div className="me-3 flex-shrink-0 bg-light rounded d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '48px', height: '48px' }}>
                                  {isImage ? (
                                    <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <FileText size={24} className="text-primary" />
                                  )}
                                </div>
                                <div className="text-truncate flex-grow-1 pe-4">
                                  <div className="fw-medium small text-truncate" title={fileObj.file.name}>{fileObj.file.name}</div>
                                  <div className="text-muted d-flex align-items-center gap-2 mt-1" style={{ fontSize: '11px' }}>
                                    <span>{(fileObj.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25" style={{ fontSize: '10px' }}>{fileObj.docType}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="btn btn-sm btn-light text-danger position-absolute top-50 end-0 translate-middle-y me-2 rounded-circle p-1"
                                  style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {errors.files && submitAttempted && <div className="text-danger small mt-2 d-block">{errors.files}</div>}
                </div>

                <div className="d-flex justify-content-end mt-5 pt-3 border-top">
                  <Link to="/customer/claims" className="btn btn-light rounded-pill px-4 py-2 me-3">
                    Cancel
                  </Link>
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill px-5 py-2 d-inline-flex align-items-center shadow-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="me-2" />
                        Submit Claim
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaiseClaimPage;
