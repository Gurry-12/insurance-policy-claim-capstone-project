import { useEffect, useState, useCallback } from "react";
import { getMyPolicies } from "../../../services/policyService";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { Shield, ArrowRight, IndianRupee, Calendar, PlusCircle } from "lucide-react";
import useTableState from "../../../hooks/useTableState";
import PaginationBar from "../../../components/tables/PaginationBar";
import ExportButton from "../../../components/common/ExportButton";
import { formatINR } from "../../../utils/formatters";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import EmptyState from "../../../components/ui/EmptyState";

const CustomerPolicyListPage = () => {
  const [policies, setPolicies] = useState([]);

  const tableState = useTableState({
    initialSortBy: 'id'
  });

  const { getQueryParams, setIsLoading, setTotalPages, setTotalElements } = tableState;

  const fetchPolicies = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = getQueryParams();
      const response = await getMyPolicies(params);
      setPolicies(response.content || []);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements || response.totalRecords || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [getQueryParams, setIsLoading, setTotalPages, setTotalElements]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const getCardGradient = (status) => {
    switch (status) {
      case "ACTIVE": return "linear-gradient(135deg, var(--ip-policy-active-bg) 0%, var(--ip-surface) 100%)";
      case "PENDING_PAYMENT": return "linear-gradient(135deg, var(--ip-policy-pending-bg) 0%, var(--ip-surface) 100%)";
      case "EXPIRED": return "linear-gradient(135deg, var(--ip-policy-expired-bg) 0%, var(--ip-surface) 100%)";
      case "CANCELLED": return "linear-gradient(135deg, var(--ip-policy-cancelled-bg) 0%, var(--ip-surface) 100%)";
      default: return "linear-gradient(135deg, var(--ip-bg) 0%, var(--ip-surface) 100%)";
    }
  };

  const getCardBorder = (status) => {
    switch (status) {
      case "ACTIVE": return "var(--ip-success-subtle)";
      case "PENDING_PAYMENT": return "var(--ip-warning-subtle)";
      case "EXPIRED": return "var(--ip-warning-subtle)";
      case "CANCELLED": return "var(--ip-danger-subtle)";
      default: return "var(--ip-border)";
    }
  };

  return (
    <div className="animate-fade-in pb-5">
      <PageHeader
        title="My Policies"
        subtitle="Manage and track your active insurance plans"
        icon={Shield}
        action={
          <ExportButton
              fetchAll={async () => {
                const res = await getMyPolicies({...tableState.getQueryParams(), pageSize: tableState.totalElements || 1000, pageNumber: 0});
                return res.content || [];
              }}
            columns={[
              { header: "Policy Number", accessor: "policyNumber" },
              { header: "Plan Name", accessor: "planName" },
              { header: "Premium Amount (₹)", accessor: "calculatedPremium" },
              { header: "Coverage Amount (₹)", accessor: "selectedCoverage" },
              { header: "Status", accessor: "policyStatus" }
            ]}
            filename="my_policies.csv"
          />
        }
      />

      <div className="mt-4">
        {tableState.isLoading ? (
          <LoadingSpinner />
        ) : policies.length > 0 ? (
          <div className="row g-4">
            {policies.map((policy) => (
              <div key={policy.policyId} className="col-md-6 col-xl-4">
                <div 
                  className="card border h-100 shadow-sm" 
                  style={{ 
                    borderRadius: '16px', 
                    background: getCardGradient(policy.policyStatus),
                    borderColor: getCardBorder(policy.policyStatus),
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
                      <div>
                        <span className="badge bg-white text-dark border shadow-sm rounded-pill px-3 py-2 fw-medium mb-2 d-inline-flex align-items-center">
                          <Shield size={14} className="me-2 text-primary" />
                          #{policy.policyNumber}
                        </span>
                        <h5 className="fw-bold text-dark mb-0 mt-1">{policy.planName}</h5>
                      </div>
                      <StatusBadge status={policy.policyStatus} />
                    </div>

                    <div className="bg-white rounded-3 p-3 shadow-sm border mt-4 mb-4">
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="text-muted small mb-1 d-flex align-items-center">
                            <IndianRupee size={14} className="me-1" /> Premium
                          </div>
                          <div className="fw-bold text-dark fs-5">{formatINR(policy.calculatedPremium)}</div>
                        </div>
                        <div className="col-6 border-start">
                          <div className="text-muted small mb-1 ps-2 d-flex align-items-center">
                            <Shield size={14} className="me-1" /> Coverage
                          </div>
                          <div className="fw-bold text-dark fs-5 ps-2">{formatINR(policy.selectedCoverage)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer bg-white border-top-0 p-3 pt-0 d-flex justify-content-between align-items-center">
                    <div className="text-muted small d-flex align-items-center">
                      <Calendar size={14} className="me-1" /> 
                      {policy.endDate ? `Ends: ${new Date(policy.endDate).toLocaleDateString()}` : 'Active Plan'}
                    </div>
                    <Link
                      to={`/customer/policies/${policy.policyId}`}
                      className="btn btn-primary rounded-pill px-4 py-2 d-inline-flex align-items-center"
                      style={{ fontSize: '0.9rem' }}
                    >
                      View Details <ArrowRight size={16} className="ms-2" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="bi-shield-x"
            title="No Policies Found"
            message="You haven't purchased any insurance policies yet."
            action={
              <Link to="/customer/plans" className="btn btn-primary rounded-pill px-4 py-2">
                <PlusCircle size={18} className="me-2 d-inline" /> Browse Plans
              </Link>
            }
          />
        )}
      </div>

      {policies.length > 0 && (
        <div className="mt-5">
          <PaginationBar
            currentPage={tableState.currentPage}
            totalPages={tableState.totalPages}
            onPageChange={tableState.setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default CustomerPolicyListPage;
