import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getMyPolicies } from "../../services/policyService";
import { getMyClaims } from "../../services/claimService";
import { getMyPayments } from "../../services/paymentService";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState  from "../../components/ui/EmptyState";
import ErrorAlert  from "../../components/ui/ErrorAlert";
import PageHeader  from "../../components/common/PageHeader";
import BentoCard   from "../../common/BentoCard";
import DataTable   from "../../components/tables/DataTable";
import { formatINR } from "../../utils/formatters";
import { POLICY_STATUS } from '../../utils/statuses';
import { EMPTY_STATES } from '../../utils/labels';

const StatTile = ({ icon, label, value, color }) => (
  <BentoCard className="ip-bento-stat-tile">
    <div className="d-flex align-items-center gap-3">
      <div className="ip-bento-stat-icon" style={{ background: color }}>
        <i className={`bi ${icon}`} style={{ color: '#fff' }} />
      </div>
      <div>
        <div className="ip-bento-stat-value">{value}</div>
        <div className="ip-bento-stat-label">{label}</div>
      </div>
    </div>
  </BentoCard>
);

const QuickAction = ({ icon, label, to, color }) => (
  <Link to={to} className="text-decoration-none" style={{ display: 'contents' }}>
    <BentoCard>
      <div className="d-flex align-items-center gap-3">
        <div className="ip-bento-stat-icon" style={{ background: color }}>
          <i className={`bi ${icon}`} style={{ color: '#fff', fontSize: '1.1rem' }} />
        </div>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ip-text-primary)' }}>{label}</span>
      </div>
    </BentoCard>
  </Link>
);

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalPolicies: 0, pendingPolicies: 0, totalClaims: 0, totalPayments: 0,
  });

  const [policiesList, setPoliciesList] = useState([]);
  const [recentClaims, setRecentClaims] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        const [policyResponse, claimResponse, paymentResponse] = await Promise.all([
          getMyPolicies().catch(() => null),
          getMyClaims().catch(() => null),
          getMyPayments().catch(() => null)
        ]);
        const policies = (policyResponse?.content || policyResponse?.data || []).sort((a, b) => (b.policyId || b.id || 0) - (a.policyId || a.id || 0));
        const claims = (claimResponse?.content || claimResponse?.data || []).sort((a, b) => (b.claimId || b.id || 0) - (a.claimId || a.id || 0));
        const payments = (paymentResponse?.content || paymentResponse?.data || []).sort((a, b) => (b.paymentId || b.id || 0) - (a.paymentId || a.id || 0));
        const pendingCount = policies.filter(p => p.policyStatus === "PENDING_PAYMENT").length;
        setStats({
          totalPolicies: policyResponse?.totalRecords || policies.length,
          pendingPolicies: pendingCount,
          totalClaims: claimResponse?.totalRecords || claims.length,
          totalPayments: paymentResponse?.totalRecords || payments.length,
        });
        setPoliciesList(policies.slice(0, 4));
        setRecentClaims(claims.slice(0, 4));
      } catch (err) {
        console.error("Customer Dashboard Fetch Error:", err);
        setError("Could not load all dashboard details. Check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const STATS = [
    { icon: 'bi-file-earmark-text', label: 'My Policies',      value: stats.totalPolicies,  color: 'var(--ip-info)' },
    { icon: 'bi-credit-card',       label: 'Pending Payments', value: stats.pendingPolicies,color: 'var(--ip-danger)' },
    { icon: 'bi-shield-exclamation',label: 'Total Claims',     value: stats.totalClaims,    color: 'var(--ip-warning)' },
    { icon: 'bi-receipt',           label: 'Payment History',  value: stats.totalPayments,  color: 'var(--ip-success)' },
  ];

  const QUICK_ACTIONS = [
    { icon: 'bi-search',            label: 'Browse Products', to: '/customer/products',     color: 'var(--ip-info)' },
    { icon: 'bi-layers',            label: 'Browse Plans',    to: '/customer/plans',        color: 'var(--ip-success)' },
    { icon: 'bi-shield-exclamation',label: 'Raise Claim',     to: '/customer/claims/raise', color: 'var(--ip-danger)' },
    { icon: 'bi-credit-card',       label: 'Make Payment',    to: '/customer/policies',     color: 'var(--ip-warning)' },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name ?? 'User'} 👋`}
        action={
          <span style={{ fontSize: '0.8rem', color: 'var(--ip-text-muted)' }}>
            <i className="bi bi-calendar3 me-1" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        }
      />

      <ErrorAlert message={error} />

      {/* Stat tiles */}
      <div className="ip-bento-grid cols-4 mb-4">
        {STATS.map(card => (
          <StatTile key={card.label} {...card} />
        ))}
      </div>

      {/* Bentogrid middle */}
      <div className="ip-bento-grid cols-3 mb-4">
        {/* Quick Actions */}
        <div className="ip-bento-span-1">
          <BentoCard title="Quick Actions" icon="bi-lightning-charge-fill" iconColor="var(--ip-success)">
            <div className="row g-2">
              {QUICK_ACTIONS.map(a => (
                <div key={a.label} className="col-6">
                  <QuickAction {...a} />
                </div>
              ))}
            </div>
          </BentoCard>
        </div>

        {/* Recent Claims */}
        <div className="ip-bento-span-2">
          <BentoCard title="Recent Claims" icon="bi-shield-exclamation" iconColor="var(--ip-warning)" linkTo="/customer/claims" linkLabel="View all">
            {loading ? (
              <div className="d-flex flex-column gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="placeholder-glow d-flex align-items-center gap-3 p-2">
                    <span className="placeholder rounded-circle" style={{ width: 36, height: 36 }} />
                    <div style={{ flex: 1 }}>
                      <span className="placeholder col-6 d-block mb-1" style={{ height: 12 }} />
                      <span className="placeholder col-9 d-block" style={{ height: 10 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentClaims.length ? (
              <div className="table-responsive">
                <DataTable
                  compact={true}
                  data={recentClaims}
                  onRowClick={(c) => navigate(`/customer/claims/${c.claimId}`)}
                  columns={[
                    { header: 'Sr No.', accessor: 'claimId', cell: (_, i) => <span style={{ fontWeight: 600 }}>{i + 1}</span> },
                    { header: 'Amount', accessor: 'claimAmount', cell: (c) => <span style={{ fontWeight: 600 }}>₹{Number(c.claimAmount).toLocaleString('en-IN')}</span> },
                    { header: 'Date', accessor: 'createdDate', cell: (c) => <span style={{ color: 'var(--ip-text-muted)' }}>{c.createdDate ? new Date(c.createdDate).toLocaleDateString() : "-"}</span> },
                    { header: 'Status', accessor: 'claimStatus', cell: (c) => <StatusBadge status={c.claimStatus} /> }
                  ]}
                  emptyMessage={EMPTY_STATES.NO_CLAIMS}
                />
              </div>
            ) : (
              <EmptyState icon="bi-shield-slash" message={EMPTY_STATES.NO_CLAIMS} />
            )}
          </BentoCard>
        </div>
      </div>

      {/* Active Policies Cards */}
      <BentoCard title="My Active Policies" icon="bi-file-earmark-text" iconColor="var(--ip-info)" linkTo="/customer/policies" linkLabel="View all">
        {loading ? (
          <div className="row g-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="col-md-6 col-lg-4">
                <span className="placeholder col-12 d-block" style={{ height: 120, borderRadius: 12 }} />
              </div>
            ))}
          </div>
        ) : policiesList.length ? (
          <div className="row g-3">
            {policiesList.map((p, i) => (
              <div key={p.policyId || p.id || i} className="col-md-6 col-lg-4">
                <div 
                  className="border rounded-3 p-3 h-100 position-relative shadow-sm"
                  style={{ 
                    background: p.policyStatus === POLICY_STATUS.PENDING_PAYMENT ? 'linear-gradient(135deg, var(--ip-policy-pending-bg) 0%, var(--ip-surface) 100%)' : 'linear-gradient(135deg, var(--ip-policy-active-bg) 0%, var(--ip-surface) 100%)',
                    borderColor: p.policyStatus === POLICY_STATUS.PENDING_PAYMENT ? 'var(--ip-warning-subtle)' : 'var(--ip-success-subtle)'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-white text-dark border shadow-sm rounded-pill px-2 py-1 fw-medium" style={{ fontSize: '0.7rem' }}>
                      #{p.policyNumber || 'Pending'}
                    </span>
                    <StatusBadge status={p.policyStatus || p.status} />
                  </div>
                  <h6 className="fw-bold mb-3 text-truncate" style={{ fontSize: '0.9rem' }}>{p.planName || 'Standard Plan'}</h6>
                  
                  <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Premium</div>
                      <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{formatINR(p.calculatedPremium || p.premium)}</div>
                    </div>
                    <div>
                      {p.policyStatus === POLICY_STATUS.PENDING_PAYMENT ? (
                        <Link to={`/customer/payments/pay/${p.policyId || p.id}`}
                          className="btn btn-warning py-1 px-3 text-dark rounded-pill fw-semibold shadow-sm"
                          style={{ fontSize: '0.75rem' }}>
                          Pay Now
                        </Link>
                      ) : (
                        <Link to={`/customer/policies/${p.policyId || p.id}`}
                          className="btn btn-light py-1 px-3 text-primary rounded-pill fw-semibold shadow-sm border"
                          style={{ fontSize: '0.75rem' }}>
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="bi-file-earmark-x" message={EMPTY_STATES.NO_POLICIES} />
        )}
      </BentoCard>
    </div>
  );
};

export default CustomerDashboard;
