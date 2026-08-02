import { useState, useEffect } from 'react';
import { getAdminStats } from '../../services/dashboardService';
import useAuth from '../../hooks/useAuth';
import { EMPTY_STATES } from '../../utils/labels';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState  from '../../components/ui/EmptyState';
import ErrorAlert  from '../../components/ui/ErrorAlert';
import PageHeader  from '../../components/common/PageHeader';
import BentoCard   from '../../common/BentoCard';
import DataTable   from '../../components/tables/DataTable';
import StatTile    from '../../components/dashboard/StatTile';
import QuickAction from '../../components/dashboard/QuickAction';
import { formatINR } from '../../utils/formatters';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setError('Could not load dashboard stats. Check your API connection.'))
      .finally(() => setLoading(false));
  }, []);

  const s = stats ?? {};

  const STATS = [
    { icon: 'bi-people-fill',        label: 'Total Customers',   value: s.totalCustomers, color: 'var(--ip-brand)' },
    { icon: 'bi-shield-fill-check',  label: 'Active Plans',      value: s.activePolicies, color: 'var(--ip-success)' },
    { icon: 'bi-shield-exclamation', label: 'Submitted Claims',  value: s.claims?.pendingClaims, color: 'var(--ip-warning)' },
    { icon: 'bi-shield-fill-x',      label: 'Reviewed Claims',   value: s.claims?.reviewedClaims, color: 'var(--ip-text-muted)' },
    { icon: 'bi-person-badge-fill',  label: 'Active Users',      value: s.activeUsers,   color: 'var(--ip-info)' },
    { icon: 'bi-box-seam-fill',      label: 'Products',          value: s.totalProducts, color: 'var(--ip-accent-orange, #f05a28)' },
  ];

  const QUICK_ACTIONS = [
    { icon: 'bi-person-plus',       label: 'New Staff',   to: '/admin/users/create',    color: 'var(--ip-brand)' },
    { icon: 'bi-box-seam',          label: 'New Product', to: '/admin/products/create', color: 'var(--ip-accent-orange, #f05a28)' },
    { icon: 'bi-layers',            label: 'New Plan',    to: '/admin/plans/create',    color: 'var(--ip-success)' },
    { icon: 'bi-file-earmark-plus', label: 'Issue Policy',to: '/admin/policies/issue',  color: 'var(--ip-brand, #a855f7)' },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name ?? 'Admin'} 👋`}
        action={
          <span style={{ fontSize: '0.8rem', color: 'var(--ip-text-muted)' }}>
            <i className="bi bi-calendar3 me-1" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        }
      />

      <ErrorAlert message={error} />

      {/* Stat tiles */}
      <div className="ip-bento-grid cols-3 mb-4">
        {STATS.map(card => (
          <StatTile key={card.label} {...card} />
        ))}
      </div>

      {/* Bentogrid middle section */}
      <div className="ip-bento-grid cols-3 mb-4">
        {/* Quick Actions */}
        <div className="ip-bento-span-1">
          <BentoCard title="Quick Actions" icon="bi-lightning-charge-fill" iconColor="var(--ip-warning)">
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
          <BentoCard title="Recent Claims" icon="bi-shield-exclamation" iconColor="var(--ip-accent-orange, #f05a28)" linkTo="/admin/claims" linkLabel="View all">
            {loading ? (
              <div className="d-flex flex-column gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="placeholder-glow d-flex align-items-center gap-3 p-2">
                    <span className="placeholder rounded-circle" style={{ width: 36, height: 36 }} />
                    <div style={{ flex: 1 }}>
                      <span className="placeholder col-5 d-block mb-1" style={{ height: 12 }} />
                      <span className="placeholder col-8 d-block" style={{ height: 10 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : s.recentClaims?.length ? (
              <div className="table-responsive">
                <DataTable 
                  compact={true}
                  data={s.recentClaims ?? []}
                  columns={[
                    { header: 'Sr No.', accessor: 'id', cell: (_, i) => <span style={{ fontWeight: 600 }}>{i + 1}</span> },
                    { header: 'Customer', accessor: 'customerName' },
                    { header: 'Policy Number', accessor: 'policyNumber', cell: (c) => <span style={{ color: 'var(--ip-text-muted)' }}>{c.policyNumber}</span> },
                    { header: 'Amount', accessor: 'claimAmount', cell: (c) => <span style={{ fontWeight: 600 }}>₹{Number(c.claimAmount).toLocaleString('en-IN')}</span> },
                    { header: 'Status', accessor: 'status', cell: (c) => <StatusBadge status={c.status} /> }
                  ]}
                  emptyMessage={EMPTY_STATES.NO_RECENT_CLAIMS}
                />
              </div>
            ) : (
              <EmptyState icon="bi-shield-slash" message={EMPTY_STATES.NO_RECENT_CLAIMS} />
            )}
          </BentoCard>
        </div>
      </div>

      {/* Recent Policies - full width */}
      <BentoCard title="Recent Policies" icon="bi-file-earmark-text" iconColor="var(--ip-brand)" linkTo="/admin/policies" linkLabel="View all">
        {loading ? (
          <div className="placeholder-glow">
            {[1, 2, 3].map(i => (
              <span key={i} className="placeholder col-12 d-block mb-2" style={{ height: 36, borderRadius: 8 }} />
            ))}
          </div>
        ) : s.recentPolicies?.length ? (
          <div className="table-responsive">
            <DataTable 
              compact={true}
              data={s.recentPolicies}
              columns={[
                { header: 'Sr No.', accessor: 'id', cell: (_, i) => <span style={{ fontWeight: 600 }}>{i + 1}</span> },
                { header: 'Customer', accessor: 'customerName' },
                { header: 'Product', accessor: 'productName', cell: (p) => <span style={{ color: 'var(--ip-text-muted)' }}>{p.productName}</span> },
                { header: 'Premium', accessor: 'premium', cell: (p) => <span style={{ fontWeight: 600 }}>{formatINR(p.premium)}</span> },
                { header: 'Status', accessor: 'status', cell: (p) => <StatusBadge status={p.status} /> },
                { header: 'Start Date', accessor: 'startDate', cell: (p) => <span style={{ color: 'var(--ip-text-muted)' }}>{p.startDate}</span> }
              ]}
              emptyMessage={EMPTY_STATES.NO_RECENT_POLICIES}
            />
          </div>
        ) : (
          <EmptyState icon="bi-file-earmark-x" message={EMPTY_STATES.NO_RECENT_POLICIES} />
        )}
      </BentoCard>
    </div>
  );
};

export default AdminDashboard;
