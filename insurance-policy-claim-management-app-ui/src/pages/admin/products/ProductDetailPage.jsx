import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { getProductById, activateProduct, deactivateProduct } from '../../../services/productService';
import toast from 'react-hot-toast';
import { getPlansByProduct } from '../../../services/planService';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProductData = (id) => {
     
    setLoading(true);
    setError('');
    Promise.all([
      getProductById(id).catch((err) => {
        console.error("Product load failed:", err);
        return null;
      }),
      getPlansByProduct(id).catch((err) => {
        console.error("Plans under product load failed:", err);
        return [];
      })
    ])
      .then(([productData, plansData]) => {
        if (!productData) {
          setError("Could not load product details.");
        } else {
          setProduct(productData);
          setPlans(plansData?.data || plansData || []);
        }
      })
      .catch((err) => setError(err.message || 'Error loading data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProductData(id);
  }, [id]);

  const handleStatusToggle = () => {
    const isActive = (product?.active ?? product?.isActive);
    const action = isActive ? deactivateProduct(id) : activateProduct(id);
    
    setActionLoading(true);
    setStatusModalOpen(false);
    
    action
      .then(() => {
        toast.success(`Product ${isActive ? 'deactivated' : 'activated'} successfully!`);
        setStatusModalOpen(false);
        fetchProductData(id);
      })
      .catch((err) => {
        toast.error(err.message || `Failed to ${isActive ? 'deactivate' : 'activate'} product.`);
      })
      .finally(() => {
        setActionLoading(false);
      });
  };

  if (loading) {
    return <LoadingSpinner text="Loading product details..." />;
  }

  if (error || !product) {
    return (
      <div>
        <PageHeader 
          title="Product Details" 
          subtitle="Viewing product"
          onBack={() => navigate('/admin/products')}
        />
        <ErrorAlert message={error || 'Product not found.'} />
      </div>
    );
  }

  const name = product.productName || 'N/A';
  const category = product.productType || 'N/A';
  const description = product.description || product.productDescription || 'No description provided.';
  const status = (product.active ?? product.isActive) ? 'Active' : 'InActive';
  const createdDate = product.createdDate?.split('T')[0] || 'N/A';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <PageHeader 
        title="Product Details" 
        subtitle={`Viewing details for ${name}`}
        onBack={() => navigate('/admin/products')}
        action={
          <div className="d-flex gap-2">
            {status === 'Active' ? (
              <button 
                className="btn btn-outline-warning d-inline-flex align-items-center gap-2" 
                style={{ borderRadius: '8px' }}
                onClick={() => setStatusModalOpen(true)}
                disabled={actionLoading}
              >
                <i className="bi bi-dash-circle"></i>
                Deactivate
              </button>
            ) : (
              <button 
                className="btn btn-outline-success d-inline-flex align-items-center gap-2" 
                style={{ borderRadius: '8px' }}
                onClick={() => setStatusModalOpen(true)}
                disabled={actionLoading}
              >
                <i className="bi bi-check-circle"></i>
                Activate
              </button>
            )}
            <button 
              className="btn btn-primary d-inline-flex align-items-center gap-2" 
              style={{ borderRadius: '8px' }}
              onClick={() => navigate(`/admin/products/edit/${id}`)}
              disabled={actionLoading}
            >
              <i className="bi bi-pencil-square"></i>
              Edit Product
            </button>
          </div>
        }
      />

      <div className="row g-4">
        {/* Left Side: Summary Card */}
        <div className="col-lg-4">
          <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4 text-center">
              <div className="mb-3 d-flex justify-content-center">
                <div style={{
                  width: 64, height: 64, borderRadius: 14, backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem'
                }}>
                  <i className="bi bi-box-seam"></i>
                </div>
              </div>
              <h5 className="fw-bold mb-1">{name}</h5>
              <p className="text-muted mb-3">{category}</p>
              <div className="d-flex justify-content-center gap-2 mb-2">
                <StatusBadge status={status} />
              </div>
              <small className="text-muted">Created: {createdDate}</small>
            </div>
          </div>

          <div className="card border-0" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">Product Summary</h6>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Category:</span>
                <span className="fw-medium text-capitalize">{category.toLowerCase()}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Total Plans:</span>
                <span className="fw-medium">{plans.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Description and Plans List */}
        <div className="col-lg-8">
          <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">Description</h6>
              <p className="mb-0" style={{ color: 'var(--ip-text-secondary)', lineHeight: '1.6' }}>
                {description}
              </p>
            </div>
          </div>

          <div className="card border-0" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4">
               <h6 className="fw-bold mb-3">Active Coverage Plans</h6>
              {plans.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-file-earmark-break d-block fs-3 mb-2"></i>
                  No plans configured under this product category yet.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {plans.map((plan, index) => {
                    const getCoverageRange = (p) => {
                      if (!p.coverageOptions || p.coverageOptions.length === 0) return 'No coverage options';
                      const amounts = p.coverageOptions.map(opt => opt.coverageAmount || opt);
                      const min = Math.min(...amounts);
                      const max = Math.max(...amounts);
                      return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
                    };

                    const getDurationRange = (p) => {
                      if (!p.allowedDurations || p.allowedDurations.length === 0) return 'No durations';
                      const min = Math.min(...p.allowedDurations);
                      const max = Math.max(...p.allowedDurations);
                      return min === max ? `${min} year` : `${min} - ${max} years`;
                    };

                    return (
                      <div 
                        key={plan.planId || index} 
                        className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center"
                        style={{ borderBottom: '1px solid var(--ip-border-light)' }}
                      >
                        <div>
                          <h6 className="fw-bold mb-1">
                            <Link to={`/admin/plans/${plan.planId}`} className="text-decoration-none text-dark hover-primary">
                              {plan.planName}
                            </Link>
                          </h6>
                          <span className="text-muted small">Duration: {getDurationRange(plan)}</span>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold text-primary">{getCoverageRange(plan)}</div>
                          <span className="text-muted small">Coverage Range</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={statusModalOpen}
        title={status === 'Active' ? "Deactivate Product" : "Activate Product"}
        message={status === 'Active' 
          ? "Are you sure you want to deactivate this product? This will make the product category unavailable." 
          : "Are you sure you want to activate this product?"}
        isDanger={status === 'Active'}
        confirmText={status === 'Active' ? "Deactivate" : "Activate"}
        onCancel={() => setStatusModalOpen(false)}
        onConfirm={handleStatusToggle}
      />
    </div>
  );
};

export default ProductDetailPage;
