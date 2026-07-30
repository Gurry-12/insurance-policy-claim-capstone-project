import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import PricingRulePanel from '../../../components/admin/PricingRulePanel';
import CoverageOptionsManager from '../../../components/admin/CoverageOptionsManager';
import { getPlanById, activatePlan, deactivatePlan } from '../../../services/planService';
import toast from 'react-hot-toast';

const PlanDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPlanData = (planId) => {
    setLoading(true);
    setError('');
    getPlanById(planId)
      .then((data) => {
        if (!data) {
          setError('Could not load plan details.');
        } else {
          setPlan(data);
        }
      })
      .catch((err) => {
        console.error('Plan fetch error:', err);
        setError(err.message || 'Could not load plan details.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlanData(id);
  }, [id]);

  const handleStatusToggle = () => {
    const isActive = plan?.isActive ?? plan?.active;
    const action = isActive ? deactivatePlan(id) : activatePlan(id);

    setActionLoading(true);
    setStatusModalOpen(false);

    action
      .then(() => {
        toast.success(`Plan ${isActive ? 'deactivated' : 'activated'} successfully!`);
        fetchPlanData(id);
      })
      .catch((err) => {
        toast.error(err.message || `Failed to ${isActive ? 'deactivate' : 'activate'} plan.`);
      })
      .finally(() => setActionLoading(false));
  };

  if (loading) return <LoadingSpinner text="Loading plan details..." />;
  if (error || !plan)
    return (
      <div>
        <PageHeader title="Plan Details" subtitle="Viewing plan" onBack={() => navigate('/admin/plans')} />
        <ErrorAlert message={error || 'Plan not found.'} />
      </div>
    );

  const status = (plan.isActive ?? plan.active) ? 'Active' : 'Inactive';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <PageHeader
        title="Plan Details"
        subtitle={plan.planName}
        onBack={() => navigate('/admin/plans')}
        action={
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
              style={{ borderRadius: '8px' }}
              onClick={() => navigate(`/admin/plans/edit/${id}`)}
            >
              <i className="bi bi-pencil-square"></i>
              Edit Plan
            </button>
            <button
              className={`btn ${(plan.isActive ?? plan.active) ? 'btn-outline-warning' : 'btn-outline-success'} d-inline-flex align-items-center gap-2`}
              style={{ borderRadius: '8px' }}
              onClick={() => setStatusModalOpen(true)}
              disabled={actionLoading}
            >
              {(plan.isActive ?? plan.active) ? (
                <><i className="bi bi-dash-circle"></i> Deactivate</>
              ) : (
                <><i className="bi bi-check-circle"></i> Activate</>
              )}
            </button>
          </div>
        }
      />

      {/* Current Active Configuration Banner */}
      <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)', background: 'linear-gradient(135deg, var(--ip-brand) 0%, #764ba2 100%)' }}>
        <div className="card-body p-4 text-white">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-bold mb-1 opacity-75">Current Active Configuration</h6>
              <h4 className="fw-bold mb-0">{plan.planName}</h4>
              <small className="opacity-75">
                Product: <Link to={`/admin/products/${plan.productId}`} className="text-white text-decoration-underline">{plan.productName}</Link>
              </small>
            </div>
            <div className="text-end">
              <StatusBadge status={status} />
              <div className="mt-2 small opacity-75">
                {plan.coverageOptions?.length || 0} Coverage Tiers • {plan.allowedDurations?.length || 0} Duration Options
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Basic Info + Terms */}
        <div className="col-lg-5">
          {/* Basic Information Card */}
          <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-info-circle me-2 text-primary" />
                Basic Information
              </h6>
              <div className="mb-3">
                <small className="text-muted d-block fw-bold mb-1">Plan Name</small>
                <div className="fw-semibold">{plan.planName}</div>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block fw-bold mb-1">Product</small>
                <div className="fw-semibold text-primary">{plan.productName}</div>
              </div>
              <div>
                <small className="text-muted d-block fw-bold mb-1">Status</small>
                <StatusBadge status={status} />
              </div>
            </div>
          </div>

          {/* Terms & Conditions Card */}
          <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-file-text me-2 text-primary" />
                Terms & Conditions
              </h6>
              <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--ip-surface-raised)', borderLeft: '4px solid var(--ip-brand)' }}>
                <p className="mb-0 text-secondary small" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {plan.termsAndConditions || 'No terms and conditions configured.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Coverage + Pricing */}
        <div className="col-lg-7">
          {/* Coverage Options Manager (Add, Edit, Enable/Disable) */}
          <CoverageOptionsManager
            planId={id}
            existingOptions={plan.coverageOptions}
            onUpdate={() => fetchPlanData(id)}
          />

          {/* Plan Rules Summary Card (Premium Type & Durations) */}
          <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-gear me-2 text-primary" />
                Plan Rules Summary
              </h6>
              <div className="row g-3">
                <div className="col-6">
                  <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--ip-surface-raised)' }}>
                    <small className="text-muted d-block fw-bold mb-1">Premium Type</small>
                    <div className="fw-semibold text-primary small">
                      {plan.supportedPremiumType
                        ? plan.supportedPremiumType.replace('_', ' ')
                        : plan.supportedPremiumTypes?.length > 0
                          ? plan.supportedPremiumTypes.join(', ')
                          : 'Not configured'}
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--ip-surface-raised)' }}>
                    <small className="text-muted d-block fw-bold mb-1">Durations</small>
                    <div className="fw-semibold text-success small">
                      {plan.allowedDurations?.length > 0
                        ? plan.allowedDurations.join(', ') + ' Years'
                        : 'Not configured'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Rule Panel — create / activate / history */}
          <PricingRulePanel planId={id} />
        </div>
      </div>

      <ConfirmModal
        isOpen={statusModalOpen}
        title={(plan.isActive ?? plan.active) ? 'Deactivate Plan' : 'Activate Plan'}
        message={
          (plan.isActive ?? plan.active)
            ? 'Are you sure you want to deactivate this plan? This will make the plan unavailable for customers.'
            : 'Are you sure you want to activate this plan?'
        }
        isDanger={(plan.isActive ?? plan.active)}
        confirmText={(plan.isActive ?? plan.active) ? 'Deactivate' : 'Activate'}
        onCancel={() => setStatusModalOpen(false)}
        onConfirm={handleStatusToggle}
      />
    </div>
  );
};

export default PlanDetailPage;
