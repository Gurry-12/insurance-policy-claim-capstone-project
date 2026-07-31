import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getAllPaymentsPaginated as getAllPayments } from "../../services/paymentService";
import { getAllClaimsPaginated as getAllClaims } from "../../services/claimService";
import { getAllPoliciesPaginated as getAllPolicies } from "../../services/policyService";
import { getAllCustomers } from "../../services/customerService";
import { EMPTY_STATES } from "../../utils/labels";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import ErrorAlert from "../../components/ui/ErrorAlert";
import PageHeader from "../../components/common/PageHeader";
import BentoCard from "../../common/BentoCard";
import DataTable from "../../components/tables/DataTable";
import { formatINR } from "../../utils/formatters";

const StatTile = ({ icon, label, value, color }) => (
  <BentoCard className="ip-bento-stat-tile">
    <div className="d-flex align-items-center gap-3">
      <div className="ip-bento-stat-icon" style={{ background: color }}>
        <i className={`bi ${icon}`} style={{ color: '#fff' }} />
      </div>
      <div>
        <div className="ip-bento-stat-value">
          {value ?? <span className="placeholder col-4" />}
        </div>
        <div className="ip-bento-stat-label">{label}</div>
      </div>
    </div>
  </BentoCard>
);

const QuickAction = ({ icon, label, to, color }) => (
  <Link
    to={to}
    className="text-decoration-none"
    style={{ display: "contents" }}
  >
    <BentoCard>
      <div className="d-flex align-items-center gap-3">
        <div
          className="ip-bento-stat-icon"
          style={{ background: color }}
        >
          <i className={`bi ${icon}`} style={{ color: '#fff', fontSize: "1.1rem" }} />
        </div>
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--ip-text-primary)",
          }}
        >
          {label}
        </span>
      </div>
    </BentoCard>
  </Link>
);

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    customersCount: 0,
    policiesCount: 0,
    pendingClaimsCount: 0,
    reviewedClaimsCount: 0,
    paymentsCount: 0,
    issuedPoliciesCount: 0,
  });

  const [recentClaims, setRecentClaims] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentPolicies, setRecentPolicies] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [customers, policyResponse, claimResponse, paymentResponse] =
          await Promise.all([
            getAllCustomers(),
            getAllPolicies(),
            getAllClaims(),
            getAllPayments(),
          ]);

        const claims = claimResponse?.content || [];
        const policies = policyResponse?.content || [];

        const pending = claims.filter(
          (c) =>
            c.claimStatus === "PENDING" || c.claimStatus === "UNDER_REVIEW",
        ).length;
        const reviewed = claims.filter(
          (c) =>
            c.claimStatus === "APPROVED" ||
            c.claimStatus === "REJECTED" ||
            c.claimStatus === "REVIEWED",
        ).length;

        setStats({
          customersCount: customers?.length || 0,
          policiesCount: policyResponse?.totalRecords || policies.length,
          pendingClaimsCount: pending,
          reviewedClaimsCount: reviewed,
          paymentsCount: paymentResponse?.totalRecords || 0,
          issuedPoliciesCount: policyResponse?.totalRecords || policies.length,
        });

        setRecentClaims([...claims].sort((a,b) => (b.claimId || b.id || 0) - (a.claimId || a.id || 0)).slice(0, 5));
        setRecentCustomers([...(customers || [])].sort((a,b) => (b.customerId || b.id || 0) - (a.customerId || a.id || 0)).slice(0, 5));
        setRecentPolicies([...policies].sort((a,b) => (b.policyId || b.id || 0) - (a.policyId || a.id || 0)).slice(0, 5));
      } catch (err) {
        console.error("Dashboard Loading Error:", err);
        setError("Could not load dashboard stats. Check your API connection.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const STATS = [
    {
      icon: "bi-people-fill",
      label: "My Clients",
      value: stats.customersCount,
      color: "var(--ip-success)",
    },
    {
      icon: "bi-shield-fill-check",
      label: "Active Policies",
      value: stats.policiesCount,
      color: "var(--ip-success)",
    },
    {
      icon: "bi-shield-exclamation",
      label: "Pending Claims",
      value: stats.pendingClaimsCount,
      color: "var(--ip-warning)",
    },
    {
      icon: "bi-shield-fill-x",
      label: "Reviewed Claims",
      value: stats.reviewedClaimsCount,
      color: "var(--ip-text-muted)",
    },
    {
      icon: "bi-credit-card-fill",
      label: "Premium Payments",
      value: stats.paymentsCount,
      color: "var(--ip-brand)",
    },
    {
      icon: "bi-file-earmark-plus",
      label: "Issued Policies",
      value: stats.issuedPoliciesCount,
      color: "var(--ip-brand, #7c3aed)",
    },
  ];

  const QUICK_ACTIONS = [
    {
      icon: "bi-file-earmark-plus",
      label: "Issue Policy",
      to: "/staff/issue-policy",
      color: "var(--ip-success)",
    },
    {
      icon: "bi-people",
      label: "View Clients",
      to: "/staff/customers",
      color: "var(--ip-info)",
    },
    {
      icon: "bi-shield-check",
      label: "View Policies",
      to: "/staff/policies",
      color: "var(--ip-success)",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={
          <span>
            Welcome back, {user?.name ?? "Staff"} 👋
            {user?.productSpeciality && (
              <span className="badge bg-primary bg-opacity-10 text-primary ms-3 border border-primary-subtle" style={{ verticalAlign: 'middle' }}>
                <i className="bi bi-star-fill me-1" style={{ fontSize: '0.75rem' }}></i>
                {user.productSpeciality} Specialist
              </span>
            )}
          </span>
        }
        action={
          <span style={{ fontSize: "0.8rem", color: "var(--ip-text-muted)" }}>
            <i className="bi bi-calendar3 me-1" />
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        }
      />

      <ErrorAlert message={error} />

      {/* Stat tiles */}
      <div className="ip-bento-grid cols-3 mb-4">
        {STATS.map((card) => (
          <StatTile key={card.label} {...card} />
        ))}
      </div>

      {/* Bentogrid middle section */}
      <div className="ip-bento-grid cols-3 mb-4">
        {/* Quick Actions */}
        <div className="ip-bento-span-1">
          <BentoCard
            title="Staff Actions"
            icon="bi-lightning-charge-fill"
            iconColor="var(--ip-warning)"
          >
            <div className="row g-2">
              {QUICK_ACTIONS.map((a) => (
                <div key={a.label} className="col-6">
                  <QuickAction {...a} />
                </div>
              ))}
            </div>
          </BentoCard>
        </div>

        {/* Recent Claims */}
        <div className="ip-bento-span-2">
          <BentoCard
            title="Recent Claims"
            icon="bi-shield-exclamation"
            iconColor="var(--ip-warning)"
            linkTo="/staff/claims"
            linkLabel="View all"
          >
            {loading ? (
              <div className="d-flex flex-column gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="placeholder-glow d-flex align-items-center gap-3 p-2"
                  >
                    <span
                      className="placeholder rounded-circle"
                      style={{ width: 36, height: 36 }}
                    />
                    <div style={{ flex: 1 }}>
                      <span
                        className="placeholder col-5 d-block mb-1"
                        style={{ height: 12 }}
                      />
                      <span
                        className="placeholder col-8 d-block"
                        style={{ height: 10 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentClaims.length ? (
              <div className="table-responsive">
                <DataTable
                  compact={true}
                  data={recentClaims}
                  onRowClick={(c) => navigate(`/staff/claims/${c.claimId}`)}
                  columns={[
                    { header: 'Sr No.', accessor: 'claimId', cell: (_, i) => <span style={{ fontWeight: 600 }}>{i + 1}</span> },
                    { header: 'Customer', accessor: 'customerName', cell: (c) => c.customerName ?? "Customer" },
                    { header: 'Amount', accessor: 'claimAmount', cell: (c) => <span style={{ fontWeight: 600 }}>₹{Number(c.claimAmount).toLocaleString("en-IN")}</span> },
                    { header: 'Date', accessor: 'createdDate', cell: (c) => <span style={{ color: 'var(--ip-text-muted)' }}>{c.createdDate ? new Date(c.createdDate).toLocaleDateString() : "-"}</span> },
                    { header: 'Status', accessor: 'claimStatus', cell: (c) => <StatusBadge status={c.claimStatus} /> }
                  ]}
                  emptyIcon="bi-shield-slash"
                  emptyMessage={EMPTY_STATES.NO_CLAIMS}
                />
              </div>
            ) : (
              <EmptyState
                icon="bi-shield-slash"
                message={EMPTY_STATES.NO_CLAIMS}
              />
            )}
          </BentoCard>
        </div>
      </div>

      {/* Bottom bento row */}
      <div className="ip-bento-grid cols-3 mb-4">
        {/* Recent Clients */}
        <div className="ip-bento-span-1">
          <BentoCard
            title="Recent Clients"
            icon="bi-people-fill"
            iconColor="var(--ip-success)"
            linkTo="/staff/customers"
            linkLabel="View all"
          >
            {loading ? (
              <div className="d-flex flex-column gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="placeholder-glow d-flex align-items-center gap-3 p-2"
                  >
                    <span
                      className="placeholder rounded-circle"
                      style={{ width: 36, height: 36 }}
                    />
                    <div style={{ flex: 1 }}>
                      <span
                        className="placeholder col-6 d-block mb-1"
                        style={{ height: 12 }}
                      />
                      <span
                        className="placeholder col-9 d-block"
                        style={{ height: 10 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentCustomers.length ? (
              <div className="table-responsive">
                <DataTable
                  compact={true}
                  data={recentCustomers}
                  onRowClick={(c) => navigate(`/staff/customers/${c.customerId}`)}
                  columns={[
                    { header: 'Sr No.', accessor: 'customerId', cell: (_, i) => <span style={{ fontWeight: 600 }}>{i + 1}</span> },
                    { header: 'Name', accessor: 'fullName', cell: (c) => <span style={{ fontWeight: 600 }}>{c.fullName}</span> },
                    { header: 'Email', accessor: 'email', cell: (c) => <span style={{ color: 'var(--ip-text-muted)' }}>{c.email}</span> }
                  ]}
                  emptyIcon="bi-people"
                  emptyMessage={EMPTY_STATES.NO_CUSTOMERS}
                />
              </div>
            ) : (
              <EmptyState
                icon="bi-people"
                message={EMPTY_STATES.NO_CUSTOMERS}
              />
            )}
          </BentoCard>
        </div>

        {/* Recent Policies */}
        <div className="ip-bento-span-2">
          <BentoCard
            title="Recent Policies"
            icon="bi-file-earmark-text"
            iconColor="var(--ip-brand)"
            linkTo="/staff/policies"
            linkLabel="View all"
          >
            {loading ? (
              <div className="placeholder-glow">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="placeholder col-12 d-block mb-2"
                    style={{ height: 36, borderRadius: 8 }}
                  />
                ))}
              </div>
            ) : recentPolicies.length ? (
              <div className="table-responsive">
                <DataTable
                  compact={true}
                  data={recentPolicies}
                  onRowClick={(p) => navigate(`/staff/policies/${p.policyId || p.id}`)}
                  columns={[
                    { header: 'Sr No.', accessor: 'policyId', cell: (_, i) => <span style={{ fontWeight: 600 }}>{i + 1}</span> },
                    { header: 'Customer', accessor: 'customerName', cell: (p) => p.customerName || "Customer" },
                    { header: 'Product', accessor: 'productName', cell: (p) => <span style={{ color: 'var(--ip-text-muted)' }}>{p.productName || "Standard Plan"}</span> },
                    { header: 'Premium', accessor: 'calculatedPremium', cell: (p) => <span style={{ fontWeight: 600 }}>{formatINR(p.calculatedPremium || p.premium)}</span> },
                    { header: 'Status', accessor: 'policyStatus', cell: (p) => <StatusBadge status={p.policyStatus || p.status} /> },
                    { header: 'Start Date', accessor: 'startDate', cell: (p) => <span style={{ color: 'var(--ip-text-muted)' }}>{p.startDate || "-"}</span> }
                  ]}
                  emptyIcon="bi-file-earmark-x"
                  emptyMessage={EMPTY_STATES.NO_RECENT_POLICIES}
                />
              </div>
            ) : (
              <EmptyState
                icon="bi-file-earmark-x"
                message={EMPTY_STATES.NO_RECENT_POLICIES}
              />
            )}
          </BentoCard>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
