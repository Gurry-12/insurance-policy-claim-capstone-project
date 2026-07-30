import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getClaimById, getClaimHistory } from "../../../services/claimService";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import StatusBadge from "../../../components/ui/StatusBadge";
import DocumentPreviewModal from '../../../components/modals/DocumentPreviewModal';
import ClaimHistoryTimeline from '../../../components/claims/ClaimHistoryTimeline';
import Drawer from '../../../components/ui/Drawer';
import { Upload, Eye, Download } from "lucide-react";
import useClaimPdf from "../../../hooks/PdfDownload/useClaimPdf";

const ClaimDetailsPage = () => {
  const { claimId } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState(null);
  const { downloadClaim } = useClaimPdf();

  const loadClaimData = async () => {
    try {
      setIsLoading(true);
      const [claimResponse, historyResponse] = await Promise.all([
        getClaimById(claimId),
        getClaimHistory(claimId).catch(() => []) // Handle case where history might fail
      ]);
      
      setClaim(claimResponse);

      const rawHistory = historyResponse?.content || historyResponse?.data || (Array.isArray(historyResponse) ? historyResponse : []);
      const sortedHistory = [...rawHistory].sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate));
      setHistory(sortedHistory);
      
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaimData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  if (isLoading) {
    return <LoadingSpinner text="Loading claim details..." />;
  }

  if (!claim) {
    return <div className="alert alert-warning">Claim not found</div>;
  }

  return (
    <Drawer 
      isOpen={true} 
      onClose={() => navigate('/customer/claims')} 
      title={`Claim ${claim.claimNumber || 'Pending'}`}
      width="900px"
    >
      <div className="p-4">
        <div className="d-flex justify-content-end gap-2 mb-4">
          <button
            className="btn btn-outline-danger d-inline-flex align-items-center gap-1"
            style={{ borderRadius: "8px" }}
            onClick={() => downloadClaim(claim)}
          >
            <Download size={18} /> PDF
          </button>
          {['SUBMITTED', 'UNDER_REVIEW'].includes(claim.claimStatus) ? (
            <Link
              to={`/customer/claims/upload/${claim.claimId}`}
              className="btn btn-outline-warning text-dark d-inline-flex align-items-center gap-1"
              style={{ borderRadius: "8px" }}
            >
              <Upload size={18} /> Upload Docs
            </Link>
          ) : (
            <button
              disabled
              className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
              style={{ borderRadius: "8px" }}
              title="Uploads are disabled for this claim status"
            >
              <Upload size={18} /> Upload Docs
            </button>
          )}
        </div>

        <div className="row g-4 mb-4">
        {/* Left Side: Claim Info */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="card-title mb-0 fw-bold text-primary">Claim Information</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded h-100">
                    <small className="text-muted d-block mb-1">Status</small>
                    <StatusBadge status={claim.claimStatus} />
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded h-100">
                    <small className="text-muted d-block mb-1">Claim Amount</small>
                    <div className="fw-bold fs-5 text-dark">₹{claim.claimAmount?.toLocaleString()}</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded h-100">
                    <small className="text-muted d-block mb-1">Policy Number</small>
                    <div className="fw-semibold fs-6">
                      {claim.policyNumber ? (
                        <Link to={`/customer/policies/${claim.policyId}`} className="text-primary text-decoration-none fw-bold">
                          {claim.policyNumber}
                        </Link>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded h-100">
                    <small className="text-muted d-block mb-1">Assigned Staff</small>
                    <div className="fw-semibold mt-1">
                      {claim.assignedStaffName ? (
                        <span className="badge bg-white text-dark border px-2 py-1">
                          {claim.assignedStaffName}
                        </span>
                      ) : (
                        <span className="text-muted fw-normal">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="p-3 bg-light rounded">
                    <small className="text-muted d-block mb-1">Reason</small>
                    <div>{claim.claimReason}</div>
                  </div>
                </div>
                {/* Show remarks only if claim is finalized */}
                {(claim.claimStatus === 'APPROVED' || claim.claimStatus === 'REJECTED') && (
                  <>
                    {claim.staffRemarks && (
                      <div className="col-12">
                        <div className="p-3 bg-light rounded">
                          <small className="text-muted d-block mb-1">Staff Remarks</small>
                          <div>{claim.staffRemarks}</div>
                        </div>
                      </div>
                    )}
                    {claim.adminRemarks && (
                      <div className="col-12">
                        <div className="p-3 bg-light rounded border border-warning">
                          <small className="text-muted d-block mb-1">Admin Remarks</small>
                          <div>{claim.adminRemarks}</div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Claim Status History */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h6 className="card-title mb-0 fw-bold text-primary">Status History</h6>
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
              <h5 className="card-title mb-0 fw-bold text-primary">Uploaded Documents</h5>
              <span className="badge bg-light text-dark border">
                {claim.documents?.length || 0} Files
              </span>
            </div>
            <div className="card-body">
              {claim.documents?.length > 0 ? (
                <div className="row g-3">
                  {claim.documents.map((doc, index) => (
                    <div key={index} className="col-md-6 col-lg-4">
                      <div className="d-flex align-items-center justify-content-between p-3 border rounded bg-light h-100">
                        <div className="d-flex align-items-center overflow-hidden me-2">
                          <div className="bg-white p-2 rounded shadow-sm me-3 text-primary">
                            <Eye size={20} />
                          </div>
                          <div className="text-truncate" title={doc.documentName}>
                            <span className="fw-medium d-block text-truncate">{doc.documentName}</span>
                            <small className="text-muted">Document</small>
                          </div>
                        </div>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="btn btn-sm btn-primary flex-shrink-0"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted p-5 bg-light rounded border-dashed">
                  <div className="mb-3">
                    <Upload size={48} className="text-secondary opacity-50" />
                  </div>
                  <h6>No Documents Uploaded</h6>
                  <p className="small mb-3">Supporting documents speed up the claim approval process.</p>
                  {['SUBMITTED', 'UNDER_REVIEW'].includes(claim.claimStatus) ? (
                    <Link to={`/customer/claims/upload/${claim.claimId}`} className="btn btn-outline-primary btn-sm">
                      Upload Documents Now
                    </Link>
                  ) : (
                    <button disabled className="btn btn-outline-secondary btn-sm" title="Uploads are disabled for this claim status">
                      Upload Documents Now
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        documentUrl={previewDoc?.documentReference}
        documentName={previewDoc?.documentName}
      />
      </div>
    </Drawer>
  );
};

export default ClaimDetailsPage;
