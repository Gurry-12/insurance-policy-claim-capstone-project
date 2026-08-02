import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyClaims } from "../../../services/claimService";
import PageHeader from "../../../components/common/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { Eye, FileText, Calendar, IndianRupee, ArrowRight, FilePlus } from "lucide-react";
import ExportButton from "../../../components/common/ExportButton";
import { formatINR } from "../../../utils/formatters";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import EmptyState from "../../../components/ui/EmptyState";
import PaginationBar from "../../../components/tables/PaginationBar";
import useClientPagination from "../../../hooks/useClientPagination";

const CustomerClaimListPage = () => {
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { page, setPage, totalPages, pageItems } = useClientPagination(claims, 9);

  const loadClaims = async () => {
    try {
      setIsLoading(true);
      const response = await getMyClaims();
      const data = response.data || response.content || [];
      const sortedData = [...data].sort((a, b) => (b.claimId || b.id || 0) - (a.claimId || a.id || 0));
      setClaims(sortedData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const getCardStyle = (status) => {
    switch (status) {
      case "APPROVED": return { border: "var(--ip-success-subtle)", bg: "linear-gradient(135deg, var(--ip-claim-approved-bg) 0%, var(--ip-surface) 100%)" };
      case "PENDING": return { border: "var(--ip-warning-subtle)", bg: "linear-gradient(135deg, var(--ip-claim-under-review-bg) 0%, var(--ip-surface) 100%)" };
      case "UNDER_REVIEW": return { border: "var(--ip-info-subtle)", bg: "linear-gradient(135deg, var(--ip-info-bg) 0%, var(--ip-surface) 100%)" };
      case "REJECTED": return { border: "var(--ip-danger-subtle)", bg: "linear-gradient(135deg, var(--ip-claim-rejected-bg) 0%, var(--ip-surface) 100%)" };
      default: return { border: "var(--ip-border)", bg: "linear-gradient(135deg, var(--ip-bg) 0%, var(--ip-surface) 100%)" };
    }
  };

  return (
    <div className="animate-fade-in pb-5">
      <PageHeader
        title="My Claims"
        subtitle="Manage and track your insurance claims"
        icon={FileText}
        action={
          <div className="d-flex gap-2">
            <ExportButton
              fetchAll={async () => {
                const res = await getMyClaims();
                return res.data || res.content || [];
              }}
              columns={[
                { header: "Claim Number", accessor: "claimNumber" },
                { header: "Policy Number", accessor: "policyNumber" },
                { header: "Claim Amount (₹)", accessor: "claimAmount" },
                { header: "Incident Date", accessor: "incidentDate" },
                { header: "Status", accessor: "claimStatus" }
              ]}
              filename="my_claims.csv"
            />
            <Link to="/customer/claims/raise" className="btn btn-primary rounded-pill px-4 py-2 d-inline-flex align-items-center shadow-sm">
              <FilePlus size={18} className="me-2" /> Raise Claim
            </Link>
          </div>
        }
      />

      <div className="mt-4">
        {isLoading ? (
          <LoadingSpinner />
        ) : claims.length > 0 ? (
          <div className="row g-4">
            {pageItems.map((claim) => {
              const cardStyle = getCardStyle(claim.claimStatus);
              return (
                <div key={claim.claimId} className="col-md-6 col-xl-4">
                  <div 
                    className="card border h-100 shadow-sm" 
                    style={{ 
                      borderRadius: '16px', 
                      background: cardStyle.bg,
                      borderColor: cardStyle.border,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0,0,0,0.075)';
                    }}
                  >
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <span className="badge bg-white text-dark border shadow-sm rounded-pill px-3 py-2 fw-medium d-inline-flex align-items-center">
                          <FileText size={14} className="me-2 text-primary" />
                          #{claim.claimNumber}
                        </span>
                        <StatusBadge status={claim.claimStatus} />
                      </div>

                      <div className="mb-4">
                        <div className="text-muted small mb-1">Linked Policy</div>
                        <h6 className="fw-bold text-dark">{claim.policyNumber}</h6>
                      </div>

                      <div className="bg-white rounded-3 p-3 shadow-sm border mb-4">
                        <div className="row g-3">
                          <div className="col-6">
                            <div className="text-muted small mb-1 d-flex align-items-center">
                              <IndianRupee size={14} className="me-1" /> Claim Amount
                            </div>
                            <div className="fw-bold text-dark fs-5">{formatINR(claim.claimAmount)}</div>
                          </div>
                          <div className="col-6 border-start">
                            <div className="text-muted small mb-1 ps-2 d-flex align-items-center">
                              <Calendar size={14} className="me-1" /> Incident Date
                            </div>
                            <div className="fw-bold text-dark fs-6 ps-2 mt-1">
                              {claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer bg-white border-top-0 p-3 pt-0 d-flex justify-content-end">
                      <Link
                        to={`/customer/claims/${claim.claimId}`}
                        className="btn btn-outline-primary rounded-pill px-4 py-2 d-inline-flex align-items-center w-100 justify-content-center"
                        style={{ fontSize: '0.9rem' }}
                      >
                        <Eye size={16} className="me-2" /> View Full Details <ArrowRight size={16} className="ms-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="bi-file-earmark-text"
            title="No Claims Found"
            message="You haven't filed any insurance claims yet."
            action={
              <Link to="/customer/claims/raise" className="btn btn-primary rounded-pill px-4 py-2 shadow-sm">
                <FilePlus size={18} className="me-2 d-inline" /> Raise a Claim
              </Link>
            }
          />
        )}
      </div>

      {claims.length > 0 && (
        <div className="mt-4">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default CustomerClaimListPage;
