import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../../../components/ui/StatusBadge";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ErrorAlert from "../../../components/ui/ErrorAlert";
import {
  getClaimById,
  getClaimHistory,
  markUnderReview,
  reviewClaim,
  assignClaim,
} from "../../../services/claimService";
import { getPolicyById } from "../../../services/policyService";
import useAuth from "../../../hooks/useAuth";
import useClaimPdf from "../../../hooks/PdfDownload/useClaimPdf";
import toast from "react-hot-toast";
import Modal from "../../../components/ui/Modal";
import DocumentPreviewModal from "../../../components/modals/DocumentPreviewModal";
import FormTextarea from "../../../components/forms/FormTextarea";
import Drawer from "../../../components/ui/Drawer";
import ClaimHistoryTimeline from "../../../components/claims/ClaimHistoryTimeline";
import {  Upload, Eye, Lock } from "lucide-react";

const StaffClaimDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { downloadClaim } = useClaimPdf();
  const [claim, setClaim] = useState(null);
  const [history, setHistory] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionModal, setActionModal] = useState({ isOpen: false, type: null });
  const [remark, setRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchClaimData = async (id) => {
    setLoading(true);
    try {
      const [claimData, historyResponse] = await Promise.all([
        getClaimById(id),
        getClaimHistory(id).catch(() => [])
      ]);
      
      setClaim(claimData);

      const rawHistory = historyResponse?.content || historyResponse?.data || (Array.isArray(historyResponse) ? historyResponse : []);
      const sortedHistory = [...rawHistory].sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate));
      setHistory(sortedHistory);

      if (claimData?.policyId) {
        const policyData = await getPolicyById(claimData.policyId);
        setPolicy(policyData);
      }
    } catch (err) {
      console.error("Claim fetch error:", err);
      setError(
        err.message || err.message || "Could not load claim details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimData(id);
  }, [id]);

  const handleRecommendation = async (actionType) => {
    if (!remark.trim()) {
      toast.error("Remarks are required to submit a recommendation.");
      return;
    }

    setActionLoading(actionType);
    const recommendedStatus =
      actionType === "approve"
        ? "RECOMMENDED_FOR_APPROVAL"
        : "RECOMMENDED_FOR_REJECTION";

    try {
      const response = await reviewClaim(id, {
        recommendedStatus: recommendedStatus,
        remarks: remark,
      });

      setClaim(response.data || response);
      toast.success(
        `Claim recommended for ${actionType === "approve" ? "approval" : "rejection"}`,
      );
      setActionModal({ isOpen: false, type: null });
      setRemark("");
      fetchClaimData(id); // Refetch to update history timeline
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit recommendation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnderReview = async () => {
    try {
      await assignClaim(id);
      await markUnderReview(id);
      setClaim({
        ...claim,
        claimStatus: "UNDER_REVIEW",
        assignedStaffName: user?.name,
      });
      toast.success("Claim assigned and moved to Under Review");
      fetchClaimData(id); // Refetch to update history timeline
    } catch (error) {
      console.error("Under Review/Assign Error:", error);
      if (
        error.response?.status === 400 &&
        error.message?.includes("already under review")
      ) {
        toast.error("Sorry, another Staff just claimed this ticket!");
        fetchClaimData(id);
      } else {
        toast.error("Failed to update claim");
      }
    }
  };

  const {
    claimAmount = 0,
    claimStatus = "",
    createdDate,
    claimReason = "No reason provided",
    incidentDate,
    documents = [],
    customerName = "Unknown",
  } = claim || {};

  const dateFiled = createdDate?.split("T")[0] || "N/A";
  const reason = claimReason;
  const amount = claimAmount;
  const status = claimStatus;

  return (
    <Drawer
      isOpen={true}
      onClose={() => navigate("/staff/claims")}
      title={
        claim
          ? `Viewing Claim #${claim.claimNumber || 'Pending'}`
          : "Claim Details"
      }
      width="900px"
    >
      <div className="p-4">
        {loading && <LoadingSpinner text="Loading claim details..." />}
        {error && !claim && (
          <ErrorAlert message={error || "Claim not found."} />
        )}

        {!loading && claim && (
          <>
            <div className="d-flex justify-content-end gap-2 mb-4">
              {!claim.assignedStaffName && (
                <button
                  className="btn btn-warning d-inline-flex align-items-center gap-1"
                  onClick={handleUnderReview}
                  disabled={
                    claim.claimStatus === "UNDER_REVIEW" ||
                    claim.claimStatus === "APPROVED" ||
                    claim.claimStatus === "REJECTED"
                  }
                >
                  Start Review
                </button>
              )}

              {claim.assignedStaffName === user?.name &&
                claim.claimStatus === "UNDER_REVIEW" && (
                  <button
                    className="btn btn-primary d-inline-flex align-items-center gap-1"
                    onClick={() => setActionModal({ isOpen: true, type: null })}
                  >
                    Add Recommendation
                  </button>
                )}

              {claim.assignedStaffName &&
                claim.assignedStaffName !== user?.name && (
                  <span
                    className="badge bg-secondary d-flex align-items-center px-3 py-2"
                    style={{ fontSize: "0.9rem" }}
                  >
                    <Lock size={16} className="me-2" /> Locked by {claim.assignedStaffName}
                  </span>
                )}

              <button
                className="btn btn-outline-danger d-inline-flex align-items-center gap-1"
                style={{ borderRadius: "8px" }}
                onClick={() => downloadClaim(claim)}
              >
                <i className="bi bi-file-earmark-pdf"></i> PDF
              </button>
            </div>

            <div className="row g-4 mb-4">
              {/* Left Side: Claim Info & Customer Details */}
              <div className="col-lg-8">
                <div
                  className="card border-0 mb-4 bg-white h-100"
                  style={{ borderRadius: 16, boxShadow: "var(--ip-shadow-sm)" }}
                >
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h6 className="fw-bold m-0 text-primary">Claim Information</h6>
                      <StatusBadge status={status} />
                    </div>

                    <div className="row mb-4">
                      <div className="col-md-6 mb-3">
                        <small className="text-muted d-block fw-bold mb-1">
                          Claim Amount
                        </small>
                        <h4 className="fw-bold m-0 text-dark">
                          ₹{amount.toLocaleString("en-IN")}
                        </h4>
                      </div>
                      <div className="col-md-6 mb-3">
                        <small className="text-muted d-block fw-bold mb-1">
                          Date Filed
                        </small>
                        <span>{dateFiled}</span>
                      </div>
                      {incidentDate && (
                        <div className="col-md-6 mb-3">
                          <small className="text-muted d-block fw-bold mb-1">
                            Incident Date
                          </small>
                          <span>
                            {new Date(incidentDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="col-12 mt-2 mb-3">
                        <small className="text-muted d-block fw-bold mb-1">
                          Reason / Description
                        </small>
                        <p
                          className="mb-0"
                          style={{ color: "var(--ip-text-secondary)" }}
                        >
                          {reason}
                        </p>
                      </div>

                      {policy && (
                        <>
                          <div className="col-md-6 mt-3">
                            <small className="text-muted d-block fw-bold mb-1">
                              Total Coverage
                            </small>
                            <span className="fw-bold">
                              ₹
                              {Number(
                                policy.selectedCoverage || 0,
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="col-md-6 mt-3">
                            <small className="text-muted d-block fw-bold mb-1">
                              Remaining Coverage
                            </small>
                            <span className="fw-bold text-success">
                              ₹
                              {Number(
                                policy.remainingClaimAmount ??
                                  policy.selectedCoverage ??
                                  0,
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </>
                      )}

                      <div className="col-md-6 mt-3">
                        <small className="text-muted d-block fw-bold mb-1">
                          Assigned Staff
                        </small>
                        <span>
                          {claim.assignedStaffName || (
                            <span className="text-muted">Unassigned</span>
                          )}
                        </span>
                      </div>

                      {claim.staffRemarks && (
                        <div className="col-12 mt-4 p-3 bg-light rounded-3 border-start border-4 border-primary">
                          <small className="text-muted d-block fw-bold mb-1">
                            Staff Remarks
                          </small>
                          <p className="mb-0 text-dark">{claim.staffRemarks}</p>
                        </div>
                      )}
                      {claim.adminRemarks && (
                        <div className="col-12 mt-3 p-3 bg-light rounded-3 border-start border-4 border-warning">
                          <small className="text-muted d-block fw-bold mb-1">
                            Admin Remarks
                          </small>
                          <p className="mb-0 text-dark">{claim.adminRemarks}</p>
                        </div>
                      )}
                    </div>
                    
                    <hr className="my-4" style={{ borderColor: "var(--ip-border-light)" }} />
                    
                    <h6 className="fw-bold mb-3 text-primary">Customer Details</h6>
                    <div className="d-flex gap-5">
                      <div>
                        <small className="text-muted d-block fw-bold mb-1">
                          Name
                        </small>
                        <span>{customerName}</span>
                      </div>
                      <div>
                        <small className="text-muted d-block fw-bold mb-1">
                          Policy Number
                        </small>
                        <span
                          className="text-primary fw-bold"
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            navigate(`/staff/policies/${claim.policyId}`)
                          }
                        >
                          {claim.policyNumber || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Status History Timeline */}
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
                  <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                    <h6 className="card-title mb-0 fw-bold text-primary">Claim Status History</h6>
                  </div>
                  <ClaimHistoryTimeline history={history} />
                </div>
              </div>
            </div>

            {/* Bottom Side: Documents */}
            <div className="row">
              <div className="col-12">
                <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
                  <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                    <h6 className="card-title mb-0 fw-bold text-primary">Attached Documents</h6>
                    <span className="badge bg-light text-dark border">
                      {documents?.length || 0} Files
                    </span>
                  </div>
                  <div className="card-body">
                    {documents?.length > 0 ? (
                      <div className="row g-3">
                        {documents.map((doc, index) => {
                          return (
                            <div key={index} className="col-md-6">
                              <div className="d-flex align-items-center justify-content-between p-3 border rounded bg-light h-100">
                                <div className="d-flex align-items-center overflow-hidden me-2">
                                  <div className="bg-white p-2 rounded shadow-sm me-3 text-primary">
                                    <Eye size={20} />
                                  </div>
                                  <div className="text-truncate" title={doc.documentName}>
                                    <span className="fw-medium d-block text-truncate">{doc.documentName || `Document-${index + 1}`}</span>
                                    <small className="text-muted">{doc.documentType || "File"}</small>
                                  </div>
                                </div>
                                {doc.documentReference && (
                                  <button
                                    onClick={() => setPreviewDoc(doc)}
                                    className="btn btn-sm btn-primary flex-shrink-0"
                                  >
                                    Preview
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-muted p-5 bg-light rounded border-dashed">
                        <div className="mb-3">
                          <Upload size={48} className="text-secondary opacity-50" />
                        </div>
                        <h6>No Documents Uploaded</h6>
                        <p className="small mb-0">No documents have been attached to this claim yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => {
          setActionModal({ isOpen: false, type: null });
          setRemark("");
        }}
        title="Add Recommendation"
        footer={
          <div className="d-flex w-100 justify-content-between">
            <button className="btn btn-outline-secondary" onClick={() => {
              setActionModal({ isOpen: false, type: null });
              setRemark("");
            }} disabled={!!actionLoading}>
              Cancel
            </button>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-danger" 
                onClick={() => handleRecommendation('reject')} 
                disabled={!!actionLoading || !remark.trim()}>
                {actionLoading === 'reject' ? 'Processing...' : 'Recommend Rejection'}
              </button>
              <button 
                className="btn btn-success" 
                onClick={() => handleRecommendation('approve')} 
                disabled={!!actionLoading || !remark.trim()}>
                {actionLoading === 'approve' ? 'Processing...' : 'Recommend Approval'}
              </button>
            </div>
          </div>
        }
      >
        <p>Please review the claim details before submitting your recommendation.</p>

        {policy && (
          <div className="bg-light p-3 rounded mb-3 border-start border-4 border-info">
            <div className="d-flex justify-content-between mb-2">
              <small className="fw-bold text-muted">Claim Amount:</small>
              <span className="fw-bold text-primary">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <small className="fw-bold text-muted">Total Coverage:</small>
              <span className="fw-bold">₹{Number(policy.selectedCoverage || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="d-flex justify-content-between">
              <small className="fw-bold text-muted">Remaining Coverage:</small>
              <span className="fw-bold text-success">₹{Number(policy.remainingClaimAmount ?? policy.selectedCoverage ?? 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        <FormTextarea
          label="Staff Remarks (Required)"
          name="remark"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Add your justification here..."
          rows={3}
          required
        />
      </Modal>

      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        documentUrl={previewDoc?.documentReference}
        documentName={previewDoc?.documentName}
      />
    </Drawer>
  );
};

export default StaffClaimDetailPage;
