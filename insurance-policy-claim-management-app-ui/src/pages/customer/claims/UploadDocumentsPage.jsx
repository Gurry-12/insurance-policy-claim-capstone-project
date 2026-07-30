import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { notify } from "../../../utils/notificationService";
import { uploadDocuments, getClaimById } from "../../../services/claimService";
import { getPolicyById } from "../../../services/policyService";
import PageHeader from "../../../components/common/PageHeader";
import { ArrowLeft, Upload, X } from "lucide-react";
import LoadingButton from "../../../components/ui/LoadingButton";
import ModernSelect from "../../../components/forms/ModernSelect";
import { PRODUCT_DOCUMENT_CATEGORIES } from "../../../utils/documentCategories";

const UploadDocumentsPage = () => {
  const { claimId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [productType, setProductType] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("");

  useEffect(() => {
    const fetchPolicyType = async () => {
      try {
        const claimResponse = await getClaimById(claimId);
        const claimData = claimResponse?.data || claimResponse?.content || claimResponse;
        if (claimData && claimData.policyId) {
          const policyResponse = await getPolicyById(claimData.policyId);
          const policyData = policyResponse?.data || policyResponse?.content || policyResponse;
          if (policyData && policyData.productType) {
            setProductType(policyData.productType);
          }
        }
      } catch (err) {
        console.error("Failed to fetch product type", err);
      }
    };
    fetchPolicyType();
  }, [claimId]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!selectedDocType) {
      notify.error("Please select a document category first");
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const valid = validateFiles(Array.from(e.dataTransfer.files));
      if (valid.length === 0) return;
      setFiles(prev => [...prev, ...valid.map(file => ({ file, docType: selectedDocType }))]);
      if (errors.files) setErrors(prev => ({ ...prev, files: '' }));
    }
  };

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const validateFiles = (rawFiles) => {
    const valid = [];
    for (const file of rawFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        notify.error(`"${file.name}" is not allowed. Only PDF and image files are accepted.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        notify.error(`"${file.name}" exceeds the 5 MB limit.`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  };

  const handleFileChange = (e) => {
    if (!selectedDocType) {
      notify.error("Please select a document category first");
      return;
    }
    if (e.target.files && e.target.files.length > 0) {
      const valid = validateFiles(Array.from(e.target.files));
      if (valid.length === 0) return;
      setFiles(prev => [...prev, ...valid.map(file => ({ file, docType: selectedDocType }))]);
      if (errors.files) setErrors(prev => ({ ...prev, files: '' }));
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};

    if (files.length === 0) {
      errs.files = "Please select at least one file to upload.";
    }
    // Type & size check (defence-in-depth against drag-drop bypass)
    for (let i = 0; i < files.length; i++) {
      if (!ALLOWED_TYPES.includes(files[i].file.type)) {
        errs.files = "Only PDF and image files (JPG, PNG, GIF, WEBP) are allowed.";
        break;
      }
      if (files[i].file.size > MAX_FILE_SIZE) {
        errs.files = "Each file must not exceed 5 MB.";
        break;
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      files.forEach((fileObj) => {
        const originalFile = fileObj.file;
        const extension = originalFile.name.substring(originalFile.name.lastIndexOf('.'));
        const safeDocType = fileObj.docType.replace(/[^a-zA-Z0-9]/g, '_');
        const safeName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9]/g, '_');
        const newFileName = `${safeDocType}_${safeName}${extension}`;
        
        const renamedFile = new File([originalFile], newFileName, { type: originalFile.type });
        formData.append("files", renamedFile);
      });

      const res = await uploadDocuments(claimId, formData);
      notify.success(res, "Documents Uploaded Successfully");
      navigate("/customer/claims");
    } catch (error) {
      console.error(error);
      const errorMessage = error?.message || error?.response?.data?.message || "Failed to upload documents";
      notify.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Upload Documents"
        subtitle="Add documents to your claim"
        action={
          <Link to="/customer/claims" className="btn btn-outline-secondary">
            <ArrowLeft size={18} className="me-2" />
            Back to Claims
          </Link>
        }
      />

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <div className="mb-3">
                    <ModernSelect
                      label="Document Category"
                      name="selectedDocType"
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      options={[
                        { value: "", label: "Select a category..." },
                        ...(
                          productType && PRODUCT_DOCUMENT_CATEGORIES[productType]
                            ? PRODUCT_DOCUMENT_CATEGORIES[productType]
                            : PRODUCT_DOCUMENT_CATEGORIES.INSURANCE
                        ).map(doc => ({ value: doc, label: doc }))
                      ]}
                    />
                    <div className="form-text mb-3">Select the type of document before uploading it below.</div>
                  </div>
                  <label className="form-label fw-bold mb-2">Select Files <span className="text-danger">*</span></label>
                  <div
                    className={`p-5 text-center border rounded-3 ${!selectedDocType ? 'bg-secondary bg-opacity-10' : (isDragging ? 'bg-light border-primary' : 'bg-white')} ${errors.files ? 'border-danger' : 'border-secondary'}`}
                    style={{ borderStyle: 'dashed', borderWidth: '2px', cursor: !selectedDocType ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => {
                      if (!selectedDocType) {
                        notify.error("Please select a document category first");
                        return;
                      }
                      fileInputRef.current.click();
                    }}
                  >
                    <Upload size={32} className="text-muted mb-3" />
                    <h6 className="fw-bold">Drag and drop files here</h6>
                    <p className="text-muted small mb-0">or click to browse from your computer</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg, image/png, application/pdf"
                      className="d-none"
                      onChange={handleFileChange}
                    />
                  </div>
                  {files.length > 0 && (
                    <div className="mt-4">
                      <small className="fw-bold d-block mb-3 text-secondary text-uppercase tracking-wider" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                        Selected Files ({files.length})
                      </small>
                      <ul className="list-unstyled mb-0">
                        {files.map((f, i) => (
                          <li key={i} className="d-flex align-items-center justify-content-between p-3 mb-2 bg-white rounded-3 shadow-sm border border-light transition-all hover-shadow">
                            <div className="d-flex align-items-center text-truncate pe-3">
                              <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-2 me-3 flex-shrink-0">
                                <Upload size={18} />
                              </div>
                              <div className="text-truncate">
                                <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.9rem' }}>{f.file.name}</div>
                                <div className="d-flex align-items-center mt-1">
                                  <span className="badge bg-light text-secondary border me-2 fw-normal" style={{ fontSize: '0.7rem' }}>
                                    {f.docType}
                                  </span>
                                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {(f.file.size / 1024 / 1024).toFixed(2)} MB
                                  </small>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-light text-danger bg-danger bg-opacity-10 hover-bg-danger hover-text-white rounded-circle p-2 flex-shrink-0 transition-all border-0"
                              onClick={() => removeFile(i)}
                              title="Remove file"
                            >
                              <X size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {errors.files && <div className="text-danger small mt-2">{errors.files}</div>}
                  {!errors.files && files.length === 0 && <div className="form-text mt-2">Supported formats: PDF, JPG, PNG</div>}
                </div>

                <div className="d-grid">
                  <LoadingButton
                    className="w-100 py-2 fw-bold"
                    type="submit"
                    isLoading={isUploading}
                    loadingText="Uploading..."
                    disabled={files.length === 0}
                  >
                    <Upload size={18} className="me-2" />
                    Upload
                  </LoadingButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentsPage;
